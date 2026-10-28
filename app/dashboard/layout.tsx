"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { id: "/dashboard",            label: "Dashboard",            icon: "🏠" },
  { id: "/dashboard/pupils",     label: "Pupils",               icon: "👥" },
  { id: "/dashboard/attendance", label: "Attendance",           icon: "📋" },
  { id: "/dashboard/departures", label: "Departures",           icon: "🚪" },
  { id: "/dashboard/followups",  label: "Alerts & Follow-up",   icon: "🔔" },
  { id: "/dashboard/reports",    label: "Reports",              icon: "📊" },
  { id: "/dashboard/messages",   label: "SMS Log",              icon: "💬" },
  { id: "/dashboard/devices",    label: "Devices",              icon: "🖥" },
  { id: "/dashboard/settings",   label: "Settings",             icon: "⚙️" },
];

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const schoolName = context?.school_name ?? "My School";
  const userName = context?.user_name ?? "Admin";

  function isActive(id: string) {
    if (id === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(id);
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <>
        {NAV_ITEMS.map(item => {
          const active = isActive(item.id);
          return (
            <Link
              key={item.label}
              href={item.id}
              onClick={onNavigate}
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
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f5f9]" style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}>

      {/* ═══ MOBILE BACKDROP ═══ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ SIDEBAR — fixed on mobile (slide-in), static on desktop ═══ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 flex flex-col bg-[#1a3a6b] text-white overflow-hidden
        transition-transform duration-300 ease-in-out
        md:static md:translate-x-0 md:w-48 md:shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-base font-extrabold shrink-0">🎓</div>
          <span className="text-sm font-bold leading-tight">Kathay School<br />Attendance Platform</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          <NavLinks onNavigate={() => setSidebarOpen(false)} />
        </nav>

        {/* Sign out */}
        <div className="border-t border-white/10 px-4 py-3 shrink-0">
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

      {/* ═══ MAIN ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Top bar ── */}
        <header className="bg-[#1a3a6b] text-white px-4 md:px-5 flex items-center justify-between shrink-0 gap-3" style={{ minHeight: 52 }}>
          {/* Left: hamburger (mobile) + title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex flex-col gap-1 p-1 shrink-0"
              aria-label="Open menu"
            >
              <span className="w-5 h-0.5 bg-white/80 rounded" />
              <span className="w-5 h-0.5 bg-white/80 rounded" />
              <span className="w-5 h-0.5 bg-white/80 rounded" />
            </button>
            <div className="text-sm md:text-base font-bold tracking-tight truncate">
              Kathay School Attendance Platform
            </div>
          </div>

          {/* Right: meta info — hide most on mobile */}
          <div className="flex items-center gap-2 md:gap-5 text-xs font-medium text-blue-100 shrink-0">
            {/* School — always visible */}
            <div className="flex items-center gap-1 md:gap-1.5 truncate max-w-[120px] sm:max-w-none">
              <span>🏫</span>
              <span className="truncate hidden sm:inline">{schoolName}</span>
            </div>
            {/* User — sm+ */}
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-px h-4 bg-white/20" />
              <span>👤</span>
              <span>{userName}</span>
            </div>
            {/* Date — md+ */}
            <div className="hidden md:flex items-center gap-1.5">
              <div className="w-px h-4 bg-white/20" />
              <span>📅</span>
              <span>
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {/* Admin — md+ */}
            {context?.is_platform_admin && (
              <div className="hidden md:flex items-center gap-1.5">
                <div className="w-px h-4 bg-white/20" />
                <Link href="/kathay" className="text-blue-200 hover:text-white transition-colors">
                  Admin ⚙️
                </Link>
              </div>
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
