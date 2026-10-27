"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, fullName } from "@/lib/utils";

type CredType = "fingerprint" | "rfid" | "manual";

interface Pupil {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_name: string | null;
  gender: string | null;
  status: string;
  credential_type: CredType;
  date_of_birth: string | null;
  enrolled_at: string;
}

interface Guardian {
  id: string;
  pupil_id: string;
  full_name: string;
  relationship: string | null;
  phone_number: string;
  email: string | null;
  is_primary: boolean;
  receives_sms: boolean;
}

const CLASSES = [
  "P.1", "P.2", "P.3", "P.4", "P.5", "P.6", "P.7",
  "Baby Class", "Middle Class", "Top Class",
  "S.1", "S.2", "S.3", "S.4", "S.5", "S.6",
  "Other",
];

const CRED_OPTIONS: { key: CredType; label: string; icon: string }[] = [
  { key: "fingerprint", label: "Fingerprint", icon: "👆" },
  { key: "rfid",        label: "RFID Card",   icon: "💳" },
  { key: "manual",      label: "Manual",      icon: "🔑" },
];

const blank = {
  firstName: "", lastName: "", admissionNo: "", classGrade: "P.1",
  gender: "M", dob: "",
  credential: "fingerprint" as CredType,
  consentSigned: false,
  // guardian 1
  g1Name: "", g1Phone: "+256", g1Rel: "Parent", g1Email: "",
  // guardian 2
  g2Name: "", g2Phone: "", g2Rel: "Guardian",
};

