"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Routing:
 *   kathay_admin / is_platform_admin  →  /kathay
 *   school_admin / gate_staff / supervisor  →  /dashboard  (unified school portal)
 *   parent (no role)  →  /parent
 *   unknown  →  /dashboard
 */
export default function AuthRedirectPage() {
  const { user, context, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // wait for full context (not in PUBLIC_PATHS)
    if (!user) { router.replace("/login"); return; }

    if (context?.is_platform_admin || context?.role === "kathay_admin") {
      router.replace("/kathay");
    } else if (
      context?.role === "school_admin" ||
      context?.role === "gate_staff" ||
      context?.role === "supervisor"
    ) {
      router.replace("/dashboard");
    } else {
      // No role yet (new signup before complete_signup, or parent)
      router.replace("/dashboard");
    }
  }, [loading, user, context, router]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-500/30">
          K
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900">Kathay Technologies</div>
          <div className="text-xs text-slate-500">School Attendance Platform</div>
        </div>
      </div>
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-500">Taking you to your portal…</p>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}
