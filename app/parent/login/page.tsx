"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthFormSkeleton } from "@/components/PageSkeleton";

export default function ParentLoginPage() {
  const router = useRouter();
  const { signIn, signUp, verifyEmail, loading: authLoading } = useAuth();
  if (authLoading) return <AuthFormSkeleton />;

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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">K</span>
          <span className="font-semibold">Kathay · Parent Portal</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="card p-8">
            {step === "form" ? (
              <>
                <h1 className="text-2xl font-bold text-slate-900">
                  {mode === "login" ? "Parent sign in" : "Create parent account"}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {mode === "login"
                    ? "Sign in to view your child's attendance and notifications."
                    : "Create an account to track your child's attendance."}
                </p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {mode === "signup" && (
                    <div>
                      <label className="label">Full name</label>
                      <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
                    </div>
                  )}
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input type="password" className="input" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                  </div>
                  {error && <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
                  <button type="submit" disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                    {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
                  </button>
                </form>
                <p className="mt-6 text-center text-sm text-slate-600">
                  {mode === "login" ? "New parent?" : "Already have an account?"}{" "}
                  <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
                    className="font-semibold text-emerald-700 hover:underline">
                    {mode === "login" ? "Create account" : "Sign in"}
                  </button>
                </p>
                <div className="mt-4 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
                  Are you school staff?{" "}
                  <Link href="/login" className="text-blue-700 hover:underline">Staff sign in →</Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
                <p className="mt-2 text-sm text-slate-600">
                  We sent a 6-digit code to <span className="font-medium">{email}</span>.
                </p>
                <form onSubmit={handleVerify} className="mt-6 space-y-4">
                  <div>
                    <label className="label">Verification code</label>
                    <input required inputMode="numeric" maxLength={6} className="input text-center text-lg tracking-[0.5em]"
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••••" />
                  </div>
                  {error && <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</div>}
                  <button type="submit" disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                    {loading ? "Verifying…" : "Verify email"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
