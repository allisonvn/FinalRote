'use client'

import { useState } from 'react'
import {
  BarChart3,
  Target,
  Users,
  Settings,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
  badge?: number
  description?: string
}

interface DashboardNavProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  stats?: {
    activeExperiments: number
    totalVisitors: number
  }
  className?: string
}

export function DashboardNav({
  activeTab = 'overview',
  onTabChange,
  stats,
  className
}: DashboardNavProps) {
  const navItems: NavItem[] = [
    {
      key: 'overview',
      label: 'Visão Geral',
      icon: <BarChart3 className="h-4 w-4" strokeWidth={1.75} />,
      description: 'Dashboard principal'
    },
    {
      key: 'experiments',
      label: 'Experimentos',
      icon: <Zap className="h-4 w-4" strokeWidth={1.75} />,
      badge: stats?.activeExperiments,
      description: 'Testes A/B ativos'
    },
    {
      key: 'analytics',
      label: 'Relatórios',
      icon: <TrendingUp className="h-4 w-4" strokeWidth={1.75} />,
      description: 'Relatórios e insights'
    },
    {
      key: 'audiences',
      label: 'Audiências',
      icon: <Users className="h-4 w-4" strokeWidth={1.75} />,
      description: 'Segmentação de usuários'
    },
    {
      key: 'events',
      label: 'Eventos',
      icon: <Activity className="h-4 w-4" strokeWidth={1.75} />,
      description: 'Tracking e conversões'
    },
    {
      key: 'settings',
      label: 'Configurações',
      icon: <Settings className="h-4 w-4" strokeWidth={1.75} />,
      description: 'Conta e preferências'
    }
  ]

  return (
    <nav className={cn(
      'sticky top-0 z-40 w-full bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-b border-border/50',
      className
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          {/* Horizontal Navigation */}
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.key
              
              return (
                <button
                  key={item.key}
                  onClick={() => onTabChange?.(item.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap relative',
                    'rounded-xl mx-1 hover-lift',
                    isActive
                      ? 'text-primary card-glass shadow-medium border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60 border border-transparent'
                  )}
                  title={item.description}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full opacity-80" />
                  )}
                  
                  {/* Icon */}
                  <span className={cn(
                    'transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {item.icon}
                  </span>
                  
                  {/* Label - Hide on small screens for non-active items */}
                  <span className={cn(
                    'transition-opacity',
                    !isActive && 'hidden sm:inline'
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={cn('chip ml-1', isActive && 'bg-primary/10 border-primary/30 text-primary') }>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export type { NavItem, DashboardNavProps }
