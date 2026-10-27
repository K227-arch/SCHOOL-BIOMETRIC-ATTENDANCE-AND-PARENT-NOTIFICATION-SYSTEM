// TypeScript interfaces mirroring the database schema (public schema)

export interface Profile {
  user_id: string
  full_name: string
  email: string | null
  phone: string | null
  is_platform_admin: boolean
  created_at: string
  updated_at: string
}

export interface School {
  id: string
  name: string
  code: string | null
  address: string | null
  contact_email: string | null
  contact_phone: string | null
  timezone: string
  school_hours_start: string
  school_hours_end: string
  late_threshold_minutes: number
  duplicate_scan_window_seconds: number
  status: 'active' | 'inactive'
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SchoolMember {
  id: string
  school_id: string
  user_id: string
  role: StaffRole
  status: 'active' | 'inactive'
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Gate {
  id: string
  school_id: string
  name: string
  direction: 'entry' | 'exit' | 'both'
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface Device {
  id: string
  school_id: string
  gate_id: string | null
  name: string
  device_type: 'fingerprint' | 'rfid' | 'manual'
  model: string | null
  serial_number: string | null
  status: 'active' | 'inactive'
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface Pupil {
  id: string
  school_id: string
  admission_number: string
  first_name: string
  last_name: string
  class_name: string | null
  date_of_birth: string | null
  gender: string | null
  photo_url: string | null
  credential_type: 'fingerprint' | 'rfid' | 'manual'
  credential_ref: string | null
  status: 'active' | 'inactive' | 'graduated' | 'transferred'
  enrolled_at: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Guardian {
  id: string
  school_id: string
  pupil_id: string
  full_name: string
  relationship: string | null
  phone_number: string
  email: string | null
  is_primary: boolean
  receives_sms: boolean
  created_at: string
  updated_at: string
}

export interface AuthorizedPickup {
  id: string
  school_id: string
  pupil_id: string
  full_name: string
  relationship: string | null
  phone_number: string | null
  id_type: string | null
  id_number: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface AttendanceEvent {
  id: string
  school_id: string
  pupil_id: string
  device_id: string | null
  gate_id: string | null
  event_type: 'arrival' | 'departure'
  event_time: string
  recorded_time: string
  result: 'success' | 'failed' | 'duplicate_suppressed'
  source: 'device' | 'manual'
  staff_id: string | null
  notes: string | null
  created_at: string
}

export interface AttendanceCorrection {
  id: string
  school_id: string
  original_event_id: string
  pupil_id: string
  correction_type: string
  original_values: Record<string, unknown>
  corrected_values: Record<string, unknown>
  reason: string
  edited_by: string
  edited_at: string
  created_at: string
}

export interface SmsNotification {
  id: string
  school_id: string
  pupil_id: string
  attendance_event_id: string | null
  guardian_id: string | null
  message_type: 'arrival' | 'departure'
  phone_number: string
  message_body: string
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'cancelled'
  provider_message_id: string | null
  attempts: number
  queued_at: string
  sent_at: string | null
  delivered_at: string | null
  error: string | null
  created_at: string
  updated_at: string
}

export interface FollowUp {
  id: string
  school_id: string
  pupil_id: string
  attendance_event_id: string | null
  exception_type:
    | 'late_arrival'
    | 'missing_scan'
    | 'early_exit'
    | 'failed_sms'
    | 'unresolved_release'
    | 'duplicate_scan'
    | 'unknown_fingerprint'
    | 'other'
  reason: string | null
  status: 'open' | 'assigned' | 'escalated' | 'closed'
  assigned_staff_id: string | null
  action_note: string | null
  contact_attempt: string | null
  created_by: string | null
  created_at: string
  completed_at: string | null
  completed_by: string | null
  updated_at: string
}

export interface AuditLog {
  id: string
  school_id: string | null
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface CalendarEntry {
  id: string
  school_id: string
  date: string
  day_type: 'school_day' | 'weekend' | 'holiday' | 'break'
  school_hours_start: string | null
  school_hours_end: string | null
  notes: string | null
  created_at: string
}

export interface NotificationTemplate {
  id: string
  school_id: string
  template_type: 'arrival' | 'departure'
  template_body: string
  language: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserContext {
  school_id: string | null
  role: StaffRole | null
  is_platform_admin: boolean
  school_name: string | null
  user_name: string | null
}

import type { StaffRole } from './supabase'
