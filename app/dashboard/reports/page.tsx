"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Device, SmsNotification } from "@/lib/types";

export default function ReportsPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [arrivals, setArrivals] = useState(0);
  const [departures, setDepartures] = useState(0);
  const [lateArrivals, setLateArrivals] = useState(0);
  const [earlyExits, setEarlyExits] = useState(0);
  const [smsFailed, setSmsFailed] = useState(0);
  const [smsTotal, setSmsTotal] = useState(0);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const start = `${today}T00:00:00Z`;
      const end = `${today}T23:59:59Z`;
      const { count: a } = await supabase.from("attendance_events").select("id", { count: "exact" })
        .eq("school_id", schoolId).eq("event_type", "arrival")
        .gte("event_time", start).lte("event_time", end).limit(1);
      const { count: d } = await supabase.from("attendance_events").select("id", { count: "exact" })
        .eq("school_id", schoolId).eq("event_type", "departure")
        .gte("event_time", start).lte("event_time", end).limit(1);
      setArrivals(a ?? 0);
      setDepartures(d ?? 0);

      const { data: smsRows } = await supabase.from("sms_notifications").select("status")
        .eq("school_id", schoolId).gte("queued_at", start).lte("queued_at", end).limit(500);
      const sms = (smsRows as SmsNotification[] | null) ?? [];
      setSmsTotal(sms.length);
      setSmsFailed(sms.filter((s) => s.status === "failed").length);

      const { data: devRows } = await supabase.from("devices")
        .select("id, name, device_type, model, serial_number, status, last_seen_at")
        .eq("school_id", schoolId).order("name", { ascending: true }).limit(50);
      setDevices((devRows as Device[] | null) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    }
  }, [schoolId]);

  useEffect(() => {
    if (!loading) void load();
  }, [loading, load]);

  if (!schoolId) {
    return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;
  }

  const cards = [
    { label: "Arrivals today", value: arrivals, cls: "text-emerald-700" },
    { label: "Departures today", value: departures, cls: "text-blue-700" },
    { label: "Late arrivals", value: lateArrivals, cls: "text-amber-700" },
    { label: "Early exits", value: earlyExits, cls: "text-orange-700" },
    { label: "SMS total", value: smsTotal, cls: "text-slate-900" },
    { label: "SMS failures", value: smsFailed, cls: "text-red-700" },
  ];

  function exportCsv() {
    const rows = [["metric", "value"], ...cards.map((c) => [c.label, String(c.value)])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports & device health</h2>
          <p className="mt-1 text-sm text-slate-500">
            Daily attendance, late arrival and early exit trends, unresolved exceptions, SMS
            failures and device last-seen status.
          </p>
        </div>
        <button onClick={exportCsv} className="btn-secondary text-xs">Export CSV</button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="text-xs font-medium text-slate-500">{c.label}</div>
            <div className={cn("mt-2 text-2xl font-bold", c.cls)}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-900">Device health</h3>
        <div className="mt-4 overflow-x-auto">
          {devices.length === 0 ? (
            <p className="text-sm text-slate-400">No devices registered.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Model</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{d.name}</td>
                    <td className="px-3 py-2.5 capitalize text-slate-600">{d.device_type}</td>
                    <td className="px-3 py-2.5 text-slate-600">{d.model ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("badge", d.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : "never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
