"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { id: "/dashboard",            label: "Dashboard",         icon: "🏠" },
  { id: "/dashboard/pupils",     label: "Pupils",            icon: "👥" },
  { id: "/dashboard/attendance", label: "Attendance",        icon: "📋" },
  { id: "/dashboard/departures", label: "Departures",        icon: "🚪" },
  { id: "/dashboard/followups",  label: "Alerts and Follow-up", icon: "🔔" },
  { id: "/dashboard/reports",    label: "History",           icon: "📅" },
  { id: "/dashboard/reports",    label: "Reports",           icon: "📊", key: "/dashboard/reports" },
  { id: "/dashboard/messages",   label: "SMS Log",           icon: "💬" },
  { id: "/dashboard/devices",    label: "Devices",           icon: "🖥" },
  { id: "/dashboard/settings",   label: "Settings",          icon: "⚙️" },
];

// deduplicate by key
const NAV = NAV_ITEMS.filter((item, idx, arr) =>
  arr.findIndex(x => (x.key ?? x.id) === (item.key ?? item.id)) === idx
);

const VIEW_TITLES: Record<string, string> = {
  "/dashboard":            "School Dashboard",
  "/dashboard/attendance": "Live Attendance",
  "/dashboard/departures": "Departure Control",
  "/dashboard/pupils":     "Pupils & Guardians",
  "/dashboard/followups":  "Alerts & Follow-up",
  "/dashboard/messages":   "SMS Notifications",
  "/dashboard/reports":    "Reports",
  "/dashboard/devices":    "Devices & Gates",
  "/dashboard/members":    "Staff & Audit",
  "/dashboard/settings":   "Settings",
  "/school/profile":       "School Profile",
  "/school/onboarding":    "Onboarding",
  "/school/calendar":      "School Calendar",
  "/school/templates":     "SMS Templates",
  "/school/guardians":     "Guardian Accounts",
  "/school/support":       "Support Tickets",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { context, signOut } = useAuth();

  const schoolName = context?.school_name ?? "Greenhill Primary School";
  const userName = context?.user_name ?? "Admin";
  const pageTitle = VIEW_TITLES[pathname] ?? "School Portal";

  function isActive(id: string) {
    if (id === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(id);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f5f9]" style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════ SIDEBAR */}
      <aside className="w-48 shrink-0 flex flex-col bg-[#1a3a6b] text-white overflow-hidden">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-base font-extrabold shrink-0">🎓</div>
          <span className="text-sm font-bold leading-tight">Kathay School<br />Attendance Platform</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map(item => {
            const active = isActive(item.id);
            return (
              <Link
                key={item.label}
                href={item.id}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-base shrink-0 w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t border-white/10 px-4 py-3">
          <button
            type="button"
            onClick={() => signOut().then(() => router.push("/login"))}
            className="flex items-center gap-2 text-xs text-blue-200 hover:text-white transition-colors"
          >
            <span>↩</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════ MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <header className="bg-[#1a3a6b] text-white px-5 py-0 flex items-center justify-between shrink-0" style={{ minHeight: 52 }}>
          <div className="text-base font-bold tracking-tight">Kathay School Attendance Platform</div>
          <div className="flex items-center gap-5 text-xs font-medium text-blue-100">
            <div className="flex items-center gap-1.5">
              <span>🏫</span>
              <span>School: {schoolName}</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <span>👤</span>
              <span>User: {userName}</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <span>📅</span>
              <span>
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {/* Kathay admin shortcut */}
            {context?.is_platform_admin && (
              <>
                <div className="w-px h-4 bg-white/20" />
                <Link href="/kathay" className="text-blue-200 hover:text-white transition-colors">
                  Admin ⚙️
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
