// Google Places API (New) — Text Search.
//
// Basic fields are free up to 10K calls/month, then $0.032/call.
// Phase 2 logs 0 cost_usd. Location bias is optional and accepts a
// free-form string (city, address, lat/lng) — when present we pass
// it through as `textQuery` suffix; this avoids a separate geocode
// step for MVP. Radius is advisory only in this mode.
//
// https://developers.google.com/maps/documentation/places/web-service/text-search

export interface PlacesSearchInput {
  query: string
  location?: string
  radius_m?: number
}

export interface PlaceResult {
  id: string
  name: string
  address: string
  location: { lat: number; lng: number } | null
  rating: number | null
  rating_count: number | null
  maps_url: string
}

export interface PlacesSearchOutput {
  places: PlaceResult[]
}

interface PlacesApiPlace {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  location?: { latitude?: number; longitude?: number }
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
}

interface PlacesApiResponse {
  places?: PlacesApiPlace[]
  error?: { message?: string }
}

export async function runPlacesSearch(input: PlacesSearchInput): Promise<PlacesSearchOutput> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY')
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set')

  const textQuery = input.location ? `${input.query} near ${input.location}` : input.query
  const body: Record<string, unknown> = { textQuery }

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.googleMapsUri',
  ].join(',')

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as PlacesApiResponse
  if (!res.ok) {
    throw new Error(`places_search failed: ${res.status} ${json.error?.message ?? res.statusText}`)
  }

  const places: PlaceResult[] = (json.places ?? []).map((p) => ({
    id: p.id ?? '',
    name: p.displayName?.text ?? '',
    address: p.formattedAddress ?? '',
    location:
      p.location && typeof p.location.latitude === 'number' && typeof p.location.longitude === 'number'
        ? { lat: p.location.latitude, lng: p.location.longitude }
        : null,
    rating: typeof p.rating === 'number' ? p.rating : null,
    rating_count: typeof p.userRatingCount === 'number' ? p.userRatingCount : null,
    maps_url: p.googleMapsUri ?? '',
  }))

  // radius_m is kept in the input for schema fidelity (and for future
  // locationBias support) but isn't used by text search directly.
  void input.radius_m
  return { places }
}

export const PLACES_SEARCH_DECLARATION = {
  name: 'places_search',
  description:
    'Search Google Maps for real-world places by name, category, or description. Returns address, rating, coordinates, and a Maps link. Use for restaurants, venues, shops, landmarks, services.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'What to search for (e.g. "ramen", "ATM", "Louvre").' },
      location: {
        type: 'string',
        description:
          'Optional city, neighborhood, or address to bias the search toward (e.g. "Lagos" or "Shibuya, Tokyo").',
      },
      radius_m: {
        type: 'integer',
        description: 'Optional search radius in meters. Defaults to 5000.',
      },
    },
    required: ['query'],
  },
}
