"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/* ── Same nav groups as dashboard/layout.tsx ──────────────────────────────── */
const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { id: "/dashboard",            label: "Overview",          icon: "▦" },
      { id: "/dashboard/attendance", label: "Live Attendance",   icon: "✔", badge: "Live" },
      { id: "/dashboard/departures", label: "Departure Control", icon: "🚪" },
      { id: "/dashboard/followups",  label: "Follow-up Queue",   icon: "⚠" },
      { id: "/dashboard/messages",   label: "SMS Notifications", icon: "✉" },
    ],
  },
  {
    label: "School Admin",
    items: [
      { id: "/dashboard/pupils", label: "Pupils & Guardians",  icon: "🎓" },
      { id: "/school/guardians", label: "Guardian Accounts",   icon: "👨‍👩‍👧" },
      { id: "/school/templates", label: "SMS Templates",       icon: "📝" },
      { id: "/school/calendar",  label: "School Calendar",     icon: "📅" },
      { id: "/school/onboarding",label: "Onboarding",          icon: "✅" },
      { id: "/school/profile",   label: "School Profile",      icon: "🏫" },
    ],
  },
  {
    label: "Reporting",
    items: [
      { id: "/dashboard/reports",  label: "Reports & Analytics", icon: "📊" },
      { id: "/dashboard/devices",  label: "Devices & Gates",     icon: "🖥" },
      { id: "/dashboard/members",  label: "Staff & Audit Logs",  icon: "🛡" },
      { id: "/dashboard/settings", label: "Settings",            icon: "⚙" },
      { id: "/school/support",     label: "Support Tickets",     icon: "🎫" },
    ],
  },
];

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/school":             { title: "School Overview",      subtitle: "Enrolment, guardians, devices and onboarding status" },
  "/school/profile":     { title: "School Profile",       subtitle: "School name, code, contact details and operational hours" },
  "/school/onboarding":  { title: "Onboarding Checklist", subtitle: "Complete required setup steps before going live" },
  "/school/calendar":    { title: "School Calendar",      subtitle: "Term dates, holidays and custom hours overrides" },
  "/school/templates":   { title: "SMS Templates",        subtitle: "Configure arrival and departure notification messages" },
  "/school/guardians":   { title: "Guardian Accounts",    subtitle: "Parent portal accounts and verified contact numbers" },
  "/school/support":     { title: "Support Tickets",      subtitle: "View and submit technical support requests" },
};

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const { user, context, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (context && !context.is_platform_admin && context.role !== "school_admin") {
      router.replace("/dashboard");
    }
  }, [loading, user, context, router]);

  if (loading || !user) return null;

  const meta = VIEW_TITLES[pathname] ?? { title: "School Management", subtitle: "Kathay School Attendance Platform" };
  const schoolName = context?.school_name ?? "My School";

  function isActive(id: string) {
    if (id === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(id);
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f1f5f9" }}>

      {/* ── Sidebar (identical to dashboard/layout.tsx) ── */}
      <aside className="relative flex flex-col border-r border-slate-800 transition-all duration-300 shrink-0"
        style={{ width: collapsed ? 56 : 256, background: "#0f172a" }}>

        <div className="flex items-center justify-between px-3 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-white text-sm shrink-0 shadow-lg shadow-blue-900/40">K</div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate leading-tight">Kathay</div>
                <div className="text-[10px] text-slate-400 truncate leading-tight">{schoolName}</div>
              </div>
            )}
          </div>
          <button onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <div className="px-2 pb-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">{group.label}</div>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.id);
                  return (
                    <Link key={item.id} href={item.id} title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        active ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800/70"}`}>
                      <span className="text-sm shrink-0 w-4 text-center">{item.icon}</span>
                      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                      {!collapsed && (item as any).badge && (
                        <span className="text-[9px] font-bold text-emerald-400 font-mono shrink-0">{(item as any).badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-3 py-2.5 border-t border-slate-800" style={{ background: "rgba(0,0,0,0.3)" }}>
          {!collapsed ? (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>Edge Gateway
                </span>
                <span className="text-emerald-400 font-mono font-bold">Online</span>
              </div>
              <div className="text-[10px] text-slate-600 font-mono">0 events queued</div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-slate-800 space-y-1">
          {context?.is_platform_admin && (
            <Link href="/kathay" className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors">
              <span className="text-sm w-4 text-center shrink-0">🏢</span>
              {!collapsed && <span className="truncate">Kathay Admin Console</span>}
            </Link>
          )}
          <button onClick={() => signOut().then(() => router.push("/login"))}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-500 hover:text-rose-400 hover:bg-slate-800/70 transition-colors">
            <span className="text-sm w-4 text-center shrink-0">↩</span>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6" style={{ minHeight: 56 }}>
          <div className="flex items-center justify-between h-14 gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs min-w-0">
              <span className="text-slate-500 font-medium truncate">{schoolName}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold truncate">{meta.title}</span>
            </div>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-600">
                📅 {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </div>
              <Link href="/dashboard/followups" className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>
              <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {context?.user_name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-xs font-semibold text-slate-900">{context?.user_name ?? "Admin"}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{context?.role?.replace(/_/g, " ") ?? "school admin"}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="pb-1.5 text-[11px] text-slate-400 hidden sm:block -mt-0.5">{meta.subtitle}</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
