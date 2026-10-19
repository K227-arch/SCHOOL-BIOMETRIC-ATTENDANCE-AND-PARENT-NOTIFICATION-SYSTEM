"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, fullName } from "@/lib/utils";
import type { Guardian, Pupil } from "@/lib/types";

interface ParentAccount { id: string; user_id: string; guardian_id: string | null; verified: boolean; created_at: string; }

export default function SchoolGuardiansPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [pupilMap, setPupilMap] = useState<Record<string, Pupil>>({});
  const [parentAccounts, setParentAccounts] = useState<ParentAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setError(null);
    let q = insforge.database.from("guardians")
      .select("id, pupil_id, full_name, relationship, phone_number, email, is_primary, receives_sms")
      .eq("school_id", schoolId).order("full_name").limit(200);
    if (search.trim()) q = q.ilike("full_name", `%${search}%`);
    const { data: gRows, error: gErr } = await q;
    if (gErr) return setError(gErr.message);
    const g = (gRows as Guardian[] | null) ?? [];
    setGuardians(g);

    const pupilIds = [...new Set(g.map((x) => x.pupil_id))];
    if (pupilIds.length) {
      const { data: pRows } = await insforge.database.from("pupils")
        .select("id, first_name, last_name, admission_number, class_name")
        .in("id", pupilIds).limit(pupilIds.length);
      const map: Record<string, Pupil> = {};
      (pRows as Pupil[] | null)?.forEach((p) => (map[p.id] = p));
      setPupilMap(map);
    }

    const { data: paRows } = await insforge.database.from("parent_accounts")
      .select("id, user_id, guardian_id, verified, created_at")
      .eq("school_id", schoolId).order("created_at", { ascending: false }).limit(200);
    setParentAccounts((paRows as ParentAccount[] | null) ?? []);
  }, [schoolId, search]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function toggleVerified(pa: ParentAccount) {
    setBusy(true);
    await insforge.database.from("parent_accounts").update({ verified: !pa.verified }).eq("id", pa.id);
    setBusy(false);
    void load();
  }

  const pendingAccounts = parentAccounts.filter((pa) => !pa.verified);

  if (!schoolId) return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Guardians</h2>
        <p className="mt-1 text-sm text-slate-500">
          Verified parent contacts and parent portal account requests awaiting approval.
        </p>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {pendingAccounts.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900">⚠ Pending parent portal requests ({pendingAccounts.length})</h3>
          <p className="mt-1 text-xs text-slate-500">These parents have requested access. Verify their identity and approve.</p>
          <div className="mt-3 divide-y divide-slate-100">
            {pendingAccounts.map((pa) => {
              const g = guardians.find((x) => x.id === pa.guardian_id);
              return (
                <div key={pa.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{g?.full_name ?? pa.user_id.slice(0, 8)}</div>
                    <div className="text-xs text-slate-500">{g?.phone_number ?? "—"} · {g?.relationship ?? "Guardian"}</div>
                  </div>
                  <button onClick={() => toggleVerified(pa)} disabled={busy}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                    Approve
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card p-0">
        <div className="border-b border-slate-200 p-4">
          <input className="input" placeholder="Search guardians…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="max-h-[32rem] overflow-y-auto">
          {guardians.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No guardians found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Guardian</th>
                  <th className="px-4 py-2.5 font-medium">Pupil</th>
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5 font-medium">SMS</th>
                  <th className="px-4 py-2.5 font-medium">Portal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guardians.map((g) => {
                  const p = pupilMap[g.pupil_id];
                  const pa = parentAccounts.find((x) => x.guardian_id === g.id);
                  return (
                    <tr key={g.id}>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900">{g.full_name}</div>
                        <div className="text-xs text-slate-500">{g.relationship ?? "—"}{g.is_primary && " · Primary"}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{p ? fullName(p.first_name, p.last_name) : "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{g.phone_number}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("badge", g.receives_sms ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>
                          {g.receives_sms ? "On" : "Off"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {pa ? (
                          <span className={cn("badge", pa.verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
                            {pa.verified ? "Verified" : "Pending"}
                          </span>
                        ) : (
                          <span className="badge bg-slate-100 text-slate-500">No account</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
