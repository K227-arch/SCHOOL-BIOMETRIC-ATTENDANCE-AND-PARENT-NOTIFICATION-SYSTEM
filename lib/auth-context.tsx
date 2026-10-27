'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { supabase, type StaffRole } from './supabase'
import type { UserContext } from './types'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/auth/redirect', '/auth/callback']

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
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      setState({ user: null, context: null, loading: false })
      return
    }
    const { data: ctx } = await supabase.rpc('current_user_context')
    setState({
      user: { id: user.id, email: user.email ?? null },
      context: (ctx as UserContext | null) ?? null,
      loading: false,
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    // Listen to Supabase auth state changes (handles OTP callback, OAuth, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      if (!session?.user) {
        setState({ user: null, context: null, loading: false })
        return
      }
      const user = { id: session.user.id, email: session.user.email ?? null }
      let { data: ctx } = await supabase.rpc('current_user_context')
      // Auto-bootstrap admin: if user has no role, try make_kathay_admin
      if (ctx && !(ctx as any)?.is_platform_admin && !(ctx as any)?.role && user.email) {
        await supabase.rpc('make_kathay_admin', { p_email: user.email })
        const { data: ctx2 } = await supabase.rpc('current_user_context')
        ctx = ctx2
      }
      if (cancelled) return
      if (isPublicPath(pathname)) {
        setState({ user, context: null, loading: false })
      }
      if (!cancelled) setState({ user, context: (ctx as UserContext | null) ?? null, loading: false })
    })

    // Also check existing session on mount
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) { setState({ user: null, context: null, loading: false }); return }
      const authUser = { id: user.id, email: user.email ?? null }
      if (isPublicPath(pathname)) {
        setState({ user: authUser, context: null, loading: false })
        let { data: ctx } = await supabase.rpc('current_user_context')
        // Auto-bootstrap admin: if user has no role, try make_kathay_admin
        if (ctx && !(ctx as any)?.is_platform_admin && !(ctx as any)?.role && user.email) {
          await supabase.rpc('make_kathay_admin', { p_email: user.email })
          const { data: ctx2 } = await supabase.rpc('current_user_context')
          ctx = ctx2
        }
        if (!cancelled) setState({ user: authUser, context: (ctx as UserContext | null) ?? null, loading: false })
      } else {
        let { data: ctx } = await supabase.rpc('current_user_context')
        if (ctx && !(ctx as any)?.is_platform_admin && !(ctx as any)?.role && user.email) {
          await supabase.rpc('make_kathay_admin', { p_email: user.email })
          const { data: ctx2 } = await supabase.rpc('current_user_context')
          ctx = ctx2
        }
        if (!cancelled) setState({ user: authUser, context: (ctx as UserContext | null) ?? null, loading: false })
      }
    })()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }, [refresh])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, full_name: name } }
    })
    if (error) return { error: error.message, requireVerification: false }
    // Supabase requires email confirmation by default
    if (data.user && !data.session) return { error: null, requireVerification: true }
    await refresh()
    return { error: null, requireVerification: false }
  }, [refresh])

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }, [refresh])

  const completeSignup = useCallback(async (role: StaffRole, schoolCode?: string) => {
    const { data, error } = await supabase.rpc('complete_signup', {
      p_role: role,
      p_school_name: null,
      p_school_code: schoolCode ?? null,
    })
    if (error) return { error: error.message, schoolId: null }
    await refresh()
    return { error: null, schoolId: (data as string | null) ?? null }
  }, [refresh])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
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
