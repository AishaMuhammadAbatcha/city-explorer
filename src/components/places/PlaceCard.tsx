import React from 'react'
import { Star, MapPin, Phone, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { GooglePlace } from '@/services/maps/placesService'
import { placesService } from '@/services/maps/placesService'

interface PlaceCardProps {
  place: GooglePlace
  onSelect?: (place: GooglePlace) => void
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, onSelect }) => {
  const getPlacePhoto = () => {
    if (place.photos && place.photos.length > 0) {
      try {
        return placesService.getPhotoUrl(place.photos[0], 300)
      } catch (error) {
        console.error('Error getting photo URL:', error)
      }
    }
    // Use a nice fallback image instead of placeholder
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
  }

  const getPriceLevel = (level?: number) => {
    if (!level) return 'Price not available'
    return '₦'.repeat(level)
  }

  const formatPlaceTypes = (types: string[]) => {
    // Filter out generic types and format them nicely
    const relevantTypes = types
      .filter(type => !['establishment', 'point_of_interest'].includes(type))
      .slice(0, 2)
      .map(type => type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))

    return relevantTypes.length > 0 ? relevantTypes.join(', ') : 'Place'
  }

  const isOpen = place.opening_hours?.open_now

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="relative overflow-hidden bg-gray-100">
        <img
          src={getPlacePhoto()}
          alt={place.name}
          className="w-full h-48 object-cover rounded-t-lg"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
          }}
        />
        {place.business_status === 'OPERATIONAL' && (
          <Badge
            className={`absolute top-2 right-2 ${
              isOpen ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            {isOpen ? 'Open Now' : 'Closed'}
          </Badge>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
            {place.name}
          </h3>
          {place.rating && (
            <div className="flex items-center space-x-1 text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{place.rating.toFixed(1)}</span>
              {place.user_ratings_total && (
                <span className="text-gray-500">({place.user_ratings_total})</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="text-sm line-clamp-1">{place.formatted_address}</span>
        </div>

        <div className="mb-3">
          <Badge variant="secondary" className="text-xs">
            {formatPlaceTypes(place.types)}
          </Badge>
          {place.price_level && (
            <Badge variant="outline" className="ml-2 text-xs">
              {getPriceLevel(place.price_level)}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {place.formatted_phone_number && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`tel:${place.formatted_phone_number}`)}
              >
                <Phone className="w-4 h-4" />
              </Button>
            )}
            {place.website && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(place.website, '_blank')}
              >
                <Globe className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={() => onSelect?.(place)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PlaceCard