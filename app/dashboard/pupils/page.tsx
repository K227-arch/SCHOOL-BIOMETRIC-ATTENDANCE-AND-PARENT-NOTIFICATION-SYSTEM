"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { fullName, cn } from "@/lib/utils";
import type { Pupil, Guardian } from "@/lib/types";

export default function PupilsPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;

  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Pupil | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Add-pupil form
  const [fName, setFName] = useState("");
  const [lName, setLName] = useState("");
  const [admNo, setAdmNo] = useState("");
  const [className, setClassName] = useState("");
  const [dob, setDob] = useState("");

  // Add-guardian form
  const [gName, setGName] = useState("");
  const [gRel, setGRel] = useState("");
  const [gPhone, setGPhone] = useState("");

  const loadPupils = useCallback(async () => {
    if (!schoolId) return;
    let q = insforge.database
      .from("pupils")
      .select("id, school_id, admission_number, first_name, last_name, class_name, date_of_birth, status, enrolled_at, credential_type")
      .eq("school_id", schoolId)
      .order("last_name", { ascending: true })
      .limit(200);
    if (search.trim()) {
      q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%`);
    }
    const { data, error } = await q;
    if (error) setError(error.message);
    else setPupils((data as Pupil[] | null) ?? []);
  }, [schoolId, search]);

  useEffect(() => {
    if (!loading) void loadPupils();
  }, [loading, loadPupils]);

  async function loadGuardians(pupilId: string) {
    const { data, error } = await insforge.database
      .from("guardians")
      .select("id, pupil_id, full_name, relationship, phone_number, email, is_primary, receives_sms")
      .eq("pupil_id", pupilId)
      .order("is_primary", { ascending: false })
      .limit(20);
    if (error) setError(error.message);
    else setGuardians((data as Guardian[] | null) ?? []);
  }

  useEffect(() => {
    if (selected) void loadGuardians(selected.id);
    else setGuardians([]);
  }, [selected]);

  async function addPupil(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) return;
    setBusy(true);
    setError(null);
    const { data, error } = await insforge.database
      .from("pupils")
      .insert([
        {
          school_id: schoolId,
          admission_number: admNo.trim(),
          first_name: fName.trim(),
          last_name: lName.trim(),
          class_name: className.trim() || null,
          date_of_birth: dob || null,
        },
      ])
      .select();
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setShowAdd(false);
    setFName(""); setLName(""); setAdmNo(""); setClassName(""); setDob("");
    void loadPupils();
    if (data && (data as Pupil[]).length) setSelected((data as Pupil[])[0]);
  }

  async function addGuardian(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !schoolId) return;
    setBusy(true);
    setError(null);
    const { error } = await insforge.database.from("guardians").insert([
      {
        school_id: schoolId,
        pupil_id: selected.id,
        full_name: gName.trim(),
        relationship: gRel.trim() || null,
        phone_number: gPhone.trim(),
        is_primary: guardians.length === 0,
      },
    ]);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setGName(""); setGRel(""); setGPhone("");
    void loadGuardians(selected.id);
  }

  if (!schoolId) {
    return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pupils</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enrolled pupils · search by name, admission number or class
          </p>
        </div>
        <button onClick={() => setShowAdd((s) => !s)} className="btn-primary">
          {showAdd ? "Cancel" : "+ Add pupil"}
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {showAdd && (
        <form onSubmit={addPupil} className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900">Add a new pupil</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="label">First name</label>
              <input className="input" required value={fName} onChange={(e) => setFName(e.target.value)} />
            </div>
            <div>
              <label className="label">Last name</label>
              <input className="input" required value={lName} onChange={(e) => setLName(e.target.value)} />
            </div>
            <div>
              <label className="label">Admission number</label>
              <input className="input" required value={admNo} onChange={(e) => setAdmNo(e.target.value)} />
            </div>
            <div>
              <label className="label">Class</label>
              <input className="input" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Grade 4A" />
            </div>
            <div>
              <label className="label">Date of birth</label>
              <input type="date" className="input" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save pupil"}</button>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pupil list */}
        <div className="card p-0 lg:col-span-2">
          <div className="border-b border-slate-200 p-4">
            <input className="input" placeholder="Search pupils…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="max-h-[28rem] overflow-y-auto">
            {pupils.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">No pupils found.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Name</th>
                    <th className="px-4 py-2.5 font-medium">Adm. No</th>
                    <th className="px-4 py-2.5 font-medium">Class</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pupils.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className={cn("cursor-pointer hover:bg-slate-50", selected?.id === p.id && "bg-blue-50")}
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-900">{fullName(p.first_name, p.last_name)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.admission_number}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.class_name ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("badge", p.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail + guardians */}
        <div className="card p-5">
          {selected ? (
            <>
              <h3 className="text-base font-semibold text-slate-900">{fullName(selected.first_name, selected.last_name)}</h3>
              <p className="text-xs text-slate-500">Adm. No {selected.admission_number} · {selected.class_name ?? "—"}</p>

              <div className="mt-5">
                <h4 className="text-xs font-semibold uppercase text-slate-500">Guardians</h4>
                <div className="mt-2 space-y-2">
                  {guardians.length === 0 && <p className="text-xs text-slate-400">No guardians yet.</p>}
                  {guardians.map((g) => (
                    <div key={g.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">{g.full_name}</span>
                        {g.is_primary && <span className="badge bg-blue-100 text-blue-800">Primary</span>}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">{g.relationship ?? "—"} · {g.phone_number}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={addGuardian} className="mt-4 space-y-2">
                  <input className="input" placeholder="Guardian name" required value={gName} onChange={(e) => setGName(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input" placeholder="Relationship" value={gRel} onChange={(e) => setGRel(e.target.value)} />
                    <input className="input" placeholder="Phone" required value={gPhone} onChange={(e) => setGPhone(e.target.value)} />
                  </div>
                  <button type="submit" disabled={busy} className="btn-secondary w-full text-xs">{busy ? "Adding…" : "Add guardian"}</button>
                </form>
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">Select a pupil to view details and guardians.</p>
          )}
        </div>
      </div>
    </div>
  );
}
