"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, fullName, formatTime, formatDateTime, SMS_STATUS_STYLES } from "@/lib/utils";
import type { Pupil, Guardian, FollowUp } from "@/lib/types";

/* ── Figure 6: Pupil history table row ────────────── */
interface HistoryRow {
  date: string;            // "18 Oct"
  arrival: string;         // "7:42" or "—"
  departure: string;       // "4:18" or "No exit"
  sms: string;             // "Both" | "Arrival" | "—"
  remark: string;          // "Normal" | "Late noted" | "Review open"
  departureClass?: string;
  remarkClass?: string;
}

interface SmsRow { id: string; message_type: string; status: string; phone_number: string; message_body: string; queued_at: string; }

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const pupilId = String(params.id);

  const [pupil, setPupil] = useState<Pupil | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [sms, setSms] = useState<SmsRow[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!schoolId || !pupilId) return;
    const { data: pRow, error: pErr } = await supabase.from("pupils")
      .select("*").eq("id", pupilId).eq("school_id", schoolId).limit(1);
    if (pErr) return setError(pErr.message);
    setPupil((pRow as Pupil[] | null)?.[0] ?? null);

    const [{ data: gRows }, { data: evRows }, { data: smsRows }, { data: fuRows }] = await Promise.all([
      supabase.from("guardians").select("*").eq("pupil_id", pupilId).limit(5),
      supabase.from("attendance_events")
        .select("event_type, event_time, result")
        .eq("pupil_id", pupilId).eq("result", "success")
        .order("event_time", { ascending: false }).limit(60),
      supabase.from("sms_notifications")
        .select("id, message_type, status, phone_number, message_body, queued_at")
        .eq("pupil_id", pupilId).order("queued_at", { ascending: false }).limit(30),
      supabase.from("follow_ups")
        .select("id, exception_type, status, reason, created_at")
        .eq("pupil_id", pupilId).order("created_at", { ascending: false }).limit(20),
    ]);

    setGuardians((gRows as Guardian[] | null) ?? []);
    setSms((smsRows as SmsRow[] | null) ?? []);
    setFollowups((fuRows as FollowUp[] | null) ?? []);

    // Build history table grouped by date — matching Figure 6
    const byDate: Record<string, { arr?: string; dep?: string; lateArr?: boolean }> = {};
    const evList = (evRows as { event_type: string; event_time: string; result: string }[] | null) ?? [];
    evList.forEach(e => {
      const d = e.event_time.slice(0, 10);
      if (!byDate[d]) byDate[d] = {};
      if (e.event_type === "arrival" && !byDate[d].arr) {
        byDate[d].arr = formatTime(e.event_time);
        // Late if after 09:15
        byDate[d].lateArr = new Date(e.event_time).getHours() >= 9 && new Date(e.event_time).getMinutes() > 15;
      }
      if (e.event_type === "departure" && !byDate[d].dep) {
        byDate[d].dep = formatTime(e.event_time);
      }
    });

    // SMS map by date
    const smsByDate: Record<string, { arr: boolean; dep: boolean }> = {};
    (smsRows as SmsRow[] | null ?? []).forEach(s => {
      const d = s.queued_at.slice(0, 10);
      if (!smsByDate[d]) smsByDate[d] = { arr: false, dep: false };
      if (s.message_type === "arrival" && (s.status === "sent" || s.status === "delivered")) smsByDate[d].arr = true;
      if (s.message_type === "departure" && (s.status === "sent" || s.status === "delivered")) smsByDate[d].dep = true;
    });

    const rows: HistoryRow[] = Object.entries(byDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 10)
      .map(([dt, v]) => {
        const noExit = !v.dep;
        const ds = smsByDate[dt] ?? { arr: false, dep: false };
        const smsLabel = ds.arr && ds.dep ? "Both" : ds.arr ? "Arrival" : ds.dep ? "Departure" : "—";
        let remark = "Normal";
        let remarkClass = "text-slate-600";
        if (noExit) { remark = "Review open"; remarkClass = "text-orange-600 font-semibold"; }
        else if (v.lateArr) { remark = "Late noted"; remarkClass = "text-amber-600"; }
        return {
          date: new Date(dt + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          arrival: v.arr ?? "—",
          departure: noExit ? "No exit" : (v.dep ?? "—"),
          sms: smsLabel,
          remark,
          departureClass: noExit ? "text-orange-500 font-semibold" : undefined,
          remarkClass,
        };
      });
    setHistory(rows);
  }, [schoolId, pupilId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const primaryGuardian = guardians.find(g => g.is_primary) ?? guardians[0];
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayStatus = history[0]?.date === new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    ? "Present" : "—";

  if (!loading && !pupil) {
    return (
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <p className="text-sm text-slate-500">Pupil not found.</p>
        <button onClick={() => router.push("/dashboard/pupils")} className="btn-secondary text-xs">Back to pupils</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/dashboard/pupils")} className="text-xs text-slate-500 hover:text-slate-700">← Pupils</button>
        <h2 className="text-xl font-bold text-slate-900">
          {pupil ? fullName(pupil.first_name, pupil.last_name) : "Loading…"}
        </h2>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* ── Figure 6: Pupil history and profile panel ──── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-base">👤</span>
          Pupil history and profile
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left: Profile card */}
          <div className="border-b border-slate-100 p-5 lg:border-b-0 lg:border-r lg:w-52 shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-2xl mb-3">👤</div>
            <div className="text-base font-bold text-slate-900">
              {pupil ? fullName(pupil.first_name, pupil.last_name) : "—"}
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="text-slate-500">Class: <span className="font-medium text-slate-800">{pupil?.class_name ?? "—"}</span></div>
              <div className="text-slate-500">Adm No.: <span className="font-medium text-slate-800">{pupil?.admission_number ?? "—"}</span></div>
              <div className="text-slate-500">Parent: <span className="font-medium text-slate-800">{primaryGuardian?.phone_number ?? "—"}</span></div>
              <div className="mt-2 flex items-center gap-1.5 text-slate-500">
                Status today:
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                  todayStatus === "Present" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {todayStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Attendance history table — Date/Arrival/Departure/SMS/Remark */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Arrival</th>
                  <th className="px-4 py-3 font-medium">Departure</th>
                  <th className="px-4 py-3 font-medium">SMS</th>
                  <th className="px-4 py-3 font-medium">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No attendance history</td></tr>
                )}
                {history.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.date}</td>
                    <td className="px-4 py-3 text-slate-700">{row.arrival}</td>
                    <td className={cn("px-4 py-3", row.departureClass ?? "text-slate-700")}>{row.departure}</td>
                    <td className="px-4 py-3 text-slate-600">{row.sms}</td>
                    <td className={cn("px-4 py-3", row.remarkClass ?? "text-slate-600")}>{row.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Guardians */}
      {guardians.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Guardians</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {guardians.map(g => (
              <div key={g.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{g.full_name}</span>
                  {g.is_primary && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Primary</span>}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">{g.relationship ?? "Guardian"} · {g.phone_number}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SMS message log */}
      {sms.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">Message log</div>
          <div className="divide-y divide-slate-100">
            {sms.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                    SMS_STATUS_STYLES[m.status] ?? "bg-slate-100 text-slate-500")}>
                    {m.status}
                  </span>
                  <span className="text-sm capitalize text-slate-700">{m.message_type}</span>
                </div>
                <span className="text-xs text-slate-400">{formatTime(m.queued_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-ups */}
      {followups.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">Follow-ups</div>
          <div className="divide-y divide-slate-100">
            {followups.map(f => (
              <div key={f.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium capitalize text-slate-900">{f.exception_type.replace(/_/g, " ")}</div>
                  <div className="text-xs text-slate-500">{f.reason ?? "—"}</div>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                  f.status === "open" ? "bg-red-100 text-red-700" :
                  f.status === "closed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
