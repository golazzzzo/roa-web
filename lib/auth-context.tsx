'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type FanProfile } from './supabase'

type AuthContextValue = {
  user: User | null
  fanProfile: FanProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string, location: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchFanProfile(userId: string): Promise<FanProfile | null> {
  const { data } = await supabase.from('fans').select('*').eq('id', userId).single()
  return data ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [fanProfile, setFanProfile] = useState<FanProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchFanProfile(session.user.id).then(setFanProfile)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchFanProfile(session.user.id).then(setFanProfile)
      else setFanProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, name: string, location: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name, location } },
    })
    if (error) return { error: error.message }

    // If session is returned directly (email confirmation off), we're already in
    if (data.session) return { error: null }

    // Email confirmation is on — sign in after confirmation
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError?.message?.toLowerCase().includes('not confirmed')) {
      return { error: 'Revisa tu email y confirma tu cuenta para continuar' }
    }
    return { error: signInError?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, fanProfile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
