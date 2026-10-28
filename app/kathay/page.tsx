"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";

interface SchoolSummary {
  id: string;
  name: string;
  code: string | null;
  district: string | null;
  country: string | null;
  status: string;
  subscription_plan: string | null;
  created_at: string;
  login_email?: string | null;
  pupil_count?: number;
}

export default function KathayAdminPage() {
  const { context, loading } = useAuth();
  const [schools, setSchools]       = useState<SchoolSummary[]>([]);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"inactive">("all");
  const [totalPupils, setTotalPupils]   = useState<number>(0);
  const [totalDevices, setTotalDevices] = useState<number>(0);
  const [totalSms, setTotalSms]         = useState<number>(0);

  const load = useCallback(async () => {
    // Schools + credentials
    const [{ data: sData }, { data: cData }, { data: pData }, { data: dData }, { data: smsData }] = await Promise.all([
      supabase.from("schools").select("id,name,code,district,country,status,subscription_plan,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("school_credentials").select("school_id,login_email").limit(300),
      supabase.from("pupils").select("id,school_id").limit(5000),
      supabase.from("devices").select("id").limit(500),
      supabase.from("sms_notifications").select("id").limit(5000),
    ]);

    const credMap = new Map((cData as any[] ?? []).map((c: any) => [c.school_id, c.login_email]));
    const pupils  = (pData as any[] ?? []);
    const pupilsBySchool = new Map<string, number>();
    pupils.forEach((p: any) => pupilsBySchool.set(p.school_id, (pupilsBySchool.get(p.school_id) ?? 0) + 1));

    const rows = (sData as any[] ?? []).map((s: any) => ({
      ...s,
      login_email:  credMap.get(s.id) ?? null,
      pupil_count:  pupilsBySchool.get(s.id) ?? 0,
    }));

    setSchools(rows);
    setTotalPupils(pupils.length);
    setTotalDevices((dData as any[] ?? []).length);
    setTotalSms((smsData as any[] ?? []).length);
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const activeSchools   = schools.filter(s => s.status === "active").length;
  const inactiveSchools = schools.length - activeSchools;

  const filtered = schools.filter(s => {
    const m = s.name.toLowerCase().includes(search.toLowerCase()) ||
              (s.code ?? "").toLowerCase().includes(search.toLowerCase()) ||
              (s.district ?? "").toLowerCase().includes(search.toLowerCase());
    const sf = statusFilter === "all" || s.status === statusFilter;
    return m && sf;
  });

  const planBadge = (plan: string | null) =>
    plan === "enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" :
    plan === "growth"     ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="space-y-5">

      {/* Platform banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">K</span>
            <h1 className="text-base font-bold tracking-tight text-white">Kathay Technologies · Platform Operations</h1>
            <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30 font-semibold">MANAGED SAAS</span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Welcome back, <span className="text-white font-medium">{context?.user_name ?? "Admin"}</span>.
            Multi-school tenant cluster · per-school data isolation · SMPP carrier routing.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400">SMS: NOMINAL</div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">Backup: OK</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Schools",    value: schools.length,  sub: `${activeSchools} active · ${inactiveSchools} inactive`, icon: "🏫", accent: "text-blue-700" },
          { label: "Enrolled Pupils",  value: totalPupils,     sub: "Across all schools",        icon: "🎓", accent: "text-slate-900" },
          { label: "Hardware Devices", value: totalDevices,    sub: "Biometric & RFID readers",  icon: "🖥",  accent: "text-purple-700" },
          { label: "SMS Sent",         value: totalSms,        sub: "Lifetime notifications",    icon: "📱", accent: "text-emerald-700" },
        ].map((m, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{m.label}</span>
              <span className="text-base">{m.icon}</span>
            </div>
            <div className={cn("text-2xl font-mono font-extrabold mt-1 tabular-nums", m.accent)}>
              {m.value.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* School directory */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900">School Directory</h3>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              {(["all","active","inactive"] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    statusFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                  {f === "all" ? `All (${schools.length})` : f === "active" ? `Active (${activeSchools})` : `Inactive (${inactiveSchools})`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input type="text" placeholder="Search schools…" value={search} onChange={e => setSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400 w-full sm:w-44" />
            </div>
            <Link href="/kathay/schools"
              className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap">
              + Onboard School
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              <tr>
                <th className="py-2.5 px-4">School</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Login Email</th>
                <th className="py-2.5 px-4 text-right">Pupils</th>
                <th className="py-2.5 px-4">Plan</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Onboarded</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">
                  {schools.length === 0 ? (
                    <div className="space-y-2">
                      <div className="text-3xl">🏫</div>
                      <p>No schools onboarded yet.</p>
                      <Link href="/kathay/schools" className="text-blue-600 hover:underline font-medium">Onboard your first school →</Link>
                    </div>
                  ) : "No schools match your search."}
                </td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{s.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{s.code ?? "—"}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{s.district ?? "—"}</div>
                    <div className="text-[10px] text-slate-400">{s.country ?? "Uganda"}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{s.login_email ?? <span className="text-slate-400">—</span>}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">{(s.pupil_count ?? 0).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-semibold border", planBadge(s.subscription_plan))}>
                      {(s.subscription_plan ?? "starter").charAt(0).toUpperCase() + (s.subscription_plan ?? "starter").slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      s.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", s.status === "active" ? "bg-emerald-500" : "bg-slate-400")} />
                      {s.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(s.created_at)}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href="/kathay/schools"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors">
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
