"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { NotificationTemplate } from "@/lib/types";

const DEFAULTS = {
  arrival: "{pupil_name} arrived at {school_name} at {time}. — Kathay Attendance",
  departure: "{pupil_name} departed {school_name} at {time}. — Kathay Attendance",
};

export default function SMSTemplatesPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    const { data, error } = await supabase.from("notification_templates").select("*")
      .eq("school_id", schoolId).order("template_type");
    if (error) return setError(error.message);
    const t = (data as NotificationTemplate[] | null) ?? [];
    setTemplates(t);
    const map: Record<string, string> = {};
    t.forEach((tmpl) => { map[tmpl.template_type] = tmpl.template_body; });
    setEditing(map);
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function save(type: "arrival" | "departure") {
    if (!schoolId) return;
    setBusy(true); setError(null); setSaved(false);
    const existing = templates.find((t) => t.template_type === type);
    if (existing) {
      const { error } = await supabase.from("notification_templates")
        .update({ template_body: editing[type] }).eq("id", existing.id);
      if (error) { setBusy(false); return setError(error.message); }
    } else {
      const { error } = await supabase.from("notification_templates").insert([{
        school_id: schoolId, template_type: type, template_body: editing[type] || DEFAULTS[type], language: "en",
      }]);
      if (error) { setBusy(false); return setError(error.message); }
    }
    setBusy(false); setSaved(true);
    void load();
  }

  if (!schoolId) return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1a56a0 40%, #0ea5e9 100%)" }}>
        <h1 className="text-sm font-bold">SMS Notification Templates</h1>
        <p className="text-blue-100 text-xs mt-0.5">Arrival and departure SMS messages sent to verified guardians. Messages must describe what is recorded — not promise the child is safe or already home.</p>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saved && <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">Template saved.</div>}

      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-700 mb-1">Available placeholders:</p>
        <code className="text-xs">{"{pupil_name}"}</code> · <code className="text-xs">{"{school_name}"}</code> ·{" "}
        <code className="text-xs">{"{time}"}</code> · <code className="text-xs">{"{date}"}</code>
      </div>

      {(["arrival", "departure"] as const).map((type) => (
        <div key={type} className="card p-5">
        <h3 className="text-sm font-bold capitalize text-slate-900">{type} message</h3>
          <textarea rows={3} className="input mt-3"
            value={editing[type] ?? DEFAULTS[type]}
            onChange={(e) => setEditing((prev) => ({ ...prev, [type]: e.target.value }))} />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">Preview: {(editing[type] || DEFAULTS[type])
              .replace("{pupil_name}", "John Doe")
              .replace("{school_name}", context?.school_name ?? "School")
              .replace("{time}", "08:32")
              .replace("{date}", new Date().toLocaleDateString())}</p>
            <button onClick={() => save(type)} disabled={busy}
              className="btn-primary text-sm">{busy ? "Saving…" : "Save template"}</button>
          </div>
        </div>
      ))}

      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        During an outage, any later message must show the actual event time, not imply that
        it occurred when delivery resumed.
      </div>
    </div>
  );
}
