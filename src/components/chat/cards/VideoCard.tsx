import { Play } from 'lucide-react'
import type { VideoCard as VideoCardType } from '@/types/agent'
import { SaveButton } from './SaveButton'

interface VideoCardProps {
  card: VideoCardType
  sourceMessageId?: string
}

function relativeTime(iso?: string): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return 'today'
  if (diff < 30 * day) return `${Math.round(diff / day)}d ago`
  if (diff < 365 * day) return `${Math.round(diff / (30 * day))}mo ago`
  return `${Math.round(diff / (365 * day))}y ago`
}

export function VideoCard({ card, sourceMessageId }: VideoCardProps) {
  return (
    <div className="relative h-full">
      <SaveButton card={card} sourceMessageId={sourceMessageId} />
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary transition-colors h-full"
    >
      <div className="relative aspect-video bg-muted">
        {card.thumbnail ? (
          <img
            src={card.thumbnail}
            alt={card.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
          <div className="rounded-full bg-black/60 p-3">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h4 className="text-sm font-semibold leading-tight line-clamp-2">{card.title}</h4>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="truncate">{card.channel}</span>
          {card.published_at && (
            <>
              <span>·</span>
              <span className="whitespace-nowrap">{relativeTime(card.published_at)}</span>
            </>
          )}
        </div>
      </div>
    </a>
    </div>
  )
}
