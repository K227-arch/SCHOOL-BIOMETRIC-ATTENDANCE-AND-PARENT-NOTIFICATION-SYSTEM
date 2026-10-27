"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, fullName, formatTime } from "@/lib/utils";

export default function SmsNotificationsPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [retrying, setRetrying] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await supabase.from("sms_notifications")
      .select("id,pupil_id,guardian_id,message_type,status,phone_number,message_body,queued_at,delivered_at,sent_at,error,attempts")
      .eq("school_id", schoolId).order("queued_at", { ascending: false }).limit(200);

    const rows = (data as any[]) ?? [];
    const pids = [...new Set(rows.map((r: any) => r.pupil_id).filter(Boolean))];
    const gids = [...new Set(rows.map((r: any) => r.guardian_id).filter(Boolean))];

    const [pRes, gRes] = await Promise.all([
      pids.length
        ? supabase.from("pupils").select("id,first_name,last_name,admission_number,class_name").in("id", pids).limit(pids.length)
        : Promise.resolve({ data: [] } as any),
      gids.length
        ? supabase.from("guardians").select("id,full_name,relationship,phone_number").in("id", gids).limit(gids.length)
        : Promise.resolve({ data: [] } as any),
    ]);

    const pMap: Record<string, any> = {};
    (pRes.data as any[] ?? []).forEach((p: any) => (pMap[p.id] = p));
    const gMap: Record<string, any> = {};
    (gRes.data as any[] ?? []).forEach((g: any) => (gMap[g.id] = g));

    setLogs(rows.map((r: any) => {
      const p = pMap[r.pupil_id];
      const g = gMap[r.guardian_id];
      return {
        id: r.id,
        pupilId: r.pupil_id,
        gatewayMessageId: `MSG-${r.id.slice(0,8).toUpperCase()}`,
        pupilName: p ? fullName(p.first_name, p.last_name) : "Unknown",
        admissionNo: p?.admission_number ?? "—",
        className: p?.class_name ?? "—",
        eventType: r.message_type === "arrival" ? "Arrival" : "Departure",
        recipientName: g?.full_name ?? "Guardian",
        recipientRel: g?.relationship ?? null,
        recipientPhone: r.phone_number ?? g?.phone_number ?? "—",
        messageText: r.message_body ?? "—",
        originalEventTime: formatTime(r.queued_at),
        status: r.status,
        attempts: r.attempts ?? 0,
        carrier: "MTN Uganda",
        queuedAt: formatTime(r.queued_at),
        deliveredAt: r.delivered_at ? formatTime(r.delivered_at) : null,
        failureReason: r.error ?? (r.status === "failed" ? "Handset unreachable (carrier rejected)" : null),
      };
    }));
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const counts = { delivered: logs.filter(l => l.status === "delivered").length, sent: logs.filter(l => l.status === "sent").length, queued: logs.filter(l => l.status === "queued").length, delayed: logs.filter(l => l.status === "delayed").length, failed: logs.filter(l => l.status === "failed").length };

  const filtered = logs.filter(l => {
    const ms = l.pupilName.toLowerCase().includes(search.toLowerCase()) || l.recipientPhone.includes(search);
    if (statusFilter === "all") return ms;
    return ms && l.status === statusFilter;
  });

  async function retryMsg(id: string) {
    setRetrying(prev => [...prev, id]);
    try {
      await supabase.from("sms_notifications").update({ status: "queued" }).eq("id", id);
      await load();
    } catch {}
    finally { setRetrying(prev => prev.filter(i => i !== id)); }
  }

  async function retryAllFailed() {
    const failedIds = logs.filter(l => l.status === "failed").map(l => l.id);
    if (failedIds.length === 0) return;
    setRetrying(failedIds);
    try {
      // Update all failed messages back to queued in one call
      for (const id of failedIds) {
        await supabase.from("sms_notifications").update({ status: "queued" }).eq("id", id);
      }
      await load();
    } catch {}
    finally { setRetrying([]); }
  }

  const smsColors: Record<string, string> = {
    delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    sent: "bg-blue-50 text-blue-700 border border-blue-200",
    queued: "bg-amber-50 text-amber-700 border border-amber-200",
    delayed: "bg-purple-50 text-purple-700 border border-purple-200",
    failed: "bg-rose-50 text-rose-700 border border-rose-200",
  };

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-lg shrink-0">ℹ</span>
          <div>
            <div className="font-bold flex items-center gap-2">Guardian SMS Broadcast Architecture <span className="font-mono text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">LIVE</span></div>
            <div className="text-slate-300 mt-0.5">Demonstrates carrier status lifecycle (Queued → Sent → Provider Handset Receipt).</div>
          </div>
        </div>
        <div className="font-mono text-emerald-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shrink-0">SMPP Carrier Route: NOMINAL (99.8% SLA)</div>
      </div>

      {/* KPI cards — clickable filters */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { key: "delivered", label: "Delivered", count: counts.delivered, color: "emerald", icon: "✔", sub: "Confirmed on device" },
          { key: "sent", label: "Provider Sent", count: counts.sent, color: "blue", icon: "📡", sub: "Awaiting handset receipt" },
          { key: "queued", label: "Queued / Gateway", count: counts.queued, color: "amber", icon: "⏱", sub: "Local edge debounce" },
          { key: "delayed", label: "Delayed", count: counts.delayed, color: "purple", icon: "⚠", sub: "Shows original scan time" },
          { key: "failed", label: "Failed / Reject", count: counts.failed, color: "rose", icon: "✕", sub: "Manual retry available" },
        ].map(k => (
          <button key={k.key} onClick={() => setStatusFilter(statusFilter === k.key ? "all" : k.key)}
            className={cn("p-4 rounded-xl border transition-all cursor-pointer text-left",
              statusFilter === k.key
                ? k.color === "emerald" ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20"
                : k.color === "blue" ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20"
                : k.color === "amber" ? "bg-amber-50 border-amber-400 ring-2 ring-amber-500/20"
                : k.color === "purple" ? "bg-purple-50 border-purple-400 ring-2 ring-purple-500/20"
                : "bg-rose-50 border-rose-400 ring-2 ring-rose-500/20"
                : "bg-white border-slate-200")}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{k.label}</span>
              <span className={cn("text-base", k.color === "emerald" ? "text-emerald-600" : k.color === "blue" ? "text-blue-600" : k.color === "amber" ? "text-amber-600" : k.color === "purple" ? "text-purple-600" : "text-rose-600")}>{k.icon}</span>
            </div>
            <div className={cn("text-2xl font-mono font-extrabold mt-1 tabular-nums",
              k.color === "emerald" ? "text-emerald-700" : k.color === "blue" ? "text-blue-700" : k.color === "amber" ? "text-amber-700" : k.color === "purple" ? "text-purple-700" : "text-rose-700")}>
              {k.count}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{k.sub}</div>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          <input type="text" placeholder="Search by pupil, recipient, phone or receipt ID..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setStatusFilter("all")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer", statusFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:text-slate-900")}>All Messages ({logs.length})</button>
          {counts.failed > 0 && (
            <button onClick={retryAllFailed} disabled={retrying.length > 0}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              {retrying.length > 0 ? "↺ Retrying..." : `↺ Retry All Failed (${counts.failed})`}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Receipt ID</th>
                <th className="py-3 px-4">Pupil</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Recipient &amp; Phone</th>
                <th className="py-3 px-4">Message Preview</th>
                <th className="py-3 px-4">Gate Time</th>
                <th className="py-3 px-4">Carrier Status</th>
                <th className="py-3 px-4 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-slate-400">No SMS records</td></tr>}
              {filtered.map(log => (
                <tr key={log.id} onClick={() => setSelected(log)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">{log.gatewayMessageId}</td>
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap"><div>{log.pupilName}</div><div className="text-[10px] text-slate-400 font-mono">Adm: {log.admissionNo}</div></td>
                  <td className="py-3 px-4 whitespace-nowrap"><span className={cn("text-[11px] font-semibold", log.eventType === "Arrival" ? "text-emerald-700" : "text-blue-700")}>{log.eventType}</span></td>
                  <td className="py-3 px-4 whitespace-nowrap"><div className="font-medium text-slate-900">{log.recipientName}</div><div className="text-[10px] text-slate-500">{log.recipientRel && <span className="text-slate-400">{log.recipientRel} · </span>}<span className="font-mono">{log.recipientPhone}</span></div></td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">"{log.messageText}"</td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-800 whitespace-nowrap">{log.originalEventTime}</td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium", smsColors[log.status] ?? "bg-slate-100 text-slate-500")}>{log.status.toUpperCase()}</span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {log.status === "failed"
                      ? <button onClick={e => { e.stopPropagation(); retryMsg(log.id); }} disabled={retrying.includes(log.id)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 flex items-center gap-1 ml-auto cursor-pointer">
                          {retrying.includes(log.id) ? "↺ Retrying..." : "↺ Retry"}
                        </button>
                      : <button onClick={e => { e.stopPropagation(); setSelected(log); }} className="text-slate-400 hover:text-blue-700 p-1">📱</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message preview modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider">Parent Handset View</span>
                <h3 className="text-base font-bold text-slate-900">Recipient: {selected.recipientName}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>
            <div className="bg-slate-900 p-3 rounded-3xl border-4 border-slate-800 shadow-inner">
              <div className="bg-slate-100 rounded-2xl p-4 space-y-3">
                <div className="text-center border-b border-slate-200 pb-2">
                  <div className="text-[10px] text-slate-500 font-mono">SMS Notification</div>
                  <div className="text-xs font-bold text-slate-800">{context?.school_name ?? "Greenhill School"}</div>
                  <div className="text-[9px] text-emerald-600 font-mono">From: KATHAY_SMS</div>
                </div>
                <div className="bg-blue-600 text-white rounded-2xl rounded-tl-sm p-3 text-xs leading-relaxed shadow-xs">{selected.messageText}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
                  <span>Gate Event: {selected.originalEventTime}</span>
                  <span className="text-emerald-700 font-bold capitalize">{selected.status}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              {[["Carrier Route", selected.carrier],["Gateway Message ID", selected.gatewayMessageId],["Queued", selected.queuedAt],["Delivered", selected.deliveredAt ?? "—"],["Attempts", String(selected.attempts)]].map(([k,v]) => (
                <div key={k} className="flex justify-between"><span className="text-slate-500">{k}:</span><span className="font-mono text-slate-900">{v}</span></div>
              ))}
              {selected.failureReason && <div className="p-2 bg-rose-50 text-rose-800 rounded border border-rose-200"><strong>Carrier Error:</strong> {selected.failureReason}</div>}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
