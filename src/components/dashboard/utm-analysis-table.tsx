'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BarChart3,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Award,
  AlertCircle,
  Eye,
  MousePointer,
  Calendar,
  Clock,
  ExternalLink,
  X,
  Link2,
  Tag,
  Hash,
  Globe,
  FileText,
  Copy,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Event } from '@/hooks/useEvents'
import { UTMMobileCards } from './utm-mobile-cards'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UTMAnalysisTableProps {
  events: Event[]
}

interface UTMCampaignStats {
  source: string
  medium: string
  campaign: string
  impressions: number // page_views
  clicks: number // click events
  visitors: number
  conversions: number
  conversionRate: number
  revenue: number
  avgRevenuePerConversion: number
  ctr: number // click-through rate
  cpa: number // cost per acquisition
}

/**
 * Tabela de Análise de Campanhas UTM
 *
 * Componente completo para análise de performance de campanhas de marketing através
 * de parâmetros UTM (source, medium, campaign). Exibe métricas agregadas incluindo:
 * - Impressões totais (page views)
 * - Cliques e CTR (Click-Through Rate)
 * - Conversões e taxa de conversão
 * - Receita total e ticket médio
 * - CPA (Custo Por Aquisição estimado)
 *
 * **Estrutura de Renderização (ordem corrigida):**
 * 1. Summary Cards (5 cards com totais gerais)
 * 2. Top 3 Performers (destaques das melhores campanhas)
 * 3. Full Table (tabela completa ordenável)
 *
 * @component
 * @param {Event[]} events - Array de eventos para análise (requer campos: utm_source, utm_medium, utm_campaign, event_type, value)
 * @returns {JSX.Element} Componente com cards de resumo, top performers e tabela detalhada
 *
 * @example
 * ```tsx
 * const { events } = useEvents(filters)
 * <UTMAnalysisTable events={events} />
 * ```
 *
 * @see {@link useEvents} hook para obter eventos com filtros
 */
