"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  step_key: string;
  step_label: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  notes: string | null;
  completed_at: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  blocked: "bg-red-100 text-red-800",
};

export default function OnboardingPage() {
  const { context, user, loading } = useAuth();
  const schoolId = context?.school_id ?? null;
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!schoolId) return;
    // Seed default checklist if empty
    const { count } = await insforge.database.from("onboarding_checklists")
      .select("id", { count: "exact" }).eq("school_id", schoolId).limit(1);
    if (!count) await insforge.database.rpc("seed_onboarding_checklist", { p_school_id: schoolId });
    const { data, error } = await insforge.database
      .from("onboarding_checklists")
      .select("id, step_key, step_label, status, notes, completed_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: true });
    if (error) return setError(error.message);
    setItems((data as ChecklistItem[] | null) ?? []);
  }, [schoolId]);

  useEffect(() => { if (!loading) void load(); }, [loading, load]);

  async function updateStatus(item: ChecklistItem, status: ChecklistItem["status"]) {
    setBusy(true);
    const updates: Record<string, unknown> = { status };
    if (status === "completed") { updates.completed_at = new Date().toISOString(); updates.completed_by = user?.id ?? null; }
    await insforge.database.from("onboarding_checklists").update(updates).eq("id", item.id);
    setBusy(false);
    void load();
  }

  const completed = items.filter((i) => i.status === "completed").length;
  const pct = items.length ? Math.round((completed / items.length) * 100) : 0;

  if (!schoolId) return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">No school linked.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Onboarding Checklist</h2>
        <p className="mt-1 text-sm text-slate-500">
          Complete all steps before going live. This project must not proceed to biometric
          enrolment until data-protection arrangements are approved.
        </p>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Progress</span>
          <span className="text-sm font-bold text-slate-900">{completed}/{items.length}</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">{pct}% complete</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={cn("mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  item.status === "completed" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600")}>
                  {item.status === "completed" ? "✓" : "○"}
                </span>
                <div>
                  <div className="text-sm font-medium text-slate-900">{item.step_label}</div>
                  {item.notes && <div className="mt-0.5 text-xs text-slate-500">{item.notes}</div>}
                  {item.completed_at && <div className="mt-0.5 text-xs text-emerald-600">Completed {new Date(item.completed_at).toLocaleDateString()}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("badge", STATUS_STYLES[item.status])}>{item.status.replace("_", " ")}</span>
                <select value={item.status} disabled={busy}
                  onChange={(e) => updateStatus(item, e.target.value as ChecklistItem["status"])}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs">
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
