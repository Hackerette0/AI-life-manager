"use client";

import { useState } from "react";
import { Task, EnergyLevel, TaskPriority, EnergyRequired } from "@/lib/types";
import { createTask } from "@/lib/storage";

interface Props {
  tasks: Task[];
  energyLevel?: EnergyLevel;
  onAdd: (task: Task) => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

const energyOptions: { value: EnergyRequired; icon: string; label: string }[] = [
  { value: "high",   icon: "⚡", label: "High"   },
  { value: "medium", icon: "🔋", label: "Medium" },
  { value: "low",    icon: "🌙", label: "Low"    },
];

type Filter = "all" | "pending" | "in_progress" | "done";

function isEnergyMatch(taskEnergy: EnergyRequired, userEnergy: EnergyLevel): boolean {
  if (taskEnergy === "high"   && userEnergy >= 7) return true;
  if (taskEnergy === "medium" && userEnergy >= 4 && userEnergy <= 8) return true;
  if (taskEnergy === "low"    && userEnergy <= 5) return true;
  return false;
}

function priorityChip(priority: TaskPriority): string {
  return {
    high:   "text-[#FF3B30]    border-red-400/30    bg-red-400/10",
    medium: "text-[#FFB830] border-yellow-400/30 bg-yellow-400/10",
    low:    "text-[#FF3D9A]  border-[#FF3D9A]/25  bg-[#FF3D9A]/10",
  }[priority];
}

function trackStyle(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, #FFD60A 0%, #FFD60A ${pct}%, #E5E5EA ${pct}%, #E5E5EA 100%)`,
  };
}

