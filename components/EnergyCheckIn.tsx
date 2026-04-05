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

function energyColor(level: number): string {
  if (level <= 3) return "#FF3B30";
  if (level <= 5) return "#FF9500";
  if (level <= 7) return "#34C759";
  return "#007AFF";
}

function trackStyle(value: number, min: number, max: number, color: string) {
  const pct = ((value - min) / (max - min)) * 100;
  return { background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #E5E5EA ${pct}%, #E5E5EA 100%)` };
}

export default function EnergyCheckIn({ onCheckIn, existing }: Props) {
  const [energy, setEnergy]   = useState<EnergyLevel>((existing?.energyLevel ?? 6) as EnergyLevel);
  const [mood, setMood]       = useState(existing?.mood ?? "");
  const [sleep, setSleep]     = useState(existing?.sleepHours ?? 7);
  const [notes, setNotes]     = useState(existing?.notes ?? "");
  const [editing, setEditing] = useState(!existing);

  if (!editing && existing) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm p-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm" style={{ backgroundColor: energyColor(existing.energyLevel) }}>
              {existing.energyLevel}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">Energy Check-In</p>
              <p className="text-[#1C1C1E] font-semibold text-sm mt-0.5">
                {existing.mood} · <span style={{ color: energyColor(existing.energyLevel) }}>{getEnergyLabel(existing.energyLevel)}</span>
              </p>
              <p className="text-[10px] text-[#AEAEB2] mt-0.5">😴 {existing.sleepHours}h sleep</p>
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="text-[11px] font-semibold text-[#007AFF] border border-[#007AFF]/25 bg-[#007AFF]/5 px-3 py-1.5 rounded-full hover:bg-[#007AFF]/10 transition-all interactive-scale">
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
    <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#007AFF]/10 rounded-full flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#007AFF] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>self_improvement</span>
        </div>
        <div>
          <h3 className="text-[18px] font-bold text-[#1C1C1E]">Morning Check-In</h3>
          <p className="text-[11px] text-[#8E8E93] mt-0.5">Build your day around how you actually feel</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-3">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8E8E93]">Energy Level</label>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold leading-none" style={{ color: energyColor(energy) }}>{energy}</span>
            <span className="text-[11px] text-[#AEAEB2]">/ 10 · {getEnergyLabel(energy)}</span>
          </div>
        </div>
        <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value) as EnergyLevel)} className="w-full" style={trackStyle(energy, 1, 10, energyColor(energy))} />
        <div className="flex justify-between text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2] mt-1.5"><span>Depleted</span><span>Peak</span></div>
      </div>

      <div className="mb-6">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8E8E93] block mb-3">Mood</label>
        <div className="grid grid-cols-3 gap-2">
          {moodOptions.map((m) => {
            const value = `${m.emoji} ${m.label}`;
            return (
              <button key={m.label} onClick={() => setMood(value)} className={`py-2.5 px-2 rounded-xl text-sm border transition-all interactive-scale ${mood === value ? "border-[#007AFF]/40 bg-[#007AFF]/10 text-[#007AFF]" : "border-[#E5E5EA] bg-[#F8F8F8] text-[#3C3C43] hover:border-[#007AFF]/25"}`}>
                {m.emoji} <span className="text-[10px] font-semibold uppercase tracking-wider">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-3">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8E8E93]">Last Night&apos;s Sleep</label>
          <span className="text-[24px] font-bold text-[#007AFF] leading-none">{sleep}h</span>
        </div>
        <input type="range" min={3} max={12} step={0.5} value={sleep} onChange={(e) => setSleep(Number(e.target.value))} className="w-full" style={trackStyle(sleep, 3, 12, "#007AFF")} />
        <div className="flex justify-between text-[9px] font-semibold uppercase tracking-widest text-[#AEAEB2] mt-1.5"><span>3h</span><span>12h</span></div>
      </div>

      <div className="mb-6">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[#8E8E93] block mb-2">Anything else? <span className="text-[#AEAEB2] normal-case tracking-normal font-normal">(optional)</span></label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Big deadline today, feeling a bit anxious..." rows={2} className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-xl p-3 text-[13px] text-[#1C1C1E] placeholder-[#C6C6C8] resize-none focus:outline-none focus:border-[#007AFF]/50 transition-all" />
      </div>

      <button onClick={handleSubmit} disabled={!mood} className={`w-full py-3.5 rounded-xl text-[13px] font-semibold transition-all ${mood ? "bg-[#007AFF] text-white shadow-[0_4px_16px_rgba(0,122,255,0.3)] interactive-scale" : "bg-[#F2F2F7] text-[#AEAEB2] cursor-not-allowed border border-[#E5E5EA]"}`}>
        Start My Day
      </button>
    </div>
  );
}
