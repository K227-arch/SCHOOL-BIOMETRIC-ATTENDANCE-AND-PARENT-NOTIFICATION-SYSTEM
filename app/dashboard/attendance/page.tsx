"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { formatTime, cn, fullName } from "@/lib/utils";
import type { Pupil, Gate, AttendanceEvent } from "@/lib/types";

/* ── Event table row ─────────────────────────────── */
interface EventRow {
  id: string;
  time: string;
  pupilName: string;
  admNo: string;
  className: string;
  eventType: string;
  gate: string;
  result: string;
  smsStatus: string;
}

const SMS_BADGE: Record<string, string> = {
  queued: "bg-blue-100 text-blue-700",
  sending: "bg-blue-100 text-blue-700",
  sent: "bg-emerald-100 text-emerald-700",
  delivered: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  "—": "bg-slate-100 text-slate-500",
};

export default function AttendancePage() {
  const { context, user, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [pupilId, setPupilId] = useState("");
  const [gateId, setGateId] = useState("");
  const [eventType, setEventType] = useState<"arrival" | "departure">("arrival");

  const load = useCallback(async () => {
    if (!schoolId) return;
    const [{ data: pRows }, { data: gRows }] = await Promise.all([
      insforge.database.from("pupils").select("id, first_name, last_name, admission_number, class_name")
        .eq("school_id", schoolId).eq("status", "active").order("last_name").limit(300),
      insforge.database.from("gates").select("id, name, direction")
        .eq("school_id", schoolId).order("name").limit(50),
    ]);
    setPupils((pRows as Pupil[] | null) ?? []);
    setGates((gRows as Gate[] | null) ?? []);

    // Recent events with full columns matching document's Recent Activity table
    const { data: evRows } = await insforge.database.from("attendance_events")
      .select("id, pupil_id, event_type, event_time, result, gate_id, source")
      .eq("school_id", schoolId).order("event_time", { ascending: false }).limit(40);

    const evs = (evRows as AttendanceEvent[] | null) ?? [];
    const pids = [...new Set(evs.map(e => e.pupil_id))];
    const pMap: Record<string, Pupil> = {};
    if (pids.length) {
      const { data: p2 } = await insforge.database.from("pupils")
        .select("id, first_name, last_name, admission_number, class_name")
        .in("id", pids).limit(pids.length);
      (p2 as Pupil[] | null ?? []).forEach(p => (pMap[p.id] = p));
    }
    const gMap: Record<string, string> = {};
    (gRows as Gate[] | null ?? []).forEach(g => (gMap[g.id] = g.name));

    // SMS status for each event
    const evIds = evs.map(e => e.id);
    const smsMap: Record<string, string> = {};
    if (evIds.length) {
      const { data: smsRows } = await insforge.database.from("sms_notifications")
        .select("attendance_event_id, status").in("attendance_event_id", evIds).limit(evIds.length);
      (smsRows as { attendance_event_id: string; status: string }[] ?? [])
        .forEach(s => (smsMap[s.attendance_event_id] = s.status));
    }

    const today = new Date().toISOString().slice(0, 10);
    const lateLimit = new Date(`${today}T09:15:00Z`);
    setEvents(evs.map(e => {
      const p = pMap[e.pupil_id];
      const isLate = e.event_type === "arrival" && new Date(e.event_time) > lateLimit;
      return {
        id: e.id,
        time: formatTime(e.event_time),
        pupilName: p ? fullName(p.first_name, p.last_name) : "—",
        admNo: p?.admission_number ?? "—",
        className: p?.class_name ?? "—",
        eventType: e.event_type === "arrival" ? (isLate ? "Late arrival" : "Arrival") : "Departure",
        gate: e.gate_id ? (gMap[e.gate_id] ?? "—") : "—",
        result: e.result,
        smsStatus: smsMap[e.id] ?? "—",
      };
    }));
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function recordScan(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId || !pupilId) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const now = new Date().toISOString();
      const today = now.slice(0, 10);
      const since = new Date(Date.now() - 120_000).toISOString();

      const { data: dup } = await insforge.database.from("attendance_events")
        .select("id").eq("school_id", schoolId).eq("pupil_id", pupilId)
        .eq("event_type", eventType).gte("event_time", since).limit(1);
      const isDuplicate = ((dup as AttendanceEvent[] | null)?.length ?? 0) > 0;

      const { data, error } = await insforge.database.from("attendance_events").insert([{
        school_id: schoolId, pupil_id: pupilId, gate_id: gateId || null,
        event_type: eventType, event_time: now, recorded_time: now,
        result: isDuplicate ? "duplicate_suppressed" : "success",
        source: "manual", staff_id: user?.id ?? null,
      }]).select();
      if (error) throw error;

      const ev = (data as AttendanceEvent[] | null)?.[0];
      if (ev && !isDuplicate) {
        const { data: gRows } = await insforge.database.from("guardians")
          .select("id, phone_number, full_name").eq("pupil_id", pupilId)
          .eq("receives_sms", true).order("is_primary", { ascending: false }).limit(1);
        const g = (gRows as { id: string; phone_number: string; full_name: string }[] | null)?.[0];
        if (g) {
          const pupilObj = pupils.find(p => p.id === pupilId);
          const name = pupilObj ? fullName(pupilObj.first_name, pupilObj.last_name) : "Your child";
          const msg = eventType === "arrival"
            ? `${context?.school_name ?? "School"}: ${name} was recorded arriving at school at ${formatTime(now)}.`
            : `${context?.school_name ?? "School"}: ${name} was recorded leaving school at ${formatTime(now)}.`;
          await insforge.database.from("sms_notifications").insert([{
            school_id: schoolId, pupil_id: pupilId, attendance_event_id: ev.id,
            guardian_id: g.id, message_type: eventType, phone_number: g.phone_number,
            message_body: msg, status: "queued",
          }]);
        }

        // Flag late arrival
        if (eventType === "arrival" && new Date(now) > new Date(`${today}T09:15:00Z`)) {
          await insforge.database.from("follow_ups").insert([{
            school_id: schoolId, pupil_id: pupilId, attendance_event_id: ev.id,
            exception_type: "late_arrival", reason: "Arrived after the late threshold",
            status: "open", created_by: user?.id ?? null,
          }]);
        }
      }

      setSuccess(isDuplicate
        ? "Duplicate scan suppressed — no duplicate alert sent."
        : `${eventType === "arrival" ? "Arrival" : "Departure"} recorded. Parent SMS queued.`);
      setPupilId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record scan");
    } finally { setBusy(false); }
  }

  if (!schoolId) return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;

  return (
    <div className="space-y-6">

      {/* ── Figure 3: One-time setup and daily cycle ────── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <h3 className="font-bold text-slate-900">One-time setup and the daily attendance cycle</h3>
        </div>

        {/* A. Set up once */}
        <div className="p-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              A. Set up once, then update records as needed
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { n: "1", title: "Onboard school", desc: "Kathay sets up the school account, devices, gates and authorised staff." },
                { n: "2", title: "Register pupils", desc: "School verifies pupil identity, parent numbers and contact permissions." },
                { n: "3", title: "Enrol approved ID", desc: "Complete notices and required consents; enrol fingerprint or alternative ID." },
              ].map(step => (
                <div key={step.n} className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900">{step.n}. {step.title}</div>
                  <div className="text-xs leading-relaxed text-slate-500">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* B. Repeat daily */}
        <div className="px-4 pb-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            B. Repeat on each school day
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { n: "1", color: "bg-blue-600", title: "Arrival scan", desc: "Confirm identity and entry gate." },
              { n: "2", color: "bg-blue-600", title: "Validate and record", desc: "Deduplicate events; record local time and device." },
              { n: "3", color: "bg-blue-600", title: "Notify parent", desc: "Queue arrival SMS; record delivery outcome." },
              { n: "4", color: "bg-slate-700", title: "Authorised departure", desc: "School verifies release; scan and record exit." },
              { n: "5", color: "bg-slate-700", title: "Notify departure", desc: "Queue exit SMS with event time." },
              { n: "6", color: "bg-slate-700", title: "Review and report", desc: "Resolve exceptions; retain searchable history." },
            ].map((step, i) => (
              <div key={step.n} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${step.color}`}>
                  {step.n}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.desc}</div>
                </div>
                {/* Arrow between steps in same row */}
                {i % 3 !== 2 && <div className="hidden sm:block self-center text-slate-300 text-lg">→</div>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Daily review resets the attendance view, not the pupil registration or biometric enrolment.
          </p>
        </div>
      </div>

      {/* ── Scan recorder + event table ─────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Scan form */}
        <form onSubmit={recordScan} className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Record a scan</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="label">Event type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["arrival", "departure"] as const).map(t => (
                  <button type="button" key={t} onClick={() => setEventType(t)}
                    className={cn("rounded-lg border py-2.5 text-sm font-medium capitalize transition-colors",
                      eventType === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600 hover:border-slate-400")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Pupil</label>
              <select className="input" required value={pupilId} onChange={e => setPupilId(e.target.value)}>
                <option value="">Select pupil…</option>
                {pupils.map(p => (
                  <option key={p.id} value={p.id}>{fullName(p.first_name, p.last_name)} · {p.admission_number}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Gate / device</label>
              <select className="input" value={gateId} onChange={e => setGateId(e.target.value)}>
                <option value="">— Not specified —</option>
                {gates.map(g => <option key={g.id} value={g.id}>{g.name} ({g.direction})</option>)}
              </select>
            </div>
            {error && <div className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</div>}
            {success && <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{success}</div>}
            <button type="submit" disabled={busy || !pupilId} className="btn-primary w-full">
              {busy ? "Recording…" : `Record ${eventType}`}
            </button>
          </div>
        </form>

        {/* Recent events table — exactly the columns from section 6 "Recent activity" */}
        <div className="rounded-xl border border-slate-200 bg-white lg:col-span-2">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold text-slate-900">Recent activity</h3>
            <p className="mt-0.5 text-xs text-slate-500">Pupil · admission number · class · time · gate · result · SMS state</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Time</th>
                  <th className="px-3 py-2.5 font-medium">Pupil</th>
                  <th className="px-3 py-2.5 font-medium">Adm. No</th>
                  <th className="px-3 py-2.5 font-medium">Class</th>
                  <th className="px-3 py-2.5 font-medium">Event</th>
                  <th className="px-3 py-2.5 font-medium">Gate</th>
                  <th className="px-3 py-2.5 font-medium">Result</th>
                  <th className="px-3 py-2.5 font-medium">SMS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">No events recorded yet.</td></tr>
                )}
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{ev.time}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900 whitespace-nowrap">{ev.pupilName}</td>
                    <td className="px-3 py-2.5 text-slate-500">{ev.admNo}</td>
                    <td className="px-3 py-2.5 text-slate-500">{ev.className}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium",
                        ev.eventType === "Arrival" ? "bg-emerald-50 text-emerald-700" :
                        ev.eventType === "Late arrival" ? "bg-amber-50 text-amber-700" :
                        "bg-blue-50 text-blue-700")}>
                        {ev.eventType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{ev.gate}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium",
                        ev.result === "success" ? "bg-emerald-50 text-emerald-700" :
                        ev.result === "failed" ? "bg-red-50 text-red-700" :
                        "bg-slate-100 text-slate-500")}>
                        {ev.result.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium capitalize", SMS_BADGE[ev.smsStatus] ?? "bg-slate-100 text-slate-500")}>
                        {ev.smsStatus === "—" ? "—" : ev.smsStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
