"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";

/* ── FAQ accordion item ───────────────────────────────────────────────────── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all ${open ? "border-blue-200 bg-blue-50/30" : "border-slate-200 bg-white"}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer">
        <span className="text-sm sm:text-base font-bold text-slate-900">{question}</span>
        <span className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold transition-all ${
          open ? "bg-blue-600 border-blue-600 text-white rotate-45" : "bg-white border-slate-300 text-slate-500"
        }`}>+</span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
          {answer}
        </div>
      )}
    </div>
  );
}

/* ── Contact form ─────────────────────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", school: "", message: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // Simulate submission — replace with real endpoint when available
    await new Promise(r => setTimeout(r, 1000));
    setBusy(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-3xl">✓</div>
        <h4 className="text-lg font-extrabold text-slate-900">Message sent!</h4>
        <p className="text-sm text-slate-500">Our team will get back to you within one business day.</p>
        <button onClick={() => { setSent(false); setForm({ name: "", email: "", school: "", message: "" }); }}
          className="text-xs text-blue-600 hover:underline font-semibold mt-2">Send another message</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your name</label>
          <input required className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="e.g. Sarah Nambi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email address</label>
          <input type="email" required className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="you@school.edu" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">School name</label>
        <input className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          placeholder="e.g. Greenhill Primary School" value={form.school} onChange={e => setForm({...form, school: e.target.value})} />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message</label>
        <textarea required rows={4} className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          placeholder="Tell us about your school and what you'd like to know…" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
      </div>
      <button type="submit" disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all"
        style={{ background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)", boxShadow: "0 4px 14px rgba(29,78,216,0.3)" }}>
        {busy
          ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending…</>
          : <>✉ Send message</>}
      </button>
    </form>
  );
}

/* ── Hero slides ──────────────────────────────────────────────────────────── */
const SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80&auto=format&fit=crop",
    eyebrow: "For school administrators",
    headline: "Know exactly who is in your school, right now.",
    sub: "Every arrival and departure is recorded automatically. No registers, no guessing.",
  },
  {
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1600&q=80&auto=format&fit=crop",
    eyebrow: "For parents & guardians",
    headline: "Get a text the moment your child arrives.",
    sub: "An SMS lands on your phone within seconds of your child scanning at the gate.",
  },
  {
    url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&q=80&auto=format&fit=crop",
    eyebrow: "For gate staff",
    headline: "One tap to record. One tap to release.",
    sub: "A simple dashboard for arrivals, departures and follow-up cases — no training needed.",
  },
  {
    url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80&auto=format&fit=crop",
    eyebrow: "For safeguarding leads",
    headline: "Nothing slips through the cracks.",
    sub: "Missing scans, failed SMS and unapproved early exits are flagged automatically.",
  },
];

/* ── How it works steps ────────────────────────────────────────────────────── */
const STEPS = [
  { icon: "🖥", title: "School installs the system",    desc: "Kathay sets up the fingerprint or card readers at your school gates. Takes one day." },
  { icon: "🎓", title: "Pupils are enrolled",           desc: "Each pupil scans their fingerprint or gets an RFID card. Parents give consent once." },
  { icon: "✔",  title: "Child scans at the gate",       desc: "Every morning the pupil taps the reader. The system logs the time instantly." },
  { icon: "📱", title: "Parent gets a text",            desc: 'Within 3 seconds a plain-English SMS arrives: "Your child arrived at 7:42 AM."' },
  { icon: "🚪", title: "Safe departure confirmed",      desc: "Staff verify the pickup person before the child leaves. A second SMS confirms departure." },
];

