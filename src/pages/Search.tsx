import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { ChatInput } from '@/components/chat/ChatInput'
import { MessageList } from '@/components/chat/MessageList'
import { useAgentStream } from '@/hooks/useAgentStream'
import { useConversation } from '@/hooks/useConversation'
import type { Message, TraceEvent } from '@/types/agent'

function tempId() {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const conversationParam = searchParams.get('c')

  const [conversationId, setConversationId] = useState<string | null>(conversationParam)
  const { messages, appendLocal, replaceLast, refetch } = useConversation(conversationId)
  const [streaming, setStreaming] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const { sendMessage } = useAgentStream()
  const abortRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setConversationId(conversationParam)
  }, [conversationParam])

  useEffect(
    () => () => {
      abortRef.current?.()
    },
    [],
  )

  const handleSend = useCallback(
    async (message: string) => {
      if (streaming) return

      const userMsg: Message = {
        id: tempId(),
        role: 'user',
        content: message,
        citations: [],
        cards: [],
        created_at: new Date().toISOString(),
      }
      const assistantId = tempId()
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        citations: [],
        cards: [],
        trace: [],
        created_at: new Date().toISOString(),
      }
      appendLocal(userMsg)
      appendLocal(assistantMsg)
      setStreamingId(assistantId)
      setStreaming(true)

      const streamStart = Date.now()

      const appendTrace = (event: TraceEvent) => {
        replaceLast((last) =>
          last.id === assistantId ? { ...last, trace: [...(last.trace ?? []), event] } : last,
        )
      }

      try {
        const handle = await sendMessage({ message, conversationId })
        abortRef.current = handle.abort

        let accumulated = ''

        for await (const event of handle.stream) {
          switch (event.type) {
            case 'conversation_id': {
              if (!conversationId) {
                setConversationId(event.id)
                setSearchParams({ c: event.id }, { replace: true })
              }
              break
            }
            case 'step_start':
              appendTrace({ kind: 'step_start', iteration: event.iteration, label: event.label })
              break
            case 'tool_call_start':
              appendTrace({
                kind: 'tool_call_start',
                tool: event.tool,
                input: event.input,
                startedAt: Date.now(),
              })
              break
            case 'tool_call_end':
              appendTrace({
                kind: 'tool_call_end',
                tool: event.tool,
                summary: event.summary ?? 'done',
                duration_ms: event.duration_ms,
              })
              break
            case 'token': {
              accumulated += event.text
              replaceLast((last) =>
                last.id === assistantId ? { ...last, content: accumulated } : last,
              )
              break
            }
            case 'done':
              appendTrace({ kind: 'done', totalMs: Date.now() - streamStart })
              break
            case 'error':
              toast.error(event.message || 'Something went wrong.')
              break
          }
        }
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err)
        toast.error(detail)
      } finally {
        setStreaming(false)
        setStreamingId(null)
        abortRef.current = null
        refetch()
      }
    },
    [appendLocal, conversationId, refetch, replaceLast, sendMessage, setSearchParams, streaming],
  )

  const showEmpty = useMemo(() => messages.length === 0 && !streaming, [messages.length, streaming])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto w-full">
      {showEmpty ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Ask me anything</h1>
            <p className="text-muted-foreground text-sm">
              Products, places, facts — grounded in real sources.
            </p>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} streamingId={streamingId} />
      )}
      <ChatInput onSend={handleSend} disabled={streaming} />
    </div>
  )
}
