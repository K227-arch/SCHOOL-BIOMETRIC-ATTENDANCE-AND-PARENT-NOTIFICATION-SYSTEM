"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

/**
 * Handles post-auth routing.
 * - kathay_admin / is_platform_admin  →  /kathay
 * - school_admin / gate_staff / supervisor  →  /dashboard
 * - no role + pending signup  →  show "awaiting approval" message
 * - no role + rejected signup  →  show rejection message
 * - no role + no signup  →  try bootstrap admin, else /dashboard
 */
export default function AuthRedirectPage() {
  const { user, context, loading, refresh } = useAuth();
  const router = useRouter();
  const [pendingMsg, setPendingMsg] = useState<string | null>(null);

  useEffect(() => {
    async function route() {
      if (loading) return;
      if (!user) { router.replace("/login"); return; }

      // If user has no role and isn't a platform admin, try bootstrap admin grant
      if (!context?.is_platform_admin && !context?.role && user.email) {
        // First check if they have a pending signup request
        try {
          const { data: signupStatus } = await supabase.rpc("check_signup_status");
          const status = signupStatus as { has_request: boolean; status?: string; school_name?: string; rejection_reason?: string } | null;

          if (status?.has_request) {
            if (status.status === "pending") {
              setPendingMsg(`Your registration for ${status.school_name ?? "your school"} is pending review by a Kathay administrator. Please check back later.`);
              return;
            }
            if (status.status === "rejected") {
              setPendingMsg(`Your registration for ${status.school_name ?? "your school"} was rejected.${status.rejection_reason ? ` Reason: ${status.rejection_reason}` : ""} Please contact Kathay support.`);
              return;
            }
            // approved but no role yet — refresh context and try again
            if (status.status === "approved") {
              await refresh();
              // Re-check context after refresh
              // If still no role, fall through to dashboard
            }
          } else {
            // No signup request — try bootstrap admin
            try {
              const { error } = await supabase.rpc("make_kathay_admin", { p_email: user.email });
              if (!error) {
                await refresh();
                router.replace("/kathay");
                return;
              }
            } catch (e) {
              console.warn("make_kathay_admin failed:", e);
            }
          }
        } catch (e) {
          console.warn("check_signup_status failed:", e);
        }
      }

      if (context?.is_platform_admin || context?.role === "kathay_admin") {
        router.replace("/kathay");
      } else if (
        context?.role === "school_admin" ||
        context?.role === "gate_staff" ||
        context?.role === "supervisor"
      ) {
        router.replace("/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
    void route();
  }, [loading, user, context, router, refresh]);

  // Show "awaiting approval" message instead of redirecting
  if (pendingMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6"
        style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}>
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl mx-auto">
            ⏳
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Awaiting Approval</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{pendingMsg}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors font-semibold"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

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
