import { createClient } from '@insforge/sdk'

// Singleton browser SDK client. Reads public env vars exposed to the client.
const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY

if (!baseUrl || !anonKey) {
  throw new Error(
    'Missing InsForge env vars. Set NEXT_PUBLIC_INSFORGE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY in .env.local'
  )
}

export const insforge = createClient({ baseUrl, anonKey })

export type StaffRole = 'kathay_admin' | 'school_admin' | 'gate_staff' | 'supervisor'

export const ROLE_LABELS: Record<StaffRole, string> = {
  kathay_admin: 'Kathay Administrator',
  school_admin: 'School Administrator',
  gate_staff: 'Gate Staff',
  supervisor: 'Supervisor',
}

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  kathay_admin: 'Platform owner. Manage all schools, onboarding and support.',
  school_admin: 'Run your school: pupils, staff, gates, reports and settings.',
  gate_staff: 'Record pupil arrivals and departures at the gate.',
  supervisor: 'Review exceptions, follow-ups and unresolved release records.',
}
