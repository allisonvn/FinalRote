'use client'

import { TrendingUp, TrendingDown, Minus, Activity, Users, Target, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
          <div
            key={index}
            className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <h3 className="text-2xl font-bold">
                    {typeof stat.value === 'number'
                      ? stat.value.toLocaleString('pt-BR')
                      : stat.value}
                  </h3>
                  {stat.trend && TrendIcon && (
                    <div className={cn('flex items-center gap-1 text-sm', trendColors[stat.trend.direction])}>
                      <TrendIcon className="h-4 w-4" />
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
              </div>
              {Icon && (
                <div className={cn('rounded-lg p-3', config.background)}>
                  <Icon className={cn('h-6 w-6', config.icon)} />
                </div>
              )}
            </div>
          </div>
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