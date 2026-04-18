import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Clock,
  Navigation,
  Heart,
  Share2
} from 'lucide-react'
import type { GooglePlace } from '@/services/maps/placesService'
import { placesService } from '@/services/maps/placesService'
import { usePlaces } from '@/hooks/usePlaces'

interface PlaceDetailsProps {
  place: GooglePlace | null
  isOpen: boolean
  onClose: () => void
}

export const PlaceDetails: React.FC<PlaceDetailsProps> = ({
  place,
  isOpen,
  onClose
}) => {
  const [detailedPlace, setDetailedPlace] = useState<GooglePlace | null>(null)
  const [loading, setLoading] = useState(false)
  const { getPlaceDetails } = usePlaces()

  useEffect(() => {
    if (place && isOpen) {
      setLoading(true)
      getPlaceDetails(place.place_id)
        .then((details) => {
          setDetailedPlace(details || place)
        })
        .catch(() => {
          setDetailedPlace(place)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [place, isOpen, getPlaceDetails])

  if (!place) return null

  const currentPlace = detailedPlace || place

  const getPlacePhotos = () => {
    if (currentPlace.photos && currentPlace.photos.length > 0) {
      return currentPlace.photos.slice(0, 3).map((photo, index) => ({
        url: placesService.getPhotoUrl(photo, 400),
        alt: `${currentPlace.name} photo ${index + 1}`
      }))
    }
    return [{ url: '/api/placeholder/400/300', alt: currentPlace.name }]
  }

  const formatPlaceTypes = (types: string[]) => {
    return types
      .filter(type => !['establishment', 'point_of_interest'].includes(type))
      .slice(0, 3)
      .map(type => type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
  }

  const getPriceLevel = (level?: number) => {
    if (!level) return null
    return '₦'.repeat(level)
  }

  const openInGoogleMaps = () => {
    const { lat, lng } = currentPlace.geometry.location
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${currentPlace.place_id}`
    window.open(url, '_blank')
  }

  const sharePlace = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPlace.name,
          text: `Check out ${currentPlace.name} on TR-ACE`,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const photos = getPlacePhotos()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Photo Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo.url}
                  alt={photo.alt}
                  className={`rounded-lg object-cover ${
                    index === 0 ? 'md:col-span-2 h-64' : 'h-32'
                  }`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder/400/300'
                  }}
                />
              ))}
            </div>

            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {currentPlace.name}
                  </DialogTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    {formatPlaceTypes(currentPlace.types).map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                    {currentPlace.price_level && (
                      <Badge variant="outline" className="text-xs">
                        {getPriceLevel(currentPlace.price_level)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={sharePlace}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Rating and Status */}
            <div className="flex items-center space-x-4">
              {currentPlace.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{currentPlace.rating.toFixed(1)}</span>
                  {currentPlace.user_ratings_total && (
                    <span className="text-gray-500">
                      ({currentPlace.user_ratings_total} reviews)
                    </span>
                  )}
                </div>
              )}
              {currentPlace.opening_hours && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span className={`text-sm font-medium ${
                    currentPlace.opening_hours.open_now ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {currentPlace.opening_hours.open_now ? 'Open Now' : 'Closed'}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{currentPlace.formatted_address}</span>
              </div>

              {currentPlace.formatted_phone_number && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <a
                    href={`tel:${currentPlace.formatted_phone_number}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {currentPlace.formatted_phone_number}
                  </a>
                </div>
              )}

              {currentPlace.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <a
                    href={currentPlace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>

            {/* Opening Hours */}
            {currentPlace.opening_hours?.weekday_text && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Opening Hours</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                    {currentPlace.opening_hours.weekday_text.map((time, index) => (
                      <div key={index} className="text-gray-600">
                        {time}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Reviews */}
            {currentPlace.reviews && currentPlace.reviews.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Recent Reviews</h3>
                  <div className="space-y-3">
                    {currentPlace.reviews.slice(0, 3).map((review, index) => (
                      <div key={index} className="border-l-2 border-gray-200 pl-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < (review.rating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium text-sm">{review.author_name}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={openInGoogleMaps}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
              {currentPlace.formatted_phone_number && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`tel:${currentPlace.formatted_phone_number}`)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PlaceDetails