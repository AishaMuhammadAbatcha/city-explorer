import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Card, Citation, Message, TraceEvent } from '@/types/agent'

interface State {
  messages: Message[]
  loading: boolean
  error: string | null
}

interface ToolCallRow {
  message_id: string
  tool_name: string
  input: unknown
  output: unknown
  duration_ms: number | null
  step_number: number | null
}

function traceFromToolCalls(rows: ToolCallRow[]): TraceEvent[] {
  const sorted = [...rows].sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0))
  const events: TraceEvent[] = []
  for (const r of sorted) {
    const step = r.step_number ?? events.filter((e) => e.kind === 'step_start').length + 1
    events.push({
      kind: 'step_start',
      iteration: step,
      label: step === 1 ? 'Planning' : `Step ${step}`,
    })
    events.push({
      kind: 'tool_call_start',
      tool: r.tool_name,
      input: r.input,
      startedAt: 0,
    })
    const summary = summariseOutput(r.tool_name, r.output)
    events.push({
      kind: 'tool_call_end',
      tool: r.tool_name,
      summary,
      duration_ms: r.duration_ms ?? 0,
    })
  }
  return events
}

function summariseOutput(tool: string, output: unknown): string {
  const o = output as {
    items?: unknown[]
    places?: unknown[]
    videos?: unknown[]
    entities?: unknown[]
    results?: unknown[]
  }
  switch (tool) {
    case 'web_search':
      return `Found ${o?.items?.length ?? 0} articles`
    case 'places_search':
      return `Found ${o?.places?.length ?? 0} places`
    case 'youtube_search':
      return `Found ${o?.videos?.length ?? 0} videos`
    case 'knowledge_graph':
      return `Found ${o?.entities?.length ?? 0} entities`
    case 'geocode':
      return `Geocoded ${o?.results?.length ?? 0} matches`
    default:
      return 'done'
  }
}

export function useConversation(conversationId: string | null) {
  const [state, setState] = useState<State>({ messages: [], loading: false, error: null })

  const fetchMessages = useCallback(async (id: string) => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, citations, cards, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      setState({ messages: [], loading: false, error: error.message })
      return
    }

    const msgRows = data ?? []
    const assistantIds = msgRows.filter((m) => m.role === 'assistant').map((m) => m.id)

    let toolCallsByMsg: Record<string, ToolCallRow[]> = {}
    if (assistantIds.length > 0) {
      const { data: tcRows } = await supabase
        .from('tool_calls')
        .select('message_id, tool_name, input, output, duration_ms, step_number')
        .in('message_id', assistantIds)
        .order('step_number', { ascending: true })
      toolCallsByMsg = (tcRows ?? []).reduce<Record<string, ToolCallRow[]>>((acc, r) => {
        const row = r as ToolCallRow
        acc[row.message_id] = acc[row.message_id] ?? []
        acc[row.message_id].push(row)
        return acc
      }, {})
    }

    const rows: Message[] = msgRows.map((m) => {
      const trace =
        m.role === 'assistant' && toolCallsByMsg[m.id]?.length
          ? traceFromToolCalls(toolCallsByMsg[m.id])
          : undefined
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        citations: Array.isArray(m.citations) ? (m.citations as unknown as Citation[]) : [],
        cards: Array.isArray(m.cards) ? (m.cards as unknown as Card[]) : [],
        trace,
        created_at: m.created_at,
      }
    })
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
