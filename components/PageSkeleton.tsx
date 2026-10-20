"use client";

// Reusable skeleton blocks
export function SkeletonLine({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return <div className={`${w} ${h} rounded bg-slate-200 animate-pulse`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 space-y-3 ${className}`}>
      <SkeletonLine w="w-1/3" h="h-3" />
      <SkeletonLine w="w-full" h="h-8" />
      <SkeletonLine w="w-2/3" h="h-3" />
    </div>
  );
}

// Full dashboard page skeleton
export function DashboardPageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
        <div className="h-5 w-1/2 rounded bg-slate-200" />
        <div className="h-3 w-1/3 rounded bg-slate-100" />
      </div>
      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-9 w-9 rounded-lg bg-slate-100" />
            </div>
            <div className="h-8 w-20 rounded bg-slate-200" />
            <div className="h-3 w-28 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      {/* 3-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {[4, 4, 4].map((cols, i) => (
          <div key={i} className={`lg:col-span-${cols} bg-white rounded-xl border border-slate-200 p-4 space-y-3`}>
            <div className="h-4 w-1/3 rounded bg-slate-200" />
            {[...Array(5)].map((_, j) => (
              <div key={j} className="flex gap-3">
                <div className="h-3 w-14 rounded bg-slate-100" />
                <div className="h-3 flex-1 rounded bg-slate-100" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Full-page auth form skeleton (login/signup)
export function AuthFormSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 animate-pulse">
      <header className="flex h-16 items-center px-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-slate-200" />
          <div className="h-4 w-28 rounded bg-slate-200" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-slate-200 bg-white p-8 space-y-5">
            <div className="h-7 w-2/3 rounded bg-slate-200" />
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="space-y-4 pt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-16 rounded bg-slate-200" />
                  <div className="h-10 w-full rounded-lg bg-slate-100" />
                </div>
              ))}
            </div>
            <div className="h-10 w-full rounded-lg bg-blue-100" />
          </div>
        </div>
      </main>
    </div>
  );
}

// Landing page hero skeleton
export function LandingHeroSkeleton() {
  return (
    <div className="w-full animate-pulse" style={{ height: "92vh", minHeight: 520, background: "linear-gradient(135deg,#e2e8f0 0%,#cbd5e1 100%)" }}>
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
        <div className="h-6 w-72 rounded-full bg-slate-300" />
        <div className="h-14 w-full max-w-2xl rounded-xl bg-slate-300" />
        <div className="h-14 w-3/4 max-w-xl rounded-xl bg-slate-200" />
        <div className="h-5 w-2/3 max-w-lg rounded bg-slate-200" />
        <div className="flex gap-4 mt-2">
          <div className="h-12 w-44 rounded-xl bg-blue-200" />
          <div className="h-12 w-36 rounded-xl bg-emerald-200" />
          <div className="h-12 w-32 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
