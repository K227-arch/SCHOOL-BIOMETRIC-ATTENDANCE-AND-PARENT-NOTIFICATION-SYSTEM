"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

/**
 * Smart redirect: reads the user's role from context and sends them to the
 * correct portal. Shown only for a brief moment while the redirect fires.
 *
 * Role routing:
 *   kathay_admin / is_platform_admin → /kathay
 *   school_admin                     → /school
 *   gate_staff                       → /dashboard
 *   supervisor                       → /dashboard
 *   (parent — shouldn't land here)   → /parent
 *   unlinked (no school)             → /dashboard (shows a help message)
 */
export default function AuthRedirectPage() {
  const { user, context, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    if (context?.is_platform_admin) {
      router.replace("/kathay");
    } else if (context?.role === "school_admin") {
      router.replace("/school");
    } else if (context?.role === "gate_staff" || context?.role === "supervisor") {
      router.replace("/dashboard");
    } else {
      // No role yet — could be a new signup awaiting complete_signup, or a parent
      router.replace("/dashboard");
    }
  }, [loading, user, context, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
        <span className="text-xl font-bold text-white">K</span>
      </div>
      <p className="text-sm text-slate-500">Taking you to your portal…</p>
    </div>
  );
}
