'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Target,
  Users,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AudienceSegment } from '@/lib/analytics'

interface SegmentModalImprovedProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (segment: Partial<AudienceSegment>) => void
}

const SOURCE_OPTIONS = [
  { value: 'google', label: 'Google', icon: Globe, color: 'bg-blue-500' },
  { value: 'facebook', label: 'Facebook', icon: Globe, color: 'bg-blue-600' },
  { value: 'instagram', label: 'Instagram', icon: Globe, color: 'bg-pink-500' },
  { value: 'linkedin', label: 'LinkedIn', icon: Globe, color: 'bg-blue-700' },
  { value: 'twitter', label: 'Twitter', icon: Globe, color: 'bg-sky-400' },
  { value: 'organic', label: 'Orgânico', icon: Globe, color: 'bg-green-500' },
  { value: 'direct', label: 'Direto', icon: Globe, color: 'bg-gray-500' }
]

const MEDIUM_OPTIONS = [
  { value: 'cpc', label: 'CPC', color: 'bg-purple-500' },
  { value: 'cpm', label: 'CPM', color: 'bg-indigo-500' },
  { value: 'organic', label: 'Orgânico', color: 'bg-green-500' },
  { value: 'social', label: 'Social', color: 'bg-pink-500' },
  { value: 'email', label: 'Email', color: 'bg-orange-500' },
  { value: 'referral', label: 'Referral', color: 'bg-cyan-500' }
]

const DEVICE_OPTIONS = [
  { value: 'desktop', label: 'Desktop', icon: Monitor, color: 'bg-slate-600' },
  { value: 'mobile', label: 'Mobile', icon: Smartphone, color: 'bg-blue-600' },
  { value: 'tablet', label: 'Tablet', icon: Tablet, color: 'bg-purple-600' }
]

const COUNTRY_OPTIONS = [
  { value: 'BR', label: 'Brasil', flag: '🇧🇷' },
  { value: 'US', label: 'Estados Unidos', flag: '🇺🇸' },
  { value: 'UK', label: 'Reino Unido', flag: '🇬🇧' },
  { value: 'PT', label: 'Portugal', flag: '🇵🇹' },
  { value: 'ES', label: 'Espanha', flag: '🇪🇸' },
  { value: 'AR', label: 'Argentina', flag: '🇦🇷' },
  { value: 'MX', label: 'México', flag: '🇲🇽' }
]

