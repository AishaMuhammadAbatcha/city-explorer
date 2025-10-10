import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, type Tables } from '@/lib/supabase'

type Profile = Tables<'profiles'>

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, userData?: { full_name?: string; role?: 'individual' | 'business' }) => Promise<{ user: User | null; error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Get initial session
    const initializeAuth = async () => {
      try {
        // Set a timeout to ensure loading is eventually set to false
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Auth initialization timeout - setting loading to false')
            setLoading(false)
          }
        }, 5000) // 5 second timeout (reduced from 10)

        const { data: { session }, error } = await supabase.auth.getSession()

        if (!mounted) {
          clearTimeout(timeoutId)
          return
        }

        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          clearTimeout(timeoutId)
          return
        }

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Fetch profile but don't block on it - set user first
          fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }

        clearTimeout(timeoutId)
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
        }
        clearTimeout(timeoutId)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state change:', event, session?.user?.id)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // Set loading to false even on error to prevent infinite loading
        setLoading(false)
        return
      }

      setProfile(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Set loading to false even on error to prevent infinite loading
      setLoading(false)
    }
  }

  const signUp = async (
    email: string,
    password: string,
    userData?: { full_name?: string; role?: 'individual' | 'business' }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData?.full_name || '',
          role: userData?.role || 'individual'
        }
      }
    })

    return { user: data.user, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    return { user: data.user, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
      setSession(null)
    }
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    return { error }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        // @ts-ignore - Temporary workaround for Supabase types
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        return { error: new Error(error.message) }
      }

      // Refetch profile
      await fetchProfile(user.id)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}