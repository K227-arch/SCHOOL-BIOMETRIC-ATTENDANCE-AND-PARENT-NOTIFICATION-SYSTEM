"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/* ── SVG icon set (no emoji, no icon library) ───────────────────────── */
function Icon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    check: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    door: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
    alert: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    mail: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    users: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    shield: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    document: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    calendar: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    clipboard: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    school: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    chart: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    device: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    cog: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    ticket: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    building: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    logout: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
    bell: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    chevronLeft: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
      </svg>
    ),
    chevronRight: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
      </svg>
    ),
    menu: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  };
  return <>{icons[name] ?? null}</>;
}

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { id: "/dashboard",            label: "Overview",          icon: "grid",     badge: null },
      { id: "/dashboard/attendance", label: "Live Attendance",   icon: "check",    badge: "Live" },
      { id: "/dashboard/departures", label: "Departure Control", icon: "door",     badge: null },
      { id: "/dashboard/followups",  label: "Follow-up Queue",   icon: "alert",    badge: null },
      { id: "/dashboard/messages",   label: "SMS Notifications", icon: "mail",     badge: null },
    ],
  },
  {
    label: "School Admin",
    adminOnly: true,
    items: [
      { id: "/dashboard/pupils",  label: "Pupils & Guardians",  icon: "users",    badge: null },
      { id: "/school/guardians",  label: "Guardian Accounts",   icon: "shield",   badge: null },
      { id: "/school/templates",  label: "SMS Templates",       icon: "document", badge: null },
      { id: "/school/calendar",   label: "School Calendar",     icon: "calendar", badge: null },
      { id: "/school/onboarding", label: "Onboarding",          icon: "clipboard",badge: null },
      { id: "/school/profile",    label: "School Profile",      icon: "school",   badge: null },
    ],
  },
  {
    label: "Reporting",
    items: [
      { id: "/dashboard/reports",  label: "Reports & Analytics", icon: "chart",   badge: null },
      { id: "/dashboard/devices",  label: "Devices & Gates",     icon: "device",  badge: null },
      { id: "/dashboard/members",  label: "Staff & Audit Logs",  icon: "users",   badge: null },
      { id: "/dashboard/settings", label: "Settings",            icon: "cog",     badge: null },
      { id: "/school/support",     label: "Support Tickets",     icon: "ticket",  badge: null },
    ],
  },
];

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":            { title: "Dashboard",             subtitle: "Live operations overview" },
  "/dashboard/attendance": { title: "Live Attendance",       subtitle: "Real-time gate scans" },
  "/dashboard/departures": { title: "Departure Control",     subtitle: "Supervised handovers" },
  "/dashboard/pupils":     { title: "Pupils & Guardians",    subtitle: "Enrolled students and contacts" },
  "/dashboard/followups":  { title: "Follow-up Queue",       subtitle: "Unresolved exceptions" },
  "/dashboard/messages":   { title: "SMS Notifications",     subtitle: "Delivery receipts and logs" },
  "/dashboard/reports":    { title: "Reports",               subtitle: "Attendance analytics" },
  "/dashboard/devices":    { title: "Devices & Gates",       subtitle: "Hardware and terminals" },
  "/dashboard/members":    { title: "Staff & Audit",         subtitle: "Operators and corrections" },
  "/dashboard/settings":   { title: "Settings",              subtitle: "Operational configuration" },
  "/school/profile":       { title: "School Profile",        subtitle: "Name, code and contact details" },
  "/school/onboarding":    { title: "Onboarding",            subtitle: "Setup checklist" },
  "/school/calendar":      { title: "School Calendar",       subtitle: "Terms, holidays and hours" },
  "/school/templates":     { title: "SMS Templates",         subtitle: "Notification message config" },
  "/school/guardians":     { title: "Guardian Accounts",     subtitle: "Parent portal access" },
  "/school/support":       { title: "Support Tickets",       subtitle: "Technical support requests" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const router     = useRouter();
  const { context, signOut } = useAuth();
  const [collapsed, setCollapsed]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const schoolName = context?.school_name ?? "My School";
  const userName   = context?.user_name   ?? "Staff";
  const userRole   = context?.role?.replace(/_/g, " ") ?? "staff";
  const isAdmin    = context?.role === "school_admin" || context?.is_platform_admin;
  const meta       = VIEW_TITLES[pathname] ?? { title: "Kathay Platform", subtitle: "School Attendance" };

  function isActive(id: string) {
    if (id === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(id);
  }

  const sidebarWidth = collapsed ? 56 : 240;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f1f5f9", fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}>

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════════════════════════════════════════════════ SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800
          transition-all duration-300 shrink-0 overflow-hidden
          md:static md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ width: sidebarWidth, background: "#0f172a" }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-3 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-extrabold text-white text-sm shrink-0 shadow-lg shadow-blue-900/40">K</div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate leading-tight">Kathay</div>
                <div className="text-[10px] text-slate-400 truncate leading-tight">{schoolName}</div>
              </div>
            )}
          </div>
          <button type="button" onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex text-slate-500 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors shrink-0"
            title={collapsed ? "Expand" : "Collapse"}>
            <Icon name={collapsed ? "chevronRight" : "chevronLeft"} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nav — no overflow-y-auto so no scrollbar */}
        <div className="flex-1 py-3 px-2 space-y-4">
          {NAV_GROUPS.map(group => {
            if ((group as any).adminOnly && !isAdmin) return null;
            return (
              <div key={group.label}>
                {!collapsed && (
                  <div className="px-2 pb-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    {group.label}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const active = isActive(item.id);
                    return (
                      <Link key={item.id} href={item.id}
                        title={collapsed ? item.label : undefined}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                          active
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                        }`}>
                        <span className="shrink-0"><Icon name={item.icon} className="w-4 h-4" /></span>
                        {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                        {!collapsed && item.badge && (
                          <span className="text-[9px] font-bold text-emerald-400 font-mono shrink-0 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping inline-block" />
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gateway strip */}
        <div className="px-3 py-2.5 border-t border-slate-800 shrink-0" style={{ background: "rgba(0,0,0,0.3)" }}>
          {!collapsed ? (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Edge Gateway
              </span>
              <span className="text-emerald-400 font-mono font-bold">Online</span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-slate-800 space-y-0.5 shrink-0">
          {context?.is_platform_admin && (
            <Link href="/kathay" title={collapsed ? "Kathay Admin" : undefined}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors">
              <span className="shrink-0"><Icon name="building" className="w-4 h-4" /></span>
              {!collapsed && <span className="truncate">Kathay Admin Console</span>}
            </Link>
          )}
          <button type="button" onClick={() => signOut().then(() => router.push("/login"))}
            title={collapsed ? "Sign out" : undefined}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-500 hover:text-rose-400 hover:bg-slate-800/70 transition-colors">
            <span className="shrink-0"><Icon name="logout" className="w-4 h-4" /></span>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════ MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6 shrink-0" style={{ minHeight: 56 }}>
          <div className="flex items-center justify-between h-14 gap-4">

            {/* Left: hamburger (mobile) + breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => setSidebarOpen(true)}
                className="md:hidden p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                <Icon name="menu" className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs min-w-0">
                <span className="text-slate-400 font-medium truncate">{schoolName}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-semibold truncate">{meta.title}</span>
              </div>
              <div className="sm:hidden text-sm font-bold text-slate-900 truncate">{meta.title}</div>
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-600">
                {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
              </div>
              <Link href="/dashboard/followups"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <Icon name="bell" className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {userName[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="hidden lg:block leading-tight">
                  <div className="text-xs font-semibold text-slate-900">{userName}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{userRole}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="pb-1.5 text-[11px] text-slate-400 hidden sm:block -mt-0.5">{meta.subtitle}</div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
