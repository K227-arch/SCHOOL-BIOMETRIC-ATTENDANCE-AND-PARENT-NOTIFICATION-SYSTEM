"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

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
      router.replace("/dashboard");
    }
  }, [loading, user, context, router]);

  // This page is only ever visible for a fraction of a second — show a
  // clean branded loading screen so there's never a flash of broken content.
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
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
      </div>

      <p className="text-sm font-medium text-slate-500">Taking you to your portal…</p>

      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-blue-400"
            style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}
