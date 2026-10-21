"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    // signIn calls refresh() internally — don't call it again
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) { setError(error); return; }
    // auth/redirect reads the now-populated context and routes correctly
    router.push("/auth/redirect");
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50"
      style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}>

      {/* Nav */}
      <header className="flex h-16 items-center justify-between px-5 sm:px-8 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-blue-700 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20">K</span>
          <span className="font-extrabold text-slate-900">Kathay</span>
        </Link>
        <Link href="/parent/login" className="text-xs text-slate-500 hover:text-emerald-700 transition-colors font-medium">
          Parent portal →
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-5">

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl shadow-sm">
                🏫
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 text-center">Staff sign in</h1>
            <p className="mt-2 text-sm text-slate-500 text-center">
              Sign in to your school or Kathay portal. You'll be routed to the right place automatically.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label className="label" htmlFor="email">Email address</label>
                <input id="email" type="email" required autoComplete="email" className="input"
                  value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.edu" />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input id="password" type="password" required autoComplete="current-password" className="input"
                  value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" disabled={busy}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all">
                {busy ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                    Signing in…
                  </>
                ) : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-500">
              New staff member?{" "}
              <Link href="/signup" className="font-bold text-blue-700 hover:underline">Create account</Link>
            </p>
          </div>

          {/* 3 portal shortcuts */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "👨‍👩‍👧 Parents", href: "/parent/login", cls: "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100" },
              { label: "🏫 School portal", href: "/dashboard",   cls: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100" },
              { label: "⚙️ Kathay admin", href: "/kathay",       cls: "bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800" },
            ].map(p => (
              <Link key={p.label} href={p.href}
                className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold transition-colors ${p.cls}`}>
                {p.label}
              </Link>
            ))}
          </div>

          <p className="text-center text-xs text-slate-400">
            Are you a parent?{" "}
            <Link href="/parent/login" className="text-emerald-600 font-semibold hover:underline">
              Use the parent portal
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
