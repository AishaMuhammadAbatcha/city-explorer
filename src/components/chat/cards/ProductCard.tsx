import { useState } from 'react'
import { ShieldCheck, ShoppingBag } from 'lucide-react'
import type { ProductCard as ProductCardType } from '@/types/agent'
import { Button } from '@/components/ui/button'
import { SaveButton } from './SaveButton'

interface ProductCardProps {
  card: ProductCardType
  sourceMessageId?: string
  readOnly?: boolean
}

export function ProductCard({ card, sourceMessageId, readOnly = false }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = !!card.image && !imageFailed
  const contactHref = card.seller_contact
    ? card.seller_contact.includes('@')
      ? `mailto:${card.seller_contact}`
      : `tel:${card.seller_contact.replace(/\s+/g, '')}`
    : null

  return (
    <div className="relative flex flex-col rounded-xl border border-border bg-card overflow-hidden h-full">
      {!readOnly && <SaveButton card={card} sourceMessageId={sourceMessageId} />}
      <div className="relative aspect-square bg-muted">
        {showImage ? (
          <img
            src={card.image}
            alt={card.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h4 className="text-sm font-semibold leading-tight line-clamp-2">{card.title}</h4>
        <div className="flex items-center gap-1.5 text-base">
          <span className="font-bold text-foreground">{card.price ?? '—'}</span>
          {card.verified && card.price && (
            <ShieldCheck
              className="w-3.5 h-3.5 text-emerald-600 shrink-0"
              aria-label="Verified price"
            />
          )}
        </div>
        {card.seller && (
          <p className="text-xs text-muted-foreground truncate">Sold by {card.seller}</p>
        )}
        {contactHref && (
          <a
            href={contactHref}
            className="text-xs text-primary hover:underline truncate"
          >
            {card.seller_contact}
          </a>
        )}
        <div className="mt-auto pt-2">
          <Button size="sm" variant="outline" className="w-full" asChild>
            <a href={card.url} target="_blank" rel="noopener noreferrer">
              View
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
