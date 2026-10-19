"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, SMS_STATUS_STYLES, fullName, formatTime, formatDateTime } from "@/lib/utils";
import type { SmsNotification, Pupil } from "@/lib/types";

export default function MessagesPage() {
  const { context, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [items, setItems] = useState<SmsNotification[]>([]);
  const [pupilMap, setPupilMap] = useState<Record<string, Pupil>>({});
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = useCallback(async () => {
    if (!schoolId) return;
    setError(null);
    let q = insforge.database
      .from("sms_notifications")
      .select("id, pupil_id, message_type, phone_number, message_body, status, attempts, queued_at, sent_at, delivered_at, error")
      .eq("school_id", schoolId)
      .order("queued_at", { ascending: false })
      .limit(100);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data, error } = await q;
    if (error) return setError(error.message);
    const s = (data as SmsNotification[] | null) ?? [];
    setItems(s);
    const ids = [...new Set(s.map((x) => x.pupil_id))];
    if (ids.length) {
      const { data: pRows } = await insforge.database
        .from("pupils")
        .select("id, first_name, last_name, admission_number")
        .in("id", ids)
        .limit(ids.length);
      const map: Record<string, Pupil> = {};
      (pRows as Pupil[] | null)?.forEach((p) => (map[p.id] = p));
      setPupilMap(map);
    }
  }, [schoolId, statusFilter]);

  useEffect(() => {
    if (!loading) void load();
  }, [loading, load]);

  if (!schoolId) {
    return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Messages</h2>
        <p className="mt-1 text-sm text-slate-500">
          Parent SMS notifications. A sent message is not necessarily a delivered message —
          provider status is shown separately from delivery success.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {["all", "queued", "sending", "sent", "delivered", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "badge px-3 py-1.5 text-sm capitalize",
              statusFilter === s ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card p-0">
        {items.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No messages.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((m) => {
              const p = pupilMap[m.pupil_id];
              return (
                <div key={m.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("badge capitalize", SMS_STATUS_STYLES[m.status])}>{m.status}</span>
                        <span className="text-sm font-medium capitalize text-slate-900">{m.message_type}</span>
                        <span className="text-xs text-slate-400">attempts: {m.attempts}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-700">
                        {p ? fullName(p.first_name, p.last_name) : "—"} · {m.phone_number}
                      </div>
                      <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">{m.message_body}</p>
                      {m.error && <p className="mt-1 text-xs text-red-600">{m.error}</p>}
                      <div className="mt-1.5 text-xs text-slate-400">
                        Queued {formatTime(m.queued_at)}
                        {m.sent_at && ` · Sent ${formatDateTime(m.sent_at)}`}
                        {m.delivered_at && ` · Delivered ${formatDateTime(m.delivered_at)}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
