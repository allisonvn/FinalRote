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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation">
      {stats.map((stat, index) => {
        const config = colorConfig[stat.color || 'primary']
        const Icon = stat.icon
        const TrendIcon = stat.trend ? trendIcons[stat.trend.direction] : null

        return (
          <Card
            key={index}
            className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-border/60 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 backdrop-blur-sm"
          >
            {/* Enhanced background pattern */}
            <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.04] transition-opacity duration-300">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,_hsl(var(--foreground))_1px,_transparent_0)] [background-size:20px_20px]" />
            </div>
            
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                {Icon && (
                  <div className={cn(
                    'h-12 w-12 rounded-2xl grid place-items-center ring-1 ring-border/60 group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-md',
                    config.background
                  )}>
                    <Icon className={cn('h-6 w-6', config.icon)} strokeWidth={1.75} />
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value}
                </h3>
                {stat.trend && TrendIcon && (
                  <div className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105',
                    stat.trend.direction === 'up' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                    stat.trend.direction === 'down' ? 'bg-red-100 text-red-700 border border-red-200' :
                    'bg-slate-100 text-slate-700 border border-slate-200'
                  )}>
                    <TrendIcon className="h-3 w-3" strokeWidth={2} />
                    <span>{Math.abs(stat.trend.value)}%</span>
                  </div>
                )}
              </div>
              
              {stat.description && (
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              )}
              
              {stat.trend?.label && (
                <p className="text-xs text-muted-foreground">
                  {stat.trend.label}
                </p>
              )}
            </CardContent>
            
            {/* Enhanced bottom accent */}
            <div
              className={cn(
                'absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-70 group-hover:opacity-100 transition-opacity duration-300',
                stat.color === 'success' ? 'from-emerald-400 via-green-500 to-emerald-600' :
                stat.color === 'warning' ? 'from-amber-400 via-orange-500 to-amber-600' :
                stat.color === 'danger'  ? 'from-red-400 via-red-500 to-red-600' :
                'from-blue-400 via-primary to-blue-600'
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
