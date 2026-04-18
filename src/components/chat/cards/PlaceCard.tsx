import { MapPin, Star, Navigation } from 'lucide-react'
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import type { PlaceCard as PlaceCardType } from '@/types/agent'
import { Button } from '@/components/ui/button'
import { useGeolocation } from '@/hooks/useGeolocation'
import { SaveButton } from './SaveButton'

interface PlaceCardProps {
  card: PlaceCardType
  sourceMessageId?: string
  readOnly?: boolean
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const MAP_ID = import.meta.env.VITE_MAP_ID as string | undefined
const MAPS_ENABLED = Boolean(GOOGLE_MAPS_API_KEY && MAP_ID)

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

export function PlaceCard({ card, sourceMessageId, readOnly = false }: PlaceCardProps) {
  const { request: requestLocation } = useGeolocation()

  const handleDirections = async () => {
    const coords = await requestLocation()
    const params = new URLSearchParams({
      api: '1',
      destination_place_id: card.place_id,
      destination: card.name,
    })
    if (coords) params.set('origin', `${coords.lat},${coords.lng}`)
    const url = `https://www.google.com/maps/dir/?${params.toString()}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="relative flex flex-col rounded-xl border border-border bg-card p-3 gap-2 h-full">
      {!readOnly && <SaveButton card={card} sourceMessageId={sourceMessageId} />}
      {MAPS_ENABLED && (
        <Map
          style={{ width: '100%', height: '180px', borderRadius: '0.5rem' }}
          defaultCenter={{ lat: card.lat, lng: card.lng }}
          defaultZoom={14}
          mapId={MAP_ID}
          gestureHandling="cooperative"
          disableDefaultUI={true}
        >
          <AdvancedMarker position={{ lat: card.lat, lng: card.lng }} />
        </Map>
      )}
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
        <Button size="sm" className="flex-1" onClick={handleDirections}>
          <Navigation className="w-3.5 h-3.5 mr-1" />
          Directions
        </Button>
      </div>
    </div>
  )
}
