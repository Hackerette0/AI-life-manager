"use client";

import { useState } from "react";
import { Habit } from "@/lib/types";

interface Props {
  habits: Habit[];
  onUpdateHabits: (habits: Habit[]) => void;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function JournalPage({ habits, onUpdateHabits }: Props) {
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [todos, setTodos]         = useState<string[]>(Array(10).fill(""));
  const [notes, setNotes]         = useState("");

  const monthName      = MONTH_NAMES[viewMonth];
  const today          = now.getDate();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  // Calendar grid
  const firstDay    = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow    = (firstDay.getDay() + 6) % 7; // Mon=0
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    const d = new Date(viewYear, viewMonth - 1);
    setViewMonth(d.getMonth()); setViewYear(d.getFullYear());
  };
  const nextMonth = () => {
    const d = new Date(viewYear, viewMonth + 1);
    setViewMonth(d.getMonth()); setViewYear(d.getFullYear());
  };

  const toggleHabit = (habitId: string, day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h;
      const existing = h.logs.find((l) => l.date === dateStr);
      if (existing) {
        return { ...h, logs: h.logs.map((l) => l.date === dateStr ? { ...l, completed: !l.completed } : l) };
      }
      return { ...h, logs: [...h.logs, { date: dateStr, completed: true }] };
    });
    onUpdateHabits(updated);
  };

  const isHabitDone = (habitId: string, day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return habits.find((h) => h.id === habitId)?.logs.find((l) => l.date === dateStr)?.completed ?? false;
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Monthly Calendar */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-4">
            <div className="text-[52px] font-black text-[#007AFF] leading-none tracking-tight uppercase select-none">
              {monthName.slice(0, 3)}
            </div>
            <div>
              <p className="text-[30px] font-bold text-[#1C1C1E] leading-none">{String(now.getDate()).padStart(2, "0")}</p>
              <p className="text-[11px] text-[#8E8E93] font-semibold uppercase tracking-widest mt-0.5">{viewYear}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F2F7] transition-all text-[#007AFF]">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button
              onClick={() => { setViewMonth(now.getMonth()); setViewYear(now.getFullYear()); }}
              className="px-3 h-7 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[11px] font-semibold hover:bg-[#007AFF]/20 transition-all"
            >
              Today
            </button>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F2F7] transition-all text-[#007AFF]">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Day name headers */}
        <div className="grid grid-cols-7 px-4 pb-1 border-t border-[#F2F2F7]">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`text-center text-[10px] font-semibold uppercase tracking-widest py-2 ${i >= 5 ? "text-[#FF3B30]" : "text-[#8E8E93]"}`}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 px-4 pb-4">
          {cells.map((day, i) => {
            const isToday   = isCurrentMonth && day === today;
            const isWeekend = i % 7 >= 5;
            return (
              <div key={i} className="h-11 flex items-center justify-center">
                {day !== null && (
                  <span className={`text-[14px] font-medium w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                    isToday   ? "bg-[#007AFF] text-white font-bold shadow-sm" :
                    isWeekend ? "text-[#FF3B30]" :
                    "text-[#1C1C1E] hover:bg-[#F2F2F7]"
                  }`}>
                    {day}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit Tracker Grid */}
      {habits.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F2F2F7] flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#1C1C1E]">Habit Tracker</h3>
            <span className="text-[11px] font-medium text-[#8E8E93]">{monthName} {viewYear}</span>
          </div>
          <div className="overflow-x-auto px-5 py-4">
            {/* Day numbers header */}
            <div className="flex mb-1 pl-28">
              {daysArray.map((d) => (
                <div key={d} className={`w-6 shrink-0 text-center text-[9px] font-semibold ${isCurrentMonth && d === today ? "text-[#007AFF]" : "text-[#C6C6C8]"}`}>
                  {String(d).padStart(2, "0")}
                </div>
              ))}
            </div>
            {/* Rows */}
            {habits.map((habit, hi) => (
              <div key={habit.id} className={`flex items-center py-1 ${hi < habits.length - 1 ? "border-b border-[#F2F2F7]" : ""}`}>
                <div className="w-28 shrink-0 text-[11px] font-medium text-[#3C3C43] truncate pr-3">{habit.title}</div>
                {daysArray.map((d) => {
                  const done    = isHabitDone(habit.id, d);
                  const isPast  = isCurrentMonth ? d <= today : true;
                  return (
                    <button
                      key={d}
                      onClick={() => toggleHabit(habit.id, d)}
                      className={`w-6 h-6 shrink-0 flex items-center justify-center rounded transition-all border ${
                        done    ? "bg-[#007AFF] border-[#007AFF]" :
                        isPast  ? "border-[#E5E5EA] hover:border-[#007AFF]/40 hover:bg-[#E3F0FF]" :
                        "border-[#F2F2F7]"
                      }`}
                    >
                      {done && <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* To-do + Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* To-do */}
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm p-5">
          <h3 className="text-[15px] font-semibold text-[#1C1C1E] mb-4">To do</h3>
          <div className="space-y-3">
            {todos.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-[#007AFF] w-5 shrink-0 text-right">{i + 1}.</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => { const n = [...todos]; n[i] = e.target.value; setTodos(n); }}
                  placeholder="—"
                  className="flex-1 text-[13px] text-[#1C1C1E] placeholder-[#C6C6C8] border-b border-[#E5E5EA] focus:border-[#007AFF] outline-none pb-1 bg-transparent transition-colors"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm p-5">
          <h3 className="text-[15px] font-semibold text-[#1C1C1E] mb-4">Notes</h3>
          <div className="relative h-[280px] border border-[#E5E5EA] rounded-xl overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #F2F2F7 27px, #F2F2F7 28px)",
                backgroundPositionY: "32px",
              }}
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your thoughts…"
              className="relative w-full h-full resize-none bg-transparent px-4 text-[13px] text-[#1C1C1E] placeholder-[#C6C6C8] focus:outline-none"
              style={{ lineHeight: "28px", paddingTop: "6px" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
