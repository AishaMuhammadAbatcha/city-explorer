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
          phone?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          citations: Json
          cards: Json
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          citations?: Json
          cards?: Json
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          citations?: Json
          cards?: Json
          created_at?: string
        }
      }
      tool_calls: {
        Row: {
          id: string
          message_id: string
          tool_name: string
          input: Json
          output: Json
          duration_ms: number | null
          cost_usd: number
          status: 'success' | 'error' | 'timeout'
          error_message: string | null
          step_number: number | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          tool_name: string
          input?: Json
          output?: Json
          duration_ms?: number | null
          cost_usd?: number
          status: 'success' | 'error' | 'timeout'
          error_message?: string | null
          step_number?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          tool_name?: string
          input?: Json
          output?: Json
          duration_ms?: number | null
          cost_usd?: number
          status?: 'success' | 'error' | 'timeout'
          error_message?: string | null
          step_number?: number | null
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          default_location: string | null
          currency: string | null
          search_radius_m: number | null
          price_range_min: number | null
          price_range_max: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          default_location?: string | null
          currency?: string | null
          search_radius_m?: number | null
          price_range_min?: number | null
          price_range_max?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          default_location?: string | null
          currency?: string | null
          search_radius_m?: number | null
          price_range_min?: number | null
          price_range_max?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_results: {
        Row: {
          id: string
          user_id: string
          card: Json
          note: string | null
          source_message_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card: Json
          note?: string | null
          source_message_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card?: Json
          note?: string | null
          source_message_id?: string | null
          created_at?: string
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
      [_ in never]: never
    }
  }
}
