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
  health:      { icon: "favorite",         color: "text-red-400",    label: "Health"      },
  work:        { icon: "work",             color: "text-secondary",  label: "Work"        },
  learning:    { icon: "menu_book",        color: "text-amber-400",  label: "Learning"    },
  mindfulness: { icon: "self_improvement", color: "text-tertiary",   label: "Mind"        },
  social:      { icon: "group",            color: "text-green-400",  label: "Social"      },
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
    <div className="glass-card rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-tertiary/70 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            repeat
          </span>
          <div>
            <h3 className="font-headline text-2xl italic text-white">Habits</h3>
            <p className="font-label text-[9px] uppercase tracking-widest text-white/30">
              {doneToday}/{totalDue} done today
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`interactive-scale flex items-center gap-1.5 px-4 py-2 rounded-full font-label text-[10px] uppercase tracking-widest font-bold transition-all ${
            showForm
              ? "glass-dark border border-white/20 text-white/60"
              : "bg-tertiary/10 border border-tertiary/30 text-tertiary hover:bg-tertiary/20"
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
            <p className="font-label text-[9px] uppercase tracking-widest text-white/30">Today&apos;s Progress</p>
            <span className="font-headline text-lg font-bold text-tertiary">{completion}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completion}%`, background: "linear-gradient(to right, #FFF8E7, #95BBEA)" }}
            />
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="mx-5 mb-4 mt-3 glass-dark rounded-lg border border-white/10 p-4 space-y-3 animate-slide-up">
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Habit name…"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-secondary/40 transition-all"
          />
          <textarea
            value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Why this habit? (optional)"
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/70 placeholder-white/20 resize-none focus:outline-none focus:border-secondary/40 transition-all"
          />

          {/* Category */}
          <div>
            <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-2">Category</p>
            <div className="grid grid-cols-5 gap-1.5">
              {(Object.keys(categoryMeta) as HabitCategory[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  title={categoryMeta[c].label}
                  className={`py-2 rounded-lg text-center border transition-all interactive-scale ${
                    cat === c
                      ? "border-primary-fixed/40 bg-primary/20 text-white"
                      : "border-white/10 glass-dark text-white/40 hover:border-white/25"
                  }`}
                >
                  <span className={`material-symbols-outlined text-base ${cat === c ? "text-white" : categoryMeta[c].color}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {categoryMeta[c].icon}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency + Energy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-2">Frequency</p>
              <select
                value={freq} onChange={(e) => setFreq(e.target.value as HabitFrequency)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-secondary/40"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-2">Energy needed</p>
              <select
                value={energy} onChange={(e) => setEnergy(e.target.value as EnergyRequired)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-secondary/40"
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
              <p className="font-label text-[9px] uppercase tracking-widest text-white/30">Target duration</p>
              <span className="font-headline text-lg font-bold text-primary-fixed">{mins} min</span>
            </div>
            <input
              type="range" min={5} max={120} step={5} value={mins}
              onChange={(e) => setMins(Number(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #ff5252 0%, #ff5252 ${((mins - 5) / 115) * 100}%, rgba(255,255,255,0.10) ${((mins - 5) / 115) * 100}%, rgba(255,255,255,0.10) 100%)`,
              }}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className={`glimmer-btn w-full py-2.5 rounded-lg font-label text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
              title.trim()
                ? "bg-gradient-to-r from-primary to-primary-dim text-white shadow-[0_4px_16px_rgba(147,5,0,0.35)] interactive-scale"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            Add Habit
          </button>
        </div>
      )}

      {/* Habits list */}
      <div className="divide-y divide-white/[0.05]">
        {habits.length === 0 && !showForm && (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-white/10 block mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>repeat</span>
            <p className="font-label text-[10px] uppercase tracking-widest text-white/20">Add your first habit above</p>
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
              ? "bg-white/5 border-white/15 hover:border-white/30"
              : "bg-white/[0.03] border-white/[0.05] cursor-default opacity-40"
          }`}
        >
          <span
            className={`material-symbols-outlined text-base transition-colors ${done ? "text-green-400" : "text-white/30"}`}
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
            <p className={`text-sm font-medium leading-snug ${done ? "line-through text-white/30" : "text-white/85"}`}>
              {habit.title}
            </p>
            {!isDue && (
              <span className="font-label text-[8px] text-white/20 uppercase tracking-widest">
                Not today
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="font-label text-[9px] uppercase tracking-wider text-white/25">
              {frequencyLabel[habit.frequency]} · {habit.targetMinutes}min
            </p>
            {streak > 0 && (
              <span className="font-label text-[9px] text-amber-400/70 flex items-center gap-0.5">
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
                      ? "bg-white/10 ring-1 ring-white/20"
                      : "bg-white/[0.04]"
                  }`}
                >
                  <span className="font-label text-[7px] text-white/20">{dayLabels[new Date(log.date + "T12:00:00").getDay() === 0 ? 6 : new Date(log.date + "T12:00:00").getDay() - 1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => onDelete(habit.id)}
          className="shrink-0 text-white/10 hover:text-red-400/70 transition-colors interactive-scale opacity-0 group-hover:opacity-100"
          title="Delete habit"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}
