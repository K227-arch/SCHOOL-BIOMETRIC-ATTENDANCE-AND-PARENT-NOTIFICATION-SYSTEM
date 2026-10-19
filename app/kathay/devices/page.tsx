"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, timeAgo } from "@/lib/utils";

interface DeviceRow {
  id: string; name: string; device_type: string; model: string | null;
  serial_number: string | null; status: string; last_seen_at: string | null;
  school_name: string; gate_name: string | null;
}

export default function KathayDevicesPage() {
  const { loading } = useAuth();
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await insforge.database
      .from("devices")
      .select("id, name, device_type, model, serial_number, status, last_seen_at, school_id, gate_id, schools(name), gates(name)")
      .order("status", { ascending: true })
      .order("last_seen_at", { ascending: false })
      .limit(300);
    if (error) return setError(error.message);
    const rows = ((data ?? []) as Record<string, unknown>[]).map((d) => ({
      id: d.id as string,
      name: d.name as string,
      device_type: d.device_type as string,
      model: d.model as string | null,
      serial_number: d.serial_number as string | null,
      status: d.status as string,
      last_seen_at: d.last_seen_at as string | null,
      school_name: ((d.schools as Record<string, string> | null)?.name) ?? "—",
      gate_name: ((d.gates as Record<string, string> | null)?.name) ?? null,
    }));
    setDevices(rows);
  }, []);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  const filtered = filter === "all" ? devices : devices.filter((d) => d.status === filter);

  const offline = devices.filter((d) => {
    if (!d.last_seen_at) return true;
    return Date.now() - new Date(d.last_seen_at).getTime() > 30 * 60 * 1000; // >30m
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Device Integration</h2>
        <p className="mt-1 text-sm text-slate-400">
          Fingerprint and RFID gate readers across all schools. Before selecting a scanner,
          test its SDK/API, template handling, offline behaviour, enrolment capacity and event
          export.
        </p>
      </div>
      {error && <div className="rounded-lg bg-red-900/50 p-3 text-sm text-red-300">{error}</div>}

      {offline.length > 0 && (
        <div className="rounded-xl border border-red-700/50 bg-red-900/20 p-4">
          <p className="text-sm font-semibold text-red-400">⚠ {offline.length} device(s) not seen in last 30 minutes</p>
          <div className="mt-2 space-y-1">
            {offline.slice(0, 5).map((d) => (
              <div key={d.id} className="text-xs text-red-300">{d.name} at {d.school_name} — last seen {d.last_seen_at ? timeAgo(d.last_seen_at) : "never"}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(["all", "active", "inactive"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize",
              filter === f ? "bg-blue-600 text-white" : "border border-slate-600 text-slate-400 hover:bg-slate-700")}>
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No devices found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">School</th>
                <th className="px-4 py-3 font-medium">Gate</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.map((d) => {
                const isOffline = !d.last_seen_at || Date.now() - new Date(d.last_seen_at).getTime() > 30 * 60 * 1000;
                return (
                  <tr key={d.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-medium text-white">
                      {d.name}
                      {d.serial_number && <div className="text-xs font-mono text-slate-400">{d.serial_number}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{d.school_name}</td>
                    <td className="px-4 py-3 text-slate-400">{d.gate_name ?? "—"}</td>
                    <td className="px-4 py-3 capitalize text-slate-400">{d.device_type}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        d.status === "active" ? "bg-emerald-900/60 text-emerald-400" : "bg-red-900/60 text-red-400")}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs", isOffline ? "text-red-400" : "text-slate-400")}>
                        {d.last_seen_at ? timeAgo(d.last_seen_at) : "Never"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
        <h3 className="text-sm font-semibold text-white">Integration requirements</h3>
        <ul className="mt-3 space-y-1.5 text-xs text-slate-400 list-disc list-inside">
          <li>Test scanner SDK/API, template handling and offline behaviour before selection</li>
          <li>Biometric matching preferably handled locally on the device</li>
          <li>Devices transmit minimal event data to the central platform</li>
          <li>Gate devices must distinguish entry from exit; card option where available</li>
          <li>Backup power and supervised paper register for power/reader failure</li>
          <li>Queue events securely at gateway with original timestamps during internet outages</li>
          <li>Retry fingerprint under supervision — never accept an unknown fingerprint as a match</li>
        </ul>
      </div>
    </div>
  );
}
