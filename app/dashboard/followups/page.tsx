"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, FOLLOWUP_STATUS_STYLES, fullName, timeAgo } from "@/lib/utils";
import type { FollowUp, Pupil } from "@/lib/types";

const STATUS_OPTIONS: FollowUp["status"][] = ["open", "assigned", "escalated", "closed"];

export default function FollowUpsPage() {
  const { context, user, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [items, setItems] = useState<FollowUp[]>([]);
  const [pupilMap, setPupilMap] = useState<Record<string, Pupil>>({});
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    if (!schoolId) return;
    setError(null);
    let q = insforge.database
      .from("follow_ups")
      .select("id, school_id, pupil_id, exception_type, reason, status, assigned_staff_id, action_note, contact_attempt, created_at, completed_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter === "open") q = q.neq("status", "closed");
    if (filter === "closed") q = q.eq("status", "closed");
    const { data, error } = await q;
    if (error) return setError(error.message);
    const f = (data as FollowUp[] | null) ?? [];
    setItems(f);
    const ids = [...new Set(f.map((x) => x.pupil_id))];
    if (ids.length) {
      const { data: pRows } = await insforge.database
        .from("pupils")
        .select("id, first_name, last_name, admission_number, class_name")
        .in("id", ids)
        .limit(ids.length);
      const map: Record<string, Pupil> = {};
      (pRows as Pupil[] | null)?.forEach((p) => (map[p.id] = p));
      setPupilMap(map);
    }
  }, [schoolId, filter]);

  useEffect(() => {
    if (!loading) void load();
  }, [loading, load]);

  async function updateStatus(f: FollowUp, status: FollowUp["status"]) {
    if (!schoolId) return;
    setError(null);
    const updates: Record<string, unknown> = { status };
    if (status === "closed") {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = user?.id ?? null;
    }
    if (note.trim()) updates.action_note = note.trim();
    const { error } = await insforge.database.from("follow_ups").update(updates).eq("id", f.id);
    if (error) return setError(error.message);
    setEditing(null);
    setNote("");
    void load();
  }

  if (!schoolId) {
    return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Follow-up queue</h2>
        <p className="mt-1 text-sm text-slate-500">
          Exceptions: late arrivals, missing scans, early exits, failed SMS and unresolved
          release records. Each follow-up has a responsible staff member, action note and
          status.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex gap-2">
        {(["all", "open", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "badge px-3 py-1.5 text-sm capitalize",
              filter === f ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card p-0">
        {items.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No follow-ups in this view.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((f) => {
              const p = pupilMap[f.pupil_id];
              return (
                <div key={f.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold capitalize text-slate-900">
                          {f.exception_type.replace(/_/g, " ")}
                        </span>
                        <span className={cn("badge", FOLLOWUP_STATUS_STYLES[f.status])}>{f.status}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {p ? fullName(p.first_name, p.last_name) : "—"} · {p?.admission_number ?? "—"} · {p?.class_name ?? "—"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{f.reason ?? "No reason recorded"} · {timeAgo(f.created_at)}</div>
                      {f.action_note && <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">{f.action_note}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {editing?.id === f.id ? (
                        <div className="w-full max-w-xs space-y-2">
                          <textarea
                            className="input text-xs"
                            rows={2}
                            placeholder="Action note…"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                          <select className="input text-xs" onChange={(e) => updateStatus(f, e.target.value as FollowUp["status"])} defaultValue={f.status}>
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button onClick={() => setEditing(null)} className="btn-secondary text-xs">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditing(f)} className="btn-secondary text-xs">Update</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400">
        A corrected attendance record must retain its original event, the correction reason,
        editor and time. A missed departure scan must not be silently converted into a
        confirmed departure.
      </p>
    </div>
  );
}
