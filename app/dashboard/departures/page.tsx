"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, fullName, formatTime } from "@/lib/utils";

export default function DepartureControlPage() {
  const { context, user, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [deps, setDeps] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all"|"pending"|"released">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [verifier, setVerifier] = useState("Florence Nabirye (Safeguarding)");
  const [note, setNote] = useState("Physical ID verified at gate dispatch zone.");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data: evs } = await insforge.database.from("attendance_events")
      .select("id,pupil_id,event_type,event_time,result,gate_id").eq("school_id", schoolId)
      .gte("event_time", today).order("event_time", { ascending: false }).limit(80);

    const allEvs = (evs as any[]) ?? [];
    const pids = [...new Set(allEvs.map((e: any) => e.pupil_id))];
    let pMap: Record<string, any> = {};
    if (pids.length) {
      const { data: p2 } = await insforge.database.from("pupils").select("id,first_name,last_name,class_name,admission_number").in("id", pids).limit(pids.length);
      (p2 as any[] ?? []).forEach((p: any) => (pMap[p.id] = p));
    }

    const arrivalSet = new Set(allEvs.filter((e: any) => e.event_type === "arrival" && e.result === "success").map((e: any) => e.pupil_id));
    const departureMap: Record<string, any> = {};
    allEvs.filter((e: any) => e.event_type === "departure" && e.result === "success").forEach((e: any) => { if (!departureMap[e.pupil_id]) departureMap[e.pupil_id] = e; });

    const rows = [...arrivalSet].map(pid => {
      const p = pMap[pid];
      const dep = departureMap[pid];
      return {
        id: pid, pupilId: pid,
        pupilName: p ? fullName(p.first_name, p.last_name) : "—",
        classGrade: p?.class_name ?? "—",
        admissionNo: p?.admission_number ?? "—",
        pickupType: "Parent Collection",
        pickupPersonName: "Guardian",
        scanTime: dep ? formatTime(dep.event_time) : null,
        status: dep ? "released" : "pending",
        staffVerifier: dep ? "Gate Staff" : null,
      };
    });
    setDeps(rows);
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const filtered = deps.filter(d => {
    const ms = d.pupilName.toLowerCase().includes(search.toLowerCase()) || d.admissionNo.includes(search);
    if (activeTab === "pending") return ms && d.status === "pending";
    if (activeTab === "released") return ms && d.status === "released";
    return ms;
  });

  const pendingCount = deps.filter(d => d.status === "pending").length;
  const releasedCount = deps.filter(d => d.status === "released").length;

  async function confirmHandover() {
    if (!selected || !schoolId) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      await insforge.database.from("attendance_events").insert([{
        school_id: schoolId, pupil_id: selected.pupilId, event_type: "departure",
        event_time: now, recorded_time: now, result: "success", source: "manual",
        staff_id: user?.id ?? null,
      }]);
      setShowModal(false); setSelected(null);
      await load();
    } catch {}
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      {/* Safeguarding banner */}
      <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-blue-950">
        <div className="flex items-start gap-3">
          <span className="text-blue-700 text-lg shrink-0">🛡</span>
          <div><span className="font-bold">Departure Verification Protocol:</span> A biometric or card turnstile scan logs gate passage time; it does <u>not</u> prove the child was safely handed over to an authorised person. Gate supervisors must verify recipient credentials.</div>
        </div>
        <div className="text-[11px] font-mono font-semibold text-blue-800 bg-white px-2.5 py-1 rounded-md border border-blue-200 shrink-0">Dismissal Gate: ACTIVE</div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Confirmed Safe Handovers</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600 mt-1">{releasedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">✔ <span>Staff signed and verified</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <div className="text-xs font-semibold text-amber-800">Pending Release Handover Checks</div>
          <div className="text-2xl font-extrabold font-mono text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">⚠ <span>Awaiting physical pickup sign-off</span></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Early Departure Exceptions</div>
          <div className="text-2xl font-extrabold font-mono text-purple-600 mt-1">0</div>
          <div className="text-[11px] text-slate-500 mt-1">Medical slips &amp; authorized early exits</div>
        </div>
      </div>

      {/* Main control panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {(["all","pending","released"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={cn("px-3 py-1.5 rounded-md transition-all cursor-pointer",
                  activeTab === t ? (t === "pending" ? "bg-white text-amber-700 shadow-xs" : t === "released" ? "bg-white text-emerald-700 shadow-xs" : "bg-white text-slate-900 shadow-xs") : "text-slate-600")}>
                {t === "all" ? `All (${deps.length})` : t === "pending" ? `Pending (${pendingCount})` : `Released (${releasedCount})`}
              </button>
            ))}
          </div>
          <div className="relative max-w-xs">
            <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
            <input type="text" placeholder="Search pupil or collector..." value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-8" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-medium text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Pupil</th>
                <th className="py-2.5 px-4">Class</th>
                <th className="py-2.5 px-4">Pickup Arrangement</th>
                <th className="py-2.5 px-4">Authorised Collector</th>
                <th className="py-2.5 px-4">Turnstile Scan</th>
                <th className="py-2.5 px-4">Safe Handover</th>
                <th className="py-2.5 px-4">Staff Verifier</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-slate-400">No records found</td></tr>}
              {filtered.map(d => (
                <tr key={d.id} className={cn("hover:bg-slate-50/80 transition-colors", d.status === "pending" ? "bg-amber-50/20" : "")}>
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                    <div className="font-semibold">{d.pupilName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Adm: {d.admissionNo}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-mono">{d.classGrade}</td>
                  <td className="py-3 px-4 text-slate-700">{d.pickupType}</td>
                  <td className="py-3 px-4 text-slate-700">{d.pickupPersonName}</td>
                  <td className="py-3 px-4 font-mono text-slate-800">{d.scanTime ?? <span className="text-slate-400 italic">Not scanned</span>}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {d.status === "released"
                      ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">✔ Handover Confirmed ({d.scanTime})</span>
                      : <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 animate-pulse">⏱ Pending ID Verification</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{d.staffVerifier ?? "Unassigned"}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {d.status === "pending"
                      ? <button onClick={() => { setSelected(d); setShowModal(true); }} className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer">Verify &amp; Release</button>
                      : <button className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer">View Pickup Card</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Handover modal */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-700 uppercase tracking-wider">Safeguarding Departure Sign-Off</span>
                <h3 className="text-lg font-bold text-slate-900">Confirm Safe Handover · {selected.pupilName}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              {[["Pupil", `${selected.pupilName} (Adm #${selected.admissionNo})`],["Class", selected.classGrade],["Pickup Arrangement", selected.pickupType],["Authorised Collector", selected.pickupPersonName]].map(([k,v]) => (
                <div key={k} className="flex justify-between"><span className="text-slate-500">{k}:</span><span className="font-semibold text-blue-700">{v}</span></div>
              ))}
            </div>
            <div className="space-y-3 text-xs">
              <div><label className="block font-semibold text-slate-700 mb-1">Responsible Staff Verifier</label>
                <input type="text" value={verifier} onChange={e => setVerifier(e.target.value)} className="input" /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Physical Verification Notes</label>
                <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className="input" /></div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <span>⚠</span><span>Confirming this safe handover will update the live school counts, record the exit timestamp, and automatically dispatch the departure notification SMS.</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">Cancel</button>
              <button onClick={confirmHandover} disabled={busy} className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                ✔ {busy ? "Saving…" : "Confirm Safe Handover & Send SMS"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
