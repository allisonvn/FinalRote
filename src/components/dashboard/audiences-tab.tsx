'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Users,
  Search,
  Filter,
  Plus,
  Target,
  Eye,
  TrendingUp,
  BarChart3,
  Check,
  X,
  MousePointer,
  Zap,
  Download,
  Share2,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react'
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { getCampaignData, getAudienceSegments, type CampaignData, type AudienceSegment } from '@/lib/analytics'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: 'info' | 'success' | 'warning' | 'primary'
  trend?: number
}

const KpiCard = ({ title, value, subtitle, icon, color = 'info', trend }: KpiCardProps) => {
  const colorClasses = {
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    primary: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
  }

  return (
    <Card className="card-glass hover-lift">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight mb-1">{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn('p-3 rounded-xl', colorClasses[color])}>
            {icon}
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-4 flex items-center gap-2">
            <Badge variant={trend >= 0 ? 'default' : 'destructive'} className="gap-1">
              {trend >= 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </Badge>
            <span className="text-xs text-muted-foreground">vs período anterior</span>
          </div>
        )}
      </div>
    </Card>
  )
}

interface NewCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (campaign: Partial<CampaignData>) => void
}

const NewCampaignModal = ({ open, onOpenChange, onSave }: NewCampaignModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    source: '',
    medium: '',
    campaign: '',
    content: '',
    term: '',
    budget: '',
    targetCPA: ''
  })

  const handleSave = () => {
    onSave({
      id: `campaign_${Date.now()}`,
      name: formData.name,
      source: formData.source,
      medium: formData.medium,
      campaign: formData.campaign,
      content: formData.content,
      term: formData.term,
      visitors: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      cost: parseFloat(formData.budget) || 0,
      startDate: new Date().toISOString(),
      status: 'active'
    })

    // Reset form
    setFormData({
      name: '',
      source: '',
      medium: '',
      campaign: '',
      content: '',
      term: '',
      budget: '',
      targetCPA: ''
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Campanha UTM</DialogTitle>
          <DialogDescription>
            Configure uma nova campanha de marketing com parâmetros UTM para rastreamento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Informações Básicas</h4>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Campanha *</Label>
              <Input
                id="name"
                placeholder="Ex: Black Friday 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="source">Fonte (utm_source) *</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="medium">Mídia (utm_medium) *</Label>
                <Select value={formData.medium} onValueChange={(v) => setFormData({ ...formData, medium: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a mídia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpc">CPC (Custo por Clique)</SelectItem>
                    <SelectItem value="cpm">CPM (Custo por Mil)</SelectItem>
                    <SelectItem value="organic">Orgânico</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="display">Display</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Parâmetros UTM */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Parâmetros UTM</h4>

            <div className="grid gap-2">
              <Label htmlFor="campaign">Campanha (utm_campaign) *</Label>
              <Input
                id="campaign"
                placeholder="Ex: black-friday-2024"
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="content">Conteúdo (utm_content)</Label>
                <Input
                  id="content"
                  placeholder="Ex: anuncio-principal"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="term">Termo (utm_term)</Label>
                <Input
                  id="term"
                  placeholder="Ex: ofertas black friday"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Budget e Metas */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Budget e Metas</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budget">Orçamento (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="0.00"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="targetCPA">CPA Alvo (R$)</Label>
                <Input
                  id="targetCPA"
                  type="number"
                  placeholder="0.00"
                  value={formData.targetCPA}
                  onChange={(e) => setFormData({ ...formData, targetCPA: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* URL Preview */}
          {formData.source && formData.medium && formData.campaign && (
            <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
              <Label className="text-xs font-medium">Preview da URL</Label>
              <code className="text-xs break-all block">
                https://seusite.com/?utm_source={formData.source}&utm_medium={formData.medium}&utm_campaign={formData.campaign}
                {formData.content && `&utm_content=${formData.content}`}
                {formData.term && `&utm_term=${formData.term}`}
              </code>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name || !formData.source || !formData.medium || !formData.campaign}
          >
            Criar Campanha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface NewSegmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (segment: Partial<AudienceSegment>) => void
}

const NewSegmentModal = ({ open, onOpenChange, onSave }: NewSegmentModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sources: [] as string[],
    mediums: [] as string[],
    devices: [] as string[],
    countries: [] as string[]
  })

  const handleSave = () => {
    onSave({
      id: `segment_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      conditions: {
        source: formData.sources.length > 0 ? formData.sources : undefined,
        medium: formData.mediums.length > 0 ? formData.mediums : undefined,
        device: formData.devices.length > 0 ? formData.devices : undefined,
        country: formData.countries.length > 0 ? formData.countries : undefined
      },
      visitors: 0,
      conversionRate: 0,
      avgValue: 0,
      totalRevenue: 0
    })

    setFormData({
      name: '',
      description: '',
      sources: [],
      mediums: [],
      devices: [],
      countries: []
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Segmento de Audiência</DialogTitle>
          <DialogDescription>
            Defina condições para criar um segmento personalizado de usuários.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="seg-name">Nome do Segmento *</Label>
            <Input
              id="seg-name"
              placeholder="Ex: Visitantes Mobile do Google"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seg-description">Descrição</Label>
            <Textarea
              id="seg-description"
              placeholder="Descreva o objetivo deste segmento..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Condições de Segmentação</h4>

            <div className="grid gap-2">
              <Label>Fontes de Tráfego</Label>
              <div className="flex flex-wrap gap-2">
                {['google', 'facebook', 'instagram', 'linkedin', 'twitter', 'organic', 'direct'].map((source) => (
                  <Button
                    key={source}
                    variant={formData.sources.includes(source) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        sources: formData.sources.includes(source)
                          ? formData.sources.filter(s => s !== source)
                          : [...formData.sources, source]
                      })
                    }}
                  >
                    {source}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Tipo de Mídia</Label>
              <div className="flex flex-wrap gap-2">
                {['cpc', 'cpm', 'organic', 'social', 'email', 'referral'].map((medium) => (
                  <Button
                    key={medium}
                    variant={formData.mediums.includes(medium) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        mediums: formData.mediums.includes(medium)
                          ? formData.mediums.filter(m => m !== medium)
                          : [...formData.mediums, medium]
                      })
                    }}
                  >
                    {medium}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Dispositivos</Label>
              <div className="flex flex-wrap gap-2">
                {['desktop', 'mobile', 'tablet'].map((device) => (
                  <Button
                    key={device}
                    variant={formData.devices.includes(device) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        devices: formData.devices.includes(device)
                          ? formData.devices.filter(d => d !== device)
                          : [...formData.devices, device]
                      })
                    }}
                  >
                    {device}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Países</Label>
              <div className="flex flex-wrap gap-2">
                {['BR', 'US', 'UK', 'PT', 'ES', 'AR', 'MX'].map((country) => (
                  <Button
                    key={country}
                    variant={formData.countries.includes(country) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        countries: formData.countries.includes(country)
                          ? formData.countries.filter(c => c !== country)
                          : [...formData.countries, country]
                      })
                    }}
                  >
                    {country}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {(formData.sources.length > 0 || formData.mediums.length > 0 || formData.devices.length > 0 || formData.countries.length > 0) && (
            <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
              <Label className="text-xs font-medium">Resumo das Condições</Label>
              <div className="text-sm space-y-1">
                {formData.sources.length > 0 && (
                  <p>• Fontes: {formData.sources.join(', ')}</p>
                )}
                {formData.mediums.length > 0 && (
                  <p>• Mídias: {formData.mediums.join(', ')}</p>
                )}
                {formData.devices.length > 0 && (
                  <p>• Dispositivos: {formData.devices.join(', ')}</p>
                )}
                {formData.countries.length > 0 && (
                  <p>• Países: {formData.countries.join(', ')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!formData.name}>
            Criar Segmento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AudiencesTabProps {
  periodFilter?: '7d' | '30d' | '90d'
  onPeriodChange?: (period: '7d' | '30d' | '90d') => void
}

export function AudiencesTab({ periodFilter = '90d', onPeriodChange }: AudiencesTabProps) {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [segments, setSegments] = useState<AudienceSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [audienceTab, setAudienceTab] = useState<'campanhas' | 'segmentos' | 'analytics'>('campanhas')
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [showNewSegment, setShowNewSegment] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<AudienceSegment | null>(null)

  useEffect(() => {
    loadAudienceData()
  }, [periodFilter])

  const loadAudienceData = async () => {
    setLoading(true)
    try {
      const [campaignData, segmentData] = await Promise.all([
        getCampaignData(periodFilter),
        getAudienceSegments(periodFilter as any)
      ])
      setCampaigns(campaignData)
      setSegments(segmentData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.campaign?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = sourceFilter === 'all' || campaign.source === sourceFilter
    return matchesSearch && matchesSource
  })

  const totalMetrics = campaigns.reduce((acc, campaign) => ({
    visitors: acc.visitors + (campaign.visitors || 0),
    conversions: acc.conversions + (campaign.conversions || 0),
    revenue: acc.revenue + (campaign.revenue || 0),
    cost: acc.cost + (campaign.cost || 0)
  }), { visitors: 0, conversions: 0, revenue: 0, cost: 0 })

  const avgConversionRate = totalMetrics.visitors > 0 ? (totalMetrics.conversions / totalMetrics.visitors) * 100 : 0
  const roas = totalMetrics.cost > 0 ? totalMetrics.revenue / totalMetrics.cost : 0

  const uniqueSources = [...new Set(campaigns.map(c => c.source).filter(Boolean))]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const handleNewCampaign = (campaign: Partial<CampaignData>) => {
    setCampaigns([campaign as CampaignData, ...campaigns])
  }

  const handleNewSegment = (segment: Partial<AudienceSegment>) => {
    setSegments([segment as AudienceSegment, ...segments])
  }

  const handleExport = () => {
    const data = audienceTab === 'campanhas' ? filteredCampaigns : segments
    const csv = convertToCSV(data)
    downloadCSV(csv, `${audienceTab}_${new Date().toISOString()}.csv`)
  }

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return ''
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(item => Object.values(item).join(','))
    return [headers, ...rows].join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-secondary/20" />
          ))}
        </div>
        <Card className="h-96 animate-pulse bg-secondary/20" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Visitantes Totais"
          value={formatNumber(totalMetrics.visitors)}
          subtitle={`Período: ${periodFilter === '7d' ? '7 dias' : periodFilter === '30d' ? '30 dias' : '90 dias'}`}
          icon={<Users className="h-5 w-5" />}
          color="info"
          trend={12.5}
        />
        <KpiCard
          title="Conversões"
          value={formatNumber(totalMetrics.conversions)}
          subtitle="Total de conversões"
          icon={<Check className="h-5 w-5" />}
          color="success"
          trend={8.3}
        />
        <KpiCard
          title="Taxa de Conversão"
          value={`${avgConversionRate.toFixed(2)}%`}
          subtitle="Média ponderada"
          icon={<TrendingUp className="h-5 w-5" />}
          color="warning"
          trend={-2.1}
        />
        <KpiCard
          title="ROAS"
          value={`${roas.toFixed(2)}x`}
          subtitle="Retorno sobre investimento"
          icon={<DollarSign className="h-5 w-5" />}
          color="primary"
          trend={15.7}
        />
      </div>

      {/* Filters and Actions */}
      <Card className="card-glass">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center flex-1 w-full lg:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar campanhas e segmentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Todas as fontes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as fontes</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={(v) => onPeriodChange?.(v as any)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full lg:w-auto">
              <Button variant="outline" size="sm" className="gap-2 flex-1 lg:flex-none" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4" />
                Filtros
                {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button variant="outline" size="sm" className="gap-2 flex-1 lg:flex-none" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-border/60 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="paused">Pausados</SelectItem>
                    <SelectItem value="ended">Finalizados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Mídia</Label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="cpc">CPC</SelectItem>
                    <SelectItem value="cpm">CPM</SelectItem>
                    <SelectItem value="organic">Orgânico</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ordenar por</Label>
                <Select defaultValue="visitors">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visitors">Visitantes</SelectItem>
                    <SelectItem value="conversions">Conversões</SelectItem>
                    <SelectItem value="revenue">Receita</SelectItem>
                    <SelectItem value="conversionRate">Taxa de Conversão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Active filter chips */}
          {(sourceFilter !== 'all' || searchTerm) && (
            <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-border/60">
              <span className="text-sm text-muted-foreground">Filtros ativos:</span>
              {sourceFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1.5 cursor-pointer" onClick={() => setSourceFilter('all')}>
                  Fonte: {sourceFilter}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {searchTerm && (
                <Badge variant="secondary" className="gap-1.5 cursor-pointer" onClick={() => setSearchTerm('')}>
                  Busca: "{searchTerm}"
                  <X className="h-3 w-3" />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => { setSourceFilter('all'); setSearchTerm('') }}>
                Limpar tudo
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs Content */}
      <Card className="card-glass">
        <div className="border-b border-border/60">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setAudienceTab('campanhas')}
              className={cn(
                'py-4 text-sm font-medium border-b-2 transition-colors relative',
                audienceTab === 'campanhas'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Campanhas
              {audienceTab === 'campanhas' && (
                <Badge className="ml-2 bg-primary/10 text-primary border-primary/20">
                  {filteredCampaigns.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setAudienceTab('segmentos')}
              className={cn(
                'py-4 text-sm font-medium border-b-2 transition-colors',
                audienceTab === 'segmentos'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Segmentos
              {audienceTab === 'segmentos' && (
                <Badge className="ml-2 bg-primary/10 text-primary border-primary/20">
                  {segments.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setAudienceTab('analytics')}
              className={cn(
                'py-4 text-sm font-medium border-b-2 transition-colors',
                audienceTab === 'analytics'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Analytics
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Campanhas Tab */}
          {audienceTab === 'campanhas' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Campanhas de Marketing</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredCampaigns.length} campanhas encontradas
                  </p>
                </div>
                <Button onClick={() => setShowNewCampaign(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Campanha
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/60">
                    <tr>
                      <th className="text-left p-4 font-medium text-sm">Campanha</th>
                      <th className="text-left p-4 font-medium text-sm">Fonte</th>
                      <th className="text-left p-4 font-medium text-sm">Visitantes</th>
                      <th className="text-left p-4 font-medium text-sm">Conversões</th>
                      <th className="text-left p-4 font-medium text-sm">Taxa Conv.</th>
                      <th className="text-left p-4 font-medium text-sm">Receita</th>
                      <th className="text-left p-4 font-medium text-sm">ROAS</th>
                      <th className="text-left p-4 font-medium text-sm">Status</th>
                      <th className="text-left p-4 font-medium text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCampaigns.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                          Nenhuma campanha encontrada. Crie sua primeira campanha!
                        </td>
                      </tr>
                    ) : (
                      filteredCampaigns.slice(0, 20).map((campaign) => {
                        const campaignROAS = campaign.cost && campaign.cost > 0 ? campaign.revenue / campaign.cost : 0
                        return (
                          <tr key={campaign.id} className="hover:bg-secondary/40 transition-colors">
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{campaign.name}</p>
                                <p className="text-sm text-muted-foreground">{campaign.campaign}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline">{campaign.source}</Badge>
                            </td>
                            <td className="p-4">
                              <span className="font-medium">{formatNumber(campaign.visitors)}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-medium">{formatNumber(campaign.conversions)}</span>
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                'font-medium',
                                campaign.conversionRate > 5 ? 'text-green-600 dark:text-green-400' :
                                campaign.conversionRate > 2 ? 'text-orange-600 dark:text-orange-400' : ''
                              )}>
                                {campaign.conversionRate?.toFixed(2)}%
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="font-medium">{formatCurrency(campaign.revenue)}</span>
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                'font-medium',
                                campaignROAS > 2 ? 'text-green-600 dark:text-green-400' :
                                campaignROAS > 1 ? 'text-orange-600 dark:text-orange-400' :
                                'text-red-600 dark:text-red-400'
                              )}>
                                {campaignROAS.toFixed(2)}x
                              </span>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={campaign.status === 'active' ? 'default' : 'secondary'}
                                className={campaign.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
                              >
                                {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedCampaign(campaign)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Segmentos Tab */}
          {audienceTab === 'segmentos' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Segmentos de Audiência</h3>
                  <p className="text-sm text-muted-foreground">
                    {segments.length} segmentos identificados
                  </p>
                </div>
                <Button onClick={() => setShowNewSegment(true)} className="gap-2">
                  <Target className="h-4 w-4" />
                  Criar Segmento
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {segments.length === 0 ? (
                  <Card className="col-span-full p-12 text-center card-glass">
                    <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="font-semibold mb-2">Nenhum segmento criado</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crie segmentos personalizados para melhor análise da sua audiência
                    </p>
                    <Button onClick={() => setShowNewSegment(true)}>Criar Primeiro Segmento</Button>
                  </Card>
                ) : (
                  segments.map((segment) => (
                    <Card key={segment.id} className="p-6 card-glass hover-lift transition-all">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{segment.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{segment.description}</p>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {formatNumber(segment.visitors)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão</p>
                            <p className="text-lg font-semibold">
                              {segment.conversionRate?.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Valor Médio</p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(segment.avgValue)}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/60">
                          <p className="text-xs text-muted-foreground mb-1">Receita Total</p>
                          <p className="text-xl font-bold text-primary">
                            {formatCurrency(segment.totalRevenue)}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1"
                            onClick={() => setSelectedSegment(segment)}
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-1">
                            <Target className="h-3 w-3" />
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {audienceTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              {/* Performance por Fonte */}
              <Card className="p-6 card-glass">
                <h3 className="text-lg font-semibold mb-6">Performance por Fonte</h3>
                <div className="space-y-4">
                  {uniqueSources.slice(0, 6).map(source => {
                    const sourceCampaigns = campaigns.filter(c => c.source === source)
                    const sourceMetrics = sourceCampaigns.reduce((acc, c) => ({
                      visitors: acc.visitors + (c.visitors || 0),
                      revenue: acc.revenue + (c.revenue || 0),
                      conversions: acc.conversions + (c.conversions || 0)
                    }), { visitors: 0, revenue: 0, conversions: 0 })

                    const convRate = sourceMetrics.visitors > 0 ?
                      (sourceMetrics.conversions / sourceMetrics.visitors) * 100 : 0

                    const maxVisitors = Math.max(...uniqueSources.map(s => {
                      const sc = campaigns.filter(c => c.source === s)
                      return sc.reduce((sum, c) => sum + c.visitors, 0)
                    }))

                    const percentage = maxVisitors > 0 ? (sourceMetrics.visitors / maxVisitors) * 100 : 0

                    return (
                      <div key={source} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-medium">{source}</Badge>
                            <div>
                              <p className="text-sm font-medium">{formatNumber(sourceMetrics.visitors)} visitantes</p>
                              <p className="text-xs text-muted-foreground">{convRate.toFixed(2)}% conversão</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(sourceMetrics.revenue)}</p>
                            <p className="text-xs text-muted-foreground">{formatNumber(sourceMetrics.conversions)} conv.</p>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Top Campanhas por Receita */}
              <Card className="p-6 card-glass">
                <h3 className="text-lg font-semibold mb-4">Top Campanhas por Receita</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RBarChart
                      data={filteredCampaigns.sort((a,b)=> (b.revenue||0)-(a.revenue||0)).slice(0,6)}
                      layout="vertical"
                      margin={{ left: 16, right: 16, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(v)=>`R$ ${(v/1000).toFixed(0)}k`}
                        fontSize={12}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        width={140}
                        tickFormatter={(v)=> String(v).slice(0,20) + (String(v).length>20?'...':'')}
                        fontSize={12}
                      />
                      <Tooltip content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const val = payload[0].value as number
                          return (
                            <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-xl">
                              <div className="font-semibold mb-1 text-sm">{label}</div>
                              <div className="text-sm">Receita: {formatCurrency(val)}</div>
                            </div>
                          )
                        }
                        return null
                      }} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0,6,6,0]} />
                    </RBarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Métricas de Advertising */}
              <Card className="p-6 card-glass">
                <h3 className="text-lg font-semibold mb-6">Métricas de Advertising</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <MousePointer className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">CTR Médio</p>
                        <p className="text-sm text-muted-foreground">Taxa de clique</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {campaigns.length > 0
                          ? (campaigns.reduce((sum, c) => sum + (c.ctr || 0), 0) / campaigns.length).toFixed(2)
                          : '0.00'
                        }%
                      </p>
                      <Badge variant="default" className="mt-1">↗ +1.2%</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">CPC Médio</p>
                        <p className="text-sm text-muted-foreground">Custo por clique</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          campaigns.length > 0
                            ? campaigns.reduce((sum, c) => sum + (c.cpc || 0), 0) / campaigns.length
                            : 0
                        )}
                      </p>
                      <Badge variant="destructive" className="mt-1">↗ +0.15</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">CPM Médio</p>
                        <p className="text-sm text-muted-foreground">Custo por mil impressões</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          campaigns.length > 0
                            ? campaigns.reduce((sum, c) => sum + (c.cpm || 0), 0) / campaigns.length
                            : 0
                        )}
                      </p>
                      <Badge variant="default" className="mt-1">↘ -2.3%</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                        <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium">Impressões Totais</p>
                        <p className="text-sm text-muted-foreground">Alcance total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatNumber(campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0))}
                      </p>
                      <Badge variant="default" className="mt-1">↗ +12.5%</Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Distribuição de Investimento */}
              <Card className="p-6 card-glass">
                <h3 className="text-lg font-semibold mb-4">Distribuição de Investimento</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={uniqueSources.map(source => {
                          const sourceCampaigns = campaigns.filter(c => c.source === source)
                          return {
                            name: source,
                            value: sourceCampaigns.reduce((sum, c) => sum + (c.cost || 0), 0)
                          }
                        })}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {uniqueSources.map((source, index) => {
                          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        })}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-xl border bg-background/95 backdrop-blur-sm p-3 shadow-xl">
                                <div className="font-semibold text-sm">{payload[0].name}</div>
                                <div className="text-sm">{formatCurrency(payload[0].value as number)}</div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>

      {/* Modals */}
      <NewCampaignModal
        open={showNewCampaign}
        onOpenChange={setShowNewCampaign}
        onSave={handleNewCampaign}
      />

      <NewSegmentModal
        open={showNewSegment}
        onOpenChange={setShowNewSegment}
        onSave={handleNewSegment}
      />

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCampaign.name}</DialogTitle>
              <DialogDescription>Detalhes completos da campanha</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Visitantes</p>
                  <p className="text-xl font-bold">{formatNumber(selectedCampaign.visitors)}</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Conversões</p>
                  <p className="text-xl font-bold">{formatNumber(selectedCampaign.conversions)}</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Receita</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedCampaign.revenue)}</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">ROAS</p>
                  <p className="text-xl font-bold">
                    {(selectedCampaign.cost && selectedCampaign.cost > 0
                      ? selectedCampaign.revenue / selectedCampaign.cost
                      : 0
                    ).toFixed(2)}x
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Parâmetros UTM</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Fonte:</span>{' '}
                    <Badge variant="outline">{selectedCampaign.source}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mídia:</span>{' '}
                    <Badge variant="outline">{selectedCampaign.medium}</Badge>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Campanha:</span>{' '}
                    <code className="px-2 py-1 bg-secondary rounded text-xs">{selectedCampaign.campaign}</code>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCampaign(null)}>Fechar</Button>
              <Button>Editar Campanha</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Segment Details Modal */}
      {selectedSegment && (
        <Dialog open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedSegment.name}</DialogTitle>
              <DialogDescription>{selectedSegment.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Visitantes</p>
                  <p className="text-2xl font-bold">{formatNumber(selectedSegment.visitors)}</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Conversão</p>
                  <p className="text-2xl font-bold">{selectedSegment.conversionRate.toFixed(2)}%</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Receita</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedSegment.totalRevenue)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Condições do Segmento</h4>
                <div className="space-y-2 text-sm">
                  {selectedSegment.conditions.source && (
                    <div>
                      <span className="text-muted-foreground">Fontes:</span>{' '}
                      {selectedSegment.conditions.source.map(s => (
                        <Badge key={s} variant="outline" className="ml-1">{s}</Badge>
                      ))}
                    </div>
                  )}
                  {selectedSegment.conditions.device && (
                    <div>
                      <span className="text-muted-foreground">Dispositivos:</span>{' '}
                      {selectedSegment.conditions.device.map(d => (
                        <Badge key={d} variant="outline" className="ml-1">{d}</Badge>
                      ))}
                    </div>
                  )}
                  {selectedSegment.conditions.country && (
                    <div>
                      <span className="text-muted-foreground">Países:</span>{' '}
                      {selectedSegment.conditions.country.map(c => (
                        <Badge key={c} variant="outline" className="ml-1">{c}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedSegment(null)}>Fechar</Button>
              <Button>Aplicar em Experimento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
