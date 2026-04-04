import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { Task, DayContext, Habit, CalendarEvent, FocusSession } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getEnergyLabel(level: number): string {
  if (level <= 2) return "Depleted";
  if (level <= 4) return "Low";
  if (level <= 6) return "Moderate";
  if (level <= 8) return "Good";
  return "Peak";
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function isHabitDueToday(habit: Habit): boolean {
  const day = new Date().getDay();
  if (habit.frequency === "daily") return true;
  if (habit.frequency === "weekdays") return day >= 1 && day <= 5;
  if (habit.frequency === "weekends") return day === 0 || day === 6;
  return true;
}

function getHabitTodayStatus(habit: Habit): boolean {
  return !!habit.logs.find((l) => l.date === todayStr())?.completed;
}

export async function POST(req: NextRequest) {
  const {
    tasks,
    dayContext,
    habits = [],
    calendarEvents = [],
    focusSessions = [],
  }: {
    tasks: Task[];
    dayContext: DayContext;
    habits?: Habit[];
    calendarEvents?: CalendarEvent[];
    focusSessions?: FocusSession[];
  } = await req.json();

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const dueHabits    = habits.filter((h) => isHabitDueToday(h) && !getHabitTodayStatus(h));

  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = calendarEvents.filter((e) => {
    return new Date(e.start).toISOString().slice(0, 10) === today && !e.isAllDay;
  });

  const focusMinutesToday = focusSessions
    .filter((s) => s.startedAt.slice(0, 10) === today && !s.interrupted && s.completedAt)
    .reduce((sum, s) => sum + (s.actualMinutes ?? s.plannedMinutes), 0);

  const taskList = pendingTasks.length > 0
    ? pendingTasks.map((t, i) =>
        `${i + 1}. "${t.title}" — energy: ${t.energyRequired}, priority: ${t.priority}, ~${t.estimatedMinutes}min${t.deadline ? `, due: ${t.deadline}` : ""}${t.description ? `, note: ${t.description}` : ""}`
      ).join("\n")
    : "No pending tasks";

  const habitList = dueHabits.length > 0
    ? dueHabits.map((h) =>
        `• "${h.title}" — ${h.targetMinutes}min, energy: ${h.energyRequired}, category: ${h.category}`
      ).join("\n")
    : "No habits due";

  const calendarList = todayEvents.length > 0
    ? todayEvents
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .map((e) => {
          const start = new Date(e.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
          const end   = new Date(e.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
          return `• "${e.title}" ${start}–${end}`;
        }).join("\n")
    : "No calendar events";

  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  const prompt = `You are an elite AI life manager — like Reclaim.ai but smarter and more human. You build energy-optimised daily schedules that balance deep work, habits, recovery and real life.

USER STATE RIGHT NOW:
- Energy: ${dayContext.energyLevel}/10 (${getEnergyLabel(dayContext.energyLevel)})
- Mood: ${dayContext.mood}
- Sleep last night: ${dayContext.sleepHours}h
- Notes: ${dayContext.notes || "none"}
- Focus time completed today: ${focusMinutesToday}min

TASKS TO SCHEDULE:
${taskList}

HABITS TO FIT IN TODAY:
${habitList}

EXISTING CALENDAR BLOCKS (do NOT schedule over these):
${calendarList}

Current time: ${now}

SCHEDULING PRINCIPLES (follow these strictly):
1. Energy curve: morning peak → post-lunch dip (~13:00–14:30) → afternoon recovery → evening wind-down
2. Schedule high-energy tasks during peak windows; low-energy tasks during dips
3. ALWAYS include: lunch (~30min), 2+ short breaks (10–15min), a wind-down block at end
4. Protect focus windows — batch similar work, minimise context switching
5. Leave 10–15min buffer gaps between intense blocks
6. Respect calendar events (don't overlap them)
7. If energy ≤ 4: prioritise rest and only easy tasks — don't over-schedule
8. Habits should be scheduled at natural times (exercise → morning/evening, meditation → morning, reading → evening)
9. Aim for 3–4h of real focus time for high-energy days
10. Suggest the hardest tasks at peak energy, creative tasks mid-morning, admin tasks in energy dips

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "summary": "Warm 1–2 sentence personalised overview of the plan and energy strategy",
  "tips": ["energy/mood specific tip 1", "tip 2", "tip 3"],
  "focusTimeMinutes": <total planned focus/task minutes as number>,
  "deepWorkIndex": <focusTimeMinutes/240*100 capped at 100>,
  "schedule": [
    {
      "time": "HH:MM",
      "title": "Block title",
      "duration": <minutes as number>,
      "type": "task|break|meal|exercise|rest|focus|habit",
      "notes": "Why this is scheduled here (energy reason, not obvious)"
    }
  ]
}

Schedule from ${now} until ~21:00. Use 24-hour HH:MM format. Make it human and achievable, not robotic.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const event of messageStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
