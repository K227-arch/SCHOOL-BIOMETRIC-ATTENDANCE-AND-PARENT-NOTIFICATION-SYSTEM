"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, formatDateTime } from "@/lib/utils";

interface Ticket { id: string; subject: string; description: string; category: string; priority: string; status: string; created_at: string; resolution: string | null; }

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-100 text-slate-600",
};

export default function SchoolSupportPage() {
  const { context, user, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState(""); const [desc, setDesc] = useState(""); const [cat, setCat] = useState("technical"); const [priority, setPriority] = useState("medium");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    const { data, error } = await supabase.from("support_tickets")
      .select("id, subject, description, category, priority, status, created_at, resolution")
      .eq("school_id", schoolId).order("created_at", { ascending: false }).limit(50);
    if (error) return setError(error.message);
    setTickets((data as Ticket[] | null) ?? []);
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !schoolId) return;
    setBusy(true); setError(null); setSent(false);
    const { error } = await supabase.from("support_tickets").insert([{
      school_id: schoolId, submitted_by: user.id, subject: subject.trim(), description: desc.trim(), category: cat, priority,
    }]);
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true); setSubject(""); setDesc("");
    void load();
  }

  if (!schoolId) return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Support Tickets</h2>
        <p className="mt-1 text-sm text-slate-500">Submit technical support requests to Kathay Technologies. Track status here.</p>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {sent && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Ticket submitted. Kathay support will respond shortly.</div>}

      <form onSubmit={submit} className="card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">New support request</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3"><label className="label">Subject</label><input className="input" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe the issue" /></div>
          <div><label className="label">Category</label>
            <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="technical">Technical</option>
              <option value="device">Device / hardware</option>
              <option value="sms">SMS / notifications</option>
              <option value="billing">Billing</option>
              <option value="onboarding">Onboarding</option>
              <option value="general">General</option>
            </select>
          </div>
          <div><label className="label">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="sm:col-span-3"><label className="label">Description</label>
            <textarea className="input" rows={4} required value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Provide full details including steps to reproduce, device/gate affected, and any error messages." />
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary">{busy ? "Submitting…" : "Submit ticket"}</button>
      </form>

      <div className="card p-0">
        <div className="border-b border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-900">Your tickets</h3></div>
        {tickets.length === 0 ? <p className="p-6 text-center text-sm text-slate-400">No tickets yet.</p> : (
          <div className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <div key={t.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.subject}</div>
                    <div className="mt-0.5 text-xs text-slate-500 capitalize">{t.category} · {t.priority} priority · {formatDateTime(t.created_at)}</div>
                    {t.resolution && <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700"><strong>Resolution:</strong> {t.resolution}</div>}
                  </div>
                  <span className={cn("badge shrink-0 capitalize", STATUS_STYLES[t.status])}>{t.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
