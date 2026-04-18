import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Citation, Message } from '@/types/agent'

interface State {
  messages: Message[]
  loading: boolean
  error: string | null
}

export function useConversation(conversationId: string | null) {
  const [state, setState] = useState<State>({ messages: [], loading: false, error: null })

  const fetchMessages = useCallback(async (id: string) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, citations, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      setState({ messages: [], loading: false, error: error.message })
      return
    }
    const rows = (data ?? []).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      citations: Array.isArray(m.citations) ? (m.citations as unknown as Citation[]) : [],
      created_at: m.created_at,
    }))
    setState({ messages: rows, loading: false, error: null })
  }, [])

  useEffect(() => {
    if (!conversationId) {
      setState({ messages: [], loading: false, error: null })
      return
    }
    fetchMessages(conversationId)
  }, [conversationId, fetchMessages])

  const refetch = useCallback(() => {
    if (conversationId) fetchMessages(conversationId)
  }, [conversationId, fetchMessages])

  const appendLocal = useCallback((msg: Message) => {
    setState((s) => ({ ...s, messages: [...s.messages, msg] }))
  }, [])

  const replaceLast = useCallback((updater: (last: Message) => Message) => {
    setState((s) => {
      if (s.messages.length === 0) return s
      const next = [...s.messages]
      next[next.length - 1] = updater(next[next.length - 1])
      return { ...s, messages: next }
    })
  }, [])

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    refetch,
    appendLocal,
    replaceLast,
  }
}
