"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";

export default function AuditPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setError(null);
    const { data, error } = await supabase.from("audit_logs")
      .select("id, user_id, action, entity_type, entity_id, created_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return setError(error.message);
    setLogs((data as AuditLog[] | null) ?? []);
  }, [schoolId]);

  useEffect(() => {
    if (!loading) void load();
  }, [loading, load]);

  if (!schoolId) {
    return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Audit log</h2>
        <p className="mt-1 text-sm text-slate-500">
          Encrypted connections, secure credential handling, device registration, audit logs
          and authorised changes — retained for review.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card p-0">
        {logs.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No audit entries yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Entity</th>
                <th className="px-4 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{l.action}</td>
                  <td className="px-4 py-2.5 text-slate-600">{l.entity_type ?? "—"} {l.entity_id ? `· ${l.entity_id.slice(0, 8)}` : ""}</td>
                  <td className="px-4 py-2.5 text-slate-600">{formatDateTime(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
