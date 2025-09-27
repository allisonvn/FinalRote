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
  Zap, BarChart3, Clock, Users, ChevronRight, Settings
} from 'lucide-react'

interface MobileFirstExperimentModalProps {
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
  duration: 14,
  algorithm: 'thompson_sampling'
}

export function MobileFirstExperimentModal({ isOpen, onClose, onSave, saving = false }: MobileFirstExperimentModalProps) {
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
    { number: 1, title: 'Setup', desc: 'Configuração básica', icon: Settings },
    { number: 2, title: 'Variantes', desc: 'Versões do teste', icon: Shuffle },
    { number: 3, title: 'Meta', desc: 'Objetivo e algoritmo', icon: Target }
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
    if (formData.variants.length >= 4) return

    const letter = String.fromCharCode(65 + formData.variants.length - 1)
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
    { value: 'thompson_sampling', label: 'Thompson Sampling', desc: 'Otimização automática (recomendado)' },
    { value: 'ucb1', label: 'UCB1', desc: 'Upper Confidence Bound' },
    { value: 'epsilon_greedy', label: 'Epsilon Greedy', desc: 'Exploração com ε-greedy' },
    { value: 'uniform', label: 'Uniforme', desc: 'Distribuição igual' }
  ]

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 px-1">
            {/* Header móvel simplificado */}
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Configuração</h3>
              <p className="text-sm text-slate-600">Defina nome e página do teste</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Nome do Experimento *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="Ex: Botão CTA - Verde vs Azul"
                  className={cn(
                    "h-12 text-base",
                    validationErrors.name && "border-red-500"
                  )}
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Descrição (opcional)
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Hipótese e objetivo do teste..."
                  className="min-h-[80px] text-base resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  URL da Página *
                </label>
                <Input
                  value={formData.targetUrl}
                  onChange={(e) => updateFormData({ targetUrl: e.target.value })}
                  placeholder="https://seusite.com/pagina"
                  className={cn(
                    "h-12 text-base",
                    validationErrors.targetUrl && "border-red-500"
                  )}
                />
                {validationErrors.targetUrl && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {validationErrors.targetUrl}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Página onde o teste será executado
                </p>
              </div>

              {/* Tipo de teste - móvel otimizado */}
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Tipo de Teste
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => updateFormData({ testType: 'split_url' })}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-left transition-all',
                      formData.testType === 'split_url'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 active:border-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Link className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Dividir URLs</h4>
                        <p className="text-sm text-slate-600">Páginas diferentes</p>
                      </div>
                      {formData.testType === 'split_url' && (
                        <Check className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateFormData({ testType: 'visual' })}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-left transition-all',
                      formData.testType === 'visual'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 active:border-slate-300'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Shuffle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Visual</h4>
                        <p className="text-sm text-slate-600">Elementos na mesma página</p>
                      </div>
                      {formData.testType === 'visual' && (
                        <Check className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Configurações em grid móvel */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Tráfego %
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.trafficAllocation}
                    onChange={(e) => updateFormData({ trafficAllocation: parseInt(e.target.value) || 100 })}
                    className="h-10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Duração
                  </label>
                  <Select
                    value={formData.duration.toString()}
                    onValueChange={(value) => updateFormData({ duration: parseInt(value) })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="14">14 dias</SelectItem>
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
          <div className="space-y-6 px-1">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shuffle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Variantes</h3>
              <p className="text-sm text-slate-600">Versões para comparar</p>
            </div>

            {validationErrors.variants && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {validationErrors.variants}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {formData.variants.map((variant, index) => (
                <div key={index} className={cn(
                  'relative p-4 rounded-xl border-2 transition-all',
                  variant.isControl
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-slate-200 bg-white'
                )}>
                  {variant.isControl && (
                    <div className="absolute -top-2 left-3">
                      <div className="bg-amber-400 text-amber-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Original
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-slate-900">
                      {variant.isControl ? 'Original' : `Variante ${index}`}
                    </h4>
                    {!variant.isControl && formData.variants.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(index)}
                        className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Input
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        placeholder="Nome da variante"
                        className={cn(
                          "h-10",
                          validationErrors[`variant_${index}_name`] && "border-red-500"
                        )}
                      />
                      {validationErrors[`variant_${index}_name`] && (
                        <p className="text-xs text-red-600 mt-1">{validationErrors[`variant_${index}_name`]}</p>
                      )}
                    </div>

                    {formData.testType === 'split_url' && (
                      <div>
                        <Input
                          value={variant.url}
                          onChange={(e) => updateVariant(index, 'url', e.target.value)}
                          placeholder={
                            variant.isControl
                              ? 'URL original (automática)'
                              : 'URL da variante'
                          }
                          disabled={variant.isControl}
                          className={cn(
                            "h-10",
                            variant.isControl && "bg-slate-50 text-slate-500",
                            validationErrors[`variant_${index}_url`] && "border-red-500"
                          )}
                        />
                        {validationErrors[`variant_${index}_url`] && (
                          <p className="text-xs text-red-600 mt-1">{validationErrors[`variant_${index}_url`]}</p>
                        )}
                      </div>
                    )}

                    <Textarea
                      value={variant.description}
                      onChange={(e) => updateVariant(index, 'description', e.target.value)}
                      placeholder="Descrição das mudanças..."
                      className="min-h-[60px] resize-none"
                      rows={2}
                    />

                    {!variant.isControl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVariantAsControl(index)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 text-xs"
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        Definir como Original
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {formData.variants.length < 4 && (
                <Button
                  type="button"
                  onClick={addVariant}
                  variant="outline"
                  className="w-full h-12 border-dashed border-2 hover:border-purple-300 hover:bg-purple-50 text-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Variante
                </Button>
              )}
            </div>

            {formData.testType === 'split_url' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm">Teste de URL</h4>
                    <p className="text-xs text-blue-800 mt-1">
                      Visitantes serão direcionados para URLs diferentes. A original usa a URL da página principal.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6 px-1">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Objetivo</h3>
              <p className="text-sm text-slate-600">Como medir sucesso</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  O que medir?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'page_view', title: 'Acesso a página', desc: 'Ex: página de obrigado' },
                    { value: 'click', title: 'Clique em elemento', desc: 'Ex: botão, link' },
                    { value: 'form_submit', title: 'Envio de formulário', desc: 'Ex: cadastro, contato' }
                  ].map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => updateFormData({ goalType: goal.value as any })}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all',
                        formData.goalType === goal.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 active:border-slate-300'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{goal.title}</h4>
                          <p className="text-sm text-slate-600">{goal.desc}</p>
                        </div>
                        {formData.goalType === goal.value && (
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  {formData.goalType === 'page_view' && 'URL de sucesso *'}
                  {formData.goalType === 'click' && 'Seletor CSS *'}
                  {formData.goalType === 'form_submit' && 'Seletor do formulário *'}
                </label>
                <Input
                  value={formData.goalValue}
                  onChange={(e) => updateFormData({ goalValue: e.target.value })}
                  placeholder={
                    formData.goalType === 'page_view'
                      ? 'https://seusite.com/obrigado'
                      : formData.goalType === 'click'
                      ? '#botao-cta, .btn-primary'
                      : '#form-contato'
                  }
                  className={cn(
                    "h-12 text-base",
                    validationErrors.goalValue && "border-red-500"
                  )}
                />
                {validationErrors.goalValue && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {validationErrors.goalValue}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  {formData.goalType === 'page_view' && 'URL que indica conversão'}
                  {formData.goalType === 'click' && 'Seletor CSS: #id, .classe'}
                  {formData.goalType === 'form_submit' && 'Seletor do formulário'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  <BarChart3 className="w-4 h-4 inline mr-1" />
                  Algoritmo
                </label>
                <Select
                  value={formData.algorithm}
                  onValueChange={(value: any) => updateFormData({ algorithm: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {algorithmOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="py-1">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-slate-500">{option.desc}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumo compacto para mobile */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h4 className="font-medium text-green-900 mb-2 text-sm">Resumo</h4>
              <div className="text-xs text-green-800 space-y-1">
                <p><strong>Página:</strong> {formData.targetUrl.length > 30 ? formData.targetUrl.substring(0, 30) + '...' : formData.targetUrl}</p>
                <p><strong>Tipo:</strong> {formData.testType === 'split_url' ? 'URLs' : 'Visual'}</p>
                <p><strong>Variantes:</strong> {formData.variants.length}</p>
                <p><strong>Duração:</strong> {formData.duration} dias</p>
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      <div ref={modalRef} className="relative w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-xl border overflow-hidden flex flex-col">
        {/* Header com progresso */}
        <div className="px-4 py-3 border-b bg-slate-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Novo Experimento
              </h2>
              <p className="text-sm text-slate-600">Etapa {step} de 3</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => !saving && onClose()}
              className="h-8 w-8 p-0"
              disabled={saving}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress bar móvel otimizada */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              {steps.map((stepItem, index) => (
                <div key={stepItem.number} className="flex items-center">
                  <span className={cn(
                    'font-medium flex items-center gap-1',
                    stepItem.number === step ? 'text-blue-600' :
                    stepItem.number < step ? 'text-green-600' : 'text-slate-400'
                  )}>
                    <stepItem.icon className="w-3 h-3" />
                    {stepItem.title}
                  </span>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-3 h-3 mx-2 text-slate-300" />
                  )}
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content area com scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-6">
            {renderStepContent()}
          </div>
        </div>

        {/* Footer fixo */}
        <div className="px-4 py-3 border-t bg-slate-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              onClick={step === 1 ? onClose : handlePrev}
              variant="outline"
              disabled={saving}
              className="flex-1 h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Cancelar' : 'Anterior'}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-11 bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Criar
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