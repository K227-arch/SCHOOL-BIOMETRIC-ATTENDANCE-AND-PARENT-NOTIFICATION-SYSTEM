"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type StaffRole } from "@/lib/insforge";
import { AuthFormSkeleton } from "@/components/PageSkeleton";

const ROLES: StaffRole[] = ["school_admin", "gate_staff", "supervisor", "kathay_admin"];

export default function SignupPage() {
  const router = useRouter();
  const { signUp, verifyEmail, completeSignup, loading: authLoading } = useAuth();

  // Show skeleton while auth is resolving
  const [step, setStep] = useState<"account" | "verify" | "onboard">("account");
  const [name, setName] = useState("");

  if (authLoading) return <AuthFormSkeleton />;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("school_admin");
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error, requireVerification } = await signUp(email.trim(), password, name.trim());
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    if (requireVerification) {
      setStep("verify");
    } else {
      setStep("onboard");
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await verifyEmail(email.trim(), otp.trim());
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    setStep("onboard");
  }

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (role === "school_admin" && !schoolName.trim()) {
      setError("Please enter your school name.");
      return;
    }
    if ((role === "gate_staff" || role === "supervisor") && !schoolCode.trim()) {
      setError("Please enter your school code to join.");
      return;
    }
    setLoading(true);
    const { error } = await completeSignup(
      role,
      role === "school_admin" ? schoolName.trim() : undefined,
      role === "gate_staff" || role === "supervisor" ? schoolCode.trim() : undefined
    );
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    // Route to the correct portal for this role
    if (role === "kathay_admin") {
      router.push("/kathay");
    } else if (role === "school_admin") {
      router.push("/school");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white font-bold">
            K
          </span>
          <span className="font-semibold">Kathay</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="card p-8">
            {/* Step indicator */}
            <ol className="mb-6 flex items-center gap-2 text-xs font-medium">
              {(["account", "verify", "onboard"] as const).map((s, i) => {
                const active = step === s;
                const done = ["account", "verify", "onboard"].indexOf(step) > i;
                return (
                  <li key={s} className="flex items-center gap-2">
                    <span
                      className={
                        active
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-white"
                          : done
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                          : "flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500"
                      }
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={active ? "text-slate-900" : "text-slate-400"}>
                      {s === "account" ? "Account" : s === "verify" ? "Verify" : "Set up role"}
                    </span>
                    {i < 2 && <span className="mx-1 h-px w-6 bg-slate-200" />}
                  </li>
                );
              })}
            </ol>

            {step === "account" && (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Choose your role to get started. You can complete school setup next.
                </p>

                <form onSubmit={handleAccount} className="mt-6 space-y-4">
                  <div>
                    <label className="label" htmlFor="name">Full name</label>
                    <input id="name" required className="input" value={name}
                      onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="label" htmlFor="email">Email</label>
                    <input id="email" type="email" required className="input" value={email}
                      onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" />
                  </div>
                  <div>
                    <label className="label" htmlFor="password">Password</label>
                    <input id="password" type="password" required className="input" value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
                  </div>

                  <div>
                    <span className="label">Your role</span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {ROLES.map((r) => (
                        <button
                          type="button"
                          key={r}
                          onClick={() => setRole(r)}
                          className={
                            role === r
                              ? "rounded-lg border-2 border-blue-600 bg-blue-50 p-3 text-left"
                              : "rounded-lg border border-slate-300 bg-white p-3 text-left hover:border-slate-400"
                          }
                        >
                          <div className="text-sm font-semibold text-slate-900">
                            {ROLE_LABELS[r]}
                          </div>
                          <div className="mt-0.5 text-xs leading-snug text-slate-500">
                            {ROLE_DESCRIPTIONS[r]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? "Creating account…" : "Continue"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-blue-700 hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}

            {step === "verify" && (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
                <p className="mt-2 text-sm text-slate-600">
                  We sent a 6-digit code to <span className="font-medium">{email}</span>.
                  Enter it below to confirm your account.
                </p>
                <form onSubmit={handleVerify} className="mt-6 space-y-4">
                  <div>
                    <label className="label" htmlFor="otp">Verification code</label>
                    <input
                      id="otp"
                      required
                      inputMode="numeric"
                      maxLength={6}
                      className="input tracking-[0.5em] text-center text-lg"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                    />
                  </div>
                  {error && (
                    <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? "Verifying…" : "Verify email"}
                  </button>
                </form>
              </>
            )}

            {step === "onboard" && (
              <>
                <h1 className="text-2xl font-bold text-slate-900">Set up your access</h1>
                <p className="mt-2 text-sm text-slate-600">
                  Role: <span className="font-semibold text-slate-900">{ROLE_LABELS[role]}</span>
                </p>

                <form onSubmit={handleOnboard} className="mt-6 space-y-4">
                  {role === "kathay_admin" && (
                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                      You will have platform administrator access to all schools, onboarding,
                      devices and support. This role is intended for Kathay Technologies staff.
                    </div>
                  )}

                  {role === "school_admin" && (
                    <div>
                      <label className="label" htmlFor="schoolName">School name</label>
                      <input id="schoolName" required className="input" value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="e.g. Greenfield Primary School" />
                      <p className="mt-1.5 text-xs text-slate-500">
                        A unique school code will be generated so your staff can join.
                      </p>
                    </div>
                  )}

                  {(role === "gate_staff" || role === "supervisor") && (
                    <div>
                      <label className="label" htmlFor="schoolCode">School code</label>
                      <input id="schoolCode" required className="input" value={schoolCode}
                        onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                        placeholder="e.g. A1B2C3" />
                      <p className="mt-1.5 text-xs text-slate-500">
                        Ask your school administrator for the school code to join.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? "Setting up…" : "Complete setup"}
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
