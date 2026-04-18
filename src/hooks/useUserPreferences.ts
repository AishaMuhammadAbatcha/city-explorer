import { useCallback, useEffect, useState } from 'react'
import { supabase, type Tables } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export type UserPreferences = Tables<'user_preferences'>

type PrefsUpdate = Partial<
  Pick<
    UserPreferences,
    'default_location' | 'currency' | 'search_radius_m' | 'price_range_min' | 'price_range_max'
  >
>

const DEFAULT_PREFS: UserPreferences = {
  user_id: '',
  default_location: null,
  currency: null,
  search_radius_m: 5000,
  price_range_min: null,
  price_range_max: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
}

export function useUserPreferences() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setPrefs(DEFAULT_PREFS)
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('useUserPreferences fetch error:', error.message)
          setPrefs({ ...DEFAULT_PREFS, user_id: user.id })
          setLoading(false)
          return
        }
        setPrefs(data ?? { ...DEFAULT_PREFS, user_id: user.id })
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const upsert = useCallback(
    async (full: PrefsUpdate) => {
      if (!user) return { error: new Error('No user') }
      const row = { user_id: user.id, ...full }
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(row, { onConflict: 'user_id' })
        .select('*')
        .single()
      if (!error && data) setPrefs(data)
      return { error: error ? new Error(error.message) : null }
    },
    [user],
  )

  const update = useCallback(
    async (partial: PrefsUpdate) => upsert(partial),
    [upsert],
  )

  return { prefs, loading, update, upsert }
}
