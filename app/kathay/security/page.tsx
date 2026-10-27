"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/utils";

interface AuditRow { id: string; action: string; entity_type: string | null; created_at: string; school_name: string | null; }

export default function KathaySecurityPage() {
  const { loading } = useAuth();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("audit_logs")
      .select("id, action, entity_type, created_at, school_id, schools(name)")
      .order("created_at", { ascending: false }).limit(100);
    if (error) return setError(error.message);
    setLogs(((data ?? []) as Record<string, unknown>[]).map((l) => ({
      id: l.id as string, action: l.action as string,
      entity_type: l.entity_type as string | null, created_at: l.created_at as string,
      school_name: ((l.schools as Record<string, string> | null)?.name) ?? null,
    })));
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const controls = [
    { title: "Encrypted connections", desc: "All platform traffic uses TLS. Devices transmit minimal event data over encrypted channels.", status: "active" },
    { title: "Secure credential handling", desc: "API keys managed via Supabase secrets. Never hardcoded.", status: "active" },
    { title: "Device registration", desc: "Every gate device must be registered with a school before it can submit events.", status: "active" },
    { title: "Multi-tenant data isolation", desc: "RLS policies enforced at database level — schools can only see their own pupil records.", status: "active" },
    { title: "Audit logging", desc: "All data changes, corrections and administrative actions logged with editor, time and reason.", status: "active" },
    { title: "Encrypted backups", desc: "Regular encrypted backups with recovery testing and documented retention rules.", status: "active" },
    { title: "Role-based access control", desc: "Access enforced at DB/API level, not just the interface. Kathay support staff may view only data needed for authorised support.", status: "active" },
    { title: "Biometric data compliance", desc: "Biometric enrolment must not proceed until data-protection arrangements are documented and approved. Non-biometric alternative required.", status: "review" },
    { title: "Data return & deletion", desc: "Clear rules on data export, deletion and return when a school leaves the platform.", status: "review" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Security Controls</h2>
        <p className="mt-1 text-sm text-slate-400">
          The platform requires encrypted connections, secure credential handling, device
          registration, audit logs, encrypted backups, recovery testing and clear data rules.
        </p>
      </div>
      {error && <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {controls.map((c) => (
          <div key={c.title} className={`rounded-xl border p-4 ${c.status === "review" ? "border-amber-700/50 bg-amber-900/10" : "border-slate-700 bg-slate-800"}`}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">{c.title}</h3>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${c.status === "active" ? "bg-emerald-900/60 text-emerald-400" : "bg-amber-900/60 text-amber-400"}`}>
                {c.status === "active" ? "✓ Active" : "⚠ Review"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800">
        <div className="border-b border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-white">Platform audit log (all schools)</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No audit entries yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b border-slate-700 bg-slate-800 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Action</th>
                  <th className="px-4 py-2.5 text-left font-medium">Entity</th>
                  <th className="px-4 py-2.5 text-left font-medium">School</th>
                  <th className="px-4 py-2.5 text-left font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-2.5 font-medium text-slate-200">{l.action}</td>
                    <td className="px-4 py-2.5 text-slate-400">{l.entity_type ?? "—"}</td>
                    <td className="px-4 py-2.5 text-slate-500">{l.school_name ?? "Platform"}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
