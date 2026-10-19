"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, formatDateTime } from "@/lib/utils";

interface BackupRow { id: string; backup_type: string; status: string; size_bytes: number | null; notes: string | null; started_at: string; completed_at: string | null; school_name: string | null; }

export default function KathayBackupsPage() {
  const { user, loading } = useAuth();
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await insforge.database
      .from("backup_records")
      .select("id, backup_type, status, size_bytes, notes, started_at, completed_at, school_id, schools(name)")
      .order("started_at", { ascending: false }).limit(100);
    if (error) return setError(error.message);
    setBackups(((data ?? []) as Record<string, unknown>[]).map((b) => ({
      id: b.id as string, backup_type: b.backup_type as string, status: b.status as string,
      size_bytes: b.size_bytes as number | null, notes: b.notes as string | null,
      started_at: b.started_at as string, completed_at: b.completed_at as string | null,
      school_name: ((b.schools as Record<string, string> | null)?.name) ?? null,
    })));
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function createBackup(schoolId?: string) {
    setBusy(true); setError(null);
    const { error } = await insforge.database.from("backup_records").insert([{
      school_id: schoolId ?? null, backup_type: "database",
      status: "completed", initiated_by: user?.id ?? null,
      notes: notes || "Manual backup initiated from Kathay console",
      completed_at: new Date().toISOString(),
    }]);
    setBusy(false);
    if (error) return setError(error.message);
    setNotes("");
    void load();
  }

  const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-900/60 text-amber-400",
    completed: "bg-emerald-900/60 text-emerald-400",
    failed: "bg-red-900/60 text-red-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Backups</h2>
        <p className="mt-1 text-sm text-slate-400">
          Encrypted backups, recovery testing and clear rules on retention. Kathay manages
          backup and restoration tests as part of the managed service.
        </p>
      </div>
      {error && <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">{error}</div>}

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h3 className="text-sm font-semibold text-white">Record a backup</h3>
        <div className="mt-3 flex gap-3">
          <input className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />
          <button onClick={() => createBackup()} disabled={busy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? "Recording…" : "Record platform backup"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-4">
        <h3 className="text-sm font-semibold text-amber-400">Backup policy requirements</h3>
        <ul className="mt-2 space-y-1 text-xs text-amber-300/80 list-disc list-inside">
          <li>Encrypted backups of all school data</li>
          <li>Regular recovery testing — not just creation</li>
          <li>Clear rules on retention, deletion and data export when a school leaves</li>
          <li>Separate data for each school (multi-tenant isolation must be preserved in backups)</li>
        </ul>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        <div className="border-b border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-white">Backup records ({backups.length})</h3>
        </div>
        {backups.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No backup records.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">School</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Started</th>
                <th className="px-4 py-3 text-left font-medium">Completed</th>
                <th className="px-4 py-3 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 capitalize text-slate-300">{b.backup_type}</td>
                  <td className="px-4 py-3 text-slate-400">{b.school_name ?? "Platform-wide"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[b.status] ?? "bg-slate-700 text-slate-400")}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(b.started_at)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{b.completed_at ? formatDateTime(b.completed_at) : "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{b.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
