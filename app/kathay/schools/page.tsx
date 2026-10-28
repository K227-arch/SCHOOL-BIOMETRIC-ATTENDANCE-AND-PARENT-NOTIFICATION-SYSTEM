"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";

interface SchoolRow {
  id: string;
  name: string;
  code: string | null;
  district: string | null;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  subscription_plan: string | null;
  created_at: string;
  // joined
  credential?: { login_email: string; temp_password: string | null; password_set: boolean } | null;
  pupil_count?: number;
  sms_count?: number;
}

interface ProvisionResult {
  school_id: string;
  school_code: string;
  login_email: string;
  temp_password: string;
}

const PLANS = ["starter", "growth", "enterprise"] as const;
const TIMEZONES = [
  { value: "Africa/Kampala",      label: "Africa/Kampala (EAT)" },
  { value: "Africa/Nairobi",      label: "Africa/Nairobi (EAT)" },
  { value: "Africa/Lagos",        label: "Africa/Lagos (WAT)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
  { value: "Europe/London",       label: "Europe/London (GMT/BST)" },
  { value: "UTC",                 label: "UTC" },
];

export default function KathaySchoolsPage() {
  const { loading } = useAuth();
  const [schools, setSchools]         = useState<SchoolRow[]>([]);
  const [loadErr, setLoadErr]         = useState<string | null>(null);
  const [busy, setBusy]               = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"inactive">("all");

  // form fields
  const [fName, setFName]       = useState("");
  const [fEmail, setFEmail]     = useState("");
  const [fLogin, setFLogin]     = useState("");
  const [fPhone, setFPhone]     = useState("");
  const [fAddress, setFAddress] = useState("");
  const [fDistrict, setFDistrict] = useState("");
  const [fCountry, setFCountry] = useState("Uganda");
  const [fPlan, setFPlan]       = useState<typeof PLANS[number]>("starter");
  const [fTz, setFTz]           = useState("Africa/Kampala");
  const [formErr, setFormErr]   = useState<string | null>(null);

  // credentials modal after onboard
  const [provision, setProvision]   = useState<ProvisionResult | null>(null);
  const [copied, setCopied]         = useState<string | null>(null);

  // view credentials of existing school
  const [viewCred, setViewCred] = useState<SchoolRow | null>(null);

  const load = useCallback(async () => {
    setLoadErr(null);
    const { data, error } = await supabase.from("schools")
      .select("id,name,code,district,country,contact_email,contact_phone,status,subscription_plan,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { setLoadErr(error.message); return; }
    const rows = (data as SchoolRow[]) ?? [];

    // Fetch credentials for each school
    const { data: creds } = await supabase.from("school_credentials")
      .select("school_id,login_email,temp_password,password_set")
      .limit(300);
    const credMap = new Map((creds as any[] ?? []).map((c: any) => [c.school_id, c]));

    setSchools(rows.map(r => ({ ...r, credential: credMap.get(r.id) ?? null })));
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  function resetForm() {
    setFName(""); setFEmail(""); setFLogin(""); setFPhone(""); setFAddress("");
    setFDistrict(""); setFCountry("Uganda"); setFPlan("starter"); setFTz("Africa/Kampala");
    setFormErr(null);
  }

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    const loginEmail = fLogin.trim() || fEmail.trim();
    if (!fName.trim())    { setFormErr("School name is required."); return; }
    if (!loginEmail)      { setFormErr("A login email for the school admin is required."); return; }
    setBusy(true); setFormErr(null);
    const { data, error } = await supabase.rpc("provision_school", {
      p_name:              fName.trim(),
      p_address:           fAddress.trim() || null,
      p_district:          fDistrict.trim() || null,
      p_country:           fCountry.trim() || "Uganda",
      p_contact_email:     fEmail.trim() || null,
      p_contact_phone:     fPhone.trim() || null,
      p_subscription_plan: fPlan,
      p_timezone:          fTz,
      p_login_email:       loginEmail,
      p_temp_password:     null,
    });
    setBusy(false);
    if (error) { setFormErr(error.message); return; }
    setProvision(data as ProvisionResult);
    setShowForm(false);
    resetForm();
    void load();
  }

  async function toggleStatus(s: SchoolRow) {
    const next = s.status === "active" ? "inactive" : "active";
    await supabase.from("schools").update({ status: next }).eq("id", s.id);
    void load();
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = schools.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.district ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const planBadge = (plan: string | null) =>
    plan === "enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" :
    plan === "growth"     ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">School Onboarding</h2>
          <p className="mt-1 text-sm text-slate-400">
            Provision school accounts, generate login credentials and monitor each tenant.
          </p>
        </div>
        <button onClick={() => { setShowForm(v => !v); resetForm(); }}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors flex items-center gap-2">
          {showForm ? "✕ Cancel" : "+ Onboard School"}
        </button>
      </div>

      {loadErr && <div className="rounded-lg bg-red-900/40 px-4 py-3 text-sm text-red-300 border border-red-800">{loadErr}</div>}

      {/* Onboard form */}
      {showForm && (
        <form onSubmit={handleProvision} className="rounded-xl border border-slate-700 bg-slate-800/80 p-6 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-xs">🏫</span>
            New School Account
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* School name */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">School name <span className="text-red-400">*</span></label>
              <input required value={fName} onChange={e => setFName(e.target.value)}
                placeholder="e.g. Greenfield Primary School"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Subscription plan */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Subscription Plan</label>
              <select value={fPlan} onChange={e => setFPlan(e.target.value as typeof PLANS[number])}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {/* Contact email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Contact Email</label>
              <input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)}
                placeholder="principal@school.ug"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Login email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Admin Login Email <span className="text-red-400">*</span>
                <span className="ml-1 text-slate-500 font-normal">(used to sign in)</span>
              </label>
              <input type="email" value={fLogin} onChange={e => setFLogin(e.target.value)}
                placeholder="admin@school.ug"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Contact Phone</label>
              <input value={fPhone} onChange={e => setFPhone(e.target.value)}
                placeholder="+256 700 000000"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">District</label>
              <input value={fDistrict} onChange={e => setFDistrict(e.target.value)}
                placeholder="e.g. Kampala"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Country</label>
              <input value={fCountry} onChange={e => setFCountry(e.target.value)}
                placeholder="Uganda"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Timezone</label>
              <select value={fTz} onChange={e => setFTz(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>

            {/* Address */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Physical Address</label>
              <input value={fAddress} onChange={e => setFAddress(e.target.value)}
                placeholder="e.g. Plot 45, Kampala Road, Kampala"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          {formErr && <div className="rounded-lg bg-red-900/40 px-4 py-2.5 text-sm text-red-300 border border-red-800">{formErr}</div>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {busy ? "Provisioning…" : "Provision School + Generate Credentials"}
            </button>
            <p className="text-xs text-slate-500">A temporary password will be generated and shown once.</p>
          </div>
        </form>
      )}

      {/* Credentials reveal modal */}
      {provision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-xl">✓</div>
              <div>
                <h3 className="text-base font-bold text-white">School Provisioned</h3>
                <p className="text-xs text-slate-400">Save these credentials — the password won't be shown again.</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-800 border border-slate-700 divide-y divide-slate-700 overflow-hidden">
              {[
                { label: "School Code", value: provision.school_code, key: "code" },
                { label: "Login Email",  value: provision.login_email,  key: "email" },
                { label: "Temp Password", value: provision.temp_password, key: "pwd", mono: true },
              ].map(row => (
                <div key={row.key} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{row.label}</div>
                    <div className={cn("text-sm font-semibold text-white mt-0.5 truncate", row.mono && "font-mono tracking-widest")}>{row.value}</div>
                  </div>
                  <button onClick={() => copy(row.value, row.key)}
                    className="shrink-0 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors">
                    {copied === row.key ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-amber-900/30 border border-amber-700/50 px-4 py-3 text-xs text-amber-300">
              Share these credentials with the school administrator. They should change the password on first login.
            </div>

            <button onClick={() => setProvision(null)}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Done
            </button>
          </div>
        </div>
      )}

      {/* View credentials modal */}
      {viewCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Login Credentials</h3>
                <p className="text-xs text-slate-400 mt-0.5">{viewCred.name}</p>
              </div>
              <button onClick={() => setViewCred(null)} className="text-slate-500 hover:text-white text-xl">&times;</button>
            </div>
            {viewCred.credential ? (
              <div className="rounded-xl bg-slate-800 border border-slate-700 divide-y divide-slate-700 overflow-hidden">
                {[
                  { label: "Login Email",   value: viewCred.credential.login_email,    key: "vc_email" },
                  { label: "School Code",   value: viewCred.code ?? "—",               key: "vc_code" },
                  { label: "Temp Password", value: viewCred.credential.temp_password ?? "(password set by school)", key: "vc_pwd", mono: true },
                ].map(row => (
                  <div key={row.key} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{row.label}</div>
                      <div className={cn("text-sm font-semibold text-white mt-0.5 truncate", row.mono && "font-mono")}>{row.value}</div>
                    </div>
                    {viewCred.credential?.login_email && (
                      <button onClick={() => copy(row.value, row.key)}
                        className="shrink-0 rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors">
                        {copied === row.key ? "✓" : "Copy"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No credentials on record for this school.</p>
            )}
            {viewCred.credential?.password_set && (
              <div className="rounded-lg bg-emerald-900/30 border border-emerald-700/50 px-4 py-2 text-xs text-emerald-300">
                School has set their own password.
              </div>
            )}
            <button onClick={() => setViewCred(null)} className="w-full rounded-lg border border-slate-700 py-2 text-sm text-slate-400 hover:text-white transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
          <input type="text" placeholder="Search by name, code or district…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-600 bg-slate-700 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700">
          {(["all","active","inactive"] as const).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors",
                statusFilter === f ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>
              {f === "all" ? "All" : f === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 shrink-0">
          {filtered.length} of {schools.length} schools
        </div>
      </div>

      {/* Schools table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="text-3xl">🏫</div>
            <p className="text-sm text-slate-400">{schools.length === 0 ? "No schools onboarded yet." : "No schools match your search."}</p>
            {schools.length === 0 && (
              <button onClick={() => setShowForm(true)} className="mt-2 text-sm text-blue-400 hover:text-blue-300 font-medium">
                + Onboard your first school
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 text-left text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">School</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Login Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Onboarded</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{s.code ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    <div>{s.district ?? "—"}</div>
                    <div className="text-slate-600">{s.country ?? "Uganda"}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    {s.credential ? (
                      <div>
                        <div className="text-slate-300 text-xs">{s.credential.login_email}</div>
                        <div className={cn("text-[10px] mt-0.5 font-medium",
                          s.credential.password_set ? "text-emerald-400" : "text-amber-400")}>
                          {s.credential.password_set ? "Password set" : "Temp password active"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">No credentials</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-semibold border", planBadge(s.subscription_plan))}>
                      {(s.subscription_plan ?? "starter").charAt(0).toUpperCase() + (s.subscription_plan ?? "starter").slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      s.status === "active" ? "bg-emerald-900/50 text-emerald-400" : "bg-slate-700 text-slate-400")}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", s.status === "active" ? "bg-emerald-400" : "bg-slate-500")} />
                      {s.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewCred(s)}
                        className="rounded-md border border-slate-600 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-1">
                        🔑 Credentials
                      </button>
                      <button onClick={() => toggleStatus(s)}
                        className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                          s.status === "active"
                            ? "bg-red-900/40 text-red-400 hover:bg-red-900/70 border border-red-800/50"
                            : "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/70 border border-emerald-800/50")}>
                        {s.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
