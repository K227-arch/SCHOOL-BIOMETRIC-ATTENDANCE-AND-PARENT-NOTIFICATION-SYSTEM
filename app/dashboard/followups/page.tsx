"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, fullName, formatTime } from "@/lib/utils";

export default function FollowUpQueuePage() {
  const { context, user, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [cases, setCases] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all"|"open"|"in_progress"|"closed">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [showRes, setShowRes] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await supabase.from("follow_ups")
      .select("id,pupil_id,exception_type,status,reason,created_at,created_by").eq("school_id", schoolId)
      .order("created_at", { ascending: false }).limit(100);

    const rows = (data as any[]) ?? [];
    const pids = [...new Set(rows.map((r: any) => r.pupil_id))];
    let pMap: Record<string, any> = {};
    if (pids.length) {
      const { data: p2 } = await supabase.from("pupils").select("id,first_name,last_name,admission_number,class_name").in("id", pids).limit(pids.length);
      (p2 as any[] ?? []).forEach((p: any) => (pMap[p.id] = p));
    }
    setCases(rows.map((r: any, i: number) => {
      const p = pMap[r.pupil_id];
      return {
        id: r.id, pupilId: r.pupil_id,
        caseNumber: `EXC-${String(i+1).padStart(3,"0")}`,
        pupilName: p ? fullName(p.first_name, p.last_name) : "—",
        admissionNo: p?.admission_number ?? "—",
        classGrade: p?.class_name ?? "—",
        type: r.exception_type?.replace(/_/g," ") ?? "Unknown",
        priority: r.exception_type === "missing_scan" ? "urgent" : "high",
        status: r.status,
        assignedStaff: "Florence Nabirye (Safeguarding)",
        contactAttempts: 0,
        createdAt: formatTime(r.created_at),
        notes: [{ author: "System", timestamp: formatTime(r.created_at), text: r.reason ?? "Auto-generated exception." }],
        resolutionSummary: "",
        resolvedAt: null,
      };
    }));
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const counts = { open: cases.filter(c => c.status === "open").length, in_progress: cases.filter(c => c.status === "in_progress").length, closed: cases.filter(c => c.status === "closed").length };
  const filtered = cases.filter(c => {
    const ms = c.pupilName.toLowerCase().includes(search.toLowerCase()) || c.caseNumber.includes(search);
    if (activeTab === "all") return ms;
    return ms && c.status === activeTab;
  });

  async function resolveCase() {
    if (!selected || !resolution.trim()) return;
    setBusy(true);
    try {
      await supabase.from("follow_ups").update({ status: "closed", reason: resolution }).eq("id", selected.id);
      setShowRes(false); setSelected(null); await load();
    } catch {}
    finally { setBusy(false); }
  }

  const priorityColor = (p: string) => p === "urgent" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200";
  const statusColor = (s: string) => s === "open" ? "text-rose-700 bg-rose-50" : s === "in_progress" ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50";

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <span className="text-amber-600 text-lg shrink-0">⚠</span>
          <div>
            <div className="font-bold text-slate-900">Child Safeguarding Exception Management &amp; Non-Silent Resolution</div>
            <div className="text-slate-500 mt-0.5">Every missing scan, failed SMS, or unapproved early departure generates an explicit investigation case. Records must never be silently overwritten.</div>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
          <span>Active Cases:</span><strong className="text-amber-700">{counts.open + counts.in_progress}</strong>
        </div>
      </div>

      {/* Tabs & search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {([["all","All",cases.length],["open","Open",counts.open],["in_progress","In Progress",counts.in_progress],["closed","Closed",counts.closed]] as [string,string,number][]).map(([key,label,count]) => (
              <button key={key} onClick={() => setActiveTab(key as any)}
                className={cn("px-3 py-1.5 rounded-md transition-all cursor-pointer",
                  activeTab === key ? (key === "open" ? "bg-white text-rose-700 shadow-xs" : key === "in_progress" ? "bg-white text-amber-700 shadow-xs" : key === "closed" ? "bg-white text-emerald-700 shadow-xs" : "bg-white text-slate-900 shadow-xs") : "text-slate-600")}>
                {label} ({count})
              </button>
            ))}
          </div>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            <input type="text" placeholder="Search case #, pupil, exception type..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-8" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Pupil &amp; Admission</th>
                <th className="py-3 px-4">Exception Type</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4">Contact Tries</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-slate-400">No cases found</td></tr>}
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">{c.caseNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap"><div className="font-semibold">{c.pupilName}</div><div className="text-[10px] text-slate-400 font-mono">Adm: #{c.admissionNo} · {c.classGrade}</div></td>
                  <td className="py-3 px-4 whitespace-nowrap"><span className="font-medium text-slate-800 capitalize">{c.type}</span></td>
                  <td className="py-3 px-4 whitespace-nowrap"><span className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-bold", priorityColor(c.priority))}>{c.priority.toUpperCase()}</span></td>
                  <td className="py-3 px-4 whitespace-nowrap"><span className={cn("inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md", statusColor(c.status))}>{c.status.replace(/_/g," ").toUpperCase()}</span></td>
                  <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.assignedStaff}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{c.contactAttempts} attempt(s)</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button onClick={e => { e.stopPropagation(); setSelected(c); }} className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer">Investigate →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investigation drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2"><span className="font-mono text-xs font-bold text-slate-400">{selected.caseNumber}</span><span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", priorityColor(selected.priority))}>{selected.priority.toUpperCase()}</span></div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 capitalize">{selected.type} · {selected.pupilName}</h3>
                </div>
                <button onClick={() => { setSelected(null); setShowRes(false); }} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">✕</button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                {[["Pupil", `${selected.pupilName} (Adm #${selected.admissionNo})`],["Class", selected.classGrade],["Time Flagged", selected.createdAt],["Assigned Case Lead", selected.assignedStaff],["Contact Attempts", `${selected.contactAttempts} call(s)`]].map(([k,v]) => (
                  <div key={k} className="flex justify-between"><span className="text-slate-500">{k}:</span><span className="font-semibold text-blue-700">{v}</span></div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Case Investigation Notes</h4>
                <div className="space-y-2 text-xs">
                  {selected.notes.map((n: any, i: number) => (
                    <div key={i} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-[11px]"><span className="font-bold text-slate-800">{n.author}</span><span className="font-mono text-slate-400">{n.timestamp}</span></div>
                      <p className="text-slate-600 leading-relaxed">{n.text}</p>
                    </div>
                  ))}
                </div>
                {selected.status !== "closed" && (
                  <div className="flex gap-2 pt-1">
                    <input type="text" placeholder="Add investigation update / guardian statement..." value={note} onChange={e => setNote(e.target.value)} className="flex-1 input" />
                    <button className="btn-primary">✈ Post</button>
                  </div>
                )}
              </div>

              {selected.status === "closed" && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5 text-emerald-950">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">✔ Case Formally Closed &amp; Archived</div>
                  <div className="text-emerald-900 leading-relaxed">{selected.resolutionSummary || "Resolved."}</div>
                </div>
              )}

              {showRes && selected.status !== "closed" && (
                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3 text-xs">
                  <div className="font-bold text-blue-950">Formal Resolution Statement &amp; Audit Justification</div>
                  <textarea rows={3} placeholder="Provide full factual explanation..." value={resolution} onChange={e => setResolution(e.target.value)} className="w-full input" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowRes(false)} className="px-3 py-1.5 text-slate-600 hover:bg-slate-200/60 rounded-md text-xs">Cancel</button>
                    <button onClick={resolveCase} disabled={busy} className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 flex items-center gap-1 text-xs disabled:opacity-50">✔ Confirm Resolution</button>
                  </div>
                </div>
              )}
            </div>

            {selected.status !== "closed" && !showRes && (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button className="px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 cursor-pointer">Escalate to Head Teacher</button>
                <button onClick={() => setShowRes(true)} className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer">✔ Resolve &amp; Log Audit</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
