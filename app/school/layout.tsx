"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/school", label: "School Overview", icon: "🏫" },
  { href: "/school/profile", label: "School Profile", icon: "📋" },
  { href: "/school/onboarding", label: "Onboarding", icon: "✅" },
  { href: "/school/calendar", label: "Calendar", icon: "📅" },
  { href: "/school/templates", label: "SMS Templates", icon: "✉" },
  { href: "/school/guardians", label: "Guardians", icon: "👨‍👩‍👧" },
  { href: "/school/support", label: "Support Tickets", icon: "🎫" },
];

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const { user, context, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) { router.replace("/login"); return; }
    if (!loading && user && context && !context.is_platform_admin && context.role !== "school_admin") {
      router.replace("/dashboard");
    }
  }, [loading, user, context, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="text-sm text-slate-400">Loading…</div></div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">K</span>
            <span className="font-semibold text-sm">School Mgmt</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/school" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={active
                  ? "flex items-center gap-3 rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700"
                  : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"}>
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-sm font-semibold text-slate-900">{context?.user_name ?? user.email}</div>
            <div className="text-xs text-slate-500">{context?.school_name}</div>
          </div>
          <div className="mt-2 flex gap-2">
            <Link href="/dashboard" className="flex-1 rounded-lg border border-slate-300 py-1.5 text-center text-xs text-slate-600 hover:bg-slate-50">
              Main dashboard
            </Link>
            <button onClick={() => signOut().then(() => router.push("/login"))}
              className="flex-1 rounded-lg py-1.5 text-xs text-slate-600 hover:bg-slate-50">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
          <h1 className="text-base font-semibold text-slate-900">
            {context?.school_name ?? "School Management"}
          </h1>
          <span className="badge bg-violet-100 text-violet-800">School Admin</span>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
