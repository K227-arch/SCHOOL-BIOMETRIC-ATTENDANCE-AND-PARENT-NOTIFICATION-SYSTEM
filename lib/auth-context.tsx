'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { insforge, type StaffRole } from './insforge'
import type { UserContext } from './types'

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
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: string | null; requireVerification: boolean }>
  verifyEmail: (email: string, otp: string) => Promise<{ error: string | null }>
  completeSignup: (
    role: StaffRole,
    schoolName?: string,
    schoolCode?: string
  ) => Promise<{ error: string | null; schoolId: string | null }>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, context: null, loading: true })

  const refresh = useCallback(async () => {
    const { data, error } = await insforge.auth.getCurrentUser()
    if (error || !data?.user) {
      setState({ user: null, context: null, loading: false })
      return
    }
    // Fetch role/school context via RPC
    const { data: ctx } = await insforge.database.rpc('current_user_context')
    const ctxData = (ctx as UserContext | undefined) ?? null
    setState({
      user: { id: data.user.id, email: data.user.email ?? null },
      context: ctxData,
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
      const { data: ctx } = await insforge.database.rpc('current_user_context')
      if (cancelled) return
      setState({
        user: { id: data.user.id, email: data.user.email ?? null },
        context: (ctx as UserContext | undefined) ?? null,
        loading: false,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await insforge.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }, [refresh])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await insforge.auth.signUp({ email, password, name })
    if (error) return { error: error.message, requireVerification: false }
    if (data?.requireEmailVerification) {
      return { error: null, requireVerification: true }
    }
    // No verification required — signed in already
    await refresh()
    return { error: null, requireVerification: false }
  }, [refresh])

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    const { error } = await insforge.auth.verifyEmail({ email, otp })
    if (error) return { error: error.message }
    await refresh()
    return { error: null }
  }, [refresh])

  const completeSignup = useCallback(
    async (role: StaffRole, schoolName?: string, schoolCode?: string) => {
      const { data, error } = await insforge.database.rpc('complete_signup', {
        p_role: role,
        p_school_name: schoolName ?? null,
        p_school_code: schoolCode ?? null,
      })
      if (error) return { error: error.message, schoolId: null }
      await refresh()
      return { error: null, schoolId: (data as string | null) ?? null }
    },
    [refresh]
  )

  const signOut = useCallback(async () => {
    await insforge.auth.signOut()
    setState({ user: null, context: null, loading: false })
  }, [])

  const value: AuthContextValue = {
    user: state.user,
    context: state.context,
    loading: state.loading,
    signIn,
    signUp,
    verifyEmail,
    completeSignup,
    signOut,
    refresh,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
