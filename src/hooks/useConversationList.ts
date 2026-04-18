import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface ConversationRow {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

interface Options {
  limit?: number
}

export function useConversationList({ limit = 50 }: Options = {}) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchList = useCallback(async () => {
    if (!user) {
      setConversations([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit)
    if (error) {
      console.error('useConversationList fetch error:', error.message)
      setConversations([])
      setLoading(false)
      return
    }
    setConversations(data ?? [])
    setLoading(false)
  }, [user, limit])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('conversations').delete().eq('id', id)
      if (error) {
        console.error('conversations delete error:', error.message)
        return { error: new Error(error.message) }
      }
      setConversations((prev) => prev.filter((c) => c.id !== id))
      return { error: null }
    },
    [],
  )

  return { conversations, loading, remove, refetch: fetchList }
}
