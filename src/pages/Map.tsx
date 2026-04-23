import { useEffect, useMemo, useState } from 'react'
import {
  Map as GoogleMap,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps'
import { MapPin, Navigation, Star, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TrendingPlacesModal } from '@/components/TrendingPlacesModal'
import { useAuth } from '@/contexts/AuthContext'
import { useSavedResults } from '@/hooks/useSavedResults'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { PlaceCard } from '@/types/agent'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const MAP_ID = import.meta.env.VITE_MAP_ID as string | undefined
const MAPS_ENABLED = Boolean(GOOGLE_MAPS_API_KEY && MAP_ID)

function FitBounds({ places }: { places: PlaceCard[] }) {
  const map = useMap()
  useEffect(() => {
    if (!map || places.length === 0) return
    if (places.length === 1) {
      map.setCenter({ lat: places[0].lat, lng: places[0].lng })
      map.setZoom(14)
      return
    }
    const bounds = new google.maps.LatLngBounds()
    for (const p of places) bounds.extend({ lat: p.lat, lng: p.lng })
    map.fitBounds(bounds, 64)
  }, [map, places])
  return null
}

function PageHeader({ count }: { count?: number }) {
  const subtitle =
    typeof count === 'number'
      ? `${count} saved place${count === 1 ? '' : 's'} on the map.`
      : 'Your saved places on the map.'
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Map</h1>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </div>
  )
}

function EmptyState({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-8 text-center space-y-2">
      {icon}
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}

export default function MapPage() {
  const { isAnonymous } = useAuth()
  const { saved, loading } = useSavedResults()
  const { request: requestLocation } = useGeolocation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [trendingOpen, setTrendingOpen] = useState(true)

  const places = useMemo(
    () =>
      saved
        .map((r) => r.card)
        .filter((c): c is PlaceCard => c.kind === 'place'),
    [saved],
  )

  const selected = useMemo(
    () => places.find((p) => p.place_id === selectedId) ?? null,
    [places, selectedId],
  )

  const handleDirections = async (place: PlaceCard) => {
    const coords = await requestLocation()
    const params = new URLSearchParams({
      api: '1',
      destination_place_id: place.place_id,
      destination: place.name,
    })
    if (coords) params.set('origin', `${coords.lat},${coords.lng}`)
    window.open(
      `https://www.google.com/maps/dir/?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  if (isAnonymous) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <PageHeader />
        <EmptyState icon={<MapPin className="w-8 h-8 mx-auto text-muted-foreground" />}>
          Saved places only appear on the map after you create an account. Head to
          Settings to upgrade.
        </EmptyState>
      </div>
    )
  }

  if (!MAPS_ENABLED) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <PageHeader />
        <EmptyState icon={<MapPin className="w-8 h-8 mx-auto text-muted-foreground" />}>
          Google Maps is not configured. Set{' '}
          <code className="text-xs">VITE_GOOGLE_MAPS_API_KEY</code> and{' '}
          <code className="text-xs">VITE_MAP_ID</code> to enable the map view.
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
      <PageHeader count={places.length} />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : places.length === 0 ? (
        <EmptyState icon={<Bookmark className="w-8 h-8 mx-auto text-muted-foreground" />}>
          No saved places yet. Save a place from a search to see it on the map.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 h-[70vh] min-h-[500px]">
          <div className="rounded-xl overflow-hidden border border-border min-h-[400px]">
            <GoogleMap
              style={{ width: '100%', height: '100%' }}
              defaultCenter={{ lat: places[0].lat, lng: places[0].lng }}
              defaultZoom={12}
              mapId={MAP_ID}
              gestureHandling="greedy"
            >
              <FitBounds places={places} />
              {places.map((p) => (
                <AdvancedMarker
                  key={p.place_id}
                  position={{ lat: p.lat, lng: p.lng }}
                  onClick={() => setSelectedId(p.place_id)}
                />
              ))}
              {selected && (
                <InfoWindow
                  position={{ lat: selected.lat, lng: selected.lng }}
                  onCloseClick={() => setSelectedId(null)}
                  pixelOffset={[0, -32]}
                >
                  <div className="space-y-1 max-w-[220px] text-foreground">
                    <p className="text-sm font-semibold leading-tight">{selected.name}</p>
                    {typeof selected.rating === 'number' && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{selected.rating.toFixed(1)}</span>
                        {typeof selected.rating_count === 'number' &&
                          selected.rating_count > 0 && (
                            <span className="text-muted-foreground">
                              · {selected.rating_count.toLocaleString()}
                            </span>
                          )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{selected.address}</p>
                    <div className="flex gap-1.5 pt-1">
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={selected.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open
                        </a>
                      </Button>
                      <Button size="sm" onClick={() => handleDirections(selected)}>
                        <Navigation className="w-3.5 h-3.5 mr-1" />
                        Directions
                      </Button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>

          <aside className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Saved places · {places.length}
            </div>
            <ul className="flex-1 overflow-y-auto divide-y divide-border">
              {places.map((p) => {
                const active = selectedId === p.place_id
                return (
                  <li key={p.place_id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.place_id)}
                      className={`w-full text-left p-3 transition hover:bg-muted/50 ${
                        active ? 'bg-muted' : ''
                      }`}
                    >
                      <p className="text-sm font-semibold leading-tight line-clamp-1">
                        {p.name}
                      </p>
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{p.address}</span>
                      </div>
                      {typeof p.rating === 'number' && (
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{p.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>
        </div>
      )}
      <TrendingPlacesModal open={trendingOpen} onOpenChange={setTrendingOpen} />
    </div>
  )
}
