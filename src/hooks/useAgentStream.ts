import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AgentSSEEvent } from '@/types/agent'

export interface AgentStreamHandle {
  stream: AsyncIterable<AgentSSEEvent>
  abort: () => void
}

export interface SendMessageOptions {
  message: string
  conversationId: string | null
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

async function* parseSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<AgentSSEEvent, void, unknown> {
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      for (const line of frame.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (!payload) continue
        try {
          const event = JSON.parse(payload) as AgentSSEEvent
          yield event
        } catch {
          // Ignore malformed frames; the stream recovers on the next one.
        }
      }
    }
  }
}

export function useAgentStream() {
  const sendMessage = useCallback(
    async ({ message, conversationId }: SendMessageOptions): Promise<AgentStreamHandle> => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('not authenticated')

      const controller = new AbortController()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message, conversation_id: conversationId }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '')
        throw new Error(`agent-run failed: ${res.status} ${text}`)
      }
      const reader = res.body.getReader()

      return {
        stream: parseSSE(reader),
        abort: () => {
          controller.abort()
          reader.cancel().catch(() => undefined)
        },
      }
    },
    [],
  )

  return { sendMessage }
}
