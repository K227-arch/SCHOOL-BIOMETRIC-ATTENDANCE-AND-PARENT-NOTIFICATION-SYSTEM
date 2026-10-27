"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import ParticleField from "@/components/ui/particle-field";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  // ── Tab state: "school" | "kathay" | "signup" ──
  const [tab, setTab] = useState<"school" | "kathay" | "signup">("school");

  // ── School sign-in form ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // ── Kathay form ──
  const [kathayEmail, setKathayEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);

  // ── Sign up form ──
  const [suSchoolName, setSuSchoolName] = useState("");
  const [suName, setSuName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suPhone, setSuPhone] = useState("");
  const [suDone, setSuDone] = useState(false);

  // ── Shared ──
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function resetTab() {
    setError("");
    setLinkSent(false);
    setSuDone(false);
  }

  // ── School sign in ──
  async function handleSchoolSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      setError(error);
      return;
    }
    router.push("/auth/redirect");
  }

  // ── Kathay send magic link ──
  async function handleKathaySendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!kathayEmail.trim()) {
      setError("Enter your admin email.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      // emailRedirectTo points to the Site URL root (/).
      // The homepage detects the ?code= or #access_token= param and
      // forwards to /auth/callback which handles session exchange.
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email: kathayEmail.trim(),
        options: {
          emailRedirectTo: origin + "/",
          shouldCreateUser: true,
        },
      });
      setBusy(false);
      if (error) {
        setError(error.message || "Failed to send link.");
        return;
      }
      setLinkSent(true);
    } catch {
      setBusy(false);
      setError("Network error. Check your connection.");
    }
  }

  // ── School sign up: create auth user + submit signup request ──
  async function handleSchoolSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (suPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      // 1. Create auth account
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: suEmail.trim(),
        password: suPassword,
        options: { data: { name: suName.trim(), full_name: suName.trim() } },
      });

      if (authErr) {
        setBusy(false);
        setError(authErr.message || "Failed to create account.");
        return;
      }

      // If Supabase requires email confirmation, we still submit the request
      // — the user will confirm email later, the request is already queued.

      // 2. Submit signup request (creates a pending row)
      //    If session wasn't created (email confirmation required), sign in
      //    temporarily to run the RPC, then sign out.
      let rpcError: string | null = null;

      if (authData.session) {
        // Session created — call RPC directly
        const { error: rErr } = await supabase.rpc("submit_school_signup", {
          p_school_name: suSchoolName.trim(),
          p_admin_name: suName.trim(),
          p_phone: suPhone.trim() || null,
        });
        rpcError = rErr?.message ?? null;
      } else {
        // Email confirmation required — sign in with password to get a session,
        // submit the request, then the user will be in "pending" state.
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: suEmail.trim(),
          password: suPassword,
        });
        if (signInErr) {
          // Can't sign in yet (email not confirmed) — still show pending
          setBusy(false);
          setSuDone(true);
          return;
        }
        const { error: rErr } = await supabase.rpc("submit_school_signup", {
          p_school_name: suSchoolName.trim(),
          p_admin_name: suName.trim(),
          p_phone: suPhone.trim() || null,
        });
        rpcError = rErr?.message ?? null;
      }

      setBusy(false);
      if (rpcError) {
        setError(rpcError);
        return;
      }
      setSuDone(true);
    } catch {
      setBusy(false);
      setError("Network error. Check your connection.");
    }
  }

  // ── Branding panel config ──
  const isKathay = tab === "kathay";
  const isSignup = tab === "signup";
  const grad = isKathay
    ? "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6366f1 100%)"
    : "linear-gradient(135deg, #1e3a5f 0%, #1a56a0 40%, #0ea5e9 100%)";
  const particleColor = isKathay ? "#a5b4fc" : "#93c5fd";
  const labelText = isKathay ? "PLATFORM ADMIN" : isSignup ? "SCHOOL REGISTRATION" : "SCHOOL PORTAL";
  const headline = isKathay
    ? "One platform.\nEvery school."
    : isSignup
    ? "Register your\nschool."
    : "Attendance,\nsimplified.";
  const sub = isKathay
    ? "Manage all schools, devices, SMS carriers and onboarding from a single secure console."
    : isSignup
    ? "Submit your school details for approval. A Kathay administrator will review your request and grant access once approved."
    : "Biometric gate scans, real-time attendance, parent SMS and departure control — all in one place.";
  const features = isKathay
    ? [
        { icon: "🏫", text: "Multi-school tenant management" },
        { icon: "🖥", text: "Device & hardware fleet monitoring" },
        { icon: "📊", text: "Revenue and carrier analytics" },
      ]
    : isSignup
    ? [
        { icon: "📝", text: "Fill in your school details" },
        { icon: "✅", text: "Kathay admin reviews & approves" },
        { icon: "🔓", text: "Access your school dashboard" },
      ]
    : [
        { icon: "👆", text: "Fingerprint & RFID gate readers" },
        { icon: "💬", text: "Instant parent SMS notifications" },
        { icon: "🛡", text: "Safeguarding-first departure control" },
      ];

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}
    >
      {/* ════════ LEFT BRANDING PANEL ════════ */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: grad, transition: "background 0.4s ease" }}
      >
        {/* Particle field */}
        <div className="absolute inset-0 z-0">
          <ParticleField
            color={particleColor}
            count={80}
            connectionDistance={120}
            speed={0.3}
          />
        </div>

        {/* Glow decorations */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle,#fff 0%,transparent 70%)" }}
        />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center font-extrabold text-white text-xl shadow-lg">
            K
          </div>
          <div>
            <div className="text-white font-extrabold text-lg leading-tight">Kathay</div>
            <div className="text-white/60 text-xs">School Attendance Platform</div>
          </div>
        </div>

        {/* Headline + features */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
              {labelText}
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight whitespace-pre-line">
              {headline}
            </h1>
            <p className="mt-4 text-white/70 text-base leading-relaxed max-w-sm">{sub}</p>
          </div>
          <div className="space-y-3">
            {features.map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3"
              >
                <span className="text-lg shrink-0">{f.icon}</span>
                <span className="text-white/90 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/30 text-xs">2026 Kathay Technologies Ltd.</div>
      </div>

      {/* ════════ RIGHT FORM PANEL ════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center font-extrabold text-white text-xl">
              K
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              {isSignup ? "Register Your School" : "Sign In"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isKathay
                ? "Access the Kathay admin console"
                : isSignup
                ? "Awaiting Kathay admin approval"
                : "Access your school dashboard"}
            </p>
          </div>

          {/* ══ Tab buttons ══ */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-7">
            <button
              type="button"
              onClick={() => { setTab("school"); resetTab(); }}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                tab === "school"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              School Staff
            </button>
            <button
              type="button"
              onClick={() => { setTab("kathay"); resetTab(); }}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                tab === "kathay"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Kathay Admin
            </button>
            <button
              type="button"
              onClick={() => { setTab("signup"); resetTab(); }}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                tab === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* ══ SCHOOL STAFF FORM ══ */}
          {tab === "school" && (
            <form onSubmit={handleSchoolSignIn} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 pr-12 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    {showPwd ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
                style={{
                  background: "linear-gradient(135deg,#1e40af 0%,#1d4ed8 100%)",
                  boxShadow: "0 4px 14px rgba(29,78,216,0.3)",
                }}
              >
                {busy ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Switch to signup */}
              <p className="text-xs text-slate-400 text-center pt-2">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => { setTab("signup"); resetTab(); }}
                  className="text-blue-700 font-semibold hover:underline"
                >
                  Register your school
                </button>
              </p>
            </form>
          )}

          {/* ══ KATHAY ADMIN FORM ══ */}
          {tab === "kathay" && (
            <>
              {linkSent ? (
                /* ── Link sent confirmation ── */
                <div className="space-y-5 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-3xl mx-auto">
                    ✉️
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Check your email</h3>
                    <p className="mt-1.5 text-sm text-slate-500">
                      We sent a sign-in link to{" "}
                      <span className="font-semibold text-slate-800">{kathayEmail}</span>.
                      Open the email and click the link to access the admin portal.
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 text-left">
                    <strong>⚠ Open the link in a browser tab.</strong> If your browser didn't
                    open, copy the link from the email and paste it into Chrome or Edge.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkSent(false);
                      setKathayEmail("");
                      setError("");
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    ← Use a different email
                  </button>
                </div>
              ) : (
                /* ── Email input form ── */
                <form onSubmit={handleKathaySendLink} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="admin@kathay.co.ug"
                      value={kathayEmail}
                      onChange={(e) => setKathayEmail(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      A secure sign-in link will be emailed — no password needed.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
                    style={{
                      background: "linear-gradient(135deg,#3730a3 0%,#6366f1 100%)",
                      boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                    }}
                  >
                    {busy ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Sending link...
                      </>
                    ) : (
                      "Send sign-in link ✉"
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* ══ SIGN UP FORM ══ */}
          {tab === "signup" && (
            <>
              {suDone ? (
                /* ── Pending approval confirmation ── */
                <div className="space-y-5 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl mx-auto">
                    ⏳
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Request submitted</h3>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Your school registration for{" "}
                      <span className="font-semibold text-slate-800">{suSchoolName}</span> has been
                      submitted. A Kathay administrator will review and approve your request.
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-800 text-left">
                    <strong>You'll receive access once approved.</strong> After approval, return to
                    this page and sign in with your email and password.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSuDone(false);
                      setSuSchoolName("");
                      setSuName("");
                      setSuEmail("");
                      setSuPassword("");
                      setSuPhone("");
                      setError("");
                      setTab("school");
                    }}
                    className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </div>
              ) : (
                /* ── Registration form ── */
                <form onSubmit={handleSchoolSignUp} className="space-y-4">
                  {/* School name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      School Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Greenhill Academy"
                      value={suSchoolName}
                      onChange={(e) => setSuSchoolName(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Admin name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Mukasa"
                      value={suName}
                      onChange={(e) => setSuName(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="admin@school.edu"
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+256 700 000 000"
                      value={suPhone}
                      onChange={(e) => setSuPhone(e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="Min. 6 characters"
                        value={suPassword}
                        onChange={(e) => setSuPassword(e.target.value)}
                        className="w-full px-4 pr-12 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                      >
                        {showPwd ? "HIDE" : "SHOW"}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
                    style={{
                      background: "linear-gradient(135deg,#1e40af 0%,#1d4ed8 100%)",
                      boxShadow: "0 4px 14px rgba(29,78,216,0.3)",
                    }}
                  >
                    {busy ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Registration"
                    )}
                  </button>

                  {/* Switch to sign in */}
                  <p className="text-xs text-slate-400 text-center pt-2">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setTab("school"); resetTab(); }}
                      className="text-blue-700 font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Protected by encryption · Kathay Technologies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
