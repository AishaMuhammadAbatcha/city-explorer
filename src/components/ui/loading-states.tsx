import React from 'react'
import { Loader2, MapPin, Search, Calendar, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <Loader2
      className={cn(
        'animate-spin text-blue-600',
        sizeClasses[size],
        className
      )}
    />
  )
}

interface LoadingStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  className?: string
}

export function LoadingState({
  title = 'Loading...',
  description,
  icon,
  className
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-4">
        {icon || <LoadingSpinner size="lg" />}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 max-w-sm">{description}</p>
      )}
    </div>
  )
}

export function PlacesLoadingState() {
  return (
    <LoadingState
      title="Finding places near you..."
      description="We're searching for the best locations in your area"
      icon={
        <div className="relative">
          <MapPin className="w-12 h-12 text-blue-600" />
          <div className="absolute -top-1 -right-1">
            <LoadingSpinner size="sm" />
          </div>
        </div>
      }
    />
  )
}

export function SearchLoadingState() {
  return (
    <LoadingState
      title="Searching..."
      description="Looking for the perfect match"
      icon={
        <div className="relative">
          <Search className="w-12 h-12 text-blue-600" />
          <div className="absolute -top-1 -right-1">
            <LoadingSpinner size="sm" />
          </div>
        </div>
      }
    />
  )
}

export function EventsLoadingState() {
  return (
    <LoadingState
      title="Loading events..."
      description="Discovering exciting events in your city"
      icon={
        <div className="relative">
          <Calendar className="w-12 h-12 text-blue-600" />
          <div className="absolute -top-1 -right-1">
            <LoadingSpinner size="sm" />
          </div>
        </div>
      }
    />
  )
}

export function ReviewsLoadingState() {
  return (
    <LoadingState
      title="Loading reviews..."
      description="Fetching the latest feedback and ratings"
      icon={
        <div className="relative">
          <Star className="w-12 h-12 text-blue-600" />
          <div className="absolute -top-1 -right-1">
            <LoadingSpinner size="sm" />
          </div>
        </div>
      }
    />
  )
}

// Skeleton Loading Components
export function PlaceCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  )
}

export function BusinessCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-1">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: React.ReactNode
}

export function LoadingButton({
  loading = false,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'bg-primary text-primary-foreground hover:bg-primary/90',
        'h-10 px-4 py-2',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

// Page-level loading components
export function PageLoading({ title }: { title?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingState
        title={title || 'Loading TR-ACE...'}
        description="Please wait while we prepare your experience"
      />
    </div>
  )
}

export function SectionLoading({ title, className }: { title?: string; className?: string }) {
  return (
    <div className={cn('py-8', className)}>
      <LoadingState title={title} />
    </div>
  )
}