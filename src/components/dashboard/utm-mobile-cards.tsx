/**
 * Versão Mobile da UTM Analysis Table
 *
 * Renderiza campanhas UTM como cards empilhados em mobile,
 * otimizado para telas pequenas com touch interface.
 *
 * @component
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  Target,
  DollarSign,
  Eye,
  MousePointer,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UTMCampaignStats {
  source: string
  medium: string
  campaign: string
  impressions: number
  clicks: number
  visitors: number
  conversions: number
  conversionRate: number
  revenue: number
  avgRevenuePerConversion: number
  ctr: number
  cpa: number
}

interface UTMMobileCardsProps {
  campaigns: UTMCampaignStats[]
  onCampaignClick?: (campaign: UTMCampaignStats) => void
}

export function UTMMobileCards({ campaigns, onCampaignClick }: UTMMobileCardsProps) {
  if (campaigns.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600">Nenhuma campanha encontrada</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign, index) => {
        const isTopPerformer = index < 3

        return (
          <Card
            key={`${campaign.source}-${campaign.medium}-${campaign.campaign}`}
            className={cn(
              "p-5 transition-all duration-200 active:scale-98",
              isTopPerformer && "border-2 border-amber-400 bg-gradient-to-br from-amber-50/50 to-orange-50/50",
              campaign.conversionRate > 10 && "border-green-300 bg-green-50/30",
              onCampaignClick && "cursor-pointer hover:shadow-lg"
            )}
            onClick={() => onCampaignClick?.(campaign)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {isTopPerformer && (
                    <Award className={cn(
                      "w-5 h-5 shrink-0",
                      index === 0 && "text-amber-500",
                      index === 1 && "text-slate-400",
                      index === 2 && "text-amber-600"
                    )} />
                  )}
                  <h3 className="font-bold text-slate-900 truncate">
                    {campaign.campaign}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                    {campaign.source}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                    {campaign.medium}
                  </Badge>
                </div>
              </div>

              {/* CTR Badge */}
              <Badge className={cn(
                "font-bold shrink-0 ml-2",
                campaign.ctr > 5 && "bg-green-600",
                campaign.ctr > 2 && campaign.ctr <= 5 && "bg-blue-600",
                campaign.ctr <= 2 && "bg-slate-600"
              )}>
                {campaign.ctr.toFixed(1)}% CTR
              </Badge>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Impressions */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Eye className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-blue-700 font-medium">Impressões</p>
                  <p className="text-lg font-black text-blue-900 truncate">
                    {campaign.impressions.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Clicks */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <MousePointer className="w-4 h-4 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-green-700 font-medium">Cliques</p>
                  <p className="text-lg font-black text-green-900 truncate">
                    {campaign.clicks.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Conversions */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <Target className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-purple-700 font-medium">Conversões</p>
                  <p className="text-lg font-black text-purple-900 truncate">
                    {campaign.conversions}
                  </p>
                </div>
              </div>

              {/* Revenue */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-emerald-700 font-medium">Receita</p>
                  <p className="text-lg font-black text-emerald-900 truncate">
                    R$ {campaign.revenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Conversion Rate Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Taxa de Conversão</span>
                <span className="font-bold text-slate-900">
                  {campaign.conversionRate.toFixed(2)}%
                </span>
              </div>
              <Progress
                value={Math.min(campaign.conversionRate, 100)}
                className="h-2"
              />
            </div>

            {/* Additional Metrics */}
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-600">CPA: </span>
                <span className="font-bold text-slate-900">R$ {campaign.cpa.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-600">Ticket Médio: </span>
                <span className="font-bold text-slate-900">
                  R$ {campaign.avgRevenuePerConversion.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
