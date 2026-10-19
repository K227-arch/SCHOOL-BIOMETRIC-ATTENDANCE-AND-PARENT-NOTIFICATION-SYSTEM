"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, fullName, formatTime, formatDate, ATTENDANCE_RESULT_STYLES } from "@/lib/utils";

interface ChildRecord {
  pupil_id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_name: string | null;
  school_name: string;
  school_id: string;
}

interface TodayStatus {
  arrived: boolean;
  departed: boolean;
  arrivalTime: string | null;
  departureTime: string | null;
}

export default function ParentDashboard() {
  const { user, loading } = useAuth();
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [todayStatus, setTodayStatus] = useState<Record<string, TodayStatus>>({});
  const [linkCode, setLinkCode] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [noAccount, setNoAccount] = useState(false);

  const loadChildren = useCallback(async () => {
    const { data, error } = await insforge.database.rpc("get_parent_children");
    if (error) { setNoAccount(true); return; }
    const kids = (data as ChildRecord[] | null) ?? [];
    setChildren(kids);
    if (!kids.length) setNoAccount(true);

    // Load today's status for each child
    const today = new Date().toISOString().slice(0, 10);
    const statuses: Record<string, TodayStatus> = {};
    await Promise.all(
      kids.map(async (kid) => {
        const { data: evs } = await insforge.database
          .from("attendance_events")
          .select("event_type, event_time, result")
          .eq("pupil_id", kid.pupil_id)
          .gte("event_time", `${today}T00:00:00Z`)
          .lte("event_time", `${today}T23:59:59Z`)
          .eq("result", "success")
          .order("event_time", { ascending: true })
          .limit(20);
        const arr = (evs as { event_type: string; event_time: string; result: string }[] | null) ?? [];
        const arrival = arr.find((e) => e.event_type === "arrival");
        const departure = arr.find((e) => e.event_type === "departure");
        statuses[kid.pupil_id] = {
          arrived: !!arrival,
          departed: !!departure,
          arrivalTime: arrival?.event_time ?? null,
          departureTime: departure?.event_time ?? null,
        };
      })
    );
    setTodayStatus(statuses);
  }, []);

  useEffect(() => {
    if (!loading && user) void loadChildren();
  }, [loading, user, loadChildren]);

  async function linkChild(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLinkError(null);
    setLinkBusy(true);
    // Find the guardian by matching phone or admission number to school code
    // Parent must know their child's admission number to link
    const { data: pupils, error: pErr } = await insforge.database
      .from("pupils")
      .select("id, school_id")
      .eq("admission_number", linkCode.trim().toUpperCase())
      .limit(1);
    if (pErr || !pupils || !(pupils as { id: string; school_id: string }[]).length) {
      setLinkBusy(false);
      setLinkError("No pupil found with that admission number. Please check and try again.");
      return;
    }
    const pupil = (pupils as { id: string; school_id: string }[])[0];
    // Find matching guardian
    const { data: guards } = await insforge.database
      .from("guardians")
      .select("id")
      .eq("pupil_id", pupil.id)
      .limit(1);
    const guardian = (guards as { id: string }[] | null)?.[0];
    // Upsert parent account
    const { error: accErr } = await insforge.database.from("parent_accounts").insert([{
      user_id: user.id,
      school_id: pupil.school_id,
      guardian_id: guardian?.id ?? null,
      verified: false,
    }]);
    setLinkBusy(false);
    if (accErr && !accErr.message.includes("duplicate")) {
      setLinkError(accErr.message);
      return;
    }
    setLinkCode("");
    setLinkSuccess(true);
    void loadChildren();
  }

  if (loading) return <div className="text-sm text-slate-400 py-10 text-center">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Children</h2>
        <p className="mt-1 text-sm text-slate-500">
          Today&apos;s attendance status and school information for your children.
        </p>
      </div>

      {/* Link a child */}
      {noAccount && !children.length && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900">Link your child&apos;s record</h3>
          <p className="mt-1 text-sm text-slate-500">
            Enter your child&apos;s admission number to link their school record to your account.
            Your account will be verified by the school administrator.
          </p>
          <form onSubmit={linkChild} className="mt-4 flex gap-3">
            <input className="input max-w-xs" required value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
              placeholder="Admission number, e.g. 2024001" />
            <button type="submit" disabled={linkBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {linkBusy ? "Linking…" : "Link child"}
            </button>
          </form>
          {linkError && <p className="mt-2 text-sm text-red-600">{linkError}</p>}
          {linkSuccess && (
            <p className="mt-2 text-sm text-emerald-700">
              Request sent. Your account will be verified by the school administrator.
            </p>
          )}
        </div>
      )}

      {/* Child cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((kid) => {
          const s = todayStatus[kid.pupil_id];
          return (
            <div key={kid.pupil_id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{fullName(kid.first_name, kid.last_name)}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{kid.admission_number} · {kid.class_name ?? "—"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{kid.school_name}</p>
                </div>
              </div>

              {/* Today's status */}
              <div className="mt-4 rounded-lg bg-slate-50 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Today</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Arrival</span>
                  {s?.arrived ? (
                    <span className="badge bg-emerald-100 text-emerald-800">{formatTime(s.arrivalTime)}</span>
                  ) : (
                    <span className="badge bg-slate-100 text-slate-500">Not yet recorded</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">Departure</span>
                  {s?.departed ? (
                    <span className="badge bg-blue-100 text-blue-800">{formatTime(s.departureTime)}</span>
                  ) : s?.arrived ? (
                    <span className="badge bg-amber-100 text-amber-800">Still on site</span>
                  ) : (
                    <span className="badge bg-slate-100 text-slate-500">—</span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link href={`/parent/attendance?pupil=${kid.pupil_id}`}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50">
                  History
                </Link>
                <Link href={`/parent/messages?pupil=${kid.pupil_id}`}
                  className="flex-1 rounded-lg border border-slate-300 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50">
                  Messages
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {children.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-900">Link another child</h3>
          <form onSubmit={linkChild} className="mt-3 flex gap-3">
            <input className="input max-w-xs" value={linkCode}
              onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
              placeholder="Admission number" />
            <button type="submit" disabled={linkBusy}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {linkBusy ? "Linking…" : "Link"}
            </button>
          </form>
          {linkError && <p className="mt-2 text-sm text-red-600">{linkError}</p>}
          {linkSuccess && <p className="mt-2 text-sm text-emerald-700">Request sent to school for verification.</p>}
        </div>
      )}

      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Important:</strong> A scan records an event — it does not, by itself, establish
        that your child was safely handed over to an authorised person. Contact your school
        directly if you have any concerns.
      </div>
    </div>
  );
}
