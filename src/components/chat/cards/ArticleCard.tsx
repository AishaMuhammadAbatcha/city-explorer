import type { ArticleCard as ArticleCardType } from '@/types/agent'
import { SaveButton } from './SaveButton'

interface ArticleCardProps {
  card: ArticleCardType
  sourceMessageId?: string
}

export function ArticleCard({ card, sourceMessageId }: ArticleCardProps) {
  const favicon = card.display_link
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(card.display_link)}&sz=64`
    : ''
  return (
    <div className="relative h-full">
      <SaveButton card={card} sourceMessageId={sourceMessageId} />
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col rounded-xl border border-border bg-card p-3 gap-2 hover:border-primary transition-colors h-full"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {favicon ? (
          <img src={favicon} alt="" className="w-4 h-4 rounded-sm" loading="lazy" />
        ) : (
          <div className="w-4 h-4 rounded-sm bg-muted" />
        )}
        <span className="truncate">{card.display_link}</span>
        {card.source === 'kg' && (
          <span className="ml-auto shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 uppercase tracking-wide">
            KG
          </span>
        )}
      </div>
      <h4 className="text-sm font-semibold leading-tight line-clamp-2">{card.title}</h4>
      {card.snippet && (
        <p className="text-xs text-muted-foreground line-clamp-2">{card.snippet}</p>
      )}
    </a>
    </div>
  )
}
