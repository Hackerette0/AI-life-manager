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
    medium: "text-[#FF9500] border-yellow-400/30 bg-yellow-400/10",
    low:    "text-[#34C759]  border-[#34C759]/25  bg-[#34C759]/10",
  }[priority];
}

function trackStyle(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, #007AFF 0%, #007AFF ${pct}%, #E5E5EA ${pct}%, #E5E5EA 100%)`,
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
    <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#E5E5EA]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#007AFF] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            task_alt
          </span>
          <div>
            <h3 className="text-[18px] font-bold text-[#1C1C1E]">Today&apos;s Protocol</h3>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93]">
              {counts.pending} pending · {counts.in_progress} active · {counts.done} done
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`interactive-scale flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest font-bold transition-all ${
            showForm
              ? "bg-[#F2F2F7] border border-[#E5E5EA] text-[#6C6C70]"
              : "bg-[#007AFF]/10 border border-[#007AFF]/30 text-[#007AFF] hover:bg-primary/30"
          }`}
        >
          <span className="material-symbols-outlined text-sm">{showForm ? "close" : "add"}</span>
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-5 border-b border-[#E5E5EA] bg-[#F2F2F7] animate-slide-up space-y-4">
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to get done?"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-4 py-3 text-sm text-[#1C1C1E] placeholder-[#C6C6C8] focus:outline-none focus:border-[#007AFF]/40 focus:ring-1 focus:ring-[#007AFF]/20 transition-all"
          />
          <textarea
            value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Details... (optional)"
            rows={2}
            className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-4 py-3 text-sm text-[#3C3C43] placeholder-[#C6C6C8] resize-none focus:outline-none focus:border-[#007AFF]/40 transition-all"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93] mb-2">Energy needed</p>
              <div className="flex gap-1.5">
                {energyOptions.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setEnergyReq(o.value)}
                    title={o.label}
                    className={`flex-1 py-2 rounded-lg text-sm border transition-all interactive-scale ${
                      energyReq === o.value
                        ? "border-primary-fixed/40 bg-[#007AFF]/10 text-[#1C1C1E]"
                        : "border-[#E5E5EA] bg-[#F2F2F7] text-[#8E8E93] hover:border-[#007AFF]/30"
                    }`}
                  >
                    {o.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93] mb-2">Priority</p>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-[#F8F8F8] border border-[#E5E5EA] rounded-lg px-3 py-2 text-xs text-[#3C3C43] focus:outline-none focus:border-[#007AFF]/40"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8E93]">Estimated time</p>
              <span className="font-headline text-lg font-bold text-[#007AFF]">{minutes} min</span>
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
                ? "bg-gradient-to-r bg-[#007AFF] from-[#007AFF] to-[#007AFF] text-[#1C1C1E] shadow-[0_4px_16px_rgba(0,122,255,0.25)] interactive-scale"
                : "bg-[#F8F8F8] text-[#AEAEB2] cursor-not-allowed"
            }`}
          >
            Add Task
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex border-b border-[#E5E5EA]">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-3 text-[10px] font-semibold uppercase tracking-widest transition-all ${
              filter === tab.id
                ? "text-[#007AFF] border-b-2 border-primary-fixed"
                : "text-[#8E8E93] hover:text-[#6C6C70]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="divide-y divide-[#F2F2F7]">
        {sorted.length === 0 && (
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-4xl text-[#C6C6C8] block mb-2">checklist</span>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">
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
              ? "text-[#34C759]"
              : task.status === "in_progress"
              ? "text-[#007AFF]"
              : "text-[#AEAEB2] group-hover:text-[#8E8E93]"
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
            task.status === "done" ? "line-through text-[#8E8E93]" : "text-white/90"
          }`}>
            {task.title}
            {isMatch && energyLevel && (
              <span className="ml-1.5 text-[#34C759] text-xs" title="Good energy match">✦</span>
            )}
          </p>
          <span className={`shrink-0 text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${priorityChip(task.priority)}`}>
            {task.priority}
          </span>
        </div>
        {task.description && (
          <p className="text-xs text-[#8E8E93] mt-0.5 truncate">{task.description}</p>
        )}
        <p className="font-label text-[9px] text-[#AEAEB2] mt-1 uppercase tracking-wider">
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
