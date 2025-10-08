"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  X, Target, Globe, Shuffle, ArrowLeft, ArrowRight, Check,
  AlertTriangle, Link, Plus, Trash2, Crown, Info,
  Zap, BarChart3, Clock, Users, ChevronRight, Settings,
  Sparkles, Brain, TrendingUp, Rocket, Star, Shield, DollarSign
} from 'lucide-react'

interface PremiumExperimentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ExperimentFormData) => Promise<void>
  saving?: boolean
}

interface ExperimentFormData {
  name: string
  description: string
  targetUrl: string
  testType: 'split_url' | 'visual'
  trafficAllocation: number
  variants: Array<{
    name: string
    description: string
    url: string
    isControl: boolean
  }>
  goalType: 'page_view' | 'click' | 'form_submit'
  goalValue: string
  conversionValue?: number
  duration: number
  algorithm: 'uniform' | 'thompson_sampling' | 'ucb1' | 'epsilon_greedy'
}

const INITIAL_FORM_DATA: ExperimentFormData = {
  name: '',
  description: '',
  targetUrl: '',
  testType: 'split_url',
  trafficAllocation: 100,
  variants: [
    { name: 'Original', description: 'Versão atual', url: '', isControl: true },
    { name: 'Variante A', description: 'Nova versão', url: '', isControl: false }
  ],
  goalType: 'page_view',
  goalValue: '',
  conversionValue: undefined,
  duration: 14,
  algorithm: 'thompson_sampling'
}

