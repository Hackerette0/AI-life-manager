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
  task:     { bg: "bg-secondary/[0.07]",        border: "border-[#34C759]/20",        icon: "task_alt",           text: "text-[#34C759]"      },
  meal:     { bg: "bg-amber-500/[0.07]",         border: "border-amber-500/20",        icon: "restaurant",         text: "text-[#FF9500]"      },
  exercise: { bg: "bg-green-500/[0.07]",         border: "border-green-500/20",        icon: "directions_run",     text: "text-[#34C759]"      },
  break:    { bg: "bg-tertiary/[0.07]",          border: "border-[#FF9500]/15",         icon: "coffee",             text: "text-[#FF9500]"       },
  rest:     { bg: "bg-[#F2F2F7]",             border: "border-[#E5E5EA]",            icon: "bedtime",            text: "text-[#6C6C70]"       },
  focus:    { bg: "bg-[#34C759]/10",         border: "border-[#34C759]/25",        icon: "center_focus_strong",text: "text-[#34C759]"      },
  habit:    { bg: "bg-[#FF9500]/5",          border: "border-[#FF9500]/20",         icon: "repeat",             text: "text-[#FF9500]"       },
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
      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm p-8 text-center">
        <span
          className="material-symbols-outlined text-5xl text-[#C6C6C8] block mb-3"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          calendar_today
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">
          Check in first to generate your AI schedule
        </p>
      </div>
    );
  }

  const pending = tasks.filter((t) => t.status !== "done");

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#E5E5EA]">
        <div>
          <h3 className="text-[18px] font-bold text-[#1C1C1E]">Daily Flow</h3>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93]">
            {dayPlan
              ? `Generated ${new Date(dayPlan.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "AI-powered energy schedule"}
          </p>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading || pending.length === 0}
          className={`glimmer-btn flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[10px] font-semibold uppercase tracking-widest font-bold transition-all ${
            loading || pending.length === 0
              ? "bg-[#F8F8F8] text-[#AEAEB2] cursor-not-allowed"
              : "bg-gradient-to-r bg-[#007AFF] from-[#007AFF] to-[#007AFF] text-[#1C1C1E] shadow-[0_4px_16px_rgba(147,5,0,0.4)] interactive-scale"
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
        <div className="p-4 bg-[#34C759]/5 border-b border-[#34C759]/15">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#34C759] mb-2">
            ✦ Claude is thinking…
          </p>
          <p className="text-sm text-[#8E8E93] font-mono whitespace-pre-wrap line-clamp-4 leading-relaxed">
            {streamText}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!dayPlan && !loading && (
        <div className="p-8 text-center space-y-2">
          {pending.length === 0 ? (
            <>
              <span className="material-symbols-outlined text-4xl text-[#C6C6C8] block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                celebration
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">
                Add tasks first, then I&apos;ll plan your day
              </p>
            </>
          ) : (
            <>
              <span
                className="material-symbols-outlined text-4xl text-[#007AFF] block mb-2"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_fix_high
              </span>
              <p className="font-body text-[#6C6C70] text-sm">
                {pending.length} task{pending.length !== 1 ? "s" : ""} ready to schedule
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">
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
            <div className="bg-[#F2F2F7] rounded-xl p-4 border border-[#E5E5EA]">
              <p className="font-editorial text-[#1C1C1E] italic leading-relaxed">{dayPlan.summary}</p>
            </div>
          )}

          {/* Focus metrics row */}
          {(dayPlan.focusTimeMinutes || dayPlan.deepWorkIndex) && (
            <div className="grid grid-cols-2 gap-3">
              {dayPlan.focusTimeMinutes != null && (
                <div className="bg-[#F2F2F7] rounded-xl p-3.5 border border-secondary/15 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#34C759] text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    center_focus_strong
                  </span>
                  <div>
                    <p className="font-headline text-xl font-bold text-[#34C759]">
                      {dayPlan.focusTimeMinutes < 60
                        ? `${dayPlan.focusTimeMinutes}m`
                        : `${Math.floor(dayPlan.focusTimeMinutes / 60)}h${dayPlan.focusTimeMinutes % 60 > 0 ? `${dayPlan.focusTimeMinutes % 60}m` : ""}`}
                    </p>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2]">Focus Time</p>
                  </div>
                </div>
              )}
              {dayPlan.deepWorkIndex != null && (
                <div className="bg-[#F2F2F7] rounded-xl p-3.5 border border-tertiary/15 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#FF9500] text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    insights
                  </span>
                  <div>
                    <p className="font-headline text-xl font-bold text-[#FF9500]">{dayPlan.deepWorkIndex}%</p>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2]">Deep Work</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {dayPlan.tips?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">Tips for today</p>
              {dayPlan.tips.map((tip, i) => (
                <div key={i} className="flex gap-2 text-sm text-[#6C6C70]">
                  <span className="text-[#34C759] shrink-0">✦</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">Schedule</p>
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
                      ? "bg-[#F8F8F8] border-[#F2F2F7] opacity-40"
                      : `${s.bg} ${s.border}`
                  }`}
                >
                  <div className="text-center w-12 shrink-0">
                    <p className="font-label text-[10px] font-bold text-[#6C6C70]">{block.time}</p>
                    <p className="font-label text-[8px] text-[#AEAEB2]">{block.duration}m</p>
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
                        past ? "line-through text-[#AEAEB2]" : "text-white/85"
                      }`}>
                        {block.title}
                      </p>
                      {active && (
                        <span className="ml-auto text-[9px] font-semibold uppercase tracking-widest bg-primary text-[#1C1C1E] px-2 py-0.5 rounded-full animate-pulse shrink-0">
                          now
                        </span>
                      )}
                    </div>
                    {expanded === i && block.notes && (
                      <p className="text-xs text-[#8E8E93] mt-1 pl-6">{block.notes}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[9px] font-semibold uppercase tracking-widest text-white/15 text-right">
            {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      )}
    </div>
  );
}
