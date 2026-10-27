"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, formatDateTime } from "@/lib/utils";

interface Ticket { id: string; subject: string; description: string; category: string; priority: string; status: string; created_at: string; resolution: string | null; school_name: string | null; }

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-900/60 text-red-400",
  in_progress: "bg-blue-900/60 text-blue-400",
  resolved: "bg-emerald-900/60 text-emerald-400",
  closed: "bg-slate-700 text-slate-400",
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: "bg-red-900/60 text-red-400",
  high: "bg-orange-900/60 text-orange-400",
  medium: "bg-amber-900/60 text-amber-400",
  low: "bg-slate-700 text-slate-400",
};

export default function KathaySupportPage() {
  const { user, loading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    let q = supabase.from("support_tickets")
      .select("id, subject, description, category, priority, status, created_at, resolution, school_id, schools(name)")
      .order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) return setError(error.message);
    setTickets(((data ?? []) as Record<string, unknown>[]).map((t) => ({
      id: t.id as string, subject: t.subject as string, description: t.description as string,
      category: t.category as string, priority: t.priority as string, status: t.status as string,
      created_at: t.created_at as string, resolution: t.resolution as string | null,
      school_name: ((t.schools as Record<string, string> | null)?.name) ?? null,
    })));
  }, [filter]);

  useEffect(() => { if (!loading) void load(); }, [loading, load, filter]);

  async function updateTicket(id: string, updates: Record<string, unknown>) {
    setBusy(true);
    await supabase.from("support_tickets").update(updates).eq("id", id);
    setBusy(false);
    setEditing(null); setResolution("");
    void load();
  }

  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Support Queue</h2>
        <p className="mt-1 text-sm text-slate-400">
          Contracted technical support. Kathay provides hosting, integration support, updates,
          backups, device monitoring and incident investigation.
        </p>
      </div>
      {error && <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Open", value: open, color: "text-red-400" },
          { label: "In progress", value: inProgress, color: "text-blue-400" },
          { label: "Total", value: tickets.length, color: "text-white" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className={cn("mt-2 text-2xl font-bold", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "open", "in_progress", "resolved", "closed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize",
              filter === f ? "bg-blue-600 text-white" : "border border-slate-600 text-slate-400 hover:bg-slate-700")}>
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-8 text-center text-sm text-slate-500">No tickets.</div>
        ) : tickets.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[t.status])}>
                    {t.status.replace("_", " ")}
                  </span>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", PRIORITY_STYLES[t.priority])}>
                    {t.priority}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{t.category.replace("_", " ")}</span>
                  {t.school_name && <span className="text-xs text-slate-500">· {t.school_name}</span>}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-white">{t.subject}</h3>
                <p className="mt-1 text-xs text-slate-400">{t.description}</p>
                <div className="mt-1 text-xs text-slate-500">{formatDateTime(t.created_at)}</div>
                {t.resolution && (
                  <div className="mt-2 rounded-lg bg-emerald-900/20 border border-emerald-700/40 p-2 text-xs text-emerald-300">
                    <strong>Resolution:</strong> {t.resolution}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {t.status === "open" && (
                  <button onClick={() => updateTicket(t.id, { status: "in_progress", assigned_to: user?.id })}
                    disabled={busy}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                    Take ticket
                  </button>
                )}
                {t.status === "in_progress" && editing !== t.id && (
                  <button onClick={() => setEditing(t.id)}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700">
                    Resolve
                  </button>
                )}
                {editing === t.id && (
                  <div className="w-56 space-y-2">
                    <textarea className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" rows={3}
                      placeholder="Resolution notes…" value={resolution} onChange={(e) => setResolution(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => updateTicket(t.id, { status: "resolved", resolution, resolved_at: new Date().toISOString() })} disabled={busy}
                        className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                        {busy ? "…" : "Mark resolved"}
                      </button>
                      <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-600 px-2 py-1.5 text-xs text-slate-400">✕</button>
                    </div>
                  </div>
                )}
                {(t.status === "resolved") && (
                  <button onClick={() => updateTicket(t.id, { status: "closed" })} disabled={busy}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-700">
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
