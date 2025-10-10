import { supabase } from '@/lib/supabase'
import type { GooglePlace } from './maps/placesService'
import { placesService } from './maps/placesService'
import type { Tables } from '@/lib/supabase'

type Business = Tables<'businesses'>
type Review = Tables<'reviews'>
type Favorite = Tables<'favorites'>
type Profile = Tables<'profiles'>

export interface RecommendationScore {
  placeId: string
  score: number
  reasons: string[]
  place?: GooglePlace
  business?: Business
}

export interface UserPreferences {
  favoriteCategories: string[]
  priceRange: number[]
  averageRating: number
  locationPreference: { lat: number; lng: number; radius: number } | null
  timePreferences: string[]
  dietaryRestrictions?: string[]
  accessibility?: boolean
}

export interface RecommendationOptions {
  limit?: number
  categories?: string[]
  location?: { lat: number; lng: number; radius?: number }
  excludeVisited?: boolean
  priceRange?: number[]
  minRating?: number
}

class RecommendationsService {
  private userPreferencesCache = new Map<string, UserPreferences>()
  private recommendationsCache = new Map<string, RecommendationScore[]>()
  private cacheExpiry = 30 * 60 * 1000 // 30 minutes

  // Analyze user's past behavior to build preferences
  async analyzeUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // Check cache first
      const cached = this.userPreferencesCache.get(userId)
      if (cached) return cached

      const [favorites, reviews, profile] = await Promise.all([
        this.getUserFavorites(userId),
        this.getUserReviews(userId),
        this.getUserProfile(userId)
      ])

      const preferences = this.buildUserPreferences(favorites, reviews, profile)

      // Cache preferences
      this.userPreferencesCache.set(userId, preferences)
      setTimeout(() => this.userPreferencesCache.delete(userId), this.cacheExpiry)

