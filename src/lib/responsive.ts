// Responsive design utilities and breakpoints
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const

// Mobile-first responsive design utilities
export const responsive = {
  // Container classes for different screen sizes
  container: {
    mobile: 'px-4 py-2',
    tablet: 'px-6 py-4',
    desktop: 'px-8 py-6'
  },

  // Grid layouts
  grid: {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2',
    desktop: 'grid-cols-3',
    wide: 'grid-cols-4'
  },

  // Text sizes
  text: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
    '2xl': 'text-2xl sm:text-3xl',
    '3xl': 'text-3xl sm:text-4xl'
  },

  // Spacing
  spacing: {
    xs: 'space-y-2 sm:space-y-3',
    sm: 'space-y-3 sm:space-y-4',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8'
  }
}

// Media query hooks
export function useMediaQuery(query: string): boolean {
  if (typeof window === 'undefined') return false

  const mediaQuery = window.matchMedia(query)
  const [matches, setMatches] = React.useState(mediaQuery.matches)

  React.useEffect(() => {
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [mediaQuery])

  return matches
}

// Common breakpoint hooks
export const useBreakpoints = () => {
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.sm})`)
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.lg})`)
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.lg})`)
  const isSmallScreen = useMediaQuery(`(max-width: ${breakpoints.md})`)

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen
  }
}

// Touch device detection
export const useTouch = () => {
  const [isTouch, setIsTouch] = React.useState(false)

  React.useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouch
}

// Safe area insets for mobile (iOS notch, etc.)
export const safeArea = {
  top: 'pt-safe-top',
  bottom: 'pb-safe-bottom',
  left: 'pl-safe-left',
  right: 'pr-safe-right',
  all: 'p-safe'
}

// Mobile-specific classes
export const mobile = {
  // Touch targets - minimum 44px for accessibility
  touchTarget: 'min-h-[44px] min-w-[44px]',

  // Full width on mobile
  fullWidthMobile: 'w-full sm:w-auto',

  // Hide on mobile
  hideOnMobile: 'hidden sm:block',

  // Show only on mobile
  showOnMobile: 'block sm:hidden',

  // Stack on mobile
  stackOnMobile: 'flex-col sm:flex-row',

  // Center on mobile
  centerOnMobile: 'text-center sm:text-left',

  // Mobile card spacing
  cardSpacing: 'p-4 sm:p-6',

  // Mobile modal
  modalMobile: 'mx-4 my-8 sm:mx-auto sm:my-16'
}

// Performance optimization for mobile
export const mobileOptimizations = {
  // Reduce animations on mobile for performance
  reduceMotion: 'motion-reduce:animate-none',

  // Optimize images for mobile
  imageOptimization: 'object-cover w-full h-auto',

  // Smooth scrolling
  smoothScroll: 'scroll-smooth',

  // Prevent zoom on inputs (iOS)
  noZoom: 'text-base', // 16px minimum to prevent zoom

  // Optimize touch scrolling
  touchScroll: 'overflow-auto -webkit-overflow-scrolling-touch'
}

// Accessibility helpers
export const a11y = {
  // Screen reader only
  srOnly: 'sr-only',

  // Focus visible
  focusVisible: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',

  // High contrast mode
  highContrast: 'contrast-more:border-black contrast-more:text-black',

  // Skip link
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-white p-4 text-black'
}

import React from 'react'

export default responsive