"use client";

import { useState, useRef } from "react";
import { Integration, Task, Note, IntegrationType } from "@/lib/types";
import { updateIntegration, createTask, createNote, generateId } from "@/lib/storage";

interface Props {
  integrations: Integration[];
  tasks: Task[];
  notes: Note[];
  onUpdateIntegrations: (i: Integration[]) => void;
  onImportTasks: (tasks: Task[]) => void;
  onImportNotes: (notes: Note[]) => void;
}

interface IntegrationMeta {
  id: IntegrationType;
  name: string;
  icon: string;
  description: string;
  color: string;
  iconColor: string;
}

const INTEGRATIONS: IntegrationMeta[] = [
  { id: "google_calendar", name: "Google Calendar", icon: "calendar_month",   description: "Sync events, meetings and time blocks with your Google Calendar.", color: "border-red-400/20 bg-red-400/[0.06]",    iconColor: "text-red-400"    },
  { id: "notion",          name: "Notion",          icon: "article",          description: "Import pages and database items as tasks or notes.",               color: "border-white/15  bg-white/[0.04]",       iconColor: "text-white/60"   },
  { id: "github",          name: "GitHub",          icon: "code",             description: "Pull open issues and PRs from your repositories as tasks.",        color: "border-white/15  bg-white/[0.04]",       iconColor: "text-white/60"   },
  { id: "excel",           name: "Excel / CSV",     icon: "table_chart",      description: "Import tasks from any Excel or CSV spreadsheet.",                  color: "border-green-400/20 bg-green-400/[0.06]",iconColor: "text-green-400"  },
  { id: "linkedin",        name: "LinkedIn",        icon: "work",             description: "Link your LinkedIn profile for career context in planning.",       color: "border-secondary/20 bg-secondary/[0.06]",iconColor: "text-secondary"  },
];

