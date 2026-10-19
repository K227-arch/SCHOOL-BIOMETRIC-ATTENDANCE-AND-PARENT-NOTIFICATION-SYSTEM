"use client";

import { useEffect, useState } from "react";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/lib/auth-context";

interface School { id: string; name: string; contact_email: string | null; contact_phone: string | null; }

export default function ParentContactPage() {
  const { user, loading } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      insforge.database.rpc("get_parent_children").then(({ data }) => {
        const kids = (data as { school_id: string; school_name: string }[] | null) ?? [];
        const unique: School[] = [];
        const seen = new Set<string>();
        for (const k of kids) {
          if (!seen.has(k.school_id)) {
            seen.add(k.school_id);
            unique.push({ id: k.school_id, name: k.school_name, contact_email: null, contact_phone: null });
          }
        }
        setSchools(unique);
        if (unique.length) setSchoolId(unique[0].id);
      });
    }
  }, [loading, user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true); setError(null);
    const { error } = await insforge.database.from("support_tickets").insert([{
      school_id: schoolId || null,
      submitted_by: user.id,
      subject: subject.trim(),
      description: desc.trim(),
      category: "parent_enquiry",
      priority: "medium",
    }]);
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true); setSubject(""); setDesc("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Contact School</h2>
        <p className="mt-1 text-sm text-slate-500">Send a message to your school. Staff will respond via your registered contact.</p>
      </div>

      {schools.length > 0 && (
        <div className="card p-5 space-y-2">
          {schools.map((s) => (
            <div key={s.id}>
              <h3 className="text-sm font-semibold text-slate-900">{s.name}</h3>
              {s.contact_email && <p className="text-xs text-slate-500">✉ {s.contact_email}</p>}
              {s.contact_phone && <p className="text-xs text-slate-500">📞 {s.contact_phone}</p>}
            </div>
          ))}
        </div>
      )}

      {sent && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          Your message has been sent to the school. Staff will follow up with you directly.
        </div>
      )}

      <form onSubmit={submit} className="card max-w-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Send a message</h3>
        {schools.length > 1 && (
          <div>
            <label className="label">School</label>
            <select className="input" value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Subject</label>
          <input className="input" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Query about attendance record" />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input" rows={5} required value={desc} onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe your query in detail, including your child's name and admission number." />
        </div>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {busy ? "Sending…" : "Send message"}
        </button>
      </form>

      <p className="text-xs text-slate-400">
        Please provide accurate contact information and notify the school of any changes to
        authorised pickup arrangements.
      </p>
    </div>
  );
}
