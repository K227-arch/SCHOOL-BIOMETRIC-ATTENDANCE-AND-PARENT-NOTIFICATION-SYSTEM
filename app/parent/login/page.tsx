"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ParentLoginPage() {
  const router = useRouter();
  // ── All hooks must come before any conditional return ──
  const { signIn, signUp, verifyEmail } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === "login") {
      const { error } = await signIn(email.trim(), password);
      setLoading(false);
      if (error) return setError(error);
      router.push("/parent");
    } else {
      const { error, requireVerification } = await signUp(email.trim(), password, name.trim());
      setLoading(false);
      if (error) return setError(error);
      if (requireVerification) setStep("verify");
      else router.push("/parent");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await verifyEmail(email.trim(), otp.trim());
    setLoading(false);
    if (error) return setError(error);
    router.push("/parent");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-5 sm:px-8 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-500/20">K</span>
          <div className="leading-tight">
            <div className="text-sm font-bold text-slate-900">Kathay</div>
            <div className="text-[10px] text-slate-500">Parent Portal</div>
          </div>
        </Link>
        <Link href="/login" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
          School staff? Sign in →
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl shadow-sm">
                👨‍👩‍👧
              </div>
            </div>

            {step === "form" ? (
              <>
                <h1 className="text-2xl font-extrabold text-slate-900 text-center">
                  {mode === "login" ? "Welcome back" : "Create your account"}
                </h1>
                <p className="mt-2 text-sm text-slate-500 text-center leading-relaxed">
                  {mode === "login"
                    ? "Sign in to see when your child arrives and leaves school."
                    : "Track your child's attendance and receive arrival alerts."}
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                  {mode === "signup" && (
                    <div>
                      <label className="label">Your full name</label>
                      <input className="input" required value={name}
                        onChange={e => setName(e.target.value)} placeholder="e.g. Sarah Namukasa" />
                    </div>
                  )}
                  <div>
                    <label className="label">Email address</label>
                    <input type="email" className="input" required value={email}
                      onChange={e => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input type="password" className="input" required value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters"
                      autoComplete={mode === "login" ? "current-password" : "new-password"} />
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all">
                    {loading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0"></span>
                        Please wait…
                      </>
                    ) : (
                      mode === "login" ? "Sign in" : "Create account"
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
                    className="font-bold text-emerald-600 hover:text-emerald-800 underline-offset-2 hover:underline">
                    {mode === "login" ? "Create one" : "Sign in"}
                  </button>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-extrabold text-slate-900 text-center">Check your email</h1>
                <p className="mt-2 text-sm text-slate-500 text-center leading-relaxed">
                  We sent a 6-digit code to <span className="font-semibold text-slate-800">{email}</span>. Enter it below.
                </p>
                <form onSubmit={handleVerify} className="mt-7 space-y-4">
                  <div>
                    <label className="label">Verification code</label>
                    <input required inputMode="numeric" maxLength={6}
                      className="input text-center text-2xl font-bold tracking-[0.5em]"
                      value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000"
                      autoFocus />
                  </div>
                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                  )}
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all">
                    {loading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0"></span>
                        Verifying…
                      </>
                    ) : "Verify email"}
                  </button>
                </form>
                <button onClick={() => { setStep("form"); setOtp(""); setError(null); }}
                  className="w-full mt-3 text-xs text-slate-400 hover:text-slate-700 transition-colors">
                  ← Back
                </button>
              </>
            )}
          </div>

          {/* Trust note */}
          <p className="mt-5 text-center text-xs text-slate-400 leading-relaxed">
            Your phone will receive an SMS when your child arrives at or leaves school.
            <br />No app required. Just your phone number.
          </p>
        </div>
      </main>
    </div>
  );
}
