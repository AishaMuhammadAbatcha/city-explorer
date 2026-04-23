import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (import.meta.env.DEV) {
  console.log('Supabase configuration:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length || 0
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  const error = new Error(`Missing Supabase environment variables: ${!supabaseUrl ? 'VITE_SUPABASE_URL' : ''} ${!supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : ''}`)
  console.error(error);
  throw error;
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]