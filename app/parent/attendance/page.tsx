"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/lib/auth-context";
import { cn, fullName, formatDateTime, ATTENDANCE_RESULT_STYLES } from "@/lib/utils";

interface AttendanceRow {
  id: string;
  event_type: "arrival" | "departure";
  event_time: string;
  result: string;
  source: string;
}

interface Child {
  pupil_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  school_name: string;
}

export default function ParentAttendancePage() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("pupil");

  const [children, setChildren] = useState<Child[]>([]);
  const [activePupil, setActivePupil] = useState<string | null>(selectedId);
  const [events, setEvents] = useState<AttendanceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      insforge.database.rpc("get_parent_children").then(({ data }) => {
        const kids = (data as Child[] | null) ?? [];
        setChildren(kids);
        if (!activePupil && kids.length) setActivePupil(kids[0].pupil_id);
      });
    }
  }, [loading, user, activePupil]);

  const loadEvents = useCallback(async () => {
    if (!activePupil) return;
    setError(null);
    const { data, error } = await insforge.database
      .from("attendance_events")
      .select("id, event_type, event_time, result, source")
      .eq("pupil_id", activePupil)
      .order("event_time", { ascending: false })
      .limit(100);
    if (error) return setError(error.message);
    setEvents((data as AttendanceRow[] | null) ?? []);
  }, [activePupil]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const active = children.find((c) => c.pupil_id === activePupil);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Attendance history</h2>
        <p className="mt-1 text-sm text-slate-500">Daily arrival and departure records for your children.</p>
      </div>

      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <button key={c.pupil_id} onClick={() => setActivePupil(c.pupil_id)}
              className={cn("rounded-lg border px-4 py-2 text-sm font-medium",
                activePupil === c.pupil_id
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50")}>
              {fullName(c.first_name, c.last_name)}
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="text-sm text-slate-500">{fullName(active.first_name, active.last_name)} · {active.admission_number} · {active.school_name}</div>
      )}

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card p-0">
        {events.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No attendance events recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Date & Time</th>
                <th className="px-4 py-3 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-3">
                    <span className={cn("badge capitalize",
                      e.event_type === "arrival" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800")}>
                      {e.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatDateTime(e.event_time)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("badge", ATTENDANCE_RESULT_STYLES[e.result] ?? "bg-slate-100 text-slate-600")}>
                      {e.result.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Recorded times reflect the biometric or manual scan event. During outages, delayed
        notifications show the actual event time, not the delivery time.
      </p>
    </div>
  );
}
