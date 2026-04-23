import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Coords } from '@/hooks/useGeolocation'

export type TrendingCategory =
  | 'food'
  | 'tourism'
  | 'accommodation'
  | 'shopping'
  | 'cafe'
  | 'bar'

export interface TrendingPlace {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  rating?: number
  rating_count?: number
  types: string[]
  primary_type?: string
  maps_url: string
}

export interface TrendingPlacesResponse {
  categories: Record<TrendingCategory, TrendingPlace[]>
  from_cache: Record<TrendingCategory, boolean>
  geocell: { lat: number; lng: number }
  radius_m: number
}

export const TRENDING_CATEGORIES: TrendingCategory[] = [
  'food',
  'tourism',
  'accommodation',
  'shopping',
  'cafe',
  'bar',
]

export const CATEGORY_LABELS: Record<TrendingCategory, string> = {
  food: 'Food',
  tourism: 'Tourism',
  accommodation: 'Stay',
  shopping: 'Shopping',
  cafe: 'Cafés',
  bar: 'Bars',
}

interface UseTrendingPlacesState {
  data: TrendingPlacesResponse | null
  loading: boolean
  error: string | null
}

export function useTrendingPlaces(coords: Coords | null, enabled: boolean) {
  const [state, setState] = useState<UseTrendingPlacesState>({
    data: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!enabled || !coords) {
      setState({ data: null, loading: false, error: null })
      return
    }

    let cancelled = false
    setState({ data: null, loading: true, error: null })

    supabase.functions
      .invoke<TrendingPlacesResponse>('trending-places', {
        body: { lat: coords.lat, lng: coords.lng },
      })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setState({ data: null, loading: false, error: error.message })
          return
        }
        setState({ data: data ?? null, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Request failed'
        setState({ data: null, loading: false, error: message })
      })

    return () => {
      cancelled = true
    }
    // Depending on lat/lng primitives avoids re-triggering when the
    // useGeolocation hook returns a new-identity but same-value coords object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, coords?.lat, coords?.lng])

  return state
}
