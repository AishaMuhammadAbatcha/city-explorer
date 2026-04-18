import type { Card } from '@/types/agent'
import { PlaceCard } from './PlaceCard'
import { VideoCard } from './VideoCard'
import { ArticleCard } from './ArticleCard'
import { ProductCard } from './ProductCard'

interface CardGridProps {
  cards: Card[]
}

const KIND_ORDER: Card['kind'][] = ['place', 'video', 'product', 'article']

export function CardGrid({ cards }: CardGridProps) {
  if (cards.length === 0) return null

  const grouped: Record<Card['kind'], Card[]> = {
    place: [],
    video: [],
    article: [],
    product: [],
  }
  for (const c of cards) grouped[c.kind].push(c)

  return (
    <div className="space-y-3">
      {KIND_ORDER.filter((k) => grouped[k].length > 0).map((kind) => (
        <div
          key={kind}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {grouped[kind].map((c) => {
            switch (c.kind) {
              case 'place':
                return <PlaceCard key={`${c.kind}:${c.id}`} card={c} />
              case 'video':
                return <VideoCard key={`${c.kind}:${c.id}`} card={c} />
              case 'article':
                return <ArticleCard key={`${c.kind}:${c.id}`} card={c} />
              case 'product':
                return <ProductCard key={`${c.kind}:${c.id}`} card={c} />
            }
          })}
        </div>
      ))}
    </div>
  )
}
