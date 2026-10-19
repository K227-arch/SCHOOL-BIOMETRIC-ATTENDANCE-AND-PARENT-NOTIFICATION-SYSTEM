"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/kathay", label: "Platform Overview", icon: "🌐" },
  { href: "/kathay/schools", label: "School Onboarding", icon: "🏫" },
  { href: "/kathay/devices", label: "Device Integration", icon: "🖥" },
  { href: "/kathay/monitoring", label: "Monitoring", icon: "📡" },
  { href: "/kathay/backups", label: "Backups", icon: "💾" },
  { href: "/kathay/maintenance", label: "Maintenance", icon: "🔧" },
  { href: "/kathay/security", label: "Security Controls", icon: "🔒" },
  { href: "/kathay/support", label: "Support Queue", icon: "🎫" },
  { href: "/kathay/billing", label: "Revenue & Billing", icon: "💰" },
];

export default function KathayLayout({ children }: { children: React.ReactNode }) {
  const { user, context, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) { router.replace("/login"); return; }
    if (!loading && user && context && !context.is_platform_admin) {
      router.replace("/dashboard");
    }
  }, [loading, user, context, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Dark sidebar for Kathay admin */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-700 bg-slate-900 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-700 px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">K</span>
            <div>
              <div className="text-sm font-bold text-white">Kathay</div>
              <div className="text-xs text-slate-400">Admin Console</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/kathay" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={active
                  ? "flex items-center gap-3 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
                  : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"}>
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 p-3 space-y-2">
          <div className="rounded-lg bg-slate-800 p-3">
            <div className="text-sm font-semibold text-white">{context?.user_name ?? user.email}</div>
            <div className="text-xs text-slate-400">Platform Administrator</div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="flex-1 rounded-lg border border-slate-700 py-1.5 text-center text-xs text-slate-400 hover:bg-slate-800 hover:text-white">
              Staff view
            </Link>
            <button onClick={() => signOut().then(() => router.push("/login"))}
              className="flex-1 rounded-lg py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-700 bg-slate-900/80 px-4 backdrop-blur sm:px-6">
          <h1 className="text-base font-semibold text-white">Kathay Technologies Platform Console</h1>
          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">Platform Admin</span>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
