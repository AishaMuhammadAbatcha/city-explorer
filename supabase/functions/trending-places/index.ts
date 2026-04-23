// TR-ACE trending-places edge function.
//
// POST { lat: number, lng: number, radius?: number }
//  → 200 { categories: { [Category]: TrendingPlace[] }, from_cache: { [Category]: boolean } }
//
// Per request:
//   1. Verify the caller's JWT (Supabase edge-fn default).
//   2. Round coords to 3 decimals (~110m grid) → cache key per category.
//   3. For each of 6 categories, look up an unexpired row in
//      public.trending_cache. Cache hits are free. Cache misses
//      fire one Places API (New) :searchNearby call in parallel with
//      the others and UPSERT the response with a 24h TTL.
//   4. Return the merged result plus a per-category cache hit/miss
//      flag so the frontend can surface freshness if needed.
//
// Cost model: without the cache this would be 6 × $0.025 per page
// load. With the cache a populated cell serves hundreds of hits for
// one set of 6 Places calls.

// @ts-expect-error Deno remote module, resolved at runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { corsHeaders, handlePreflight } from './cors.ts'

// @ts-expect-error Deno global present at runtime.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
// @ts-expect-error Deno global present at runtime.
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// @ts-expect-error Deno global present at runtime.
const PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')!

const CACHE_TTL_HOURS = 24
const RESULTS_PER_CATEGORY = 6
const DEFAULT_RADIUS_M = 5000

type Category = 'food' | 'tourism' | 'accommodation' | 'shopping' | 'cafe' | 'bar'

const CATEGORY_TO_PLACE_TYPES: Record<Category, string[]> = {
  food: ['restaurant'],
  tourism: ['tourist_attraction'],
  accommodation: ['lodging'],
  shopping: ['shopping_mall'],
  cafe: ['cafe'],
  bar: ['bar'],
}

const CATEGORIES = Object.keys(CATEGORY_TO_PLACE_TYPES) as Category[]

// Fields requested from Places API (New). Keep this tight — field
// mask drives billing tier.
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.location',
  'places.types',
  'places.googleMapsUri',
  'places.primaryType',
].join(',')

interface TrendingPlace {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  rating?: number
  rating_count?: number
  types: string[]
  primary_type?: string
  maps_url: string
}

interface PlacesApiPlace {
  id: string
  displayName?: { text?: string }
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
  location?: { latitude: number; longitude: number }
  types?: string[]
  primaryType?: string
  googleMapsUri?: string
}

function normalizePlace(p: PlacesApiPlace): TrendingPlace | null {
  const name = p.displayName?.text
  const lat = p.location?.latitude
  const lng = p.location?.longitude
  if (!p.id || !name || typeof lat !== 'number' || typeof lng !== 'number') return null
  return {
    id: p.id,
    name,
    address: p.formattedAddress ?? '',
    lat,
    lng,
    rating: p.rating,
    rating_count: p.userRatingCount,
    types: p.types ?? [],
    primary_type: p.primaryType,
    maps_url: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
  }
}

// Round to 3 decimals and keep as a plain number so it lines up with
// the numeric(6,3) / numeric(7,3) column types in the cache table.
function toGeocell(coord: number, decimals = 3): number {
  const pow = 10 ** decimals
  return Math.round(coord * pow) / pow
}

interface CacheRow {
  places: TrendingPlace[]
  expires_at: string
}

async function fetchPlacesForCategory(
  category: Category,
  lat: number,
  lng: number,
  radiusM: number,
): Promise<TrendingPlace[]> {
  const body = {
    includedTypes: CATEGORY_TO_PLACE_TYPES[category],
    maxResultCount: RESULTS_PER_CATEGORY,
    rankPreference: 'POPULARITY',
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusM,
      },
    },
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': PLACES_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`Places API failed for ${category}: ${res.status} ${text}`)
    return []
  }

  const json = (await res.json()) as { places?: PlacesApiPlace[] }
  return (json.places ?? [])
    .map(normalizePlace)
    .filter((p): p is TrendingPlace => p !== null)
}

async function handleCategory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  category: Category,
  geocellLat: number,
  geocellLng: number,
  radiusM: number,
): Promise<{ places: TrendingPlace[]; fromCache: boolean }> {
  const nowIso = new Date().toISOString()

  const { data: cacheRow } = await admin
    .from('trending_cache')
    .select('places, expires_at')
    .eq('geocell_lat', geocellLat)
    .eq('geocell_lng', geocellLng)
    .eq('category', category)
    .gt('expires_at', nowIso)
    .maybeSingle()

  if (cacheRow) {
    const row = cacheRow as CacheRow
    return { places: row.places, fromCache: true }
  }

  const places = await fetchPlacesForCategory(category, geocellLat, geocellLng, radiusM)

  // Only cache non-empty responses — a zero-result Places call is
  // usually a transient failure, not a real signal about the area.
  if (places.length > 0) {
    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 3600 * 1000).toISOString()
    const { error } = await admin
      .from('trending_cache')
      .upsert(
        {
          geocell_lat: geocellLat,
          geocell_lng: geocellLng,
          category,
          places,
          expires_at: expiresAt,
        },
        { onConflict: 'geocell_lat,geocell_lng,category' },
      )
    if (error) console.error(`cache upsert failed for ${category}:`, error.message)
  }

  return { places, fromCache: false }
}

// @ts-expect-error Deno global present at runtime.
Deno.serve(async (req: Request): Promise<Response> => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  const origin = req.headers.get('origin')
  const cors = corsHeaders(origin)

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  let body: { lat?: number; lng?: number; radius?: number }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const { lat, lng, radius } = body
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return new Response(JSON.stringify({ error: 'invalid_coords' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const radiusM =
    typeof radius === 'number' && Number.isFinite(radius) && radius > 0 && radius <= 50000
      ? Math.round(radius)
      : DEFAULT_RADIUS_M

  const geocellLat = toGeocell(lat)
  const geocellLng = toGeocell(lng)

  // Authenticate via user JWT but read/write the cache with service
  // role so RLS on trending_cache (no policies → deny) is bypassed.
  const userClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const results = await Promise.all(
    CATEGORIES.map((c) => handleCategory(admin, c, geocellLat, geocellLng, radiusM)),
  )

  const categories: Record<Category, TrendingPlace[]> = {} as Record<Category, TrendingPlace[]>
  const fromCache: Record<Category, boolean> = {} as Record<Category, boolean>
  CATEGORIES.forEach((c, i) => {
    categories[c] = results[i].places
    fromCache[c] = results[i].fromCache
  })

  return new Response(
    JSON.stringify({
      categories,
      from_cache: fromCache,
      geocell: { lat: geocellLat, lng: geocellLng },
      radius_m: radiusM,
    }),
    { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
  )
})