export default function PupilManagementPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const isAdmin = context?.role === "school_admin";

  const [pupils,    setPupils]    = useState<Pupil[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [search,    setSearch]    = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"active"|"all">("active");

  const [selected,  setSelected]  = useState<Pupil | null>(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState({ ...blank });
  const [busy,      setBusy]      = useState(false);
  const [formErr,   setFormErr]   = useState<string | null>(null);
  const [showG2,    setShowG2]    = useState(false);

  // Edit guardian state
  const [editGuardian, setEditGuardian] = useState<Guardian | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    const [{ data: pData }, { data: gData }] = await Promise.all([
      supabase.from("pupils")
        .select("id,first_name,last_name,admission_number,class_name,gender,status,credential_type,date_of_birth,enrolled_at")
        .eq("school_id", schoolId)
        .order("last_name")
        .limit(500),
      supabase.from("guardians")
        .select("id,pupil_id,full_name,relationship,phone_number,email,is_primary,receives_sms")
        .eq("school_id", schoolId)
        .limit(2000),
    ]);
    setPupils((pData as Pupil[]) ?? []);
    setGuardians((gData as Guardian[]) ?? []);
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const selectedGuardians = selected
    ? guardians.filter(g => g.pupil_id === selected.id)
    : [];

  const filtered = pupils.filter(p => {
    const name = fullName(p.first_name, p.last_name).toLowerCase();
    const ms = name.includes(search.toLowerCase()) ||
               (p.admission_number ?? "").toLowerCase().includes(search.toLowerCase());
    const mc = classFilter === "all" || p.class_name === classFilter;
    const mst = statusFilter === "all" || p.status === statusFilter;
    return ms && mc && mst;
  });

  // Unique class list from actual data
  const classOptions = ["all", ...Array.from(new Set(pupils.map(p => p.class_name).filter(Boolean))) as string[]];

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) return;
    if (!form.consentSigned) { setFormErr("Biometric consent must be signed before enrollment."); return; }
    if (!form.g1Name.trim())  { setFormErr("Primary guardian name is required."); return; }
    if (!form.g1Phone.trim() || form.g1Phone.trim().length < 5) { setFormErr("Primary guardian phone number is required."); return; }
    setBusy(true); setFormErr(null);

    try {
      const { data, error } = await supabase.rpc("enroll_pupil", {
        p_school_id:        schoolId,
        p_first_name:       form.firstName.trim(),
        p_last_name:        form.lastName.trim(),
        p_admission_number: form.admissionNo.trim(),
        p_class_name:       form.classGrade,
        p_gender:           form.gender,
        p_date_of_birth:    form.dob || null,
        p_credential_type:  form.credential,
        p_guardian_name:    form.g1Name.trim(),
        p_guardian_phone:   form.g1Phone.trim(),
        p_guardian_rel:     form.g1Rel.trim(),
        p_guardian_email:   form.g1Email.trim() || null,
        p_guardian2_name:   showG2 ? form.g2Name.trim() || null : null,
        p_guardian2_phone:  showG2 ? form.g2Phone.trim() || null : null,
        p_guardian2_rel:    showG2 ? form.g2Rel.trim() || null : null,
      });
      if (error) { setFormErr(error.message); setBusy(false); return; }
      setShowAdd(false);
      setForm({ ...blank });
      setShowG2(false);
      void load();
    } catch (err: any) {
      setFormErr(err?.message ?? "Enrollment failed.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleSms(g: Guardian) {
    await supabase.from("guardians")
      .update({ receives_sms: !g.receives_sms })
      .eq("id", g.id);
    void load();
  }

  async function saveGuardian(e: React.FormEvent) {
    e.preventDefault();
    if (!editGuardian) return;
    setEditBusy(true);
    await supabase.from("guardians")
      .update({
        full_name:    editGuardian.full_name,
        phone_number: editGuardian.phone_number,
        relationship: editGuardian.relationship,
        email:        editGuardian.email,
        receives_sms: editGuardian.receives_sms,
      })
      .eq("id", editGuardian.id);
    setEditBusy(false);
    setEditGuardian(null);
    void load();
  }

  async function deactivatePupil(p: Pupil) {
    await supabase.from("pupils")
      .update({ status: p.status === "active" ? "inactive" : "active" })
      .eq("id", p.id);
    void load();
  }

  const credIcon = (c: CredType) =>
    c === "fingerprint" ? "👆" : c === "rfid" ? "💳" : "🔑";

  return (
    <div className="space-y-5">

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            <input type="text" placeholder="Search name or admission no…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input" style={{ width: "auto" }}>
              {classOptions.map(c => <option key={c} value={c}>{c === "all" ? "All Classes" : c}</option>)}
            </select>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(["active","all"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    statusFilter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                  {s === "active" ? "Active" : "All"}
                </button>
              ))}
            </div>
            {isAdmin && (
              <button onClick={() => { setShowAdd(true); setForm({ ...blank }); setShowG2(false); setFormErr(null); }}
                className="btn-primary flex items-center gap-1.5 shrink-0">
                + Enrol Pupil
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 mt-3 border-t border-slate-100">
          <span>🛡 Biometric consent must be verified before credential registration.</span>
          <span className="font-mono text-slate-700">
            Showing <strong>{filtered.length}</strong> of <strong>{pupils.length}</strong> enrolled
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-medium">
              <tr>
                <th className="py-3 px-4">Pupil</th>
                <th className="py-3 px-4">Admission</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Primary Guardian</th>
                <th className="py-3 px-4">Credential</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                  {pupils.length === 0
                    ? <div className="space-y-2"><div className="text-3xl">🎓</div><p>No pupils enrolled yet.</p>{isAdmin && <button onClick={() => setShowAdd(true)} className="text-blue-600 hover:underline font-medium">Enrol your first pupil →</button>}</div>
                    : "No pupils match your search."}
                </td></tr>
              )}
              {filtered.map(p => {
                const primary = guardians.find(g => g.pupil_id === p.id && g.is_primary);
                return (
                  <tr key={p.id} onClick={() => setSelected(p)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.first_name?.[0]}{p.last_name?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {fullName(p.first_name, p.last_name)}
                          </div>
                          <div className="text-[10px] text-slate-400">{p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : p.gender ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">#{p.admission_number}</td>
                    <td className="py-3 px-4 text-slate-700">{p.class_name ?? "—"}</td>
                    <td className="py-3 px-4">
                      {primary ? (
                        <div>
                          <div className="font-medium text-slate-800">{primary.full_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{primary.phone_number}</div>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-slate-700">
                        {credIcon(p.credential_type)}
                        <span className="capitalize">{p.credential_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                        p.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200")}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", p.status === "active" ? "bg-emerald-500" : "bg-slate-400")} />
                        {p.status === "active" ? "Active" : p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={e => { e.stopPropagation(); setSelected(p); }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pupil Profile Drawer ─────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center border border-blue-200 shrink-0">
                {selected.first_name?.[0]}{selected.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">{fullName(selected.first_name, selected.last_name)}</h3>
                <div className="text-xs text-slate-500">#{selected.admission_number} · {selected.class_name ?? "No class"}</div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0">✕</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Pupil details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: "Gender",      value: selected.gender === "M" ? "Male" : selected.gender === "F" ? "Female" : "—" },
                  { label: "D.O.B.",      value: selected.date_of_birth ?? "—" },
                  { label: "Credential",  value: `${credIcon(selected.credential_type)} ${selected.credential_type}` },
                  { label: "Status",      value: selected.status },
                  { label: "Enrolled",    value: new Date(selected.enrolled_at).toLocaleDateString() },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.label}</div>
                    <div className="font-semibold text-slate-900 mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Guardians */}
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Parents & Guardians</span>
                  <span className="text-[10px] font-normal text-slate-400">{selectedGuardians.length} on record</span>
                </div>
                {selectedGuardians.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No guardians on record.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedGuardians.map(g => (
                      <div key={g.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xs font-bold">
                              {g.full_name?.[0]}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-900">{g.full_name}</div>
                              <div className="text-[10px] text-slate-500">{g.relationship ?? "Guardian"} {g.is_primary && <span className="text-blue-600 font-bold ml-1">· Primary</span>}</div>
                            </div>
                          </div>
                          {isAdmin && (
                            <button onClick={() => setEditGuardian({ ...g })}
                              className="text-[10px] text-slate-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                              Edit
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <div className="text-[10px] text-slate-400">Phone</div>
                            <div className="font-mono font-medium text-slate-800">{g.phone_number}</div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <div className="text-[10px] text-slate-400">SMS Alerts</div>
                            <button onClick={() => toggleSms(g)}
                              className={cn("font-semibold text-xs mt-0.5 transition-colors",
                                g.receives_sms ? "text-emerald-600 hover:text-red-500" : "text-slate-400 hover:text-emerald-600")}>
                              {g.receives_sms ? "✓ Enabled" : "✗ Disabled"}
                            </button>
                          </div>
                          {g.email && (
                            <div className="col-span-2 p-2 bg-slate-50 rounded-lg">
                              <div className="text-[10px] text-slate-400">Email</div>
                              <div className="text-slate-700 truncate">{g.email}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Biometric consent */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs space-y-1">
                <div className="font-bold text-blue-900 flex items-center gap-2">🛡 Biometric & Consent Record</div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 mt-2">
                  <div><span className="text-slate-400">Credential:</span><div className="font-semibold capitalize">{selected.credential_type}</div></div>
                  <div><span className="text-slate-400">Consent:</span><div className="font-semibold text-emerald-700">✔ Signed & Filed</div></div>
                  <div><span className="text-slate-400">Raw Biometric:</span><div className="font-mono">None (hash only)</div></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 shrink-0 flex gap-2">
              {isAdmin && (
                <button onClick={() => deactivatePupil(selected)}
                  className={cn("flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors",
                    selected.status === "active"
                      ? "text-red-600 border-red-200 hover:bg-red-50"
                      : "text-emerald-600 border-emerald-200 hover:bg-emerald-50")}>
                  {selected.status === "active" ? "Deactivate Pupil" : "Reactivate Pupil"}
                </button>
              )}
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Guardian Modal ─────────────────────────────────────── */}
      {editGuardian && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Guardian</h3>
              <button onClick={() => setEditGuardian(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <form onSubmit={saveGuardian} className="space-y-3 text-xs">
              <div><label className="label">Full Name</label>
                <input className="input" value={editGuardian.full_name}
                  onChange={e => setEditGuardian({ ...editGuardian, full_name: e.target.value })} /></div>
              <div><label className="label">Phone Number</label>
                <input className="input font-mono" value={editGuardian.phone_number}
                  onChange={e => setEditGuardian({ ...editGuardian, phone_number: e.target.value })} /></div>
              <div><label className="label">Relationship</label>
                <input className="input" value={editGuardian.relationship ?? ""}
                  onChange={e => setEditGuardian({ ...editGuardian, relationship: e.target.value })} /></div>
              <div><label className="label">Email (optional)</label>
                <input type="email" className="input" value={editGuardian.email ?? ""}
                  onChange={e => setEditGuardian({ ...editGuardian, email: e.target.value })} /></div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editGuardian.receives_sms}
                  onChange={e => setEditGuardian({ ...editGuardian, receives_sms: e.target.checked })} />
                <span>Receives SMS notifications</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditGuardian(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={editBusy} className="btn-primary flex-1">
                  {editBusy ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Enrol Pupil Modal ────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <div className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider">Enrollment</div>
                <h3 className="text-base font-bold text-slate-900">Enrol Pupil & Register Guardian</h3>
              </div>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-700 p-1 text-xl">✕</button>
            </div>

            <form onSubmit={handleEnroll} className="p-6 space-y-6 text-xs">

              {/* Pupil details */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Pupil Details</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">First Name <span className="text-red-400">*</span></label>
                    <input required className="input" placeholder="e.g. Joshua"
                      value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
                  <div><label className="label">Last Name <span className="text-red-400">*</span></label>
                    <input required className="input" placeholder="e.g. Kigozi"
                      value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
                  <div><label className="label">Admission Number <span className="text-red-400">*</span></label>
                    <input required className="input font-mono" placeholder="e.g. 2025/001"
                      value={form.admissionNo} onChange={e => setForm({ ...form, admissionNo: e.target.value })} /></div>
                  <div><label className="label">Class</label>
                    <select className="input" value={form.classGrade} onChange={e => setForm({ ...form, classGrade: e.target.value })}>
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select></div>
                  <div><label className="label">Gender</label>
                    <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select></div>
                  <div><label className="label">Date of Birth</label>
                    <input type="date" className="input"
                      value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
                </div>
              </div>

              {/* Credential type */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Gate Access Credential</div>
                <div className="grid grid-cols-3 gap-2">
                  {CRED_OPTIONS.map(c => (
                    <button type="button" key={c.key} onClick={() => setForm({ ...form, credential: c.key })}
                      className={cn("p-3 rounded-xl border text-left transition-all",
                        form.credential === c.key
                          ? "bg-blue-50 border-blue-600 text-blue-900"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300")}>
                      <div className="text-lg mb-1">{c.icon}</div>
                      <div className="font-semibold text-xs">{c.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Guardian */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Primary Guardian / Parent <span className="text-red-400">*</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Full Name <span className="text-red-400">*</span></label>
                    <input required className="input" placeholder="e.g. Agnes Kigozi"
                      value={form.g1Name} onChange={e => setForm({ ...form, g1Name: e.target.value })} /></div>
                  <div><label className="label">Phone (SMS) <span className="text-red-400">*</span></label>
                    <input required className="input font-mono" placeholder="+256 7XX XXX XXX"
                      value={form.g1Phone} onChange={e => setForm({ ...form, g1Phone: e.target.value })} /></div>
                  <div><label className="label">Relationship</label>
                    <input className="input" placeholder="e.g. Mother"
                      value={form.g1Rel} onChange={e => setForm({ ...form, g1Rel: e.target.value })} /></div>
                  <div><label className="label">Email (optional)</label>
                    <input type="email" className="input" placeholder="parent@email.com"
                      value={form.g1Email} onChange={e => setForm({ ...form, g1Email: e.target.value })} /></div>
                </div>
              </div>

              {/* Secondary Guardian (collapsible) */}
              <div>
                <button type="button" onClick={() => setShowG2(!showG2)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                  {showG2 ? "▲ Remove second guardian" : "+ Add second guardian (optional)"}
                </button>
                {showG2 && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div><label className="label">Full Name</label>
                      <input className="input" placeholder="e.g. David Kigozi"
                        value={form.g2Name} onChange={e => setForm({ ...form, g2Name: e.target.value })} /></div>
                    <div><label className="label">Phone (SMS)</label>
                      <input className="input font-mono" placeholder="+256 7XX XXX XXX"
                        value={form.g2Phone} onChange={e => setForm({ ...form, g2Phone: e.target.value })} /></div>
                    <div><label className="label">Relationship</label>
                      <input className="input" placeholder="e.g. Father"
                        value={form.g2Rel} onChange={e => setForm({ ...form, g2Rel: e.target.value })} /></div>
                  </div>
                )}
              </div>

              {/* Consent */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required checked={form.consentSigned}
                    onChange={e => setForm({ ...form, consentSigned: e.target.checked })}
                    className="rounded border-slate-300 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-slate-800 font-medium leading-relaxed">
                    I confirm the parent/guardian has signed the <strong>Biometric Data Collection & Processing Notice</strong> and that a physical copy is archived by the school.
                  </span>
                </label>
              </div>

              {formErr && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">{formErr}</div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={busy} className="btn-primary">
                  {busy ? "Enrolling…" : "Enrol Pupil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
