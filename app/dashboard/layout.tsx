"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { visibleNav } from "@/lib/dashboard-nav";
import { ROLE_LABELS } from "@/lib/insforge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, context, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-400">Loading…</div>
      </div>
    );
  }

  const role = context?.role ?? null;
  const items = visibleNav(role, context?.is_platform_admin ?? false);

  const roleLabel = context?.is_platform_admin
    ? "Kathay Administrator"
    : role
    ? ROLE_LABELS[role]
    : "Member";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-sm font-bold text-white">
              K
            </span>
            <span className="font-semibold">Kathay</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                    : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }
              >
                <span className="w-5 text-center text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="text-sm font-semibold text-slate-900">
              {context?.user_name || user.email}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">{roleLabel}</div>
            {context?.school_name && (
              <div className="mt-1 text-xs text-slate-400">{context.school_name}</div>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {context?.is_platform_admin && (
              <Link href="/kathay" className="rounded-lg border border-slate-200 py-1.5 text-center text-xs text-slate-600 hover:bg-slate-50 col-span-2">
                Kathay console
              </Link>
            )}
            {context?.role === "school_admin" && (
              <Link href="/school" className="rounded-lg border border-slate-200 py-1.5 text-center text-xs text-slate-600 hover:bg-slate-50 col-span-2">
                School management
              </Link>
            )}
          </div>
          <button
            onClick={() => signOut().then(() => router.push("/login"))}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 md:pl-0">
            <span className="md:hidden text-slate-400">☰</span>
            <h1 className="text-base font-semibold text-slate-900">
              {context?.school_name || "Kathay Platform"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:block">{user.email}</span>
            <span className="badge bg-blue-100 text-blue-800">{roleLabel}</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
