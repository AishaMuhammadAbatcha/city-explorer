export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'individual' | 'business' | 'admin'
          phone: string | null
          address: string | null
          city: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'individual' | 'business' | 'admin'
          phone?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'individual' | 'business' | 'admin'
          phone?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          category: string
          address: string
          city: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          email: string | null
          website: string | null
          opening_hours: Json | null
          image_url: string | null
          verified: boolean
          rating: number
          total_reviews: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          category: string
          address: string
          city: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          website?: string | null
          opening_hours?: Json | null
          image_url?: string | null
          verified?: boolean
          rating?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          category?: string
          address?: string
          city?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          website?: string | null
          opening_hours?: Json | null
          image_url?: string | null
          verified?: boolean
          rating?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          business_id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          location: string
          image_url: string | null
          price: number | null
          capacity: number | null
          registered_count: number
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          location: string
          image_url?: string | null
          price?: number | null
          capacity?: number | null
          registered_count?: number
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          location?: string
          image_url?: string | null
          price?: number | null
          capacity?: number | null
          registered_count?: number
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          business_id: string
          rating: number
          comment: string | null
          business_response: string | null
          business_response_date: string | null
          business_response_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          rating: number
          comment?: string | null
          business_response?: string | null
          business_response_date?: string | null
          business_response_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          rating?: number
          comment?: string | null
          business_response?: string | null
          business_response_date?: string | null
          business_response_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          business_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          created_at?: string
        }
      }
      event_registrations: {
        Row: {
          id: string
          user_id: string
          event_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          read: boolean
          created_at: string
          expires_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          read?: boolean
          created_at?: string
          expires_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          read?: boolean
          created_at?: string
          expires_at?: string | null
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          business_id: string
          title: string
          description: string | null
          discount: string
          discount_percentage: number | null
          valid_from: string
          valid_until: string
          terms_and_conditions: string | null
          max_redemptions: number | null
          current_redemptions: number
          status: 'active' | 'expired' | 'paused' | 'draft'
          image_url: string | null
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          description?: string | null
          discount: string
          discount_percentage?: number | null
          valid_from?: string
          valid_until: string
          terms_and_conditions?: string | null
          max_redemptions?: number | null
          current_redemptions?: number
          status?: 'active' | 'expired' | 'paused' | 'draft'
          image_url?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          description?: string | null
          discount?: string
          discount_percentage?: number | null
          valid_from?: string
          valid_until?: string
          terms_and_conditions?: string | null
          max_redemptions?: number | null
          current_redemptions?: number
          status?: 'active' | 'expired' | 'paused' | 'draft'
          image_url?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          business_id: string
          date: string
          time: string
          party_size: number
          special_requests: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          confirmation_code: string
          contact_info: Json
          created_at: string
          updated_at: string
          business?: {
            name: string
            address: string
            phone: string | null
          }
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          date: string
          time: string
          party_size: number
          special_requests?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          confirmation_code: string
          contact_info: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          date?: string
          time?: string
          party_size?: number
          special_requests?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
          confirmation_code?: string
          contact_info?: Json
          created_at?: string
          updated_at?: string
        }
      }
      business_booking_settings: {
        Row: {
          id: string
          business_id: string
          booking_enabled: boolean
          advance_booking_days: number
          min_party_size: number
          max_party_size: number
          booking_window_start: string
          booking_window_end: string
          time_slot_duration: number
          slots_per_time: number
          days_of_week: number[]
          special_dates: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          booking_enabled?: boolean
          advance_booking_days?: number
          min_party_size?: number
          max_party_size?: number
          booking_window_start?: string
          booking_window_end?: string
          time_slot_duration?: number
          slots_per_time?: number
          days_of_week?: number[]
          special_dates?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          booking_enabled?: boolean
          advance_booking_days?: number
          min_party_size?: number
          max_party_size?: number
          booking_window_start?: string
          booking_window_end?: string
          time_slot_duration?: number
          slots_per_time?: number
          days_of_week?: number[]
          special_dates?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'individual' | 'business' | 'admin'
    }
  }
}