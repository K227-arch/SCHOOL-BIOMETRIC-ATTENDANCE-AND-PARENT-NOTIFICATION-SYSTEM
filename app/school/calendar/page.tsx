"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";
import type { CalendarEntry } from "@/lib/types";

const DAY_TYPE_STYLES: Record<string, string> = {
  school_day: "bg-emerald-100 text-emerald-800",
  weekend: "bg-slate-100 text-slate-600",
  holiday: "bg-amber-100 text-amber-800",
  break: "bg-blue-100 text-blue-800",
};

export default function CalendarPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("");
  const [dayType, setDayType] = useState<CalendarEntry["day_type"]>("school_day");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    if (!schoolId) return;
    const { data, error } = await supabase.from("calendars").select("id, date, day_type, school_hours_start, school_hours_end, notes")
      .eq("school_id", schoolId).order("date", { ascending: false }).limit(100);
    if (error) return setError(error.message);
    setEntries((data as CalendarEntry[] | null) ?? []);
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId || !date) return;
    setBusy(true); setError(null);
    const { error } = await supabase.from("calendars").insert([{
      school_id: schoolId, date, day_type: dayType, notes: notes || null,
    }]);
    setBusy(false);
    if (error) return setError(error.message);
    setDate(""); setNotes("");
    void load();
  }

  if (!schoolId) return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1a56a0 40%, #0ea5e9 100%)" }}>
        <h1 className="text-sm font-bold">School Calendar</h1>
        <p className="text-blue-100 text-xs mt-0.5">Set school days, holidays, breaks and term dates. These determine which days attendance is recorded.</p>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={addEntry} className="card p-5">
          <h3 className="text-sm font-bold text-slate-900">Add calendar entry</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Day type</label>
            <select className="input" value={dayType} onChange={(e) => setDayType(e.target.value as CalendarEntry["day_type"])}>
              <option value="school_day">School day</option>
              <option value="holiday">Holiday</option>
              <option value="break">Break</option>
              <option value="weekend">Weekend</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Term 1 end" />
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn-primary mt-4">{busy ? "Saving…" : "Add entry"}</button>
      </form>

      <div className="card p-0">
        <div className="overflow-x-auto">
          {entries.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">No calendar entries yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-left text-[11px] uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("badge capitalize", DAY_TYPE_STYLES[e.day_type])}>{e.day_type.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{e.notes ?? "-"}</td>
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
