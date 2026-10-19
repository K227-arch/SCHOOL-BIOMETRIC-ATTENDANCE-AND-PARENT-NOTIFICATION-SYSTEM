"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge, ROLE_LABELS, type StaffRole } from "@/lib/insforge";
import { cn } from "@/lib/utils";
import type { SchoolMember, Profile, School } from "@/lib/types";

export default function MembersPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [school, setSchool] = useState<School | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setError(null);
    const { data: mRows, error } = await insforge.database
      .from("school_members")
      .select("id, school_id, user_id, role, status, created_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) return setError(error.message);
    const m = (mRows as SchoolMember[] | null) ?? [];
    setMembers(m);
    const { data: sRow } = await insforge.database
      .from("schools")
      .select("id, name, code")
      .eq("id", schoolId)
      .limit(1);
    setSchool((sRow as School[] | null)?.[0] ?? null);
  }, [schoolId]);

  useEffect(() => {
    if (!loading) void load();
  }, [loading, load]);

  async function changeRole(m: SchoolMember, role: StaffRole) {
    setError(null);
    const { error } = await insforge.database.from("school_members").update({ role }).eq("id", m.id);
    if (error) return setError(error.message);
    void load();
  }

  async function toggleStatus(m: SchoolMember) {
    setError(null);
    const next = m.status === "active" ? "inactive" : "active";
    const { error } = await insforge.database.from("school_members").update({ status: next }).eq("id", m.id);
    if (error) return setError(error.message);
    void load();
  }

  function copyCode() {
    if (!school?.code) return;
    navigator.clipboard.writeText(school.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!schoolId) {
    return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Staff</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage staff accounts and roles. Share the school code so new staff can join during
          signup.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900">School code</h3>
        <p className="mt-1 text-xs text-slate-500">
          Gate staff and supervisors enter this code during signup to join your school.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <code className="rounded-lg bg-slate-900 px-4 py-2.5 text-lg font-mono font-bold tracking-widest text-white">
            {school?.code ?? "—"}
          </code>
          <button onClick={copyCode} className="btn-secondary text-xs">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="card p-0">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Members ({members.length})</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">User</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {profiles[m.user_id]?.full_name ?? m.user_id.slice(0, 8)}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m, e.target.value as StaffRole)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    {(Object.keys(ROLE_LABELS) as StaffRole[]).map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("badge", m.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleStatus(m)} className="btn-secondary text-xs">
                    {m.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
