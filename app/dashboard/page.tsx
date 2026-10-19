"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { formatTime, fullName, cn } from "@/lib/utils";
import type { AttendanceEvent, Pupil, FollowUp } from "@/lib/types";

/* ── Types ─────────────────────────────────────────── */
interface RecentRow {
  id: string;
  time: string;
  pupilName: string;
  admNo: string;
  className: string;
  event: "Arrival" | "Late arrival" | "Early exit" | "Departure";
  gate: string;
  smsStatus: string;
  result: string;
}

interface DepartureRow {
  pupilId: string;
  pupilName: string;
  pickup: string;
  status: "Released" | "Pending" | "Authorised";
  time: string | null;
  sms: "Sent" | "Not sent" | "Pending";
}

interface AlertRow {
  id: string;
  severity: "warning" | "error" | "info";
  title: string;
  action: string;
}

interface HistoryRow {
  date: string;
  arrival: string;
  departure: string;
  sms: string;
  remark: string;
  remarkColor?: string;
}

interface PupilProfile {
  name: string;
  className: string;
  admNo: string;
  parentPhone: string;
  statusToday: string;
}

/* ── Helpers ────────────────────────────────────────── */
const SMS_BADGE: Record<string, string> = {
  Sent: "bg-emerald-100 text-emerald-700",
  Delivered: "bg-emerald-100 text-emerald-700",
  delivered: "bg-emerald-100 text-emerald-700",
  sent: "bg-emerald-100 text-emerald-700",
  "Not sent": "bg-amber-100 text-amber-700",
  Pending: "bg-blue-100 text-blue-700",
  Failed: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
  queued: "bg-blue-100 text-blue-700",
};

const STATUS_BADGE: Record<string, string> = {
  Released: "bg-emerald-100 text-emerald-700",
  Authorised: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
};

