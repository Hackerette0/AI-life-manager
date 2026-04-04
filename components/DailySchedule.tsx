"use client";

import { useState } from "react";
import { DayPlan, Task, DayContext } from "@/lib/types";

interface Props {
  dayPlan:     DayPlan | null;
  tasks:       Task[];
  dayContext:  DayContext | null;
  onGenerate:  () => void;
  loading:     boolean;
  streamText?: string;
}

const blockStyle: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  task:     { bg: "bg-secondary/[0.07]",        border: "border-secondary/20",        icon: "task_alt",           text: "text-secondary"      },
  meal:     { bg: "bg-amber-500/[0.07]",         border: "border-amber-500/20",        icon: "restaurant",         text: "text-amber-400"      },
  exercise: { bg: "bg-green-500/[0.07]",         border: "border-green-500/20",        icon: "directions_run",     text: "text-green-400"      },
  break:    { bg: "bg-tertiary/[0.07]",          border: "border-tertiary/20",         icon: "coffee",             text: "text-tertiary"       },
  rest:     { bg: "bg-white/[0.04]",             border: "border-white/10",            icon: "bedtime",            text: "text-white/50"       },
  focus:    { bg: "bg-secondary/[0.10]",         border: "border-secondary/30",        icon: "center_focus_strong",text: "text-secondary"      },
  habit:    { bg: "bg-tertiary/[0.08]",          border: "border-tertiary/25",         icon: "repeat",             text: "text-tertiary"       },
};

