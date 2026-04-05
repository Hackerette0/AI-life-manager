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
import JournalPage        from "@/components/JournalPage";
import {
  AppState, DayContext, DayPlan, Task, WellnessReminder,
  Habit, FocusSession, CalendarEvent, CalendarReminder,
  Note, Integration,
} from "@/lib/types";
import {
  loadState, saveState, getTodayFocusMinutes,
  getDeepWorkIndex, getHabitStreak,
} from "@/lib/storage";

type Tab = "vibe" | "planner" | "focus" | "habits" | "notes" | "journal" | "connect";

export default function Home() {
  const [state, setState]             = useState<AppState | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [streamText, setStreamText]   = useState("");
  const [activeTab, setActiveTab]     = useState<Tab>("vibe");
  const [sideOpen, setSideOpen]       = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-[#F2F2F7]">
      <span className="material-symbols-outlined text-[#007AFF] text-5xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
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
    { id: "journal", icon: "menu_book",           label: "Journal" },
    { id: "connect", icon: "hub",                 label: "Connect" },
  ];

  const activeTabLabel = tabs.find((t) => t.id === activeTab)?.label ?? "";

  return (
    <>
      {/* Side overlay */}
      {sideOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* Side panel */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl transition-transform duration-300 ease-out ${sideOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="pt-16 px-3 pb-8 flex flex-col h-full">
          <div className="px-3 mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#AEAEB2]">Navigation</p>
          </div>
          <nav className="flex flex-col gap-0.5 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSideOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  activeTab === tab.id
                    ? "bg-[#007AFF]/10 text-[#007AFF]"
                    : "text-[#3C3C43] hover:bg-[#F2F2F7]"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 300" }}>
                  {tab.icon}
                </span>
                <span className="text-[15px] font-medium">{tab.label}</span>
                {activeTab === tab.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#007AFF]" />}
              </button>
            ))}
          </nav>
          <div className="border-t border-[#E5E5EA] pt-4 px-3">
            <p className="text-[9px] uppercase tracking-widest text-[#C6C6C8] font-medium">le plan · 2026</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-30 glass-nav border-b border-[#E5E5EA] flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSideOpen(!sideOpen)}
            className="p-2 rounded-xl hover:bg-[#F2F2F7] transition-all interactive-scale"
          >
            <span className="material-symbols-outlined text-[#3C3C43] text-[20px]" style={{ fontVariationSettings: "'wght' 300" }}>menu</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#007AFF] flex items-center justify-center text-white font-bold text-xs shrink-0">✦</div>
            <div>
              <h1 className="text-[16px] font-bold text-[#007AFF] leading-none" style={{ fontStyle: "italic", letterSpacing: "-0.02em" }}>
                le plan
              </h1>
              <TypewriterSubtitle />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {focusMins > 0 && (
            <div className="flex items-center gap-1.5 bg-[#E3F0FF] border border-[#007AFF]/15 px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[#007AFF] text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>center_focus_strong</span>
              <span className="text-[10px] font-semibold text-[#007AFF]">{focusMins}m</span>
            </div>
          )}
          {state.notes.length > 0 && (
            <button onClick={() => setActiveTab("notes")} className="flex items-center gap-1.5 bg-[#F2F2F7] border border-[#E5E5EA] px-2.5 py-1 rounded-full interactive-scale">
              <span className="material-symbols-outlined text-[#8E8E93] text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
              <span className="text-[10px] font-medium text-[#8E8E93]">{state.notes.length}</span>
            </button>
          )}
          {total > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                <div className="h-full bg-[#007AFF] rounded-full transition-all duration-700" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
              </div>
              <span className="text-[10px] font-medium text-[#8E8E93]">{done}/{total}</span>
            </div>
          )}
        </div>
      </header>

      {/* Page title bar */}
      <div className="fixed top-[52px] w-full z-20 bg-[#F2F2F7]/90 backdrop-blur-sm border-b border-[#E5E5EA] px-5 py-2">
        <h2 className="text-[13px] font-semibold text-[#1C1C1E]">{activeTabLabel}</h2>
      </div>

      {/* Main */}
      <main className="pt-[92px] pb-10 px-4 md:px-6 max-w-4xl mx-auto space-y-5">

        {activeTab === "vibe" && (
          <div className="space-y-5 animate-fade-in">
            <section className="pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#AEAEB2] mb-1.5">{today}</p>
              <h2 className="text-[42px] font-bold text-[#1C1C1E] leading-tight tracking-tight">
                {greeting},<br /><span className="text-[#007AFF]">Superstar.</span>
              </h2>
              {state.dayContext && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#AEAEB2] mt-2">
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

        {activeTab === "journal" && (
          <div className="animate-fade-in">
            <JournalPage habits={state.habits} onUpdateHabits={handleUpdateHabits} />
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
    const TYPE_SPEED   = 80;
    const DELETE_SPEED = 45;
    const PAUSE_FULL   = 1200;
    const PAUSE_EMPTY  = 300;

    if (!deleting && charIdx < word.length) {
      timeoutRef.current = setTimeout(() => { setDisplay(word.slice(0, charIdx + 1)); setCharIdx((c) => c + 1); }, TYPE_SPEED);
    } else if (!deleting && charIdx === word.length) {
      timeoutRef.current = setTimeout(() => setDeleting(true), PAUSE_FULL);
    } else if (deleting && charIdx > 0) {
      timeoutRef.current = setTimeout(() => { setDisplay(word.slice(0, charIdx - 1)); setCharIdx((c) => c - 1); }, DELETE_SPEED);
    } else if (deleting && charIdx === 0) {
      timeoutRef.current = setTimeout(() => { setDeleting(false); setWordIdx((i) => (i + 1) % WORDS.length); }, PAUSE_EMPTY);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [charIdx, deleting, wordIdx]);

  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#AEAEB2] mt-0.5 h-3 flex items-center">
      {display}<span className="ml-px" style={{ opacity: blink ? 1 : 0, transition: "opacity 0.1s" }}>|</span>
    </p>
  );
}

// ── Me / Analytics ────────────────────────────────────────────────────────────

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
      <div className="flex items-center justify-between">
        <h3 className="text-[22px] font-bold text-[#1C1C1E] tracking-tight">Dashboard</h3>
        <div className="bg-[#007AFF]/10 border border-[#007AFF]/20 px-3 py-1.5 rounded-full text-[10px] font-semibold text-[#007AFF] uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-pulse" />
          {vibe}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: "check_circle", label: "Done",    value: done,    color: "text-[#34C759]" },
          { icon: "pending",      label: "Pending", value: pending, color: "text-[#007AFF]" },
          { icon: "play_circle",  label: "Active",  value: active,  color: "text-[#FF9500]" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm p-4 text-center">
            <span className={`material-symbols-outlined text-2xl ${s.color} mb-1 block`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm p-5 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">Deep Work Today</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-3xl font-bold text-[#007AFF]">{deepWork}%</p><p className="text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2] mt-0.5">Index</p></div>
          <div><p className="text-3xl font-bold text-[#007AFF]">{focusMins < 60 ? `${focusMins}m` : `${Math.floor(focusMins / 60)}h${focusMins % 60 > 0 ? `${focusMins % 60}m` : ""}`}</p><p className="text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2] mt-0.5">Focus</p></div>
          <div><p className="text-3xl font-bold text-[#007AFF]">{sessions}</p><p className="text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2] mt-0.5">Sessions</p></div>
        </div>
        <div className="w-full h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700 bg-[#007AFF]" style={{ width: `${deepWork}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm p-5 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">Habit Progress</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-3xl font-bold text-[#FF9500]">{habitScore}%</p><p className="text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2] mt-0.5">Today</p></div>
          <div><p className="text-3xl font-bold text-[#FF9500]">{doneHabits}/{todayHabits.length}</p><p className="text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2] mt-0.5">Done</p></div>
          <div><p className="text-3xl font-bold text-[#FF9500]">{longestStreak}</p><p className="text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2] mt-0.5">Streak 🔥</p></div>
        </div>
      </div>

      {dayContext && (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2] mb-2">Insight</p>
          <p className="text-[14px] text-[#3C3C43] leading-relaxed">
            {`Running on ${dayContext.energyLevel}/10 energy${dayContext.sleepHours < 6 ? " — low sleep detected" : ""}. ${done > 0 ? `${done} task${done > 1 ? "s" : ""} completed.` : "No tasks done yet — start small."} ${deepWork >= 50 ? "Strong deep work today." : deepWork > 0 ? "Focus time building." : "Start a focus session to build momentum."}`}
          </p>
        </div>
      )}

      <button
        onClick={onPlanDay}
        disabled={planLoading || !dayContext || tasks.filter((t) => t.status !== "done").length === 0}
        className={`w-full py-4 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all ${
          planLoading || !dayContext
            ? "bg-[#F2F2F7] text-[#AEAEB2] cursor-not-allowed border border-[#E5E5EA]"
            : "bg-[#007AFF] text-white shadow-[0_4px_16px_rgba(0,122,255,0.3)] interactive-scale"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span>
        {planLoading ? "Planning…" : "Plan My Day with AI"}
      </button>
    </div>
  );
}
