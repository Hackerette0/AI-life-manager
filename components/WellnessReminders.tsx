"use client";

import { useState, useEffect, useCallback } from "react";
import { WellnessReminder } from "@/lib/types";

interface Props {
  reminders: WellnessReminder[];
  onUpdate: (reminders: WellnessReminder[]) => void;
}

const messages: Record<string, string> = {
  eat:     "Your body needs fuel. Grab something nutritious!",
  move:    "Get the blood flowing — stand up and stretch.",
  water:   "Stay hydrated. Drink a full glass of water now.",
  rest:    "Give your brain a break. Step away for 5 minutes.",
  breathe: "3 deep breaths. In through the nose, out through the mouth.",
};

const icons: Record<string, string> = {
  eat:     "restaurant",
  move:    "directions_run",
  water:   "water_drop",
  rest:    "bedtime",
  breathe: "self_improvement",
};

export default function WellnessReminders({ reminders, onUpdate }: Props) {
  const [alert, setAlert]       = useState<WellnessReminder | null>(null);
  const [expanded, setExpanded] = useState(false);

  const check = useCallback(() => {
    const now = Date.now();
    for (const r of reminders) {
      if (!r.enabled) continue;
      const last = r.lastTriggered ? new Date(r.lastTriggered).getTime() : 0;
      if (now - last >= r.intervalMinutes * 60_000) { setAlert(r); break; }
    }
  }, [reminders]);

  useEffect(() => {
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [check]);

  const dismiss = () => {
    if (!alert) return;
    onUpdate(reminders.map((r) => r.id === alert.id ? { ...r, lastTriggered: new Date().toISOString() } : r));
    setAlert(null);
  };

  const snooze = (minutes: number) => {
    if (!alert) return;
    const until = new Date(Date.now() + minutes * 60_000).toISOString();
    onUpdate(reminders.map((r) => r.id === alert.id ? { ...r, lastTriggered: until } : r));
    setAlert(null);
  };

  const toggle = (id: string) =>
    onUpdate(reminders.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm overflow-hidden">
      {/* Active alert */}
      {alert && (
        <div className="bg-[#FF9500]/5 border-b border-[#FF9500]/15 p-5 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 bg-[#FF9500]/10 rounded-full flex items-center justify-center border border-[#FF9500]/20 shrink-0">
              <span
                className="material-symbols-outlined text-[#FF9500] text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {icons[alert.type] ?? "notifications"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-[#1C1C1E]">{alert.label}</p>
              <p className="text-sm text-[#6C6C70] mt-0.5">{messages[alert.type]}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={dismiss}
                  className="glimmer-btn px-4 py-1.5 bg-tertiary/20 border border-tertiary/30 text-[#FF9500] rounded-full text-[10px] font-semibold uppercase tracking-widest interactive-scale"
                >
                  ✓ Done
                </button>
                {[15, 30].map((m) => (
                  <button
                    key={m}
                    onClick={() => snooze(m)}
                    className="px-4 py-1.5 bg-[#F2F2F7] border border-[#E5E5EA] text-[#6C6C70] rounded-full text-[10px] font-semibold uppercase tracking-widest interactive-scale hover:text-[#3C3C43]"
                  >
                    Snooze {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#F8F8F8] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-[#34C759] text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            notifications_active
          </span>
          <div className="text-left">
            <p className="text-[16px] font-bold text-[#1C1C1E]">Wellness Reminders</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93]">
              {reminders.filter((r) => r.enabled).length} active
            </p>
          </div>
        </div>
        <span
          className={`material-symbols-outlined text-[#AEAEB2] transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
        >
          expand_more
        </span>
      </button>

      {/* Reminder rows */}
      {expanded && (
        <div className="border-t border-[#E5E5EA] divide-y divide-[#F2F2F7] animate-fade-in">
          {reminders.map((r) => {
            const last   = r.lastTriggered ? new Date(r.lastTriggered).getTime() : 0;
            const nextIn = Math.max(0, Math.round((last + r.intervalMinutes * 60_000 - Date.now()) / 60_000));

            return (
              <div
                key={r.id}
                className={`flex items-center gap-4 px-5 py-4 transition-all ${r.enabled ? "" : "opacity-40"}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 ${
                  r.enabled
                    ? "bg-[#34C759]/10 border-[#34C759]/20"
                    : "bg-[#F8F8F8] border-[#E5E5EA]"
                }`}>
                  <span
                    className={`material-symbols-outlined text-lg ${r.enabled ? "text-[#34C759]" : "text-[#8E8E93]"}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {icons[r.type] ?? "notifications"}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C1C1E]">{r.label}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AEAEB2]">
                    Every {r.intervalMinutes}min
                    {r.enabled && (
                      <span className="ml-1 text-[#34C759]">
                        · next in {nextIn < 1 ? "&lt;1" : nextIn}m
                      </span>
                    )}
                  </p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggle(r.id)}
                  aria-checked={r.enabled}
                  role="switch"
                  className={`relative w-10 h-5 rounded-full border transition-all duration-300 shrink-0 ${
                    r.enabled
                      ? "bg-secondary/20 border-[#007AFF]/40"
                      : "bg-[#F8F8F8] border-[#E5E5EA]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
                      r.enabled
                        ? "left-5 bg-secondary shadow-[0_0_8px_rgba(149,187,234,0.5)]"
                        : "left-0.5 bg-white/30"
                    }`}
                    style={{ transform: "none" }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
