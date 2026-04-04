import {
  AppState, Task, WellnessReminder, Habit, FocusSession,
  HabitLog, Note, Integration, CalendarReminder, IntegrationType,
} from "./types";

const STORAGE_KEY = "sanctuary_v3";

// ── Defaults ─────────────────────────────────────────────────────────────────

const defaultReminders: WellnessReminder[] = [
  { id: "eat",     type: "eat",     label: "Time to eat",    icon: "🍽️", intervalMinutes: 180, enabled: true },
  { id: "move",    type: "move",    label: "Move your body", icon: "🏃", intervalMinutes: 60,  enabled: true },
  { id: "water",   type: "water",   label: "Drink water",    icon: "💧", intervalMinutes: 45,  enabled: true },
  { id: "rest",    type: "rest",    label: "Take a break",   icon: "😮‍💨", intervalMinutes: 90,  enabled: true },
  { id: "breathe", type: "breathe", label: "Deep breath",    icon: "🧘", intervalMinutes: 120, enabled: true },
];

const defaultHabits: Habit[] = [
  { id: "habit-meditation", title: "Morning Meditation", description: "Start the day with a clear mind", frequency: "daily", targetMinutes: 10, category: "mindfulness", energyRequired: "low",  logs: [], createdAt: new Date().toISOString() },
  { id: "habit-exercise",   title: "Exercise",           description: "Get your body moving",           frequency: "daily", targetMinutes: 30, category: "health",      energyRequired: "high", logs: [], createdAt: new Date().toISOString() },
  { id: "habit-read",       title: "Read",               description: "30 minutes of learning",         frequency: "daily", targetMinutes: 30, category: "learning",    energyRequired: "low",  logs: [], createdAt: new Date().toISOString() },
];

const defaultIntegrations: Integration[] = [
  { id: "google_calendar", connected: false, config: {} },
  { id: "notion",          connected: false, config: {} },
  { id: "github",          connected: false, config: {} },
  { id: "excel",           connected: false, config: {} },
  { id: "linkedin",        connected: false, config: {} },
];

const defaultState: AppState = {
  dayContext: null,
  tasks: [],
  dayPlan: null,
  reminders: defaultReminders,
  habits: defaultHabits,
  focusSessions: [],
  calendarEvents: [],
  calendarReminders: [],
  notes: [],
  integrations: defaultIntegrations,
  lastUpdated: new Date().toISOString(),
};

// ── Load / Save ───────────────────────────────────────────────────────────────

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as AppState;
    const lastDate = parsed.lastUpdated ? new Date(parsed.lastUpdated).toDateString() : null;
    const today = new Date().toDateString();

    if (lastDate !== today) {
      return {
        ...defaultState,
        tasks: parsed.tasks.filter((t) => t.status !== "done"),
        reminders: parsed.reminders ?? defaultReminders,
        habits: parsed.habits ?? defaultHabits,
        calendarEvents: parsed.calendarEvents ?? [],
        calendarReminders: parsed.calendarReminders ?? [],
        notes: parsed.notes ?? [],
        integrations: parsed.integrations ?? defaultIntegrations,
        focusSessions: [],
        dayContext: null,
        dayPlan: null,
        lastUpdated: new Date().toISOString(),
      };
    }
    return {
      ...defaultState,
      ...parsed,
      habits: parsed.habits ?? defaultHabits,
      focusSessions: parsed.focusSessions ?? [],
      calendarEvents: parsed.calendarEvents ?? [],
      calendarReminders: parsed.calendarReminders ?? [],
      notes: parsed.notes ?? [],
      integrations: parsed.integrations ?? defaultIntegrations,
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastUpdated: new Date().toISOString() }));
  } catch { /* ignore */ }
}

// ── ID helpers ────────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Task helpers ──────────────────────────────────────────────────────────────

export function createTask(partial: Omit<Task, "id" | "createdAt" | "status">): Task {
  return { ...partial, id: generateId(), status: "pending", createdAt: new Date().toISOString() };
}

// ── Habit helpers ─────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createHabit(partial: Omit<Habit, "id" | "createdAt" | "logs">): Habit {
  return { ...partial, id: generateId(), logs: [], createdAt: new Date().toISOString() };
}

export function isHabitDueToday(habit: Habit): boolean {
  const day = new Date().getDay();
  if (habit.frequency === "daily")    return true;
  if (habit.frequency === "weekdays") return day >= 1 && day <= 5;
  if (habit.frequency === "weekends") return day === 0 || day === 6;
  const created = new Date(habit.createdAt).getDay();
  return day === created;
}

export function getHabitTodayLog(habit: Habit): HabitLog | undefined {
  return habit.logs.find((l) => l.date === todayStr());
}

export function getHabitStreak(habit: Habit): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const log = habit.logs.find((l) => l.date === dateStr);
    if (log?.completed) { streak++; }
    else if (i > 0)     { break; }
  }
  return streak;
}

export function getHabitWeekLogs(habit: Habit): { date: string; completed: boolean }[] {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    result.push({ date, completed: !!habit.logs.find((l) => l.date === date)?.completed });
  }
  return result;
}

// ── Focus session helpers ─────────────────────────────────────────────────────

export function createFocusSession(partial: Omit<FocusSession, "id" | "startedAt" | "interrupted">): FocusSession {
  return { ...partial, id: generateId(), startedAt: new Date().toISOString(), interrupted: false };
}

export function getTodayFocusMinutes(sessions: FocusSession[]): number {
  const today = todayStr();
  return sessions
    .filter((s) => s.startedAt.slice(0, 10) === today && !s.interrupted && s.completedAt)
    .reduce((sum, s) => sum + (s.actualMinutes ?? s.plannedMinutes), 0);
}

export function getDeepWorkIndex(sessions: FocusSession[], targetMinutes = 240): number {
  return Math.min(100, Math.round((getTodayFocusMinutes(sessions) / targetMinutes) * 100));
}

// ── Note helpers ──────────────────────────────────────────────────────────────

export function createNote(partial: Omit<Note, "id" | "createdAt" | "updatedAt">): Note {
  const now = new Date().toISOString();
  return { ...partial, id: generateId(), createdAt: now, updatedAt: now };
}

// ── Calendar reminder helpers ─────────────────────────────────────────────────

export function createCalendarReminder(partial: Omit<CalendarReminder, "id" | "createdAt">): CalendarReminder {
  return { ...partial, id: generateId(), createdAt: new Date().toISOString() };
}

// ── Integration helpers ───────────────────────────────────────────────────────

export function updateIntegration(
  integrations: Integration[],
  id: IntegrationType,
  patch: Partial<Integration>
): Integration[] {
  return integrations.map((i) => i.id === id ? { ...i, ...patch } : i);
}

// ── Energy helpers ────────────────────────────────────────────────────────────

export function getEnergyLabel(level: number): string {
  if (level <= 2) return "Depleted";
  if (level <= 4) return "Low";
  if (level <= 6) return "Moderate";
  if (level <= 8) return "Good";
  return "Peak";
}

export function getEnergyColor(level: number): string {
  if (level <= 2) return "text-red-500";
  if (level <= 4) return "text-orange-500";
  if (level <= 6) return "text-yellow-500";
  if (level <= 8) return "text-green-500";
  return "text-emerald-500";
}
