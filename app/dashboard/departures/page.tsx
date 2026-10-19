"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { fullName, cn, formatTime } from "@/lib/utils";
import type { Pupil, AttendanceEvent, FollowUp } from "@/lib/types";

/* ── Types ───────────────────────────────────────────── */
interface DepRow {
  pupilId: string;
  name: string;
  pickup: string;
  status: "Released" | "Pending" | "Authorised" | "Early exit";
  time: string | null;
  sms: "Sent" | "Not sent" | "Pending" | "Failed";
}

interface AlertItem {
  id: string;
  severity: "warning" | "error" | "info";
  title: string;
  action: string;
}

const STATUS_BADGE: Record<string, string> = {
  Released: "bg-emerald-100 text-emerald-700",
  Authorised: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  "Early exit": "bg-orange-100 text-orange-700",
};

const SMS_BADGE: Record<string, string> = {
  Sent: "bg-emerald-100 text-emerald-700",
  "Not sent": "bg-amber-100 text-amber-700",
  Pending: "bg-blue-100 text-blue-700",
  Failed: "bg-red-100 text-red-700",
};

export default function DeparturesPage() {
  const { context, user, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [rows, setRows] = useState<DepRow[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    const s = `${today}T00:00:00Z`, e = `${today}T23:59:59Z`;

    const { data: arrEvs } = await insforge.database.from("attendance_events")
      .select("pupil_id, event_type, event_time")
      .eq("school_id", schoolId).gte("event_time", s).lte("event_time", e)
      .eq("result", "success").limit(500);

    const arrivedIds = new Set((arrEvs as { pupil_id: string; event_type: string }[] ?? [])
      .filter(x => x.event_type === "arrival").map(x => x.pupil_id));
    const departedMap: Record<string, string> = {};
    (arrEvs as { pupil_id: string; event_type: string; event_time: string }[] ?? [])
      .filter(x => x.event_type === "departure")
      .forEach(x => { departedMap[x.pupil_id] = x.event_time; });

    const onSiteIds = [...arrivedIds].filter(id => !departedMap[id]);

    // Get all arrivals + departures to build full list
    const allIds = [...new Set([...arrivedIds, ...Object.keys(departedMap)])];
    let pMap: Record<string, Pupil> = {};
    if (allIds.length) {
      const { data: pRows } = await insforge.database.from("pupils")
        .select("id, first_name, last_name, admission_number, class_name")
        .in("id", allIds).limit(allIds.length);
      (pRows as Pupil[] ?? []).forEach(p => (pMap[p.id] = p));
    }

    // SMS for today's departure events
    const smsMap: Record<string, string> = {};
    if (Object.keys(departedMap).length) {
      const { data: depEvIds } = await insforge.database.from("attendance_events")
        .select("id, pupil_id").eq("school_id", schoolId).eq("event_type", "departure")
        .gte("event_time", s).lte("event_time", e).limit(200);
      const ids = (depEvIds as { id: string; pupil_id: string }[] ?? []).map(x => x.id);
      if (ids.length) {
        const { data: smsRows } = await insforge.database.from("sms_notifications")
          .select("attendance_event_id, status, pupil_id").in("attendance_event_id", ids).limit(ids.length);
        (smsRows as { attendance_event_id: string; status: string; pupil_id: string }[] ?? [])
          .forEach(s => (smsMap[s.pupil_id] = s.status));
      }
    }

    // Build rows — on site first (Pending), then departed (Released/Authorised)
    const depRows: DepRow[] = [
      ...onSiteIds.map(pid => ({
        pupilId: pid,
        name: pMap[pid] ? fullName(pMap[pid].first_name, pMap[pid].last_name) : "—",
        pickup: "Guardian",
        status: "Pending" as const,
        time: null,
        sms: "Not sent" as const,
      })),
      ...Object.entries(departedMap).map(([pid, evTime]) => ({
        pupilId: pid,
        name: pMap[pid] ? fullName(pMap[pid].first_name, pMap[pid].last_name) : "—",
        pickup: "Parent",
        status: "Released" as const,
        time: formatTime(evTime),
        sms: (smsMap[pid] === "delivered" || smsMap[pid] === "sent" ? "Sent" :
              smsMap[pid] === "failed" ? "Failed" :
              smsMap[pid] ? "Pending" : "Not sent") as DepRow["sms"],
      })),
    ];
    setRows(depRows);

    // Follow-up alerts
    const { data: fuRows } = await insforge.database.from("follow_ups")
      .select("id, exception_type, reason, status")
      .eq("school_id", schoolId).neq("status", "closed")
      .order("created_at", { ascending: false }).limit(5);
    setAlerts((fuRows as FollowUp[] ?? []).map(f => ({
      id: f.id,
      severity: f.exception_type === "failed_sms" ? "error" : f.exception_type === "late_arrival" ? "warning" : "info",
      title: f.exception_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      action: f.reason ?? "Review and action",
    })));
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function confirmRelease(row: DepRow) {
    if (!schoolId) return;
    setBusy(true); setError(null);
    const now = new Date().toISOString();
    const { data, error } = await insforge.database.from("attendance_events").insert([{
      school_id: schoolId, pupil_id: row.pupilId, event_type: "departure",
      event_time: now, recorded_time: now, result: "success", source: "manual",
      staff_id: user?.id ?? null, notes: "Authorised release confirmed by staff",
    }]).select();
    if (error) { setBusy(false); setError(error.message); return; }
    const ev = (data as AttendanceEvent[] | null)?.[0];
    if (ev) {
      const { data: gRows } = await insforge.database.from("guardians")
        .select("id, phone_number, full_name").eq("pupil_id", row.pupilId)
        .eq("receives_sms", true).order("is_primary", { ascending: false }).limit(1);
      const g = (gRows as { id: string; phone_number: string; full_name: string }[] | null)?.[0];
      if (g) {
        await insforge.database.from("sms_notifications").insert([{
          school_id: schoolId, pupil_id: row.pupilId, attendance_event_id: ev.id,
          guardian_id: g.id, message_type: "departure", phone_number: g.phone_number,
          message_body: `${context?.school_name ?? "School"}: ${row.name} was recorded leaving school at ${formatTime(now)}.`,
          status: "queued",
        }]);
      }
    }
    setBusy(false);
    void load();
  }

  if (!schoolId) return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;

  const onSiteCount = rows.filter(r => r.status === "Pending").length;
  const releasedCount = rows.filter(r => r.status === "Released" || r.status === "Authorised").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Departure Control</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tracks release status and pickup person · Flags incomplete departures for review
          </p>
        </div>
        <button onClick={() => load()} className="btn-secondary text-xs">Refresh</button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Summary strip */}
      <div className="flex gap-3">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center">
          <div className="text-xs text-slate-500">On site</div>
          <div className="text-xl font-bold text-amber-600">{onSiteCount}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center">
          <div className="text-xs text-slate-500">Released</div>
          <div className="text-xl font-bold text-emerald-600">{releasedCount}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center">
          <div className="text-xs text-slate-500">Alerts</div>
          <div className="text-xl font-bold text-red-600">{alerts.length}</div>
        </div>
      </div>

      {/* Main two-panel layout exactly as Figure 6 */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* LEFT: Departure control table */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <span>🚌</span> Departure control
            </div>
            <Link href="/dashboard/departures" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-100 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Pupil</th>
                  <th className="px-4 py-2.5 text-left font-medium">Pickup</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Time</th>
                  <th className="px-4 py-2.5 text-left font-medium">SMS</th>
                  <th className="px-4 py-2.5 text-left font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">All pupils have departed, or none arrived today.</td></tr>
                )}
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.pickup}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_BADGE[row.status])}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.time ?? "–"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", SMS_BADGE[row.sms])}>
                        {row.sms}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "Pending" && (
                        <button onClick={() => confirmRelease(row)} disabled={busy}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                          Release
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-4 py-2.5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Tracks release status and pickup person
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Flags incomplete departures for review
            </div>
          </div>
        </div>

        {/* RIGHT: Alerts and follow-up panel */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <span>🔔</span> Alerts and follow-up
            </div>
            <Link href="/dashboard/followups" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50 p-2">
            {alerts.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-slate-400">No open alerts</div>
            )}
            {alerts.map(a => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg p-3">
                <div className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold",
                  a.severity === "error" ? "bg-red-100 text-red-600" :
                  a.severity === "warning" ? "bg-amber-100 text-amber-600" :
                  "bg-blue-100 text-blue-600")}>
                  {a.severity === "info" ? "i" : "!"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                  <div className="text-xs text-slate-500">Action: {a.action}</div>
                </div>
              </div>
            ))}

            {/* Always show example structure when no real alerts */}
            {alerts.length === 0 && (
              <div className="space-y-0 opacity-30 pointer-events-none">
                {[
                  { sev: "warning", title: "Late arrival", action: "Inform class teacher" },
                  { sev: "error", title: "SMS failed", action: "Retry and confirm number" },
                  { sev: "info", title: "Missing exit review", action: "Check before close of day" },
                ].map(ex => (
                  <div key={ex.title} className="flex items-start gap-3 rounded-lg p-3">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold",
                      ex.sev === "error" ? "bg-red-100 text-red-600" :
                      ex.sev === "warning" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600")}>
                      {ex.sev === "info" ? "i" : "!"}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{ex.title}</div>
                      <div className="text-xs text-slate-500">Action: {ex.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        A scan records an event; it does not, by itself, establish that a child was safely handed over to an authorised person.
        Missing arrival scans are verified by staff; they do not automatically prove absence.
      </p>
    </div>
  );
}
