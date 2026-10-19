"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { insforge } from "@/lib/insforge";
import { useAuth } from "@/lib/auth-context";
import { cn, fullName, formatDateTime, formatTime } from "@/lib/utils";

interface SmsRow {
  id: string;
  message_type: string;
  phone_number: string;
  message_body: string;
  status: string;
  queued_at: string;
  delivered_at: string | null;
  sent_at: string | null;
}

interface Child { pupil_id: string; first_name: string; last_name: string; admission_number: string; school_name: string; }

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued", sending: "Sending",
  sent: "Sent", delivered: "Delivered",
  failed: "Failed", cancelled: "Cancelled",
};

export default function ParentMessagesPage() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("pupil");
  const [children, setChildren] = useState<Child[]>([]);
  const [activePupil, setActivePupil] = useState<string | null>(selectedId);
  const [messages, setMessages] = useState<SmsRow[]>([]);
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

  const loadMessages = useCallback(async () => {
    if (!activePupil) return;
    const { data, error } = await insforge.database.from("sms_notifications")
      .select("id, message_type, phone_number, message_body, status, queued_at, delivered_at, sent_at")
      .eq("pupil_id", activePupil).order("queued_at", { ascending: false }).limit(100);
    if (error) return setError(error.message);
    setMessages((data as SmsRow[] | null) ?? []);
  }, [activePupil]);

  useEffect(() => { void loadMessages(); }, [loadMessages]);

  const active = children.find(c => c.pupil_id === activePupil);
  const arrivals = messages.filter(m => m.message_type === "arrival");
  const departures = messages.filter(m => m.message_type === "departure");
  const latestArrival = arrivals[0];
  const latestDeparture = departures[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">SMS Notifications</h2>
        <p className="mt-1 text-sm text-slate-500">
          Arrival and departure alerts sent to your registered phone number.
        </p>
      </div>

      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map(c => (
            <button key={c.pupil_id} onClick={() => setActivePupil(c.pupil_id)}
              className={cn("rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                activePupil === c.pupil_id ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-300 text-slate-600 hover:bg-slate-50")}>
              {fullName(c.first_name, c.last_name)}
            </button>
          ))}
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* ── Figure 4 layout: info box + phone mockup ─────── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* Left: "Sample SMS alert" info box — exactly as Figure 4 */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900 text-base">Sample SMS alert</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              This illustration shows the kind of message a parent or guardian would receive
              when a pupil is recorded arriving at school or leaving school.
            </p>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">What the parent sees</div>
              <ul className="mt-2 space-y-1.5">
                {[
                  "the school name",
                  "the pupil name",
                  "whether the event is arrival or departure",
                  "the recorded time",
                  "the gate or location, if desired",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              The message should be short, clear and easy to understand at a glance.
            </p>
          </div>

          {/* Message status guide */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900 mb-3">Message delivery status</div>
            <div className="space-y-2">
              {[
                { status: "Queued or sending", desc: "Record the original scan time and wait for the messaging provider response." },
                { status: "Sent or delivered", desc: "Show the status returned by the provider; a sent message is not necessarily a delivered message." },
                { status: "Failed or delayed", desc: "Retry under defined limits, flag the issue on the school dashboard." },
              ].map(row => (
                <div key={row.status} className="rounded-lg bg-slate-50 p-2.5">
                  <div className="text-xs font-semibold text-slate-800">{row.status}</div>
                  <div className="mt-0.5 text-xs text-slate-500 leading-relaxed">{row.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Phone mockup — exactly as Figure 4 */}
        <div className="flex-1">
          <div className="mx-auto max-w-sm">
            {/* Phone shell */}
            <div className="rounded-[2.5rem] border-4 border-slate-800 bg-slate-800 shadow-2xl">
              {/* Status bar */}
              <div className="flex items-center justify-between rounded-t-[2rem] bg-white px-5 pt-3 pb-1">
                <div className="h-1.5 w-12 rounded-full bg-slate-300" />
                <div className="h-2 w-2 rounded-full bg-slate-400" />
              </div>

              {/* Messages app */}
              <div className="bg-white min-h-[28rem] rounded-b-[2rem] overflow-hidden">
                {/* Messages header bar */}
                <div className="bg-blue-600 px-4 py-3">
                  <div className="text-sm font-bold text-white text-center">Messages</div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Earlier message */}
                  <div>
                    <div className="text-xs text-slate-400 mb-1.5">Earlier message</div>
                    <div className="inline-block rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700">
                      Good morning
                    </div>
                  </div>

                  {/* Arrival alert */}
                  <div>
                    <div className="text-xs text-slate-400 mb-1.5">Arrival alert</div>
                    {latestArrival ? (
                      <div className="ml-auto inline-block max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 px-3.5 py-2.5 text-sm text-white">
                        {latestArrival.message_body}
                      </div>
                    ) : (
                      <div className="ml-auto inline-block max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 px-3.5 py-2.5 text-sm text-white">
                        {active?.school_name ?? "Greenhill School"}:<br />
                        {active ? fullName(active.first_name, active.last_name) : "Daniel Kato"} was<br />
                        recorded arriving at<br />
                        7:42 a.m. today.
                      </div>
                    )}
                  </div>

                  {/* Departure alert */}
                  <div>
                    <div className="text-xs text-slate-400 mb-1.5">Departure alert</div>
                    {latestDeparture ? (
                      <div className="ml-auto inline-block max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 px-3.5 py-2.5 text-sm text-white">
                        {latestDeparture.message_body}
                      </div>
                    ) : (
                      <div className="ml-auto inline-block max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 px-3.5 py-2.5 text-sm text-white">
                        {active?.school_name ?? "Greenhill School"}:<br />
                        {active ? fullName(active.first_name, active.last_name) : "Daniel Kato"} was<br />
                        recorded leaving<br />
                        school at 4:18 p.m.<br />
                        today.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full message log below phone */}
          {messages.length > 0 && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-900">Full message log</div>
              <div className="divide-y divide-slate-100">
                {messages.map(m => (
                  <div key={m.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          m.status === "delivered" || m.status === "sent" ? "bg-emerald-100 text-emerald-700" :
                          m.status === "failed" ? "bg-red-100 text-red-700" :
                          "bg-blue-100 text-blue-700")}>
                          {STATUS_LABELS[m.status] ?? m.status}
                        </span>
                        <span className="text-sm font-medium capitalize text-slate-900">{m.message_type}</span>
                      </div>
                      <span className="text-xs text-slate-400">{formatDateTime(m.queued_at)}</span>
                    </div>
                    <p className="mt-2 rounded-xl bg-blue-50 px-3.5 py-2.5 text-sm text-slate-800">
                      {m.message_body}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      To: {m.phone_number}
                      {m.delivered_at && ` · Delivered ${formatDateTime(m.delivered_at)}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        A sent message is not necessarily a delivered message. During an outage, any later message
        shows the actual event time, not when delivery resumed.
      </p>
    </div>
  );
}