export function SegmentModalImproved({ open, onOpenChange, onSave }: SegmentModalImprovedProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sources: [] as string[],
    mediums: [] as string[],
    devices: [] as string[],
    countries: [] as string[]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleSelection = (array: string[], value: string) => {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value]
  }

  const handleSave = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name) newErrors.name = 'Nome é obrigatório'

    const hasConditions = formData.sources.length > 0 || formData.mediums.length > 0 ||
                         formData.devices.length > 0 || formData.countries.length > 0
    if (!hasConditions) {
      newErrors.conditions = 'Selecione pelo menos uma condição'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

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

    // Reset
    setFormData({
      name: '',
      description: '',
      sources: [],
      mediums: [],
      devices: [],
      countries: []
    })
    setErrors({})
    onOpenChange(false)
  }

  const estimatedReach = Math.floor(
    (formData.sources.length * 1000 +
     formData.devices.length * 800 +
     formData.countries.length * 500) * 1.5
  )

  const totalConditions = formData.sources.length + formData.mediums.length +
                          formData.devices.length + formData.countries.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto border-0 bg-gradient-to-br from-background to-secondary/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Criar Segmento de Audiência</DialogTitle>
              <DialogDescription>
                Defina condições para segmentar sua audiência de forma precisa
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="font-semibold">Informações Básicas</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seg-name" className="flex items-center gap-2">
                    Nome do Segmento
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="seg-name"
                    placeholder="Ex: Visitantes Mobile do Google"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={cn(
                      "border-border/50 focus:border-primary transition-colors",
                      errors.name && "border-destructive focus:border-destructive"
                    )}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seg-description">Descrição</Label>
                  <Textarea
                    id="seg-description"
                    placeholder="Descreva o objetivo e uso deste segmento..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="border-border/50 focus:border-primary transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  <h3 className="font-semibold">Condições de Segmentação</h3>
                </div>
                {errors.conditions && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.conditions}
                  </p>
                )}
              </div>

              {/* Sources */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Fontes de Tráfego
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SOURCE_OPTIONS.map((source) => {
                    const isSelected = formData.sources.includes(source.value)
                    return (
                      <button
                        key={source.value}
                        onClick={() => setFormData({
                          ...formData,
                          sources: toggleSelection(formData.sources, source.value)
                        })}
                        className={cn(
                          "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200",
                          "hover:scale-105 active:scale-95",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <source.icon className="h-4 w-4" />
                          {source.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mediums */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Tipo de Mídia
                </Label>
                <div className="flex flex-wrap gap-2">
                  {MEDIUM_OPTIONS.map((medium) => {
                    const isSelected = formData.mediums.includes(medium.value)
                    return (
                      <button
                        key={medium.value}
                        onClick={() => setFormData({
                          ...formData,
                          mediums: toggleSelection(formData.mediums, medium.value)
                        })}
                        className={cn(
                          "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200",
                          "hover:scale-105 active:scale-95",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        {medium.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Devices */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Dispositivos
                </Label>
                <div className="flex flex-wrap gap-2">
                  {DEVICE_OPTIONS.map((device) => {
                    const isSelected = formData.devices.includes(device.value)
                    return (
                      <button
                        key={device.value}
                        onClick={() => setFormData({
                          ...formData,
                          devices: toggleSelection(formData.devices, device.value)
                        })}
                        className={cn(
                          "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200",
                          "hover:scale-105 active:scale-95",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <device.icon className="h-4 w-4" />
                          {device.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Countries */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Países
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRY_OPTIONS.map((country) => {
                    const isSelected = formData.countries.includes(country.value)
                    return (
                      <button
                        key={country.value}
                        onClick={() => setFormData({
                          ...formData,
                          countries: toggleSelection(formData.countries, country.value)
                        })}
                        className={cn(
                          "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200",
                          "hover:scale-105 active:scale-95",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          {country.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Column */}
          <div className="space-y-4">
            <div className="sticky top-6 space-y-4">
              {/* Live Preview */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Preview do Segmento</h4>
                </div>

                {/* Segment Name */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nome</p>
                  <p className="text-sm font-medium">
                    {formData.name || <span className="text-muted-foreground italic">Não definido</span>}
                  </p>
                </div>

                {/* Description */}
                {formData.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                    <p className="text-xs leading-relaxed">{formData.description}</p>
                  </div>
                )}

                {/* Conditions Summary */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Condições Ativas</p>
                  {totalConditions === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhuma condição selecionada</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            {formData.sources.length} {formData.sources.length === 1 ? 'fonte' : 'fontes'}
                          </Badge>
                        </div>
                      )}
                      {formData.mediums.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                            {formData.mediums.length} {formData.mediums.length === 1 ? 'mídia' : 'mídias'}
                          </Badge>
                        </div>
                      )}
                      {formData.devices.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                            {formData.devices.length} {formData.devices.length === 1 ? 'dispositivo' : 'dispositivos'}
                          </Badge>
                        </div>
                      )}
                      {formData.countries.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
                            {formData.countries.length} {formData.countries.length === 1 ? 'país' : 'países'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Reach */}
              {totalConditions > 0 && (
                <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20 animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100">Alcance Estimado</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {estimatedReach.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      visitantes podem ser alcançados com estas condições
                    </p>
                  </div>
                </div>
              )}

              {/* Selected Conditions Detail */}
              {totalConditions > 0 && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-3 animate-fade-in">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Condições Selecionadas
                  </p>
                  <div className="space-y-2 text-xs">
                    {formData.sources.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Fontes:</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.sources.map(s => (
                            <Badge key={s} variant="outline" className="text-xs capitalize">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.mediums.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Mídias:</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.mediums.map(m => (
                            <Badge key={m} variant="outline" className="text-xs uppercase">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.devices.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Dispositivos:</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.devices.map(d => (
                            <Badge key={d} variant="outline" className="text-xs capitalize">{d}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {formData.countries.length > 0 && (
                      <div>
                        <p className="text-muted-foreground mb-1">Países:</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.countries.map(c => (
                            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setErrors({})
            onOpenChange(false)
          }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Target className="h-4 w-4" />
            Criar Segmento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
