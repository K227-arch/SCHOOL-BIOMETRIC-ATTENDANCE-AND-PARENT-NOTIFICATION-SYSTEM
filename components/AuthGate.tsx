"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/parent", "/auth/redirect"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const pathname = usePathname();
  // Hard timeout — never block longer than 4s regardless of network
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  // Public pages always render immediately — auth-context resolves them instantly
  if (isPublic(pathname)) return <>{children}</>;

  // Protected pages show loader until auth resolves (max 4s)
  if (loading && !timedOut) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-500/30">
            K
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">Kathay Technologies</div>
            <div className="text-xs text-slate-500">School Attendance Platform</div>
          </div>
        </div>
        <div className="relative w-10 h-10 mb-5">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Loading your portal…</p>
        <div className="flex items-center gap-1.5 mt-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
