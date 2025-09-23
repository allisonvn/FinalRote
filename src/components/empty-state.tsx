"use client"

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({ title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-input card-glass shadow-soft p-10 text-center', className)}>
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-primary/15 via-purple-400/15 to-pink-400/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-400/15 via-blue-400/15 to-primary/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-xl space-y-3">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-medium ring-1 ring-border/70">
          <Plus className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
        {description && (
          <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
        )}
        {actionLabel && (
          <div className="pt-2">
            <Button onClick={onAction} className="bg-gradient-primary text-primary-foreground shadow-medium hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" strokeWidth={1.75} />
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

