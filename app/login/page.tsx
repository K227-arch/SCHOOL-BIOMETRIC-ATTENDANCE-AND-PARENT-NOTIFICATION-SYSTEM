"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, context, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) { setError(error); return; }
    // Refresh is already called inside signIn, context is updated.
    // Route based on role:
    await refresh();
    // context is updated after refresh — re-read from auth state
    // We use a small hack: push to a routing page that checks the context
    router.push("/auth/redirect");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white font-bold">K</span>
          <span className="font-semibold">Kathay</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-slate-900">Staff sign in</h1>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to your Kathay attendance account. You will be taken to the portal for
              your role automatically.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" required autoComplete="email" className="input"
                  value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input id="password" type="password" required autoComplete="current-password" className="input"
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              {error && <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-blue-700 hover:underline">Create one</Link>
            </p>

            <div className="mt-4 border-t border-slate-200 pt-4 text-center">
              <p className="text-sm text-slate-600">Are you a parent or guardian?</p>
              <Link href="/parent/login" className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Go to Parent Portal →
              </Link>
            </div>
          </div>

          {/* Portal quick links */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Parent portal", href: "/parent/login", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
              { label: "School management", href: "/school", color: "bg-violet-50 border-violet-200 text-violet-700" },
              { label: "Kathay console", href: "/kathay", color: "bg-slate-900 border-slate-700 text-slate-200" },
            ].map((p) => (
              <Link key={p.label} href={p.href}
                className={`rounded-xl border p-3 text-center text-xs font-medium transition-colors hover:opacity-80 ${p.color}`}>
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
