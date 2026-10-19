"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, formatDate } from "@/lib/utils";
import type { School } from "@/lib/types";

export default function KathaySchoolsPage() {
  const { user, loading } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tz, setTz] = useState("Africa/Nairobi");

  const load = useCallback(async () => {
    const { data, error } = await insforge.database
      .from("schools")
      .select("id, name, code, contact_email, contact_phone, status, timezone, created_at, school_hours_start, school_hours_end")
      .order("created_at", { ascending: false }).limit(200);
    if (error) return setError(error.message);
    setSchools((data as School[] | null) ?? []);
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function createSchool(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const code = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6).padEnd(6, "X");
    const { error } = await insforge.database.from("schools").insert([{
      name: name.trim(), code, contact_email: email || null,
      contact_phone: phone || null, timezone: tz, created_by: user?.id ?? null,
    }]);
    setBusy(false);
    if (error) return setError(error.message);
    setShowCreate(false); setName(""); setEmail(""); setPhone("");
    void load();
  }

  async function toggleStatus(s: School) {
    const next = s.status === "active" ? "inactive" : "active";
    await insforge.database.from("schools").update({ status: next }).eq("id", s.id);
    void load();
  }

  async function seedChecklist(schoolId: string) {
    await insforge.database.rpc("seed_onboarding_checklist", { p_school_id: schoolId });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">School Onboarding</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create school accounts, configure calendars, school hours, authorised gates, role
            permissions and notification templates, and connect the readers.
          </p>
        </div>
        <button onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          {showCreate ? "Cancel" : "+ Onboard school"}
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">{error}</div>}

      {showCreate && (
        <form onSubmit={createSchool} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h3 className="text-sm font-semibold text-white">New school account</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className="mb-1.5 block text-xs font-medium text-slate-400">School name</label>
              <input className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Greenfield Primary" /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-400">Contact email</label>
              <input type="email" className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-400">Contact phone</label>
              <input className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-400">Timezone</label>
              <select className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" value={tz} onChange={(e) => setTz(e.target.value)}>
                <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={busy}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? "Creating…" : "Create school account"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        {schools.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No schools yet. Onboard the first school above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">School</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {schools.map((s) => (
                <tr key={s.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{s.code ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.contact_email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      s.status === "active" ? "bg-emerald-900/60 text-emerald-400" : "bg-slate-700 text-slate-400")}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => seedChecklist(s.id)}
                        className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700">
                        Seed checklist
                      </button>
                      <button onClick={() => toggleStatus(s)}
                        className={cn("rounded-md px-2.5 py-1 text-xs font-medium",
                          s.status === "active"
                            ? "bg-red-900/50 text-red-400 hover:bg-red-900"
                            : "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900")}>
                        {s.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
