import { Loader } from '@googlemaps/js-api-loader'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

if (!API_KEY) {
  console.error('VITE_GOOGLE_MAPS_API_KEY is not defined in environment variables')
}

export interface GooglePlace {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  price_level?: number
  photos?: google.maps.places.PlacePhoto[]
  types: string[]
  business_status?: string
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
  formatted_phone_number?: string
  website?: string
  reviews?: google.maps.places.PlaceReview[]
}

export interface PlaceSearchOptions {
  location?: { lat: number; lng: number }
  radius?: number
  query?: string
  type?: string
  keyword?: string
  minPriceLevel?: number
  maxPriceLevel?: number
  openNow?: boolean
}

class GoogleMapsPlacesService {
  private loader: Loader
  private placesService: google.maps.places.PlacesService | null = null
  private isLoaded = false

  constructor() {
    this.loader = new Loader({
      apiKey: API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry']
    })
  }

  async initialize(): Promise<void> {
    if (this.isLoaded) return

    if (!API_KEY) {
      throw new Error('Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.')
    }

    try {
      await this.loader.load()

      // Create a div element for the PlacesService (required by Google Maps API)
      const div = document.createElement('div')
      const map = new google.maps.Map(div)
      this.placesService = new google.maps.places.PlacesService(map)
      this.isLoaded = true
    } catch (error) {
      console.error('Failed to load Google Maps API:', error)
      throw new Error(`Failed to initialize Google Maps: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isLoaded) {
      await this.initialize()
    }
  }

  async searchNearbyPlaces(options: PlaceSearchOptions): Promise<GooglePlace[]> {
    await this.ensureInitialized()

    if (!this.placesService) {
      throw new Error('Places service not initialized')
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: options.location ? new google.maps.LatLng(options.location.lat, options.location.lng) : undefined,
        radius: options.radius || 5000,
        type: options.type,
        keyword: options.keyword,
        minPriceLevel: options.minPriceLevel,
        maxPriceLevel: options.maxPriceLevel,
        openNow: options.openNow
      }

      this.placesService!.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results.map(place => this.formatPlace(place)))
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]) // No results is not an error
        } else {
          const errorMessage = this.getErrorMessage(status)
          console.error(`Places search failed: ${status} - ${errorMessage}`)
          reject(new Error(errorMessage))
        }
      })
    })
  }

  async searchPlacesByQuery(query: string, location?: { lat: number; lng: number }): Promise<GooglePlace[]> {
    await this.ensureInitialized()

    if (!this.placesService) {
      throw new Error('Places service not initialized')
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.TextSearchRequest = {
        query,
        location: location ? new google.maps.LatLng(location.lat, location.lng) : undefined,
        radius: location ? 10000 : undefined
      }

      this.placesService!.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results.map(place => this.formatPlace(place)))
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]) // No results is not an error
        } else {
          const errorMessage = this.getErrorMessage(status)
          console.error(`Text search failed: ${status} - ${errorMessage}`)
          reject(new Error(errorMessage))
        }
      })
    })
  }

  async getPlaceDetails(placeId: string): Promise<GooglePlace | null> {
    await this.ensureInitialized()

    if (!this.placesService) {
      throw new Error('Places service not initialized')
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'rating',
          'user_ratings_total',
          'price_level',
          'photos',
          'types',
          'business_status',
          'opening_hours',
          'formatted_phone_number',
          'website',
          'reviews'
        ]
      }

      this.placesService!.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(this.formatPlace(place))
        } else if (status === google.maps.places.PlacesServiceStatus.NOT_FOUND) {
          resolve(null)
        } else {
          reject(new Error(`Place details failed: ${status}`))
        }
      })
    })
  }

  private formatPlace(place: google.maps.places.PlaceResult): GooglePlace {
    return {
      place_id: place.place_id!,
      name: place.name!,
      formatted_address: place.formatted_address!,
      geometry: {
        location: {
          lat: place.geometry!.location!.lat(),
          lng: place.geometry!.location!.lng()
        }
      },
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      photos: place.photos,
      types: place.types || [],
      business_status: place.business_status,
      opening_hours: {
        open_now: place.opening_hours?.open_now,
        weekday_text: place.opening_hours?.weekday_text
      },
      formatted_phone_number: place.formatted_phone_number,
      website: place.website,
      reviews: place.reviews
    }
  }

  getPhotoUrl(photo: google.maps.places.PlacePhoto, maxWidth: number = 400): string {
    return photo.getUrl({ maxWidth })
  }

  // Get user's current location
  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`))
        },
        { timeout: 10000, enableHighAccuracy: true }
      )
    })
  }

  // Get places by category in Abuja (default location)
  async getPlacesByCategory(category: string, location?: { lat: number; lng: number }): Promise<GooglePlace[]> {
    const defaultLocation = location || { lat: 9.0765, lng: 7.3986 } // Abuja coordinates

    const categoryTypes: { [key: string]: string } = {
      'restaurants': 'restaurant',
      'cafes': 'cafe',
      'hotels': 'lodging',
      'shopping': 'shopping_mall',
      'entertainment': 'amusement_park',
      'healthcare': 'hospital',
      'education': 'school',
      'banks': 'bank',
      'gas_stations': 'gas_station',
      'pharmacies': 'pharmacy',
      'gyms': 'gym',
      'beauty': 'beauty_salon'
    }

    const type = categoryTypes[category] || category

    return this.searchNearbyPlaces({
      location: defaultLocation,
      radius: 15000, // 15km radius for Abuja
      type: type
    })
  }

  // Helper method to get user-friendly error messages
  private getErrorMessage(status: google.maps.places.PlacesServiceStatus): string {
    switch (status) {
      case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
        return 'Google Maps API request was denied. Please check your API key restrictions and ensure the Places API is enabled in Google Cloud Console.'
      case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
        return 'Google Maps API quota exceeded. Please check your billing settings in Google Cloud Console or wait for the quota to reset.'
      case google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
        return 'Invalid search request. Please try different search criteria.'
      case google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR:
        return 'An unknown error occurred with Google Maps. Please try again later.'
      case google.maps.places.PlacesServiceStatus.NOT_FOUND:
        return 'Place not found.'
      default:
        return `Google Maps error: ${status}`
    }
  }
}

// Create and export a singleton instance
export const placesService = new GoogleMapsPlacesService()
export default placesService