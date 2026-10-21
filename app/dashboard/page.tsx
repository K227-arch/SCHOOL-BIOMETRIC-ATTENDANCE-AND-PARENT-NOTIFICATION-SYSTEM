"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, fullName, formatTime } from "@/lib/utils";

export default function UnifiedDashboard() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const isAdmin = context?.role === "school_admin" || context?.is_platform_admin;

  const [ops, setOps] = useState({ onSite: 0, departed: 0, smsFailed: 0, openCases: 0, total: 0 });
  const [admin, setAdmin] = useState({ pupils: 0, guardians: 0, devices: 0, tickets: 0, pendingOnboarding: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);

    // ── Ops data ──────────────────────────────────────────────────────────
    const [{ data: evs }, { data: fups }, { data: smsF }] = await Promise.all([
      insforge.database.from("attendance_events")
        .select("id,pupil_id,event_type,event_time,result,gate_id")
        .eq("school_id", schoolId).gte("event_time", today)
        .order("event_time", { ascending: false }).limit(10),
      insforge.database.from("follow_ups")
        .select("id,pupil_id,exception_type,status,created_at")
        .eq("school_id", schoolId).neq("status", "closed")
        .order("created_at", { ascending: false }).limit(4),
      insforge.database.from("sms_notifications")
        .select("id").eq("school_id", schoolId).eq("status", "failed").gte("queued_at", today),
    ]);

    const allEvs = (evs as any[]) ?? [];
    const arrivalIds = new Set(allEvs.filter((e: any) => e.event_type === "arrival" && e.result === "success").map((e: any) => e.pupil_id));
    const departureIds = new Set(allEvs.filter((e: any) => e.event_type === "departure" && e.result === "success").map((e: any) => e.pupil_id));

    // ── Pupil name lookup ─────────────────────────────────────────────────
    const pids = [...new Set(allEvs.map((e: any) => e.pupil_id))];
    let pMap: Record<string, any> = {};
    if (pids.length) {
      const { data: p2 } = await insforge.database.from("pupils")
        .select("id,first_name,last_name,class_name,admission_number").in("id", pids).limit(pids.length);
      (p2 as any[] ?? []).forEach((p: any) => (pMap[p.id] = p));
    }

    // ── SMS status map ────────────────────────────────────────────────────
    const evIds = allEvs.map((e: any) => e.id);
    let smsMap: Record<string, string> = {};
    if (evIds.length) {
      const { data: smsRows } = await insforge.database.from("sms_notifications")
        .select("attendance_event_id,status").in("attendance_event_id", evIds).limit(evIds.length);
      (smsRows as any[] ?? []).forEach((s: any) => (smsMap[s.attendance_event_id] = s.status));
    }

    setRecentLogs(allEvs.slice(0, 7).map((e: any) => {
      const p = pMap[e.pupil_id];
      return {
        id: e.id, time: formatTime(e.event_time),
        name: p ? fullName(p.first_name, p.last_name) : "—",
        class: p?.class_name ?? "—",
        direction: e.event_type,
        sms: smsMap[e.id] ?? "queued",
      };
    }));

    // ── Follow-up pupil names ─────────────────────────────────────────────
    const fuPids = [...new Set((fups as any[] ?? []).map((f: any) => f.pupil_id))];
    let fuPMap: Record<string, any> = {};
    if (fuPids.length) {
      const { data: fp } = await insforge.database.from("pupils")
        .select("id,first_name,last_name").in("id", fuPids).limit(fuPids.length);
      (fp as any[] ?? []).forEach((p: any) => (fuPMap[p.id] = p));
    }

    setFollowups((fups as any[] ?? []).map((f: any) => ({
      id: f.id, status: f.status, type: f.exception_type, time: formatTime(f.created_at),
      name: fuPMap[f.pupil_id] ? fullName(fuPMap[f.pupil_id].first_name, fuPMap[f.pupil_id].last_name) : "—",
    })));

    // ── Recent departures ─────────────────────────────────────────────────
    const depEvs = allEvs.filter((e: any) => e.event_type === "departure").slice(0, 5);
    setDepartures(depEvs.map((e: any) => {
      const p = pMap[e.pupil_id];
      return { id: e.id, name: p ? fullName(p.first_name, p.last_name) : "—", class: p?.class_name ?? "—", time: formatTime(e.event_time) };
    }));

    setOps({
      onSite: [...arrivalIds].filter(id => !departureIds.has(id)).length,
      departed: departureIds.size,
      smsFailed: (smsF as any[] ?? []).length,
      openCases: (fups as any[] ?? []).filter((f: any) => f.status === "open").length,
      total: pids.length,
    });

    // ── Admin counts (school_admin only) ──────────────────────────────────
    if (isAdmin) {
      const [p, g, d, t, o] = await Promise.all([
        insforge.database.from("pupils").select("id", { count: "exact" }).eq("school_id", schoolId).eq("status", "active").limit(1),
        insforge.database.from("guardians").select("id", { count: "exact" }).eq("school_id", schoolId).limit(1),
        insforge.database.from("devices").select("id", { count: "exact" }).eq("school_id", schoolId).eq("status", "active").limit(1),
        insforge.database.from("support_tickets").select("id", { count: "exact" }).eq("school_id", schoolId).neq("status", "closed").limit(1),
        insforge.database.from("onboarding_checklists").select("id", { count: "exact" }).eq("school_id", schoolId).eq("status", "pending").limit(1),
      ]);
      setAdmin({ pupils: p.count ?? 0, guardians: g.count ?? 0, devices: d.count ?? 0, tickets: t.count ?? 0, pendingOnboarding: o.count ?? 0 });
    }

    setBusy(false);
  }, [schoolId, isAdmin]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const schoolName = context?.school_name ?? "My School";

  const smsColor = (s: string) =>
    s === "delivered" ? "text-emerald-700 bg-emerald-50" :
    s === "sent"      ? "text-blue-700 bg-blue-50" :
    s === "failed"    ? "text-rose-700 bg-rose-50" : "text-amber-700 bg-amber-50";

  const caseColor = (s: string) =>
    s === "open"        ? "bg-rose-50 text-rose-700 border-rose-200" :
    s === "in_progress" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <div className="space-y-6">

      {/* ── Welcome banner ─────────────────────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 p-5 text-white shadow-lg shadow-blue-700/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold">{schoolName}</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                Live
              </span>
            </div>
            <p className="text-blue-100 text-xs">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Official hours 07:00 – 16:30 · Gateway online
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href="/dashboard/attendance" className="px-3 py-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-lg border border-white/20 transition-colors">
              Live feed
            </Link>
            <Link href="/dashboard/departures" className="px-3 py-1.5 text-xs font-semibold bg-white text-blue-700 hover:bg-blue-50 rounded-lg transition-colors shadow-sm">
              Departure control
            </Link>
          </div>
        </div>
      </div>

      {/* ── Ops KPI tiles ───────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Today's Operations</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pupils on site",     value: ops.onSite,    sub: "arrived, not yet departed", icon: "✔", color: "emerald", href: "/dashboard/attendance" },
            { label: "Departed today",     value: ops.departed,  sub: "confirmed gate exits",      icon: "🚪", color: "blue",    href: "/dashboard/departures" },
            { label: "Open exceptions",    value: ops.openCases, sub: "need follow-up action",     icon: "⚠", color: "amber",   href: "/dashboard/followups" },
            { label: "SMS failures today", value: ops.smsFailed, sub: "undelivered notifications", icon: "✉", color: "rose",    href: "/dashboard/messages" },
          ].map((k, i) => (
            <Link key={i} href={k.href}
              className={cn(
                "group bg-white rounded-xl border p-4 shadow-xs hover:shadow-md transition-all",
                k.color === "emerald" ? "border-slate-200 hover:border-emerald-300" :
                k.color === "blue"    ? "border-slate-200 hover:border-blue-300" :
                k.color === "amber"   ? "border-slate-200 hover:border-amber-300" :
                                        "border-slate-200 hover:border-rose-300"
              )}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{k.label}</span>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm group-hover:scale-110 transition-transform",
                  k.color === "emerald" ? "bg-emerald-50" :
                  k.color === "blue"    ? "bg-blue-50" :
                  k.color === "amber"   ? "bg-amber-50" : "bg-rose-50")}>{k.icon}</div>
              </div>
              <div className={cn("text-3xl font-extrabold font-mono tabular-nums",
                k.color === "amber" ? "text-amber-600" : k.color === "rose" ? "text-rose-600" : "text-slate-900")}>
                {busy ? "—" : k.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{k.sub}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Admin stat tiles (school_admin only) ────────────────────────── */}
      {isAdmin && (
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">School Administration</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Enrolled pupils",   value: admin.pupils,            color: "text-blue-700",   href: "/dashboard/pupils",    icon: "🎓" },
              { label: "Guardians",         value: admin.guardians,         color: "text-violet-700", href: "/school/guardians",     icon: "👨‍👩‍👧" },
              { label: "Active devices",    value: admin.devices,           color: "text-indigo-700", href: "/dashboard/devices",    icon: "🖥" },
              { label: "Support tickets",   value: admin.tickets,           color: "text-amber-700",  href: "/school/support",       icon: "🎫" },
              { label: "Onboarding steps",  value: admin.pendingOnboarding, color: "text-rose-700",   href: "/school/onboarding",    icon: "✅" },
            ].map((c, i) => (
              <Link key={i} href={c.href}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md hover:border-blue-300 transition-all">
                <div className="text-xl mb-2">{c.icon}</div>
                <div className={cn("text-2xl font-extrabold font-mono", c.color)}>{busy ? "—" : c.value}</div>
                <div className="text-[11px] text-slate-500 mt-1">{c.label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 3-col operational grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent gate events */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-sm">⏱</span>
              <h3 className="text-sm font-bold text-slate-900">Recent gate events</h3>
            </div>
            <Link href="/dashboard/attendance" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                  <th className="py-2 px-4 text-left font-medium">Time</th>
                  <th className="py-2 px-4 text-left font-medium">Pupil</th>
                  <th className="py-2 px-4 text-left font-medium">Event</th>
                  <th className="py-2 px-4 text-left font-medium">SMS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentLogs.length === 0 && !busy && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No events today yet</td></tr>
                )}
                {recentLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">{log.time}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      <div className="truncate max-w-[90px]">{log.name}</div>
                      <div className="text-[10px] text-slate-400">{log.class}</div>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className={cn("text-[11px] font-semibold", log.direction === "arrival" ? "text-emerald-700" : "text-blue-700")}>
                        {log.direction === "arrival" ? "↓ Arrival" : "↑ Departure"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold", smsColor(log.sms))}>
                        {log.sms}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent departures */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-sm">🚪</span>
              <h3 className="text-sm font-bold text-slate-900">Recent departures</h3>
            </div>
            <Link href="/dashboard/departures" className="text-xs text-blue-600 hover:text-blue-800 font-medium">Manage →</Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                  <th className="py-2 px-4 text-left font-medium">Pupil</th>
                  <th className="py-2 px-4 text-left font-medium">Class</th>
                  <th className="py-2 px-4 text-left font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departures.length === 0 && !busy && (
                  <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-xs">No departures yet today</td></tr>
                )}
                {departures.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{d.name}</td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{d.class}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">{d.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Follow-up queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-sm">⚠</span>
              <h3 className="text-sm font-bold text-slate-900">Open follow-ups</h3>
            </div>
            <Link href="/dashboard/followups" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all →</Link>
          </div>
          <div className="flex-1 p-3 space-y-2">
            {followups.length === 0 && !busy && (
              <div className="py-6 text-center text-xs text-slate-400">No open follow-ups 🎉</div>
            )}
            {followups.map(f => (
              <Link key={f.id} href="/dashboard/followups"
                className={cn("flex items-start gap-2.5 p-3 rounded-lg border transition-colors hover:opacity-90", caseColor(f.status))}>
                <span className="text-base mt-0.5 shrink-0">
                  {f.status === "open" ? "🔴" : f.status === "in_progress" ? "🟡" : "🟢"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate capitalize">{f.type?.replace(/_/g, " ")}</span>
                    <span className="text-[10px] font-mono shrink-0">{f.time}</span>
                  </div>
                  <div className="text-[11px] mt-0.5 truncate">{f.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick actions grid ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Record scan",        href: "/dashboard/attendance", icon: "✔", color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" },
            { label: "Release pupil",      href: "/dashboard/departures", icon: "🚪", color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" },
            { label: "Add pupil",          href: "/dashboard/pupils",     icon: "🎓", color: "bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100" },
            { label: "SMS centre",         href: "/dashboard/messages",   icon: "✉", color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" },
            { label: "View reports",       href: "/dashboard/reports",    icon: "📊", color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100" },
            ...(isAdmin ? [
              { label: "SMS templates",    href: "/school/templates",     icon: "📝", color: "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" },
            ] : [
              { label: "Devices & gates",  href: "/dashboard/devices",    icon: "🖥", color: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100" },
            ]),
          ].map(a => (
            <Link key={a.label} href={a.href}
              className={cn("flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-xs font-semibold transition-all text-center shadow-xs hover:shadow-md", a.color)}>
              <span className="text-2xl">{a.icon}</span>
              <span>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Admin shortcuts (school_admin only) ─────────────────────────── */}
      {isAdmin && (
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">School Management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "SMS Templates",      desc: "Configure arrival and departure notification messages sent to parents.", href: "/school/templates",  icon: "📝" },
              { title: "School Calendar",    desc: "Set term dates, holidays and custom school hours overrides.",           href: "/school/calendar",   icon: "📅" },
              { title: "Guardian Accounts",  desc: "Manage parent portal access and verified guardian contact numbers.",   href: "/school/guardians",  icon: "👨‍👩‍👧" },
              { title: "Onboarding Steps",   desc: "Complete required setup before activating biometric capture.",          href: "/school/onboarding", icon: "✅" },
              { title: "School Profile",     desc: "Update school name, code, contact details and operational hours.",      href: "/school/profile",    icon: "🏫" },
              { title: "Support Tickets",    desc: "Submit and track technical support requests to Kathay Technologies.",   href: "/school/support",    icon: "🎫" },
            ].map(item => (
              <Link key={item.title} href={item.href}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all group">
                <div className="text-2xl mb-3">{item.icon}</div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{item.title}</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
