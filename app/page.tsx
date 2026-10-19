"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  { title: "Reliable entry & exit recording", desc: "Fingerprint or RFID scans capture every arrival and departure with accurate timestamps, gate and device source. Duplicate scans within the configured window never create duplicate alerts.", icon: "🔐" },
  { title: "Parent SMS notifications", desc: "Verified guardians receive an arrival and departure SMS identifying the pupil, school and recorded time. We track queued, sent and delivered states separately, with full message audit.", icon: "💬" },
  { title: "Exception & follow-up management", desc: "Late arrivals, missing scans, early exits and failed SMS are flagged for review. Each follow-up has a responsible staff member, action note and open-to-closed status.", icon: "📋" },
  { title: "Secure multi-school isolation", desc: "Each school sees only its own pupil records. Access is based on staff roles and enforced at the database level, not just the interface. Encrypted connections and audit logs throughout.", icon: "🏫" },
  { title: "Departure control & release", desc: "Schools apply their own release policy before a pupil departs. Authorised pickup persons and methods are recorded, and only a valid departure event triggers the exit SMS.", icon: "🚪" },
  { title: "Reports & device health", desc: "Daily and class attendance, late arrival and early exit trends, unresolved exceptions, SMS failures and device last-seen status, with export for authorised staff.", icon: "📊" },
];

const STEPS = [
  { n: "1", title: "Onboard the school", desc: "Kathay creates the school account, configures calendars, hours, gates, role permissions and notification templates." },
  { n: "2", title: "Verify & enrol pupils", desc: "The school verifies pupil identity, admission number, class, guardian contacts and pickup permissions, then enrols credentials." },
  { n: "3", title: "Daily scans", desc: "On arrival the pupil scans; the system records the event, updates the dashboard and triggers one SMS to the verified guardian." },
  { n: "4", title: "Supervised departure", desc: "Staff apply the release policy, the pupil scans at exit, the collection is confirmed, and the exit SMS is sent." },
  { n: "5", title: "Review & follow up", desc: "Supervisors review late arrivals, missing scans, early exits, failed SMS and unresolved records." },
];

