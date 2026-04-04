"use client";

import { useState, useEffect, useRef } from "react";
import {
  CalendarEvent, CalendarReminder, DayPlan,
  TaskPriority, DayContext,
} from "@/lib/types";
import { createCalendarReminder } from "@/lib/storage";

interface Props {
  events: CalendarEvent[];
  reminders: CalendarReminder[];
  dayPlan: DayPlan | null;
  dayContext: DayContext | null;
  onUpdateEvents: (e: CalendarEvent[]) => void;
  onUpdateReminders: (r: CalendarReminder[]) => void;
  onGeneratePlan: () => void;
  planLoading: boolean;
  streamText?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SLOT_H = 48;        // px per 30-min slot
const HOUR_START = 6;
const HOUR_END   = 23;

const slots: string[] = [];
for (let h = HOUR_START; h < HOUR_END; h++) {
  slots.push(`${pad(h)}:00`);
  slots.push(`${pad(h)}:30`);
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function slotMin(slot: string) {
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + m;
}

function minToSlot(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60 < 30 ? 0 : 30;
  return `${pad(h)}:${pad(m)}`;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high:   "#ff5252",
  medium: "#fbbf24",
  low:    "#95BBEA",
};

const PRIORITY_STYLE: Record<TaskPriority, { bg: string; border: string; text: string; dot: string }> = {
  high:   { bg: "bg-primary/[0.18]",   border: "border-primary-fixed/30", text: "text-primary-fixed", dot: "bg-primary-fixed" },
  medium: { bg: "bg-amber-500/[0.15]", border: "border-amber-400/30",     text: "text-amber-300",     dot: "bg-amber-400"     },
  low:    { bg: "bg-secondary/[0.15]", border: "border-secondary/30",     text: "text-secondary",     dot: "bg-secondary"     },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function DragCalendar({
  events, reminders, dayPlan, dayContext,
  onUpdateEvents, onUpdateReminders, onGeneratePlan, planLoading, streamText,
}: Props) {
  const [dragId, setDragId]       = useState<string | null>(null);
  const [dragSrc, setDragSrc]     = useState<"reminder" | "event" | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const [tapSel, setTapSel]       = useState<string | null>(null); // mobile tap-to-place

  // Add reminder form
  const [showForm, setShowForm]   = useState(false);
  const [fTitle, setFTitle]       = useState("");
  const [fPriority, setFPriority] = useState<TaskPriority>("medium");
  const [fMins, setFMins]         = useState(30);
  const [fNotes, setFNotes]       = useState("");

  // Sidebar reminder edit
  const [editId, setEditId]       = useState<string | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today  = now.toISOString().slice(0, 10);

  // Scroll to current time on mount
  useEffect(() => {
    if (!gridRef.current) return;
    const offset = ((nowMin - HOUR_START * 60) / 30) * SLOT_H - 120;
    gridRef.current.scrollTop = Math.max(0, offset);
  }, [nowMin]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const todayEvents = events.filter(
    (e) => new Date(e.start).toISOString().slice(0, 10) === today && !e.isAllDay
  );

  const getSlotEvents = (slot: string) =>
    todayEvents.filter((e) => {
      const d = new Date(e.start);
      const key = `${pad(d.getHours())}:${d.getMinutes() < 30 ? "00" : "30"}`;
      return key === slot;
    });

  const planBlocks = (dayPlan?.schedule ?? []).filter((b) => {
    const [h] = b.time.split(":").map(Number);
    return h >= HOUR_START && h < HOUR_END;
  });

  const getPlanBlocks = (slot: string) =>
    planBlocks.filter((b) => {
      const [bh, bm] = b.time.split(":").map(Number);
      const key = `${pad(bh)}:${bm < 30 ? "00" : "30"}`;
      return key === slot;
    });

  // ── Drag & Drop ─────────────────────────────────────────────────────────────

  const handleDragStart = (
    e: React.DragEvent,
    id: string,
    src: "reminder" | "event"
  ) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ id, src }));
    setDragId(id);
    setDragSrc(src);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragSrc(null);
    setHoverSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, slot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setHoverSlot(slot);
  };

  const handleDrop = (e: React.DragEvent, slot: string) => {
    e.preventDefault();
    try {
      const { id, src } = JSON.parse(e.dataTransfer.getData("text/plain"));
      placeItem(id, src, slot);
    } catch { /* ignore */ }
    setDragId(null); setDragSrc(null); setHoverSlot(null);
  };

