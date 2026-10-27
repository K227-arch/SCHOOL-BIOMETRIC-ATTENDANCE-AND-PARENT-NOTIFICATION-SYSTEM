"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Device, Gate } from "@/lib/types";

export default function DevicesPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [devices, setDevices] = useState<Device[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Add gate
  const [gateName, setGateName] = useState("");
  const [gateDir, setGateDir] = useState<"entry" | "exit" | "both">("both");
  // Add device
  const [devName, setDevName] = useState("");
  const [devType, setDevType] = useState<"fingerprint" | "rfid" | "manual">("fingerprint");
  const [devGate, setDevGate] = useState("");

  const load = useCallback(async () => {
    if (!schoolId) return;
    setError(null);
    const [{ data: dRows, error: dErr }, { data: gRows, error: gErr }] = await Promise.all([
      supabase.from("devices").select("id, name, device_type, model, serial_number, status, gate_id, last_seen_at")
        .eq("school_id", schoolId).order("name", { ascending: true }).limit(100),
      supabase.from("gates").select("id, name, direction, status")
        .eq("school_id", schoolId).order("name", { ascending: true }).limit(50),
    ]);
    if (dErr) return setError(dErr.message);
    if (gErr) return setError(gErr.message);
    setDevices((dRows as Device[] | null) ?? []);
    setGates((gRows as Gate[] | null) ?? []);
  }, [schoolId]);

  useEffect(() => {
    if (!loading) void load();
  }, [loading, load]);

  async function addGate(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId || !gateName.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("gates").insert([
      { school_id: schoolId, name: gateName.trim(), direction: gateDir },
    ]);
    setBusy(false);
    if (error) return setError(error.message);
    setGateName("");
    void load();
  }

  async function addDevice(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId || !devName.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("devices").insert([
      { school_id: schoolId, name: devName.trim(), device_type: devType, gate_id: devGate || null },
    ]);
    setBusy(false);
    if (error) return setError(error.message);
    setDevName("");
    void load();
  }

  if (!schoolId) {
    return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Devices & gates</h2>
        <p className="mt-1 text-sm text-slate-500">
          Gate devices positioned or configured to distinguish entry from exit; card option
          where available.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gates */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900">Gates</h3>
          <div className="mt-3 space-y-2">
            {gates.length === 0 && <p className="text-sm text-slate-400">No gates yet.</p>}
            {gates.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">{g.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{g.direction}</div>
                </div>
                <span className={cn("badge", g.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>
                  {g.status}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={addGate} className="mt-4 flex items-end gap-2">
            <div className="flex-1">
              <label className="label">Add gate</label>
              <input className="input" placeholder="e.g. Main Gate" value={gateName} onChange={(e) => setGateName(e.target.value)} />
            </div>
            <select className="input w-28" value={gateDir} onChange={(e) => setGateDir(e.target.value as typeof gateDir)}>
              <option value="both">Both</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
            </select>
            <button type="submit" disabled={busy} className="btn-primary text-sm">Add</button>
          </form>
        </div>

        {/* Devices */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900">Devices</h3>
          <div className="mt-3 space-y-2">
            {devices.length === 0 && <p className="text-sm text-slate-400">No devices yet.</p>}
            {devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <div className="text-sm font-medium text-slate-900">{d.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{d.device_type} · {gates.find((g) => g.id === d.gate_id)?.name ?? "unassigned"}</div>
                </div>
                <span className={cn("badge", d.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>
          <form onSubmit={addDevice} className="mt-4 grid grid-cols-2 gap-2">
            <div>
              <label className="label">Device name</label>
              <input className="input" placeholder="e.g. ZKTeco #1" value={devName} onChange={(e) => setDevName(e.target.value)} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={devType} onChange={(e) => setDevType(e.target.value as typeof devType)}>
                <option value="fingerprint">Fingerprint</option>
                <option value="rfid">RFID</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Assign to gate</label>
              <select className="input" value={devGate} onChange={(e) => setDevGate(e.target.value)}>
                <option value="">— Unassigned —</option>
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={busy} className="btn-primary col-span-2 text-sm">Add device</button>
          </form>
        </div>
      </div>
    </div>
  );
}
