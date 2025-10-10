import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { recommendationsService, type RecommendationScore, type RecommendationOptions } from '@/services/recommendationsService'

export type RecommendationType = 'personalized' | 'trending' | 'similar' | 'contextual'

interface UseRecommendationsOptions extends RecommendationOptions {
  type?: RecommendationType
  context?: 'morning' | 'afternoon' | 'evening' | 'weekend' | 'date' | 'business'
  autoFetch?: boolean
  location?: { lat: number; lng: number }
}

interface UseRecommendationsReturn {
  recommendations: RecommendationScore[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  getRecommendations: (options?: UseRecommendationsOptions) => Promise<void>
}

export function useRecommendations(
  initialOptions: UseRecommendationsOptions = {}
): UseRecommendationsReturn {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  // Serialize options to prevent infinite loops
  const optionsRef = useCallback(() => initialOptions, [JSON.stringify(initialOptions)])

  const getRecommendations = useCallback(
    async (options: UseRecommendationsOptions = {}) => {
      if (!user) return

      const finalOptions = { ...optionsRef(), ...options }
      setLoading(true)
      setError(null)

      try {
        let result: RecommendationScore[] = []

        switch (finalOptions.type || 'personalized') {
          case 'personalized':
            result = await recommendationsService.getPersonalizedRecommendations(
              user.id,
              finalOptions
            )
            break

          case 'trending':
            result = await recommendationsService.getTrendingPlaces(
              finalOptions.location,
              finalOptions.limit
            )
            break

          case 'similar':
            result = await recommendationsService.getSimilarUserRecommendations(
              user.id,
              finalOptions
            )
            break

          case 'contextual':
            if (finalOptions.location && finalOptions.context) {
              result = await recommendationsService.getContextualRecommendations(
                finalOptions.location,
                finalOptions.context,
                finalOptions
              )
            }
            break

          default:
            result = await recommendationsService.getPersonalizedRecommendations(
              user.id,
              finalOptions
            )
        }

        setRecommendations(result)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get recommendations'
        setError(message)
        console.error('Error getting recommendations:', err)
      } finally {
        setLoading(false)
      }
    },
    [user, optionsRef]
  )

  const refresh = useCallback(() => {
    return getRecommendations(optionsRef())
  }, [getRecommendations, optionsRef])

  // Auto-fetch on mount if enabled - only once
  useEffect(() => {
    if (optionsRef().autoFetch !== false && user && !hasFetched) {
      setHasFetched(true)
      getRecommendations(optionsRef())
    }
  }, [user, getRecommendations, optionsRef, hasFetched])

  return {
    recommendations,
    loading,
    error,
    refresh,
    getRecommendations
  }
}

// Specialized hooks for different recommendation types
export function usePersonalizedRecommendations(options: RecommendationOptions = {}) {
  return useRecommendations({
    ...options,
    type: 'personalized',
    autoFetch: true
  })
}

export function useTrendingPlaces(location?: { lat: number; lng: number }, limit = 10) {
  return useRecommendations({
    type: 'trending',
    location,
    limit,
    autoFetch: true
  })
}

export function useContextualRecommendations(
  location: { lat: number; lng: number },
  context: 'morning' | 'afternoon' | 'evening' | 'weekend' | 'date' | 'business',
  options: RecommendationOptions = {}
) {
  return useRecommendations({
    ...options,
    type: 'contextual',
    location,
    context,
    autoFetch: true
  })
}

export function useSimilarUserRecommendations(options: RecommendationOptions = {}) {
  return useRecommendations({
    ...options,
    type: 'similar',
    autoFetch: true
  })
}

// Hook to get current time-based context
export function useCurrentContext(): 'morning' | 'afternoon' | 'evening' | 'weekend' {
  const [context, setContext] = useState<'morning' | 'afternoon' | 'evening' | 'weekend'>('afternoon')

  useEffect(() => {
    const updateContext = () => {
      const now = new Date()
      const hour = now.getHours()
      const day = now.getDay()

      if (day === 0 || day === 6) {
        setContext('weekend')
      } else if (hour >= 5 && hour < 12) {
        setContext('morning')
      } else if (hour >= 12 && hour < 17) {
        setContext('afternoon')
      } else {
        setContext('evening')
      }
    }

    updateContext()
    const interval = setInterval(updateContext, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return context
}

// Hook to get user's current location for recommendations
export function useLocationForRecommendations() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const getCurrentLocation = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported'))
          return
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

      setLocation(newLocation)
      return newLocation
    } catch (err) {
      // Fallback to Abuja coordinates
      const fallbackLocation = { lat: 9.0765, lng: 7.3986 }
      setLocation(fallbackLocation)
      setError(err instanceof Error ? err.message : 'Failed to get location')
      return fallbackLocation
    } finally {
      setLoading(false)
    }
  }, [])

  // Only fetch once on mount
  useEffect(() => {
    if (!hasFetched) {
      setHasFetched(true)
      getCurrentLocation()
    }
  }, [hasFetched, getCurrentLocation])

  return {
    location,
    error,
    loading,
    refetch: getCurrentLocation
  }
}