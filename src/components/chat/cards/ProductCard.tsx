import { ShoppingBag } from 'lucide-react'
import type { ProductCard as ProductCardType } from '@/types/agent'
import { Button } from '@/components/ui/button'

interface ProductCardProps {
  card: ProductCardType
}

export function ProductCard({ card }: ProductCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden h-full">
      <div className="relative aspect-square bg-muted">
        {card.image ? (
          <img
            src={card.image}
            alt={card.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h4 className="text-sm font-semibold leading-tight line-clamp-2">{card.title}</h4>
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">{card.price ?? '—'}</span>
          {card.seller && <span className="text-muted-foreground truncate ml-2">{card.seller}</span>}
        </div>
        {!card.price && (
          <p className="text-[10px] text-muted-foreground italic">
            Coming soon — price accuracy improving in Phase 4
          </p>
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
