import type { Message } from '@/types/agent'
import { AnswerCard } from './AnswerCard'
import { StepTrace } from './StepTrace'
import { CardGrid } from './cards'

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

  const trace = message.trace ?? []

  return (
    <div className="flex flex-col items-start gap-3 w-full">
      <div className="max-w-[90%] rounded-2xl bg-muted px-4 py-3 w-full">
        {trace.length > 0 && (
          <div className="mb-3">
            <StepTrace trace={trace} streaming={pending === true} />
          </div>
        )}
        <AnswerCard content={message.content} citations={message.citations} pending={pending} />
      </div>
      {message.cards.length > 0 && (
        <div className="w-full">
          <CardGrid cards={message.cards} />
        </div>
      )}
    </div>
  )
}
