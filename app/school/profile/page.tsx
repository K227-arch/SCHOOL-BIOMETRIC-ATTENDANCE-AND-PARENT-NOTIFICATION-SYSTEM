"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import type { School } from "@/lib/types";

export default function SchoolProfilePage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [school, setSchool] = useState<School | null>(null);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(""); const [start, setStart] = useState("08:00"); const [end, setEnd] = useState("16:00");
  const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await insforge.database.from("schools").select("*").eq("id", schoolId).limit(1);
    const s = (data as School[] | null)?.[0] ?? null;
    setSchool(s);
    if (s) { setName(s.name); setEmail(s.contact_email ?? ""); setPhone(s.contact_phone ?? ""); setAddress(s.address ?? ""); setStart(s.school_hours_start.slice(0, 5)); setEnd(s.school_hours_end.slice(0, 5)); }
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) return;
    setBusy(true); setError(null); setSaved(false);
    const { error } = await insforge.database.from("schools").update({ name, contact_email: email || null, contact_phone: phone || null, address: address || null, school_hours_start: start, school_hours_end: end }).eq("id", schoolId);
    setBusy(false);
    if (error) return setError(error.message);
    setSaved(true);
  }

  if (!schoolId) return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">School Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Contact details, school hours and identification code shown to staff and parents.</p>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saved && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Profile saved.</div>}

      <form onSubmit={save} className="card max-w-2xl space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">School name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="label">School code (read-only)</label><input className="input bg-slate-50" disabled value={school?.code ?? "—"} /></div>
          <div><label className="label">Contact email</label><input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label">Contact phone</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Address</label><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div><label className="label">School start time</label><input type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><label className="label">School end time</label><input type="time" className="input" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save profile"}</button>
      </form>
    </div>
  );
}
