"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/lib/auth-context";
import { cn, formatDate } from "@/lib/utils";
import type { School } from "@/lib/types";

interface PlatformStats {
  totalSchools: number;
  activeSchools: number;
  totalPupils: number;
  totalDevices: number;
  totalEvents: number;
  openTickets: number;
  failedSms: number;
  pendingOnboarding: number;
}

export default function KathayOverviewPage() {
  const { loading } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentSchools, setRecentSchools] = useState<School[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [schools, activeSchools, pupils, devices, events, tickets, sms, onboarding] =
        await Promise.all([
          insforge.database.from("schools").select("id", { count: "exact" }).limit(1),
          insforge.database.from("schools").select("id", { count: "exact" }).eq("status", "active").limit(1),
          insforge.database.from("pupils").select("id", { count: "exact" }).eq("status", "active").limit(1),
          insforge.database.from("devices").select("id", { count: "exact" }).eq("status", "active").limit(1),
          insforge.database.from("attendance_events").select("id", { count: "exact" }).limit(1),
          insforge.database.from("support_tickets").select("id", { count: "exact" }).neq("status", "closed").limit(1),
          insforge.database.from("sms_notifications").select("id", { count: "exact" }).eq("status", "failed").limit(1),
          insforge.database.from("onboarding_checklists").select("id", { count: "exact" }).eq("status", "pending").limit(1),
        ]);

      setStats({
        totalSchools: schools.count ?? 0,
        activeSchools: activeSchools.count ?? 0,
        totalPupils: pupils.count ?? 0,
        totalDevices: devices.count ?? 0,
        totalEvents: events.count ?? 0,
        openTickets: tickets.count ?? 0,
        failedSms: sms.count ?? 0,
        pendingOnboarding: onboarding.count ?? 0,
      });

      const { data } = await insforge.database.from("schools")
        .select("id, name, code, status, contact_email, created_at")
        .order("created_at", { ascending: false }).limit(5);
      setRecentSchools((data as School[] | null) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const statCards = [
    { label: "Total schools", value: stats?.totalSchools, sub: `${stats?.activeSchools ?? 0} active`, href: "/kathay/schools", color: "text-blue-400" },
    { label: "Enrolled pupils", value: stats?.totalPupils, sub: "Across all schools", href: "/kathay/schools", color: "text-emerald-400" },
    { label: "Active devices", value: stats?.totalDevices, sub: "Gate readers", href: "/kathay/devices", color: "text-violet-400" },
    { label: "Total scan events", value: stats?.totalEvents, sub: "Arrivals + departures", href: "/kathay/monitoring", color: "text-indigo-400" },
    { label: "Open tickets", value: stats?.openTickets, sub: "Awaiting response", href: "/kathay/support", color: "text-amber-400" },
    { label: "Failed SMS", value: stats?.failedSms, sub: "Need investigation", href: "/kathay/monitoring", color: "text-red-400" },
    { label: "Pending onboarding", value: stats?.pendingOnboarding, sub: "Steps across schools", href: "/kathay/schools", color: "text-orange-400" },
  ];

  const quickLinks = [
    { label: "Onboard a school", href: "/kathay/schools", icon: "🏫", desc: "Create school account, configure gates and connect devices" },
    { label: "Device integration", href: "/kathay/devices", icon: "🖥", desc: "Register readers, test SDK/API and manage firmware" },
    { label: "Live monitoring", href: "/kathay/monitoring", icon: "📡", desc: "Device health, SMS failures and real-time event feed" },
    { label: "Backups", href: "/kathay/backups", icon: "💾", desc: "Encrypted backup records and restoration tests" },
    { label: "Maintenance", href: "/kathay/maintenance", icon: "🔧", desc: "Software updates, incident response and monthly reviews" },
    { label: "Security controls", href: "/kathay/security", icon: "🔒", desc: "Audit logs, credential rotation and access reviews" },
    { label: "Support queue", href: "/kathay/support", icon: "🎫", desc: "Manage school support tickets and technical requests" },
    { label: "Revenue & billing", href: "/kathay/billing", icon: "💰", desc: "Installation fees, subscriptions and usage charges" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Platform Overview</h2>
        <p className="mt-1 text-sm text-slate-400">
          Kathay Technologies manages hosting, integration support, updates, backups, device
          monitoring, incident investigation, SMS integration and school administrator support.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href}
            className="rounded-xl border border-slate-700 bg-slate-800 p-4 hover:border-slate-600 transition-colors">
            <div className="text-xs font-medium text-slate-400">{s.label}</div>
            <div className={cn("mt-2 text-2xl font-bold", s.color)}>{stats ? s.value : "—"}</div>
            <div className="mt-0.5 text-xs text-slate-500">{s.sub}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-slate-300">Kathay responsibilities</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((q) => (
            <Link key={q.label} href={q.href}
              className="rounded-xl border border-slate-700 bg-slate-800 p-4 hover:border-blue-500 hover:bg-slate-700 transition-all">
              <div className="text-xl">{q.icon}</div>
              <div className="mt-2 text-sm font-semibold text-white">{q.label}</div>
              <div className="mt-1 text-xs leading-relaxed text-slate-400">{q.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recently onboarded schools */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-slate-300">Recently onboarded schools</h3>
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
          {recentSchools.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No schools yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">School</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Onboarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {recentSchools.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{s.code ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        s.status === "active" ? "bg-emerald-900/60 text-emerald-400" : "bg-slate-700 text-slate-400")}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(s.created_at)}</td>
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