export function PremiumExperimentModal({ isOpen, onClose, onSave, saving = false }: PremiumExperimentModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<ExperimentFormData>(INITIAL_FORM_DATA)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setFormData(INITIAL_FORM_DATA)
      setValidationErrors({})
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const steps = [
    { number: 1, title: 'Setup', desc: 'Configuração inicial', icon: Settings, color: 'from-blue-500 to-cyan-500' },
    { number: 2, title: 'Variantes', desc: 'Versões do teste', icon: Shuffle, color: 'from-purple-500 to-pink-500' },
    { number: 3, title: 'Meta', desc: 'Objetivo final', icon: Target, color: 'from-green-500 to-emerald-500' }
  ]

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          errors.name = 'Nome é obrigatório'
        }
        if (!formData.targetUrl.trim()) {
          errors.targetUrl = 'URL é obrigatória'
        } else {
          try {
            new URL(formData.targetUrl)
          } catch {
            errors.targetUrl = 'URL inválida'
          }
        }
        break

      case 2:
        const hasControl = formData.variants.some(v => v.isControl)
        if (!hasControl) {
          errors.variants = 'Defina uma versão original'
        }

        for (let i = 0; i < formData.variants.length; i++) {
          const variant = formData.variants[i]
          if (!variant.name.trim()) {
            errors[`variant_${i}_name`] = 'Nome obrigatório'
          }
          if (formData.testType === 'split_url' && !variant.isControl && !variant.url?.trim()) {
            errors[`variant_${i}_url`] = 'URL obrigatória'
          }
        }
        break

      case 3:
        if (!formData.goalValue.trim()) {
          errors.goalValue = 'Objetivo é obrigatório'
        }
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep() && step < 3) {
      setStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(prev => prev - 1)
      setValidationErrors({})
    }
  }

  const handleSave = async () => {
    if (!validateCurrentStep()) return

    try {
      const processedData = {
        ...formData,
        variants: formData.variants.map(variant =>
          variant.isControl && !variant.url
            ? { ...variant, url: formData.targetUrl }
            : variant
        )
      }

      await onSave(processedData)
      onClose()
    } catch (error) {
      console.error('Error saving experiment:', error)
    }
  }

  const updateFormData = (updates: Partial<ExperimentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setValidationErrors({})
  }

  const addVariant = () => {
    // Removida limitação - agora aceita quantas variantes o usuário quiser
    const variantIndex = formData.variants.length - 1
    const letter = variantIndex < 26 
      ? String.fromCharCode(65 + variantIndex)
      : `${Math.floor(variantIndex / 26)}${String.fromCharCode(65 + (variantIndex % 26))}`
    
    const newVariant = {
      name: `Variante ${letter}`,
      description: '',
      url: '',
      isControl: false
    }

    updateFormData({
      variants: [...formData.variants, newVariant]
    })
  }

  const removeVariant = (index: number) => {
    if (formData.variants.length <= 2 || formData.variants[index]?.isControl) return

    updateFormData({
      variants: formData.variants.filter((_, i) => i !== index)
    })
  }

  const updateVariant = (index: number, field: string, value: string) => {
    updateFormData({
      variants: formData.variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    })
  }

  const setVariantAsControl = (index: number) => {
    updateFormData({
      variants: formData.variants.map((variant, i) => ({
        ...variant,
        isControl: i === index
      }))
    })
  }

  const algorithmOptions = [
    {
      value: 'thompson_sampling',
      label: 'Thompson Sampling',
      desc: 'IA otimiza automaticamente',
      icon: Brain,
      premium: true,
      color: 'text-purple-600'
    },
    {
      value: 'ucb1',
      label: 'UCB1',
      desc: 'Upper Confidence Bound',
      icon: TrendingUp,
      premium: true,
      color: 'text-blue-600'
    },
    {
      value: 'epsilon_greedy',
      label: 'Epsilon Greedy',
      desc: 'Exploração equilibrada',
      icon: Target,
      premium: false,
      color: 'text-green-600'
    },
    {
      value: 'uniform',
      label: 'Uniforme',
      desc: 'Distribuição igual',
      icon: BarChart3,
      premium: false,
      color: 'text-slate-600'
    }
  ]

  const currentStep = steps[step - 1]

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 px-1">
            {/* Header com gradiente */}
            <div className="text-center">
              <div className={cn(
                "w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl",
                "bg-gradient-to-br", currentStep.color
              )}>
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Configuração Inicial
              </h3>
              <p className="text-slate-600 text-lg">Configure os detalhes básicos do seu experimento</p>
            </div>

            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Nome do Experimento *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="Ex: Botão CTA Principal - Teste de Cores"
                  className={cn(
                    "h-14 text-base border-2 border-slate-200 rounded-2xl transition-all duration-300",
                    "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20",
                    "group-hover:border-slate-300",
                    validationErrors.name && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  )}
                />
                {validationErrors.name && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm animate-in slide-in-from-left-1">
                    <AlertTriangle className="w-4 h-4" />
                    {validationErrors.name}
                  </div>
                )}
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Descrição e Hipótese
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Descreva sua hipótese: 'Acredito que mudando X para Y, verei um aumento de Z% porque...'"
                  className={cn(
                    "min-h-[100px] text-base border-2 border-slate-200 rounded-2xl transition-all duration-300 resize-none",
                    "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20",
                    "group-hover:border-slate-300"
                  )}
                  rows={4}
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  URL da Página *
                </label>
                <Input
                  value={formData.targetUrl}
                  onChange={(e) => updateFormData({ targetUrl: e.target.value })}
                  placeholder="https://seusite.com/pagina-de-teste"
                  className={cn(
                    "h-14 text-base border-2 border-slate-200 rounded-2xl transition-all duration-300",
                    "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20",
                    "group-hover:border-slate-300",
                    validationErrors.targetUrl && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  )}
                />
                {validationErrors.targetUrl && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm animate-in slide-in-from-left-1">
                    <AlertTriangle className="w-4 h-4" />
                    {validationErrors.targetUrl}
                  </div>
                )}
                <p className="text-sm text-slate-500 mt-2">
                  Esta é a página onde o experimento será executado
                </p>
              </div>

              {/* Tipo de teste com cards premium */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-4">
                  Tipo de Teste
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => updateFormData({ testType: 'split_url' })}
                    className={cn(
                      'group p-6 rounded-3xl border-2 text-left transition-all duration-300 hover:scale-[1.02]',
                      formData.testType === 'split_url'
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl shadow-blue-500/25'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                        formData.testType === 'split_url'
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      )}>
                        <Link className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-2">Dividir URLs</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Direciona visitantes para páginas diferentes. Ideal para testar designs completamente novos.
                        </p>
                      </div>
                      {formData.testType === 'split_url' && (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateFormData({ testType: 'visual' })}
                    className={cn(
                      'group p-6 rounded-3xl border-2 text-left transition-all duration-300 hover:scale-[1.02]',
                      formData.testType === 'visual'
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl shadow-purple-500/25'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                        formData.testType === 'visual'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      )}>
                        <Shuffle className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-2">Visual</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Altera elementos na mesma página. Perfeito para testar botões, textos e cores.
                        </p>
                      </div>
                      {formData.testType === 'visual' && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Configurações em grid premium */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    Tráfego %
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.trafficAllocation}
                    onChange={(e) => updateFormData({ trafficAllocation: parseInt(e.target.value) || 100 })}
                    className="h-12 border-2 border-slate-200 rounded-xl transition-all duration-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 group-hover:border-slate-300"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Duração
                  </label>
                  <Select
                    value={formData.duration.toString()}
                    onValueChange={(value) => updateFormData({ duration: parseInt(value) })}
                  >
                    <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl transition-all duration-300 hover:border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="14">14 dias (recomendado)</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="60">60 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8 px-1">
            <div className="text-center">
              <div className={cn(
                "w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl",
                "bg-gradient-to-br", currentStep.color
              )}>
                <Shuffle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Variantes do Teste
              </h3>
              <p className="text-slate-600 text-lg">Configure as versões que serão comparadas</p>
            </div>

            {validationErrors.variants && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-4 animate-in slide-in-from-top-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-red-700 font-medium">{validationErrors.variants}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={index} className={cn(
                  'group relative p-6 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl',
                  variant.isControl
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg shadow-amber-500/25'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}>
                  {variant.isControl && (
                    <div className="absolute -top-3 left-6">
                      <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                        <Crown className="w-4 h-4" />
                        Versão Original
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white",
                        variant.isControl
                          ? "bg-gradient-to-br from-amber-500 to-orange-500"
                          : "bg-gradient-to-br from-purple-500 to-pink-500"
                      )}>
                        {variant.isControl ? <Crown className="w-5 h-5" /> : index}
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">
                        {variant.isControl ? 'Versão Original' : `Variante ${index}`}
                      </h4>
                    </div>
                    {!variant.isControl && formData.variants.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                        className="h-9 w-9 p-0 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all duration-300 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Input
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        placeholder="Nome da variante"
                        className={cn(
                          "h-12 border-2 border-slate-200 rounded-xl transition-all duration-300",
                          "focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20",
                          validationErrors[`variant_${index}_name`] && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        )}
                      />
                      {validationErrors[`variant_${index}_name`] && (
                        <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {validationErrors[`variant_${index}_name`]}
                        </p>
                      )}
                    </div>

                    {formData.testType === 'split_url' && (
                      <div>
                        <Input
                          value={variant.url}
                          onChange={(e) => updateVariant(index, 'url', e.target.value)}
                          placeholder={
                            variant.isControl
                              ? 'URL original (preenchida automaticamente)'
                              : 'https://seusite.com/variante-nova'
                          }
                          disabled={variant.isControl}
                          className={cn(
                            "h-12 border-2 rounded-xl transition-all duration-300",
                            variant.isControl
                              ? "bg-amber-50 border-amber-200 text-amber-700"
                              : "border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20",
                            validationErrors[`variant_${index}_url`] && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          )}
                        />
                        {validationErrors[`variant_${index}_url`] && (
                          <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {validationErrors[`variant_${index}_url`]}
                          </p>
                        )}
                      </div>
                    )}

                    <Textarea
                      value={variant.description}
                      onChange={(e) => updateVariant(index, 'description', e.target.value)}
                      placeholder="Descreva as mudanças desta variante..."
                      className="min-h-[80px] border-2 border-slate-200 rounded-xl transition-all duration-300 resize-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20"
                      rows={3}
                    />

                    {!variant.isControl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVariantAsControl(index)}
                        className="border-2 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all duration-300 rounded-xl"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Definir como Original
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Removida limitação de 4 variantes */}
              <button
                type="button"
                onClick={addVariant}
                  className="w-full p-6 border-2 border-dashed border-purple-300 rounded-3xl hover:border-purple-400 hover:bg-purple-50 text-purple-600 transition-all duration-300 hover:scale-[1.01] group"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-all duration-300">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-lg">Adicionar Variante</h4>
                      <p className="text-sm text-purple-500">Adicione quantas variantes quiser</p>
                    </div>
                  </div>
                </button>
            </div>

            {formData.testType === 'split_url' && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-lg mb-2">Como funciona o Teste de URL</h4>
                    <p className="text-blue-800 leading-relaxed">
                      Os visitantes serão automaticamente direcionados para as diferentes URLs que você configurou.
                      A versão original sempre usará a URL da página principal que você definiu no primeiro passo.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-8 px-1">
            <div className="text-center">
              <div className={cn(
                "w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl",
                "bg-gradient-to-br", currentStep.color
              )}>
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Objetivo e Algoritmo
              </h3>
              <p className="text-slate-600 text-lg">Defina como medir o sucesso e otimizar resultados</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Como medir o sucesso?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      value: 'page_view',
                      title: 'Acesso a uma página',
                      desc: 'Quando o usuário visita uma página específica',
                      icon: Globe,
                      color: 'from-blue-500 to-cyan-500'
                    },
                    {
                      value: 'click',
                      title: 'Clique em elemento',
                      desc: 'Quando o usuário clica em um botão ou link',
                      icon: Rocket,
                      color: 'from-purple-500 to-pink-500'
                    },
                    {
                      value: 'form_submit',
                      title: 'Envio de formulário',
                      desc: 'Quando o usuário submete um formulário',
                      icon: Star,
                      color: 'from-green-500 to-emerald-500'
                    }
                  ].map((goal) => {
                    const Icon = goal.icon
                    return (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => updateFormData({ goalType: goal.value as any })}
                        className={cn(
                          'group p-6 rounded-3xl border-2 text-left transition-all duration-300 hover:scale-[1.01]',
                          formData.goalType === goal.value
                            ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl shadow-green-500/25'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                              formData.goalType === goal.value
                                ? `bg-gradient-to-br ${goal.color} text-white`
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                            )}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg mb-1">{goal.title}</h4>
                              <p className="text-sm text-slate-600">{goal.desc}</p>
                            </div>
                          </div>
                          {formData.goalType === goal.value && (
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  {formData.goalType === 'page_view' && 'URL da página de sucesso *'}
                  {formData.goalType === 'click' && 'Seletor CSS do elemento *'}
                  {formData.goalType === 'form_submit' && 'Seletor CSS do formulário *'}
                </label>
                <Input
                  value={formData.goalValue}
                  onChange={(e) => updateFormData({ goalValue: e.target.value })}
                  placeholder={
                    formData.goalType === 'page_view'
                      ? 'https://seusite.com/obrigado'
                      : formData.goalType === 'click'
                      ? '#botao-cta, .btn-primary'
                      : '#form-contato, .newsletter-form'
                  }
                  className={cn(
                    "h-14 text-base border-2 border-slate-200 rounded-2xl transition-all duration-300",
                    "focus:border-green-500 focus:ring-4 focus:ring-green-500/20",
                    validationErrors.goalValue && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                  )}
                />
                {validationErrors.goalValue && (
                  <div className="flex items-center gap-2 mt-2 text-red-600 text-sm animate-in slide-in-from-left-1">
                    <AlertTriangle className="w-4 h-4" />
                    {validationErrors.goalValue}
                  </div>
                )}
                <p className="text-sm text-slate-500 mt-2">
                  {formData.goalType === 'page_view' && 'URL que indica uma conversão bem-sucedida'}
                  {formData.goalType === 'click' && 'Use seletores CSS como #id, .classe, ou tag'}
                  {formData.goalType === 'form_submit' && 'Seletor do formulário que será monitorado'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  Valor da Conversão (R$)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.conversionValue || ''}
                  onChange={(e) => updateFormData({ conversionValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0.00"
                  className={cn(
                    "h-14 text-base border-2 border-slate-200 rounded-2xl transition-all duration-300",
                    "focus:border-green-500 focus:ring-4 focus:ring-green-500/20"
                  )}
                />
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor monetário de cada conversão para cálculo de receita
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  Algoritmo de Otimização
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {algorithmOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateFormData({ algorithm: option.value as any })}
                        className={cn(
                          'group p-6 rounded-3xl border-2 text-left transition-all duration-300 hover:scale-[1.01]',
                          formData.algorithm === option.value
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl shadow-purple-500/25'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                              formData.algorithm === option.value
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                            )}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg">{option.label}</h4>
                                {option.premium && (
                                  <div className="px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full">
                                    PREMIUM
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-slate-600">{option.desc}</p>
                            </div>
                          </div>
                          {formData.algorithm === option.value && (
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Resumo final premium */}
            <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-3xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-green-900 text-lg mb-3">Resumo do Experimento</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-green-800">
                    <p><strong>Página:</strong> {formData.targetUrl.length > 25 ? formData.targetUrl.substring(0, 25) + '...' : formData.targetUrl}</p>
                    <p><strong>Tipo:</strong> {formData.testType === 'split_url' ? 'Dividir URLs' : 'Visual'}</p>
                    <p><strong>Variantes:</strong> {formData.variants.length}</p>
                    <p><strong>Duração:</strong> {formData.duration} dias</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/80 to-slate-900/90 backdrop-blur-xl"
        onClick={() => !saving && onClose()}
      />

      <div ref={modalRef} className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[95vh] bg-white sm:rounded-3xl shadow-2xl border overflow-hidden flex flex-col">
        {/* Header com gradiente e progresso */}
        <div className="px-6 py-5 border-b bg-gradient-to-r from-slate-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Criar Experimento A/B
              </h2>
              <p className="text-slate-600">Etapa {step} de 3 • {Math.round((step / 3) * 100)}% concluído</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => !saving && onClose()}
              className="h-10 w-10 p-0 rounded-2xl hover:bg-slate-200/50 transition-all duration-300"
              disabled={saving}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress com indicadores visuais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {steps.map((stepItem, index) => (
                <div key={stepItem.number} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className={cn(
                      'w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-500',
                      stepItem.number === step
                        ? `bg-gradient-to-br ${stepItem.color} text-white shadow-lg scale-110`
                        : stepItem.number < step
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-slate-200 text-slate-400'
                    )}>
                      {stepItem.number < step ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <stepItem.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className={cn(
                        'text-xs font-bold',
                        stepItem.number === step ? 'text-slate-900' :
                        stepItem.number < step ? 'text-green-600' : 'text-slate-400'
                      )}>
                        {stepItem.title}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'w-16 h-1 mx-3 rounded-full transition-all duration-500',
                      stepItem.number < step ? 'bg-green-500' : 'bg-slate-200'
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content area com scroll suave */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 pb-8">
            {renderStepContent()}
          </div>
        </div>

        {/* Footer com botões premium */}
        <div className="px-6 py-5 border-t bg-gradient-to-r from-slate-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              onClick={step === 1 ? onClose : handlePrev}
              variant="outline"
              disabled={saving}
              className="flex-1 h-12 border-2 rounded-2xl font-semibold transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Cancelar' : 'Anterior'}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Criar Experimento
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}