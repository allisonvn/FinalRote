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
  TrendingDown,
  BarChart3,
  Check,
  X,
  MousePointer,
  Zap,
  Share2,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Clock,
  ExternalLink
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
  AreaChart,
  ComposedChart
} from 'recharts'
import { getCampaignData, getAudienceSegments, type CampaignData, type AudienceSegment } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { CampaignModalImproved } from './campaign-modal-improved'
import { SegmentModalImproved } from './segment-modal-improved'

// Premium KPI Card with gradient and animations
interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  gradient: string
  trend?: number
  sparkline?: number[]
}

const KpiCardPremium = ({ title, value, subtitle, icon, gradient, trend }: KpiCardProps) => {
  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-background to-secondary/20 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
      {/* Gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
        gradient
      )} />

      {/* Sparkle effect on top right */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1.5 tracking-wide uppercase">
              {title}
            </p>
            <h3 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {subtitle}
              </p>
            )}
          </div>

          <div className={cn(
            "p-3.5 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
            gradient
          )}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>

        {trend !== undefined && (
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              {trend >= 0 ? (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span className="text-sm font-semibold">{Math.abs(trend)}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  <span className="text-sm font-semibold">{Math.abs(trend)}%</span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// Premium Campaign Card
const CampaignCardPremium = ({
  campaign,
  onClick,
  onEdit
}: {
  campaign: CampaignData
  onClick: () => void
  onEdit: () => void
}) => {
  const campaignROAS = campaign.cost && campaign.cost > 0 ? campaign.revenue / campaign.cost : 0
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value)

  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-background to-secondary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
      {/* Status indicator */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
        campaign.status === 'active'
          ? "bg-gradient-to-r from-green-500 to-emerald-500"
          : "bg-gradient-to-r from-gray-400 to-gray-500"
      )} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
              {campaign.name}
            </h4>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <code className="px-2 py-0.5 bg-secondary/50 rounded text-xs">{campaign.campaign}</code>
            </p>
          </div>

          <Badge
            variant={campaign.status === 'active' ? 'default' : 'secondary'}
            className={cn(
              "ml-2 font-medium",
              campaign.status === 'active' && "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
            )}
          >
            {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
          </Badge>
        </div>

        {/* Source Badge */}
        <div className="mb-4">
          <Badge variant="outline" className="bg-primary/5 border-primary/20">
            <Globe className="h-3 w-3 mr-1" />
            {campaign.source}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Visitantes</p>
            <p className="text-2xl font-bold">{formatNumber(campaign.visitors)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Conversões</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(campaign.conversions)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Taxa Conv.</p>
            <p className={cn(
              "text-xl font-bold",
              campaign.conversionRate > 5 ? 'text-green-600 dark:text-green-400' :
              campaign.conversionRate > 2 ? 'text-orange-600 dark:text-orange-400' :
              'text-red-600 dark:text-red-400'
            )}>
              {campaign.conversionRate?.toFixed(2)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">ROAS</p>
            <p className={cn(
              "text-xl font-bold",
              campaignROAS > 2 ? 'text-green-600 dark:text-green-400' :
              campaignROAS > 1 ? 'text-orange-600 dark:text-orange-400' :
              'text-red-600 dark:text-red-400'
            )}>
              {campaignROAS.toFixed(2)}x
            </p>
          </div>
        </div>

        {/* Revenue */}
        <div className="pt-4 border-t border-border/50 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Receita Total</p>
          <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            {formatCurrency(campaign.revenue)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={onClick}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5 group-hover/btn:scale-110 transition-transform" />
            Visualizar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 group/btn hover:bg-secondary hover:border-secondary transition-all"
            onClick={onEdit}
          >
            <Edit className="h-3.5 w-3.5 mr-1.5 group-hover/btn:scale-110 transition-transform" />
            Editar
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Premium Segment Card
const SegmentCardPremium = ({
  segment,
  onClick
}: {
  segment: AudienceSegment
  onClick: () => void
}) => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value)

  const getSegmentIcon = () => {
    if (segment.conditions.device) {
      if (segment.conditions.device.includes('mobile')) return <Smartphone className="h-5 w-5" />
      if (segment.conditions.device.includes('tablet')) return <Tablet className="h-5 w-5" />
      return <Monitor className="h-5 w-5" />
    }
    if (segment.conditions.country) return <MapPin className="h-5 w-5" />
    return <Users className="h-5 w-5" />
  }

  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-background via-secondary/10 to-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

      <div className="relative p-6">
        {/* Icon badge */}
        <div className="mb-4">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary group-hover:scale-110 transition-transform duration-300">
            {getSegmentIcon()}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <h4 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
            {segment.name}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {segment.description}
          </p>
        </div>

        {/* Visitor count badge */}
        <div className="mb-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold px-3 py-1">
            <Users className="h-3 w-3 mr-1.5" />
            {formatNumber(segment.visitors)} visitantes
          </Badge>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-xl bg-secondary/50 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground mb-1">Taxa de Conversão</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {segment.conversionRate?.toFixed(2)}%
            </p>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground mb-1">Valor Médio</p>
            <p className="text-xl font-bold">
              {formatCurrency(segment.avgValue)}
            </p>
          </div>
        </div>

        {/* Revenue */}
        <div className="pt-4 border-t border-border/50 mb-4">
          <p className="text-xs text-muted-foreground mb-1.5">Receita Total</p>
          <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary">
            {formatCurrency(segment.totalRevenue)}
          </p>
        </div>

        {/* Conditions badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {segment.conditions.source && segment.conditions.source.slice(0, 2).map(s => (
            <Badge key={s} variant="outline" className="text-xs bg-background/50">
              {s}
            </Badge>
          ))}
          {segment.conditions.source && segment.conditions.source.length > 2 && (
            <Badge variant="outline" className="text-xs bg-background/50">
              +{segment.conditions.source.length - 2}
            </Badge>
          )}
        </div>

        {/* Action button */}
        <Button
          size="sm"
          className="w-full group/btn bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <Target className="h-3.5 w-3.5 mr-1.5 group-hover/btn:rotate-12 transition-transform" />
          Aplicar em Experimento
          <ExternalLink className="h-3.5 w-3.5 ml-auto group-hover/btn:translate-x-0.5 transition-transform" />
        </Button>
      </div>
    </Card>
  )
}

// Skeleton Loader Premium
const SkeletonLoader = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="h-40 border-0 bg-gradient-to-br from-secondary/20 to-secondary/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
            style={{
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
            }}
          />
        </Card>
      ))}
    </div>
    <Card className="h-96 border-0 bg-gradient-to-br from-secondary/20 to-secondary/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
        style={{
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite',
        }}
      />
    </Card>
  </div>
)

