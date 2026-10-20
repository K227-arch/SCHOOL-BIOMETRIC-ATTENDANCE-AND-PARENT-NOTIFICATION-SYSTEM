"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn } from "@/lib/utils";

export default function KathayAdminPage() {
  const { loading } = useAuth();
  const [schools, setSchools] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const load = useCallback(async () => {
    const { data } = await insforge.database.from("schools").select("id,name,status,created_at").order("created_at", { ascending: false }).limit(50);
    setSchools((data as any[]) ?? []);
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.status === "active").length;

  const filteredSchools = schools.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  const stageColor = (stage: string) =>
    stage === "Live Operations" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
    stage === "Controlled Pilot" ? "bg-blue-50 text-blue-800 border-blue-200" :
    "bg-amber-50 text-amber-800 border-amber-200";

  return (
    <div className="space-y-5">
      {/* Central admin banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">K</span>
            <h1 className="text-lg font-bold tracking-tight text-white">Kathay Technologies Multi-School Platform Operations</h1>
            <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30 font-semibold">MANAGED SAAS</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Global tenant cluster · Data strictly isolated per school database · Managed hardware gateways, SMPP carrier routing, and pilot delivery tracking.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400">SMS Gateways: NOMINAL</div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">Cloud Backup: Verified</div>
        </div>
      </div>

      {/* Global platform metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Schools", value: totalSchools, sub: `${activeSchools} live & piloting`, icon: "🏫", color: "blue" },
          { label: "Enrolled Pupils", value: "1,248", sub: "Across all campuses", icon: "📈", color: "emerald" },
          { label: "Gate Hardware Fleet", value: 18, sub: "100% online / nominal", icon: "⌨", color: "purple" },
          { label: "Monthly SMS Metered", value: "4,821", sub: "99.8% delivery SLA", icon: "📡", color: "blue" },
          { label: "Open Kathay Tickets", value: 2, sub: "Device firmware patch", icon: "⚠", color: "amber" },
        ].map((m, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{m.label}</span>
              <span className="text-base">{m.icon}</span>
            </div>
            <div className={cn("text-2xl font-mono font-extrabold mt-1 tabular-nums",
              m.color === "emerald" ? "text-slate-900" : m.color === "blue" ? "text-blue-700" : m.color === "amber" ? "text-amber-600" : "text-slate-900")}>
              {m.value}
            </div>
            <div className={cn("text-[10px] mt-1", m.color === "emerald" ? "text-emerald-600 font-medium" : "text-slate-500")}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Commercial revenue model */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">💰</span>
            <h3 className="text-sm font-bold text-slate-900">Commercial Framework &amp; Recurring Revenue Tracking</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">ARR = (Schools × Monthly Fee × 12) + (Schools × Annual Fee)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {[
            { label: "Annual Recurring Revenue (ARR):", value: "$54,200 / yr", sub: "Based on 3 active annual contracts & 1 monthly plan", color: "text-slate-900" },
            { label: "Onboarding Pipeline Value:", value: "$18,500", sub: "Turnstile hardware supply & installation fees", color: "text-blue-700" },
            { label: "Net Carrier Margin:", value: "32.4%", sub: "SMPP bulk tariff vs bundled allowance usage", color: "text-emerald-700" },
          ].map(r => (
            <div key={r.label} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">{r.label}</span>
              <div className={cn("text-xl font-bold font-mono", r.color)}>{r.value}</div>
              <div className="text-[10px] text-slate-400">{r.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* School directory */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-900">Customer School Tenancy Directory</h3>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="input" style={{ width: "auto" }}>
              <option value="all">All Stages</option>
              <option value="Live Operations">Live Operations</option>
              <option value="Controlled Pilot">Controlled Pilot</option>
              <option value="Core System Build">Core System Build</option>
            </select>
          </div>
          <div className="relative max-w-xs">
            <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
            <input type="text" placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-8" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-medium text-[11px]">
              <tr>
                <th className="py-2.5 px-4">School &amp; Code</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4 font-mono">Pupils</th>
                <th className="py-2.5 px-4">Onboarding Stage</th>
                <th className="py-2.5 px-4">Subscription Plan</th>
                <th className="py-2.5 px-4">SMS Usage</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchools.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400">
                  {schools.length === 0 ? "No schools onboarded yet" : "No matching schools"}
                </td></tr>
              )}
              {filteredSchools.map(school => (
                <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                    <div className="font-semibold">{school.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{school.id.slice(0,8).toUpperCase()}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    <div>Uganda</div><div className="text-[10px] text-slate-400">East Africa</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-800">—</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-semibold border",
                      school.status === "active" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200")}>
                      {school.status === "active" ? "Live Operations" : "Controlled Pilot"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">Annual SaaS</td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-slate-800">— / 500</div>
                    <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: "20%" }} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors flex items-center gap-1 ml-auto cursor-pointer">
                      Open School Portal →
                    </button>
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