  const placeItem = (id: string, src: "reminder" | "event", slot: string) => {
    const [h, m] = slot.split(":").map(Number);
    const start = new Date(now);
    start.setHours(h, m, 0, 0);

    if (src === "reminder") {
      const r = reminders.find((x) => x.id === id);
      if (!r) return;
      const end = new Date(start.getTime() + r.estimatedMinutes * 60000);
      const newEv: CalendarEvent = {
        id: `cal-${Date.now()}`,
        title: r.title,
        start: start.toISOString(),
        end: end.toISOString(),
        isAllDay: false,
        color: PRIORITY_COLORS[r.priority],
        source: "manual",
        priority: r.priority,
      };
      onUpdateEvents([...events, newEv]);
      onUpdateReminders(reminders.filter((x) => x.id !== id));
    } else {
      const ev = events.find((x) => x.id === id);
      if (!ev) return;
      const dur = new Date(ev.end).getTime() - new Date(ev.start).getTime();
      onUpdateEvents(events.map((x) =>
        x.id === id ? { ...x, start: start.toISOString(), end: new Date(start.getTime() + dur).toISOString() } : x
      ));
    }
    setTapSel(null);
  };

  // ── Mobile tap-to-place ──────────────────────────────────────────────────────

  const handleReminderTap = (id: string) => setTapSel(tapSel === id ? null : id);

  const handleSlotTap = (slot: string) => {
    if (!tapSel) return;
    const r = reminders.find((x) => x.id === tapSel);
    if (r) placeItem(tapSel, "reminder", slot);
    else placeItem(tapSel, "event", slot);
    setTapSel(null);
  };

  // ── Move event back to sidebar ───────────────────────────────────────────────

  const returnToSidebar = (evId: string) => {
    const ev = events.find((x) => x.id === evId);
    if (!ev) return;
    const dur = Math.round((new Date(ev.end).getTime() - new Date(ev.start).getTime()) / 60000);
    const rem = createCalendarReminder({
      title: ev.title,
      priority: ev.priority ?? "medium",
      estimatedMinutes: dur,
    });
    onUpdateReminders([...reminders, rem]);
    onUpdateEvents(events.filter((x) => x.id !== evId));
  };

  // ── Add reminder form ────────────────────────────────────────────────────────

  const handleAddReminder = () => {
    if (!fTitle.trim()) return;
    const r = createCalendarReminder({
      title: fTitle.trim(),
      priority: fPriority,
      estimatedMinutes: fMins,
      notes: fNotes.trim() || undefined,
    });
    onUpdateReminders([...reminders, r]);
    setFTitle(""); setFPriority("medium"); setFMins(30); setFNotes("");
    setShowForm(false);
  };

