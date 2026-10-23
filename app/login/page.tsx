"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

type Portal = "school" | "parent" | "kathay";
type KathayStep = "request" | "verify";

const PANELS = {
  school: {
    grad: "linear-gradient(135deg, #1e3a5f 0%, #1a56a0 40%, #0ea5e9 100%)",
    label: "SCHOOL PORTAL",
    headline: <>Attendance,<br />simplified.</>,
    sub: "Biometric gate scans, real-time attendance, parent SMS and departure control — all in one place.",
    features: [
      { icon: "👆", text: "Fingerprint & RFID gate readers" },
      { icon: "💬", text: "Instant parent SMS notifications" },
      { icon: "🛡",  text: "Safeguarding-first departure control" },
    ],
  },
  parent: {
    grad: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)",
    label: "PARENT PORTAL",
    headline: <>Your child.<br />Always safe.</>,
    sub: "Receive instant SMS alerts when your child arrives and leaves school. Safe, simple, always on.",
    features: [
      { icon: "📱", text: "SMS alerts under 3 seconds" },
      { icon: "✔",  text: "Arrival and safe departure confirmed" },
      { icon: "📋", text: "Full attendance history" },
    ],
  },
  kathay: {
    grad: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6366f1 100%)",
    label: "PLATFORM ADMIN",
    headline: <>One platform.<br />Every school.</>,
    sub: "Manage all schools, devices, SMS carriers and onboarding from a single secure console.",
    features: [
      { icon: "🏫", text: "Multi-school tenant management" },
      { icon: "🖥",  text: "Device & hardware fleet monitoring" },
      { icon: "📊", text: "Revenue and carrier analytics" },
    ],
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { signIn, refresh } = useAuth();

  const [portal, setPortal]     = useState<Portal>("school");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [busy, setBusy]         = useState(false);

  // Kathay OTP flow
  const [kathayStep, setKathayStep]   = useState<KathayStep>("request");
  const [kathayEmail, setKathayEmail] = useState("");
  const [otp, setOtp]                 = useState("");
  const [countdown, setCountdown]     = useState(0);

  function startCooldown() {
    setCountdown(60);
    const id = setInterval(() => setCountdown(p => { if (p <= 1) { clearInterval(id); return 0; } return p - 1; }), 1000);
  }

  function switchPortal(p: Portal) {
    setPortal(p); setError(null); setEmail(""); setPassword("");
    setKathayStep("request"); setKathayEmail(""); setOtp(""); setCountdown(0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const { error } = await signIn(email.trim(), password);
      setBusy(false);
      if (error) { setError(error); return; }
      router.push(portal === "parent" ? "/parent" : "/auth/redirect");
    } catch (err: any) {
      setBusy(false);
      setError(err?.message ?? "An unexpected error occurred.");
    }
  }

  /* ── Kathay: send OTP ── */
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!kathayEmail.trim()) { setError("Enter your admin email address."); return; }
    setError(null); setBusy(true);
    try {
      const { insforge: client } = await import("@/lib/insforge");
      const { error } = await client.auth.signInWithOtp({ email: kathayEmail.trim() });
      setBusy(false);
      if (error) { setError(error.message ?? "Failed to send code. Try again."); return; }
      setKathayStep("verify");
      startCooldown();
    } catch (err: any) {
      setBusy(false);
      setError(err?.message ?? "Network error.");
    }
  }

  /* ── Kathay: verify OTP ── */
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError("Enter the 6-digit code."); return; }
    setError(null); setBusy(true);
    try {
      const { insforge: client } = await import("@/lib/insforge");
      const { error } = await client.auth.verifyOtp({ email: kathayEmail.trim(), otp: otp.trim() });
      setBusy(false);
      if (error) { setError(error.message ?? "Invalid or expired code. Request a new one."); return; }
      await refresh();
      router.push("/kathay");
    } catch (err: any) {
      setBusy(false);
      setError(err?.message ?? "Verification failed. Try again.");
    }
  }

  const panel = PANELS[portal];
  const btnGrad =
    portal === "kathay" ? "linear-gradient(135deg,#3730a3 0%,#6366f1 100%)" :
    portal === "parent"  ? "linear-gradient(135deg,#064e3b 0%,#059669 100%)" :
                           "linear-gradient(135deg,#1e40af 0%,#1d4ed8 100%)";

  const emailPlaceholder =
    portal === "kathay" ? "admin@kathay.co.ug" :
    portal === "parent"  ? "you@email.com" : "you@school.edu";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: panel.grad, transition: "background 0.4s ease" }}>
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)" }} />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)" }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center font-extrabold text-white text-xl shadow-lg">K</div>
          <div>
            <div className="text-white font-extrabold text-lg leading-tight">Kathay</div>
            <div className="text-white/60 text-xs">School Attendance Platform</div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">{panel.label}</div>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">{panel.headline}</h1>
            <p className="mt-4 text-white/70 text-base leading-relaxed max-w-sm">{panel.sub}</p>
          </div>
          <div className="space-y-3">
            {panel.features.map(f => (
              <div key={f.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3">
                <span className="text-lg shrink-0">{f.icon}</span>
                <span className="text-white/90 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-xs">2026 Kathay Technologies Ltd.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">

          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center font-extrabold text-white text-xl">K</div>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-900">Sign In</h2>
            <p className="mt-1 text-sm text-slate-500">
              Access your {portal === "kathay" ? "Kathay admin" : portal === "parent" ? "parent" : "school"} dashboard
            </p>
          </div>

          {/* Portal tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-7">
            {(["school", "parent", "kathay"] as Portal[]).map(p => (
              <button key={p} type="button" onClick={() => switchPortal(p)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  portal === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}>
                {p === "school" ? "School Staff" : p === "parent" ? "Parent" : "Kathay Admin"}
              </button>
            ))}
          </div>

          {/* ══ KATHAY ADMIN: OTP sign-in ══ */}
          {portal === "kathay" && (
            <>
              {kathayStep === "request" ? (
                <form onSubmit={handleSendCode} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Admin Email</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <input type="email" required autoComplete="email"
                        placeholder="admin@kathay.co.ug"
                        value={kathayEmail} onChange={e => setKathayEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400" />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">A 6-digit sign-in code will be sent to this address.</p>
                  </div>

                  {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

                  <button type="submit" disabled={busy}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
                    style={{ background: "linear-gradient(135deg,#3730a3 0%,#6366f1 100%)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
                    {busy
                      ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending code...</>
                      : <>✉ Send sign-in code</>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-800 text-center">
                    Code sent to <span className="font-bold">{kathayEmail}</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">6-digit code</label>
                    <input required autoFocus type="text" inputMode="numeric" maxLength={6}
                      placeholder="000000" value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center text-3xl font-extrabold tracking-[0.6em] py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300" />
                  </div>

                  {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

                  <button type="submit" disabled={busy || otp.length < 6}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                    style={{ background: "linear-gradient(135deg,#3730a3 0%,#6366f1 100%)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
                    {busy
                      ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Verifying...</>
                      : <>→ Verify & Access Portal</>}
                  </button>

                  {countdown > 0
                    ? <p className="text-xs text-slate-400 text-center">Resend in <span className="font-bold text-indigo-600">{countdown}s</span></p>
                    : <button type="button" onClick={() => { setKathayStep("request"); setOtp(""); setError(null); setKathayEmail(""); }}
                        className="w-full text-xs text-slate-400 hover:text-slate-700 transition-colors py-1">← Send a new code</button>}
                </form>
              )}
            </>
          )}

          {/* ══ SCHOOL / PARENT: password sign-in ══ */}
          {portal !== "kathay" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input type="email" required autoComplete="email"
                  placeholder={emailPlaceholder}
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <button type="button" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">Forgot?</button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input type={showPwd ? "text" : "password"} required autoComplete="current-password"
                  placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                  {showPwd
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                </button>
              </div>
            </div>

            {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

            <button type="submit" disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
              style={{ background: busy ? "#93c5fd" : btnGrad, boxShadow: busy ? "none" : "0 4px 14px rgba(29,78,216,0.25)" }}>
              {busy
                ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />Signing in...</>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>Sign In</>}
            </button>
          </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">Protected by encryption · Kathay Technologies</p>
          </div>
        </div>
      </div>
    </div>
  );
}
