"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, fullName, formatTime } from "@/lib/utils";

type Tab = "overview" | "today" | "departure" | "history" | "reports";

export default function DashboardPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [tab, setTab] = useState<Tab>("overview");
  const [busy, setBusy] = useState(true);

  // KPI counts
  const [onSite,           setOnSite]           = useState(0);
  const [departed,         setDeparted]          = useState(0);
  const [pendingDeparture, setPendingDeparture]  = useState(0);
  const [smsFailed,        setSmsFailed]         = useState(0);

  // Panel data
  const [recentActivity,  setRecentActivity]  = useState<any[]>([]);
  const [depControl,      setDepControl]      = useState<any[]>([]);
  const [alerts,          setAlerts]          = useState<any[]>([]);
  const [pupilHistory,    setPupilHistory]    = useState<{ pupil: any; rows: any[] } | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: evs }, { data: fups }, { data: smsF }] = await Promise.all([
      supabase.from("attendance_events")
        .select("id,pupil_id,event_type,event_time,result,gate_id,source")
        .eq("school_id", schoolId)
        .gte("event_time", `${today}T00:00:00Z`)
        .order("event_time", { ascending: false })
        .limit(50),
      supabase.from("follow_ups")
        .select("id,pupil_id,exception_type,status,created_at")
        .eq("school_id", schoolId)
        .neq("status", "closed")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("sms_notifications")
        .select("id")
        .eq("school_id", schoolId)
        .eq("status", "failed")
        .gte("queued_at", `${today}T00:00:00Z`)
        .limit(200),
    ]);

    const allEvs = (evs as any[]) ?? [];
    const fupRows = (fups as any[]) ?? [];

    // Pupil ID sets
    const arrivalIds  = new Set(allEvs.filter((e: any) => e.event_type === "arrival"   && e.result === "success").map((e: any) => e.pupil_id));
    const departedIds = new Set(allEvs.filter((e: any) => e.event_type === "departure" && e.result === "success").map((e: any) => e.pupil_id));
    const onSiteIds   = [...arrivalIds].filter(id => !departedIds.has(id));

    setOnSite(onSiteIds.length);
    setDeparted(departedIds.size);
    setSmsFailed((smsF as any[])?.length ?? 0);

    // Pending departures = pupils arrived but not yet departed AND have an open follow-up
    const pendingDep = fupRows.filter((f: any) => f.exception_type === "missing_scan" || f.exception_type === "unresolved_release");
    setPendingDeparture(pendingDep.length);

    // Pupil name lookup
    const pids = [...new Set(allEvs.map((e: any) => e.pupil_id))];
    let pMap: Record<string, any> = {};
    if (pids.length) {
      const { data: pRows } = await supabase.from("pupils")
        .select("id,first_name,last_name,class_name,admission_number")
        .in("id", pids as string[])
        .limit(pids.length);
      (pRows as any[] ?? []).forEach((p: any) => (pMap[p.id] = p));
    }

    // SMS status per event
    const evIds = allEvs.map((e: any) => e.id);
    let smsMap: Record<string, string> = {};
    if (evIds.length) {
      const { data: smsRows } = await supabase.from("sms_notifications")
        .select("attendance_event_id,status")
        .in("attendance_event_id", evIds as string[])
        .limit(evIds.length);
      (smsRows as any[] ?? []).forEach((s: any) => (smsMap[s.attendance_event_id] = s.status));
    }

    // Recent activity (latest 6 events)
    setRecentActivity(allEvs.slice(0, 6).map((e: any) => {
      const p = pMap[e.pupil_id];
      return {
        id: e.id,
        time: formatTime(e.event_time),
        name: p ? fullName(p.first_name, p.last_name) : "—",
        event: e.event_type === "arrival" ? "Arrival" : "Departure",
        gate: "Main Gate",
        sms: smsMap[e.id] ?? "queued",
      };
    }));

    // Departure control (arrival events for pupils still on site)
    const depRows = allEvs
      .filter((e: any) => e.event_type === "arrival" && e.result === "success")
      .slice(0, 5)
      .map((e: any) => {
        const p = pMap[e.pupil_id];
        const hasDep = departedIds.has(e.pupil_id);
        return {
          id: e.id,
          name: p ? fullName(p.first_name, p.last_name) : "—",
          pickup: "Parent",
          status: hasDep ? "Released" : "Pending",
          time: formatTime(e.event_time),
          sms: smsMap[e.id] ?? "queued",
        };
      });
    setDepControl(depRows);

    // Alerts
    const alertRows = fupRows.slice(0, 4).map((f: any) => {
      const typeMap: Record<string, { label: string; action: string; icon: string; color: string }> = {
        late_arrival:         { label: "Late arrival",         action: "Inform class teacher",        icon: "⚠️",  color: "amber" },
        failed_sms:           { label: "SMS failed",           action: "Retry and confirm number",    icon: "❌",  color: "rose" },
        missing_scan:         { label: "Missing exit review",  action: "Check before close of day",   icon: "ℹ️",  color: "blue" },
        unresolved_release:   { label: "Unresolved release",   action: "Verify pickup authorisation", icon: "⚠️",  color: "amber" },
        early_exit:           { label: "Early exit",           action: "Verify with class teacher",   icon: "⚠️",  color: "amber" },
        unknown_fingerprint:  { label: "Unknown fingerprint",  action: "Check device logs",           icon: "❌",  color: "rose" },
        duplicate_scan:       { label: "Duplicate scan",       action: "Review event log",            icon: "ℹ️",  color: "blue" },
      };
      const info = typeMap[f.exception_type] ?? { label: f.exception_type?.replace(/_/g, " "), action: "Review case", icon: "ℹ️", color: "blue" };
      return { id: f.id, ...info, time: formatTime(f.created_at) };
    });
    setAlerts(alertRows);

    // Pupil history — pick the most recently scanned pupil
    if (pids.length > 0) {
      const firstPid = allEvs[0]?.pupil_id;
      const p = pMap[firstPid];
      if (p) {
        // Get last 4 days of events for this pupil
        const { data: histEvs } = await supabase.from("attendance_events")
          .select("id,event_type,event_time,result")
          .eq("school_id", schoolId)
          .eq("pupil_id", firstPid)
          .order("event_time", { ascending: false })
          .limit(4);
        const histRows = (histEvs as any[] ?? []).map((e: any) => ({
          date: new Date(e.event_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          arrival: e.event_type === "arrival" ? formatTime(e.event_time) : "—",
          departure: e.event_type === "departure" ? formatTime(e.event_time) : "—",
          sms: smsMap[e.id] ?? "Both",
          remark: e.result === "success" ? "Normal" : "Review open",
        }));
        setPupilHistory({ pupil: p, rows: histRows });
      }
    }

    setBusy(false);
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const smsTag = (s: string) => {
    if (s === "delivered" || s === "sent") return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700">Sent</span>;
    if (s === "failed")                    return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700">Not sent</span>;
    return                                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700">Pending</span>;
  };

  const statusTag = (s: string) => {
    if (s === "Released")   return <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700">Released</span>;
    if (s === "Authorised") return <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700">Authorised</span>;
    return                         <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700">Pending</span>;
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}>

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-slate-200 px-5">
        <div className="flex items-center gap-1 pt-2 overflow-x-auto scrollbar-none">
          {([
            ["overview",   "Overview"],
            ["today",      "Today"],
            ["departure",  "Departure Control"],
            ["history",    "History"],
            ["reports",    "Reports"],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-t transition-colors border-b-2 whitespace-nowrap shrink-0",
                tab === key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── 4 KPI tiles ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Pupils on site",
              value: onSite,
              icon: "👥",
              iconBg: "bg-emerald-500",
              href: "/dashboard/attendance",
            },
            {
              label: "Already departed",
              value: departed,
              icon: "↩",
              iconBg: "bg-blue-500",
              href: "/dashboard/departures",
            },
            {
              label: "Pending departures",
              value: pendingDeparture,
              icon: "⏰",
              iconBg: "bg-amber-500",
              href: "/dashboard/departures",
            },
            {
              label: "SMS failed",
              value: smsFailed,
              icon: "⚠",
              iconBg: "bg-red-500",
              href: "/dashboard/messages",
            },
          ].map((k) => (
            <Link
              key={k.label}
              href={k.href}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shrink-0", k.iconBg)}>
                {k.icon}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 leading-tight">{k.label}</div>
                <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 leading-tight">
                  {busy ? "—" : k.value}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── 3-col panels ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Recent activity ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">📋</span>
                <h3 className="text-sm font-bold text-slate-900">Recent activity</h3>
              </div>
              <Link href="/dashboard/attendance" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                    <th className="py-2 px-3 text-left font-medium">Time</th>
                    <th className="py-2 px-3 text-left font-medium">Pupil</th>
                    <th className="py-2 px-3 text-left font-medium">Event</th>
                    <th className="py-2 px-3 text-left font-medium">Gate</th>
                    <th className="py-2 px-3 text-left font-medium">SMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentActivity.length === 0 && !busy && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-xs">No events today yet</td></tr>
                  )}
                  {recentActivity.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{row.time}</td>
                      <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">{row.name}</td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{row.event}</td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{row.gate}</td>
                      <td className="py-2 px-3">{smsTag(row.sms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-slate-50 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shrink-0"></span>
                Shows latest scans and SMS status
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shrink-0"></span>
                Covers both arrival and departure events
              </div>
            </div>
          </div>

          {/* ── Departure control ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🚌</span>
                <h3 className="text-sm font-bold text-slate-900">Departure control</h3>
              </div>
              <Link href="/dashboard/departures" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                    <th className="py-2 px-3 text-left font-medium">Pupil</th>
                    <th className="py-2 px-3 text-left font-medium">Pickup</th>
                    <th className="py-2 px-3 text-left font-medium">Status</th>
                    <th className="py-2 px-3 text-left font-medium">Time</th>
                    <th className="py-2 px-3 text-left font-medium">SMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {depControl.length === 0 && !busy && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-xs">No departures today yet</td></tr>
                  )}
                  {depControl.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">{row.name}</td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{row.pickup}</td>
                      <td className="py-2 px-3">{statusTag(row.status)}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{row.time}</td>
                      <td className="py-2 px-3">{smsTag(row.sms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-slate-50 space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shrink-0"></span>
                Tracks release status and pickup person
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block shrink-0"></span>
                Flags incomplete departures for review
              </div>
            </div>
          </div>

          {/* ── Alerts and follow-up ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">🔔</span>
                <h3 className="text-sm font-bold text-slate-900">Alerts and follow-up</h3>
              </div>
              <Link href="/dashboard/followups" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
            </div>
            <div className="flex-1 p-3 space-y-2">
              {alerts.length === 0 && !busy && (
                <div className="py-6 text-center text-xs text-slate-400">No open alerts 🎉</div>
              )}
              {alerts.map(a => (
                <Link key={a.id} href="/dashboard/followups"
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors hover:opacity-90",
                    a.color === "amber" ? "bg-amber-50 border-amber-200" :
                    a.color === "rose"  ? "bg-red-50 border-red-200" :
                                          "bg-blue-50 border-blue-200"
                  )}>
                  <span className="text-lg shrink-0 mt-0.5">{a.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-xs font-bold",
                      a.color === "amber" ? "text-amber-800" :
                      a.color === "rose"  ? "text-red-700" : "text-blue-700"
                    )}>{a.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Action: {a.action}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom 2-col: Pupil history + Quick actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Pupil history and profile */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">👤</span>
                <h3 className="text-sm font-bold text-slate-900">Pupil history and profile</h3>
              </div>
            </div>
            {pupilHistory ? (
              <div className="p-4 flex flex-col sm:flex-row gap-4">
                {/* Profile card */}
                <div className="shrink-0 sm:w-32 w-full flex sm:block items-center gap-3 sm:gap-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl mb-2">👤</div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">
                    {fullName(pupilHistory.pupil.first_name, pupilHistory.pupil.last_name)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                    <div>Class: {pupilHistory.pupil.class_name ?? "—"}</div>
                    <div>Adm No.: {pupilHistory.pupil.admission_number ?? "—"}</div>
                    <div>Parent: 07XX XXX XXX</div>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700">Present</span>
                    </div>
                  </div>
                </div>
                {/* History table */}
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                        <th className="py-1 px-2 text-left font-medium">Date</th>
                        <th className="py-1 px-2 text-left font-medium">Arrival</th>
                        <th className="py-1 px-2 text-left font-medium">Departure</th>
                        <th className="py-1 px-2 text-left font-medium">SMS</th>
                        <th className="py-1 px-2 text-left font-medium">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pupilHistory.rows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/70">
                          <td className="py-1.5 px-2 font-mono text-[11px] text-slate-500">{r.date}</td>
                          <td className="py-1.5 px-2 font-mono text-[11px] text-slate-700">{r.arrival}</td>
                          <td className="py-1.5 px-2 font-mono text-[11px] text-slate-700">{r.departure}</td>
                          <td className="py-1.5 px-2 text-[11px] text-slate-500">{r.sms}</td>
                          <td className="py-1.5 px-2">
                            <span className={cn("text-[10px] font-semibold",
                              r.remark === "Normal" ? "text-slate-500" : "text-red-600"
                            )}>{r.remark}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                {busy ? "Loading…" : "No pupil data available today"}
              </div>
            )}
          </div>

          {/* Right col: What dashboard shows + Quick actions */}
          <div className="space-y-4">

            {/* What this dashboard shows */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <span className="text-blue-600">📊</span>
                <h3 className="text-sm font-bold text-slate-900">What this dashboard shows</h3>
              </div>
              <ul className="p-4 space-y-2">
                {[
                  "Current pupils on site",
                  "Pupils already departed",
                  "Pending departures and missing exit scans",
                  "SMS status for entry and exit alerts",
                  "Searchable pupil history and profile",
                  "Alerts awaiting action and follow-up",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
                <span className="text-yellow-500">⚡</span>
                <h3 className="text-sm font-bold text-slate-900">Quick actions</h3>
              </div>
              <div className="p-2">
                {[
                  { label: "Search for a pupil",      href: "/dashboard/pupils",     icon: "🔍" },
                  { label: "View full history",        href: "/dashboard/reports",    icon: "📋" },
                  { label: "Resend failed SMS",        href: "/dashboard/messages",   icon: "📨" },
                  { label: "Record a manual correction", href: "/dashboard/attendance", icon: "✏️" },
                  { label: "Export a report",          href: "/dashboard/reports",    icon: "📊" },
                  { label: "Check device status",      href: "/dashboard/devices",    icon: "⚙️" },
                ].map(a => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span>{a.icon}</span>
                      <span>{a.label}</span>
                    </div>
                    <span className="text-slate-300 group-hover:text-blue-500">›</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
