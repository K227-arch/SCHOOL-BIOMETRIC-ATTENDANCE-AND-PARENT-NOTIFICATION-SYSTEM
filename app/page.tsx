"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

const SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80&auto=format&fit=crop",
    title: "Verified pupil attendance for modern schools",
    sub: "Fingerprint and RFID gate readers with instant parent SMS delivery",
  },
  {
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=80&auto=format&fit=crop",
    title: "Departure control & child safeguarding",
    sub: "Staff verify pickup identity before every safe handover",
  },
  {
    url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&q=80&auto=format&fit=crop",
    title: "Real-time parent notifications",
    sub: "Arrival and departure SMS under 3.2 seconds average delivery",
  },
  {
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80&auto=format&fit=crop",
    title: "Multi-school platform, per-tenant isolation",
    sub: "Each school's data is strictly separated at the database level",
  },
];

export default function LandingPage() {
  const { user, loading, context } = useAuth();
  const [slide, setSlide] = useState(0);
  const [fading, setFading] = useState(false);

  // Auto-advance every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setSlide(prev => (prev + 1) % SLIDES.length);
        setFading(false);
      }, 600);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  function goTo(i: number) {
    if (i === slide) return;
    setFading(true);
    setTimeout(() => { setSlide(i); setFading(false); }, 600);
  }

  function getDashboardHref(): string {
    if (!context) return "/dashboard";
    if (context.is_platform_admin) return "/kathay";
    if (context.role === "school_admin") return "/school";
    return "/dashboard";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 lg:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <a href="#hero" className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-blue-700 text-white flex items-center justify-center text-sm font-bold">K</span>
            Kathay Technologies
          </a>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#overview" className="hover:text-slate-900 transition-colors">System Overview</a>
            <a href="#safeguarding" className="hover:text-slate-900 transition-colors">Safeguarding Rules</a>
            <a href="#hardware" className="hover:text-slate-900 transition-colors">Edge Hardware</a>
            <a href="#notifications" className="hover:text-slate-900 transition-colors">Parent SMS Experience</a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {!loading && !user && (
              <Link href="/login" className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors">
                Staff Sign In
              </Link>
            )}
            {!loading && user ? (
              <Link href={getDashboardHref()} className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                Open Portal →
              </Link>
            ) : (
              <Link href="/dashboard" className="px-4 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm transition-all flex items-center gap-1.5">
                Enter School Portal →
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero image slider — sits directly under sticky nav ── */}
      <section id="hero" className="relative w-full overflow-hidden" style={{ height: "92vh", minHeight: 520 }}>

        {/* Slides */}
        {SLIDES.map((s, i) => (
          <div key={i} className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === slide ? (fading ? 0 : 1) : 0, zIndex: i === slide ? 1 : 0 }}>
            <img src={s.url} alt={s.title} className="w-full h-full object-cover"
              style={{ filter: "brightness(0.45)" }} />
          </div>
        ))}

        {/* Dark gradient at bottom for text legibility */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Slide content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 bg-blue-900/50 px-4 py-1.5 rounded-full border border-blue-500/40 mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400"></span>
            </span>
            Kathay Technologies · Managed School Attendance Platform
          </div>

          <h1 key={`title-${slide}`} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}>
            {SLIDES[slide].title}
          </h1>

          <p key={`sub-${slide}`} className="mt-5 text-lg sm:text-xl text-slate-200 max-w-2xl leading-relaxed"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>
            {SLIDES[slide].sub}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/dashboard"
              className="px-8 py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xl shadow-blue-900/40 transition-all flex items-center gap-2">
              🏫 Launch School Dashboard
            </Link>
            <Link href="/parent/login"
              className="px-8 py-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xl shadow-emerald-900/40 transition-all flex items-center gap-2">
              👨‍👩‍👧‍👦 Parent Portal
            </Link>
            <Link href="/signup"
              className="px-8 py-4 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl backdrop-blur-sm transition-all">
              Get started →
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            {[
              { v: "100% Local", l: "Offline gateway buffering" },
              { v: "< 3.2s", l: "Guardian SMS latency" },
              { v: "Safeguard-First", l: "Departure sign-off required" },
            ].map(t => (
              <div key={t.v}>
                <div className="text-2xl font-extrabold font-mono text-white" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>{t.v}</div>
                <div className="text-xs text-slate-300 mt-1">{t.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className="transition-all duration-300 rounded-full cursor-pointer"
              style={{ width: i === slide ? 28 : 8, height: 8, background: i === slide ? "#3b82f6" : "rgba(255,255,255,0.45)" }} />
          ))}
        </div>

        {/* Prev / Next arrows */}
        <button onClick={() => goTo((slide - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer text-lg">
          ‹
        </button>
        <button onClick={() => goTo((slide + 1) % SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer text-lg">
          ›
        </button>

        {/* Slide counter */}
        <div className="absolute top-4 right-4 z-30 font-mono text-xs text-white/60 bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
          {slide + 1} / {SLIDES.length}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 z-30 h-0.5 bg-blue-500/60" style={{ width: `${((slide + 1) / SLIDES.length) * 100}%`, transition: "width 0.6s ease" }} />
      </section>

      {/* ── Safeguarding Doctrine ── */}
      <section id="safeguarding" className="py-16 px-6 lg:px-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Core Operating Doctrine</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2">
              "A scan records an event; it does not, by itself, establish that a child was safely handed over."
            </h2>
            <p className="text-slate-300 mt-3 text-sm leading-relaxed">
              Unlike commercial workplace timeclocks, school attendance directly impacts child protection. Kathay Technologies architected the platform with mandatory operational safeguards:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "1", color: "bg-blue-500/20 text-blue-400", title: "Departure Approval Before Exit", desc: "A turnstile swipe records exit timing, but school staff must physically confirm authorized pickup identity before safe departure is certified." },
              { n: "2", color: "bg-amber-500/20 text-amber-400", title: "Missing Scans Are Exceptions", desc: "If an enrolled child has no arrival scan by 08:30 AM cutoff, the system creates a high-priority follow-up case with tracked parent contact attempts." },
              { n: "3", color: "bg-emerald-500/20 text-emerald-400", title: "Immutable Audit Trail", desc: "Any manual attendance correction preserves the original raw sensor event, reason code, authorizer name, and exact timestamp. Records are never deleted." },
            ].map(item => (
              <div key={item.n} className="p-6 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center font-bold`}>{item.n}</div>
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Daily Cycle ── */}
      <section id="overview" className="py-16 px-6 lg:px-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">System Lifecycle</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">One-Time Setup &amp; The Daily Attendance Cycle</h2>
            <p className="text-slate-600 text-sm mt-2">Pupil registration and biometric consent are handled once. Attendance validation and exception reviews repeat every school day.</p>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Phase A — Initial Onboarding (Completed Once Per School &amp; Pupil)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {[
                  { t: "1. School & Gate Configuration", d: "Kathay provisions school accounts, sets operational bell hours, enrolls turnstile readers, and tests network failover." },
                  { t: "2. Pupil Register & Data Notice", d: "School verifies admission numbers, class rosters, verified guardian phones, and designated pickup permissions." },
                  { t: "3. Biometric / RFID Enrolment", d: "Parent signed consent captured. Pupil registers fingerprint template or receives non-biometric RFID smart badge." },
                ].map(s => (
                  <div key={s.t} className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="font-semibold text-slate-900 mb-1">{s.t}</div>
                    <div className="text-slate-600">{s.d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Phase B — Daily Attendance &amp; Departure Cycle (Repeats Every School Day)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                {[
                  { step: "01", title: "Arrival Scan", desc: "Pupil taps finger/card at inbound turnstile.", sub: "Main/North Gates" },
                  { step: "02", title: "Validate & Record", desc: "5-min debounce prevents double scans. Local gateway logs event.", sub: "Edge Gateway" },
                  { step: "03", title: "Notify Guardian", desc: "1 SMS attempt dispatched to parent phone.", sub: "SMS Gateway" },
                  { step: "04", title: "Authorised Release", desc: "Staff verify pickup identity and scan exit.", sub: "Safeguarding Staff" },
                  { step: "05", title: "Notify Departure", desc: "Departure SMS sent with actual recorded time.", sub: "Carrier Receipt" },
                  { step: "06", title: "Review & Report", desc: "Resolve exceptions, late flags and failed SMS.", sub: "Supervisor Queue" },
                ].map(s => (
                  <div key={s.step} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-blue-600 font-bold">Step {s.step}</span>
                      <div className="font-semibold text-slate-900 mt-1">{s.title}</div>
                      <div className="text-slate-600 mt-1">{s.desc}</div>
                    </div>
                    <div className="mt-3 text-[11px] text-slate-400">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hardware ── */}
      <section id="hardware" className="py-16 px-6 lg:px-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white p-8 flex items-center justify-center" style={{ minHeight: 320 }}>
                <div className="text-center">
                  <div className="text-8xl mb-4">🖥️</div>
                  <div className="text-sm font-semibold text-slate-900">ZKTeco Series Terminal</div>
                  <div className="text-xs text-slate-500 mt-1">Optical fingerprint + 13.56MHz RFID + local template storage</div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Reliability Engineering</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Engineered for unreliable power and intermittent internet.</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {[
                  { icon: "📶", title: "Offline Gateway Queue", desc: "If school broadband fails, the local mini-PC stores every scan event. When connectivity returns, events reconcile cleanly." },
                  { icon: "🔋", title: "Uninterruptible Power Backup", desc: "Gate controllers operate on 12V LiFePO4 battery enclosures providing up to 8 hours during utility blackouts." },
                  { icon: "🛡️", title: "Supervised Card & PIN Alternative", desc: "Children who opt out of biometrics use registered RFID smartcards or supervised gate PIN entry with equal dignity." },
                  { icon: "⚡", title: "Direction & Sequence Enforcement", desc: "A pupil cannot trigger two arrival scans without flagging a direction anomaly. Scans must follow proper entry-then-exit sequence." },
                ].map(f => (
                  <div key={f.title} className="p-4 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                      <span>{f.icon}</span> {f.title}
                    </div>
                    <div className="text-slate-600 leading-relaxed">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SMS Preview ── */}
      <section id="notifications" className="py-16 px-6 lg:px-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Parent Notification Clarity</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Factual alerts that inform without making false guarantees.</h2>
              <p className="text-slate-600 text-sm leading-relaxed">Parent notifications must describe what was physically recorded at the gate — never promise that a child is already home.</p>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100 px-4 py-2.5 font-semibold text-slate-800 border-b border-slate-200 flex justify-between">
                  <span>Message Status</span><span>Practical Handling Rule</span>
                </div>
                <div className="divide-y divide-slate-100 bg-white">
                  {[
                    { s: "Queued / Sending", c: "font-mono text-slate-700", r: "Gate time recorded; waiting for carrier gateway acknowledgment." },
                    { s: "Delivered", c: "font-mono text-emerald-700", r: "Provider handset receipt confirmed with unique delivery ID." },
                    { s: "Delayed (Outage)", c: "font-mono text-amber-700", r: "Message displays actual morning event time, not when connectivity resumed." },
                    { s: "Failed", c: "font-mono text-rose-700", r: "Flagged immediately in school follow-up queue for manual phone check." },
                  ].map(row => (
                    <div key={row.s} className="px-4 py-2.5 flex items-start justify-between gap-4">
                      <span className={`${row.c} font-semibold shrink-0`}>{row.s}</span>
                      <span className="text-slate-600 text-right">{row.r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-72 rounded-[36px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800">
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />
                <div className="bg-slate-100 rounded-[28px] overflow-hidden flex flex-col" style={{ minHeight: 460 }}>
                  <div className="bg-slate-200/90 px-4 py-3 border-b border-slate-300 text-center">
                    <div className="text-[11px] font-mono text-slate-500">Messages · SMS</div>
                    <div className="text-xs font-bold text-slate-800">Greenhill School</div>
                    <div className="text-[10px] text-emerald-600">Sender ID: KATHAY_SMS</div>
                  </div>
                  <div className="flex-1 p-4 space-y-4 text-xs">
                    <div className="text-center text-[10px] text-slate-400 font-mono">Today · 19 Oct 2026</div>
                    <div className="flex flex-col items-start space-y-1">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%] shadow-sm leading-relaxed">
                        Greenhill School: Daniel Kato was recorded arriving at 7:42 a.m. today.
                      </div>
                      <span className="text-[10px] text-slate-400 pl-1 font-mono">07:42 AM · Delivered</span>
                    </div>
                    <div className="flex flex-col items-start space-y-1">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%] shadow-sm leading-relaxed">
                        Greenhill School: Daniel Kato was recorded leaving school at 4:18 p.m. today.
                      </div>
                      <span className="text-[10px] text-slate-400 pl-1 font-mono">04:19 PM · Delivered</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Automated broadcast service</span>
                    <span>📱</span>
                  </div>
                </div>
                <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Portals CTA ── */}
      <section className="py-16 px-6 lg:px-12 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Access Your Portal</h2>
            <p className="text-slate-600 text-sm mt-2">Every stakeholder has a dedicated portal with role-specific features.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: "👨‍👩‍👧‍👦", title: "Parent Portal", desc: "Track your child's arrivals and departures, view SMS history.", href: "/parent", login: "/parent/login", badge: "For Parents", grad: "from-emerald-500 to-teal-600" },
              { icon: "🏫", title: "School Management", desc: "Manage pupils, guardians, staff, gates and SMS templates.", href: "/school", login: "/login", badge: "For School Admins", grad: "from-violet-500 to-purple-600" },
              { icon: "👷", title: "Staff Dashboard", desc: "Record arrivals and departures, manage departure control.", href: "/dashboard", login: "/login", badge: "For Gate Staff", grad: "from-blue-500 to-blue-700" },
              { icon: "⚙️", title: "Kathay Admin", desc: "Platform overview, device integration and support queue.", href: "/kathay", login: "/login", badge: "Kathay Technologies", grad: "from-slate-700 to-slate-900" },
            ].map(p => (
              <div key={p.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all group">
                <div className="text-4xl">{p.icon}</div>
                <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{p.badge}</div>
                <h3 className="mt-3 text-base font-bold text-slate-900">{p.title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                <div className="mt-5 flex flex-col gap-2">
                  <Link href={p.login} className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r ${p.grad} px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md`}>
                    Sign in →
                  </Link>
                  <Link href="/signup" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                    Sign up
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-7 h-7 rounded-md bg-blue-700 text-white flex items-center justify-center text-xs font-bold">K</span>
            Kathay Technologies · School Attendance Platform
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <Link href="/parent/login" className="hover:text-blue-600">Parent portal</Link>
            <Link href="/school" className="hover:text-blue-600">School management</Link>
            <Link href="/dashboard" className="hover:text-blue-600">Staff dashboard</Link>
            <Link href="/signup" className="hover:text-blue-600">Sign up</Link>
            <Link href="/login" className="hover:text-blue-600">Sign in</Link>
          </div>
          <p className="text-xs text-slate-400">© 2026 Kathay Technologies</p>
        </div>
      </footer>
    </div>
  );
}
