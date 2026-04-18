import { useEffect, useRef } from 'react'
import type { Message } from '@/types/agent'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  streamingId: string | null
}

export function MessageList({ messages, streamingId }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} pending={m.id === streamingId} />
      ))}
      <div ref={endRef} />
    </div>
  )
}
