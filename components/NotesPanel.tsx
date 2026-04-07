"use client";

import { useState } from "react";
import { Note, TaskPriority } from "@/lib/types";
import { createNote, generateId } from "@/lib/storage";

interface Props {
  notes: Note[];
  onUpdate: (notes: Note[]) => void;
}

const NOTE_COLORS = [
  { label: "Default", value: "default",  bg: "bg-[#0C0C0C]",     border: "border-[#2A2A2A]"      },
  { label: "Red",     value: "red",      bg: "bg-primary/[0.12]",   border: "border-primary/25"    },
  { label: "Blue",    value: "blue",     bg: "bg-[#FF3D9A]/10", border: "border-[#FF3D9A]/20"  },
  { label: "Amber",   value: "amber",    bg: "bg-amber-500/[0.10]", border: "border-amber-500/25"  },
  { label: "Green",   value: "green",    bg: "bg-green-500/[0.10]", border: "border-green-500/25"  },
  { label: "Cream",   value: "cream",    bg: "bg-[#FFB830]/10",  border: "border-[#FFB830]/20"   },
];

const PRIORITY_STYLE: Record<TaskPriority, { dot: string; label: string; text: string }> = {
  high:   { dot: "bg-primary-fixed", label: "High",   text: "text-[#FFD60A]" },
  medium: { dot: "bg-amber-400",     label: "Medium", text: "text-[#FFB830]"     },
  low:    { dot: "bg-secondary",     label: "Low",    text: "text-[#FF3D9A]"     },
};

function colorStyle(color: string) {
  return NOTE_COLORS.find((c) => c.value === color) ?? NOTE_COLORS[0];
}

