"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { StaffRole } from "@/lib/insforge";

/**
 * Staff sign-up flow.
 *
 * Kathay onboards schools — school admins do NOT self-create schools here.
 * Staff can:
 *   1. Join an existing school by entering their school code  (gate_staff / supervisor / school_admin)
 *   2. Create a Kathay administrator account  (kathay_admin — for Kathay Technologies staff only)
 */
export default function SignupPage() {
  const router = useRouter();
  const { signUp, verifyEmail, completeSignup } = useAuth();

  const [step, setStep] = useState<"account" | "verify" | "join">("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [isKathay, setIsKathay] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /* ── Step 1: create account ── */
  async function handleAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true);
    const { error, requireVerification } = await signUp(email.trim(), password, name.trim());
    setBusy(false);
    if (error) { setError(error); return; }
    if (requireVerification) { setStep("verify"); } else { setStep("join"); }
  }

  /* ── Step 2 (optional): verify email ── */
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await verifyEmail(email.trim(), otp.trim());
    setBusy(false);
    if (error) { setError(error); return; }
    setStep("join");
  }

  /* ── Step 3: join school or become Kathay admin ── */
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isKathay && !schoolCode.trim()) {
      setError("Enter your school code. Ask your Kathay account manager if you don't have one.");
      return;
    }
    setBusy(true);
    const role: StaffRole = isKathay ? "kathay_admin" : "gate_staff";
    const { error } = await completeSignup(role, isKathay ? undefined : schoolCode.trim());
    setBusy(false);
    if (error) { setError(error); return; }
    router.push(isKathay ? "/kathay" : "/dashboard");
  }

  const steps = ["account", "verify", "join"] as const;
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50"
      style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}>

      <header className="flex h-16 items-center justify-between px-5 sm:px-8 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-blue-700 text-white font-extrabold flex items-center justify-center text-sm">K</span>
          <span className="font-extrabold text-slate-900">Kathay</span>
        </Link>
        <Link href="/login" className="text-xs text-slate-500 hover:text-blue-700 font-medium transition-colors">
          Already have an account? Sign in →
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">

            {/* Step indicator */}
            <ol className="flex items-center justify-center gap-2 mb-7">
              {(["Account", "Verify", "Join"] as const).map((label, i) => {
                const done = i < stepIdx;
                const active = i === stepIdx;
                return (
                  <li key={label} className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      done ? "bg-emerald-500 text-white" : active ? "bg-blue-700 text-white" : "bg-slate-200 text-slate-500"
                    }`}>{done ? "✓" : i + 1}</span>
                    <span className={`text-xs font-medium ${active ? "text-slate-900" : "text-slate-400"}`}>{label}</span>
                    {i < 2 && <span className="w-5 h-px bg-slate-200 mx-1" />}
                  </li>
                );
              })}
            </ol>

            {/* ── Step 1: Account ── */}
            {step === "account" && (
              <>
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl shadow-sm">🏫</div>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 text-center">Create your account</h1>
                <p className="mt-2 text-sm text-slate-500 text-center">
                  Your school is set up by Kathay Technologies. You'll join it using a school code in the next step.
                </p>
                <form onSubmit={handleAccount} className="mt-6 space-y-4">
                  <div>
                    <label className="label">Full name</label>
                    <input required className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Ssekandi" />
                  </div>
                  <div>
                    <label className="label">Work email</label>
                    <input type="email" required className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="email" />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input type="password" required className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" />
                  </div>
                  {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
                  <button type="submit" disabled={busy}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 px-4 py-3 text-sm font-bold text-white shadow-md transition-all">
                    {busy ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating account…</> : "Continue →"}
                  </button>
                </form>
              </>
            )}

            {/* ── Step 2: Verify email ── */}
            {step === "verify" && (
              <>
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl shadow-sm">✉️</div>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 text-center">Check your email</h1>
                <p className="mt-2 text-sm text-slate-500 text-center">
                  We sent a 6-digit code to <span className="font-semibold text-slate-800">{email}</span>.
                </p>
                <form onSubmit={handleVerify} className="mt-6 space-y-4">
                  <div>
                    <label className="label">Verification code</label>
                    <input required inputMode="numeric" maxLength={6}
                      className="input text-center text-2xl font-bold tracking-[0.5em]"
                      value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" autoFocus />
                  </div>
                  {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
                  <button type="submit" disabled={busy}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 px-4 py-3 text-sm font-bold text-white shadow-md transition-all">
                    {busy ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Verifying…</> : "Verify →"}
                  </button>
                </form>
              </>
            )}

            {/* ── Step 3: Join school or Kathay admin ── */}
            {step === "join" && (
              <>
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl shadow-sm">🔑</div>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 text-center">Join your school</h1>
                <p className="mt-2 text-sm text-slate-500 text-center">
                  Enter the school code provided by Kathay Technologies or your school administrator.
                </p>

                <form onSubmit={handleJoin} className="mt-6 space-y-4">
                  {/* Toggle: school staff vs Kathay admin */}
                  <div className="flex p-1 bg-slate-100 rounded-xl gap-1 text-xs font-semibold">
                    <button type="button" onClick={() => setIsKathay(false)}
                      className={`flex-1 py-2 rounded-lg transition-all ${!isKathay ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                      🏫 School staff
                    </button>
                    <button type="button" onClick={() => setIsKathay(true)}
                      className={`flex-1 py-2 rounded-lg transition-all ${isKathay ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                      ⚙️ Kathay admin
                    </button>
                  </div>

                  {!isKathay ? (
                    <div>
                      <label className="label">School code</label>
                      <input required className="input font-mono text-lg tracking-widest uppercase"
                        value={schoolCode} onChange={e => setSchoolCode(e.target.value.toUpperCase())}
                        placeholder="e.g. A1B2C3" maxLength={8} />
                      <p className="mt-1.5 text-xs text-slate-400">
                        Your school code was provided by Kathay Technologies when your school was onboarded.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
                      <div className="font-bold mb-1">Kathay Technologies staff only</div>
                      <div className="text-xs text-blue-700">This gives platform-wide access to all schools. Only use this if you are a Kathay Technologies employee.</div>
                    </div>
                  )}

                  {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

                  <button type="submit" disabled={busy}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-3 text-sm font-bold text-white shadow-md transition-all">
                    {busy ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Setting up…</> : "Complete setup →"}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-700 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
