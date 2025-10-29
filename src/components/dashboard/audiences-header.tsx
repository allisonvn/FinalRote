'use client'

import { Button } from '@/components/ui/button'
import {
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Target
} from 'lucide-react'

interface AudiencesHeaderProps {
  stats: {
    totalVisitors: number
    totalConversions: number
    avgConversionRate: number
    roas: number
  }
  onNewCampaign: () => void
  onNewSegment: () => void
}

export function AudiencesHeader({ stats, onNewCampaign, onNewSegment }: AudiencesHeaderProps) {
  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value)

  return (
    <div className="space-y-8">
      {/* Header with User Actions - Matching Overview style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Audiências</h1>
              <p className="text-muted-foreground">Gerencie campanhas UTM e segmentos de usuários</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            className="hover:bg-accent/50"
            onClick={onNewSegment}
          >
            <Target className="w-4 h-4 mr-2" />
            Novo Segmento
          </Button>
          <Button 
            size="sm" 
            className="bg-gradient-primary shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={onNewCampaign}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Quick Stats - Matching Overview style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-glass rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Visitantes</p>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">{formatNumber(stats.totalVisitors)}</p>
        </div>

        <div className="card-glass rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Conversões</p>
            <div className="p-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold">{formatNumber(stats.totalConversions)}</p>
        </div>

        <div className="card-glass rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Taxa Conv.</p>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{stats.avgConversionRate.toFixed(2)}%</p>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>2.1%</span>
            </div>
          </div>
        </div>

        <div className="card-glass rounded-2xl p-6 hover-lift">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">ROAS</p>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{stats.roas.toFixed(2)}x</p>
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>15.7%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
