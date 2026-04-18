import type { Message } from '@/types/agent'
import { AnswerCard } from './AnswerCard'

interface MessageBubbleProps {
  message: Message
  pending?: boolean
}

export function MessageBubble({ message, pending }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-sm whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl bg-muted px-4 py-3">
        <AnswerCard content={message.content} citations={message.citations} pending={pending} />
      </div>
    </div>
  )
}