// Empty State Premium
const EmptyStatePremium = ({
  icon: Icon,
  title,
  description,
  action
}: {
  icon: any
  title: string
  description: string
  action: { label: string; onClick: () => void }
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <Icon className="h-12 w-12 text-primary" />
      </div>
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-center max-w-md mb-6 leading-relaxed">
      {description}
    </p>
    <Button
      onClick={action.onClick}
      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all group"
    >
      <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
      {action.label}
    </Button>
  </div>
)

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 bg-gradient-to-br from-background to-secondary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            Nova Campanha UTM
          </DialogTitle>
          <DialogDescription>
            Configure uma nova campanha de marketing com parâmetros UTM para rastreamento avançado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Informações Básicas
            </h4>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Campanha *</Label>
              <Input
                id="name"
                placeholder="Ex: Black Friday 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-border/50 focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="source">Fonte (utm_source) *</Label>
                <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                  <SelectTrigger className="border-border/50 focus:border-primary">
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
                  <SelectTrigger className="border-border/50 focus:border-primary">
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

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Parâmetros UTM
            </h4>

            <div className="grid gap-2">
              <Label htmlFor="campaign">Campanha (utm_campaign) *</Label>
              <Input
                id="campaign"
                placeholder="Ex: black-friday-2024"
                value={formData.campaign}
                onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                className="border-border/50 focus:border-primary transition-colors"
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
                  className="border-border/50 focus:border-primary transition-colors"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="term">Termo (utm_term)</Label>
                <Input
                  id="term"
                  placeholder="Ex: ofertas black friday"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  className="border-border/50 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Budget e Metas
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="budget">Orçamento (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="0.00"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="border-border/50 focus:border-primary transition-colors"
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
                  className="border-border/50 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {formData.source && formData.medium && formData.campaign && (
            <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <Label className="text-xs font-medium flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-primary" />
                Preview da URL
              </Label>
              <code className="text-xs break-all block text-muted-foreground leading-relaxed">
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
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Sparkles className="h-4 w-4 mr-2" />
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 bg-gradient-to-br from-background to-secondary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <Target className="h-5 w-5 text-primary" />
            </div>
            Criar Segmento de Audiência
          </DialogTitle>
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
              className="border-border/50 focus:border-primary transition-colors"
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
              className="border-border/50 focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Condições de Segmentação
            </h4>

            <div className="grid gap-2">
              <Label>Fontes de Tráfego</Label>
              <div className="flex flex-wrap gap-2">
                {['google', 'facebook', 'instagram', 'linkedin', 'twitter', 'organic', 'direct'].map((source) => (
                  <Button
                    key={source}
                    variant={formData.sources.includes(source) ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      "transition-all",
                      formData.sources.includes(source) && "bg-gradient-to-r from-primary to-primary/80"
                    )}
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
                    className={cn(
                      "transition-all",
                      formData.mediums.includes(medium) && "bg-gradient-to-r from-primary to-primary/80"
                    )}
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
                    className={cn(
                      "transition-all",
                      formData.devices.includes(device) && "bg-gradient-to-r from-primary to-primary/80"
                    )}
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
                    className={cn(
                      "transition-all",
                      formData.countries.includes(country) && "bg-gradient-to-r from-primary to-primary/80"
                    )}
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
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
              <Label className="text-xs font-medium flex items-center gap-2">
                <Check className="h-3 w-3 text-primary" />
                Resumo das Condições
              </Label>
              <div className="text-sm space-y-1 text-muted-foreground">
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
          <Button
            onClick={handleSave}
            disabled={!formData.name}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Target className="h-4 w-4 mr-2" />
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

export function AudiencesTabPremium({ periodFilter = '90d', onPeriodChange }: AudiencesTabProps) {
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
    return <SkeletonLoader />
  }

  return (
    <div className="animate-fade-in">
      {/* Enhanced Hero Section - Full Width */}
      <div className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 border-b border-border/20 p-8 md:p-12 mb-10">
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-cyan-500 blur-3xl" />
          <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-purple-500 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          {/* Período Selector */}
          <div className="mb-6 flex justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-950/40 backdrop-blur px-4 py-2 text-sm">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <Select value={periodFilter} onValueChange={(v) => onPeriodChange?.(v as any)}>
                <SelectTrigger className="h-8 w-[160px] bg-transparent border-0 focus:ring-0 focus:ring-offset-0 text-white">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border border-slate-700">
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 text-purple-200 text-sm font-medium mb-6 border border-purple-400/30 backdrop-blur">
              <Users className="w-4 h-4 mr-2" />
              Gestão de Audiências
            </div>
            
            <div className="mb-4">
              <h2 className="text-white text-5xl md:text-7xl font-black tracking-tight leading-tight mb-2">
                Domine Suas
              </h2>
              <h3 className="text-cyan-400 text-5xl md:text-7xl font-black tracking-tight leading-tight">
                Campanhas
              </h3>
            </div>
            
            <p className="text-blue-200/80 text-lg md:text-xl max-w-2xl leading-relaxed mb-8">
              Rastreie campanhas UTM, segmente audiências e otimize o ROI de cada ação de marketing com dados precisos em tempo real.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setShowNewCampaign(true)}
                size="lg" 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Campanha
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-blue-400/50 text-blue-200 hover:bg-blue-950/50 hover:border-blue-400"
                onClick={() => setShowNewSegment(true)}
              >
                <Target className="w-5 h-5 mr-2" />
                Novo Segmento
              </Button>
            </div>
          </div>
          
          {/* Stats Preview */}
          <div className="lg:w-96">
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-400/30 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-200 text-sm font-medium">Visitantes</span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/50">↑ 12%</Badge>
                </div>
                <p className="text-3xl font-black text-white">{formatNumber(totalMetrics.visitors)}</p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-400/30 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-200 text-sm font-medium">Conversões</span>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/50">↑ 8%</Badge>
                </div>
                <p className="text-3xl font-black text-white">{formatNumber(totalMetrics.conversions)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-400/30 p-4 backdrop-blur-sm">
                  <span className="text-blue-200 text-xs font-medium block mb-2">Taxa Conv.</span>
                  <p className="text-2xl font-black text-orange-300">{avgConversionRate.toFixed(1)}%</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-400/30 p-4 backdrop-blur-sm">
                  <span className="text-blue-200 text-xs font-medium block mb-2">ROAS</span>
                  <p className="text-2xl font-black text-purple-300">{roas.toFixed(2)}x</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Main Content Section - Centered */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Filtros Section - Premium Style */}
          <Card className="card-glass border border-border/50 shadow-xl backdrop-blur-sm">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center flex-1 w-full lg:w-auto">
                  <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Buscar campanhas e segmentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-11 h-11 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background/50 backdrop-blur-sm"
                    />
                  </div>

                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-full md:w-48 h-11 border-border/50 focus:border-primary bg-background/50 backdrop-blur-sm">
                      <SelectValue placeholder="Todas as fontes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as fontes</SelectItem>
                      {uniqueSources.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full lg:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-1 lg:flex-none h-11 hover:bg-secondary/80 transition-all group border-border/50 bg-background/50 backdrop-blur-sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                    Filtros
                    {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-border/50 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="border-border/50 focus:border-primary">
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
                    <SelectTrigger className="border-border/50 focus:border-primary">
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
                    <SelectTrigger className="border-border/50 focus:border-primary">
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
            </div>
          </Card>

          {/* Tabs Content */}
          <Card className="card-glass border border-border/50 shadow-xl">
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
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Campanhas de Marketing</h3>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {filteredCampaigns.length} campanhas {filteredCampaigns.length === 1 ? 'encontrada' : 'encontradas'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowNewCampaign(true)}
                    className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all group"
                  >
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                    Nova Campanha
                  </Button>
                </div>

                {filteredCampaigns.length === 0 ? (
                  <EmptyStatePremium
                    icon={Target}
                    title="Nenhuma campanha encontrada"
                    description="Crie sua primeira campanha de marketing para começar a rastrear resultados e otimizar seu ROI."
                    action={{
                      label: "Criar Primeira Campanha",
                      onClick: () => setShowNewCampaign(true)
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCampaigns.slice(0, 12).map((campaign) => (
                      <CampaignCardPremium
                        key={campaign.id}
                        campaign={campaign}
                        onClick={() => setSelectedCampaign(campaign)}
                        onEdit={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Segmentos Tab */}
            {audienceTab === 'segmentos' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Segmentos de Audiência</h3>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {segments.length} {segments.length === 1 ? 'segmento identificado' : 'segmentos identificados'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowNewSegment(true)}
                    className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all group"
                  >
                    <Target className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                    Criar Segmento
                  </Button>
                </div>

                {segments.length === 0 ? (
                  <EmptyStatePremium
                    icon={Target}
                    title="Nenhum segmento criado"
                    description="Crie segmentos personalizados para analisar e segmentar sua audiência de forma mais efetiva."
                    action={{
                      label: "Criar Primeiro Segmento",
                      onClick: () => setShowNewSegment(true)
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {segments.map((segment) => (
                      <SegmentCardPremium
                        key={segment.id}
                        segment={segment}
                        onClick={() => setSelectedSegment(segment)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {audienceTab === 'analytics' && (
              <div className="space-y-8 animate-fade-in">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">Analytics Avançado</h3>
                  <p className="text-muted-foreground">Análise detalhada de performance e métricas de marketing</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance por Fonte */}
                  <Card className="p-6 border-0 bg-gradient-to-br from-background to-secondary/10 shadow-lg">
                    <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Performance por Fonte
                    </h4>
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
                          <div key={source} className="space-y-2 group">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="font-medium bg-primary/5 border-primary/20 group-hover:bg-primary/10 transition-colors">
                                  {source}
                                </Badge>
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
                            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-primary to-primary/60 rounded-full h-2 transition-all duration-500 group-hover:from-primary/90 group-hover:to-primary/80"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Card>

                  {/* Top Campanhas */}
                  <Card className="p-6 border-0 bg-gradient-to-br from-background to-secondary/10 shadow-lg">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Top Campanhas por Receita
                    </h4>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RBarChart
                          data={filteredCampaigns.sort((a,b)=> (b.revenue||0)-(a.revenue||0)).slice(0,5)}
                          layout="vertical"
                          margin={{ left: 16, right: 16, top: 8, bottom: 8 }}
                        >
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
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
                            width={120}
                            tickFormatter={(v)=> String(v).slice(0,18) + (String(v).length>18?'...':'')}
                            fontSize={11}
                          />
                          <Tooltip content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const val = payload[0].value as number
                              return (
                                <div className="rounded-xl border-0 bg-background/95 backdrop-blur-sm p-3 shadow-2xl">
                                  <div className="font-semibold mb-1 text-sm">{label}</div>
                                  <div className="text-sm text-primary font-semibold">{formatCurrency(val)}</div>
                                </div>
                              )
                            }
                            return null
                          }} />
                          <Bar dataKey="revenue" fill="url(#barGradient)" radius={[0,8,8,0]} />
                        </RBarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Métricas de Advertising */}
                  <Card className="p-6 border-0 bg-gradient-to-br from-background to-secondary/10 shadow-lg lg:col-span-2">
                    <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Métricas de Advertising
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        {
                          icon: MousePointer,
                          label: 'CTR Médio',
                          desc: 'Taxa de clique',
                          value: campaigns.length > 0 ? `${(campaigns.reduce((sum, c) => sum + (c.ctr || 0), 0) / campaigns.length).toFixed(2)}%` : '0.00%',
                          trend: '+1.2%',
                          trendUp: true,
                          gradient: 'from-blue-500 to-cyan-500'
                        },
                        {
                          icon: DollarSign,
                          label: 'CPC Médio',
                          desc: 'Custo por clique',
                          value: formatCurrency(campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + (c.cpc || 0), 0) / campaigns.length : 0),
                          trend: '+0.15',
                          trendUp: false,
                          gradient: 'from-green-500 to-emerald-500'
                        },
                        {
                          icon: Eye,
                          label: 'CPM Médio',
                          desc: 'Custo por mil impressões',
                          value: formatCurrency(campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + (c.cpm || 0), 0) / campaigns.length : 0),
                          trend: '-2.3%',
                          trendUp: true,
                          gradient: 'from-purple-500 to-pink-500'
                        },
                        {
                          icon: Activity,
                          label: 'Impressões',
                          desc: 'Alcance total',
                          value: formatNumber(campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0)),
                          trend: '+12.5%',
                          trendUp: true,
                          gradient: 'from-orange-500 to-amber-500'
                        }
                      ].map((metric, idx) => (
                        <div key={idx} className="group relative">
                          <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300"
                            style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                          />
                          <div className="relative p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-all duration-300 group-hover:-translate-y-1">
                            <div className="flex items-center gap-3 mb-4">
                              <div className={cn(
                                "p-3 rounded-xl bg-gradient-to-br group-hover:scale-110 transition-transform duration-300",
                                metric.gradient
                              )}>
                                <metric.icon className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">{metric.label}</p>
                              <p className="text-2xl font-bold mb-1">{metric.value}</p>
                              <div className="flex items-center gap-2 text-xs">
                                {metric.trendUp ? (
                                  <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {metric.trend}
                                  </span>
                                ) : (
                                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    {metric.trend}
                                  </span>
                                )}
                                <span className="text-muted-foreground">{metric.desc}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Modals */}
        <CampaignModalImproved
          open={showNewCampaign}
          onOpenChange={setShowNewCampaign}
          onSave={handleNewCampaign}
        />

        <SegmentModalImproved
          open={showNewSegment}
          onOpenChange={setShowNewSegment}
          onSave={handleNewSegment}
        />

        {/* Campaign Details Modal */}
        {selectedCampaign && (
          <Dialog open={!!selectedCampaign} onOpenChange={() => setSelectedCampaign(null)}>
            <DialogContent className="max-w-3xl border-0 bg-gradient-to-br from-background to-secondary/20">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  {selectedCampaign.name}
                </DialogTitle>
                <DialogDescription>Detalhes completos da campanha</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Visitantes', value: formatNumber(selectedCampaign.visitors) },
                    { label: 'Conversões', value: formatNumber(selectedCampaign.conversions) },
                    { label: 'Receita', value: formatCurrency(selectedCampaign.revenue) },
                    { label: 'ROAS', value: `${(selectedCampaign.cost && selectedCampaign.cost > 0 ? selectedCampaign.revenue / selectedCampaign.cost : 0).toFixed(2)}x` }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-secondary/50 rounded-xl border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-xl font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Parâmetros UTM
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-secondary/30 rounded-xl">
                    <div>
                      <span className="text-muted-foreground">Fonte:</span>{' '}
                      <Badge variant="outline" className="ml-2">{selectedCampaign.source}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mídia:</span>{' '}
                      <Badge variant="outline" className="ml-2">{selectedCampaign.medium}</Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Campanha:</span>{' '}
                      <code className="ml-2 px-2 py-1 bg-secondary rounded text-xs">{selectedCampaign.campaign}</code>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedCampaign(null)}>Fechar</Button>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  Editar Campanha
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Segment Details Modal */}
        {selectedSegment && (
          <Dialog open={!!selectedSegment} onOpenChange={() => setSelectedSegment(null)}>
            <DialogContent className="max-w-2xl border-0 bg-gradient-to-br from-background to-secondary/20">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  {selectedSegment.name}
                </DialogTitle>
                <DialogDescription>{selectedSegment.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Visitantes', value: formatNumber(selectedSegment.visitors) },
                    { label: 'Conversão', value: `${selectedSegment.conversionRate.toFixed(2)}%` },
                    { label: 'Receita', value: formatCurrency(selectedSegment.totalRevenue) }
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-secondary/50 rounded-xl border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-2xl font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Condições do Segmento
                  </h4>
                  <div className="space-y-2 text-sm p-4 bg-secondary/30 rounded-xl">
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
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Target className="h-4 w-4 mr-2" />
                  Aplicar em Experimento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>
    </div>
  )
}
