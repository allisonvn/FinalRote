"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  X, Target, Globe, Shuffle, TrendingUp, Zap, Check,
  Lightbulb, Eye, AlertCircle, Plus, Trash2, Crown,
  ArrowLeft, ArrowRight, Sparkles, Settings, Clock,
  BarChart3, Users, Link2, DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

interface ModernExperimentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ExperimentFormData) => Promise<void>
  saving?: boolean
}

interface ExperimentFormData {
  name: string
  description: string
  targetUrl: string
  testType: 'split_url' | 'visual' | 'feature_flag'
  audienceType: 'all' | 'returning' | 'custom'
  trafficAllocation: number
  variants: Array<{
    name: string
    description: string
    url: string
    isControl: boolean
  }>
  conversionType: 'page_view' | 'click' | 'form_submit' | 'custom'
  conversionUrl: string
  conversionSelector: string
  conversionEvent: string
  primaryGoal: string
  goalType: 'page_view' | 'click' | 'form_submit' | 'custom'
  goalValue: string
  conversionValue: number
  duration: number
  minSampleSize: number
  algorithm: 'uniform' | 'thompson_sampling' | 'ucb1'
}

const INITIAL_FORM_DATA: ExperimentFormData = {
  name: '',
  description: '',
  targetUrl: '',
  testType: 'split_url',
  audienceType: 'all',
  trafficAllocation: 100,
  variants: [
    { name: 'Versão Original', description: 'Versão atual da sua página', url: '', isControl: true },
    { name: 'Variação A', description: 'Nova versão para testar', url: '', isControl: false }
  ],
  conversionType: 'page_view',
  conversionUrl: '',
  conversionSelector: '',
  conversionEvent: '',
  primaryGoal: '',
  goalType: 'page_view',
  goalValue: '',
  conversionValue: 0,
  duration: 14,
  minSampleSize: 1000,
  algorithm: 'thompson_sampling'
}

