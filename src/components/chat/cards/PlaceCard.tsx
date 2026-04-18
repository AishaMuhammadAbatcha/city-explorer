import { MapPin, Star, Navigation } from 'lucide-react'
import type { PlaceCard as PlaceCardType } from '@/types/agent'
import { Button } from '@/components/ui/button'
import { SaveButton } from './SaveButton'

interface PlaceCardProps {
  card: PlaceCardType
  sourceMessageId?: string
}

function Stars({ rating, count }: { rating?: number; count?: number }) {
  if (typeof rating !== 'number') return null
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
      <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
      {typeof count === 'number' && count > 0 && <span>· {count.toLocaleString()} reviews</span>}
    </div>
  )
}

export function PlaceCard({ card, sourceMessageId }: PlaceCardProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination_place_id=${encodeURIComponent(
    card.place_id,
  )}&destination=${encodeURIComponent(card.name)}`
  return (
    <div className="relative flex flex-col rounded-xl border border-border bg-card p-3 gap-2 h-full">
      <SaveButton card={card} sourceMessageId={sourceMessageId} />
      <div className="flex items-start justify-between gap-2 pr-8">
        <h4 className="text-sm font-semibold leading-tight line-clamp-2">{card.name}</h4>
      </div>
      <Stars rating={card.rating} count={card.rating_count} />
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span className="line-clamp-2">{card.address}</span>
      </div>
      {card.snippet && <p className="text-xs text-muted-foreground line-clamp-2">{card.snippet}</p>}
      <div className="mt-auto flex gap-2 pt-1">
        <Button size="sm" variant="outline" className="flex-1" asChild>
          <a href={card.maps_url} target="_blank" rel="noopener noreferrer">
            Open in Maps
          </a>
        </Button>
        <Button size="sm" className="flex-1" asChild>
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            <Navigation className="w-3.5 h-3.5 mr-1" />
            Directions
          </a>
        </Button>
      </div>
    </div>
  )
}
