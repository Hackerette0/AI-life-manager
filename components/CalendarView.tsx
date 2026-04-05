"use client";

import { useState } from "react";
import { CalendarEvent, DayPlan } from "@/lib/types";

interface Props {
  events: CalendarEvent[];
  dayPlan: DayPlan | null;
  onUpdate: (events: CalendarEvent[]) => void;
}

const EVENT_COLORS = [
  "#95BBEA", "#ff5252", "#4ade80", "#fbbf24", "#a78bfa", "#fb923c",
];

function timeToMin(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isoToHHMM(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function todayAtTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const HOUR_START = 7;
const HOUR_END   = 22;
const TOTAL_MINS = (HOUR_END - HOUR_START) * 60;

export default function CalendarView({ events, dayPlan, onUpdate }: Props) {
  const [showForm, setShowForm]   = useState(false);
  const [title, setTitle]         = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime]     = useState("10:00");
  const [color, setColor]         = useState(EVENT_COLORS[0]);
  const [location, setLocation]   = useState("");
  const [showGcalInfo, setShowGcalInfo] = useState(false);

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPct = Math.min(100, Math.max(0, ((nowMin - HOUR_START * 60) / TOTAL_MINS) * 100));

  const todayStr = now.toISOString().slice(0, 10);

  // Today's events (manual + google) within display window
  const todayEvents = events
    .filter((e) => {
      const d = new Date(e.start);
      return d.toISOString().slice(0, 10) === todayStr && !e.isAllDay;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  // All-day events for today
  const allDayEvents = events.filter((e) => {
    const d = new Date(e.start);
    return d.toISOString().slice(0, 10) === todayStr && e.isAllDay;
  });

  const handleAdd = () => {
    if (!title.trim()) return;
    const newEvent: CalendarEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      start: todayAtTime(startTime),
      end: todayAtTime(endTime),
      isAllDay: false,
      color,
      location: location.trim() || undefined,
      source: "manual",
    };
    onUpdate([...events, newEvent]);
    setTitle(""); setStartTime("09:00"); setEndTime("10:00"); setColor(EVENT_COLORS[0]); setLocation("");
    setShowForm(false);
  };

  const deleteEvent = (id: string) => onUpdate(events.filter((e) => e.id !== id));

  // Convert DayPlan blocks to display blocks for the timeline
  const planBlocks = (dayPlan?.schedule ?? []).map((b) => ({
    id: `plan-${b.time}`,
    title: b.title,
    start: todayAtTime(b.time),
    end: todayAtTime(b.time), // We'll compute end from duration
    duration: b.duration,
    type: b.type,
    isPlan: true,
  }));

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#E5E5EA]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#007AFF] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            calendar_today
          </span>
          <div>
            <h3 className="text-[18px] font-bold text-[#1C1C1E]">Today&apos;s Calendar</h3>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93]">
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowGcalInfo(!showGcalInfo); setShowForm(false); }}
            className="interactive-scale p-2 rounded-full glass-dark border border-[#E5E5EA] text-[#8E8E93] hover:text-[#6C6C70] transition-all"
            title="Connect Google Calendar"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowGcalInfo(false); }}
            className={`interactive-scale flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest font-bold transition-all ${
              showForm
                ? "glass-dark border border-[#E5E5EA] text-[#6C6C70]"
                : "bg-[#007AFF]/10 border border-[#007AFF]/30 text-[#007AFF] hover:bg-primary/30"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{showForm ? "close" : "add"}</span>
            {showForm ? "Cancel" : "Add"}
          </button>
        </div>
      </div>

      {/* Google Calendar connect info */}
      {showGcalInfo && (
        <div className="mx-5 my-3 bg-[#F2F2F7] rounded-xl border border-[#34C759]/20 p-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#34C759] text-xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
              info
            </span>
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#34C759]">Google Calendar Integration</p>
              <p className="text-xs text-[#6C6C70] leading-relaxed">
                To sync Google Calendar events, add your Google Calendar API credentials to <code className="text-[#34C759] bg-[#F8F8F8] px-1 rounded">.env.local</code>:
              </p>
              <div className="bg-[#F2F2F7] rounded p-2.5 font-mono text-[10px] text-[#8E8E93] space-y-0.5">
                <p>GOOGLE_CLIENT_ID=your_client_id</p>
                <p>GOOGLE_CLIENT_SECRET=your_client_secret</p>
              </div>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                Then visit <span className="text-[#34C759]">console.cloud.google.com</span>, enable the Calendar API, and create OAuth 2.0 credentials. Until then, add events manually below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add event form */}
      {showForm && (
        <div className="mx-5 my-3 bg-[#F2F2F7] rounded-xl border border-[#E5E5EA] p-4 space-y-3 animate-slide-up">
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title…"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-4 py-2.5 text-sm text-[#1C1C1E] placeholder-[#C6C6C8] focus:outline-none focus:border-[#007AFF]/40 transition-all"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93] mb-1.5">Start time</p>
              <input
                type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-3 py-2 text-sm text-[#3C3C43] focus:outline-none focus:border-[#007AFF]/40 "
              />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93] mb-1.5">End time</p>
              <input
                type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-3 py-2 text-sm text-[#3C3C43] focus:outline-none focus:border-[#007AFF]/40 "
              />
            </div>
          </div>
          <input
            type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-4 py-2.5 text-sm text-[#3C3C43] placeholder-[#C6C6C8] focus:outline-none focus:border-[#007AFF]/40 transition-all"
          />
          {/* Color picker */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93] mb-2">Color</p>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full interactive-scale transition-all ${color === c ? "ring-2 ring-white/50 ring-offset-1 ring-offset-transparent" : ""}`}
                  style={{ backgroundColor: c + "cc" }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className={`glimmer-btn w-full py-2.5 rounded-lg font-label text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
              title.trim()
                ? "bg-gradient-to-r bg-[#007AFF] from-[#007AFF] to-[#007AFF] text-[#1C1C1E] shadow-[0_4px_16px_rgba(0,122,255,0.25)] interactive-scale"
                : "bg-[#F8F8F8] text-[#AEAEB2] cursor-not-allowed"
            }`}
          >
            Add Event
          </button>
        </div>
      )}

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="px-5 pt-3 pb-1 flex flex-wrap gap-2">
          {allDayEvents.map((e) => (
            <span
              key={e.id}
              className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full border text-[#3C3C43]"
              style={{ borderColor: (e.color ?? "#95BBEA") + "40", backgroundColor: (e.color ?? "#95BBEA") + "15" }}
            >
              {e.title}
            </span>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="p-5">
        {todayEvents.length === 0 && planBlocks.length === 0 ? (
          <div className="py-8 text-center">
            <span className="material-symbols-outlined text-4xl text-[#C6C6C8] block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
              event_available
            </span>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">No events yet — add one above</p>
            <p className="text-xs text-[#AEAEB2] mt-1">
              Or generate your AI schedule in the Flow tab to see time blocks here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Current time indicator */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse shrink-0" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#007AFF]">
                Now · {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            {/* Merge plan blocks and calendar events */}
            {[
              ...todayEvents.map((e) => ({
                id: e.id,
                title: e.title,
                startMin: timeToMin(isoToHHMM(e.start)),
                endMin: timeToMin(isoToHHMM(e.end)),
                color: e.color ?? "#95BBEA",
                isPlan: false,
                location: e.location,
                source: e.source,
                originalId: e.id,
              })),
            ]
              .sort((a, b) => a.startMin - b.startMin)
              .map((item) => {
                const startH = Math.floor(item.startMin / 60);
                const startM = item.startMin % 60;
                const endH   = Math.floor(item.endMin / 60);
                const endM   = item.endMin % 60;
                const isPast = nowMin > item.endMin;
                const isNow  = nowMin >= item.startMin && nowMin < item.endMin;
                const duration = item.endMin - item.startMin;

                return (
                  <div
                    key={item.id}
                    className={`flex gap-3 p-3.5 rounded-lg border transition-all group ${
                      isPast ? "opacity-40" : isNow ? "ring-1 ring-primary-fixed/20" : ""
                    }`}
                    style={{
                      borderColor: item.color + "30",
                      backgroundColor: item.color + "0d",
                    }}
                  >
                    <div className="text-center w-12 shrink-0">
                      <p className="font-label text-[10px] font-bold text-[#6C6C70]">
                        {pad(startH)}:{pad(startM)}
                      </p>
                      <p className="font-label text-[8px] text-[#AEAEB2]">
                        {duration}m
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <p className={`text-sm font-medium leading-snug flex-1 ${isPast ? "line-through text-[#8E8E93]" : "text-white/85"}`}>
                          {item.title}
                        </p>
                        {isNow && (
                          <span className="text-[9px] font-semibold uppercase tracking-widest bg-primary text-[#1C1C1E] px-2 py-0.5 rounded-full animate-pulse shrink-0">
                            now
                          </span>
                        )}
                        {!item.isPlan && (
                          <button
                            onClick={() => deleteEvent(item.originalId)}
                            className="shrink-0 text-[#C6C6C8] hover:text-[#FF3B30]/70 transition-colors interactive-scale opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        )}
                      </div>
                      {item.location && (
                        <p className="text-xs text-[#8E8E93] mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {item.location}
                        </p>
                      )}
                      <p className="font-label text-[8px] text-[#AEAEB2] mt-0.5 uppercase tracking-wider">
                        {pad(startH)}:{pad(startM)} – {pad(endH)}:{pad(endM)}
                        {item.source === "google" && " · Google Calendar"}
                      </p>
                    </div>
                  </div>
                );
              })}

            {/* Plan blocks in a separate section */}
            {dayPlan && dayPlan.schedule.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2] mb-2">AI Schedule</p>
                <div className="space-y-1.5">
                  {dayPlan.schedule.map((b, i) => {
                    const startMin = timeToMin(b.time);
                    const isPast   = nowMin > startMin + b.duration;
                    const isNow    = nowMin >= startMin && nowMin < startMin + b.duration;
                    const typeColor: Record<string, string> = {
                      task: "#95BBEA", meal: "#fbbf24", exercise: "#4ade80",
                      break: "#FFF8E7", rest: "#ffffff", focus: "#95BBEA", habit: "#FFF8E7",
                    };
                    const c = typeColor[b.type] ?? "#ffffff";
                    return (
                      <div
                        key={i}
                        className={`flex gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                          isPast ? "opacity-30" : isNow ? "ring-1 ring-white/10" : ""
                        }`}
                        style={{ borderColor: c + "20", backgroundColor: c + "08" }}
                      >
                        <p className="font-label text-[10px] font-bold text-[#8E8E93] w-10 shrink-0">{b.time}</p>
                        <p className={`text-xs leading-snug ${isPast ? "line-through text-[#AEAEB2]" : "text-[#6C6C70]"}`}>
                          {b.title}
                        </p>
                        <p className="font-label text-[8px] text-[#AEAEB2] ml-auto shrink-0">{b.duration}m</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function pad(n: number) { return String(n).padStart(2, "0"); }
