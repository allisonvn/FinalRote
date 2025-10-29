'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  CheckCircle2,
  AlertCircle,
  Globe,
  DollarSign,
  Target as TargetIcon,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampaignData } from '@/lib/analytics'

interface CampaignModalImprovedProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (campaign: Partial<CampaignData>) => void
}

const PLATFORM_ICONS: Record<string, any> = {
  google: Globe,
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  email: Mail,
  newsletter: Mail
}

const PLATFORM_COLORS: Record<string, string> = {
  google: 'from-blue-500 to-blue-600',
  facebook: 'from-blue-600 to-blue-700',
  instagram: 'from-pink-500 to-purple-600',
  linkedin: 'from-blue-700 to-blue-800',
  twitter: 'from-sky-400 to-sky-500',
  email: 'from-gray-600 to-gray-700',
  newsletter: 'from-orange-500 to-orange-600'
}

export function CampaignModalImproved({ open, onOpenChange, onSave }: CampaignModalImprovedProps) {
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)
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

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name) newErrors.name = 'Nome é obrigatório'
    if (!formData.source) newErrors.source = 'Fonte é obrigatória'
    if (!formData.medium) newErrors.medium = 'Mídia é obrigatória'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.campaign) newErrors.campaign = 'Campanha é obrigatória'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setErrors({})
    setStep(step - 1)
  }

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

    // Reset
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
    setStep(1)
    setErrors({})
    onOpenChange(false)
  }

  const generateUrl = () => {
    if (!formData.source || !formData.medium || !formData.campaign) return ''
    let url = `https://seusite.com/?utm_source=${formData.source}&utm_medium=${formData.medium}&utm_campaign=${formData.campaign}`
    if (formData.content) url += `&utm_content=${formData.content}`
    if (formData.term) url += `&utm_term=${formData.term}`
    return url
  }

  const copyUrl = () => {
    const url = generateUrl()
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getPlatformIcon = () => {
    const Icon = PLATFORM_ICONS[formData.source] || Globe
    return <Icon className="h-5 w-5" />
  }

  const getPlatformGradient = () => {
    return PLATFORM_COLORS[formData.source] || 'from-gray-500 to-gray-600'
  }

  const isStepComplete = (stepNum: number) => {
    if (stepNum === 1) {
      return formData.name && formData.source && formData.medium
    }
    if (stepNum === 2) {
      return formData.campaign
    }
    return true
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-0 bg-gradient-to-br from-background to-secondary/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Nova Campanha UTM</DialogTitle>
              <DialogDescription>
                Configure sua campanha de marketing em 3 etapas simples
              </DialogDescription>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 pt-6">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-sm transition-all duration-300",
                      step > stepNum
                        ? "bg-primary border-primary text-primary-foreground"
                        : step === stepNum
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-secondary border-border text-muted-foreground"
                    )}
                  >
                    {step > stepNum ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium hidden sm:inline transition-colors",
                      step >= stepNum ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {stepNum === 1 ? 'Básico' : stepNum === 2 ? 'Parâmetros' : 'Budget'}
                  </span>
                </div>
                {stepNum < 3 && (
                  <div
                    className={cn(
                      "h-0.5 w-full mx-2 transition-colors",
                      step > stepNum ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Step 1: Informações Básicas */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="font-semibold text-lg">Informações Básicas</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    Nome da Campanha
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: Black Friday 2024"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source" className="flex items-center gap-2">
                      Fonte (utm_source)
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.source}
                      onValueChange={(v) => setFormData({ ...formData, source: v })}
                    >
                      <SelectTrigger
                        className={cn(
                          "border-border/50 focus:border-primary",
                          errors.source && "border-destructive"
                        )}
                      >
                        <SelectValue placeholder="Selecione a fonte" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          { value: 'google', label: 'Google', icon: Globe },
                          { value: 'facebook', label: 'Facebook', icon: Facebook },
                          { value: 'instagram', label: 'Instagram', icon: Instagram },
                          { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                          { value: 'twitter', label: 'Twitter', icon: Twitter },
                          { value: 'email', label: 'Email', icon: Mail },
                          { value: 'newsletter', label: 'Newsletter', icon: Mail }
                        ].map((platform) => (
                          <SelectItem key={platform.value} value={platform.value}>
                            <div className="flex items-center gap-2">
                              <platform.icon className="h-4 w-4" />
                              {platform.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.source && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.source}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medium" className="flex items-center gap-2">
                      Mídia (utm_medium)
                      <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.medium}
                      onValueChange={(v) => setFormData({ ...formData, medium: v })}
                    >
                      <SelectTrigger
                        className={cn(
                          "border-border/50 focus:border-primary",
                          errors.medium && "border-destructive"
                        )}
                      >
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
                    {errors.medium && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.medium}
                      </p>
                    )}
                  </div>
                </div>

                {formData.source && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2.5 rounded-lg bg-gradient-to-br text-white",
                        getPlatformGradient()
                      )}>
                        {getPlatformIcon()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Plataforma Selecionada</p>
                        <p className="text-xs text-muted-foreground capitalize">{formData.source}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Parâmetros UTM */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="font-semibold text-lg">Parâmetros UTM</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign" className="flex items-center gap-2">
                    Nome da Campanha (utm_campaign)
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="campaign"
                    placeholder="Ex: black-friday-2024"
                    value={formData.campaign}
                    onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
                    className={cn(
                      "border-border/50 focus:border-primary transition-colors font-mono text-sm",
                      errors.campaign && "border-destructive focus:border-destructive"
                    )}
                  />
                  {errors.campaign && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.campaign}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Use apenas letras minúsculas, números e hifens
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">
                      Conteúdo (utm_content)
                      <span className="text-muted-foreground ml-1">opcional</span>
                    </Label>
                    <Input
                      id="content"
                      placeholder="Ex: anuncio-principal"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="border-border/50 focus:border-primary transition-colors font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="term">
                      Termo (utm_term)
                      <span className="text-muted-foreground ml-1">opcional</span>
                    </Label>
                    <Input
                      id="term"
                      placeholder="Ex: ofertas-black-friday"
                      value={formData.term}
                      onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                      className="border-border/50 focus:border-primary transition-colors font-mono text-sm"
                    />
                  </div>
                </div>

                {formData.campaign && (
                  <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Preview da URL
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyUrl}
                        className="h-7 gap-1.5 hover:bg-primary/10"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 text-primary" />
                            <span className="text-xs">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span className="text-xs">Copiar</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
                      <code className="text-xs break-all text-muted-foreground leading-relaxed block">
                        {generateUrl()}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Budget e Metas */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <h3 className="font-semibold text-lg">Budget e Metas</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Orçamento Total (R$)
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="0.00"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="border-border/50 focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">
                      Valor total que você pretende investir
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetCPA" className="flex items-center gap-2">
                      <TargetIcon className="h-4 w-4" />
                      CPA Alvo (R$)
                    </Label>
                    <Input
                      id="targetCPA"
                      type="number"
                      placeholder="0.00"
                      value={formData.targetCPA}
                      onChange={(e) => setFormData({ ...formData, targetCPA: e.target.value })}
                      className="border-border/50 focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">
                      Custo por aquisição desejado
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Resumo da Campanha</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Nome</p>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Plataforma</p>
                      <p className="font-medium capitalize">{formData.source} - {formData.medium}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Campanha UTM</p>
                      <code className="text-xs font-mono bg-background/50 px-2 py-1 rounded">{formData.campaign}</code>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Orçamento</p>
                      <p className="font-medium">
                        {formData.budget ? `R$ ${parseFloat(formData.budget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não definido'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <div className="flex gap-2 w-full justify-between">
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1)
                  setErrors({})
                  onOpenChange(false)
                }}
              >
                Cancelar
              </Button>
              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                >
                  <Sparkles className="h-4 w-4" />
                  Criar Campanha
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
