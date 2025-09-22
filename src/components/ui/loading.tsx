'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary',
        sizeClasses[size],
        className
      )}
    />
  )
}

interface LoadingDotsProps {
  className?: string
}

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="h-2 w-2 bg-current rounded-full animate-pulse [animation-delay:0ms]" />
      <div className="h-2 w-2 bg-current rounded-full animate-pulse [animation-delay:150ms]" />
      <div className="h-2 w-2 bg-current rounded-full animate-pulse [animation-delay:300ms]" />
    </div>
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className, lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-muted rounded',
            i === lines - 1 && lines > 1 && 'w-3/4' // Last line shorter
          )}
        />
      ))}
    </div>
  )
}

interface LoadingCardProps {
  className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-6 animate-pulse', className)}>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-5/6" />
        </div>
      </div>
    </div>
  )
}

interface LoadingStateProps {
  loading: boolean
  error?: string | null
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
}

export function LoadingState({
  loading,
  error,
  children,
  fallback,
  errorFallback
}: LoadingStateProps) {
  if (error) {
    return (
      errorFallback || (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-danger/10 p-3 mb-4">
            <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )
    )
  }

  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )
    )
  }

  return <>{children}</>
}

interface FullPageLoadingProps {
  title?: string
  subtitle?: string
}

export function FullPageLoading({ title = 'Carregando...', subtitle }: FullPageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" className="mx-auto" />
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}