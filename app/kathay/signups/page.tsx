"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { cn, formatDate, timeAgo } from "@/lib/utils";

interface SignupRequest {
  id: string;
  school_name: string;
  admin_name: string;
  admin_email: string;
  phone: string | null;
  status: string;
  school_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export default function SignupApprovalsPage() {
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    let query = supabase
      .from("school_signup_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query.limit(200);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setRequests((data as SignupRequest[]) ?? []);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove(id: string) {
    setError(null);
    setSuccessMsg(null);
    setBusy(true);
    const { data, error } = await supabase.rpc("approve_school_signup", {
      p_request_id: id,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    const result = data as { school_code?: string } | null;
    setSuccessMsg(
      `School approved! Code: ${result?.school_code ?? "generated"}. The school admin can now sign in.`
    );
    void load();
  }

  async function handleReject(id: string) {
    setError(null);
    setBusy(true);
    const { error } = await supabase.rpc("reject_school_signup", {
      p_request_id: id,
      p_reason: rejectReason.trim() || null,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setRejecting(null);
    setRejectReason("");
    setSuccessMsg("Request rejected. The school admin will be notified.");
    void load();
  }

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Signup Approvals</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review and approve school registration requests
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Pending", value: counts.pending, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Approved", value: counts.approved, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Rejected", value: counts.rejected, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={cn("rounded-xl border p-4", kpi.bg, kpi.border)}
          >
            <div className="text-xs font-medium text-slate-400">{kpi.label}</div>
            <div className={cn("text-2xl font-extrabold font-mono tabular-nums mt-1", kpi.color)}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
          <span>✅</span>
          {successMsg}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg w-fit">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize",
              filter === f
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Requests table */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
        {busy && requests.length === 0 ? (
          <div className="py-12 text-center">
            <span className="w-6 h-6 rounded-full border-2 border-slate-600 border-t-blue-500 animate-spin inline-block" />
            <p className="text-xs text-slate-400 mt-2">Loading...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-3xl mb-2">📋</div>
            <p className="text-sm text-slate-400">
              No {filter === "all" ? "" : filter} signup requests
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-[11px]">
                  <th className="py-2.5 px-4 text-left font-medium">School</th>
                  <th className="py-2.5 px-4 text-left font-medium">Admin</th>
                  <th className="py-2.5 px-4 text-left font-medium">Contact</th>
                  <th className="py-2.5 px-4 text-left font-medium">Submitted</th>
                  <th className="py-2.5 px-4 text-left font-medium">Status</th>
                  <th className="py-2.5 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                    {/* School */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{r.school_name}</div>
                      {r.school_id && (
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          School ID: {r.school_id.slice(0, 8)}
                        </div>
                      )}
                    </td>
                    {/* Admin */}
                    <td className="py-3 px-4">
                      <div className="text-slate-200">{r.admin_name || "—"}</div>
                    </td>
                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="font-mono text-[11px] text-slate-300">{r.admin_email}</div>
                      {r.phone && (
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">{r.phone}</div>
                      )}
                    </td>
                    {/* Submitted */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {timeAgo(r.created_at)}
                    </td>
                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          r.status === "pending" && "bg-amber-500/20 text-amber-400",
                          r.status === "approved" && "bg-emerald-500/20 text-emerald-400",
                          r.status === "rejected" && "bg-rose-500/20 text-rose-400"
                        )}
                      >
                        {r.status}
                      </span>
                      {r.rejection_reason && (
                        <div className="text-[10px] text-rose-400/70 mt-1 max-w-[150px] truncate">
                          {r.rejection_reason}
                        </div>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {r.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          {rejecting === r.id ? (
                            <>
                              <input
                                type="text"
                                placeholder="Reason (optional)"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-32 px-2 py-1 text-xs bg-slate-900 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/40"
                              />
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleReject(r.id)}
                                className="px-2 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-all disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => { setRejecting(null); setRejectReason(""); }}
                                className="px-2 py-1 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleApprove(r.id)}
                                className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all disabled:opacity-50"
                              >
                                ✓ Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejecting(r.id)}
                                className="px-3 py-1 text-xs font-bold text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 rounded-lg transition-all"
                              >
                                ✕ Reject
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          {r.reviewed_at ? `Reviewed ${timeAgo(r.reviewed_at)}` : ""}
                        </span>
                      )}
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
