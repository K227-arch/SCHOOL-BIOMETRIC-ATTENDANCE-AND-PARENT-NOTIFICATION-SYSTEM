"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, formatDateTime } from "@/lib/utils";

interface EventRow { id: string; event_type: string; event_time: string; result: string; school_name: string; }
interface SmsRow { id: string; status: string; error: string | null; phone_number: string; queued_at: string; school_name: string; }

export default function KathayMonitoringPage() {
  const { loading } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [failedSms, setFailedSms] = useState<SmsRow[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [failedToday, setFailedToday] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const { data: evRows } = await insforge.database
        .from("attendance_events")
        .select("id, event_type, event_time, result, school_id, schools(name)")
        .order("event_time", { ascending: false }).limit(30);
      setEvents(((evRows ?? []) as Record<string, unknown>[]).map((e) => ({
        id: e.id as string, event_type: e.event_type as string,
        event_time: e.event_time as string, result: e.result as string,
        school_name: ((e.schools as Record<string, string> | null)?.name) ?? "—",
      })));

      const { count: tot } = await insforge.database.from("attendance_events")
        .select("id", { count: "exact" }).gte("event_time", `${today}T00:00:00Z`).limit(1);
      setTotalToday(tot ?? 0);

      const { data: smsRows } = await insforge.database
        .from("sms_notifications")
        .select("id, status, error, phone_number, queued_at, school_id, schools(name)")
        .eq("status", "failed").order("queued_at", { ascending: false }).limit(50);
      setFailedSms(((smsRows ?? []) as Record<string, unknown>[]).map((s) => ({
        id: s.id as string, status: s.status as string, error: s.error as string | null,
        phone_number: s.phone_number as string, queued_at: s.queued_at as string,
        school_name: ((s.schools as Record<string, string> | null)?.name) ?? "—",
      })));

      const { count: failC } = await insforge.database.from("sms_notifications")
        .select("id", { count: "exact" }).eq("status", "failed").limit(1);
      setFailedToday(failC ?? 0);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load monitoring"); }
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitoring</h2>
          <p className="mt-1 text-sm text-slate-400">Live event feed, SMS failure tracking and device health across all schools.</p>
        </div>
        <button onClick={() => load()} className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Refresh</button>
      </div>
      {error && <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">{error}</div>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Scan events today", value: totalToday, color: "text-blue-400" },
          { label: "SMS failures (total)", value: failedToday, color: "text-red-400" },
          { label: "Schools monitored", value: "All", color: "text-emerald-400" },
          { label: "Uptime target", value: "SLA", color: "text-violet-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <div className="text-xs text-slate-400">{s.label}</div>
            <div className={cn("mt-2 text-2xl font-bold", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent events */}
        <div className="rounded-xl border border-slate-700 bg-slate-800">
          <div className="border-b border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-white">Recent scan events (all schools)</h3>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-700">
            {events.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No events.</p> : events.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mr-2",
                    e.event_type === "arrival" ? "bg-emerald-900/60 text-emerald-400" : "bg-blue-900/60 text-blue-400")}>
                    {e.event_type}
                  </span>
                  <span className="text-xs text-slate-400">{e.school_name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-300">{formatDateTime(e.event_time)}</div>
                  <span className={cn("text-xs", e.result === "success" ? "text-emerald-400" : "text-amber-400")}>
                    {e.result.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failed SMS */}
        <div className="rounded-xl border border-slate-700 bg-slate-800">
          <div className="border-b border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-white">Failed SMS notifications</h3>
            <p className="mt-0.5 text-xs text-slate-400">Queue/retry with limits, flag unresolved failures.</p>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-700">
            {failedSms.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No failures.</p> : failedSms.map((s) => (
              <div key={s.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-red-400">FAILED</span>
                  <span className="text-xs text-slate-400">{s.school_name}</span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">{s.phone_number}</div>
                {s.error && <div className="text-xs text-slate-500 mt-0.5">{s.error}</div>}
                <div className="text-xs text-slate-500 mt-0.5">{formatDateTime(s.queued_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h3 className="text-sm font-semibold text-white">Monitoring responsibilities</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs text-slate-400">
          {[
            "Performance and uptime targets per school contract",
            "Device last-seen checks every monitoring cycle",
            "SMS provider status separate from delivery success",
            "Internet outage: reconcile queued events on reconnection",
            "Duplicate scan detection and impossible sequence flagging",
            "Monthly service review and incident response procedures",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-lg bg-slate-700/50 p-2.5">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
