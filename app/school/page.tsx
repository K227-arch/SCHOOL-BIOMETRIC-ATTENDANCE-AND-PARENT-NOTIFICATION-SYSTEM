"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn } from "@/lib/utils";

interface Counts { pupils: number; guardians: number; devices: number; openTickets: number; pendingOnboarding: number; parentAccounts: number; }

export default function SchoolOverviewPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setError(null);
    try {
      const [p, g, d, t, o, pa] = await Promise.all([
        insforge.database.from("pupils").select("id", { count: "exact" }).eq("school_id", schoolId).eq("status", "active").limit(1),
        insforge.database.from("guardians").select("id", { count: "exact" }).eq("school_id", schoolId).limit(1),
        insforge.database.from("devices").select("id", { count: "exact" }).eq("school_id", schoolId).eq("status", "active").limit(1),
        insforge.database.from("support_tickets").select("id", { count: "exact" }).eq("school_id", schoolId).neq("status", "closed").limit(1),
        insforge.database.from("onboarding_checklists").select("id", { count: "exact" }).eq("school_id", schoolId).eq("status", "pending").limit(1),
        insforge.database.from("parent_accounts").select("id", { count: "exact" }).eq("school_id", schoolId).limit(1),
      ]);
      setCounts({ pupils: p.count ?? 0, guardians: g.count ?? 0, devices: d.count ?? 0, openTickets: t.count ?? 0, pendingOnboarding: o.count ?? 0, parentAccounts: pa.count ?? 0 });
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load"); }
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const cards = [
    { label: "Enrolled pupils", value: counts?.pupils, href: "/dashboard/pupils", color: "text-blue-700" },
    { label: "Guardians registered", value: counts?.guardians, href: "/school/guardians", color: "text-emerald-700" },
    { label: "Active devices", value: counts?.devices, href: "/dashboard/devices", color: "text-violet-700" },
    { label: "Parent portal accounts", value: counts?.parentAccounts, href: "/school/guardians", color: "text-indigo-700" },
    { label: "Open support tickets", value: counts?.openTickets, href: "/school/support", color: "text-amber-700" },
    { label: "Pending onboarding steps", value: counts?.pendingOnboarding, href: "/school/onboarding", color: "text-red-600" },
  ];

  if (!schoolId) return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">School Overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          {context?.school_name} · enrolment, guardians, devices and onboarding status.
        </p>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="stat-card hover:shadow-md transition-shadow">
            <div className="text-xs font-medium text-slate-500">{c.label}</div>
            <div className={cn("mt-2 text-3xl font-bold", c.color)}>{counts ? c.value : "—"}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Manage pupils & guardians", desc: "Verify pupil identity, admission number, class, guardian numbers and pickup permissions.", href: "/dashboard/pupils", icon: "🎓" },
          { title: "Onboarding checklist", desc: "Complete the required data notices, device setup and staff training before biometric capture.", href: "/school/onboarding", icon: "✅" },
          { title: "SMS templates", desc: "Configure arrival and departure notification templates for parent messages.", href: "/school/templates", icon: "✉" },
          { title: "School calendar", desc: "Set school days, holidays, term dates and custom hours overrides.", href: "/school/calendar", icon: "📅" },
          { title: "Devices & gates", desc: "Manage fingerprint and RFID readers, assign gates and monitor device health.", href: "/dashboard/devices", icon: "🖥" },
          { title: "Support tickets", desc: "View and submit technical support requests to Kathay Technologies.", href: "/school/support", icon: "🎫" },
        ].map((item) => (
          <Link key={item.title} href={item.href} className="card p-5 hover:shadow-md transition-shadow">
            <div className="text-2xl">{item.icon}</div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