export default function NotesPanel({ notes, onUpdate }: Props) {
  const [editId, setEditId]       = useState<string | null>(null);
  const [showNew, setShowNew]     = useState(false);
  const [search, setSearch]       = useState("");
  const [filterPri, setFilterPri] = useState<TaskPriority | "all">("all");

  // New note form state
  const [nTitle,    setNTitle]    = useState("");
  const [nContent,  setNContent]  = useState("");
  const [nPriority, setNPriority] = useState<TaskPriority>("low");
  const [nColor,    setNColor]    = useState("default");
  const [nTags,     setNTags]     = useState("");

  // Edit note state
  const [eTitle,    setETitle]    = useState("");
  const [eContent,  setEContent]  = useState("");
  const [ePriority, setEPriority] = useState<TaskPriority>("low");
  const [eColor,    setEColor]    = useState("default");
  const [eTags,     setETags]     = useState("");

  const openEdit = (note: Note) => {
    setEditId(note.id);
    setETitle(note.title);
    setEContent(note.content);
    setEPriority(note.priority);
    setEColor(note.color);
    setETags(note.tags.join(", "));
    setShowNew(false);
  };

  const saveEdit = () => {
    if (!editId) return;
    onUpdate(notes.map((n) =>
      n.id === editId
        ? { ...n, title: eTitle.trim(), content: eContent, priority: ePriority, color: eColor, tags: eTags.split(",").map((t) => t.trim()).filter(Boolean), updatedAt: new Date().toISOString() }
        : n
    ));
    setEditId(null);
  };

  const addNote = () => {
    if (!nTitle.trim() && !nContent.trim()) return;
    const note = createNote({
      title: nTitle.trim() || "Untitled",
      content: nContent,
      priority: nPriority,
      color: nColor,
      isPinned: false,
      tags: nTags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    onUpdate([note, ...notes]);
    setNTitle(""); setNContent(""); setNPriority("low"); setNColor("default"); setNTags("");
    setShowNew(false);
  };

  const deleteNote  = (id: string) => onUpdate(notes.filter((n) => n.id !== id));
  const togglePin   = (id: string) => onUpdate(notes.map((n) => n.id === id ? { ...n, isPinned: !n.isPinned } : n));

  const filtered = notes
    .filter((n) => {
      const q = search.toLowerCase();
      const matchSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q));
      const matchPri = filterPri === "all" || n.priority === filterPri;
      return matchSearch && matchPri;
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[22px] font-bold text-[#FFFDE7]">Notes</h3>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AA7790]">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setShowNew(!showNew); setEditId(null); }}
          className={`interactive-scale flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest font-bold transition-all ${
            showNew
              ? "bg-[#0C0C0C] border border-[#2A2A2A] text-[#FF9FCA]"
              : "bg-[#FFD60A]/10 border border-[#FFD60A]/30 text-[#FFD60A] hover:bg-primary/30"
          }`}
        >
          <span className="material-symbols-outlined text-sm">{showNew ? "close" : "edit_note"}</span>
          {showNew ? "Cancel" : "New Note"}
        </button>
      </div>

      {/* New note form */}
      {showNew && (
        <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] shadow-sm p-4 space-y-3 animate-slide-up border border-[#2A2A2A]">
          <input
            autoFocus
            type="text" value={nTitle} onChange={(e) => setNTitle(e.target.value)}
            placeholder="Title…"
            className="w-full bg-transparent border-b border-[#2A2A2A] pb-2 text-lg font-headline italic text-[#FFFDE7] placeholder-[#C6C6C8] focus:outline-none focus:border-[#FFD60A]/40"
          />
          <textarea
            value={nContent} onChange={(e) => setNContent(e.target.value)}
            placeholder="Write your note…"
            rows={5}
            className="w-full bg-transparent text-sm text-[#FF9FCA] placeholder-[#C6C6C8] resize-none focus:outline-none leading-relaxed"
          />
          <input
            type="text" value={nTags} onChange={(e) => setNTags(e.target.value)}
            placeholder="Tags: work, ideas, personal…"
            className="w-full bg-[#141414] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#FF9FCA] placeholder-[#C6C6C8] focus:outline-none"
          />

          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Priority */}
            <div className="flex gap-1.5">
              {(["high", "medium", "low"] as TaskPriority[]).map((p) => {
                const s = PRIORITY_STYLE[p];
                return (
                  <button
                    key={p}
                    onClick={() => setNPriority(p)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[10px] font-semibold uppercase tracking-widest transition-all interactive-scale ${
                      nPriority === p
                        ? `bg-[#0C0C0C] border-[#FFD60A]/25 ${s.text}`
                        : "bg-[#0C0C0C] border-[#2A2A2A] text-[#AA7790]"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {p}
                  </button>
                );
              })}
            </div>
            {/* Color */}
            <div className="flex gap-1.5">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setNColor(c.value)}
                  title={c.label}
                  className={`w-5 h-5 rounded-full ${c.bg} border ${c.border} interactive-scale transition-all ${nColor === c.value ? "ring-2 ring-white/40 ring-offset-1 ring-offset-transparent" : ""}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={addNote}
            disabled={!nTitle.trim() && !nContent.trim()}
            className={`w-full py-2.5 rounded-lg font-label text-[10px] uppercase tracking-[0.2em] font-bold transition-all glimmer-btn ${
              nTitle.trim() || nContent.trim()
                ? "bg-gradient-to-r bg-[#FFD60A] from-[#FFD60A] to-[#FFD60A] text-[#FFFDE7] shadow-[0_4px_16px_rgba(0,122,255,0.25)] interactive-scale"
                : "bg-[#141414] text-[#AA7790] cursor-not-allowed"
            }`}
          >
            Save Note
          </button>
        </div>
      )}

      {/* Search + filter */}
      {notes.length > 0 && (
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#AA7790]">search</span>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full bg-[#0C0C0C] border border-[#2A2A2A] rounded-lg pl-9 pr-4 py-2 text-sm text-[#FF9FCA] placeholder-[#C6C6C8] focus:outline-none focus:border-[#2A2A2A]"
            />
          </div>
          <select
            value={filterPri}
            onChange={(e) => setFilterPri(e.target.value as TaskPriority | "all")}
            className="bg-[#0C0C0C] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-[#FF9FCA] focus:outline-none"
          >
            <option value="all">All</option>
            <option value="high">⚡ High</option>
            <option value="medium">🔔 Medium</option>
            <option value="low">💤 Low</option>
          </select>
        </div>
      )}

      {/* Notes grid */}
      {filtered.length === 0 && !showNew && (
        <div className="py-12 text-center">
          <span className="material-symbols-outlined text-5xl text-[#C6C6C8] block mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>
            edit_note
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AA7790]">
            {notes.length > 0 ? "No notes match your search" : "Your notes will appear here"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((note) => {
          const cs = colorStyle(note.color);
          const ps = PRIORITY_STYLE[note.priority];
          const isEditing = editId === note.id;

          return (
            <div
              key={note.id}
              className={`rounded-lg border p-4 space-y-2 transition-all group relative ${cs.bg} ${cs.border} ${
                isEditing ? "ring-1 ring-secondary/40 col-span-full" : ""
              }`}
            >
              {isEditing ? (
                /* ── Edit mode ── */
                <div className="space-y-3">
                  <input
                    autoFocus
                    value={eTitle} onChange={(e) => setETitle(e.target.value)}
                    className="w-full bg-transparent border-b border-[#2A2A2A] pb-2 text-lg font-headline italic text-[#FFFDE7] placeholder-[#C6C6C8] focus:outline-none"
                  />
                  <textarea
                    value={eContent} onChange={(e) => setEContent(e.target.value)}
                    rows={6}
                    className="w-full bg-transparent text-sm text-[#FF9FCA] resize-none focus:outline-none leading-relaxed"
                  />
                  <input
                    value={eTags} onChange={(e) => setETags(e.target.value)}
                    placeholder="Tags…"
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded px-3 py-1.5 text-xs text-[#FF9FCA] focus:outline-none"
                  />
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-1.5">
                      {(["high", "medium", "low"] as TaskPriority[]).map((p) => {
                        const s = PRIORITY_STYLE[p];
                        return (
                          <button key={p} onClick={() => setEPriority(p)}
                            className={`flex items-center gap-1 px-2 py-1 rounded border font-label text-[8px] uppercase tracking-wider transition-all ${
                              ePriority === p ? `bg-[#0C0C0C] border-[#FFD60A]/25 ${s.text}` : "bg-[#0C0C0C] border-[#2A2A2A] text-[#AA7790]"
                            }`}
                          >
                            <div className={`w-1 h-1 rounded-full ${s.dot}`} />{p}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5">
                      {NOTE_COLORS.map((c) => (
                        <button key={c.value} onClick={() => setEColor(c.value)} title={c.label}
                          className={`w-4 h-4 rounded-full ${c.bg} border ${c.border} interactive-scale ${eColor === c.value ? "ring-1 ring-white/40" : ""}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex-1 py-2 rounded bg-gradient-to-r bg-[#FFD60A] from-[#FFD60A] to-[#FFD60A] text-[#FFFDE7] text-[10px] font-semibold uppercase tracking-widest">Save</button>
                    <button onClick={() => setEditId(null)} className="px-4 py-2 rounded bg-[#0C0C0C] border border-[#2A2A2A] text-[#AA7790] text-[10px] font-semibold uppercase tracking-widest">Cancel</button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {note.isPinned && (
                          <span className="material-symbols-outlined text-xs text-[#FFB830]" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                        )}
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ps.dot}`} />
                        <h4 className="text-sm font-semibold text-white/90 leading-snug truncate">{note.title}</h4>
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <button onClick={() => togglePin(note.id)} title="Pin" className="text-[#AA7790] hover:text-[#FFB830] transition-colors">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: note.isPinned ? "'FILL' 1" : "'FILL' 0" }}>push_pin</span>
                      </button>
                      <button onClick={() => openEdit(note)} title="Edit" className="text-[#AA7790] hover:text-[#FF9FCA] transition-colors">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => deleteNote(note.id)} title="Delete" className="text-[#AA7790] hover:text-[#FF3B30]/70 transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>

                  {note.content && (
                    <p className="text-xs text-[#FF9FCA] leading-relaxed line-clamp-4 whitespace-pre-wrap">{note.content}</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map((tag) => (
                        <span key={tag} className="font-label text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0C0C0C] border border-[#2A2A2A] text-[#AA7790]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="font-label text-[8px] text-white/15 shrink-0">
                      {new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