      return preferences
    } catch (error) {
      console.error('Error analyzing user preferences:', error)
      return this.getDefaultPreferences()
    }
  }

  // Get personalized recommendations for a user
  async getPersonalizedRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<RecommendationScore[]> {
    try {
      const cacheKey = `${userId}-${JSON.stringify(options)}`
      const cached = this.recommendationsCache.get(cacheKey)
      if (cached) return cached

      const preferences = await this.analyzeUserPreferences(userId)
      const recommendations = await this.generateRecommendations(preferences, options)

      // Cache recommendations
      this.recommendationsCache.set(cacheKey, recommendations)
      setTimeout(() => this.recommendationsCache.delete(cacheKey), this.cacheExpiry)

      return recommendations
    } catch (error) {
      console.error('Error getting personalized recommendations:', error)
      return []
    }
  }

  // Get trending places based on recent activity
  async getTrendingPlaces(
    location?: { lat: number; lng: number },
    limit = 10
  ): Promise<RecommendationScore[]> {
    try {
      const [recentReviews, recentFavorites] = await Promise.all([
        this.getRecentReviews(limit * 2),
        this.getRecentFavorites(limit * 2)
      ])

      const trendingScores = this.calculateTrendingScores(recentReviews, recentFavorites)
      const googlePlaces = await this.enrichWithGooglePlaces(trendingScores, location)

      return googlePlaces
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting trending places:', error)
      return []
    }
  }

  // Get recommendations for similar users (collaborative filtering)
  async getSimilarUserRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<RecommendationScore[]> {
    try {
      const userPreferences = await this.analyzeUserPreferences(userId)
      const similarUsers = await this.findSimilarUsers(userId, userPreferences)

      if (similarUsers.length === 0) {
        return this.getPersonalizedRecommendations(userId, options)
      }

      const recommendations = await this.aggregateSimilarUserPreferences(
        similarUsers,
        options
      )

      return recommendations
    } catch (error) {
      console.error('Error getting similar user recommendations:', error)
      return []
    }
  }

  // Get recommendations based on location and context
  async getContextualRecommendations(
    location: { lat: number; lng: number },
    context: 'morning' | 'afternoon' | 'evening' | 'weekend' | 'date' | 'business',
    options: RecommendationOptions = {}
  ): Promise<RecommendationScore[]> {
    try {
      const contextualCategories = this.getContextualCategories(context)
      const places = await placesService.getPlacesByCategory(
        contextualCategories[0],
        location
      )

      const scores = places.map(place => ({
        placeId: place.place_id,
        score: this.calculateContextualScore(place, context),
        reasons: this.getContextualReasons(place, context),
        place
      }))

      return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, options.limit || 10)
    } catch (error) {
      console.error('Error getting contextual recommendations:', error)
      return []
    }
  }

  // Private helper methods
  private async getUserFavorites(userId: string): Promise<(Favorite & { business: Business })[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        business:businesses(*)
      `)
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  private async getUserReviews(userId: string): Promise<(Review & { business: Business })[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        business:businesses(*)
      `)
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  private async getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  private buildUserPreferences(
    favorites: any[],
    reviews: any[],
    profile: Profile | null
  ): UserPreferences {
    const categoryCount: Record<string, number> = {}
    const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0)

    // Analyze favorite categories
    favorites.forEach(fav => {
      if (fav.business?.category) {
        categoryCount[fav.business.category] = (categoryCount[fav.business.category] || 0) + 2
      }
    })

    // Analyze reviewed categories
    reviews.forEach(review => {
      if (review.business?.category) {
        categoryCount[review.business.category] = (categoryCount[review.business.category] || 0) + 1
      }
    })

    const favoriteCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category)

    return {
      favoriteCategories: favoriteCategories.length > 0 ? favoriteCategories : ['restaurant'],
      priceRange: [1, 4],
      averageRating: reviews.length > 0 ? ratingSum / reviews.length : 4,
      locationPreference: profile?.city ? null : null, // Would need geocoding
      timePreferences: ['evening', 'weekend']
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      favoriteCategories: ['restaurant', 'cafe', 'entertainment'],
      priceRange: [1, 3],
      averageRating: 4,
      locationPreference: null,
      timePreferences: ['evening', 'weekend']
    }
  }

  private async generateRecommendations(
    preferences: UserPreferences,
    options: RecommendationOptions
  ): Promise<RecommendationScore[]> {
    const recommendations: RecommendationScore[] = []
    const categories = options.categories || preferences.favoriteCategories

    for (const category of categories.slice(0, 3)) {
      try {
        const places = await placesService.getPlacesByCategory(
          category,
          options.location
        )

        const categoryRecs = places
          .filter(place => this.meetsUserCriteria(place, preferences, options))
          .map(place => ({
            placeId: place.place_id,
            score: this.calculatePersonalizedScore(place, preferences),
            reasons: this.generateReasons(place, preferences),
            place
          }))

        recommendations.push(...categoryRecs)
      } catch (error) {
        console.error(`Error getting places for category ${category}:`, error)
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 10)
  }

  private meetsUserCriteria(
    place: GooglePlace,
    preferences: UserPreferences,
    options: RecommendationOptions
  ): boolean {
    // Rating filter
    if (place.rating && place.rating < (options.minRating || preferences.averageRating - 0.5)) {
      return false
    }

    // Price level filter
    if (place.price_level && options.priceRange) {
      if (place.price_level < options.priceRange[0] || place.price_level > options.priceRange[1]) {
        return false
      }
    }

    return true
  }

  private calculatePersonalizedScore(place: GooglePlace, preferences: UserPreferences): number {
    let score = 0

    // Base score from rating
    if (place.rating) {
      score += (place.rating / 5) * 40
    }

    // Popularity score
    if (place.user_ratings_total) {
      score += Math.min(place.user_ratings_total / 100, 1) * 20
    }

    // Category preference boost
    const placeCategories = place.types || []
    const categoryBoost = placeCategories.some(type =>
      preferences.favoriteCategories.some(prefCat =>
        type.includes(prefCat) || prefCat.includes(type.replace(/_/g, ' '))
      )
    ) ? 25 : 0
    score += categoryBoost

    // Price preference
    if (place.price_level && preferences.priceRange) {
      const [minPrice, maxPrice] = preferences.priceRange
      if (place.price_level >= minPrice && place.price_level <= maxPrice) {
        score += 15
      }
    }

    return Math.round(score)
  }

  private generateReasons(place: GooglePlace, preferences: UserPreferences): string[] {
    const reasons: string[] = []

    if (place.rating && place.rating >= 4.5) {
      reasons.push('Highly rated by users')
    }

    if (place.user_ratings_total && place.user_ratings_total > 100) {
      reasons.push('Popular among visitors')
    }

    const placeCategories = place.types || []
    if (placeCategories.some(type => preferences.favoriteCategories.includes(type))) {
      reasons.push('Matches your interests')
    }

    if (place.opening_hours?.open_now) {
      reasons.push('Currently open')
    }

    return reasons
  }

  private async getRecentReviews(limit: number): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  private async getRecentFavorites(limit: number): Promise<Favorite[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  private calculateTrendingScores(
    reviews: Review[],
    favorites: Favorite[]
  ): Map<string, { score: number; businessId: string }> {
    const scores = new Map<string, { score: number; businessId: string }>()

    // Weight recent reviews
    reviews.forEach(review => {
      const businessId = review.business_id
      const daysSinceReview = (Date.now() - new Date(review.created_at).getTime()) / (1000 * 60 * 60 * 24)
      const timeWeight = Math.max(0, 1 - daysSinceReview / 7) // Decay over 7 days
      const ratingWeight = review.rating / 5
      const score = timeWeight * ratingWeight * 10

      const existing = scores.get(businessId) || { score: 0, businessId }
      scores.set(businessId, { ...existing, score: existing.score + score })
    })

    // Weight recent favorites
    favorites.forEach(favorite => {
      const businessId = favorite.business_id
      const daysSinceFavorite = (Date.now() - new Date(favorite.created_at).getTime()) / (1000 * 60 * 60 * 24)
      const timeWeight = Math.max(0, 1 - daysSinceFavorite / 7)
      const score = timeWeight * 15

      const existing = scores.get(businessId) || { score: 0, businessId }
      scores.set(businessId, { ...existing, score: existing.score + score })
    })

    return scores
  }

  private async enrichWithGooglePlaces(
    trendingScores: Map<string, { score: number; businessId: string }>,
    location?: { lat: number; lng: number }
  ): Promise<RecommendationScore[]> {
    const recommendations: RecommendationScore[] = []

    for (const [businessId, { score }] of trendingScores) {
      try {
        // Get business details
        const { data: business } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single()

        if (business) {
          // Try to get Google Place data if google_place_id exists
          let googlePlace: GooglePlace | undefined
          if (business.google_place_id) {
            try {
              const placeData = await placesService.getPlaceDetails(business.google_place_id)
              if (placeData) {
                googlePlace = placeData
              }
            } catch (error) {
              console.error('Error fetching Google Place details:', error)
            }
          }

          recommendations.push({
            placeId: businessId,
            score,
            reasons: ['Trending in your area', 'Popular recently'],
            business,
            place: googlePlace
          })
        }
      } catch (error) {
        console.error('Error enriching with business data:', error)
      }
    }

    // If we have fewer than 5 recommendations, add some from Google Places
    if (recommendations.length < 5 && location) {
      try {
        const additionalPlaces = await placesService.searchNearbyPlaces({
          location,
          radius: 5000,
          type: 'restaurant'
        })

        const additionalRecs = additionalPlaces.slice(0, 5 - recommendations.length).map(place => ({
          placeId: place.place_id,
          score: place.rating ? (place.rating / 5) * 80 : 40,
          reasons: ['Popular in your area', place.rating ? 'Highly rated' : 'Worth checking out'],
          place
        }))

        recommendations.push(...additionalRecs)
      } catch (error) {
        console.error('Error adding additional Google Places:', error)
      }
    }

    return recommendations
  }

  private async findSimilarUsers(userId: string, preferences: UserPreferences): Promise<string[]> {
    // Simplified similarity - users who liked similar categories
    const { data: users, error } = await supabase
      .from('favorites')
      .select('user_id, business:businesses(category)')
      .neq('user_id', userId)

    if (error) return []

    const userCategoryMap = new Map<string, Set<string>>()

    users?.forEach(fav => {
      if (fav.business?.category) {
        if (!userCategoryMap.has(fav.user_id)) {
          userCategoryMap.set(fav.user_id, new Set())
        }
        userCategoryMap.get(fav.user_id)!.add(fav.business.category)
      }
    })

    const similarUsers: string[] = []
    for (const [otherUserId, categories] of userCategoryMap) {
      const overlap = preferences.favoriteCategories.filter(cat => categories.has(cat))
      if (overlap.length >= 2) {
        similarUsers.push(otherUserId)
      }
    }

    return similarUsers.slice(0, 10)
  }

  private async aggregateSimilarUserPreferences(
    similarUsers: string[],
    options: RecommendationOptions
  ): Promise<RecommendationScore[]> {
    const businessScores = new Map<string, number>()

    for (const userId of similarUsers) {
      const { data: favorites } = await supabase
        .from('favorites')
        .select('business_id')
        .eq('user_id', userId)

      favorites?.forEach(fav => {
        const current = businessScores.get(fav.business_id) || 0
        businessScores.set(fav.business_id, current + 1)
      })
    }

    const recommendations: RecommendationScore[] = []
    for (const [businessId, score] of businessScores) {
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()

      if (business) {
        recommendations.push({
          placeId: businessId,
          score: score * 10,
          reasons: ['Liked by similar users', 'Community favorite'],
          business
        })
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 10)
  }

  private getContextualCategories(context: string): string[] {
    const contextMap = {
      morning: ['cafe', 'breakfast', 'bakery'],
      afternoon: ['restaurant', 'cafe', 'shopping_mall'],
      evening: ['restaurant', 'bar', 'entertainment'],
      weekend: ['entertainment', 'shopping_mall', 'amusement_park'],
      date: ['restaurant', 'movie_theater', 'park'],
      business: ['restaurant', 'cafe', 'meeting_room']
    }

    return contextMap[context as keyof typeof contextMap] || ['restaurant']
  }

  private calculateContextualScore(place: GooglePlace, context: string): number {
    let score = place.rating ? (place.rating / 5) * 60 : 30

    // Context-specific scoring
    const types = place.types || []

    if (context === 'morning' && types.some(t => ['cafe', 'breakfast', 'bakery'].includes(t))) {
      score += 30
    }

    if (context === 'evening' && types.some(t => ['restaurant', 'bar', 'night_club'].includes(t))) {
      score += 30
    }

    if (context === 'date' && place.price_level && place.price_level >= 3) {
      score += 20
    }

    return Math.round(score)
  }

  private getContextualReasons(place: GooglePlace, context: string): string[] {
    const reasons = ['Perfect for this time']

    if (place.rating && place.rating >= 4.5) {
      reasons.push('Highly rated')
    }

    if (context === 'date' && place.price_level && place.price_level >= 3) {
      reasons.push('Great for special occasions')
    }

    return reasons
  }
}

export const recommendationsService = new RecommendationsService()
export default recommendationsService