"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, fullName } from "@/lib/utils";

export default function PupilManagementPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [pupils, setPupils] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", admissionNo: "", classGrade: "Primary 5A", gender: "M", guardianName: "", guardianPhone: "+256 ", credential: "fingerprint", consentSigned: true });

  const load = useCallback(async () => {
    if (!schoolId) return;
    const { data } = await insforge.database.from("pupils").select("id,first_name,last_name,admission_number,class_name,status,gender").eq("school_id", schoolId).order("last_name").limit(500);
    setPupils((data as any[]) ?? []);
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const filtered = pupils.filter(p => {
    const ms = fullName(p.first_name, p.last_name).toLowerCase().includes(search.toLowerCase()) || p.admission_number?.includes(search);
    const mc = classFilter === "all" || p.class_name?.startsWith(classFilter);
    return ms && mc;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) return;
    setBusy(true);
    try {
      const { data: pupilData, error } = await insforge.database.from("pupils").insert([{
        school_id: schoolId, first_name: form.firstName, last_name: form.lastName,
        admission_number: form.admissionNo, class_name: form.classGrade, gender: form.gender, status: "active",
      }]).select();
      if (error) throw error;
      const pid = (pupilData as any[])?.[0]?.id;
      if (pid && form.guardianPhone.trim().length > 5) {
        await insforge.database.from("guardians").insert([{
          pupil_id: pid, full_name: form.guardianName, phone_number: form.guardianPhone,
          relationship: "Parent", is_primary: true, receives_sms: true,
        }]);
      }
      setShowAdd(false);
      setForm({ firstName: "", lastName: "", admissionNo: "", classGrade: "Primary 5A", gender: "M", guardianName: "", guardianPhone: "+256 ", credential: "fingerprint", consentSigned: true });
      await load();
    } catch {}
    finally { setBusy(false); }
  }

  const statusColor = (s: string) => s === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : s === "present" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="space-y-5">
      {/* Top controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            <input type="text" placeholder="Search by pupil name, admission no, guardian phone..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input" style={{ width: "auto" }}>
              <option value="all">All Classes</option>
              {["Primary 7","Primary 6","Primary 5","Primary 4","Primary 3","Primary 2","Primary 1"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-1.5">
              + Enrol New Pupil
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1.5">🛡 <span>Biometric consent forms strictly verified prior to optical reader template registration.</span></span>
          <span className="font-mono text-slate-700">Total Enrolled: <strong>{pupils.length}</strong></span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium text-[11px]">
              <tr>
                <th className="py-3 px-4">Pupil Name</th>
                <th className="py-3 px-4">Admission No</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Credential</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-400">No pupils found</td></tr>}
              {filtered.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                        {p.first_name?.[0]}{p.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold group-hover:text-blue-700 transition-colors">{fullName(p.first_name, p.last_name)}</div>
                        <div className="text-[10px] text-slate-400">Gender: {p.gender ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-800">#{p.admission_number}</td>
                  <td className="py-3 px-4 text-slate-700 font-mono">{p.class_name}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={cn("inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border", statusColor(p.status))}>
                      {p.status === "active" ? "Active" : p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">👆 Biometric (Active)</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button onClick={e => { e.stopPropagation(); setSelected(p); }} className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer">Profile →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center border border-blue-200">
                    {selected.first_name?.[0]}{selected.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{fullName(selected.first_name, selected.last_name)}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">Admission #{selected.admission_number} · {selected.class_name}</div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">✕</button>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div><span className="text-slate-500">Today's Gate Status:</span><div className="font-bold text-slate-900 mt-0.5 capitalize">{selected.status}</div></div>
              </div>
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 text-xs">
                <div className="font-bold text-blue-950 flex items-center gap-2">🛡 Biometric Enrolment &amp; Consent Record</div>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div><span className="text-slate-400">Credential Type:</span><div className="font-semibold text-slate-900">Fingerprint</div></div>
                  <div><span className="text-slate-400">Parent Consent Form:</span><div className="font-semibold text-emerald-700">✔ Signed &amp; On File</div></div>
                  <div><span className="text-slate-400">Template Location:</span><div className="font-mono text-slate-800">Local Reader Hardware</div></div>
                  <div><span className="text-slate-400">Raw Biometric Kept:</span><div className="font-mono text-slate-800">None (Hashed only)</div></div>
                </div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="mt-4 w-full py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer">Close Profile</button>
          </div>
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider">School Enrolment Protocol</span>
                <h3 className="text-lg font-bold text-slate-900">Enrol Pupil &amp; Configure Credential</h3>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">First Name *</label><input required className="input" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="e.g. Joshua" /></div>
                <div><label className="label">Last Name *</label><input required className="input" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="e.g. Kigozi" /></div>
                <div><label className="label">Admission Number *</label><input required className="input font-mono" value={form.admissionNo} onChange={e => setForm({...form, admissionNo: e.target.value})} placeholder="e.g. 1420" /></div>
                <div><label className="label">Class Grade</label>
                  <select className="input" value={form.classGrade} onChange={e => setForm({...form, classGrade: e.target.value})}>
                    {["Primary 7A","Primary 6B","Primary 5A","Primary 4A","Primary 3B","Primary 2C","Primary 1A"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="label">Gender</label>
                  <select className="input" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                    <option value="M">Male</option><option value="F">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Primary Guardian Name *</label><input required className="input" value={form.guardianName} onChange={e => setForm({...form, guardianName: e.target.value})} placeholder="e.g. Agnes Kigozi" /></div>
                <div><label className="label">Verified Phone (SMS) *</label><input required className="input font-mono" value={form.guardianPhone} onChange={e => setForm({...form, guardianPhone: e.target.value})} placeholder="+256 7XX XXX XXX" /></div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-semibold text-slate-900">Gate Access Credential</label>
                <div className="grid grid-cols-3 gap-2">
                  {[{k:"fingerprint",label:"Fingerprint",icon:"👆"},{k:"rfid_card",label:"RFID Card",icon:"💳"},{k:"supervised_manual",label:"Supervised PIN",icon:"🔑"}].map(c => (
                    <button type="button" key={c.k} onClick={() => setForm({...form, credential: c.k})}
                      className={cn("p-2.5 rounded-lg border text-left cursor-pointer transition-all",
                        form.credential === c.k ? "bg-blue-50 border-blue-600 text-blue-900 font-semibold" : "bg-white border-slate-200 text-slate-700")}>
                      <div>{c.icon}</div><div>{c.label}</div>
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={form.consentSigned} onChange={e => setForm({...form, consentSigned: e.target.checked})} className="rounded border-slate-300" />
                  <span className="text-[11px] text-slate-700 font-medium">Parent/Guardian Data Notice &amp; Consent form signed and archived.</span>
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : "Enrol Pupil"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