export default function DailySchedule({ dayPlan, tasks, dayContext, onGenerate, loading, streamText }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const isActive = (time: string, duration: number) => {
    const [h, m] = time.split(":").map(Number);
    const start = h * 60 + m;
    return nowMin >= start && nowMin < start + duration;
  };
  const isPast = (time: string, duration: number) => {
    const [h, m] = time.split(":").map(Number);
    return nowMin >= h * 60 + m + duration;
  };

  if (!dayContext) {
    return (
      <div className="glass-card rounded-lg p-8 text-center">
        <span
          className="material-symbols-outlined text-5xl text-white/10 block mb-3"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          calendar_today
        </span>
        <p className="font-label text-[10px] uppercase tracking-widest text-white/25">
          Check in first to generate your AI schedule
        </p>
      </div>
    );
  }

  const pending = tasks.filter((t) => t.status !== "done");

  return (
    <div className="glass-card rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
        <div>
          <h3 className="font-headline text-2xl italic text-white">Daily Flow</h3>
          <p className="font-label text-[9px] uppercase tracking-widest text-white/30">
            {dayPlan
              ? `Generated ${new Date(dayPlan.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "AI-powered energy schedule"}
          </p>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading || pending.length === 0}
          className={`glimmer-btn flex items-center gap-1.5 px-4 py-2.5 rounded-full font-label text-[10px] uppercase tracking-widest font-bold transition-all ${
            loading || pending.length === 0
              ? "bg-white/5 text-white/20 cursor-not-allowed"
              : "bg-gradient-to-r from-primary to-primary-dim text-white shadow-[0_4px_16px_rgba(147,5,0,0.4)] interactive-scale"
          }`}
        >
          <span
            className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {loading ? "refresh" : "auto_fix_high"}
          </span>
          {loading ? "Planning…" : dayPlan ? "Replan" : "Plan My Day"}
        </button>
      </div>

      {/* Streaming progress */}
      {loading && streamText && (
        <div className="p-4 bg-secondary/[0.05] border-b border-secondary/10">
          <p className="font-label text-[9px] uppercase tracking-widest text-secondary/60 mb-2">
            ✦ Claude is thinking…
          </p>
          <p className="text-sm text-white/40 font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
            {streamText}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!dayPlan && !loading && (
        <div className="p-8 text-center space-y-2">
          {pending.length === 0 ? (
            <>
              <span className="material-symbols-outlined text-4xl text-white/10 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                celebration
              </span>
              <p className="font-label text-[10px] uppercase tracking-widest text-white/25">
                Add tasks first, then I&apos;ll plan your day
              </p>
            </>
          ) : (
            <>
              <span
                className="material-symbols-outlined text-4xl text-primary-fixed/30 block mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_fix_high
              </span>
              <p className="font-body text-white/50 text-sm">
                {pending.length} task{pending.length !== 1 ? "s" : ""} ready to schedule
              </p>
              <p className="font-label text-[9px] uppercase tracking-widest text-white/20">
                Prioritised by energy, not just deadlines
              </p>
            </>
          )}
        </div>
      )}

      {/* Schedule */}
      {dayPlan && !loading && (
        <div className="p-5 space-y-4">
          {/* AI summary */}
          {dayPlan.summary && (
            <div className="glass-dark rounded-lg p-4 border border-white/[0.08]">
              <p className="font-editorial text-white/80 italic leading-relaxed">{dayPlan.summary}</p>
            </div>
          )}

          {/* Focus metrics row */}
          {(dayPlan.focusTimeMinutes || dayPlan.deepWorkIndex) && (
            <div className="grid grid-cols-2 gap-3">
              {dayPlan.focusTimeMinutes != null && (
                <div className="glass-dark rounded-lg p-3.5 border border-secondary/15 flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    center_focus_strong
                  </span>
                  <div>
                    <p className="font-headline text-xl font-bold text-secondary">
                      {dayPlan.focusTimeMinutes < 60
                        ? `${dayPlan.focusTimeMinutes}m`
                        : `${Math.floor(dayPlan.focusTimeMinutes / 60)}h${dayPlan.focusTimeMinutes % 60 > 0 ? `${dayPlan.focusTimeMinutes % 60}m` : ""}`}
                    </p>
                    <p className="font-label text-[8px] uppercase tracking-widest text-white/25">Focus Time</p>
                  </div>
                </div>
              )}
              {dayPlan.deepWorkIndex != null && (
                <div className="glass-dark rounded-lg p-3.5 border border-tertiary/15 flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    insights
                  </span>
                  <div>
                    <p className="font-headline text-xl font-bold text-tertiary">{dayPlan.deepWorkIndex}%</p>
                    <p className="font-label text-[8px] uppercase tracking-widest text-white/25">Deep Work</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {dayPlan.tips?.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-label text-[9px] uppercase tracking-widest text-white/25">Tips for today</p>
              {dayPlan.tips.map((tip, i) => (
                <div key={i} className="flex gap-2 text-sm text-white/50">
                  <span className="text-secondary/50 shrink-0">✦</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <p className="font-label text-[9px] uppercase tracking-widest text-white/25">Schedule</p>
            {dayPlan.schedule.map((block, i) => {
              const active = isActive(block.time, block.duration);
              const past   = isPast(block.time, block.duration);
              const s      = blockStyle[block.type] ?? blockStyle.rest;

              return (
                <button
                  key={i}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className={`w-full flex gap-3 p-3.5 rounded-lg border text-left transition-all interactive-scale ${
                    active
                      ? `${s.bg} ${s.border} ring-1 ring-primary-fixed/20 shadow-[0_0_16px_rgba(147,5,0,0.15)]`
                      : past
                      ? "bg-white/[0.02] border-white/[0.05] opacity-40"
                      : `${s.bg} ${s.border}`
                  }`}
                >
                  <div className="text-center w-12 shrink-0">
                    <p className="font-label text-[10px] font-bold text-white/50">{block.time}</p>
                    <p className="font-label text-[8px] text-white/20">{block.duration}m</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`material-symbols-outlined text-base shrink-0 ${s.text}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {s.icon}
                      </span>
                      <p className={`text-sm font-medium leading-snug ${
                        past ? "line-through text-white/25" : "text-white/85"
                      }`}>
                        {block.title}
                      </p>
                      {active && (
                        <span className="ml-auto font-label text-[8px] uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded-full animate-pulse shrink-0">
                          now
                        </span>
                      )}
                    </div>
                    {expanded === i && block.notes && (
                      <p className="text-xs text-white/35 mt-1 pl-6">{block.notes}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="font-label text-[8px] uppercase tracking-widest text-white/15 text-right">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}
    </div>
  );
}
