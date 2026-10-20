"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, fullName, formatTime } from "@/lib/utils";

export default function SchoolDashboard() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [stats, setStats] = useState({ onSite: 0, departed: 0, pending: 0, smsFailed: 0, total: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: pupils }, { data: evs }, { data: deps }, { data: fups }, { data: smsF }] = await Promise.all([
      insforge.database.from("pupils").select("id,status").eq("school_id", schoolId).eq("status", "active"),
      insforge.database.from("attendance_events").select("id,pupil_id,event_type,event_time,result,gate_id").eq("school_id", schoolId).gte("event_time", today).order("event_time", { ascending: false }).limit(8),
      insforge.database.from("attendance_events").select("id,pupil_id,event_type,event_time").eq("school_id", schoolId).eq("event_type", "departure").gte("event_time", today).order("event_time", { ascending: false }).limit(5),
      insforge.database.from("follow_ups").select("id,pupil_id,exception_type,status,created_at").eq("school_id", schoolId).neq("status", "closed").order("created_at", { ascending: false }).limit(3),
      insforge.database.from("sms_notifications").select("id").eq("school_id", schoolId).eq("status", "failed").gte("queued_at", today),
    ]);

    const allPupils = (pupils as any[]) ?? [];
    const allEvs = (evs as any[]) ?? [];

    // compute on-site: has arrival but no departure today
    const arrivalIds = new Set(allEvs.filter((e: any) => e.event_type === "arrival" && e.result === "success").map((e: any) => e.pupil_id));
    const departureIds = new Set(allEvs.filter((e: any) => e.event_type === "departure" && e.result === "success").map((e: any) => e.pupil_id));
    const onSite = [...arrivalIds].filter(id => !departureIds.has(id)).length;
    const departed = departureIds.size;

    // fetch pupil names for recent logs
    const pupilIds = [...new Set(allEvs.map((e: any) => e.pupil_id))];
    let pMap: Record<string, any> = {};
    if (pupilIds.length) {
      const { data: pRows } = await insforge.database.from("pupils").select("id,first_name,last_name,class_name,admission_number").in("id", pupilIds).limit(pupilIds.length);
      (pRows as any[] ?? []).forEach((p: any) => (pMap[p.id] = p));
    }

    // fetch sms for logs
    const evIds = allEvs.map((e: any) => e.id);
    let smsMap: Record<string, string> = {};
    if (evIds.length) {
      const { data: smsRows } = await insforge.database.from("sms_notifications").select("attendance_event_id,status").in("attendance_event_id", evIds).limit(evIds.length);
      (smsRows as any[] ?? []).forEach((s: any) => (smsMap[s.attendance_event_id] = s.status));
    }

    const logs = allEvs.map((e: any) => {
      const p = pMap[e.pupil_id];
      return {
        id: e.id,
        time: formatTime(e.event_time),
        name: p ? fullName(p.first_name, p.last_name) : "—",
        class: p?.class_name ?? "—",
        direction: e.event_type,
        gate: "Main Gate",
        sms: smsMap[e.id] ?? "—",
      };
    });

    // departure pupil names
    const depPupilIds = [...new Set((deps as any[] ?? []).map((d: any) => d.pupil_id))];
    let depPMap: Record<string, any> = {};
    if (depPupilIds.length) {
      const { data: dp } = await insforge.database.from("pupils").select("id,first_name,last_name,class_name").in("id", depPupilIds).limit(depPupilIds.length);
      (dp as any[] ?? []).forEach((p: any) => (depPMap[p.id] = p));
    }

    const depList = (deps as any[] ?? []).map((d: any) => {
      const p = depPMap[d.pupil_id];
      return { id: d.id, name: p ? fullName(p.first_name, p.last_name) : "—", class: p?.class_name ?? "—", time: formatTime(d.event_time), status: "released" };
    });

    // followup pupil names
    const fuPupilIds = [...new Set((fups as any[] ?? []).map((f: any) => f.pupil_id))];
    let fuPMap: Record<string, any> = {};
    if (fuPupilIds.length) {
      const { data: fp } = await insforge.database.from("pupils").select("id,first_name,last_name").in("id", fuPupilIds).limit(fuPupilIds.length);
      (fp as any[] ?? []).forEach((p: any) => (fuPMap[p.id] = p));
    }

    setStats({ onSite, departed, pending: (fups as any[] ?? []).filter((f: any) => f.status === "open").length, smsFailed: (smsF as any[] ?? []).length, total: allPupils.length });
    setRecentLogs(logs);
    setDepartures(depList);
    setFollowups((fups as any[] ?? []).map((f: any) => ({ id: f.id, name: fuPMap[f.pupil_id] ? fullName(fuPMap[f.pupil_id].first_name, fuPMap[f.pupil_id].last_name) : "—", type: f.exception_type, status: f.status, time: formatTime(f.created_at) })));
    setBusy(false);
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const schoolName = context?.school_name ?? "Greenhill Primary School";

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 lg:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{schoolName} · Morning &amp; Afternoon Gate Control</h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Sync Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Term III, Week 6 · Official hours: 07:00 AM – 04:30 PM · Local edge gateway: <span className="font-mono text-slate-700 font-medium">ONLINE (0 queued)</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/attendance" className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">Live Turnstile Feed</Link>
          <Link href="/dashboard/departures" className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors">Departure Control</Link>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pupils on site", value: busy ? "—" : stats.onSite, sub: `/ ${stats.total} enrolled`, pct: stats.total ? Math.round(stats.onSite / stats.total * 100) + "%" : "—", icon: "✔", color: "emerald", href: "/dashboard/attendance" },
          { label: "Already departed", value: busy ? "—" : stats.departed, sub: `/ ${stats.total} enrolled`, pct: stats.total ? Math.round(stats.departed / stats.total * 100) + "%" : "—", icon: "→", color: "blue", href: "/dashboard/departures" },
          { label: "Pending departures", value: busy ? "—" : stats.pending, sub: "awaiting pickup check", pct: "Requires approval", icon: "⏱", color: "amber", href: "/dashboard/departures" },
          { label: "SMS failed", value: busy ? "—" : stats.smsFailed, sub: "undelivered today", pct: "Needs number check", icon: "⚠", color: "rose", href: "/dashboard/messages" },
        ].map((k, i) => (
          <Link key={i} href={k.href}
            className={cn("bg-white p-4 lg:p-5 rounded-xl border shadow-xs hover:shadow-sm transition-all cursor-pointer group",
              k.color === "emerald" ? "border-slate-200 hover:border-emerald-300" :
              k.color === "blue" ? "border-slate-200 hover:border-blue-300" :
              k.color === "amber" ? "border-slate-200 hover:border-amber-300" : "border-slate-200 hover:border-rose-300")}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{k.label}</span>
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-base group-hover:scale-105 transition-transform",
                k.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                k.color === "blue" ? "bg-blue-50 text-blue-600" :
                k.color === "amber" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600")}>{k.icon}</div>
            </div>
            <div className={cn("mt-2 text-3xl font-extrabold font-mono tracking-tight tabular-nums",
              k.color === "amber" ? "text-amber-600" : k.color === "rose" ? "text-rose-600" : "text-slate-900")}>
              {k.value}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              <span className={cn("font-medium font-mono mr-1",
                k.color === "emerald" ? "text-emerald-600" : k.color === "blue" ? "text-blue-600" : k.color === "amber" ? "text-amber-700" : "text-rose-600")}>
                {k.pct}
              </span>{k.sub}
            </div>
          </Link>
        ))}
      </div>

      {/* 3-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Recent activity */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-blue-600">⏱</span><h2 className="text-sm font-bold text-slate-900">Recent activity</h2></div>
            <Link href="/dashboard/attendance" className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1">View all →</Link>
          </div>
          <div className="p-3 flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                <th className="pb-2 font-medium">Time</th><th className="pb-2 font-medium">Pupil</th><th className="pb-2 font-medium">Event</th><th className="pb-2 font-medium text-right">SMS</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {recentLogs.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-400">No events today yet</td></tr>}
                {recentLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 font-mono text-[11px] text-slate-500">{log.time}</td>
                    <td className="py-2 font-medium text-slate-900"><div className="truncate max-w-[90px]">{log.name}</div><div className="text-[10px] text-slate-400">{log.class}</div></td>
                    <td className="py-2"><span className={cn("text-[11px] font-medium", log.direction === "arrival" ? "text-emerald-700" : "text-blue-700")}>{log.direction === "arrival" ? "Arrival" : "Departure"}</span></td>
                    <td className="py-2 text-right"><span className={cn("font-mono text-[10px] px-1.5 py-0.5 rounded",
                      log.sms === "delivered" ? "text-emerald-700 bg-emerald-50" : log.sms === "sent" ? "text-blue-700 bg-blue-50" : log.sms === "failed" ? "text-rose-700 bg-rose-50" : "text-amber-700 bg-amber-50"
                    )}>{log.sms === "delivered" ? "Delivered" : log.sms === "sent" ? "Sent" : log.sms === "failed" ? "Failed" : log.sms === "—" ? "—" : "Pending"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Latest scans and SMS status</span><span>Arrival and departure</span>
          </div>
        </div>

        {/* Departure control */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-blue-600">→</span><h2 className="text-sm font-bold text-slate-900">Departure control</h2></div>
            <Link href="/dashboard/departures" className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1">View all →</Link>
          </div>
          <div className="p-3 flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                <th className="pb-2 font-medium">Pupil</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Time</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {departures.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-slate-400">No departures today</td></tr>}
                {departures.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 font-medium text-slate-900"><div>{d.name}</div><div className="text-[10px] text-slate-400">{d.class}</div></td>
                    <td className="py-2.5"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Released</span></td>
                    <td className="py-2.5 font-mono text-[11px] text-slate-600">{d.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
            <div>• Tracks release status and pickup person</div>
            <div>• Flags incomplete departures for review</div>
          </div>
        </div>

        {/* Alerts & followups */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-amber-600">⚠</span><h2 className="text-sm font-bold text-slate-900">Alerts and follow-up</h2></div>
            <Link href="/dashboard/followups" className="text-xs text-blue-700 font-medium">View all →</Link>
          </div>
          <div className="p-4 flex-1 space-y-3">
            {followups.length === 0 && <div className="text-xs text-slate-400 py-4 text-center">No open follow-ups</div>}
            {followups.map((f, i) => {
              const colors = [
                { bg: "bg-amber-50/70 border-amber-200 hover:bg-amber-50", icon: "bg-amber-100 text-amber-700", text: "text-amber-950", sub: "text-amber-800" },
                { bg: "bg-rose-50/70 border-rose-200 hover:bg-rose-50", icon: "bg-rose-100 text-rose-700", text: "text-rose-950", sub: "text-rose-800" },
                { bg: "bg-blue-50/70 border-blue-200 hover:bg-blue-50", icon: "bg-blue-100 text-blue-700", text: "text-blue-950", sub: "text-blue-800" },
              ][i % 3];
              return (
                <Link key={f.id} href="/dashboard/followups"
                  className={`p-3 rounded-lg border ${colors.bg} transition-colors flex items-start gap-3`}>
                  <div className={`w-7 h-7 rounded-full ${colors.icon} flex items-center justify-center font-bold text-xs shrink-0`}>!</div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${colors.text} flex justify-between`}>
                      <span className="capitalize">{f.type?.replace(/_/g, " ")} · {f.name}</span>
                      <span className="font-mono text-[10px]">{f.time}</span>
                    </div>
                    <div className={`text-[11px] ${colors.sub} mt-0.5`}>Status: {f.status}</div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">Escalates unverified absences after 09:00 AM cutoff</div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Checklist */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-blue-600">🛡</span>
            <h2 className="text-sm font-bold text-slate-900">What this dashboard shows</h2>
          </div>
          <div className="space-y-2.5 text-xs text-slate-700">
            {[
              `Current pupils on site (${stats.onSite} verified)`,
              `Pupils already departed (${stats.departed} verified exits)`,
              "Pending departures and missing exit scans",
              "SMS status for entry and exit alerts (MTN / Airtel receipts)",
              "Searchable pupil history and profile with guardian records",
              "Alerts already actioned and follow-up case statuses",
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <span className="text-blue-600 shrink-0">✔</span><span>{item}</span>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Biometric templates are stored hashed locally on readers; central cloud retains zero raw fingerprint imagery.
          </div>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-blue-600">✏</span>
            <h2 className="text-sm font-bold text-slate-900">Quick actions</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: "Record a manual scan", href: "/dashboard/attendance", icon: "✔" },
              { label: "View full attendance history", href: "/dashboard/attendance", icon: "📅" },
              { label: "Manage departure queue", href: "/dashboard/departures", icon: "→" },
              { label: "Open follow-up queue", href: "/dashboard/followups", icon: "⚠" },
              { label: "SMS notification centre", href: "/dashboard/messages", icon: "✉" },
              { label: "Enrol or edit pupil", href: "/dashboard/pupils", icon: "👤" },
            ].map(a => (
              <Link key={a.label} href={a.href}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-800 transition-colors">
                <div className="flex items-center gap-2"><span className="text-slate-500">{a.icon}</span><span>{a.label}</span></div>
                <span className="text-slate-400">›</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
