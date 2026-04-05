"use client";

import { useState } from "react";
import { Habit, HabitCategory, HabitFrequency, EnergyRequired } from "@/lib/types";
import {
  createHabit, isHabitDueToday, getHabitTodayLog,
  getHabitStreak, getHabitWeekLogs, todayStr,
} from "@/lib/storage";

interface Props {
  habits: Habit[];
  onUpdate: (habits: Habit[]) => void;
}

const categoryMeta: Record<HabitCategory, { icon: string; color: string; label: string }> = {
  health:      { icon: "favorite",         color: "text-[#FF3B30]",    label: "Health"      },
  work:        { icon: "work",             color: "text-[#34C759]",  label: "Work"        },
  learning:    { icon: "menu_book",        color: "text-[#FF9500]",  label: "Learning"    },
  mindfulness: { icon: "self_improvement", color: "text-[#FF9500]",   label: "Mind"        },
  social:      { icon: "group",            color: "text-[#34C759]",  label: "Social"      },
};

const frequencyLabel: Record<HabitFrequency, string> = {
  daily:    "Daily",
  weekdays: "Weekdays",
  weekends: "Weekends",
  weekly:   "Weekly",
};

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export default function HabitsTracker({ habits, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [freq, setFreq]         = useState<HabitFrequency>("daily");
  const [cat, setCat]           = useState<HabitCategory>("health");
  const [energy, setEnergy]     = useState<EnergyRequired>("medium");
  const [mins, setMins]         = useState(20);

  const dueToday   = habits.filter(isHabitDueToday);
  const doneToday  = dueToday.filter((h) => getHabitTodayLog(h)?.completed).length;
  const totalDue   = dueToday.length;
  const completion = totalDue ? Math.round((doneToday / totalDue) * 100) : 0;

  const handleAdd = () => {
    if (!title.trim()) return;
    const newHabit = createHabit({
      title: title.trim(),
      description: desc.trim() || undefined,
      frequency: freq,
      targetMinutes: mins,
      category: cat,
      energyRequired: energy,
    });
    onUpdate([...habits, newHabit]);
    setTitle(""); setDesc(""); setFreq("daily"); setCat("health"); setEnergy("medium"); setMins(20);
    setShowForm(false);
  };

  const toggleComplete = (habit: Habit) => {
    const today   = todayStr();
    const existing = getHabitTodayLog(habit);
    const newLogs  = existing
      ? habit.logs.map((l) => l.date === today ? { ...l, completed: !l.completed } : l)
      : [...habit.logs, { date: today, completed: true }];
    onUpdate(habits.map((h) => h.id === habit.id ? { ...h, logs: newLogs } : h));
  };

  const deleteHabit = (id: string) => onUpdate(habits.filter((h) => h.id !== id));

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#E5E5EA]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#FF9500] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            repeat
          </span>
          <div>
            <h3 className="text-[18px] font-bold text-[#1C1C1E]">Habits</h3>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93]">
              {doneToday}/{totalDue} done today
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`interactive-scale flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest font-bold transition-all ${
            showForm
              ? "bg-[#F2F2F7] border border-[#E5E5EA] text-[#6C6C70]"
              : "bg-[#FF9500]/10 border border-tertiary/30 text-[#FF9500] hover:bg-tertiary/20"
          }`}
        >
          <span className="material-symbols-outlined text-sm">{showForm ? "close" : "add"}</span>
          {showForm ? "Cancel" : "New Habit"}
        </button>
      </div>

      {/* Progress bar */}
      {totalDue > 0 && (
        <div className="px-5 pt-4 pb-2">
          <div className="flex justify-between items-baseline mb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93]">Today&apos;s Progress</p>
            <span className="font-headline text-lg font-bold text-[#FF9500]">{completion}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completion}%`, background: "linear-gradient(to right, #FFF8E7, #95BBEA)" }}
            />
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="mx-5 mb-4 mt-3 bg-[#F2F2F7] rounded-xl border border-[#E5E5EA] p-4 space-y-3 animate-slide-up">
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Habit name…"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-4 py-2.5 text-sm text-[#1C1C1E] placeholder-[#C6C6C8] focus:outline-none focus:border-[#007AFF]/40 transition-all"
          />
          <textarea
            value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Why this habit? (optional)"
            rows={2}
            className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-4 py-2.5 text-sm text-[#3C3C43] placeholder-[#C6C6C8] resize-none focus:outline-none focus:border-[#007AFF]/40 transition-all"
          />

          {/* Category */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93] mb-2">Category</p>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(categoryMeta) as HabitCategory[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  title={categoryMeta[c].label}
                  className={`py-2 rounded-lg text-center border transition-all interactive-scale ${
                    cat === c
                      ? "border-primary-fixed/40 bg-[#007AFF]/10 text-[#1C1C1E]"
                      : "border-[#E5E5EA] bg-[#F2F2F7] text-[#8E8E93] hover:border-[#007AFF]/30"
                  }`}
                >
                  <span className={`material-symbols-outlined text-base ${cat === c ? "text-[#1C1C1E]" : categoryMeta[c].color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {categoryMeta[c].icon}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency + Energy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93] mb-2">Frequency</p>
              <select
                value={freq} onChange={(e) => setFreq(e.target.value as HabitFrequency)}
                className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs text-[#3C3C43] focus:outline-none focus:border-[#007AFF]/40"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93] mb-2">Energy needed</p>
              <select
                value={energy} onChange={(e) => setEnergy(e.target.value as EnergyRequired)}
                className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs text-[#3C3C43] focus:outline-none focus:border-[#007AFF]/40"
              >
                <option value="high">⚡ High</option>
                <option value="medium">🔋 Medium</option>
                <option value="low">🌙 Low</option>
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93]">Target duration</p>
              <span className="font-headline text-lg font-bold text-[#007AFF]">{mins} min</span>
            </div>
            <input
              type="range" min={5} max={120} step={5} value={mins}
              onChange={(e) => setMins(Number(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #007AFF 0%, #007AFF ${((mins - 5) / 115) * 100}%, #E5E5EA ${((mins - 5) / 115) * 100}%, #E5E5EA 100%)`,
              }}
            />
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
            Add Habit
          </button>
        </div>
      )}

      {/* Habits list */}
      <div className="divide-y divide-[#F2F2F7]">
        {habits.length === 0 && !showForm && (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-[#C6C6C8] block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>repeat</span>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">Add your first habit above</p>
          </div>
        )}
        {habits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            onToggle={toggleComplete}
            onDelete={deleteHabit}
          />
        ))}
      </div>
    </div>
  );
}