export function UTMAnalysisTable({ events }: UTMAnalysisTableProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<UTMCampaignStats | null>(null)

  const utmStats = useMemo(() => {
    // Group by UTM combination
    const campaignMap: Record<string, {
      visitors: Set<string>
      impressions: number
      clicks: number
      conversions: number
      revenue: number
    }> = {}

    events.forEach(event => {
      const source = event.utm_source || 'direct'
      const medium = event.utm_medium || 'none'
      const campaign = event.utm_campaign || 'none'
      const key = `${source}|${medium}|${campaign}`

      if (!campaignMap[key]) {
        campaignMap[key] = {
          visitors: new Set(),
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        }
      }

      campaignMap[key].visitors.add(event.visitor_id)

      // Count impressions (page_views)
      if (event.event_type === 'page_view') {
        campaignMap[key].impressions++
      }

      // Count clicks
      if (event.event_type === 'click') {
        campaignMap[key].clicks++
      }

      // Count conversions and revenue
      if (event.event_type === 'conversion') {
        campaignMap[key].conversions++
        campaignMap[key].revenue += event.value || 0
      }
    })

    // Convert to array and calculate metrics
    const stats: UTMCampaignStats[] = Object.entries(campaignMap).map(([key, data]) => {
      const [source, medium, campaign] = key.split('|')
      const visitors = data.visitors.size
      const impressions = data.impressions
      const clicks = data.clicks
      const conversions = data.conversions
      const revenue = data.revenue

      // CTR (Click-Through Rate) - clicks / impressions
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

      // Conversion Rate - conversions / clicks
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0

      // Average Revenue Per Conversion
      const avgRevenuePerConversion = conversions > 0 ? revenue / conversions : 0

      // CPA (Cost Per Acquisition) - estimating cost as R$0.50 per impression
      const estimatedCost = impressions * 0.50
      const cpa = conversions > 0 ? estimatedCost / conversions : 0

      return {
        source,
        medium,
        campaign,
        impressions,
        clicks,
        visitors,
        conversions,
        conversionRate,
        revenue,
        avgRevenuePerConversion,
        ctr,
        cpa
      }
    })

    // Sort by revenue (descending)
    return stats.sort((a, b) => b.revenue - a.revenue)
  }, [events])

  const topPerformers = utmStats.slice(0, 3)
  const totalImpressions = utmStats.reduce((sum, stat) => sum + stat.impressions, 0)
  const totalClicks = utmStats.reduce((sum, stat) => sum + stat.clicks, 0)
  const totalConversions = utmStats.reduce((sum, stat) => sum + stat.conversions, 0)
  const totalRevenue = utmStats.reduce((sum, stat) => sum + stat.revenue, 0)

  if (utmStats.length === 0) {
    return (
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-16 text-center">
        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Sem dados de campanhas</h3>
        <p className="text-slate-600">Eventos com UTMs aparecerão aqui para análise</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - PRIMEIRO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-xl p-5 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-700 mb-1 uppercase tracking-wider">Impressões</p>
              <p className="text-3xl font-black text-blue-900">{totalImpressions.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl p-5 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-green-700 mb-1 uppercase tracking-wider">Cliques</p>
              <p className="text-3xl font-black text-green-900">{totalClicks.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
              <MousePointer className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-xl p-5 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-700 mb-1 uppercase tracking-wider">Vendas</p>
              <p className="text-3xl font-black text-purple-900">{totalConversions.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-xl p-5 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-700 mb-1 uppercase tracking-wider">Faturamento</p>
              <p className="text-2xl font-black text-amber-900">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-50 to-gray-50 border-0 shadow-xl p-5 hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">CPA Médio</p>
              <p className="text-2xl font-black text-slate-900">
                R$ {totalConversions > 0 ? ((totalImpressions * 0.50) / totalConversions).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Top 3 Performers */}
      {topPerformers.length > 0 && (
        <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Top 3 Campanhas</h3>
              <p className="text-sm text-slate-600">Melhores performers por conversões</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPerformers.map((stat, index) => (
              <div
                key={`${stat.source}-${stat.medium}-${stat.campaign}`}
                className={cn(
                  "p-4 rounded-xl border-2",
                  index === 0 && "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300",
                  index === 1 && "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-300",
                  index === 2 && "bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge className={cn(
                    "text-lg font-black px-3 py-1",
                    index === 0 && "bg-gradient-to-br from-amber-500 to-orange-600",
                    index === 1 && "bg-gradient-to-br from-slate-400 to-slate-500",
                    index === 2 && "bg-gradient-to-br from-amber-600 to-amber-700"
                  )}>
                    #{index + 1}
                  </Badge>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900">{stat.conversions}</p>
                    <p className="text-xs text-slate-600">conversões</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Campanha</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{stat.campaign}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">{stat.source}</Badge>
                    <Badge variant="outline" className="text-xs">{stat.medium}</Badge>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-600">Taxa de conversão</span>
                      <span className="text-sm font-bold text-green-700">{stat.conversionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stat.conversionRate} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Full Table - POR ÚLTIMO */}
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl">
        <div className="p-6">
          {/* Mobile: Cards */}
          <div className="block md:hidden">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Todas as Campanhas</h3>
            <UTMMobileCards campaigns={utmStats} onCampaignClick={setSelectedCampaign} />
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Campanha</TableHead>
                  <TableHead className="font-bold">Source</TableHead>
                  <TableHead className="font-bold">Medium</TableHead>
                  <TableHead className="text-right font-bold">Impressões</TableHead>
                  <TableHead className="text-right font-bold">Cliques</TableHead>
                  <TableHead className="text-right font-bold">CTR</TableHead>
                  <TableHead className="text-right font-bold">Vendas</TableHead>
                  <TableHead className="text-right font-bold">Faturamento</TableHead>
                  <TableHead className="text-right font-bold">CPA</TableHead>
                  <TableHead className="text-right font-bold">Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {utmStats.map((stat, index) => (
                  <TableRow
                    key={`${stat.source}-${stat.medium}-${stat.campaign}`}
                    className={cn(
                      "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors cursor-pointer",
                      stat.conversionRate > 10 && "bg-green-50/30"
                    )}
                    onClick={() => setSelectedCampaign(stat)}
                  >
                    <TableCell className="font-bold text-slate-900 max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Award className="h-4 w-4 text-amber-500" />
                        )}
                        {stat.campaign}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-semibold">
                        {stat.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 font-semibold">
                        {stat.medium}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-blue-700">
                      {stat.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      {stat.clicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={cn(
                        "font-bold",
                        stat.ctr > 5 && "bg-green-600",
                        stat.ctr > 2 && stat.ctr <= 5 && "bg-blue-600",
                        stat.ctr <= 2 && "bg-slate-600"
                      )}>
                        {stat.ctr.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Target className="h-3.5 w-3.5 text-purple-600" />
                        <span className="font-black text-purple-700">{stat.conversions}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-black text-emerald-700">
                        R$ {stat.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold text-slate-700">
                        R$ {stat.cpa.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        R$ {stat.avgRevenuePerConversion.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          events={events}
          open={!!selectedCampaign}
          onOpenChange={(open) => !open && setSelectedCampaign(null)}
        />
      )}
    </div>
  )
}

interface CampaignDetailsModalProps {
  campaign: UTMCampaignStats
  events: Event[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CampaignDetailsModal({ campaign, events, open, onOpenChange }: CampaignDetailsModalProps) {
  const [copiedUTM, setCopiedUTM] = useState<string | null>(null)

  // Filtrar eventos desta campanha específica
  const campaignEvents = useMemo(() => {
    return events.filter(event => {
      const source = event.utm_source || 'direct'
      const medium = event.utm_medium || 'none'
      const campaignName = event.utm_campaign || 'none'
      
      return source === campaign.source &&
             medium === campaign.medium &&
             campaignName === campaign.campaign
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [events, campaign])

  // Lista completa de todos os parâmetros UTM configurados para captura
  const ALL_UTM_PARAMS = [
    // UTMs padrão
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    // Parâmetros de redes de anúncios
    'fbclid',  // Facebook Click ID
    'gclid',   // Google Click ID
    'src',     // Source genérico
    'sck',     // Snapchat Click ID
    'msclkid', // Microsoft Click ID
    'ttclid'   // TikTok Click ID
  ]

  // Extrair todas as UTMs únicas capturadas com TODOS os parâmetros
  const capturedUTMs = useMemo(() => {
    const utmMap = new Map<string, {
      // UTMs padrão
      utm_source: string
      utm_medium: string
      utm_campaign: string
      utm_term?: string
      utm_content?: string
      // Parâmetros de redes de anúncios
      fbclid?: string
      gclid?: string
      src?: string
      sck?: string
      msclkid?: string
      ttclid?: string
      // Metadados
      firstSeen: string
      eventCount: number
    }>()

    campaignEvents.forEach(event => {
      // Extrair todos os parâmetros UTM de diferentes fontes
      const getUTMValue = (param: string) => {
        return event.utm_data?.[param] || 
               event.event_data?.[param] || 
               event.properties?.[param] ||
               (param === 'utm_source' && (event.utm_source || campaign.source)) ||
               (param === 'utm_medium' && (event.utm_medium || campaign.medium)) ||
               (param === 'utm_campaign' && (event.utm_campaign || campaign.campaign)) ||
               undefined
      }

      // Construir objeto com todos os parâmetros
      const utmData: any = {
        utm_source: getUTMValue('utm_source') || campaign.source,
        utm_medium: getUTMValue('utm_medium') || campaign.medium,
        utm_campaign: getUTMValue('utm_campaign') || campaign.campaign,
        firstSeen: event.created_at,
        eventCount: 0
      }

      // Adicionar parâmetros opcionais se existirem
      ALL_UTM_PARAMS.forEach(param => {
        const value = getUTMValue(param)
        if (value && param !== 'utm_source' && param !== 'utm_medium' && param !== 'utm_campaign') {
          utmData[param] = value
        }
      })

      // Criar chave única baseada em todos os parâmetros
      const key = ALL_UTM_PARAMS
        .map(param => `${param}=${utmData[param] || ''}`)
        .join('|')
      
      if (!utmMap.has(key)) {
        utmMap.set(key, utmData)
      }
      
      const existing = utmMap.get(key)!
      existing.eventCount++
      if (new Date(event.created_at) < new Date(existing.firstSeen)) {
        existing.firstSeen = event.created_at
      }
    })

    return Array.from(utmMap.values()).sort((a, b) => b.eventCount - a.eventCount)
  }, [campaignEvents, campaign])

  const copyUTMToClipboard = (utm: typeof capturedUTMs[0]) => {
    // Construir string com TODOS os parâmetros capturados
    const params: string[] = []
    
    ALL_UTM_PARAMS.forEach(param => {
      const value = utm[param as keyof typeof utm]
      if (value && typeof value === 'string') {
        params.push(`${param}=${value}`)
      }
    })
    
    const utmString = params.join('&')
    
    navigator.clipboard.writeText(utmString).then(() => {
      setCopiedUTM(utmString)
      setTimeout(() => setCopiedUTM(null), 2000)
    })
  }

  // Função para obter label amigável do parâmetro
  const getParamLabel = (param: string): { label: string; icon: any; color: string } => {
    const labels: Record<string, { label: string; icon: any; color: string }> = {
      utm_source: { label: 'Source', icon: Globe, color: 'blue' },
      utm_medium: { label: 'Medium', icon: Link2, color: 'purple' },
      utm_campaign: { label: 'Campaign', icon: Target, color: 'pink' },
      utm_term: { label: 'Term', icon: Hash, color: 'amber' },
      utm_content: { label: 'Content', icon: FileText, color: 'indigo' },
      fbclid: { label: 'Facebook Click ID', icon: Globe, color: 'blue' },
      gclid: { label: 'Google Click ID', icon: Globe, color: 'green' },
      src: { label: 'Source', icon: Link2, color: 'slate' },
      sck: { label: 'Snapchat Click ID', icon: Globe, color: 'yellow' },
      msclkid: { label: 'Microsoft Click ID', icon: Globe, color: 'blue' },
      ttclid: { label: 'TikTok Click ID', icon: Globe, color: 'red' }
    }
    
    return labels[param] || { label: param, icon: Tag, color: 'slate' }
  }

  // Agrupar eventos por visitante
  const eventsByVisitor = useMemo(() => {
    const visitorMap: Record<string, Event[]> = {}
    campaignEvents.forEach(event => {
      if (!visitorMap[event.visitor_id]) {
        visitorMap[event.visitor_id] = []
      }
      visitorMap[event.visitor_id].push(event)
    })
    return visitorMap
  }, [campaignEvents])

  // Agrupar eventos por data
  const eventsByDate = useMemo(() => {
    const dateMap: Record<string, Event[]> = {}
    campaignEvents.forEach(event => {
      const date = format(new Date(event.created_at), 'dd/MM/yyyy', { locale: ptBR })
      if (!dateMap[date]) {
        dateMap[date] = []
      }
      dateMap[date].push(event)
    })
    return dateMap
  }, [campaignEvents])

  // Calcular conversões detalhadas
  const conversions = useMemo(() => {
    return campaignEvents.filter(e => e.event_type === 'conversion')
  }, [campaignEvents])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto border-0 bg-slate-950">
        {/* Premium Header com efeitos */}
        <div className="relative -m-6 mb-0 p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-t-2xl border-b border-slate-700">
          {/* Efeito de background */}
          <div className="absolute inset-0 opacity-20 rounded-t-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500 rounded-full blur-3xl" />
          </div>

          {/* Conteúdo do header */}
          <div className="relative flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              {/* Ícone premium */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-xl">
                <Target className="h-7 w-7 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Título */}
                <DialogHeader>
                  <DialogTitle className="text-4xl font-black text-white mb-3 leading-tight">
                    {campaign.campaign}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Campanha: {campaign.campaign}, Source: {campaign.source}, Medium: {campaign.medium}
                  </DialogDescription>
                </DialogHeader>

                {/* Badges */}
                <div className="flex items-center gap-3 flex-wrap mt-2">
                  <Badge className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg hover:shadow-xl transition-all px-4 py-2 text-xs font-bold">
                    <Globe className="h-3.5 w-3.5 mr-1.5" />
                    {campaign.source}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all px-4 py-2 text-xs font-bold">
                    <Link2 className="h-3.5 w-3.5 mr-1.5" />
                    {campaign.medium}
                  </Badge>
                  <div className="h-6 w-px bg-slate-600 mx-1" />
                  <span className="text-sm font-semibold text-slate-300">
                    {campaignEvents.length} evento{campaignEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Botão fechar */}
            <button
              onClick={() => onOpenChange(false)}
              className="p-3 hover:bg-slate-700 rounded-xl transition-all ml-4 group"
            >
              <X className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6 bg-gradient-to-b from-slate-900 to-slate-800">
          {/* Métricas Principais - Premium Design */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Eye, label: 'Impressões', value: campaign.impressions, suffix: '', gradient: 'from-blue-600 to-cyan-600', light: 'from-blue-500/10 to-cyan-500/10' },
              { icon: MousePointer, label: 'Cliques', value: campaign.clicks, suffix: ` • CTR: ${campaign.ctr.toFixed(2)}%`, gradient: 'from-green-600 to-emerald-600', light: 'from-green-500/10 to-emerald-500/10' },
              { icon: Target, label: 'Conversões', value: campaign.conversions, suffix: ` • Taxa: ${campaign.conversionRate.toFixed(1)}%`, gradient: 'from-purple-600 to-pink-600', light: 'from-purple-500/10 to-pink-500/10' },
              { icon: DollarSign, label: 'Receita', value: `R$ ${campaign.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, suffix: '', gradient: 'from-amber-600 to-orange-600', light: 'from-amber-500/10 to-orange-500/10' }
            ].map((metric, idx) => (
              <Card key={idx} className="p-6 bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.light} backdrop-blur-xl`}>
                    <metric.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className={`h-8 px-2 rounded-lg bg-gradient-to-r ${metric.gradient} flex items-center`}>
                    <span className="text-xs font-bold text-white">{metric.label}</span>
                  </div>
                </div>
                <p className="text-3xl font-black text-white mb-1">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </p>
                {metric.suffix && <p className="text-xs text-slate-400 font-semibold">{metric.suffix}</p>}
              </Card>
            ))}
          </div>

          {/* Estatísticas Adicionais - melhorado */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Users, label: 'Visitantes Únicos', value: campaign.visitors, color: 'from-slate-600 to-slate-500' },
              { icon: DollarSign, label: 'CPA', value: `R$ ${campaign.cpa.toFixed(2)}`, color: 'from-emerald-600 to-teal-500' },
              { icon: BarChart3, label: 'Total de Eventos', value: campaignEvents.length, color: 'from-violet-600 to-purple-500' }
            ].map((stat, idx) => (
              <Card key={idx} className="p-4 bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Seção de UTMs Capturadas - Premium */}
          <Card className="p-7 border-0 bg-gradient-to-br from-slate-800 to-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
                  <Tag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Parâmetros UTM Capturados</h3>
                  <p className="text-sm text-slate-400 mt-0.5">Detalhes completos de todos os parâmetros</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {capturedUTMs.length > 0 ? (
                capturedUTMs.map((utm, idx) => {
                  const utmString = ALL_UTM_PARAMS.map(param => {
                    const value = utm[param as keyof typeof utm] as string | undefined
                    return value ? `${param}=${value}` : null
                  }).filter(Boolean).join('&')
                  const isCopied = copiedUTM === utmString

                  return (
                    <div
                      key={idx}
                      className="p-6 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl border border-slate-600 shadow-lg hover:shadow-xl hover:border-indigo-500 transition-all"
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">
                            <Hash className="h-3.5 w-3.5 mr-1" />
                            Variação #{idx + 1}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-bold border-slate-500 text-slate-300 bg-slate-700/50">
                            {utm.eventCount} evento{utm.eventCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <button
                          onClick={() => copyUTMToClipboard(utm)}
                          className="p-2.5 hover:bg-indigo-600 rounded-lg transition-all group bg-slate-600/50"
                          title="Copiar UTM"
                        >
                          {isCopied ? (
                            <Check className="h-5 w-5 text-green-400" />
                          ) : (
                            <Copy className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors" />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ALL_UTM_PARAMS.map(param => {
                          const value = utm[param as keyof typeof utm] as string | undefined
                          const { label, icon: Icon, color } = getParamLabel(param)
                          const hasValue = value && value.trim() !== ''
                          
                          // Cores dinâmicas baseadas no tipo
                          const getColorClasses = (colorName: string) => {
                            const colors: Record<string, { icon: string; bg: string; border: string; text: string }> = {
                              blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-200' },
                              purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-200' },
                              pink: { icon: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-200' },
                              amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-200' },
                              indigo: { icon: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-200' },
                              green: { icon: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-200' },
                              yellow: { icon: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-200' },
                              red: { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-200' },
                              slate: { icon: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-200' }
                            }
                            return colors[colorName] || colors.slate
                          }
                          
                          const colorClasses = getColorClasses(color)
                          const isFullWidth = param === 'utm_content' || param === 'sck'
                          
                          return (
                            <div 
                              key={param} 
                              className={`space-y-2 ${isFullWidth ? 'md:col-span-2' : ''}`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={`h-3.5 w-3.5 ${hasValue ? colorClasses.icon : 'text-slate-500'}`} />
                                <label className={`text-xs font-bold uppercase tracking-wider ${hasValue ? 'text-slate-300' : 'text-slate-500'}`}>
                                  {label}
                                </label>
                              </div>
                              {hasValue ? (
                                <div className={`p-3 rounded-lg border ${colorClasses.bg} ${colorClasses.border}`}>
                                  <p className={`font-bold text-sm ${colorClasses.text} break-all`}>{value}</p>
                                </div>
                              ) : (
                                <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                                  <p className="text-slate-500 text-sm italic">Não especificado</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* URL completa para copiar */}
                      <div className="mt-5 pt-5 border-t border-slate-600">
                        <div className="flex items-center gap-2 mb-3">
                          <Link2 className="h-4 w-4 text-slate-400" />
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">URL Completa</label>
                        </div>
                        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 font-mono">
                          <code className="text-xs text-slate-300 break-all">
                            ?{utmString}
                          </code>
                        </div>
                      </div>

                      {/* Primeira captura */}
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>Primeira captura: {format(new Date(utm.firstSeen), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-8 text-center bg-slate-700/50 rounded-xl border border-slate-600">
                  <Tag className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-300 font-medium">Nenhuma UTM detalhada encontrada</p>
                  <p className="text-xs text-slate-500 mt-1">Apenas source e medium básicos foram capturados</p>
                </div>
              )}
            </div>
          </Card>

          {/* Conversões Detalhadas */}
          {conversions.length > 0 && (
            <Card className="p-6 border-0 bg-gradient-to-br from-purple-900/30 to-pink-900/20 shadow-xl border border-purple-700/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                  <Target className="h-4 w-4 text-white" />
                </div>
                Conversões ({conversions.length})
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {conversions.map((conversion) => (
                  <div
                    key={conversion.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{conversion.event_name}</p>
                        <p className="text-xs text-slate-400">Visitante: {conversion.visitor_id.slice(0, 8)}...</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-300">
                          R$ {(conversion.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(conversion.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}