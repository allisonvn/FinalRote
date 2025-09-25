'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: 'percentage' | 'absolute'
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
  icon?: React.ReactNode
  className?: string
  highlight?: boolean
  loading?: boolean
  sparklineData?: number[]
  color?: 'primary' | 'success' | 'warning' | 'danger'
  realtime?: boolean
}

export function KpiCard({
  title,
  value,
  change,
  changeType = 'percentage',
  trend,
  subtitle,
  icon,
  className,
  highlight = false,
  loading = false,
  sparklineData = [],
  color = 'primary',
  realtime = false
}: KpiCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-3.5 w-3.5" />
      case 'down':
        return <ArrowDownRight className="h-3.5 w-3.5" />
      case 'neutral':
        return <Minus className="h-3.5 w-3.5" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success bg-success/10 border-success/20'
      case 'down':
        return 'text-danger bg-danger/10 border-danger/20'
      case 'neutral':
        return 'text-muted-foreground bg-muted/50 border-border'
      default:
        return 'text-muted-foreground bg-muted/50 border-border'
    }
  }

  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'text-success'
      case 'warning':
        return 'text-warning'
      case 'danger':
        return 'text-danger'
      default:
        return 'text-primary'
    }
  }

  const formatChange = () => {
    if (change === undefined) return null
    
    const prefix = change > 0 ? '+' : ''
    const suffix = changeType === 'percentage' ? '%' : ''
    
    return `${prefix}${change}${suffix}`
  }

  const renderSparkline = () => {
    if (sparklineData.length === 0) return null
    
    const max = Math.max(...sparklineData)
    const min = Math.min(...sparklineData)
    const range = max - min || 1
    
    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    }).join(' ')
    
    return (
      <div className="absolute top-2 right-2 w-16 h-8 opacity-30">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={cn('relative overflow-hidden animate-pulse', className)}>
        <CardHeader className="space-y-0 pb-3">
          <div className="h-4 bg-muted rounded w-24" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-8 bg-muted rounded w-20 mb-2" />
          <div className="h-3 bg-muted rounded w-16" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      'relative overflow-hidden group hover-lift',
      'card-glass',
      highlight && 'ring-2 ring-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/10',
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_hsl(var(--foreground))_1px,_transparent_0)] [background-size:16px_16px]" />
      </div>
      
      {/* Highlight Corner */}
      {highlight && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/15 to-transparent" />
      )}
      
      {/* Sparkline */}
      {sparklineData.length > 0 && (
        <div className={cn('absolute top-3 right-3 w-24 h-12', getColorClasses())}>
          {renderSparkline()}
        </div>
      )}
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2.5">
          {icon && (
            <div className={cn('h-4 w-4 transition-colors', getColorClasses())}>
              {icon}
            </div>
          )}
          {title}
          {realtime && (
            <div
              className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
              title="Dados em tempo real"
            />
          )}
        </CardTitle>
        
        {change !== undefined && (
          <Badge
            variant="outline"
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-all',
              getTrendColor()
            )}
          >
            {getTrendIcon()}
            {formatChange()}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 space-y-1">
        <div className="text-3xl font-bold tracking-tight leading-none group-hover:scale-[1.02] transition-transform origin-left">
          {value}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground leading-tight">
            {subtitle}
          </p>
        )}
      </CardContent>
      
      {/* Bottom border accent */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity',
        color === 'success' ? 'from-success/50 to-success' :
        color === 'warning' ? 'from-warning/50 to-warning' :
        color === 'danger' ? 'from-danger/50 to-danger' :
        'from-primary/50 to-primary'
      )} />
      {/* Corner accent */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-bl from-primary/15 to-transparent" />
    </Card>
  )
}
