'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { insforge, type StaffRole } from './insforge'
import type { UserContext } from './types'

// Only pages that truly never need any auth context at all.
// /auth/redirect is intentionally NOT here — it needs full context to route correctly.
const PUBLIC_PATHS = ['/', '/login', '/signup', '/parent/login', '/parent']

function isPublicPath(p: string) {
  return PUBLIC_PATHS.some(pub => p === pub || p.startsWith(pub + '/'))
}

interface AuthUser {
  id: string
  email: string | null
}

interface AuthState {
  user: AuthUser | null
  context: UserContext | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; requireVerification: boolean }>
  verifyEmail: (email: string, otp: string) => Promise<{ error: string | null }>
  completeSignup: (role: StaffRole, schoolCode?: string) => Promise<{ error: string | null; schoolId: string | null }>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, context: null, loading: true })
  const pathname = usePathname()

  const refresh = useCallback(async () => {
    const { data, error } = await insforge.auth.getCurrentUser()
    if (error || !data?.user) {
      setState({ user: null, context: null, loading: false })
      return
    }
    const { data: ctx } = await insforge.database.rpc('current_user_context')
    setState({
      user: { id: data.user.id, email: data.user.email ?? null },
      context: (ctx as UserContext | undefined) ?? null,
      loading: false,
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const { data, error } = await insforge.auth.getCurrentUser()
      if (cancelled) return

      if (error || !data?.user) {
        setState({ user: null, context: null, loading: false })
        return
      }

      const user = { id: data.user.id, email: data.user.email ?? null }

      if (isPublicPath(pathname)) {
        // Public page — unblock render immediately; fetch context in background
        setState({ user, context: null, loading: false })
        const { data: ctx } = await insforge.database.rpc('current_user_context')
        if (!cancelled) {
          setState({ user, context: (ctx as UserContext | undefined) ?? null, loading: false })
        }
        return
      }

      // Protected page (including /auth/redirect) — wait for full context
      const { data: ctx } = await insforge.database.rpc('current_user_context')
      if (cancelled) return
      setState({
        user,
        context: (ctx as UserContext | undefined) ?? null,
        loading: false,
      })
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // signIn: authenticates then refreshes context once
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await insforge.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }, [refresh])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await insforge.auth.signUp({ email, password, name })
    if (error) return { error: error.message, requireVerification: false }
    if (data?.requireEmailVerification) return { error: null, requireVerification: true }
    await refresh()
    return { error: null, requireVerification: false }
  }, [refresh])

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const { error } = await insforge.auth.verifyEmail({ email, otp })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }, [refresh])

  // completeSignup: staff join a school by code, or become kathay_admin
  const completeSignup = useCallback(async (role: StaffRole, schoolCode?: string) => {
    const { data, error } = await insforge.database.rpc('complete_signup', {
      p_role: role,
      p_school_name: null,
      p_school_code: schoolCode ?? null,
    })
    if (error) return { error: error.message, schoolId: null }
    await refresh()
    return { error: null, schoolId: (data as string | null) ?? null }
  }, [refresh])

  const signOut = useCallback(async () => {
    await insforge.auth.signOut()
    setState({ user: null, context: null, loading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, verifyEmail, completeSignup, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
