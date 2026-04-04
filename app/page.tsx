"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import EnergyCheckIn      from "@/components/EnergyCheckIn";
import WellnessReminders  from "@/components/WellnessReminders";
import DragCalendar       from "@/components/DragCalendar";
import TaskManager        from "@/components/TaskManager";
import FocusTimer         from "@/components/FocusTimer";
import HabitsTracker      from "@/components/HabitsTracker";
import NotesPanel         from "@/components/NotesPanel";
import IntegrationsHub    from "@/components/IntegrationsHub";
import {
  AppState, DayContext, DayPlan, Task, WellnessReminder,
  Habit, FocusSession, CalendarEvent, CalendarReminder,
  Note, Integration,
} from "@/lib/types";
import {
  loadState, saveState, getTodayFocusMinutes,
  getDeepWorkIndex, getHabitStreak,
} from "@/lib/storage";

type Tab = "vibe" | "planner" | "focus" | "habits" | "notes" | "connect";

export default function Home() {
  const [state, setState]             = useState<AppState | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [streamText, setStreamText]   = useState("");
  const [activeTab, setActiveTab]     = useState<Tab>("vibe");

  useEffect(() => { setState(loadState()); }, []);
  useEffect(() => { if (state) saveState(state); }, [state]);

  const updateState = useCallback((patch: Partial<AppState>) => {
    setState((prev) => prev ? { ...prev, ...patch } : prev);
  }, []);

  const handleCheckIn         = (d: DayContext)         => updateState({ dayContext: d, dayPlan: null });
  const handleAddTask         = (t: Task)                => setState((p) => p ? { ...p, tasks: [...p.tasks, t] } : p);
  const handleUpdateTask      = (u: Task)                => setState((p) => p ? { ...p, tasks: p.tasks.map((t) => t.id === u.id ? u : t) } : p);
  const handleDeleteTask      = (id: string)             => setState((p) => p ? { ...p, tasks: p.tasks.filter((t) => t.id !== id) } : p);
  const handleUpdateReminders = (r: WellnessReminder[]) => updateState({ reminders: r });
  const handleUpdateHabits    = (h: Habit[])             => updateState({ habits: h });
  const handleUpdateEvents    = (e: CalendarEvent[])     => updateState({ calendarEvents: e });
  const handleUpdateCalRems   = (r: CalendarReminder[])  => updateState({ calendarReminders: r });
  const handleUpdateNotes     = (n: Note[])              => updateState({ notes: n });
  const handleUpdateInteg     = (i: Integration[])       => updateState({ integrations: i });
  const handleSessionComplete = (s: FocusSession)        => setState((p) => p ? { ...p, focusSessions: [...p.focusSessions, s] } : p);

  const handleImportTasks = (imported: Task[]) =>
    setState((p) => p ? { ...p, tasks: [...p.tasks, ...imported] } : p);
  const handleImportNotes = (imported: Note[]) =>
    setState((p) => p ? { ...p, notes: [...p.notes, ...imported] } : p);

  const handlePlanDay = async () => {
    if (!state?.dayContext) return;
    setPlanLoading(true);
    setStreamText("");
    let fullText = "";
    try {
      const res = await fetch("/api/plan-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: state.tasks,
          dayContext: state.dayContext,
          habits: state.habits,
          calendarEvents: state.calendarEvents,
          focusSessions: state.focusSessions,
        }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const p = JSON.parse(line.slice(6).trim());
            if (p.error) throw new Error(p.error);
            if (p.text) { fullText += p.text; setStreamText(fullText); }
          } catch { /* skip */ }
        }
      }
      const match = fullText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");
      updateState({ dayPlan: { ...JSON.parse(match[0]), generatedAt: new Date().toISOString() } as DayPlan });
      setActiveTab("planner");
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan. Make sure ANTHROPIC_API_KEY is set in .env.local");
    } finally {
      setPlanLoading(false);
      setStreamText("");
    }
  };

  if (!state) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="material-symbols-outlined text-primary-fixed text-5xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
    </div>
  );

  const today     = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const done      = state.tasks.filter((t) => t.status === "done").length;
  const total     = state.tasks.length;
  const focusMins = getTodayFocusMinutes(state.focusSessions);
  const deepWork  = getDeepWorkIndex(state.focusSessions);

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "vibe",    icon: "auto_fix_high",       label: "Vibe"    },
    { id: "planner", icon: "calendar_month",      label: "Plan"    },
    { id: "focus",   icon: "center_focus_strong", label: "Focus"   },
    { id: "habits",  icon: "repeat",              label: "Habits"  },
    { id: "notes",   icon: "edit_note",           label: "Notes"   },
    { id: "connect", icon: "hub",                 label: "Connect" },
  ];

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-nav border-b border-white/[0.08] flex justify-between items-center px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white font-bold text-sm shrink-0 border border-white/15">✦</div>
          <div>
            <h1 className="text-lg font-black text-primary-fixed tracking-tight leading-none" style={{ fontFamily: "'Inter', sans-serif", textShadow: "0 2px 10px rgba(255,82,82,0.35)", fontStyle: "italic", textTransform: "lowercase", letterSpacing: "-0.02em" }}>
              le plan
            </h1>
            <TypewriterSubtitle />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {focusMins > 0 && (
            <div className="flex items-center gap-1.5 glass-dark border border-secondary/20 px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-secondary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>center_focus_strong</span>
              <span className="font-label text-[8px] uppercase tracking-widest text-secondary/70">{focusMins}m</span>
            </div>
          )}
          {state.notes.length > 0 && (
            <button onClick={() => setActiveTab("notes")} className="flex items-center gap-1.5 glass-dark border border-white/10 px-3 py-1 rounded-full interactive-scale">
              <span className="material-symbols-outlined text-white/30 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
              <span className="font-label text-[8px] uppercase tracking-widest text-white/30">{state.notes.length}</span>
            </button>
          )}
          {total > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-fixed to-secondary rounded-full transition-all duration-700" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
              </div>
              <span className="font-label text-[9px] text-white/35 uppercase tracking-widest">{done}/{total}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="pt-20 pb-36 px-4 md:px-8 max-w-4xl mx-auto relative z-10 space-y-6">
        {activeTab === "vibe" && (
          <div className="space-y-5 animate-fade-in">
            <section className="pt-5">
              <p className="font-label text-[9px] uppercase tracking-[0.4em] text-white/25 mb-2">{today}</p>
              <h2 className="font-headline text-5xl md:text-6xl text-white italic leading-tight" style={{ textShadow: "0 0 40px rgba(149,187,234,0.12)" }}>
                {greeting},<br /><span className="text-primary-fixed">Superstar.</span>
              </h2>
              {state.dayContext && (
                <p className="font-label text-[9px] uppercase tracking-[0.3em] text-white/25 mt-3">
                  {state.dayContext.mood} · Energy {state.dayContext.energyLevel}/10
                  {deepWork > 0 && ` · Deep Work ${deepWork}%`}
                </p>
              )}
            </section>
            <EnergyCheckIn onCheckIn={handleCheckIn} existing={state.dayContext} />
            <WellnessReminders reminders={state.reminders} onUpdate={handleUpdateReminders} />
          </div>
        )}

        {activeTab === "planner" && (
          <div className="animate-fade-in">
            <DragCalendar
              events={state.calendarEvents}
              reminders={state.calendarReminders}
              dayPlan={state.dayPlan}
              dayContext={state.dayContext}
              onUpdateEvents={handleUpdateEvents}
              onUpdateReminders={handleUpdateCalRems}
              onGeneratePlan={handlePlanDay}
              planLoading={planLoading}
              streamText={streamText}
            />
          </div>
        )}

        {activeTab === "focus" && (
          <div className="space-y-5 animate-fade-in">
            <FocusTimer tasks={state.tasks} focusSessions={state.focusSessions} onSessionComplete={handleSessionComplete} />
            <TaskManager tasks={state.tasks} energyLevel={state.dayContext?.energyLevel} onAdd={handleAddTask} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />
          </div>
        )}

        {activeTab === "habits" && (
          <div className="animate-fade-in">
            <HabitsTracker habits={state.habits} onUpdate={handleUpdateHabits} />
          </div>
        )}

        {activeTab === "notes" && (
          <div className="animate-fade-in">
            <NotesPanel notes={state.notes} onUpdate={handleUpdateNotes} />
          </div>
        )}

        {activeTab === "connect" && (
          <div className="space-y-5 animate-fade-in">
            <IntegrationsHub
              integrations={state.integrations}
              tasks={state.tasks}
              notes={state.notes}
              onUpdateIntegrations={handleUpdateInteg}
              onImportTasks={handleImportTasks}
              onImportNotes={handleImportNotes}
            />
            <MePanel
              tasks={state.tasks}
              dayContext={state.dayContext}
              habits={state.habits}
              focusSessions={state.focusSessions}
              onPlanDay={handlePlanDay}
              planLoading={planLoading}
            />
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-1 pb-8 pt-3 glass-nav border-t border-white/[0.08] z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 interactive-scale transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-br from-primary to-primary-dim text-white rounded-lg px-3.5 py-2 shadow-[0_6px_20px_rgba(147,5,0,0.4)] ring-1 ring-white/20"
                : "text-white/30 hover:text-white/55 px-3.5 py-2"
            }`}
          >
            <span className="material-symbols-outlined text-[19px]" style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}>
              {tab.icon}
            </span>
            <span className="font-label text-[6.5px] uppercase tracking-widest font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

// ── Typewriter subtitle ───────────────────────────────────────────────────────

const WORDS = [
  "organize", "arrange", "work out", "think out", "design",
  "line up", "outline", "sketch out", "map out", "chalk out",
  "draft", "prepare", "schedule", "programme",
];

function TypewriterSubtitle() {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [blink, setBlink] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const word = WORDS[wordIdx];
    const TYPE_SPEED  = 80;
    const DELETE_SPEED = 45;
    const PAUSE_FULL  = 1200;
    const PAUSE_EMPTY = 300;

    if (!deleting && charIdx < word.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplay(word.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      }, TYPE_SPEED);
    } else if (!deleting && charIdx === word.length) {
      timeoutRef.current = setTimeout(() => setDeleting(true), PAUSE_FULL);
    } else if (deleting && charIdx > 0) {
      timeoutRef.current = setTimeout(() => {
        setDisplay(word.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      }, DELETE_SPEED);
    } else if (deleting && charIdx === 0) {
      timeoutRef.current = setTimeout(() => {
        setDeleting(false);
        setWordIdx((i) => (i + 1) % WORDS.length);
      }, PAUSE_EMPTY);
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [charIdx, deleting, wordIdx]);

  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="font-label text-[7px] uppercase tracking-[0.25em] text-white/30 mt-0.5 h-3 flex items-center">
      {display}
      <span className="ml-px" style={{ opacity: blink ? 1 : 0, transition: "opacity 0.1s" }}>|</span>
    </p>
  );
}

// ── Me / Analytics (inside Connect tab) ──────────────────────────────────────

function MePanel({ tasks, dayContext, habits, focusSessions, onPlanDay, planLoading }: {
  tasks: Task[]; dayContext: DayContext | null;
  habits: Habit[]; focusSessions: FocusSession[];
  onPlanDay: () => void; planLoading: boolean;
}) {
  const done    = tasks.filter((t) => t.status === "done").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const active  = tasks.filter((t) => t.status === "in_progress").length;
  const total   = tasks.length;
  const focusMins = getTodayFocusMinutes(focusSessions);
  const deepWork  = getDeepWorkIndex(focusSessions);
  const sessions  = focusSessions.filter((s) => !s.interrupted && s.completedAt).length;

  const today = new Date().toISOString().slice(0, 10);
  const todayHabits = habits.filter((h) => {
    const d = new Date().getDay();
    if (h.frequency === "daily")    return true;
    if (h.frequency === "weekdays") return d >= 1 && d <= 5;
    if (h.frequency === "weekends") return d === 0 || d === 6;
    return true;
  });
  const doneHabits = todayHabits.filter((h) => h.logs.find((l) => l.date === today)?.completed).length;
  const habitScore = todayHabits.length ? Math.round((doneHabits / todayHabits.length) * 100) : 0;
  const longestStreak = habits.reduce((max, h) => Math.max(max, getHabitStreak(h)), 0);
  const score = total ? Math.round((done / total) * 100) : 0;
  const vibe  = score >= 80 ? "Peak Flow" : score >= 50 ? "In Stride" : score >= 20 ? "Building" : "Warming Up";

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-headline text-3xl italic text-white">Dashboard</h3>
        <div className="bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-full font-label text-[9px] text-primary-fixed uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse" />
          {vibe}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "check_circle", label: "Done",    value: done,    color: "text-green-400"     },
          { icon: "pending",      label: "Pending", value: pending, color: "text-primary-fixed" },
          { icon: "play_circle",  label: "Active",  value: active,  color: "text-secondary"     },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-lg p-4 text-center">
            <span className={`material-symbols-outlined text-2xl ${s.color} mb-1 block`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            <p className={`font-headline text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="font-label text-[9px] uppercase tracking-widest text-white/35 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-lg p-5 space-y-3">
        <p className="font-label text-[9px] uppercase tracking-widest text-white/30">Deep Work Today</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="font-headline text-3xl font-bold text-secondary">{deepWork}%</p><p className="font-label text-[8px] uppercase tracking-widest text-white/25 mt-0.5">Index</p></div>
          <div><p className="font-headline text-3xl font-bold text-secondary">{focusMins < 60 ? `${focusMins}m` : `${Math.floor(focusMins / 60)}h${focusMins % 60 > 0 ? `${focusMins % 60}m` : ""}`}</p><p className="font-label text-[8px] uppercase tracking-widest text-white/25 mt-0.5">Focus</p></div>
          <div><p className="font-headline text-3xl font-bold text-secondary">{sessions}</p><p className="font-label text-[8px] uppercase tracking-widest text-white/25 mt-0.5">Sessions</p></div>
        </div>
        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${deepWork}%`, background: "linear-gradient(to right, #95BBEA, #FFF8E7)" }} />
        </div>
      </div>

      <div className="glass-card rounded-lg p-5 space-y-3">
        <p className="font-label text-[9px] uppercase tracking-widest text-white/30">Habit Progress</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="font-headline text-3xl font-bold text-tertiary">{habitScore}%</p><p className="font-label text-[8px] uppercase tracking-widest text-white/25 mt-0.5">Today</p></div>
          <div><p className="font-headline text-3xl font-bold text-tertiary">{doneHabits}/{todayHabits.length}</p><p className="font-label text-[8px] uppercase tracking-widest text-white/25 mt-0.5">Done</p></div>
          <div><p className="font-headline text-3xl font-bold text-amber-400">{longestStreak}</p><p className="font-label text-[8px] uppercase tracking-widest text-white/25 mt-0.5">Streak 🔥</p></div>
        </div>
      </div>

      {dayContext && (
        <div className="glass-card rounded-lg p-5">
          <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-2">Sanctuary Insight</p>
          <p className="font-body text-white/55 leading-relaxed text-sm">
            {`Running on ${dayContext.energyLevel}/10 energy${dayContext.sleepHours < 6 ? " — low sleep detected" : ""}. ${done > 0 ? `${done} task${done > 1 ? "s" : ""} completed.` : "No tasks done yet — start small."} ${deepWork >= 50 ? "Strong deep work today." : deepWork > 0 ? "Focus time building." : "Start a focus session to build momentum."}`}
          </p>
        </div>
      )}

      <button
        onClick={onPlanDay}
        disabled={planLoading || !dayContext || tasks.filter((t) => t.status !== "done").length === 0}
        className={`glimmer-btn w-full py-4 rounded-lg font-label text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2 transition-all ${
          planLoading || !dayContext ? "bg-white/5 text-white/20 cursor-not-allowed" : "bg-gradient-to-r from-primary to-primary-dim text-white shadow-[0_6px_20px_rgba(147,5,0,0.4)] interactive-scale"
        }`}
      >
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span>
        {planLoading ? "Planning…" : "Plan My Day with AI"}
      </button>
    </div>
  );
}
