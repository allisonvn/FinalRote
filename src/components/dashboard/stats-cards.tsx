"use client"

import { TrendingUp, TrendingDown, Minus, Activity, Users, Target, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCard {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: React.ComponentType<{ className?: string }>
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

interface StatsCardsProps {
  stats: StatCard[]
}

const colorConfig = {
  primary: {
    background: 'bg-primary/10',
    icon: 'text-primary',
    trend: 'text-primary'
  },
  success: {
    background: 'bg-success/10',
    icon: 'text-success',
    trend: 'text-success'
  },
  warning: {
    background: 'bg-warning/10',
    icon: 'text-warning',
    trend: 'text-warning'
  },
  danger: {
    background: 'bg-danger/10',
    icon: 'text-danger',
    trend: 'text-danger'
  },
  info: {
    background: 'bg-info/10',
    icon: 'text-info',
    trend: 'text-info'
  }
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus
}

const trendColors = {
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-muted-foreground'
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const config = colorConfig[stat.color || 'primary']
        const Icon = stat.icon
        const TrendIcon = stat.trend ? trendIcons[stat.trend.direction] : null

        return (
          <Card
            key={index}
            className="relative overflow-hidden group card-glass hover-lift"
          >
            {/* Subtle pattern background */}
            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_hsl(var(--foreground))_1px,_transparent_0)] [background-size:16px_16px]" />
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                {Icon && (
                  <div className={cn('h-10 w-10 rounded-xl grid place-items-center ring-1 ring-border', config.background)}>
                    <Icon className={cn('h-5 w-5', config.icon)} strokeWidth={1.75} />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value}
                </h3>
                {stat.trend && TrendIcon && (
                  <div className={cn('chip', trendColors[stat.trend.direction])}>
                    <TrendIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span className="font-medium">
                      {Math.abs(stat.trend.value)}%
                    </span>
                  </div>
                )}
              </div>
              {stat.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              )}
              {stat.trend?.label && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.trend.label}
                </p>
              )}
            </CardContent>
            {/* Bottom accent */}
            <div
              className={cn(
                'absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-60',
                stat.color === 'success' ? 'from-success/40 to-success' :
                stat.color === 'warning' ? 'from-warning/40 to-warning' :
                stat.color === 'danger'  ? 'from-danger/40 to-danger'  :
                'from-primary/40 to-primary'
              )}
            />
          </Card>
        )
      })}
    </div>
  )
}

// Componente com stats padrão para o dashboard
export function DashboardStats() {
  const stats: StatCard[] = [
    {
      title: 'Experimentos Ativos',
      value: 8,
      description: '3 iniciados hoje',
      trend: {
        value: 12,
        label: 'vs. semana passada',
        direction: 'up'
      },
      icon: Activity,
      color: 'primary'
    },
    {
      title: 'Total de Visitantes',
      value: '24.8k',
      description: 'Últimos 30 dias',
      trend: {
        value: 8.5,
        label: 'vs. período anterior',
        direction: 'up'
      },
      icon: Users,
      color: 'success'
    },
    {
      title: 'Taxa de Conversão',
      value: '3.24%',
      description: 'Média geral',
      trend: {
        value: 2.1,
        label: 'vs. semana passada',
        direction: 'down'
      },
      icon: Target,
      color: 'warning'
    },
    {
      title: 'Uplift Médio',
      value: '+15.7%',
      description: 'Experimentos vencedores',
      trend: {
        value: 4.8,
        label: 'vs. período anterior',
        direction: 'up'
      },
      icon: BarChart3,
      color: 'info'
    }
  ]

  return <StatsCards stats={stats} />
}
