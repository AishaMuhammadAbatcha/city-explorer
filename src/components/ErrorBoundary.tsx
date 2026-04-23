import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error reporting service (e.g., Sentry)
      // logErrorToService(error, errorInfo)
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.retry} />
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription className="text-gray-600">
            We're sorry, but something unexpected happened. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Error Details (Development)</h4>
              <pre className="text-sm text-red-700 overflow-auto max-h-40 whitespace-pre-wrap">
                {error.message}
                {error.stack && '\n\nStack trace:\n' + error.stack}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={retry} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-gray-500 hover:text-gray-700"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Higher-order component for wrapping components with error boundary
// eslint-disable-next-line react-refresh/only-export-components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Hook for handling async errors in functional components
// eslint-disable-next-line react-refresh/only-export-components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = () => setError(null)

  const handleError = React.useCallback((error: Error | unknown) => {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    setError(errorObj)
    console.error('Async error caught:', errorObj)
  }, [])

  // Re-throw error in useEffect to trigger error boundary
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
}

export default ErrorBoundary