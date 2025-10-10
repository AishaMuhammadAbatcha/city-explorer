import { Star, MapPin, Clock, TrendingUp, Users, Brain, Heart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlaceCardSkeleton } from '@/components/ui/loading-states'
import type { RecommendationScore } from '@/services/recommendationsService'
import { cn } from '@/lib/utils'

interface RecommendationsCardProps {
  title: string
  subtitle?: string
  recommendations: RecommendationScore[]
  loading?: boolean
  error?: string | null
  onPlaceSelect?: (recommendation: RecommendationScore) => void
  onRefresh?: () => void
  className?: string
  showScores?: boolean
  maxItems?: number
  type?: 'personalized' | 'trending' | 'similar' | 'contextual'
}

export function RecommendationsCard({
  title,
  subtitle,
  recommendations,
  loading = false,
  error = null,
  onPlaceSelect,
  onRefresh,
  className,
  showScores = false,
  maxItems = 6,
  type = 'personalized'
}: RecommendationsCardProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'personalized':
        return <Brain className="w-5 h-5 text-blue-600" />
      case 'trending':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'similar':
        return <Users className="w-5 h-5 text-purple-600" />
      case 'contextual':
        return <Clock className="w-5 h-5 text-orange-600" />
      default:
        return <Heart className="w-5 h-5 text-red-600" />
    }
  }

  const getTypeColor = () => {
    switch (type) {
      case 'personalized':
        return 'border-blue-200 bg-blue-50'
      case 'trending':
        return 'border-green-200 bg-green-50'
      case 'similar':
        return 'border-purple-200 bg-purple-50'
      case 'contextual':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: maxItems }).map((_, i) => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTypeIcon()}
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Try Again
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">{error}</p>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                Reload Recommendations
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getTypeIcon()}
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Refresh
              </Button>
            )}
          </div>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {getTypeIcon()}
            </div>
            <p className="text-gray-600 mb-4">
              No recommendations available right now. Check back later or try exploring different areas.
            </p>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                Get Recommendations
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayRecommendations = recommendations.slice(0, maxItems)

  return (
    <Card className={cn('w-full', getTypeColor(), className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {displayRecommendations.map((recommendation) => (
            <RecommendationItem
              key={recommendation.placeId}
              recommendation={recommendation}
              onSelect={onPlaceSelect}
              showScore={showScores}
            />
          ))}
        </div>

        {recommendations.length > maxItems && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Showing {maxItems} of {recommendations.length} recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface RecommendationItemProps {
  recommendation: RecommendationScore
  onSelect?: (recommendation: RecommendationScore) => void
  showScore?: boolean
}

function RecommendationItem({ recommendation, onSelect, showScore }: RecommendationItemProps) {
  const { place, business, score, reasons } = recommendation

  // Use Google Place data if available, otherwise use business data
  const name = place?.name || business?.name || 'Unknown Place'
  const address = place?.formatted_address || business?.address || 'Address not available'
  const rating = place?.rating || business?.rating || 0
  const totalReviews = place?.user_ratings_total || business?.total_reviews || 0

  // Get photo URL from Google Places or business
  const getPhotoUrl = () => {
    if (place?.photos?.[0]) {
      // Use Google Maps Places API photo reference
      const photoRef = place.photos[0].getUrl ?
        place.photos[0].getUrl({ maxWidth: 400 }) :
        null
      if (photoRef) return photoRef
    }

    // Fallback to business image or placeholder
    return business?.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
  }

  const photo = getPhotoUrl()

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 bg-white"
      onClick={() => onSelect?.(recommendation)}
    >
      <div className="relative overflow-hidden bg-gray-100">
        <img
          src={photo}
          alt={name}
          className="w-full h-32 object-cover rounded-t-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'
          }}
        />
        {showScore && (
          <Badge className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700">
            {score}
          </Badge>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm line-clamp-1">{name}</h4>
          {rating > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{rating.toFixed(1)}</span>
              {totalReviews > 0 && (
                <span className="text-gray-500">({totalReviews})</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center text-gray-600 text-xs">
          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="line-clamp-1">{address}</span>
        </div>

        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {reasons.slice(0, 2).map((reason, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs px-2 py-1"
              >
                {reason}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export default RecommendationsCard