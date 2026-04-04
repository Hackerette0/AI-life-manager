"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Task, FocusSession } from "@/lib/types";
import { createFocusSession, getTodayFocusMinutes, getDeepWorkIndex } from "@/lib/storage";

interface Props {
  tasks: Task[];
  focusSessions: FocusSession[];
  onSessionComplete: (session: FocusSession) => void;
}

const DURATIONS = [
  { label: "25 min",  value: 25,  icon: "timer",         desc: "Pomodoro" },
  { label: "50 min",  value: 50,  icon: "timer_10_select",desc: "Deep Work" },
  { label: "90 min",  value: 90,  icon: "hourglass_empty",desc: "Flow State" },
];

const TARGET_FOCUS_MINUTES = 240;

function pad(n: number) { return String(n).padStart(2, "0"); }

function formatSeconds(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

function formatMinutes(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ""}`.trim();
}

export default function FocusTimer({ tasks, focusSessions, onSessionComplete }: Props) {
  const [phase, setPhase]           = useState<"idle" | "running" | "paused" | "done">("idle");
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [duration, setDuration]     = useState(25);
  const [timeLeft, setTimeLeft]     = useState(25 * 60);
  const [showCustom, setShowCustom] = useState(false);
  const [customMins, setCustomMins] = useState(45);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const focusMinutes = getTodayFocusMinutes(focusSessions);
  const deepWorkIdx  = getDeepWorkIndex(focusSessions, TARGET_FOCUS_MINUTES);

  // Clean up interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setPhase("done");
        return 0;
      }
      return prev - 1;
    });
  }, []);

  const start = () => {
    setTimeLeft(duration * 60);
    setPhase("running");
    startTimeRef.current = new Date();
    intervalRef.current = setInterval(tick, 1000);
  };

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("paused");
  };

  const resume = () => {
    setPhase("running");
    intervalRef.current = setInterval(tick, 1000);
  };

  const stop = (interrupted = true) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const actualMinutes = interrupted
      ? Math.round((duration * 60 - timeLeft) / 60)
      : duration;
    const task = pendingTasks.find((t) => t.id === selectedTask);
    const session = createFocusSession({
      taskId: selectedTask || undefined,
      taskTitle: task?.title ?? "Free Focus",
      plannedMinutes: duration,
      actualMinutes: actualMinutes > 0 ? actualMinutes : 1,
    });
    const completed = { ...session, interrupted, completedAt: new Date().toISOString() };
    onSessionComplete(completed);
    setPhase("idle");
    setTimeLeft(duration * 60);
    startTimeRef.current = null;
  };

  // When phase becomes "done", auto-complete
  useEffect(() => {
    if (phase === "done") {
      stop(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const selectDuration = (mins: number) => {
    if (phase === "idle") {
      setDuration(mins);
      setTimeLeft(mins * 60);
      setShowCustom(false);
    }
  };

  const progressPct = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const circumference = 2 * Math.PI * 52;

  const taskTitle = pendingTasks.find((t) => t.id === selectedTask)?.title ?? "Free Focus";

  return (
    <div className="glass-card rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary/70 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            center_focus_strong
          </span>
          <div>
            <h3 className="font-headline text-2xl italic text-white">Focus Timer</h3>
            <p className="font-label text-[9px] uppercase tracking-widest text-white/30">
              Protect your deep work
            </p>
          </div>
        </div>
        {/* Deep work index badge */}
        <div className="text-right">
          <p className="font-headline text-2xl font-bold text-secondary">{deepWorkIdx}%</p>
          <p className="font-label text-[8px] uppercase tracking-widest text-white/25">Deep Work</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Deep work progress bar */}
        <div>
          <div className="flex justify-between items-baseline mb-1.5">
            <p className="font-label text-[9px] uppercase tracking-widest text-white/25">
              Daily Focus Goal
            </p>
            <p className="font-label text-[9px] uppercase tracking-widest text-white/35">
              {formatMinutes(focusMinutes)} / {formatMinutes(TARGET_FOCUS_MINUTES)}
            </p>
          </div>
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${deepWorkIdx}%`, background: "linear-gradient(to right, #95BBEA, #FFF8E7)" }}
            />
          </div>
        </div>

        {/* Duration picker */}
        {phase === "idle" && (
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-2">Session type</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => selectDuration(d.value)}
                  className={`py-3 rounded-lg border text-center transition-all interactive-scale ${
                    duration === d.value && !showCustom
                      ? "border-secondary/40 bg-secondary/10 text-white"
                      : "border-white/10 glass-dark text-white/40 hover:border-white/20"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-lg block mb-0.5 ${duration === d.value && !showCustom ? "text-secondary" : "text-white/30"}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {d.icon}
                  </span>
                  <p className="font-label text-[9px] uppercase tracking-widest">{d.label}</p>
                  <p className="font-label text-[7px] text-white/25 mt-0.5">{d.desc}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowCustom(!showCustom); if (!showCustom) { setDuration(customMins); setTimeLeft(customMins * 60); }}}
              className={`w-full py-2 rounded-lg border text-center font-label text-[9px] uppercase tracking-widest transition-all interactive-scale ${
                showCustom
                  ? "border-primary-fixed/30 bg-primary/10 text-primary-fixed"
                  : "border-white/10 glass-dark text-white/30 hover:border-white/20"
              }`}
            >
              Custom duration: {customMins}min
            </button>
            {showCustom && (
              <div className="mt-2">
                <input
                  type="range" min={5} max={180} step={5} value={customMins}
                  onChange={(e) => { const v = Number(e.target.value); setCustomMins(v); setDuration(v); setTimeLeft(v * 60); }}
                  className="w-full"
                  style={{
                    background: `linear-gradient(to right, #ff5252 0%, #ff5252 ${((customMins - 5) / 175) * 100}%, rgba(255,255,255,0.10) ${((customMins - 5) / 175) * 100}%, rgba(255,255,255,0.10) 100%)`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Task selector */}
        {phase === "idle" && (
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-2">Focus on</p>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-secondary/40 transition-all"
            >
              <option value="">Free Focus (no specific task)</option>
              {pendingTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.energyRequired === "high" ? "⚡" : t.energyRequired === "medium" ? "🔋" : "🌙"} {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Timer circle */}
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative w-36 h-36">
            {/* SVG circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={phase === "running" ? "#95BBEA" : phase === "paused" ? "#ff5252" : phase === "done" ? "#4ade80" : "rgba(255,255,255,0.15)"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * progressPct) / 100}
                className="transition-all duration-1000"
              />
            </svg>
            {/* Time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-headline text-3xl font-bold text-white tabular-nums">
                {formatSeconds(timeLeft)}
              </p>
              {phase !== "idle" && (
                <p className="font-label text-[8px] uppercase tracking-widest text-white/25 mt-0.5">
                  {phase === "running" ? "Focus" : phase === "paused" ? "Paused" : "Done!"}
                </p>
              )}
            </div>
          </div>

          {phase !== "idle" && (
            <p className="font-editorial text-white/50 text-sm italic text-center max-w-[200px]">
              {taskTitle}
            </p>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {phase === "idle" && (
              <button
                onClick={start}
                className="glimmer-btn flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-secondary/80 to-secondary text-[#0d1117] font-label text-[10px] uppercase tracking-[0.2em] font-bold shadow-[0_4px_16px_rgba(149,187,234,0.35)] interactive-scale"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                Start Focus
              </button>
            )}
            {phase === "running" && (
              <>
                <button
                  onClick={pause}
                  className="flex items-center gap-2 px-6 py-3 rounded-full glass-dark border border-white/20 text-white/70 font-label text-[10px] uppercase tracking-widest interactive-scale hover:border-white/35"
                >
                  <span className="material-symbols-outlined text-sm">pause</span>
                  Pause
                </button>
                <button
                  onClick={() => stop(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full glass-dark border border-red-400/20 text-red-400/70 font-label text-[10px] uppercase tracking-widest interactive-scale hover:border-red-400/35"
                >
                  <span className="material-symbols-outlined text-sm">stop</span>
                  Stop
                </button>
              </>
            )}
            {phase === "paused" && (
              <>
                <button
                  onClick={resume}
                  className="glimmer-btn flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-secondary/80 to-secondary text-[#0d1117] font-label text-[10px] uppercase tracking-[0.2em] font-bold interactive-scale"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  Resume
                </button>
                <button
                  onClick={() => stop(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full glass-dark border border-red-400/20 text-red-400/70 font-label text-[10px] uppercase tracking-widest interactive-scale"
                >
                  <span className="material-symbols-outlined text-sm">stop</span>
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Today's sessions */}
        {focusSessions.length > 0 && (
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-white/25 mb-2">Today&apos;s Sessions</p>
            <div className="space-y-1.5">
              {[...focusSessions].reverse().slice(0, 5).map((s) => (
                <div key={s.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${
                  s.interrupted
                    ? "bg-white/[0.02] border-white/[0.05]"
                    : "bg-secondary/[0.05] border-secondary/10"
                }`}>
                  <span
                    className={`material-symbols-outlined text-base shrink-0 ${s.interrupted ? "text-white/20" : "text-secondary"}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {s.interrupted ? "cancel" : "check_circle"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 truncate">{s.taskTitle}</p>
                    <p className="font-label text-[8px] text-white/25 uppercase tracking-wider">
                      {s.actualMinutes ?? s.plannedMinutes}min
                      {s.interrupted ? " · interrupted" : ""}
                    </p>
                  </div>
                  <p className="font-label text-[8px] text-white/20 shrink-0">
                    {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
