"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/* ─── Nav groups ─────────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { id: "/dashboard", label: "Overview", icon: "▦" },
      { id: "/dashboard/attendance", label: "Live Attendance", icon: "✔", badge: "Live" },
      { id: "/dashboard/departures", label: "Departure Control", icon: "🚪" },
      { id: "/dashboard/followups", label: "Follow-up Queue", icon: "⚠" },
      { id: "/dashboard/messages", label: "SMS Notifications", icon: "✉" },
    ],
  },
  {
    label: "School Admin",
    items: [
      { id: "/dashboard/pupils", label: "Pupils & Guardians", icon: "🎓" },
      { id: "/school/guardians", label: "Guardian Accounts", icon: "👨‍👩‍👧" },
      { id: "/school/templates", label: "SMS Templates", icon: "📝" },
      { id: "/school/calendar", label: "School Calendar", icon: "📅" },
      { id: "/school/onboarding", label: "Onboarding", icon: "✅" },
      { id: "/school/profile", label: "School Profile", icon: "🏫" },
    ],
  },
  {
    label: "Reporting",
    items: [
      { id: "/dashboard/reports", label: "Reports & Analytics", icon: "📊" },
      { id: "/dashboard/devices", label: "Devices & Gates", icon: "🖥" },
      { id: "/dashboard/members", label: "Staff & Audit Logs", icon: "🛡" },
      { id: "/dashboard/settings", label: "Settings", icon: "⚙" },
      { id: "/school/support", label: "Support Tickets", icon: "🎫" },
    ],
  },
];

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":            { title: "School Dashboard",           subtitle: "Live operations, attendance & school management in one place" },
  "/dashboard/attendance": { title: "Live Attendance Register",   subtitle: "Real-time gate scans and credential validation" },
  "/dashboard/departures": { title: "Departure Control",          subtitle: "Supervised student handovers and departure audit" },
  "/dashboard/pupils":     { title: "Pupils & Guardians",         subtitle: "Enrolled students, credentials and guardian pickup records" },
  "/dashboard/followups":  { title: "Follow-up Queue",            subtitle: "Late arrivals, missing scans and SMS delivery issues" },
  "/dashboard/messages":   { title: "SMS Notifications",          subtitle: "Carrier delivery receipts, message logs and latency tracking" },
  "/dashboard/reports":    { title: "Reports & Analytics",        subtitle: "Punctuality curves, grade trends and formal exports" },
  "/dashboard/devices":    { title: "Devices & Gates",            subtitle: "Biometric terminals, offline gateway status & battery health" },
  "/dashboard/members":    { title: "Staff & Audit Logs",         subtitle: "Authorised operators and attendance correction history" },
  "/dashboard/settings":   { title: "Settings",                   subtitle: "Operational hours, debounce intervals & biometric consent" },
  "/school/profile":       { title: "School Profile",             subtitle: "School name, code, contact details and operational hours" },
  "/school/onboarding":    { title: "Onboarding Checklist",       subtitle: "Complete required setup steps before going live" },
  "/school/calendar":      { title: "School Calendar",            subtitle: "Term dates, holidays and custom hours overrides" },
  "/school/templates":     { title: "SMS Templates",              subtitle: "Configure arrival and departure notification messages" },
  "/school/guardians":     { title: "Guardian Accounts",          subtitle: "Parent portal accounts and verified contact numbers" },
  "/school/support":       { title: "Support Tickets",            subtitle: "View and submit technical support requests" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { context, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const meta = VIEW_TITLES[pathname] ?? { title: "Kathay Platform", subtitle: "School Attendance System" };
  const schoolName = context?.school_name ?? "My School";
  const isAdmin = context?.role === "school_admin" || context?.is_platform_admin;

  function isActive(id: string) {
    if (id === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(id);
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f1f5f9" }}>

      {/* ── Sidebar ── */}
      <aside
        className="relative flex flex-col border-r border-slate-800 transition-all duration-300 shrink-0"
        style={{ width: collapsed ? 56 : 256, background: "#0f172a" }}>

        {/* Brand */}
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
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors shrink-0"
            title={collapsed ? "Expand" : "Collapse"}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {/* Nav groups */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <div className="px-2 pb-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">{group.label}</div>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  // Hide School Admin items from non-admin users
                  if (group.label === "School Admin" && !isAdmin) return null;
                  const active = isActive(item.id);
                  return (
                    <Link key={item.id} href={item.id}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                      }`}>
                      <span className="text-sm shrink-0 w-4 text-center">{item.icon}</span>
                      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="text-[9px] font-bold text-emerald-400 font-mono shrink-0">{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Gateway strip */}
        <div className="px-3 py-2.5 border-t border-slate-800" style={{ background: "rgba(0,0,0,0.3)" }}>
          {!collapsed ? (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  Edge Gateway
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

        {/* Footer */}
        <div className="p-2 border-t border-slate-800 space-y-1">
          {context?.is_platform_admin && (
            <Link href="/kathay"
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
              title={collapsed ? "Kathay Admin" : undefined}>
              <span className="text-sm w-4 text-center shrink-0">🏢</span>
              {!collapsed && <span className="truncate">Kathay Admin Console</span>}
            </Link>
          )}
          <button
            onClick={() => signOut().then(() => router.push("/login"))}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-slate-500 hover:text-rose-400 hover:bg-slate-800/70 transition-colors"
            title={collapsed ? "Sign out" : undefined}>
            <span className="text-sm w-4 text-center shrink-0">↩</span>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-6" style={{ minHeight: 56 }}>
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2 text-xs min-w-0">
              <span className="text-slate-500 font-medium truncate">{schoolName}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold truncate">{meta.title}</span>
            </div>

            {/* Right cluster */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              {/* Live indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-600">
                📅 {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </div>

              {/* Alerts bell */}
              <Link href="/dashboard/followups"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>

              {/* User pill */}
              <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 cursor-default">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {context?.user_name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="hidden lg:block text-left leading-tight">
                  <div className="text-xs font-semibold text-slate-900">{context?.user_name ?? "Staff"}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{context?.role?.replace(/_/g, " ") ?? "staff"}</div>
                </div>
              </div>
            </div>
          </div>
          {/* Subtitle */}
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
