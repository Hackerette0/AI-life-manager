"use client";

import { useState } from "react";
import { EnergyLevel, DayContext } from "@/lib/types";
import { getEnergyLabel } from "@/lib/storage";

interface Props {
  onCheckIn: (ctx: DayContext) => void;
  existing?: DayContext | null;
}

const moodOptions = [
  { emoji: "😴", label: "Tired"   },
  { emoji: "😟", label: "Stressed"},
  { emoji: "😐", label: "Neutral" },
  { emoji: "🙂", label: "Good"    },
  { emoji: "😄", label: "Great"   },
  { emoji: "🔥", label: "Amazing" },
];

/** Gradient for the energy circle based on level */
function energyGradient(level: number): string {
  if (level <= 3) return "from-red-700 to-orange-600";
  if (level <= 5) return "from-orange-600 to-yellow-500";
  if (level <= 7) return "from-yellow-500 to-secondary";
  return "from-secondary to-primary-fixed";
}

/** Inline background for filled range track */
function trackStyle(value: number, min: number, max: number, color: string) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(255,255,255,0.10) ${pct}%, rgba(255,255,255,0.10) 100%)`,
  };
}

export default function EnergyCheckIn({ onCheckIn, existing }: Props) {
  const [energy, setEnergy]   = useState<EnergyLevel>((existing?.energyLevel ?? 6) as EnergyLevel);
  const [mood, setMood]       = useState(existing?.mood ?? "");
  const [sleep, setSleep]     = useState(existing?.sleepHours ?? 7);
  const [notes, setNotes]     = useState(existing?.notes ?? "");
  const [editing, setEditing] = useState(!existing);

  /* ── Collapsed view ── */
  if (!editing && existing) {
    return (
      <div className="glass-card rounded-lg p-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${energyGradient(existing.energyLevel)} flex items-center justify-center text-white font-bold text-lg border border-white/20 shrink-0`}>
              {existing.energyLevel}
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-white/40">Energy Check-In</p>
              <p className="text-white font-semibold text-sm">
                {existing.mood} ·{" "}
                <span className="text-secondary">{getEnergyLabel(existing.energyLevel)}</span>
              </p>
              <p className="font-label text-[9px] text-white/30 uppercase tracking-widest mt-0.5">
                😴 {existing.sleepHours}h sleep
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="font-label text-[9px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors border border-white/10 px-3 py-1.5 rounded-full interactive-scale"
          >
            Update
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!mood) return;
    onCheckIn({ energyLevel: energy, mood, sleepHours: sleep, notes, checkedInAt: new Date().toISOString() });
    setEditing(false);
  };

  return (
    <div className="glass-card rounded-lg p-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 shrink-0">
          <span className="material-symbols-outlined text-primary-fixed text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            self_improvement
          </span>
        </div>
        <div>
          <h3 className="font-headline text-2xl italic text-white">Morning Check-In</h3>
          <p className="font-label text-[9px] uppercase tracking-widest text-white/30">
            Build your day around how you actually feel
          </p>
        </div>
      </div>

      {/* Energy slider */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-3">
          <label className="font-label text-[10px] uppercase tracking-widest text-white/50">Energy Level</label>
          <div className="flex items-baseline gap-1.5">
            <span className="font-headline text-3xl font-bold text-primary-fixed">{energy}</span>
            <span className="font-label text-[10px] text-white/30">/ 10 · {getEnergyLabel(energy)}</span>
          </div>
        </div>
        <input
          type="range" min={1} max={10} value={energy}
          onChange={(e) => setEnergy(Number(e.target.value) as EnergyLevel)}
          className="w-full"
          style={trackStyle(energy, 1, 10, "#ff5252")}
        />
        <div className="flex justify-between font-label text-[8px] uppercase tracking-widest text-white/20 mt-1">
          <span>Depleted</span>
          <span>Peak</span>
        </div>
      </div>

      {/* Mood */}
      <div className="mb-6">
        <label className="font-label text-[10px] uppercase tracking-widest text-white/50 block mb-3">Mood</label>
        <div className="grid grid-cols-3 gap-2">
          {moodOptions.map((m) => {
            const value = `${m.emoji} ${m.label}`;
            return (
              <button
                key={m.label}
                onClick={() => setMood(value)}
                className={`py-2.5 px-2 rounded-lg text-sm border transition-all interactive-scale ${
                  mood === value
                    ? "border-primary/50 bg-primary/15 text-white shadow-[0_0_12px_rgba(147,5,0,0.25)]"
                    : "border-white/10 glass-dark text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                {m.emoji}{" "}
                <span className="font-label text-[10px] uppercase tracking-wider">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sleep */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-3">
          <label className="font-label text-[10px] uppercase tracking-widest text-white/50">Last Night&apos;s Sleep</label>
          <span className="font-headline text-2xl font-bold text-secondary">{sleep}h</span>
        </div>
        <input
          type="range" min={3} max={12} step={0.5} value={sleep}
          onChange={(e) => setSleep(Number(e.target.value))}
          className="w-full"
          style={trackStyle(sleep, 3, 12, "#95BBEA")}
        />
        <div className="flex justify-between font-label text-[8px] uppercase tracking-widest text-white/20 mt-1">
          <span>3h</span>
          <span>12h</span>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="font-label text-[10px] uppercase tracking-widest text-white/50 block mb-2">
          Anything else?{" "}
          <span className="text-white/20 normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Big deadline today, feeling a bit anxious..."
          rows={2}
          className="w-full glass-dark rounded-lg border border-white/10 p-3 text-sm text-white/70 placeholder-white/20 resize-none focus:outline-none focus:border-secondary/40 focus:ring-1 focus:ring-secondary/20 transition-all"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!mood}
        className={`glimmer-btn w-full py-3.5 rounded-lg font-label text-[11px] uppercase tracking-[0.2em] font-bold transition-all ${
          mood
            ? "bg-gradient-to-r from-primary to-primary-dim text-white shadow-[0_6px_20px_rgba(147,5,0,0.4)] interactive-scale"
            : "bg-white/5 text-white/20 cursor-not-allowed"
        }`}
      >
        Start My Day
      </button>
    </div>
  );
}
