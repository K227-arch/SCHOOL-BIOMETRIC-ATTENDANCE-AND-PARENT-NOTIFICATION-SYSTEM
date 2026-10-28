"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, fullName, formatTime } from "@/lib/utils";

export default function LiveAttendancePage() {
  const { context, user, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [logs, setLogs] = useState<any[]>([]);
  const [pupils, setPupils] = useState<any[]>([]);
  const [gates, setGates] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dirFilter, setDirFilter] = useState<"all" | "inbound" | "outbound">("all");
  const [selected, setSelected] = useState<any | null>(null);

  // Manual scan state
  const [pupilId, setPupilId] = useState("");
  const [gateId, setGateId] = useState("");
  const [eventType, setEventType] = useState<"arrival" | "departure">("arrival");
  const [busy, setBusy] = useState(false);
  const [scanMsg, setScanMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!schoolId) return;
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: evs }, { data: pRows }, { data: gRows }] = await Promise.all([
      supabase.from("attendance_events").select("id,pupil_id,event_type,event_time,result,gate_id,source").eq("school_id", schoolId).gte("event_time", today).order("event_time", { ascending: false }).limit(60),
      supabase.from("pupils").select("id,first_name,last_name,admission_number,class_name").eq("school_id", schoolId).eq("status", "active").order("last_name").limit(400),
      supabase.from("gates").select("id,name,direction").eq("school_id", schoolId).limit(20),
    ]);
    setPupils((pRows as any[]) ?? []);
    setGates((gRows as any[]) ?? []);

    const allEvs = (evs as any[]) ?? [];
    const pids = [...new Set(allEvs.map((e: any) => e.pupil_id))];
    let pMap: Record<string, any> = {};
    if (pids.length) {
      const { data: p2 } = await supabase.from("pupils").select("id,first_name,last_name,admission_number,class_name").in("id", pids).limit(pids.length);
      (p2 as any[] ?? []).forEach((p: any) => (pMap[p.id] = p));
    }
    const gMap: Record<string, string> = {};
    (gRows as any[] ?? []).forEach((g: any) => (gMap[g.id] = g.name));

    const evIds = allEvs.map((e: any) => e.id);
    let smsMap: Record<string, string> = {};
    if (evIds.length) {
      const { data: smsRows } = await supabase.from("sms_notifications").select("attendance_event_id,status").in("attendance_event_id", evIds).limit(evIds.length);
      (smsRows as any[] ?? []).forEach((s: any) => (smsMap[s.attendance_event_id] = s.status));
    }

    const today9 = new Date(`${today}T09:15:00Z`);
    setLogs(allEvs.map((e: any) => {
      const p = pMap[e.pupil_id];
      const isLate = e.event_type === "arrival" && new Date(e.event_time) > today9;
      return {
        id: e.id, pupilId: e.pupil_id,
        timestamp: formatTime(e.event_time),
        pupilName: p ? fullName(p.first_name, p.last_name) : "—",
        admissionNo: p?.admission_number ?? "—",
        classGrade: p?.class_name ?? "—",
        direction: e.event_type === "arrival" ? "inbound" : "outbound",
        eventStatus: isLate ? "late" : "normal",
        gateDevice: e.gate_id ? (gMap[e.gate_id] ?? "Main Gate") : "Main Gate",
        credentialType: "fingerprint",
        smsStatus: smsMap[e.id] ?? "queued",
        result: e.result,
      };
    }));
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const filtered = logs.filter(l => {
    const ms = l.pupilName.toLowerCase().includes(search.toLowerCase()) || l.admissionNo.includes(search);
    const md = dirFilter === "all" || l.direction === dirFilter;
    return ms && md;
  });

  async function recordScan(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId || !pupilId) return;
    setBusy(true); setScanMsg(null);
    try {
      const now = new Date().toISOString();
      const since = new Date(Date.now() - 120_000).toISOString();
      const { data: dup } = await supabase.from("attendance_events").select("id").eq("school_id", schoolId).eq("pupil_id", pupilId).eq("event_type", eventType).gte("event_time", since).limit(1);
      const isDup = ((dup as any[])?.length ?? 0) > 0;
      const { error } = await supabase.from("attendance_events").insert([{
        school_id: schoolId, pupil_id: pupilId, gate_id: gateId || null,
        event_type: eventType, event_time: now, recorded_time: now,
        result: isDup ? "duplicate_suppressed" : "success", source: "manual", staff_id: user?.id ?? null,
      }]);
      if (error) throw error;
      setScanMsg({ type: "ok", text: isDup ? "Duplicate scan suppressed." : `${eventType === "arrival" ? "Arrival" : "Departure"} recorded.` });
      setPupilId(""); await load();
    } catch (err) { setScanMsg({ type: "err", text: err instanceof Error ? err.message : "Error" }); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {/* Scan form + filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Manual scan */}
          <form onSubmit={recordScan} className="flex flex-wrap items-end gap-3 flex-1">
            <div>
              <label className="label">Event</label>
              <div className="flex p-1 bg-slate-100 rounded-lg gap-1 text-xs font-medium">
                {(["arrival","departure"] as const).map(t => (
                  <button type="button" key={t} onClick={() => setEventType(t)}
                    className={cn("px-3 py-1.5 rounded-md transition-all capitalize cursor-pointer", eventType === t ? "bg-white text-slate-900 shadow-xs" : "text-slate-600")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="label">Pupil</label>
              <select className="input" required value={pupilId} onChange={e => setPupilId(e.target.value)}>
                <option value="">Select pupil…</option>
                {pupils.map(p => <option key={p.id} value={p.id}>{fullName(p.first_name, p.last_name)} · {p.admission_number}</option>)}
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="label">Gate</label>
              <select className="input" value={gateId} onChange={e => setGateId(e.target.value)}>
                <option value="">— Any gate —</option>
                {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <button type="submit" disabled={busy || !pupilId} className="btn-primary">
                {busy ? "Recording…" : `Record ${eventType}`}
              </button>
            </div>
          </form>

          {/* Direction filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium self-end">
            {(["all","inbound","outbound"] as const).map(d => (
              <button key={d} onClick={() => setDirFilter(d)}
                className={cn("px-2.5 py-1 rounded-md transition-all capitalize cursor-pointer",
                  dirFilter === d ? (d === "inbound" ? "bg-white text-emerald-700 shadow-xs" : d === "outbound" ? "bg-white text-blue-700 shadow-xs" : "bg-white text-slate-900 shadow-xs") : "text-slate-600")}>
                {d === "all" ? "All Events" : d === "inbound" ? "Arrivals" : "Departures"}
              </button>
            ))}
          </div>

          <div className="relative self-end">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            <input type="text" placeholder="Search pupil or admission no…" value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-8 w-full sm:w-56" />
          </div>
        </div>

        {scanMsg && <div className={cn("text-xs px-3 py-2 rounded-lg", scanMsg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{scanMsg.text}</div>}

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Showing <strong className="text-slate-800 font-mono">{filtered.length}</strong> recorded events today</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Inbound Entry</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Outbound Exit</span>
          </div>
        </div>
      </div>

      {/* Events table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Event Time</th>
                <th className="py-3 px-4">Pupil &amp; Admission</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Direction &amp; Status</th>
                <th className="py-3 px-4">Gate / Terminal</th>
                <th className="py-3 px-4">Credential</th>
                <th className="py-3 px-4">Guardian SMS</th>
                <th className="py-3 px-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-slate-400">No events yet today</td></tr>}
              {filtered.map(log => (
                <tr key={log.id} onClick={() => setSelected(log)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 tabular-nums whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-[11px] shrink-0">{log.pupilName[0]}</div>
                      <div>
                        <div className="font-semibold group-hover:text-blue-700 transition-colors">{log.pupilName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Adm: {log.admissionNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono">{log.classGrade}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {log.direction === "inbound"
                        ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">✔ Arrival</span>
                        : <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">→ Departure</span>}
                      {log.eventStatus === "late" && <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">Late</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{log.gateDevice}</td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">👆 Fingerprint</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] font-mono",
                      log.smsStatus === "delivered" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      log.smsStatus === "sent" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                      log.smsStatus === "failed" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200")}>
                      {log.smsStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded",
                      log.result === "success" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                      {log.result?.replace(/_/g," ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Turnstile Raw Event Record</span>
                  <h3 className="text-lg font-bold text-slate-900">{selected.pupilName}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">✕</button>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                {[["Admission Number", selected.admissionNo],["Class", selected.classGrade],["Direction", selected.direction],["Time", selected.timestamp],["Gate", selected.gateDevice],["Credential", selected.credentialType],["Result", selected.result],["SMS Status", selected.smsStatus]].map(([k,v]) => (
                  <div key={k} className="flex justify-between"><span className="text-slate-500">{k}:</span><span className="font-mono font-bold text-slate-900">{v}</span></div>
                ))}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="mt-4 w-full py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