/* ── Feature cards ─────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: "⚡", title: "Works without internet",   desc: "If the school's internet goes down the system keeps recording. Everything syncs when it comes back.", color: "#3b82f6" },
  { icon: "🔒", title: "Your data, only yours",    desc: "Each school's records are completely separate. No other school can see your pupils.", color: "#8b5cf6" },
  { icon: "📊", title: "Reports in one click",     desc: "Daily attendance, late arrivals, SMS delivery rates and device health — all exportable.", color: "#10b981" },
  { icon: "🛡", title: "Built for safeguarding",   desc: "A missing scan creates a case automatically. Staff must close it before the day ends.", color: "#f59e0b" },
  { icon: "📱", title: "Parents always informed",  desc: "Verified parent contacts receive SMS for both arrival and safe departure — not just one.", color: "#ef4444" },
  { icon: "🌍", title: "Designed for Africa",      desc: "Works on MTN, Airtel and other local networks. Built for load-shedding and variable internet.", color: "#06b6d4" },
];

export default function LandingPage() {
  const { loading } = useAuth();
  const [slide, setSlide] = useState(0);
  const [fading, setFading] = useState(false);
  const router = useRouter();

  // ── Handle Supabase magic link / OTP callbacks that land on the homepage ──
  // The default emailRedirectTo is the Site URL (this page). We detect auth
  // params and forward to /auth/callback which handles session exchange.
  useEffect(() => {
    const search = window.location.search;
    const hash   = window.location.hash;

    // ?code= (PKCE) or ?token_hash= (token hash flow)
    if (search.includes("code=") || search.includes("token_hash=")) {
      router.replace("/auth/callback" + search);
      return;
    }
    // #access_token= (implicit / magic link)
    if (hash && hash.includes("access_token=")) {
      router.replace("/auth/callback" + hash);
      return;
    }
  }, [router]);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      setTimeout(() => { setSlide(p => (p + 1) % SLIDES.length); setFading(false); }, 500);
    }, 10000);
    return () => clearInterval(t);
  }, []);

  function goTo(i: number) {
    if (i === slide) return;
    setFading(true);
    setTimeout(() => { setSlide(i); setFading(false); }, 500);
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md shadow-blue-500/30">K</div>
            <span className="text-base font-extrabold text-slate-900 tracking-tight">Kathay</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#how" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#portals" className="hover:text-slate-900 transition-colors">Portals</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            {!loading && (
              <>
                <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">Sign in</Link>
                <Link href="/login" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero slider ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ height: "92vh", minHeight: 540 }}>

        {SLIDES.map((s, i) => (
          <div key={i} className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: i === slide ? (fading ? 0 : 1) : 0, zIndex: i === slide ? 1 : 0 }}>
            <img src={s.url} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.38)" }} />
          </div>
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to top, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.15) 60%, transparent 100%)" }} />

        {/* Content */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-5">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
            {SLIDES[slide].eyebrow}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white max-w-4xl leading-tight tracking-tight"
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
            {SLIDES[slide].headline}
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-200 max-w-2xl leading-relaxed"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
            {SLIDES[slide].sub}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login"
              className="px-7 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-xl shadow-blue-900/40 transition-all">
              Get started →
            </Link>
          </div>

          {/* Trust numbers */}
          <div className="mt-14 grid grid-cols-3 gap-10 text-center">
            {[
              { v: "< 3s",     l: "SMS delivery" },
              { v: "100%",     l: "Offline capable" },
              { v: "Zero",     l: "Raw biometrics stored" },
            ].map(t => (
              <div key={t.v}>
                <div className="text-3xl font-extrabold text-white font-mono">{t.v}</div>
                <div className="text-xs text-slate-400 mt-1">{t.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300 cursor-pointer"
              style={{ width: i === slide ? 28 : 8, height: 8, background: i === slide ? "#3b82f6" : "rgba(255,255,255,0.35)" }} />
          ))}
        </div>

        {/* Arrows */}
        <button onClick={() => goTo((slide - 1 + SLIDES.length) % SLIDES.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors cursor-pointer flex items-center justify-center text-xl">‹</button>
        <button onClick={() => goTo((slide + 1) % SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors cursor-pointer flex items-center justify-center text-xl">›</button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 z-30 h-0.5 bg-blue-500/70 transition-all duration-500"
          style={{ width: `${((slide + 1) / SLIDES.length) * 100}%` }} />
      </section>

      {/* ── Social proof strip ──────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white py-5 px-5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm">
          {["Greenhill Primary School", "St. Catherine's Academy", "Kampala Junior School", "Victory Primary School"].map(s => (
            <span key={s} className="text-slate-400 font-medium">{s}</span>
          ))}
          <span className="text-slate-600">and more schools across Uganda</span>
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how" className="py-20 px-5 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Simple by design</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">How it works</h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">Five steps from first scan to parent notification. No complicated setup. No training manual.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-slate-200 z-0" style={{ width: "calc(100% - 2rem)", left: "calc(50% + 1.5rem)" }} />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-3xl shadow-sm mb-4">
                    {s.icon}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center -mt-2 mb-3 shadow">{i + 1}</div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SMS mockup + explanation ─────────────────────────────────────── */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Text */}
          <div className="space-y-6">
            <div className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-widest">For parents</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              A simple text.<br />Peace of mind.
            </h2>
            <p className="text-slate-500 leading-relaxed">
              When your child scans at the school gate, you get an SMS within seconds. Plain English, no jargon. Just the time, the school name, and your child's name.
            </p>
            <ul className="space-y-3 text-sm">
              {[
                "Works on MTN, Airtel, and all major networks",
                "Separate messages for arrival and safe departure",
                "If delivery fails, the school is alerted automatically",
                "No app to install. Just your phone number.",
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/parent/login"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg shadow-emerald-500/20 transition-all">
              Get started →
            </Link>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center">
            <div className="w-64 rounded-[40px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800">
              <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-3" />
              <div className="bg-slate-100 rounded-[28px] overflow-hidden">
                <div className="bg-white px-4 py-3 border-b border-slate-200 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">Messages</div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">Greenhill School</div>
                  <div className="text-[9px] text-emerald-600">KATHAY_SMS</div>
                </div>
                <div className="p-4 space-y-4 bg-slate-50" style={{ minHeight: 280 }}>
                  <div className="text-center text-[10px] text-slate-400 font-mono">Today, Mon 19 Oct 2026</div>
                  <div className="space-y-1">
                    <div className="bg-blue-600 text-white text-xs rounded-2xl rounded-tl-sm px-3.5 py-3 leading-relaxed shadow-sm">
                      Greenhill School: Daniel Kato arrived at 7:42 AM today.
                    </div>
                    <div className="text-[10px] text-slate-400 pl-1 font-mono">07:42 · Delivered ✓</div>
                  </div>
                  <div className="space-y-1">
                    <div className="bg-blue-600 text-white text-xs rounded-2xl rounded-tl-sm px-3.5 py-3 leading-relaxed shadow-sm">
                      Greenhill School: Daniel Kato left school safely at 4:18 PM today.
                    </div>
                    <div className="text-[10px] text-slate-400 pl-1 font-mono">16:19 · Delivered ✓</div>
                  </div>
                </div>
                <div className="px-4 py-2.5 bg-white border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
                  <span>Automated. Do not reply.</span><span>📱</span>
                </div>
              </div>
              <div className="w-20 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-5 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Everything you need</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Built for real schools</h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">Not a warehouse system with a school logo slapped on it. Every feature exists because a real school asked for it.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-xl hover:border-transparent transition-all">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
                  style={{ background: f.color }} />
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-sm"
                  style={{ background: f.color + "18", border: `1px solid ${f.color}25` }}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portals ─────────────────────────────────────────────────────── */}
      <section id="portals" className="py-20 px-5 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Three portals, one platform</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Pick your portal</h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">Choose the portal that fits your role. School staff and Kathay admins sign in from the same page.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: "🏫",
                title: "School Portal",
                who: "For school admins & gate staff",
                desc: "Record gate scans, manage pupils, run reports and handle exceptions — all in one place.",
                href: "/login",
                cta: "Get started",
                accent: "blue",
                iconBg: "bg-blue-50",
                iconBorder: "border-blue-100",
                btnBg: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)",
                btnShadow: "rgba(29,78,216,0.3)",
                hoverBorder: "hover:border-blue-300",
                points: ["Live attendance feed", "Pupil & guardian management", "SMS templates & reports", "Departure control"],
              },
              {
                icon: "⚙️",
                title: "Kathay Admin",
                who: "For Kathay Technologies",
                desc: "Platform-wide management — onboard schools, monitor devices, manage SMS carriers and approve signups.",
                href: "/login",
                cta: "Get started",
                accent: "indigo",
                iconBg: "bg-indigo-50",
                iconBorder: "border-indigo-100",
                btnBg: "linear-gradient(135deg, #3730a3 0%, #6366f1 100%)",
                btnShadow: "rgba(99,102,241,0.35)",
                hoverBorder: "hover:border-indigo-300",
                points: ["School onboarding & approvals", "Device & hardware fleet", "Multi-school overview", "Support & billing"],
              },
              {
                icon: "👨‍👩‍👧‍👦",
                title: "Parent Portal",
                who: "For parents & guardians",
                desc: "See when your child arrives and leaves school. Receive SMS alerts automatically. No app needed.",
                href: "/parent/login",
                cta: "Parent sign in",
                accent: "emerald",
                iconBg: "bg-emerald-50",
                iconBorder: "border-emerald-100",
                btnBg: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                btnShadow: "rgba(16,185,129,0.3)",
                hoverBorder: "hover:border-emerald-300",
                points: ["Arrival & departure alerts", "SMS notification history", "Child attendance record"],
              },
            ].map(p => (
              <div key={p.title}
                className={`group rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col ${p.hoverBorder}`}>
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg ${p.iconBg} border ${p.iconBorder} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform`}>
                  {p.icon}
                </div>
                {/* Label */}
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{p.who}</div>
                {/* Title */}
                <h3 className="text-lg font-extrabold text-slate-900 mb-2">{p.title}</h3>
                {/* Description */}
                <p className="text-sm text-slate-500 leading-relaxed mb-5 flex-1">{p.desc}</p>
                {/* Points */}
                <ul className="space-y-2 mb-6">
                  {p.points.map(pt => (
                    <li key={pt} className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="w-4 h-4 rounded-full bg-white border border-slate-200 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                      {pt}
                    </li>
                  ))}
                </ul>
                {/* CTA */}
                <Link href={p.href}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                  style={{ background: p.btnBg, boxShadow: `0 4px 14px ${p.btnShadow}` }}>
                  {p.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Got questions?</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Frequently asked questions</h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">Everything you need to know about the Kathay school attendance system.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How does the biometric system work?",
                a: "Each pupil registers their fingerprint or gets an RFID smart card when they enrol. When they arrive at school, they tap the reader at the gate. The system logs the exact time, checks the credential, and sends an SMS to the parent — all in under 3 seconds.",
              },
              {
                q: "What happens if the internet goes down?",
                a: "The gate readers connect to a local edge gateway — a small computer installed on-site by Kathay. All scans are stored locally with microsecond timestamps. When the internet comes back, everything syncs automatically. Parents receive the SMS with the actual gate scan time, not the reconnection time.",
              },
              {
                q: "My child doesn't want to use fingerprints. Is there an alternative?",
                a: "Yes. Any pupil can use an RFID smart card badge instead of biometrics. Both options work with the same gate readers and trigger the same parent notifications. Fingerprint data is never stored as an image — only a mathematical hash that cannot be reverse-engineered.",
              },
              {
                q: "How does the school get onboarded?",
                a: "Kathay Technologies handles the full onboarding process. We conduct a site assessment, install the gate readers and local gateway, configure the system to your school's hours and bell schedule, verify the pupil register and guardian contacts, and train your staff. You don't need any technical knowledge.",
              },
              {
                q: "How do parents get access to the parent portal?",
                a: "Parents create a free account at the parent portal using the same phone number or email registered with the school. After linking their account to their child's admission number, they can view attendance history and SMS logs at any time.",
              },
              {
                q: "What if an SMS fails to deliver?",
                a: "Every SMS is tracked through queued, sent, and delivered states. If delivery fails, it is flagged automatically in the school's follow-up queue. A staff member is notified and can call the parent directly. All failed messages and contact attempts are logged for safeguarding audit purposes.",
              },
              {
                q: "Can a child be picked up by someone other than the parent?",
                a: "Yes. Each pupil's record includes authorised pickup persons — other family members, a driver, or a school shuttle. Gate staff verify the collector's identity before releasing a pupil, and the parent receives a departure SMS regardless of who collected.",
              },
              {
                q: "How much does it cost?",
                a: "Pricing depends on school size, the number of gate terminals required, and whether you choose monthly or annual billing. Contact Kathay Technologies for a quote tailored to your school.",
              },
            ].map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section id="contact" className="py-20 px-5 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">

          {/* Left: copy */}
          <div className="space-y-6">
            <div className="inline-block text-xs font-bold text-blue-600 uppercase tracking-widest">Get in touch</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Talk to Kathay Technologies</h2>
            <p className="text-slate-500 leading-relaxed">
              Whether you want to onboard your school, ask a technical question, or just learn more about how the system works — our team is here to help.
            </p>

            <div className="space-y-4">
              {[
                { icon: "📧", label: "Email us", value: "info@kathay.co.ug", href: "mailto:info@kathay.co.ug" },
                { icon: "📞", label: "Call us", value: "+256 700 000 000", href: "tel:+256700000000" },
                { icon: "📍", label: "Based in", value: "Kampala, Uganda", href: null },
                { icon: "⏰", label: "Office hours", value: "Mon – Fri, 8:00 AM – 5:00 PM EAT", href: null },
              ].map(c => (
                <div key={c.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg shrink-0">{c.icon}</div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{c.label}</div>
                    {c.href
                      ? <a href={c.href} className="text-sm font-semibold text-blue-700 hover:underline mt-0.5 block">{c.value}</a>
                      : <div className="text-sm font-semibold text-slate-900 mt-0.5">{c.value}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: contact form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">Send us a message</h3>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: 80 + i * 80, height: 80 + i * 80, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Ready to get started?</h2>
          <p className="mt-4 text-blue-100 text-lg">Join schools across Uganda using Kathay to keep pupils safe and parents informed.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login"
              className="px-8 py-4 text-base font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-2xl shadow-xl transition-all">
              Get started →
            </Link>
          </div>
          <p className="mt-6 text-sm text-blue-200">No credit card required. Installation handled by Kathay.</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-extrabold text-white text-sm">K</div>
                <span className="text-white font-extrabold">Kathay Technologies</span>
              </div>
              <p className="text-sm max-w-xs leading-relaxed">School biometric attendance and parent notification system. Built in Uganda, for Uganda.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="text-white font-semibold mb-3">Portals</div>
                <div className="space-y-2">
                  <Link href="/parent/login" className="block hover:text-white transition-colors">Parent portal</Link>
                  <Link href="/login" className="block hover:text-white transition-colors">Staff login</Link>
                  <Link href="/login" className="block hover:text-white transition-colors">School signup</Link>
                </div>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Platform</div>
                <div className="space-y-2">
                  <Link href="/dashboard" className="block hover:text-white transition-colors">Dashboard</Link>
                  <Link href="/dashboard/attendance" className="block hover:text-white transition-colors">Attendance</Link>
                  <Link href="/dashboard/reports" className="block hover:text-white transition-colors">Reports</Link>
                </div>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Support</div>
                <div className="space-y-2">
                  <Link href="/school/support" className="block hover:text-white transition-colors">Support tickets</Link>
                  <Link href="/kathay" className="block hover:text-white transition-colors">Kathay admin</Link>
                  <a href="#faq" className="block hover:text-white transition-colors">FAQs</a>
                  <a href="#contact" className="block hover:text-white transition-colors">Contact us</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <span>© 2026 Kathay Technologies Ltd. All rights reserved.</span>
            <span>School Biometric Attendance & Parent Notification System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
