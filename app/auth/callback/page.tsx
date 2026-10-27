"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * /auth/callback
 *
 * Handles ALL Supabase auth redirects. Supabase sends one of three formats:
 *
 *   1. token_hash (recommended — set in email template):
 *      /auth/callback?token_hash=xxx&type=magiclink
 *
 *   2. PKCE code (default for new projects):
 *      /auth/callback?code=xxx
 *
 *   3. Hash fragment (legacy implicit flow):
 *      /auth/callback#access_token=xxx&...
 *
 * After session is established → router.replace("/auth/redirect") → /kathay or /dashboard
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const params  = new URLSearchParams(window.location.search);
      const hash    = window.location.hash;

      // ── Format 1: token_hash (set this in Supabase email template) ──────
      const tokenHash = params.get("token_hash");
      const type = (params.get("type") ?? "magiclink") as "magiclink" | "signup" | "recovery" | "invite" | "email";
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) {
          setError("This sign-in link has expired or has already been used. Please request a new one.");
          return;
        }
        router.replace("/auth/redirect");
        return;
      }

      // ── Format 2: PKCE code ──────────────────────────────────────────────
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) { router.replace("/auth/redirect"); return; }
          setError("This sign-in link has expired or has already been used. Please request a new one.");
          return;
        }
        router.replace("/auth/redirect");
        return;
      }

      // ── Format 3: hash fragment (access_token=...) ───────────────────────
      if (hash && hash.includes("access_token")) {
        // Supabase JS SDK picks up hash fragments automatically on init
        await new Promise(r => setTimeout(r, 150));
        const { data: { session } } = await supabase.auth.getSession();
        if (session) { router.replace("/auth/redirect"); return; }

        // Manual fallback
        const hp = new URLSearchParams(hash.replace("#", ""));
        const access_token  = hp.get("access_token")  ?? "";
        const refresh_token = hp.get("refresh_token") ?? "";
        if (access_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) { setError("Sign-in link is invalid or expired. Please request a new one."); return; }
          router.replace("/auth/redirect");
          return;
        }
      }

      // ── No token/code/hash — already signed in? ──────────────────────────
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.replace("/auth/redirect"); return; }

      setError("Invalid or missing sign-in link. Please request a new one from the login page.");
    }

    void handleCallback();
  }, [router]);

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50 px-6"
        style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}
      >
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-3xl mx-auto">
            ✉️
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Sign-in link problem</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{error}</p>
          </div>
          <a
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 rounded-xl text-sm font-bold text-white"
            style={{
              background: "linear-gradient(135deg,#3730a3 0%,#6366f1 100%)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            }}
          >
            ← Request a new link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white gap-5"
      style={{ fontFamily: "'Plus Jakarta Sans','Inter',system-ui,sans-serif" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-700 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-500/30">
          K
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900">Kathay Technologies</div>
          <div className="text-xs text-slate-500">Signing you in…</div>
        </div>
      </div>
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-500">Verifying your sign-in link…</p>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}
