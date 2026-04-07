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
  if (level <= 5) return "#FFB830";
  if (level <= 7) return "#FF3D9A";
  return "#FFD60A";
}

function trackStyle(value: number, min: number, max: number, color: string) {
  const pct = ((value - min) / (max - min)) * 100;
  return { background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, #2A2A2A ${pct}%, #2A2A2A 100%)` };
}

export default function EnergyCheckIn({ onCheckIn, existing }: Props) {
  const [energy, setEnergy]   = useState<EnergyLevel>((existing?.energyLevel ?? 6) as EnergyLevel);
  const [mood, setMood]       = useState(existing?.mood ?? "");
  const [sleep, setSleep]     = useState(existing?.sleepHours ?? 7);
  const [notes, setNotes]     = useState(existing?.notes ?? "");
  const [editing, setEditing] = useState(!existing);

  if (!editing && existing) {
    return (
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] shadow-sm p-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm" style={{ backgroundColor: energyColor(existing.energyLevel) }}>
              {existing.energyLevel}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AA7790]">Energy Check-In</p>
              <p className="text-[#FFFDE7] font-semibold text-sm mt-0.5">
                {existing.mood} · <span style={{ color: energyColor(existing.energyLevel) }}>{getEnergyLabel(existing.energyLevel)}</span>
              </p>
              <p className="text-[10px] text-[#AA7790] mt-0.5">😴 {existing.sleepHours}h sleep</p>
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="text-[11px] font-semibold text-[#FFD60A] border border-[#FFD60A]/25 bg-[#FFD60A]/5 px-3 py-1.5 rounded-full hover:bg-[#FFD60A]/10 transition-all interactive-scale">
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
    <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] shadow-sm p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#FFD60A]/10 rounded-full flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#FFD60A] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>self_improvement</span>
        </div>
        <div>
          <h3 className="text-[18px] font-bold text-[#FFFDE7]">Morning Check-In</h3>
          <p className="text-[11px] text-[#FF9FCA] mt-0.5">Build your day around how you actually feel</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-3">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[#FF9FCA]">Energy Level</label>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold leading-none" style={{ color: energyColor(energy) }}>{energy}</span>
            <span className="text-[11px] text-[#AA7790]">/ 10 · {getEnergyLabel(energy)}</span>
          </div>
        </div>
        <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value) as EnergyLevel)} className="w-full" style={trackStyle(energy, 1, 10, energyColor(energy))} />
        <div className="flex justify-between text-[9px] font-semibold uppercase tracking-widest text-[#AA7790] mt-1.5"><span>Depleted</span><span>Peak</span></div>
      </div>

      <div className="mb-6">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[#FF9FCA] block mb-3">Mood</label>
        <div className="grid grid-cols-3 gap-2">
          {moodOptions.map((m) => {
            const value = `${m.emoji} ${m.label}`;
            return (
              <button key={m.label} onClick={() => setMood(value)} className={`py-2.5 px-2 rounded-xl text-sm border transition-all interactive-scale ${mood === value ? "border-[#FFD60A]/40 bg-[#FFD60A]/10 text-[#FFD60A]" : "border-[#2A2A2A] bg-[#141414] text-[#FF9FCA] hover:border-[#FFD60A]/25"}`}>
                {m.emoji} <span className="text-[10px] font-semibold uppercase tracking-wider">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-3">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[#FF9FCA]">Last Night&apos;s Sleep</label>
          <span className="text-[24px] font-bold text-[#FFD60A] leading-none">{sleep}h</span>
        </div>
        <input type="range" min={3} max={12} step={0.5} value={sleep} onChange={(e) => setSleep(Number(e.target.value))} className="w-full" style={trackStyle(sleep, 3, 12, "#FFD60A")} />
        <div className="flex justify-between text-[9px] font-semibold uppercase tracking-widest text-[#AA7790] mt-1.5"><span>3h</span><span>12h</span></div>
      </div>

      <div className="mb-6">
        <label className="text-[11px] font-semibold uppercase tracking-widest text-[#FF9FCA] block mb-2">Anything else? <span className="text-[#AA7790] normal-case tracking-normal font-normal">(optional)</span></label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Big deadline today, feeling a bit anxious..." rows={2} className="w-full bg-[#141414] border border-[#2A2A2A] rounded-xl p-3 text-[13px] text-[#FFFDE7] placeholder-[#C6C6C8] resize-none focus:outline-none focus:border-[#FFD60A]/50 transition-all" />
      </div>

      <button onClick={handleSubmit} disabled={!mood} className={`w-full py-3.5 rounded-xl text-[13px] font-semibold transition-all ${mood ? "bg-[#FFD60A] text-white shadow-[0_4px_16px_rgba(0,122,255,0.3)] interactive-scale" : "bg-[#0C0C0C] text-[#AA7790] cursor-not-allowed border border-[#2A2A2A]"}`}>
        Start My Day
      </button>
    </div>
  );
}