  const deleteReminder = (id: string) => onUpdateReminders(reminders.filter((r) => r.id !== id));

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline text-3xl italic text-white">Planner</h3>
          <p className="font-label text-[9px] uppercase tracking-widest text-white/30">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {/* AI plan button */}
        <button
          onClick={onGeneratePlan}
          disabled={planLoading || !dayContext}
          className={`glimmer-btn flex items-center gap-1.5 px-4 py-2 rounded-full font-label text-[10px] uppercase tracking-widest font-bold transition-all ${
            planLoading || !dayContext
              ? "glass-dark border border-white/10 text-white/20 cursor-not-allowed"
              : "bg-gradient-to-r from-primary to-primary-dim text-white shadow-[0_4px_16px_rgba(147,5,0,0.35)] interactive-scale"
          }`}
        >
          <span className={`material-symbols-outlined text-sm ${planLoading ? "animate-spin" : ""}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {planLoading ? "refresh" : "auto_fix_high"}
          </span>
          {planLoading ? "Planning…" : "AI Plan"}
        </button>
      </div>

      {/* Streaming */}
      {planLoading && streamText && (
        <div className="glass-dark rounded-lg p-3 border border-secondary/15">
          <p className="font-label text-[8px] uppercase tracking-widest text-secondary/50 mb-1">✦ Claude is thinking…</p>
          <p className="text-xs text-white/35 font-mono line-clamp-3">{streamText}</p>
        </div>
      )}

      {/* AI summary strip */}
      {dayPlan?.summary && !planLoading && (
        <div className="glass-dark rounded-lg px-4 py-3 border border-white/[0.07]">
          <p className="font-editorial text-white/65 italic text-sm leading-relaxed">{dayPlan.summary}</p>
        </div>
      )}

      {tapSel && (
        <div className="glass-dark border border-secondary/30 rounded-lg px-4 py-2.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-sm">touch_app</span>
          <p className="font-label text-[9px] uppercase tracking-widest text-secondary/70">
            Tap a time slot to place &ldquo;{reminders.find(r => r.id === tapSel)?.title}&rdquo;
          </p>
          <button onClick={() => setTapSel(null)} className="ml-auto text-white/30">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex gap-3 flex-col-reverse md:flex-row">

        {/* ── Time grid ── */}
        <div className="flex-1 glass-card rounded-lg overflow-hidden flex flex-col">
          <div
            ref={gridRef}
            className="overflow-y-auto"
            style={{ maxHeight: "70vh" }}
          >
            {slots.map((slot) => {
              const sm      = slotMin(slot);
              const isHour  = slot.endsWith(":00");
              const isNow   = nowMin >= sm && nowMin < sm + 30;
              const slotEvs = getSlotEvents(slot);
              const planEvs = getPlanBlocks(slot);
              const isHover = hoverSlot === slot;

              return (
                <div
                  key={slot}
                  style={{ minHeight: SLOT_H }}
                  className={`flex border-b transition-colors ${
                    isHour ? "border-white/[0.07]" : "border-white/[0.03]"
                  } ${isNow ? "bg-primary/[0.06]" : ""} ${isHover ? "bg-secondary/[0.08]" : ""}`}
                  onDragOver={(e) => handleDragOver(e, slot)}
                  onDragLeave={() => setHoverSlot(null)}
                  onDrop={(e) => handleDrop(e, slot)}
                  onClick={() => handleSlotTap(slot)}
                >
                  {/* Time label */}
                  <div className="w-12 shrink-0 flex items-start justify-end pr-2 pt-1.5">
                    {isHour && (
                      <p className="font-label text-[9px] text-white/20">{slot}</p>
                    )}
                    {isNow && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse mt-1.5" />
                    )}
                  </div>

                  {/* Events */}
                  <div className="flex-1 py-1 px-2 flex flex-col gap-1">
                    {/* AI plan blocks */}
                    {planEvs.map((b, i) => {
                      const blockColors: Record<string, string> = {
                        task: "text-secondary border-secondary/20 bg-secondary/[0.06]",
                        meal: "text-amber-400 border-amber-400/20 bg-amber-400/[0.06]",
                        exercise: "text-green-400 border-green-400/20 bg-green-400/[0.06]",
                        break: "text-tertiary border-tertiary/20 bg-tertiary/[0.06]",
                        rest: "text-white/40 border-white/10 bg-white/[0.03]",
                        focus: "text-secondary border-secondary/25 bg-secondary/[0.08]",
                        habit: "text-tertiary border-tertiary/20 bg-tertiary/[0.06]",
                      };
                      return (
                        <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${blockColors[b.type] ?? blockColors.rest}`}>
                          <span className="material-symbols-outlined text-xs shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {b.type === "task" ? "task_alt" : b.type === "meal" ? "restaurant" : b.type === "exercise" ? "directions_run" : b.type === "break" ? "coffee" : b.type === "focus" ? "center_focus_strong" : b.type === "habit" ? "repeat" : "bedtime"}
                          </span>
                          <span className="truncate">{b.title}</span>
                          <span className="ml-auto shrink-0 opacity-50">{b.duration}m</span>
                        </div>
                      );
                    })}

                    {/* Calendar events (draggable) */}
                    {slotEvs.map((ev) => {
                      const p = (ev.priority ?? "medium") as TaskPriority;
                      const s = PRIORITY_STYLE[p];
                      const endTime = new Date(ev.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
                      return (
                        <div
                          key={ev.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ev.id, "event")}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded border cursor-grab active:cursor-grabbing group transition-opacity ${s.bg} ${s.border} ${dragId === ev.id ? "opacity-40" : ""}`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                          <p className={`text-xs flex-1 leading-snug truncate ${s.text}`}>{ev.title}</p>
                          <p className="font-label text-[8px] text-white/20 shrink-0">→{endTime}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); returnToSidebar(ev.id); }}
                            className="shrink-0 opacity-0 group-hover:opacity-100 text-white/25 hover:text-white/60 transition-all"
                            title="Move back to sidebar"
                          >
                            <span className="material-symbols-outlined text-xs">west</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Reminders sidebar ── */}
        <div className="w-full md:w-60 shrink-0">
          <div className="glass-card rounded-lg overflow-hidden sticky top-20">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <div>
                <p className="font-label text-[10px] uppercase tracking-widest text-white/50">Reminders</p>
                <p className="font-label text-[8px] text-white/20">{reminders.length} unscheduled</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`interactive-scale w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  showForm ? "bg-white/10 text-white/60" : "bg-primary/20 text-primary-fixed border border-primary/30"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{showForm ? "close" : "add"}</span>
              </button>
            </div>

            {/* Add form */}
            {showForm && (
              <div className="p-3 border-b border-white/[0.08] space-y-2.5 animate-slide-up">
                <input
                  autoFocus
                  type="text" value={fTitle} onChange={(e) => setFTitle(e.target.value)}
                  placeholder="Reminder title…"
                  onKeyDown={(e) => e.key === "Enter" && handleAddReminder()}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-secondary/40"
                />
                {/* Priority */}
                <div>
                  <p className="font-label text-[8px] uppercase tracking-widest text-white/25 mb-1.5">Priority</p>
                  <div className="grid grid-cols-3 gap-1">
                    {(["high", "medium", "low"] as TaskPriority[]).map((p) => {
                      const s = PRIORITY_STYLE[p];
                      return (
                        <button
                          key={p}
                          onClick={() => setFPriority(p)}
                          className={`py-1.5 rounded border text-center font-label text-[8px] uppercase tracking-wider transition-all interactive-scale ${
                            fPriority === p ? `${s.bg} ${s.border} ${s.text}` : "glass-dark border-white/10 text-white/30"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-0.5 ${s.dot}`} />
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Duration */}
                <select
                  value={fMins}
                  onChange={(e) => setFMins(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white/60 focus:outline-none"
                >
                  {[15, 30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60}h`}</option>
                  ))}
                </select>
                <textarea
                  value={fNotes} onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-white/50 placeholder-white/15 resize-none focus:outline-none"
                />
                <button
                  onClick={handleAddReminder}
                  disabled={!fTitle.trim()}
                  className={`w-full py-2 rounded font-label text-[9px] uppercase tracking-widest font-bold transition-all ${
                    fTitle.trim()
                      ? "bg-gradient-to-r from-primary to-primary-dim text-white interactive-scale"
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  }`}
                >
                  Add Reminder
                </button>
              </div>
            )}

            {/* Drag hint */}
            {!showForm && reminders.length === 0 && (
              <div className="py-8 px-4 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-white/10 block" style={{ fontVariationSettings: "'FILL' 1" }}>
                  drag_indicator
                </span>
                <p className="font-label text-[9px] uppercase tracking-widest text-white/20 leading-relaxed">
                  Add reminders then drag them onto the time grid
                </p>
              </div>
            )}

            {/* Reminders list */}
            <div className="p-2 space-y-1.5 max-h-[50vh] overflow-y-auto">
              {reminders.map((r) => {
                const s = PRIORITY_STYLE[r.priority];
                const isSelected = tapSel === r.id;
                return (
                  <div
                    key={r.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, r.id, "reminder")}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleReminderTap(r.id)}
                    className={`flex items-start gap-2 p-2.5 rounded border cursor-grab active:cursor-grabbing group transition-all ${s.bg} ${s.border} ${
                      isSelected ? "ring-1 ring-secondary/50 scale-[0.98]" : ""
                    } ${dragId === r.id ? "opacity-40" : ""}`}
                  >
                    <div className="flex flex-col gap-1 pt-0.5 shrink-0">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      <span className="material-symbols-outlined text-[11px] text-white/20">drag_indicator</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-snug ${s.text}`}>{r.title}</p>
                      {r.notes && <p className="text-[10px] text-white/30 mt-0.5 line-clamp-1">{r.notes}</p>}
                      <p className="font-label text-[8px] text-white/20 mt-0.5 uppercase tracking-wider">
                        {r.estimatedMinutes < 60 ? `${r.estimatedMinutes}m` : `${r.estimatedMinutes / 60}h`} · {r.priority}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteReminder(r.id); }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400/60 transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Tips */}
            {reminders.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/[0.05]">
                <p className="font-label text-[8px] text-white/15 leading-relaxed">
                  Drag to grid · Tap slot on mobile · ← to unschedule
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
