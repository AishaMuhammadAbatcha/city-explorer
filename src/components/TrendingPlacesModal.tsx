import { useEffect, useState } from 'react'
import { MapPin, Navigation, Star, Sparkles, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useGeolocation } from '@/hooks/useGeolocation'
import {
  useTrendingPlaces,
  TRENDING_CATEGORIES,
  CATEGORY_LABELS,
  type TrendingCategory,
  type TrendingPlace,
} from '@/hooks/useTrendingPlaces'

interface TrendingPlacesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function openDirections(place: TrendingPlace, origin: { lat: number; lng: number } | null) {
  const params = new URLSearchParams({
    api: '1',
    destination_place_id: place.id,
    destination: place.name,
  })
  if (origin) params.set('origin', `${origin.lat},${origin.lng}`)
  window.open(
    `https://www.google.com/maps/dir/?${params.toString()}`,
    '_blank',
    'noopener,noreferrer',
  )
}

function PlaceRow({
  place,
  onDirections,
}: {
  place: TrendingPlace
  onDirections: (p: TrendingPlace) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold leading-tight line-clamp-1">{place.name}</p>
        {typeof place.rating === 'number' && (
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{place.rating.toFixed(1)}</span>
            {typeof place.rating_count === 'number' && place.rating_count > 0 && (
              <span className="text-muted-foreground">
                · {place.rating_count.toLocaleString()}
              </span>
            )}
          </div>
        )}
        {place.address && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{place.address}</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 shrink-0">
        <Button size="sm" variant="outline" asChild className="h-8 px-2">
          <a href={place.maps_url} target="_blank" rel="noopener noreferrer">
            Open
          </a>
        </Button>
        <Button
          size="sm"
          className="h-8 px-2"
          onClick={() => onDirections(place)}
        >
          <Navigation className="w-3.5 h-3.5 mr-1" />
          Go
        </Button>
      </div>
    </div>
  )
}

export function TrendingPlacesModal({ open, onOpenChange }: TrendingPlacesModalProps) {
  const { coords, status, request } = useGeolocation()
  const [activeTab, setActiveTab] = useState<TrendingCategory>('food')

  // Ask for coords as soon as the modal opens, if we don't have them.
  useEffect(() => {
    if (open && !coords) {
      void request()
    }
  }, [open, coords, request])

  const { data, loading, error } = useTrendingPlaces(coords, open)

  const tabHasContent = (cat: TrendingCategory) =>
    (data?.categories[cat]?.length ?? 0) > 0

  // Auto-switch to the first tab with content if the current one is empty.
  useEffect(() => {
    if (!data) return
    if (tabHasContent(activeTab)) return
    const firstWithContent = TRENDING_CATEGORIES.find(tabHasContent)
    if (firstWithContent) setActiveTab(firstWithContent)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const locationDenied = status === 'denied' || status === 'error'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Trending near you
          </DialogTitle>
          <DialogDescription>
            Popular spots around your location — tap a category to browse.
          </DialogDescription>
        </DialogHeader>

        {!coords && status === 'loading' && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Finding your location…</span>
            </div>
          </div>
        )}

        {!coords && locationDenied && (
          <div className="flex-1 py-8 text-center text-sm text-muted-foreground">
            Location access is blocked. Enable it in your browser settings — or
            set a default city in Settings — to see trending places.
          </div>
        )}

        {coords && loading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading places…</span>
            </div>
          </div>
        )}

        {coords && !loading && error && (
          <div className="flex-1 py-8 text-center text-sm text-destructive">
            Couldn't load trending places: {error}
          </div>
        )}

        {coords && !loading && data && (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TrendingCategory)}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
              {TRENDING_CATEGORIES.map((cat) => {
                const count = data.categories[cat]?.length ?? 0
                return (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="flex items-center gap-1.5"
                    disabled={count === 0}
                  >
                    {CATEGORY_LABELS[cat]}
                    <span className="text-[10px] opacity-60">{count}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {TRENDING_CATEGORIES.map((cat) => {
              const places = data.categories[cat] ?? []
              return (
                <TabsContent
                  key={cat}
                  value={cat}
                  className="flex-1 min-h-0 overflow-y-auto mt-3 space-y-2 pr-1"
                >
                  {places.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      Nothing trending in this category nearby.
                    </p>
                  ) : (
                    places.map((p) => (
                      <PlaceRow
                        key={p.id}
                        place={p}
                        onDirections={(place) => openDirections(place, coords)}
                      />
                    ))
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
