import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Singleton browser client — safe to import from any client component
// Falls back to empty strings at build time (Vercel); real values come from env vars at runtime
export const supabase = createBrowserClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnon || 'placeholder-anon-key'
)

// Role types used throughout the app
export type StaffRole = 'kathay_admin' | 'school_admin' | 'gate_staff' | 'supervisor'

export const ROLE_LABELS: Record<StaffRole, string> = {
  kathay_admin: 'Kathay Administrator',
  school_admin: 'School Administrator',
  gate_staff:   'Gate Staff',
  supervisor:   'Supervisor',
}

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  kathay_admin: 'Platform owner. Manage all schools, onboarding and support.',
  school_admin: 'Run your school: pupils, staff, gates, reports and settings.',
  gate_staff:   'Record pupil arrivals and departures at the gate.',
  supervisor:   'Review exceptions, follow-ups and unresolved release records.',
}