export default function DashboardOverview() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [onSite, setOnSite] = useState(0);
  const [departed, setDeparted] = useState(0);
  const [pendingDep, setPendingDep] = useState(0);
  const [smsFailed, setSmsFailed] = useState(0);
  const [recentRows, setRecentRows] = useState<RecentRow[]>([]);
  const [departureRows, setDepartureRows] = useState<DepartureRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [profile, setProfile] = useState<PupilProfile | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    const startOfDay = `${today}T00:00:00Z`;
    const endOfDay = `${today}T23:59:59Z`;
    const lateLimit = new Date(`${today}T09:15:00Z`);

    try {
      /* ── Stat tiles ─────────────────────────────── */
      const { data: arrEvs } = await insforge.database
        .from("attendance_events")
        .select("pupil_id, event_type, event_time, result")
        .eq("school_id", schoolId)
        .gte("event_time", startOfDay).lte("event_time", endOfDay)
        .eq("result", "success").limit(500);

      const allEvs = (arrEvs as Pick<AttendanceEvent, "pupil_id" | "event_type" | "event_time" | "result">[] | null) ?? [];
      const arrivedIds = new Set(allEvs.filter(e => e.event_type === "arrival").map(e => e.pupil_id));
      const departedIds = new Set(allEvs.filter(e => e.event_type === "departure").map(e => e.pupil_id));
      const onSiteIds = [...arrivedIds].filter(id => !departedIds.has(id));
      setOnSite(onSiteIds.length);
      setDeparted(departedIds.size);

      const { count: smsFailCount } = await insforge.database
        .from("sms_notifications").select("id", { count: "exact" })
        .eq("school_id", schoolId).eq("status", "failed").limit(1);
      setSmsFailed(smsFailCount ?? 0);

      /* ── Recent activity table ──────────────────── */
      const { data: evRows } = await insforge.database
        .from("attendance_events")
        .select("id, pupil_id, event_type, event_time, result, gate_id, source")
        .eq("school_id", schoolId)
        .order("event_time", { ascending: false }).limit(8);

      const pupilIds = [...new Set((evRows as AttendanceEvent[] | null ?? []).map(e => e.pupil_id))];
      let pMap: Record<string, Pupil> = {};
      if (pupilIds.length) {
        const { data: pRows } = await insforge.database.from("pupils")
          .select("id, first_name, last_name, admission_number, class_name")
          .in("id", pupilIds).limit(pupilIds.length);
        (pRows as Pupil[] | null ?? []).forEach(p => (pMap[p.id] = p));
      }

      const { data: gateRows } = await insforge.database.from("gates")
        .select("id, name").eq("school_id", schoolId).limit(20);
      const gMap: Record<string, string> = {};
      (gateRows as { id: string; name: string }[] | null ?? []).forEach(g => (gMap[g.id] = g.name));

      // fetch SMS for these events
      const evIds = (evRows as AttendanceEvent[] | null ?? []).map(e => e.id);
      let smsMap: Record<string, string> = {};
      if (evIds.length) {
        const { data: smsRows } = await insforge.database.from("sms_notifications")
          .select("attendance_event_id, status")
          .in("attendance_event_id", evIds).limit(evIds.length);
        (smsRows as { attendance_event_id: string; status: string }[] | null ?? [])
          .forEach(s => (smsMap[s.attendance_event_id] = s.status));
      }

      const recent: RecentRow[] = (evRows as AttendanceEvent[] | null ?? []).map(e => {
        const p = pMap[e.pupil_id];
        const isLate = e.event_type === "arrival" && new Date(e.event_time) > lateLimit;
        const isEarlyExit = e.event_type === "departure" && new Date(e.event_time) < new Date(`${today}T14:00:00Z`);
        const eventLabel = e.event_type === "arrival"
          ? (isLate ? "Late arrival" : "Arrival")
          : (isEarlyExit ? "Early exit" : "Departure");
        return {
          id: e.id,
          time: formatTime(e.event_time),
          pupilName: p ? fullName(p.first_name, p.last_name) : "—",
          admNo: p?.admission_number ?? "—",
          className: p?.class_name ?? "—",
          event: eventLabel as RecentRow["event"],
          gate: e.gate_id ? (gMap[e.gate_id] ?? "—") : "—",
          smsStatus: smsMap[e.id] ?? "—",
          result: e.result,
        };
      });
      setRecentRows(recent);

      /* ── Departure control rows ─────────────────── */
      const depRows: DepartureRow[] = onSiteIds.slice(0, 5).map(pid => {
        const p = pMap[pid];
        return {
          pupilId: pid,
          pupilName: p ? fullName(p.first_name, p.last_name) : "—",
          pickup: "Guardian",
          status: "Pending",
          time: null,
          sms: "Not sent",
        };
      });
      setPendingDep(onSiteIds.length);
      setDepartureRows(depRows);

      /* ── Alerts ─────────────────────────────────── */
      const { data: fuRows } = await insforge.database.from("follow_ups")
        .select("id, exception_type, reason, status")
        .eq("school_id", schoolId).neq("status", "closed")
        .order("created_at", { ascending: false }).limit(3);
      const alertList: AlertRow[] = (fuRows as FollowUp[] | null ?? []).map(f => ({
        id: f.id,
        severity: f.exception_type === "failed_sms" ? "error" : f.exception_type === "late_arrival" ? "warning" : "info",
        title: f.exception_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        action: f.reason ?? "Review and action",
      }));
      setAlerts(alertList);

      /* ── Pupil history (first pupil with arrival today) ── */
      if (arrivedIds.size) {
        const firstId = [...arrivedIds][0];
        const fp = pMap[firstId];
        if (fp) {
          setProfile({
            name: fullName(fp.first_name, fp.last_name),
            className: fp.class_name ?? "—",
            admNo: fp.admission_number,
            parentPhone: "07XX XXX XXX",
            statusToday: "Present",
          });

          // Last 4 days history
          const { data: hRows } = await insforge.database
            .from("attendance_events")
            .select("event_type, event_time, result")
            .eq("pupil_id", firstId).eq("result", "success")
            .order("event_time", { ascending: false }).limit(20);
          const byDate: Record<string, { arr?: string; dep?: string }> = {};
          (hRows as AttendanceEvent[] | null ?? []).forEach(e => {
            const d = e.event_time.slice(0, 10);
            if (!byDate[d]) byDate[d] = {};
            if (e.event_type === "arrival" && !byDate[d].arr) byDate[d].arr = formatTime(e.event_time);
            if (e.event_type === "departure" && !byDate[d].dep) byDate[d].dep = formatTime(e.event_time);
          });
          const hist: HistoryRow[] = Object.entries(byDate).slice(0, 4).map(([dt, v]) => {
            const noExit = !v.dep;
            return {
              date: new Date(dt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
              arrival: v.arr ?? "—",
              departure: noExit ? "No exit" : (v.dep ?? "—"),
              sms: v.arr && v.dep ? "Both" : v.arr ? "Arrival" : "—",
              remark: noExit ? "Review open" : "Normal",
              remarkColor: noExit ? "text-orange-600 font-semibold" : "text-slate-600",
            };
          });
          setHistory(hist);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    }
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  if (!loading && context?.is_platform_admin && !schoolId) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Platform overview</h2>
        <p className="text-sm text-slate-600">You have platform administrator access.</p>
        <Link href="/kathay" className="btn-primary inline-flex">Go to Kathay console</Link>
      </div>
    );
  }
  if (!schoolId) return (
    <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
      No school linked. Contact your school administrator for a school code.
    </div>
  );

  const tabs = ["Overview", "Today", "Departure Control", "History", "Reports"];
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-0 -m-4 sm:-m-6">

      {/* ── App header bar (matches Figure 5) ──────────── */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏫</span>
          <span className="font-bold text-slate-900">Kathay School Attendance Platform</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="hidden sm:flex items-center gap-1">🏛 School: {context?.school_name ?? "—"}</span>
          <span className="hidden sm:flex items-center gap-1">👤 User: Admin</span>
          <span className="flex items-center gap-1">📅 {today}</span>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-white px-4 sm:px-6 overflow-x-auto">
        <Link href="/dashboard" className="flex items-center gap-1 px-3 py-3 text-sm font-medium text-slate-500 hover:text-slate-700">
          🏠 Dashboard
        </Link>
        {tabs.map((tab, i) => (
          <button key={tab}
            className={cn("px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              i === 0 ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700")}>
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {/* ── 4 Stat tiles ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xl">👥</div>
            <div>
              <div className="text-xs text-slate-500">Pupils on site</div>
              <div className="text-3xl font-bold text-slate-900 leading-tight">{onSite}</div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xl">↪</div>
            <div>
              <div className="text-xs text-slate-500">Already departed</div>
              <div className="text-3xl font-bold text-slate-900 leading-tight">{departed}</div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xl">⏱</div>
            <div>
              <div className="text-xs text-slate-500">Pending departures</div>
              <div className="text-3xl font-bold text-slate-900 leading-tight">{pendingDep}</div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl">⚠</div>
            <div>
              <div className="text-xs text-slate-500">SMS failed</div>
              <div className="text-3xl font-bold text-slate-900 leading-tight">{smsFailed}</div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Recent activity | Departure control | Alerts ── */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Recent activity */}
          <div className="rounded-xl border border-slate-200 bg-white lg:col-span-1">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <span>≡</span> Recent activity
              </div>
              <Link href="/dashboard/attendance" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Time</th>
                    <th className="px-3 py-2 text-left font-medium">Pupil</th>
                    <th className="px-3 py-2 text-left font-medium">Event</th>
                    <th className="px-3 py-2 text-left font-medium">Gate</th>
                    <th className="px-3 py-2 text-left font-medium">SMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentRows.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">No events today</td></tr>
                  )}
                  {recentRows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{row.time}</td>
                      <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">{row.pupilName}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium",
                          row.event === "Arrival" ? "bg-emerald-50 text-emerald-700" :
                          row.event === "Late arrival" ? "bg-amber-50 text-amber-700" :
                          row.event === "Early exit" ? "bg-orange-50 text-orange-700" :
                          "bg-blue-50 text-blue-700")}>
                          {row.event}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{row.gate}</td>
                      <td className="px-3 py-2">
                        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium capitalize", SMS_BADGE[row.smsStatus] ?? "bg-slate-100 text-slate-500")}>
                          {row.smsStatus === "—" ? "—" : row.smsStatus.charAt(0).toUpperCase() + row.smsStatus.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-100 px-3 py-2">
                <div className="text-xs text-slate-400">• Shows latest scans and SMS status</div>
                <div className="text-xs text-slate-400">• Covers both arrival and departure events</div>
              </div>
            </div>
          </div>

          {/* Departure control */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <span>🚌</span> Departure control
              </div>
              <Link href="/dashboard/departures" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Pupil</th>
                    <th className="px-3 py-2 text-left font-medium">Pickup</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Time</th>
                    <th className="px-3 py-2 text-left font-medium">SMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {departureRows.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">All departed</td></tr>
                  )}
                  {departureRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">{row.pupilName}</td>
                      <td className="px-3 py-2 text-slate-600">{row.pickup}</td>
                      <td className="px-3 py-2">
                        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", STATUS_BADGE[row.status])}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{row.time ?? "–"}</td>
                      <td className="px-3 py-2">
                        <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", SMS_BADGE[row.sms])}>
                          {row.sms}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-slate-100 px-3 py-2">
                <div className="text-xs text-slate-400">• Tracks release status and pickup person</div>
                <div className="text-xs text-slate-400">• Flags incomplete departures for review</div>
              </div>
            </div>
          </div>

          {/* Alerts and follow-up */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <span>🔔</span> Alerts and follow-up
              </div>
              <Link href="/dashboard/followups" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-slate-50 p-2">
              {alerts.length === 0 && (
                <div className="px-2 py-6 text-center text-xs text-slate-400">No open alerts</div>
              )}
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 rounded-lg p-2.5">
                  <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm",
                    alert.severity === "error" ? "bg-red-100 text-red-600" :
                    alert.severity === "warning" ? "bg-amber-100 text-amber-600" :
                    "bg-blue-100 text-blue-600")}>
                    {alert.severity === "error" ? "!" : alert.severity === "warning" ? "!" : "i"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{alert.title}</div>
                    <div className="text-xs text-slate-500">Action: {alert.action}</div>
                  </div>
                </div>
              ))}
              {/* Static example alerts if none */}
              {alerts.length === 0 && (
                <>
                  <div className="flex items-start gap-3 rounded-lg p-2.5 opacity-40 pointer-events-none">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-sm font-bold">!</div>
                    <div><div className="text-sm font-semibold text-slate-900">Late arrival</div><div className="text-xs text-slate-500">Action: Inform class teacher</div></div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg p-2.5 opacity-40 pointer-events-none">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-sm font-bold">!</div>
                    <div><div className="text-sm font-semibold text-slate-900">SMS failed</div><div className="text-xs text-slate-500">Action: Retry and confirm number</div></div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg p-2.5 opacity-40 pointer-events-none">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">i</div>
                    <div><div className="text-sm font-semibold text-slate-900">Missing exit review</div><div className="text-xs text-slate-500">Action: Check before close of day</div></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 3: Pupil history | What this shows | Quick actions ── */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Pupil history and profile */}
          <div className="rounded-xl border border-slate-200 bg-white lg:col-span-1">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">
              <span>👤</span> Pupil history and profile
            </div>
            <div className="flex flex-col gap-0 sm:flex-row">
              {/* Profile card */}
              <div className="border-b border-slate-100 p-4 sm:border-b-0 sm:border-r sm:w-40 shrink-0">
                {profile ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xl mb-2">👤</div>
                    <div className="text-sm font-bold text-slate-900">{profile.name}</div>
                    <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                      <div>Class: <span className="text-slate-700">{profile.className}</span></div>
                      <div>Adm No.: <span className="text-slate-700">{profile.admNo}</span></div>
                      <div>Parent: <span className="text-slate-700">{profile.parentPhone}</span></div>
                      <div className="flex items-center gap-1 mt-1">Status today:
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">{profile.statusToday}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 py-4 text-center">No pupils scanned today</div>
                )}
              </div>

              {/* History table */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium">Date</th>
                      <th className="px-2 py-2 text-left font-medium">Arrival</th>
                      <th className="px-2 py-2 text-left font-medium">Departure</th>
                      <th className="px-2 py-2 text-left font-medium">SMS</th>
                      <th className="px-2 py-2 text-left font-medium">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.length === 0 && (
                      <tr><td colSpan={5} className="px-2 py-4 text-center text-slate-400">No history</td></tr>
                    )}
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td className="px-2 py-2 text-slate-600">{h.date}</td>
                        <td className="px-2 py-2 text-slate-700">{h.arrival}</td>
                        <td className="px-2 py-2">
                          <span className={h.departure === "No exit" ? "text-orange-500 font-semibold" : "text-slate-700"}>
                            {h.departure}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-slate-600">{h.sms}</td>
                        <td className={cn("px-2 py-2", h.remarkColor ?? "text-slate-600")}>{h.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* What this dashboard shows */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3 font-semibold text-slate-900">
              <span>📊</span> What this dashboard shows
            </div>
            <ul className="space-y-2">
              {[
                "Current pupils on site",
                "Pupils already departed",
                "Pending departures and missing exit scans",
                "SMS status for entry and exit alerts",
                "Searchable pupil history and profile",
                "Alerts awaiting action and follow-up",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs text-white">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3 font-semibold text-slate-900">
              <span>⚡</span> Quick actions
            </div>
            <div className="space-y-1">
              {[
                { label: "Search for a pupil", href: "/dashboard/pupils", icon: "🔍" },
                { label: "View full history", href: "/dashboard/attendance", icon: "📋" },
                { label: "Resend failed SMS", href: "/dashboard/messages", icon: "📤" },
                { label: "Record a manual correction", href: "/dashboard/attendance", icon: "✏" },
                { label: "Export a report", href: "/dashboard/reports", icon: "📊" },
                { label: "Check device status", href: "/dashboard/devices", icon: "🖥" },
              ].map((action) => (
                <Link key={action.label} href={action.href}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 group">
                  <div className="flex items-center gap-2 text-sm text-slate-700 group-hover:text-blue-700">
                    <span>{action.icon}</span>
                    {action.label}
                  </div>
                  <span className="text-slate-300 group-hover:text-blue-500">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Platform management footer bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-start gap-3">
          <span className="text-xl">⚙</span>
          <div>
            <div className="font-semibold text-slate-900 text-sm">Platform management</div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-lg">🏛</span>
              <p className="text-xs text-slate-500">
                Built and managed by Kathay Technologies. Each school pays a one-time installation fee and a
                recurring monthly or annual management fee for hosting, support, maintenance, updates and
                dashboard administration. As more schools are onboarded, recurring platform income increases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