export function ModernExperimentModal({ isOpen, onClose, onSave, saving = false }: ModernExperimentModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<ExperimentFormData>(INITIAL_FORM_DATA)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setFormData(INITIAL_FORM_DATA)
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
    { number: 1, title: 'Básico', icon: Target, desc: 'Nome e descrição' },
    { number: 2, title: 'Página', icon: Globe, desc: 'URL de destino' },
    { number: 3, title: 'Variações', icon: Shuffle, desc: 'Versões do teste' },
    { number: 4, title: 'Meta', icon: TrendingUp, desc: 'Objetivo principal' },
    { number: 5, title: 'Finalizar', icon: Zap, desc: 'Revisão final' }
  ]

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        if (!formData.name.trim()) {
          toast.error('Nome do experimento é obrigatório')
          return false
        }
        return true
      case 2:
        if (!formData.targetUrl.trim()) {
          toast.error('URL da página é obrigatória')
          return false
        }
        try {
          new URL(formData.targetUrl)
        } catch {
          toast.error('URL deve ser válida (ex: https://seusite.com)')
          return false
        }
        return true
      case 3:
        if (formData.variants.length < 2) {
          toast.error('É necessário pelo menos 2 variações')
          return false
        }
        const hasControl = formData.variants.some(v => v.isControl)
        if (!hasControl) {
          toast.error('É necessário definir uma versão original')
          return false
        }
        for (const variant of formData.variants) {
          if (!variant.name.trim()) {
            toast.error('Todas as variações devem ter nome')
            return false
          }
          if (formData.testType === 'split_url' && !variant.url?.trim() && !variant.isControl) {
            toast.error('Variações de Divisão de URL devem ter URL específica')
            return false
          }
        }
        return true
      case 4:
        if (!formData.primaryGoal.trim()) {
          toast.error('Objetivo principal é obrigatório')
          return false
        }
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(step) && step < 5) {
      setStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }

  const handleStepClick = (stepNumber: number) => {
    if (stepNumber <= step || (stepNumber === step + 1 && validateStep(step))) {
      setStep(stepNumber)
    }
  }

  const handleSave = async () => {
    if (!validateStep(step)) return

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving experiment:', error)
    }
  }

  const translateTestType = (type: string) => {
    const translations: Record<string, string> = {
      'split_url': 'Divisão de URL',
      'visual': 'Visual',
      'feature_flag': 'Funcionalidade'
    }
    return translations[type] || type
  }

  const translateConversionType = (type: string) => {
    const translations: Record<string, string> = {
      'page_view': 'Visualização de Página',
      'click': 'Clique',
      'form_submit': 'Envio de Formulário',
      'custom': 'Personalizado'
    }
    return translations[type] || type
  }

  const updateFormData = (updates: Partial<ExperimentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const addVariant = () => {
    if (formData.variants.length >= 5) {
      toast.error('Máximo de 5 variações permitidas')
      return
    }

    const letter = String.fromCharCode(65 + formData.variants.length - 1)
    const newVariant = {
      name: `Variação ${letter}`,
      description: '',
      url: formData.testType === 'split_url' ? '' : formData.targetUrl,
      isControl: false
    }

    updateFormData({
      variants: [...formData.variants, newVariant]
    })
  }

  const removeVariant = (index: number) => {
    if (formData.variants.length <= 2) {
      toast.error('É necessário pelo menos 2 variações')
      return
    }

    if (formData.variants[index]?.isControl) {
      toast.error('Não é possível remover a versão original')
      return
    }

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

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-200">
                <Target className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Informações Básicas
              </h3>
              <p className="text-slate-600 text-lg">
                Vamos começar definindo o seu experimento
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Nome do Experimento *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="Ex: Teste CTA Principal - Botão vs Link"
                  className="h-14 text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl"
                />
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Use um nome descritivo que identifique claramente o teste
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Descrição
                  <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">(Opcional)</span>
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Descreva sua hipótese e o que espera descobrir com este teste..."
                  className="min-h-[120px] text-base border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl"
                  rows={5}
                />
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Documente sua hipótese para acompanhar os resultados
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Dicas para um bom experimento
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>Teste <strong>uma mudança</strong> por vez para resultados claros</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>Defina uma <strong>hipótese clara</strong> antes de começar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>Escolha um elemento com <strong>impacto nas conversões</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-200">
                <Globe className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Configurar Página
              </h3>
              <p className="text-slate-600 text-lg">
                Defina onde o teste será executado
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  URL da Página *
                </label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={formData.targetUrl}
                    onChange={(e) => updateFormData({ targetUrl: e.target.value })}
                    placeholder="https://seusite.com/pagina-de-teste"
                    className="h-14 pl-12 text-base border-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 rounded-2xl"
                  />
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Esta é a página onde o experimento será executado
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Tipo de Teste
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'split_url', title: 'Divisão de URL', desc: 'Direciona usuários para URLs diferentes', icon: Link2 },
                    { value: 'visual', title: 'Visual', desc: 'Muda elementos visuais na página', icon: Eye },
                    { value: 'feature_flag', title: 'Funcionalidade', desc: 'Liga/desliga recursos específicos', icon: Settings }
                  ].map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateFormData({ testType: type.value as any })}
                        className={cn(
                          'p-4 rounded-2xl border-2 transition-all text-left hover:scale-105',
                          formData.testType === type.value
                            ? 'border-green-500 bg-green-50 text-green-900'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <Icon className="w-6 h-6 mb-2 text-green-600" />
                        <h4 className="font-semibold mb-1">{type.title}</h4>
                        <p className="text-sm text-slate-600">{type.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    Audiência
                  </label>
                  <Select value={formData.audienceType} onValueChange={(value) => updateFormData({ audienceType: value as any })}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os visitantes</SelectItem>
                      <SelectItem value="returning">Visitantes retornantes</SelectItem>
                      <SelectItem value="custom">Segmento personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    % do Tráfego
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.trafficAllocation}
                      onChange={(e) => updateFormData({ trafficAllocation: parseInt(e.target.value) || 100 })}
                      className="h-12 pr-12 rounded-xl"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-purple-200">
                <Shuffle className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Variações do Teste
              </h3>
              <p className="text-slate-600 text-lg">
                Configure as versões que serão comparadas
              </p>
            </div>

            <div className="space-y-6">
              {formData.variants.map((variant, index) => (
                <div key={index} className={cn(
                  'relative p-6 rounded-2xl border-2 transition-all',
                  variant.isControl
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}>
                  {variant.isControl && (
                    <div className="absolute -top-3 left-6">
                      <div className="bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Controle
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-semibold text-slate-900">
                      Variação {index + 1}
                    </h4>
                    {!variant.isControl && formData.variants.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Nome da Variação *
                        </label>
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value)}
                          placeholder="Ex: Botão Azul"
                          className="h-10 rounded-xl"
                        />
                      </div>

                      {formData.testType === 'split_url' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">
                            URL Específica {!variant.isControl && '*'}
                          </label>
                          <Input
                            value={variant.url}
                            onChange={(e) => updateVariant(index, 'url', e.target.value)}
                            placeholder={variant.isControl ? 'URL original' : 'https://seusite.com/variacao-a'}
                            disabled={variant.isControl}
                            className="h-10 rounded-xl"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Descrição
                      </label>
                      <Textarea
                        value={variant.description}
                        onChange={(e) => updateVariant(index, 'description', e.target.value)}
                        placeholder="Descreva as mudanças desta variação..."
                        className="min-h-[80px] rounded-xl"
                        rows={3}
                      />
                    </div>

                    {!variant.isControl && (
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVariantAsControl(index)}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Definir como Controle
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {formData.variants.length < 5 && (
                <Button
                  type="button"
                  onClick={addVariant}
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-dashed border-2 hover:border-purple-300 hover:bg-purple-50 text-purple-600 hover:text-purple-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Variação
                </Button>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-orange-200">
                <TrendingUp className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Definir Objetivos
              </h3>
              <p className="text-slate-600 text-lg">
                Configure como medir o sucesso do teste
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Objetivo Principal *
                </label>
                <Input
                  value={formData.primaryGoal}
                  onChange={(e) => updateFormData({ primaryGoal: e.target.value })}
                  placeholder="Ex: Aumentar conversões do checkout"
                  className="h-14 text-base border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl"
                />
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Descreva o que você quer melhorar com este teste
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  Tipo de Conversão
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'page_view', title: 'Visualização de Página', desc: 'Quando o usuário acessa uma página específica' },
                    { value: 'click', title: 'Clique em Elemento', desc: 'Quando o usuário clica em um botão ou link' },
                    { value: 'form_submit', title: 'Envio de Formulário', desc: 'Quando o usuário submete um formulário' },
                    { value: 'custom', title: 'Evento Personalizado', desc: 'Evento personalizado definido por você' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => updateFormData({ conversionType: type.value as any })}
                      className={cn(
                        'p-4 rounded-2xl border-2 transition-all text-left hover:scale-105',
                        formData.conversionType === type.value
                          ? 'border-orange-500 bg-orange-50 text-orange-900'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <h4 className="font-semibold mb-1">{type.title}</h4>
                      <p className="text-sm text-slate-600">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {formData.conversionType === 'page_view' && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    URL de Conversão *
                  </label>
                  <Input
                    value={formData.conversionUrl}
                    onChange={(e) => updateFormData({ conversionUrl: e.target.value })}
                    placeholder="https://seusite.com/obrigado"
                    className="h-12 rounded-xl"
                  />
                </div>
              )}

              {(formData.conversionType === 'click' || formData.conversionType === 'form_submit') && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    Seletor CSS *
                  </label>
                  <Input
                    value={formData.conversionSelector}
                    onChange={(e) => updateFormData({ conversionSelector: e.target.value })}
                    placeholder="Ex: #checkout-button, .cta-form"
                    className="h-12 rounded-xl"
                  />
                  <p className="text-sm text-slate-500">
                    Use o seletor CSS do elemento que define a conversão
                  </p>
                </div>
              )}

              {formData.conversionType === 'custom' && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    Nome do Evento *
                  </label>
                  <Input
                    value={formData.conversionEvent}
                    onChange={(e) => updateFormData({ conversionEvent: e.target.value })}
                    placeholder="Ex: compra_finalizada"
                    className="h-12 rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Valor da Conversão (R$)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.conversionValue}
                  onChange={(e) => updateFormData({ conversionValue: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="h-12 rounded-xl"
                />
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor monetário de cada conversão para cálculo de receita
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Duração (dias)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={formData.duration}
                    onChange={(e) => updateFormData({ duration: parseInt(e.target.value) || 14 })}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    <Users className="w-4 h-4 inline mr-2" />
                    Amostra Mínima
                  </label>
                  <Input
                    type="number"
                    min="100"
                    value={formData.minSampleSize}
                    onChange={(e) => updateFormData({ minSampleSize: parseInt(e.target.value) || 1000 })}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-green-200">
                <Zap className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Revisar e Finalizar
              </h3>
              <p className="text-slate-600 text-lg">
                Confira as configurações antes de criar o teste
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Informações Básicas
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nome:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    {formData.description && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Descrição:</span>
                        <span className="font-medium text-right max-w-[200px] truncate">{formData.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-green-600" />
                    Configurações
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">URL:</span>
                      <span className="font-medium text-right max-w-[200px] truncate">{formData.targetUrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tipo:</span>
                      <span className="font-medium">{translateTestType(formData.testType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tráfego:</span>
                      <span className="font-medium">{formData.trafficAllocation}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Shuffle className="w-5 h-5 text-purple-600" />
                    Variações
                  </h4>
                  <div className="space-y-2 text-sm">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-slate-600 flex items-center gap-1">
                          {variant.isControl && <Crown className="w-3 h-3 text-amber-500" />}
                          {variant.name}:
                        </span>
                        <span className="font-medium text-right max-w-[150px] truncate">
                          {variant.url || 'URL original'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    Objetivos
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Meta:</span>
                      <span className="font-medium text-right max-w-[150px] truncate">{formData.primaryGoal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Conversão:</span>
                      <span className="font-medium">{translateConversionType(formData.conversionType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Duração:</span>
                      <span className="font-medium">{formData.duration} dias</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-2xl p-6">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Próximos Passos
                </h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>O experimento será criado com status <strong>rascunho</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>Instale o código JavaScript no seu site</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <span>Ative o experimento quando estiver pronto para começar</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/70 to-purple-900/80 backdrop-blur-xl"
        onClick={() => !saving && onClose()}
      />

      <div ref={modalRef} className="relative w-full max-w-5xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 fade-in-0 duration-300">
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="relative px-8 py-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Criar Experimento A/B
                  </h2>
                  <p className="text-slate-600">Configure seu teste em {5 - step + 1} etapas simples</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => !saving && onClose()}
                className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 text-slate-600 border border-slate-200"
                disabled={saving}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-slate-600 font-medium">Etapa {step} de 5</span>
                <span className="text-blue-600 font-semibold">{Math.round((step / 5) * 100)}% concluído</span>
              </div>
            </div>
          </div>

          {/* Step Navigator */}
          <div className="px-8 py-6 border-b border-slate-200">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4">
                {steps.map((stepItem, index) => {
                  const isActive = stepItem.number === step
                  const isCompleted = stepItem.number < step
                  const canClick = stepItem.number <= step || (stepItem.number === step + 1 && validateStep(step))
                  const Icon = stepItem.icon

                  return (
                    <div key={stepItem.number} className="flex items-center">
                      <div className="flex flex-col items-center gap-2 group">
                        <button
                          type="button"
                          onClick={() => handleStepClick(stepItem.number)}
                          disabled={!canClick}
                          className={cn(
                            'relative w-14 h-14 rounded-2xl flex items-center justify-center font-medium transition-all duration-300',
                            isActive
                              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                              : isCompleted
                              ? 'bg-green-100 text-green-700 border-2 border-green-200 hover:scale-105 hover:shadow-md'
                              : 'bg-slate-100 text-slate-400 border-2 border-slate-200 hover:bg-slate-200',
                            canClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                          )}
                        >
                          {isCompleted ? (
                            <Check className="w-6 h-6" />
                          ) : (
                            <Icon className="w-6 h-6" />
                          )}
                        </button>
                        <div className="text-center">
                          <div className={cn(
                            'text-sm font-semibold',
                            isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-slate-400'
                          )}>
                            {stepItem.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                            {stepItem.desc}
                          </div>
                        </div>
                      </div>
                      {index < 4 && (
                        <div className={cn(
                          'w-12 h-0.5 mx-3 rounded-full transition-all duration-300',
                          isCompleted ? 'bg-gradient-to-r from-green-300 to-green-400' : 'bg-slate-200'
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                {step > 1 && (
                  <Button
                    type="button"
                    onClick={handlePrev}
                    variant="outline"
                    className="h-12 px-6 rounded-xl border-slate-300 hover:bg-slate-100"
                    disabled={saving}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  Etapa {step} de {steps.length}
                </span>

                {step < 5 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    disabled={saving}
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSave}
                    className="h-12 px-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Criar Experimento
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}