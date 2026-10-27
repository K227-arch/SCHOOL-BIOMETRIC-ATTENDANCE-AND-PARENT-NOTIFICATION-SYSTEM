"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function KathayBillingPage() {
  const { loading } = useAuth();
  const [schoolCount, setSchoolCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  const load = useCallback(async () => {
    const [{ count: total }, { count: active }] = await Promise.all([
      supabase.from("schools").select("id", { count: "exact" }).limit(1),
      supabase.from("schools").select("id", { count: "exact" }).eq("status", "active").limit(1),
    ]);
    setSchoolCount(total ?? 0);
    setActiveCount(active ?? 0);
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  // Example pricing from the document's revenue model
  const installFee = 1200;
  const monthlyFee = 150;
  const projectedARR = activeCount * monthlyFee * 12;
  const installRevenue = schoolCount * installFee;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Revenue & Billing</h2>
        <p className="mt-1 text-sm text-slate-400">
          Kathay charges a one-time installation and onboarding fee per school and a recurring
          monthly or annual management fee. Hardware supply, additional campuses and support
          beyond the package can be priced separately.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total schools", value: schoolCount, color: "text-blue-400" },
          { label: "Active schools", value: activeCount, color: "text-emerald-400" },
          { label: "Projected ARR", value: `$${projectedARR.toLocaleString()}`, color: "text-indigo-400" },
          { label: "Installation revenue", value: `$${installRevenue.toLocaleString()}`, color: "text-violet-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h3 className="text-sm font-semibold text-white">Revenue model</h3>
          <div className="mt-4 space-y-3 text-sm">
            {[
              { label: "Installation & onboarding fee", desc: "Per school — site assessment, configuration, installation, testing and initial training. Hardware quoted separately.", value: `$${installFee.toLocaleString()}/school` },
              { label: "Monthly subscription", desc: "Recurring fee for hosting, maintenance, upgrades, backups, administration and technical support.", value: `$${monthlyFee}/month` },
              { label: "Usage charges", desc: "SMS messages and excess traffic — pass through to school or include a defined allowance with overage pricing.", value: "Per usage" },
            ].map((r) => (
              <div key={r.label} className="rounded-lg border border-slate-600 bg-slate-700/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-white">{r.label}</div>
                    <div className="mt-0.5 text-xs text-slate-400">{r.desc}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-900/60 px-2 py-0.5 text-xs font-medium text-blue-400">{r.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
          <h3 className="text-sm font-semibold text-white">Revenue planning formula</h3>
          <div className="mt-4 rounded-lg bg-slate-700/50 p-4 font-mono text-xs text-slate-300 space-y-2">
            <p><span className="text-blue-400">ARR</span> = (schools on monthly plans × ${monthlyFee} × 12)</p>
            <p className="text-slate-500">+ (schools on annual plans × annual fee)</p>
            <p className="mt-2"><span className="text-violet-400">Install revenue</span> = new schools × installation fee</p>
            <p className="text-slate-500">(before installation costs)</p>
          </div>
          <div className="mt-4 space-y-2 text-xs text-slate-400">
            <p>Recurring revenue grows with school adoption.</p>
            <p>Profit depends on collection rates, retention, SMS usage and platform operating costs.</p>
          </div>
          <div className="mt-4 rounded-lg border border-slate-600 p-3 text-sm">
            <div className="text-slate-400">Platform operating costs include:</div>
            <ul className="mt-1 space-y-0.5 text-xs text-slate-500 list-disc list-inside">
              <li>Hosting, storage and monitoring</li>
              <li>SMS provider charges</li>
              <li>Support staff time</li>
              <li>Device warranty visits</li>
              <li>Security and payment collection</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-5">
        <h3 className="text-sm font-semibold text-amber-400">Pre-contracting decisions required</h3>
        <ul className="mt-3 space-y-1.5 text-xs text-amber-300/80 list-disc list-inside">
          <li>Exact supported scanners, warranties and API/SDK compatibility confirmed</li>
          <li>Quoted installation and subscription fees approved</li>
          <li>Who pays SMS charges — pass-through or inclusive allowance</li>
          <li>Service commitments, pilot acceptance criteria and managed-service agreement signed</li>
          <li>Support hours, response and restoration targets agreed in school contract</li>
          <li>Renewal, termination, data return and data-protection terms documented</li>
        </ul>
      </div>
    </div>
  );
}
