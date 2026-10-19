"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/parent", label: "My Children", icon: "🎓" },
  { href: "/parent/attendance", label: "Attendance", icon: "✓" },
  { href: "/parent/messages", label: "Messages", icon: "✉" },
  { href: "/parent/contact", label: "Contact School", icon: "📞" },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/parent/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">K</span>
            <span className="font-semibold text-sm">Parent Portal</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/parent" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={active
                  ? "flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700"
                  : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"}>
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Signed in as</div>
            <div className="mt-0.5 truncate text-sm font-medium text-slate-900">{user.email}</div>
          </div>
          <button onClick={() => signOut().then(() => router.push("/parent/login"))}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
          <h1 className="text-base font-semibold text-slate-900">Parent & Guardian Portal</h1>
          <span className="badge bg-emerald-100 text-emerald-800">Parent</span>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