function HabitRow({
  habit, onToggle, onDelete,
}: {
  habit: Habit;
  onToggle: (h: Habit) => void;
  onDelete: (id: string) => void;
}) {
  const meta      = categoryMeta[habit.category];
  const todayLog  = getHabitTodayLog(habit);
  const done      = !!todayLog?.completed;
  const streak    = getHabitStreak(habit);
  const weekLogs  = getHabitWeekLogs(habit);
  const isDue     = isHabitDueToday(habit);

  return (
    <div className={`p-4 group transition-all ${done ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Complete button */}
        <button
          onClick={() => onToggle(habit)}
          disabled={!isDue}
          className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-all interactive-scale ${
            done
              ? "bg-green-500/20 border-green-500/40"
              : isDue
              ? "bg-[#F8F8F8] border-[#E5E5EA] hover:border-[#007AFF]/25"
              : "bg-[#F8F8F8] border-[#F2F2F7] cursor-default opacity-40"
          }`}
        >
          <span
            className={`material-symbols-outlined text-base transition-colors ${done ? "text-[#34C759]" : "text-[#8E8E93]"}`}
            style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}
          >
            {done ? "check_circle" : "radio_button_unchecked"}
          </span>
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`material-symbols-outlined text-sm shrink-0 ${meta.color}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {meta.icon}
            </span>
            <p className={`text-sm font-medium leading-snug ${done ? "line-through text-[#8E8E93]" : "text-white/85"}`}>
              {habit.title}
            </p>
            {!isDue && (
              <span className="font-label text-[8px] text-[#AEAEB2] uppercase tracking-widest">
                Not today
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#AEAEB2]">
              {frequencyLabel[habit.frequency]} · {habit.targetMinutes}min
            </p>
            {streak > 0 && (
              <span className="font-label text-[9px] text-[#FF9500]/70 flex items-center gap-0.5">
                🔥 {streak}
              </span>
            )}
          </div>

          {/* Week dots */}
          <div className="flex gap-1 mt-2">
            {weekLogs.map((log, i) => {
              const isToday = i === 6;
              return (
                <div
                  key={log.date}
                  title={log.date}
                  className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                    log.completed
                      ? "bg-green-500/60"
                      : isToday
                      ? "bg-[#F2F2F7] ring-1 ring-white/20"
                      : "bg-[#F2F2F7]"
                  }`}
                >
                  <span className="font-label text-[7px] text-[#AEAEB2]">{dayLabels[new Date(log.date + "T12:00:00").getDay() === 0 ? 6 : new Date(log.date + "T12:00:00").getDay() - 1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(habit.id)}
          className="shrink-0 text-[#C6C6C8] hover:text-[#FF3B30]/70 transition-colors interactive-scale opacity-0 group-hover:opacity-100"
          title="Delete habit"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
