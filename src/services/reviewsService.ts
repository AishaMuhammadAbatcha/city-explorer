import { supabase, type Tables } from '@/lib/supabase'

export type Review = Tables<'reviews'> & {
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  }
  business_response?: string | null
  business_response_date?: string | null
}

export class ReviewsService {
  // Get reviews for a specific business
  static async getBusinessReviews(businessId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch reviews: ${error.message}`)
    }

    return data
  }

  // Get a single review by ID
  static async getReview(reviewId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles:user_id (
          full_name,
          avatar_url
        ),
        businesses (
          name
        )
      `)
      .eq('id', reviewId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch review: ${error.message}`)
    }

    return data
  }

  // Create a new review (for individual users)
  static async createReview(
    businessId: string,
    userId: string,
    rating: number,
    comment?: string
  ) {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        business_id: businessId,
        user_id: userId,
        rating,
        comment
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create review: ${error.message}`)
    }

    return data
  }

  // Update a review
  static async updateReview(reviewId: string, updates: {
    rating?: number
    comment?: string
  }) {
    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update review: ${error.message}`)
    }

    return data
  }

  // Delete a review
  static async deleteReview(reviewId: string) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      throw new Error(`Failed to delete review: ${error.message}`)
    }
  }

  // Get reviews by user
  static async getUserReviews(userId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        businesses (
          name,
          image_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user reviews: ${error.message}`)
    }

    return data
  }
}
