// Google Geocoding API.
//
// Free tier: 40K calls/month, then $0.005/call. We log 0.005 per call
// conservatively so the cost circuit-breaker sees a realistic signal
// even while we're still inside the free tier.
//
// https://developers.google.com/maps/documentation/geocoding/overview

export const GEOCODE_COST_USD = 0.005

export interface GeocodeInput {
  address: string
}

export interface GeocodeResult {
  formatted_address: string
  lat: number
  lng: number
  place_id: string
}

export interface GeocodeOutput {
  results: GeocodeResult[]
}

interface GApiResult {
  formatted_address?: string
  place_id?: string
  geometry?: { location?: { lat?: number; lng?: number } }
}

interface GApiResponse {
  status?: string
  results?: GApiResult[]
  error_message?: string
}

export async function runGeocode(input: GeocodeInput): Promise<GeocodeOutput> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY')
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set')

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', input.address)
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  const json = (await res.json()) as GApiResponse
  if (!res.ok || (json.status && json.status !== 'OK' && json.status !== 'ZERO_RESULTS')) {
    throw new Error(
      `geocode failed: ${res.status} ${json.error_message ?? json.status ?? res.statusText}`,
    )
  }

  const results: GeocodeResult[] = (json.results ?? [])
    .filter((r) => typeof r.geometry?.location?.lat === 'number' && typeof r.geometry?.location?.lng === 'number')
    .map((r) => ({
      formatted_address: r.formatted_address ?? '',
      lat: r.geometry!.location!.lat as number,
      lng: r.geometry!.location!.lng as number,
      place_id: r.place_id ?? '',
    }))

  return { results }
}

export const GEOCODE_DECLARATION = {
  name: 'geocode',
  description:
    'Convert a free-form address or place name into latitude/longitude and a formatted address. Use to resolve ambiguous locations before calling places_search, not for end-user answers.',
  parameters: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        description: 'Free-form address, city, or place name.',
      },
    },
    required: ['address'],
  },
}
