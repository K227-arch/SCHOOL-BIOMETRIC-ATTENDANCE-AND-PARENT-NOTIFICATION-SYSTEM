"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, fullName, formatTime } from "@/lib/utils";

/* ── Inline SVG icons ────────────────────────────────────────────────── */
function Ic({ d, className = "w-5 h-5" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
  );
}
const I = {
  users:   "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  exit:    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  clock:   "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  alert:   "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  doc:     "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  bus:     "M8 17H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-3M8 17v2m0-2h8m0 0v2m-4-6h.01M9 11h6",
  bell:    "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  person:  "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  chart:   "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  bolt:    "M13 10V3L4 14h7v7l9-11h-7z",
  search:  "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  mail:    "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  edit:    "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  export:  "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  device:  "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  info:    "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  cog:     "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
};

type Tab = "overview" | "today" | "departure" | "history" | "reports";

export default function DashboardPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [tab, setTab]                         = useState<Tab>("overview");
  const [busy, setBusy]                       = useState(true);
  const [onSite, setOnSite]                   = useState(0);
  const [departed, setDeparted]               = useState(0);
  const [pendingDeparture, setPendingDeparture] = useState(0);
  const [smsFailed, setSmsFailed]             = useState(0);
  const [recentActivity, setRecentActivity]   = useState<any[]>([]);
  const [depControl, setDepControl]           = useState<any[]>([]);
  const [alerts, setAlerts]                   = useState<any[]>([]);
  const [pupilHistory, setPupilHistory]       = useState<{ pupil: any; rows: any[] } | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: evs }, { data: fups }, { data: smsF }] = await Promise.all([
      supabase.from("attendance_events")
        .select("id,pupil_id,event_type,event_time,result,gate_id,source")
        .eq("school_id", schoolId).gte("event_time", `${today}T00:00:00Z`)
        .order("event_time", { ascending: false }).limit(50),
      supabase.from("follow_ups")
        .select("id,pupil_id,exception_type,status,created_at")
        .eq("school_id", schoolId).neq("status", "closed")
        .order("created_at", { ascending: false }).limit(10),
      supabase.from("sms_notifications")
        .select("id").eq("school_id", schoolId).eq("status", "failed")
        .gte("queued_at", `${today}T00:00:00Z`).limit(200),
    ]);

    const allEvs  = (evs  as any[]) ?? [];
    const fupRows = (fups as any[]) ?? [];

    const arrivalIds  = new Set(allEvs.filter((e: any) => e.event_type === "arrival"   && e.result === "success").map((e: any) => e.pupil_id));
    const departedIds = new Set(allEvs.filter((e: any) => e.event_type === "departure" && e.result === "success").map((e: any) => e.pupil_id));

    setOnSite([...arrivalIds].filter(id => !departedIds.has(id)).length);
    setDeparted(departedIds.size);
    setSmsFailed((smsF as any[])?.length ?? 0);
    setPendingDeparture(fupRows.filter((f: any) => f.exception_type === "missing_scan" || f.exception_type === "unresolved_release").length);

    const pids = [...new Set(allEvs.map((e: any) => e.pupil_id))];
    let pMap: Record<string, any> = {};
    if (pids.length) {
      const { data: pRows } = await supabase.from("pupils")
        .select("id,first_name,last_name,class_name,admission_number")
        .in("id", pids as string[]).limit(pids.length);
      (pRows as any[] ?? []).forEach((p: any) => { pMap[p.id] = p; });
    }

    const evIds = allEvs.map((e: any) => e.id);
    let smsMap: Record<string, string> = {};
    if (evIds.length) {
      const { data: smsRows } = await supabase.from("sms_notifications")
        .select("attendance_event_id,status")
        .in("attendance_event_id", evIds as string[]).limit(evIds.length);
      (smsRows as any[] ?? []).forEach((s: any) => { smsMap[s.attendance_event_id] = s.status; });
    }

    setRecentActivity(allEvs.slice(0, 6).map((e: any) => {
      const p = pMap[e.pupil_id];
      return { id: e.id, time: formatTime(e.event_time), name: p ? fullName(p.first_name, p.last_name) : "-", event: e.event_type === "arrival" ? "Arrival" : "Departure", gate: "Main Gate", sms: smsMap[e.id] ?? "queued" };
    }));

    setDepControl(allEvs.filter((e: any) => e.event_type === "arrival" && e.result === "success").slice(0, 5).map((e: any) => {
      const p = pMap[e.pupil_id];
      return { id: e.id, name: p ? fullName(p.first_name, p.last_name) : "-", pickup: "Parent", status: departedIds.has(e.pupil_id) ? "Released" : "Pending", time: formatTime(e.event_time), sms: smsMap[e.id] ?? "queued" };
    }));

    const alertTypeMap: Record<string, { label: string; action: string; color: string }> = {
      late_arrival:        { label: "Late arrival",        action: "Inform class teacher",        color: "amber" },
      failed_sms:          { label: "SMS failed",          action: "Retry and confirm number",    color: "rose"  },
      missing_scan:        { label: "Missing exit review", action: "Check before close of day",   color: "blue"  },
      unresolved_release:  { label: "Unresolved release",  action: "Verify pickup authorisation", color: "amber" },
      early_exit:          { label: "Early exit",          action: "Verify with class teacher",   color: "amber" },
      unknown_fingerprint: { label: "Unknown fingerprint", action: "Check device logs",           color: "rose"  },
      duplicate_scan:      { label: "Duplicate scan",      action: "Review event log",            color: "blue"  },
    };
    setAlerts(fupRows.slice(0, 4).map((f: any) => {
      const info = alertTypeMap[f.exception_type] ?? { label: f.exception_type?.replace(/_/g, " ") ?? "Unknown", action: "Review case", color: "blue" };
      return { id: f.id, ...info, time: formatTime(f.created_at) };
    }));

    if (pids.length > 0) {
      const firstPid = allEvs[0]?.pupil_id;
      const p = pMap[firstPid];
      if (p) {
        const { data: histEvs } = await supabase.from("attendance_events")
          .select("id,event_type,event_time,result")
          .eq("school_id", schoolId).eq("pupil_id", firstPid)
          .order("event_time", { ascending: false }).limit(4);
        const histRows = (histEvs as any[] ?? []).map((e: any) => ({
          date:      new Date(e.event_time).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          arrival:   e.event_type === "arrival"   ? formatTime(e.event_time) : "-",
          departure: e.event_type === "departure" ? formatTime(e.event_time) : "-",
          sms:       "Both",
          remark:    e.result === "success" ? "Normal" : "Review open",
        }));
        setPupilHistory({ pupil: p, rows: histRows });
      }
    }

    setBusy(false);
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  /* ── Badges ──────────────────────────────────────────────────────── */
  const smsTag = (s: string) => {
    if (s === "delivered" || s === "sent")
      return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700">Sent</span>;
    if (s === "failed")
      return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700">Not sent</span>;
    return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700">Pending</span>;
  };

  const statusTag = (s: string) => {
    if (s === "Released")   return <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700">Released</span>;
    if (s === "Authorised") return <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700">Authorised</span>;
    return <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700">Pending</span>;
  };

  /* ── Alert icon ─────────────────────────────────────────────────── */
  const alertIcon = (color: string) => {
    if (color === "amber") return <span className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0"><Ic d={I.alert} className="w-3.5 h-3.5 text-amber-600" /></span>;
    if (color === "rose")  return <span className="w-6 h-6 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0"><Ic d={I.alert} className="w-3.5 h-3.5 text-red-600" /></span>;
    return <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center shrink-0"><Ic d={I.info} className="w-3.5 h-3.5 text-blue-600" /></span>;
  };

  return (
    <div className="space-y-5">

      {/* ── Tab bar (Overview / Today / Departure Control / History / Reports) ── */}
      <div className="bg-white border-b border-slate-200 -mx-4 lg:-mx-6 px-4 lg:px-6">
        <div className="flex items-center gap-1 pt-2 overflow-x-auto">
          {([
            ["overview",  "Overview"],
            ["today",     "Today"],
            ["departure", "Departure Control"],
            ["history",   "History"],
            ["reports",   "Reports"],
          ] as [Tab, string][]).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setTab(key)}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-t border-b-2 whitespace-nowrap shrink-0 transition-colors",
                tab === key
                  ? "bg-blue-600 text-white border-blue-600"
                  : "text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50"
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Welcome banner ── */}
      <div className="rounded-xl p-5 text-white shadow-lg relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #1a56a0 40%, #0ea5e9 100%)" }}>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)" }} />
        <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)" }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-base font-bold">{context?.school_name ?? "My School"}</h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live
              </span>
            </div>
            <p className="text-blue-100 text-xs">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              {" · "}Official hours 07:00 - 16:30{" · "}Gateway online
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/dashboard/attendance"
              className="px-3 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-lg border border-white/20 transition-colors backdrop-blur-sm">
              Live feed
            </Link>
            <Link href="/dashboard/departures"
              className="px-3 py-1.5 text-xs font-semibold bg-white text-blue-700 hover:bg-blue-50 rounded-lg transition-colors shadow-sm">
              Departure control
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4 KPI tiles (matches image: colored circle + big number) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pupils on site",     value: onSite,          iconPath: I.users,  bg: "bg-emerald-500", href: "/dashboard/attendance" },
          { label: "Already departed",   value: departed,        iconPath: I.exit,   bg: "bg-blue-500",    href: "/dashboard/departures" },
          { label: "Pending departures", value: pendingDeparture,iconPath: I.clock,  bg: "bg-amber-500",   href: "/dashboard/departures" },
          { label: "SMS failed",         value: smsFailed,       iconPath: I.alert,  bg: "bg-red-500",     href: "/dashboard/messages"  },
        ].map((k) => (
          <Link key={k.label} href={k.href}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all flex items-center gap-3"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.04)" }}>
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0", k.bg)}>
              <Ic d={k.iconPath} className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 leading-tight">{k.label}</div>
              <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 leading-tight">
                {busy ? "-" : k.value}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── 3-col panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent activity */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Ic d={I.doc} className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent activity</h3>
            </div>
            <Link href="/dashboard/attendance" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all -&gt;</Link>
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
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">{row.time}</td>
                    <td className="py-2 px-3 font-medium text-slate-800 whitespace-nowrap">{row.name}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={cn("text-[11px] font-semibold", row.event === "Arrival" ? "text-emerald-700" : "text-blue-700")}>
                        {row.event}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px] whitespace-nowrap">{row.gate}</td>
                    <td className="py-2 px-3">{smsTag(row.sms)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-slate-50 mt-auto space-y-0.5">
            <p className="text-[10px] text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Shows latest scans and SMS status</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Covers both arrival and departure events</p>
          </div>
        </div>

        {/* Departure control */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Ic d={I.bus} className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Departure control</h3>
            </div>
            <Link href="/dashboard/departures" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all -&gt;</Link>
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
          <div className="px-4 py-2 border-t border-slate-50 mt-auto space-y-0.5">
            <p className="text-[10px] text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Tracks release status and pickup person</p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Flags incomplete departures for review</p>
          </div>
        </div>

        {/* Alerts and follow-up */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Ic d={I.bell} className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Alerts and follow-up</h3>
            </div>
            <Link href="/dashboard/followups" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all -&gt;</Link>
          </div>
          <div className="flex-1 p-3 space-y-2">
            {alerts.length === 0 && !busy && (
              <div className="py-6 text-center text-xs text-slate-400">No open alerts</div>
            )}
            {alerts.map(a => (
              <Link key={a.id} href="/dashboard/followups"
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                {alertIcon(a.color)}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900">{a.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Action: {a.action}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom 2-col: Pupil history + (What dashboard shows + Quick actions) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pupil history and profile */}
        <div className="card">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <Ic d={I.person} className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Pupil history and profile</h3>
          </div>
          {pupilHistory ? (
            <div className="p-4 flex flex-col sm:flex-row gap-4">
              <div className="shrink-0 sm:w-36 w-full flex sm:block items-center gap-3 sm:gap-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mb-0 sm:mb-2">
                  <Ic d={I.person} className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">
                    {fullName(pupilHistory.pupil.first_name, pupilHistory.pupil.last_name)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                    <div>Class: {pupilHistory.pupil.class_name ?? "-"}</div>
                    <div>Adm No.: {pupilHistory.pupil.admission_number ?? "-"}</div>
                    <div>Parent: 07XX XXX XXX</div>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700">Present</span>
                    </div>
                  </div>
                </div>
              </div>
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
                        <td className="py-1.5 px-2 font-mono text-[11px] text-emerald-700">{r.arrival}</td>
                        <td className="py-1.5 px-2 font-mono text-[11px] text-blue-700">{r.departure}</td>
                        <td className="py-1.5 px-2 text-[11px] text-slate-500">{r.sms}</td>
                        <td className="py-1.5 px-2">
                          <span className={cn("text-[10px] font-semibold", r.remark === "Normal" ? "text-slate-400" : "text-red-600")}>{r.remark}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              {busy ? "Loading..." : "No pupil activity today"}
            </div>
          )}
        </div>

        {/* Right col */}
        <div className="space-y-4">

          {/* What this dashboard shows */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Ic d={I.chart} className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">What this dashboard shows</h3>
            </div>
            <ul className="space-y-2">
              {[
                "Current pupils on site",
                "Pupils already departed",
                "Pending departures and missing exit scans",
                "SMS status for entry and exit alerts",
                "Searchable pupil history and profile",
                "Alerts awaiting action and follow-up",
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <Ic d={I.bolt} className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Quick actions</h3>
            </div>
            <div className="p-1">
              {[
                { label: "Search for a pupil",          href: "/dashboard/pupils",     icon: I.search },
                { label: "View full history",            href: "/dashboard/reports",    icon: I.doc    },
                { label: "Resend failed SMS",            href: "/dashboard/messages",   icon: I.mail   },
                { label: "Record a manual correction",   href: "/dashboard/attendance", icon: I.edit   },
                { label: "Export a report",              href: "/dashboard/reports",    icon: I.export },
                { label: "Check device status",          href: "/dashboard/devices",    icon: I.device },
              ].map(a => (
                <Link key={a.label} href={a.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors group">
                  <div className="flex items-center gap-2">
                    <Ic d={a.icon} className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span>{a.label}</span>
                  </div>
                  <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
