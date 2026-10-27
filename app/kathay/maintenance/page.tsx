"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, formatDateTime } from "@/lib/utils";

interface MaintenanceRow { id: string; category: string; description: string; performed_at: string; school_name: string | null; }

const CATEGORIES = ["software_update", "incident_response", "device_check", "monthly_review", "renewal", "data_export", "security_patch", "other"];

export default function KathayMaintenancePage() {
  const { user, loading } = useAuth();
  const [logs, setLogs] = useState<MaintenanceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cat, setCat] = useState("software_update");
  const [desc, setDesc] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("maintenance_logs")
      .select("id, category, description, performed_at, school_id, schools(name)")
      .order("performed_at", { ascending: false }).limit(100);
    if (error) return setError(error.message);
    setLogs(((data ?? []) as Record<string, unknown>[]).map((m) => ({
      id: m.id as string, category: m.category as string, description: m.description as string,
      performed_at: m.performed_at as string,
      school_name: ((m.schools as Record<string, string> | null)?.name) ?? null,
    })));
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function logMaintenance(e: React.FormEvent) {
    e.preventDefault();
    if (!desc.trim()) return;
    setBusy(true); setError(null);
    const { error } = await supabase.from("maintenance_logs").insert([{
      category: cat, description: desc.trim(), performed_by: user?.id ?? null,
    }]);
    setBusy(false);
    if (error) return setError(error.message);
    setDesc("");
    void load();
  }

  const CAT_STYLES: Record<string, string> = {
    software_update: "bg-blue-900/60 text-blue-400",
    incident_response: "bg-red-900/60 text-red-400",
    device_check: "bg-violet-900/60 text-violet-400",
    monthly_review: "bg-indigo-900/60 text-indigo-400",
    security_patch: "bg-amber-900/60 text-amber-400",
    renewal: "bg-emerald-900/60 text-emerald-400",
    data_export: "bg-cyan-900/60 text-cyan-400",
    other: "bg-slate-700 text-slate-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Maintenance</h2>
        <p className="mt-1 text-sm text-slate-400">
          Software updates, incident response, device checks, monthly service review, invoices
          and renewal management — all Kathay managed-service responsibilities.
        </p>
      </div>
      {error && <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">{error}</div>}

      <form onSubmit={logMaintenance} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h3 className="text-sm font-semibold text-white">Log maintenance activity</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Category</label>
            <select className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
            <input required className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the maintenance activity performed" />
          </div>
        </div>
        <button type="submit" disabled={busy}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {busy ? "Logging…" : "Log activity"}
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["Software updates", "Incident response", "Device checks", "Monthly reviews"].map((item) => (
          <div key={item} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <div className="text-2xl">{item === "Software updates" ? "⬆" : item === "Incident response" ? "🚨" : item === "Device checks" ? "🔍" : "📋"}</div>
            <div className="mt-2 text-sm font-semibold text-white">{item}</div>
            <div className="mt-0.5 text-xs text-slate-500">
              {logs.filter((l) => l.category.includes(item.split(" ")[0].toLowerCase())).length} logged
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        <div className="border-b border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-white">Activity log ({logs.length})</h3>
        </div>
        {logs.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No maintenance logs yet.</p>
        ) : (
          <div className="divide-y divide-slate-700">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", CAT_STYLES[l.category] ?? "bg-slate-700 text-slate-400")}>
                      {l.category.replace(/_/g, " ")}
                    </span>
                    {l.school_name && <span className="text-xs text-slate-500">{l.school_name}</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{l.description}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-500">{formatDateTime(l.performed_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