export default function TaskManager({ tasks, energyLevel, onAdd, onUpdate, onDelete }: Props) {
  const [showForm, setShowForm]   = useState(false);
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [energyReq, setEnergyReq] = useState<EnergyRequired>("medium");
  const [priority, setPriority]   = useState<TaskPriority>("medium");
  const [minutes, setMinutes]     = useState(30);
  const [filter, setFilter]       = useState<Filter>("all");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(createTask({
      title: title.trim(),
      description: desc.trim() || undefined,
      energyRequired: energyReq,
      priority,
      estimatedMinutes: minutes,
      tags: [],
    }));
    setTitle(""); setDesc(""); setEnergyReq("medium"); setPriority("medium"); setMinutes(30);
    setShowForm(false);
  };

  const sorted = [...tasks]
    .filter((t) => filter === "all" || t.status === filter)
    .sort((a, b) => {
      if (energyLevel) {
        const ma = isEnergyMatch(a.energyRequired, energyLevel) ? 1 : 0;
        const mb = isEnergyMatch(b.energyRequired, energyLevel) ? 1 : 0;
        if (mb !== ma) return mb - ma;
      }
      const p = { high: 3, medium: 2, low: 1 } as const;
      return p[b.priority] - p[a.priority];
    });

  const counts = {
    pending:     tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done:        tasks.filter((t) => t.status === "done").length,
  };

  const filterTabs: { id: Filter; label: string }[] = [
    { id: "all",         label: "All"    },
    { id: "pending",     label: "Todo"   },
    { id: "in_progress", label: "Active" },
    { id: "done",        label: "Done"   },
  ];

  return (
    <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#FFD60A] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            task_alt
          </span>
          <div>
            <h3 className="text-[18px] font-bold text-[#FFFDE7]">Today&apos;s Protocol</h3>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AA7790]">
              {counts.pending} pending · {counts.in_progress} active · {counts.done} done
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`interactive-scale flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest font-bold transition-all ${
            showForm
              ? "bg-[#0C0C0C] border border-[#2A2A2A] text-[#FF9FCA]"
              : "bg-[#FFD60A]/10 border border-[#FFD60A]/30 text-[#FFD60A] hover:bg-primary/30"
          }`}
        >
          <span className="material-symbols-outlined text-sm">{showForm ? "close" : "add"}</span>
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-5 border-b border-[#2A2A2A] bg-[#0C0C0C] animate-slide-up space-y-4">
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to get done?"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-[#FFFDE7] placeholder-[#C6C6C8] focus:outline-none focus:border-[#FFD60A]/40 focus:ring-1 focus:ring-[#FFD60A]/20 transition-all"
          />
          <textarea
            value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Details... (optional)"
            rows={2}
            className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-[#FF9FCA] placeholder-[#C6C6C8] resize-none focus:outline-none focus:border-[#FFD60A]/40 transition-all"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AA7790] mb-2">Energy needed</p>
              <div className="flex gap-1.5">
                {energyOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setEnergyReq(o.value)}
                    title={o.label}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all interactive-scale ${
                      energyReq === o.value
                        ? "border-primary-fixed/40 bg-[#FFD60A]/10 text-[#FFFDE7]"
                        : "border-[#2A2A2A] bg-[#0C0C0C] text-[#AA7790] hover:border-[#FFD60A]/30"
                    }`}
                  >
                    {o.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AA7790] mb-2">Priority</p>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-[#FF9FCA] focus:outline-none focus:border-[#FFD60A]/40"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AA7790]">Estimated time</p>
              <span className="font-headline text-lg font-bold text-[#FFD60A]">{minutes} min</span>
            </div>
            <input
              type="range" min={5} max={240} step={5} value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-full"
              style={trackStyle(minutes, 5, 240)}
            />
          </div>

          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className={`glimmer-btn w-full py-3 rounded-lg font-label text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${
              title.trim()
                ? "bg-gradient-to-r bg-[#FFD60A] from-[#FFD60A] to-[#FFD60A] text-[#FFFDE7] shadow-[0_4px_16px_rgba(0,122,255,0.25)] interactive-scale"
                : "bg-[#141414] text-[#AA7790] cursor-not-allowed"
            }`}
          >
            Add Task
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex border-b border-[#2A2A2A]">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-3 text-[10px] font-semibold uppercase tracking-widest transition-all ${
              filter === tab.id
                ? "text-[#FFD60A] border-b-2 border-primary-fixed"
                : "text-[#AA7790] hover:text-[#FF9FCA]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="divide-y divide-[#222222]">
        {sorted.length === 0 && (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-[#C6C6C8] block mb-2">checklist</span>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AA7790]">
              {filter === "all" ? "No tasks yet — add one above" : `No ${filter.replace("_", " ")} tasks`}
            </p>
          </div>
        )}
        {sorted.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            energyLevel={energyLevel}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function TaskRow({
  task, energyLevel, onUpdate, onDelete,
}: {
  task: Task;
  energyLevel?: EnergyLevel;
  onUpdate: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const isMatch = energyLevel ? isEnergyMatch(task.energyRequired, energyLevel) : false;

  const cycleStatus = () => {
    const next = { pending: "in_progress", in_progress: "done", done: "pending" } as const;
    onUpdate({ ...task, status: next[task.status] });
  };

  const energyIcon = { high: "⚡", medium: "🔋", low: "🌙" }[task.energyRequired];

  return (
    <div className={`flex items-start gap-3 p-4 transition-all group ${
      task.status === "done" ? "opacity-40" : isMatch ? "bg-primary/[0.06]" : ""
    }`}>
      <button onClick={cycleStatus} className="mt-0.5 shrink-0 interactive-scale" title="Cycle status">
        <span
          className={`material-symbols-outlined text-xl transition-colors ${
            task.status === "done"
              ? "text-[#FF3D9A]"
              : task.status === "in_progress"
              ? "text-[#FFD60A]"
              : "text-[#AA7790] group-hover:text-[#AA7790]"
          }`}
          style={{ fontVariationSettings: task.status === "done" ? "'FILL' 1" : "'FILL' 0" }}
        >
          {task.status === "done"
            ? "check_circle"
            : task.status === "in_progress"
            ? "pending"
            : "radio_button_unchecked"}
        </span>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${
            task.status === "done" ? "line-through text-[#AA7790]" : "text-white/90"
          }`}>
            {task.title}
            {isMatch && energyLevel && (
              <span className="ml-1.5 text-[#FF3D9A] text-xs" title="Good energy match">✦</span>
            )}
          </p>
          <span className={`shrink-0 text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${priorityChip(task.priority)}`}>
            {task.priority}
          </span>
        </div>
        {task.description && (
          <p className="text-xs text-[#AA7790] mt-0.5 truncate">{task.description}</p>
        )}
        <p className="font-label text-[9px] text-[#AA7790] mt-1 uppercase tracking-wider">
          {energyIcon} {task.estimatedMinutes}min
        </p>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 mt-0.5 text-[#C6C6C8] hover:text-[#FF3B30]/70 transition-colors interactive-scale opacity-0 group-hover:opacity-100"
        title="Delete task"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  );
}
