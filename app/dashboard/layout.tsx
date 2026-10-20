"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DashboardPageSkeleton } from "@/components/PageSkeleton";

const SCHOOL_NAV = [
  { id: "/dashboard", label: "School Dashboard", icon: "⊞" },
  { id: "/dashboard/attendance", label: "Live Attendance", icon: "✔" },
  { id: "/dashboard/departures", label: "Departure Control", icon: "→", badge: "Active" },
  { id: "/dashboard/pupils", label: "Pupil Management", icon: "👤" },
  { id: "/dashboard/followups", label: "Follow-up Queue", icon: "⚠", alert: true },
  { id: "/dashboard/messages", label: "SMS Notifications", icon: "✉" },
  { id: "/dashboard/reports", label: "Reports & Analytics", icon: "📊" },
  { id: "/dashboard/devices", label: "Devices & Gates", icon: "⌨" },
  { id: "/dashboard/members", label: "Staff & Audit Logs", icon: "🛡" },
  { id: "/dashboard/settings", label: "School Settings", icon: "⚙" },
];

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "School Operations Dashboard", subtitle: "Live attendance, departure queues & morning alerts" },
  "/dashboard/attendance": { title: "Live Attendance Register", subtitle: "Real-time turnstile scans and credential validation" },
  "/dashboard/departures": { title: "Departure Control & Release", subtitle: "Supervised student handovers and departure audit" },
  "/dashboard/pupils": { title: "Pupil Directory & Profiles", subtitle: "Enrolled students, credentials and guardian pickup records" },
  "/dashboard/followups": { title: "Exception & Follow-up Queue", subtitle: "Late arrivals, missing scans and SMS delivery issues" },
  "/dashboard/messages": { title: "Guardian SMS Notification Center", subtitle: "Carrier delivery receipts, message logs and latency tracking" },
  "/dashboard/reports": { title: "Attendance Analytics & Reports", subtitle: "Punctuality curves, grade trends and formal exports" },
  "/dashboard/devices": { title: "Edge Devices & Turnstile Gates", subtitle: "Biometric terminals, offline gateway status & battery health" },
  "/dashboard/members": { title: "Staff Directory & Audit Log", subtitle: "Authorized operators and attendance correction history" },
  "/dashboard/settings": { title: "School Configuration & Safeguarding", subtitle: "Operational hours, debounce intervals & biometric consent" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { context, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const meta = VIEW_TITLES[pathname] ?? { title: "Kathay Platform", subtitle: "School Attendance System" };
  const schoolName = context?.school_name ?? "Greenhill Primary School";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* ── Sidebar ── */}
      <aside className={`relative flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 shrink-0 ${collapsed ? "w-16" : "w-64"}`}>
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm shrink-0">K</div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-bold text-xs text-white truncate">Kathay Technologies</div>
                <div className="text-[11px] text-slate-400 truncate">{schoolName}</div>
              </div>
            )}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors" title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {!collapsed && <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">School Management</div>}
          {SCHOOL_NAV.map(item => {
            const isActive = pathname === item.id || (item.id !== "/dashboard" && pathname.startsWith(item.id));
            return (
              <Link key={item.id} href={item.id}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/80"}`}
                title={collapsed ? item.label : undefined}>
                <span className="shrink-0 text-sm">{item.icon}</span>
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.badge && <span className="text-[10px] font-mono text-emerald-400">{item.badge}</span>}
              </Link>
            );
          })}
        </div>

        {/* Edge gateway strip */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/40">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">📶 Local Edge Gateway</span>
                <span className="font-mono text-[10px] text-emerald-400">Sync OK</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">192.168.10.10 · 0 queued</div>
            </div>
          ) : (
            <div className="flex justify-center text-emerald-400 text-sm">📶</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-slate-800 space-y-1">
          <Link href="/kathay" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors">
            <span className="shrink-0">🏢</span>
            {!collapsed && <span className="truncate">Kathay Admin Console</span>}
          </Link>
          <Link href="/" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors">
            <span className="shrink-0">↗</span>
            {!collapsed && <span>Public Landing Page</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="hidden sm:flex items-center text-xs font-medium text-slate-500 gap-1.5 min-w-0">
              <span className="text-slate-700 font-semibold flex items-center gap-1">🏫 {schoolName}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-medium truncate">{meta.title}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg">
                📅 <span>Mon, 19 Oct 2026</span>
              </div>
              <Link href="/dashboard/followups" className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                🔔
              </Link>
              <button onClick={() => router.push("/login")} className="hidden sm:flex items-center gap-2 p-1.5 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200">
                <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-[11px] font-bold">
                  {context?.user_name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-slate-900 font-semibold">{context?.user_name ?? "Admin"}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{context?.role ?? "staff"}</div>
                </div>
              </button>
            </div>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400 hidden sm:block">{meta.subtitle}</div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