export default function IntegrationsHub({
  integrations, tasks, notes,
  onUpdateIntegrations, onImportTasks, onImportNotes,
}: Props) {
  const [activeId, setActiveId] = useState<IntegrationType | null>(null);
  const [loading,  setLoading]  = useState<IntegrationType | null>(null);
  const [feedback, setFeedback] = useState<{ id: IntegrationType; msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const getIntegration = (id: IntegrationType) =>
    integrations.find((i) => i.id === id) ?? { id, connected: false, config: {}, importedCount: 0 };

  const updateConfig = (id: IntegrationType, key: string, value: string) => {
    onUpdateIntegrations(updateIntegration(integrations, id, {
      config: { ...getIntegration(id).config, [key]: value },
    }));
  };

  const disconnect = (id: IntegrationType) => {
    onUpdateIntegrations(updateIntegration(integrations, id, {
      connected: false, config: {}, lastSynced: undefined, importedCount: 0,
    }));
    setFeedback(null);
  };

  // ── GitHub ─────────────────────────────────────────────────────────────────

  const connectGitHub = async () => {
    const cfg = getIntegration("github").config;
    if (!cfg.token || !cfg.repo) return;
    setLoading("github");
    try {
      const res = await fetch("/api/integrations/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cfg.token, repo: cfg.repo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const imported: Task[] = (data.issues ?? []).map((issue: { title: string; body?: string; url: string; number: number }) =>
        createTask({
          title: `[GH #${issue.number}] ${issue.title}`,
          description: `${issue.url}${issue.body ? `\n\n${issue.body.slice(0, 200)}` : ""}`,
          energyRequired: "medium",
          priority: "medium",
          estimatedMinutes: 60,
          tags: ["github"],
        })
      );
      onImportTasks(imported);
      onUpdateIntegrations(updateIntegration(integrations, "github", {
        connected: true,
        lastSynced: new Date().toISOString(),
        importedCount: imported.length,
      }));
      setFeedback({ id: "github", msg: `Imported ${imported.length} issue${imported.length !== 1 ? "s" : ""} as tasks`, ok: true });
    } catch (err) {
      setFeedback({ id: "github", msg: err instanceof Error ? err.message : "Connection failed", ok: false });
    } finally {
      setLoading(null);
    }
  };

  // ── Notion ─────────────────────────────────────────────────────────────────

  const connectNotion = async () => {
    const cfg = getIntegration("notion").config;
    if (!cfg.apiKey || !cfg.databaseId) return;
    setLoading("notion");
    try {
      const res = await fetch("/api/integrations/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: cfg.apiKey, databaseId: cfg.databaseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const importedTasks: Task[] = (data.tasks ?? []).map((t: { title: string; url?: string }) =>
        createTask({
          title: t.title,
          description: t.url ? `Notion: ${t.url}` : undefined,
          energyRequired: "medium",
          priority: "medium",
          estimatedMinutes: 45,
          tags: ["notion"],
        })
      );
      const importedNotes: Note[] = (data.notes ?? []).map((n: { title: string; content?: string; url?: string }) =>
        createNote({
          title: n.title,
          content: n.content ?? (n.url ? `Source: ${n.url}` : ""),
          priority: "low",
          color: "default",
          isPinned: false,
          tags: ["notion"],
        })
      );
      if (importedTasks.length) onImportTasks(importedTasks);
      if (importedNotes.length) onImportNotes(importedNotes);
      onUpdateIntegrations(updateIntegration(integrations, "notion", {
        connected: true,
        lastSynced: new Date().toISOString(),
        importedCount: importedTasks.length + importedNotes.length,
      }));
      setFeedback({ id: "notion", msg: `Imported ${importedTasks.length} tasks + ${importedNotes.length} notes`, ok: true });
    } catch (err) {
      setFeedback({ id: "notion", msg: err instanceof Error ? err.message : "Connection failed", ok: false });
    } finally {
      setLoading(null);
    }
  };

  // ── CSV / Excel ─────────────────────────────────────────────────────────────

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = text.split("\n").map((r) => r.split(",").map((c) => c.replace(/^"|"$/g, "").trim()));
      const header = rows[0].map((h) => h.toLowerCase());
      const titleIdx    = header.findIndex((h) => ["title", "task", "name", "subject"].some((k) => h.includes(k)));
      const priorityIdx = header.findIndex((h) => h.includes("priority"));
      const minsIdx     = header.findIndex((h) => ["minutes", "duration", "time", "mins"].some((k) => h.includes(k)));
      const descIdx     = header.findIndex((h) => ["description", "notes", "details", "body"].some((k) => h.includes(k)));

      const imported = rows
        .slice(1)
        .filter((r) => r[titleIdx]?.trim())
        .map((r) => {
          const rawPri = r[priorityIdx]?.toLowerCase() ?? "";
          const priority = rawPri.includes("high") ? "high" : rawPri.includes("low") ? "low" : "medium";
          return createTask({
            title: r[titleIdx],
            description: descIdx >= 0 ? r[descIdx] : undefined,
            energyRequired: "medium",
            priority,
            estimatedMinutes: minsIdx >= 0 && Number(r[minsIdx]) > 0 ? Number(r[minsIdx]) : 30,
            tags: ["csv"],
          });
        });

      onImportTasks(imported);
      onUpdateIntegrations(updateIntegration(integrations, "excel", {
        connected: true,
        lastSynced: new Date().toISOString(),
        importedCount: imported.length,
      }));
      setFeedback({ id: "excel", msg: `Imported ${imported.length} task${imported.length !== 1 ? "s" : ""} from CSV`, ok: true });
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── LinkedIn ────────────────────────────────────────────────────────────────

  const saveLinkedIn = () => {
    const cfg = getIntegration("linkedin").config;
    if (!cfg.profileUrl) return;
    onUpdateIntegrations(updateIntegration(integrations, "linkedin", {
      connected: true,
      lastSynced: new Date().toISOString(),
    }));
    setFeedback({ id: "linkedin", msg: "LinkedIn profile linked", ok: true });
  };

  // ── Google Calendar ─────────────────────────────────────────────────────────

  const saveGCal = () => {
    onUpdateIntegrations(updateIntegration(integrations, "google_calendar", { connected: true }));
    setFeedback({ id: "google_calendar", msg: "Setup noted — see Calendar tab to add events manually", ok: true });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-headline text-3xl italic text-white">Connect</h3>
        <p className="font-label text-[9px] uppercase tracking-widest text-white/30">
          Integrations · {integrations.filter((i) => i.connected).length} connected
        </p>
      </div>

      <div className="space-y-3">
        {INTEGRATIONS.map((meta) => {
          const integration = getIntegration(meta.id);
          const isActive    = activeId === meta.id;
          const isLoading   = loading === meta.id;
          const fb          = feedback?.id === meta.id ? feedback : null;
          const cfg         = integration.config;

          return (
            <div key={meta.id} className={`glass-card rounded-lg overflow-hidden border ${meta.color}`}>
              {/* Row */}
              <button
                className="w-full flex items-center gap-4 p-4 text-left interactive-scale"
                onClick={() => setActiveId(isActive ? null : meta.id)}
              >
                <div className={`w-10 h-10 rounded-lg glass-dark border border-white/10 flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined text-xl ${meta.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {meta.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-semibold text-white/85">{meta.name}</p>
                    {integration.connected && (
                      <span className="flex items-center gap-1 font-label text-[8px] uppercase tracking-widest text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                        <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="font-label text-[9px] text-white/30 mt-0.5">{meta.description}</p>
                  {integration.lastSynced && (
                    <p className="font-label text-[8px] text-white/20 mt-0.5">
                      Last synced {new Date(integration.lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {integration.importedCount != null && integration.importedCount > 0 && ` · ${integration.importedCount} items`}
                    </p>
                  )}
                </div>
                <span className={`material-symbols-outlined text-sm text-white/25 transition-transform ${isActive ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>

              {/* Expanded config panel */}
              {isActive && (
                <div className="border-t border-white/[0.07] p-4 space-y-3 animate-slide-up">

                  {/* Feedback */}
                  {fb && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                      fb.ok ? "bg-green-500/10 border-green-500/25 text-green-400" : "bg-red-500/10 border-red-500/25 text-red-400"
                    }`}>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {fb.ok ? "check_circle" : "error"}
                      </span>
                      {fb.msg}
                    </div>
                  )}

                  {/* ── GitHub config ── */}
                  {meta.id === "github" && (
                    <>
                      <div>
                        <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Personal Access Token</p>
                        <input
                          type="password"
                          value={cfg.token ?? ""}
                          onChange={(e) => updateConfig("github", "token", e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-secondary/40 font-mono"
                        />
                        <p className="font-label text-[8px] text-white/20 mt-1">
                          Generate at github.com → Settings → Developer settings → Personal access tokens
                        </p>
                      </div>
                      <div>
                        <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Repository</p>
                        <input
                          type="text"
                          value={cfg.repo ?? ""}
                          onChange={(e) => updateConfig("github", "repo", e.target.value)}
                          placeholder="owner/repository-name"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-secondary/40 font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={connectGitHub}
                          disabled={!cfg.token || !cfg.repo || isLoading}
                          className={`flex-1 py-2.5 rounded-lg font-label text-[10px] uppercase tracking-widest font-bold transition-all glimmer-btn flex items-center justify-center gap-2 ${
                            cfg.token && cfg.repo && !isLoading
                              ? "bg-gradient-to-r from-primary to-primary-dim text-white interactive-scale"
                              : "bg-white/5 text-white/20 cursor-not-allowed"
                          }`}
                        >
                          {isLoading ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span> : <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>}
                          {isLoading ? "Syncing…" : "Sync Issues"}
                        </button>
                        {integration.connected && (
                          <button onClick={() => disconnect("github")} className="px-4 py-2.5 rounded-lg glass-dark border border-white/10 text-white/40 font-label text-[10px] uppercase tracking-widest interactive-scale">
                            Disconnect
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── Notion config ── */}
                  {meta.id === "notion" && (
                    <>
                      <div>
                        <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Integration Token</p>
                        <input
                          type="password"
                          value={cfg.apiKey ?? ""}
                          onChange={(e) => updateConfig("notion", "apiKey", e.target.value)}
                          placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-secondary/40 font-mono"
                        />
                        <p className="font-label text-[8px] text-white/20 mt-1">
                          Create at notion.so → Settings → Integrations → New Integration
                        </p>
                      </div>
                      <div>
                        <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Database ID</p>
                        <input
                          type="text"
                          value={cfg.databaseId ?? ""}
                          onChange={(e) => updateConfig("notion", "databaseId", e.target.value)}
                          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-secondary/40 font-mono"
                        />
                        <p className="font-label text-[8px] text-white/20 mt-1">
                          Copy from your Notion database URL: notion.so/[workspace]/[DATABASE_ID]?v=...
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={connectNotion}
                          disabled={!cfg.apiKey || !cfg.databaseId || isLoading}
                          className={`flex-1 py-2.5 rounded-lg font-label text-[10px] uppercase tracking-widest font-bold transition-all glimmer-btn flex items-center justify-center gap-2 ${
                            cfg.apiKey && cfg.databaseId && !isLoading
                              ? "bg-gradient-to-r from-primary to-primary-dim text-white interactive-scale"
                              : "bg-white/5 text-white/20 cursor-not-allowed"
                          }`}
                        >
                          {isLoading ? <span className="material-symbols-outlined text-sm animate-spin">refresh</span> : <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>}
                          {isLoading ? "Syncing…" : "Sync Notion"}
                        </button>
                        {integration.connected && (
                          <button onClick={() => disconnect("notion")} className="px-4 py-2.5 rounded-lg glass-dark border border-white/10 text-white/40 font-label text-[10px] uppercase tracking-widest interactive-scale">
                            Disconnect
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── Google Calendar config ── */}
                  {meta.id === "google_calendar" && (
                    <>
                      <div className="glass-dark rounded-lg border border-secondary/15 p-3.5 space-y-2">
                        <p className="font-label text-[9px] uppercase tracking-widest text-secondary/60">Setup Instructions</p>
                        <ol className="text-xs text-white/40 leading-relaxed space-y-1 list-decimal list-inside">
                          <li>Go to <span className="text-secondary/60">console.cloud.google.com</span></li>
                          <li>Create a project → Enable Google Calendar API</li>
                          <li>Create OAuth 2.0 credentials → Web Application</li>
                          <li>Add to <span className="text-secondary/60">.env.local</span>: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET</li>
                          <li>Until then, add events manually in the Planner tab</li>
                        </ol>
                      </div>
                      <button onClick={saveGCal} className="w-full py-2.5 rounded-lg glass-dark border border-white/15 text-white/50 font-label text-[10px] uppercase tracking-widest interactive-scale">
                        Mark as Set Up
                      </button>
                    </>
                  )}

                  {/* ── CSV / Excel config ── */}
                  {meta.id === "excel" && (
                    <>
                      <div className="glass-dark rounded-lg border border-white/[0.07] p-3.5 space-y-1.5">
                        <p className="font-label text-[9px] uppercase tracking-widest text-white/30">Supported columns</p>
                        <p className="text-xs text-white/40 leading-relaxed">
                          <span className="text-white/60">title/task/name</span> · <span className="text-white/60">priority</span> (high/medium/low) · <span className="text-white/60">description/notes</span> · <span className="text-white/60">minutes/duration</span>
                        </p>
                        <p className="text-xs text-white/25">First row must be headers. Exported from Excel, Google Sheets, or Notion.</p>
                      </div>
                      <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSV} />
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="glimmer-btn w-full py-2.5 rounded-lg font-label text-[10px] uppercase tracking-widest font-bold bg-gradient-to-r from-green-600 to-green-700 text-white interactive-scale flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
                        Upload CSV / Excel
                      </button>
                    </>
                  )}

                  {/* ── LinkedIn config ── */}
                  {meta.id === "linkedin" && (
                    <>
                      <div>
                        <p className="font-label text-[9px] uppercase tracking-widest text-white/30 mb-1.5">Profile URL</p>
                        <input
                          type="url"
                          value={cfg.profileUrl ?? ""}
                          onChange={(e) => updateConfig("linkedin", "profileUrl", e.target.value)}
                          placeholder="https://linkedin.com/in/your-username"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-secondary/40"
                        />
                        <p className="font-label text-[8px] text-white/20 mt-1">
                          LinkedIn&apos;s API is read-only and restricted. This links your profile for quick access.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveLinkedIn}
                          disabled={!cfg.profileUrl}
                          className={`flex-1 py-2.5 rounded-lg font-label text-[10px] uppercase tracking-widest font-bold transition-all ${
                            cfg.profileUrl
                              ? "bg-gradient-to-r from-secondary/80 to-secondary text-[#0d1f30] interactive-scale"
                              : "bg-white/5 text-white/20 cursor-not-allowed"
                          }`}
                        >
                          Save Profile
                        </button>
                        {integration.connected && cfg.profileUrl && (
                          <a
                            href={cfg.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-lg glass-dark border border-secondary/20 text-secondary font-label text-[10px] uppercase tracking-widest interactive-scale flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            View
                          </a>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="glass-card rounded-lg p-4">
        <p className="font-label text-[9px] uppercase tracking-widest text-white/25 mb-3">Workspace</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "task_alt",  label: "Tasks",  value: tasks.length,  color: "text-primary-fixed" },
            { icon: "edit_note", label: "Notes",  value: notes.length,  color: "text-secondary"     },
            { icon: "hub",       label: "Connected", value: integrations.filter((i) => i.connected).length, color: "text-green-400" },
          ].map((s) => (
            <div key={s.label}>
              <span className={`material-symbols-outlined text-xl ${s.color} block mb-1`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className={`font-headline text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="font-label text-[8px] uppercase tracking-widest text-white/25 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
