"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { insforge } from "@/lib/insforge";
import { cn, formatDate } from "@/lib/utils";
import type { School } from "@/lib/types";

export default function SchoolsPage() {
  const { context, loading } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await insforge.database
      .from("schools")
      .select("id, name, code, contact_email, contact_phone, timezone, status, created_at")
      .order("name", { ascending: true })
      .limit(200);
    if (error) return setError(error.message);
    setSchools((data as School[] | null) ?? []);
  }, []);

  useEffect(() => {
    if (!loading) void load();
  }, [loading, load]);

  if (!loading && !context?.is_platform_admin) {
    return (
      <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
        Platform administrator access required to view all schools.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Schools</h2>
        <p className="mt-1 text-sm text-slate-500">
          All schools on the platform. Kathay provides the managed technology service:
          hosting, integration, updates, backups, device monitoring and incident
          investigation.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-slate-900">{s.name}</h3>
              <span className={cn("badge", s.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>
                {s.status}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <div>Code: <span className="font-mono font-medium text-slate-700">{s.code ?? "—"}</span></div>
              <div>{s.contact_email ?? "No contact email"}</div>
              <div>{s.contact_phone ?? "No phone"}</div>
              <div>Onboarded {formatDate(s.created_at)}</div>
            </div>
          </div>
        ))}
        {schools.length === 0 && (
          <p className="col-span-full p-8 text-center text-sm text-slate-400">No schools yet.</p>
        )}
      </div>
    </div>
  );
}
