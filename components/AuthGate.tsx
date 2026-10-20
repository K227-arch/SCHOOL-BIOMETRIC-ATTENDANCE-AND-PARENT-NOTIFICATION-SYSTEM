"use client";

import { useAuth } from "@/lib/auth-context";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-500/30">
            K
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">Kathay Technologies</div>
            <div className="text-xs text-slate-500">School Attendance Platform</div>
          </div>
        </div>

        {/* Animated spinner */}
        <div className="relative w-12 h-12 mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600"
            style={{ animation: "spin 0.8s linear infinite" }}
          />
        </div>

        {/* Loading text */}
        <p className="text-sm text-slate-500 font-medium">Loading your portal…</p>

        {/* Pulsing dots */}
        <div className="flex items-center gap-1.5 mt-3">
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

  return <>{children}</>;
}