// Portal access cards — each audience gets their own entry point
const PORTALS = [
  {
    title: "Parent & Guardian Portal",
    desc: "Track your child's arrivals and departures, view SMS notification history and contact the school.",
    href: "/parent",
    loginHref: "/parent/login",
    icon: "👨‍👩‍👧",
    color: "border-emerald-200 bg-emerald-50",
    badgeColor: "bg-emerald-100 text-emerald-800",
    badge: "Parents",
    btnColor: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  {
    title: "School Management Portal",
    desc: "Manage pupils, guardians, staff, gates, SMS templates, calendar, onboarding checklist and support tickets.",
    href: "/school",
    loginHref: "/login",
    icon: "🏫",
    color: "border-violet-200 bg-violet-50",
    badgeColor: "bg-violet-100 text-violet-800",
    badge: "School Admins",
    btnColor: "bg-violet-600 text-white hover:bg-violet-700",
  },
  {
    title: "Staff Dashboard",
    desc: "Record arrivals and departures at the gate, manage departure control, follow-up queue and attendance reports.",
    href: "/dashboard",
    loginHref: "/login",
    icon: "👷",
    color: "border-blue-200 bg-blue-50",
    badgeColor: "bg-blue-100 text-blue-800",
    badge: "Gate Staff & Supervisors",
    btnColor: "bg-blue-700 text-white hover:bg-blue-800",
  },
  {
    title: "Kathay Admin Console",
    desc: "Platform overview, school onboarding, device integration, monitoring, backups, maintenance, security controls and support queue.",
    href: "/kathay",
    loginHref: "/login",
    icon: "⚙",
    color: "border-slate-300 bg-slate-900",
    badgeColor: "bg-slate-700 text-slate-200",
    badge: "Kathay Technologies",
    btnColor: "bg-white text-slate-900 hover:bg-slate-100",
    dark: true,
  },
];

export default function LandingPage() {
  const { user, loading, context } = useAuth();

  // Determine where a logged-in user should land based on their role
  function getDashboardHref(): string {
    if (!context) return "/dashboard";
    if (context.is_platform_admin) return "/kathay";
    if (context.role === "school_admin") return "/school";
    return "/dashboard";
  }

  return (
    <div className="min-h-full">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-white font-bold">K</span>
            <span className="font-semibold tracking-tight">Kathay</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#portals" className="hover:text-slate-900">Portals</a>
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <Link href="/parent/login" className="hover:text-slate-900">Parent login</Link>
          </nav>
          <div className="flex items-center gap-3">
            {loading ? null : user ? (
              <Link href={getDashboardHref()} className="btn-primary">Go to my portal</Link>
            ) : (
              <>
                <Link href="/login" className="btn-secondary">Staff sign in</Link>
                <Link href="/signup" className="btn-primary">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 via-white to-white" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge bg-blue-100 text-blue-800">Kathay Technologies · School Attendance Platform</span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              School biometric attendance with parent notifications
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Records pupils arriving at and leaving school, issues SMS notifications to verified
              parents or guardians, and gives each school secure access to attendance history,
              departure control and follow-up records.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {!user ? (
                <>
                  <Link href="/signup" className="btn-primary px-6 py-3 text-base">Onboard your school</Link>
                  <Link href="/parent/login" className="btn-secondary px-6 py-3 text-base">Parent portal</Link>
                </>
              ) : (
                <Link href={getDashboardHref()} className="btn-primary px-6 py-3 text-base">Open my portal</Link>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              A scan records an event. It does not, by itself, establish that a child was safely
              handed over to an authorised person.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "Entry & exit", v: "Per pupil" },
              { k: "Parent SMS", v: "Queued → delivered" },
              { k: "Multi-school", v: "Per-tenant isolation" },
              { k: "Role-based", v: "DB-enforced access" },
            ].map((s) => (
              <div key={s.k} className="card p-4 text-center">
                <div className="text-sm font-semibold text-slate-900">{s.k}</div>
                <div className="mt-1 text-xs text-slate-500">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PORTALS ── */}
      <section id="portals" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Choose your portal</h2>
            <p className="mt-4 text-slate-600">
              Every stakeholder has a dedicated portal. Parents track their children. Schools manage
              attendance. Kathay operates the platform.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PORTALS.map((p) => (
              <div key={p.title} className={`flex flex-col rounded-2xl border p-6 ${p.color}`}>
                <div className="text-3xl">{p.icon}</div>
                <span className={`mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${p.badgeColor}`}>
                  {p.badge}
                </span>
                <h3 className={`mt-3 text-base font-semibold ${p.dark ? "text-white" : "text-slate-900"}`}>
                  {p.title}
                </h3>
                <p className={`mt-2 flex-1 text-sm leading-relaxed ${p.dark ? "text-slate-400" : "text-slate-600"}`}>
                  {p.desc}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  {!user ? (
                    <>
                      <Link href={p.loginHref}
                        className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${p.btnColor}`}>
                        Sign in
                      </Link>
                      {p.loginHref !== "/parent/login" && (
                        <Link href="/signup"
                          className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${p.dark ? "border-slate-600 text-slate-300 hover:bg-slate-800" : "border-slate-300 text-slate-700 hover:bg-white"}`}>
                          Sign up
                        </Link>
                      )}
                    </>
                  ) : (
                    <Link href={p.href}
                      className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${p.btnColor}`}>
                      Open portal
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">What the platform delivers</h2>
          <p className="mt-4 text-slate-600">Reliable entry and exit recording, parent messages, exception management and school reports.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">How the platform operates</h2>
            <p className="mt-4 text-slate-600">From onboarding to daily scans to supervised follow-up.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-5">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white font-bold">{s.n}</div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsibilities */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Responsibilities</h2>
          <p className="mt-4 text-slate-600">Each party has defined responsibilities to make the platform work safely and reliably.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { party: "Kathay Technologies", icon: "⚙", items: ["Platform development & hosting", "School onboarding & installation", "Device integration & monitoring", "Software maintenance & backups", "Security controls & support"] },
            { party: "School Management", icon: "🏫", items: ["Pupil & guardian data verification", "Staff accounts & gate supervision", "Attendance decisions & release", "Exception investigation", "Parent communication"] },
            { party: "Parents & Guardians", icon: "👨‍👩‍👧", items: ["Provide accurate contact details", "Notify school of pickup changes", "Verify child arrival via SMS", "Contact school with queries", "Keep phone number current"] },
            { party: "SMS Provider", icon: "📱", items: ["Deliver messages reliably", "Provide status receipts", "Support agreed sender identity", "Report delivery failures", "Maintain uptime SLA"] },
          ].map((r) => (
            <div key={r.party} className="card p-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{r.icon}</span>
                <h3 className="text-sm font-semibold text-slate-900">{r.party}</h3>
              </div>
              <ul className="mt-4 space-y-1.5">
                {r.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="mt-0.5 text-blue-500">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">Ready to get started?</h2>
          <p className="mt-4 text-blue-100">
            School admins — onboard your school and start tracking attendance today.
            Parents — log in to follow your child in real time.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!user ? (
              <>
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-700 hover:bg-blue-50">
                  School sign up
                </Link>
                <Link href="/parent/login" className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-base font-semibold text-white hover:bg-emerald-600">
                  Parent portal
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 rounded-lg border border-blue-400 px-6 py-3 text-base font-semibold text-white hover:bg-blue-600">
                  Staff sign in
                </Link>
              </>
            ) : (
              <Link href={getDashboardHref()} className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-700 hover:bg-blue-50">
                Open my portal
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-blue-700 text-xs font-bold text-white">K</span>
              Kathay Technologies · School Attendance Platform
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
              <Link href="/parent/login" className="hover:text-slate-600">Parent portal</Link>
              <Link href="/school" className="hover:text-slate-600">School management</Link>
              <Link href="/dashboard" className="hover:text-slate-600">Staff dashboard</Link>
              <Link href="/kathay" className="hover:text-slate-600">Kathay admin</Link>
              <Link href="/signup" className="hover:text-slate-600">Sign up</Link>
              <Link href="/login" className="hover:text-slate-600">Sign in</Link>
            </div>
            <p className="text-xs text-slate-400">October 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
