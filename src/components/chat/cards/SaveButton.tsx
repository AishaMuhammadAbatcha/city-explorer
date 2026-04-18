import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import type { Card } from '@/types/agent'
import { useAuth } from '@/contexts/AuthContext'
import { useSavedResults } from '@/hooks/useSavedResults'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SaveButtonProps {
  card: Card
  sourceMessageId?: string
}

export function SaveButton({ card, sourceMessageId }: SaveButtonProps) {
  const { isAnonymous } = useAuth()
  const { isSaved, save, remove } = useSavedResults()
  const [busy, setBusy] = useState(false)

  if (isAnonymous) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="absolute top-2 right-2 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1.5 text-muted-foreground opacity-70 cursor-default"
            aria-label="Sign in to save"
          >
            <Bookmark className="w-4 h-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">Sign in to save</TooltipContent>
      </Tooltip>
    )
  }

  const existing = isSaved(card)
  const saved = !!existing

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    if (saved && existing) {
      await remove(existing.id)
    } else {
      await save(card, sourceMessageId)
    }
    setBusy(false)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={saved ? 'Remove bookmark' : 'Save bookmark'}
      aria-pressed={saved}
      className={cn(
        'absolute top-2 right-2 z-10 rounded-full bg-background/85 backdrop-blur-sm p-1.5 shadow-sm transition-colors',
        'hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        saved ? 'text-primary' : 'text-muted-foreground',
        busy && 'opacity-60 cursor-wait',
      )}
    >
      {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
    </button>
  )
}
