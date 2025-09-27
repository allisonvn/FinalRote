"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  X, Target, Globe, Shuffle, ArrowLeft, ArrowRight, Check,
  AlertTriangle, Link, Plus, Trash2, Crown, Info
} from 'lucide-react'

interface ImprovedExperimentModalProps {
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
  algorithm: 'uniform' | 'thompson_sampling'
}

const INITIAL_FORM_DATA: ExperimentFormData = {
  name: '',
  description: '',
  targetUrl: '',
  testType: 'split_url',
  trafficAllocation: 100,
  variants: [
    { name: 'Original', description: 'Versão atual da página', url: '', isControl: true },
    { name: 'Variante A', description: 'Nova versão para testar', url: '', isControl: false }
  ],
  goalType: 'page_view',
  goalValue: '',
  duration: 14,
  algorithm: 'thompson_sampling'
}

export function ImprovedExperimentModal({ isOpen, onClose, onSave, saving = false }: ImprovedExperimentModalProps) {
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
    { number: 1, title: 'Configuração', desc: 'Página e tipo de teste' },
    { number: 2, title: 'Variantes', desc: 'Versões para comparar' },
    { number: 3, title: 'Objetivo', desc: 'Como medir sucesso' }
  ]

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          errors.name = 'Nome é obrigatório'
        }
        if (!formData.targetUrl.trim()) {
          errors.targetUrl = 'URL da página é obrigatória'
        } else {
          try {
            new URL(formData.targetUrl)
          } catch {
            errors.targetUrl = 'URL deve ser válida (ex: https://seusite.com)'
          }
        }
        break

      case 2:
        const hasControl = formData.variants.some(v => v.isControl)
        if (!hasControl) {
          errors.variants = 'É necessário definir uma versão original'
        }

        for (let i = 0; i < formData.variants.length; i++) {
          const variant = formData.variants[i]
          if (!variant.name.trim()) {
            errors[`variant_${i}_name`] = 'Nome é obrigatório'
          }
          if (formData.testType === 'split_url' && !variant.isControl && !variant.url?.trim()) {
            errors[`variant_${i}_url`] = 'URL é obrigatória para variantes'
          }
        }
        break

      case 3:
        if (!formData.goalValue.trim()) {
          errors.goalValue = 'Definição do objetivo é obrigatória'
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
      // Set control variant URL to target URL if not set
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

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Configuração do Teste</h3>
              <p className="text-slate-600">Defina o nome e onde o teste será executado</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Nome do Experimento *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  placeholder="Ex: Teste do Botão CTA - Verde vs Azul"
                  className={cn(
                    "h-12 text-base",
                    validationErrors.name && "border-red-500"
                  )}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
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
                  placeholder="Descreva sua hipótese e o que espera descobrir..."
                  className="min-h-[80px] text-base"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  URL da Página onde o Teste Será Executado *
                </label>
                <Input
                  value={formData.targetUrl}
                  onChange={(e) => updateFormData({ targetUrl: e.target.value })}
                  placeholder="https://seusite.com/pagina-de-teste"
                  className={cn(
                    "h-12 text-base",
                    validationErrors.targetUrl && "border-red-500"
                  )}
                />
                {validationErrors.targetUrl && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {validationErrors.targetUrl}
                  </p>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  Esta é a página atual onde os visitantes serão testados
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Tipo de Teste
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateFormData({ testType: 'split_url' })}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      formData.testType === 'split_url'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <Link className="w-5 h-5 text-blue-600 mb-2" />
                    <h4 className="font-medium">Dividir URLs</h4>
                    <p className="text-sm text-slate-600">Direciona para páginas diferentes</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateFormData({ testType: 'visual' })}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      formData.testType === 'visual'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <Shuffle className="w-5 h-5 text-blue-600 mb-2" />
                    <h4 className="font-medium">Visual</h4>
                    <p className="text-sm text-slate-600">Altera elementos na mesma página</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    % do Tráfego
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
                    Duração (dias)
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
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shuffle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Variantes do Teste</h3>
              <p className="text-slate-600">Configure as versões que serão comparadas</p>
            </div>

            {validationErrors.variants && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {validationErrors.variants}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={index} className={cn(
                  'relative p-5 rounded-lg border-2 transition-all',
                  variant.isControl
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-slate-200 bg-white'
                )}>
                  {variant.isControl && (
                    <div className="absolute -top-2 left-4">
                      <div className="bg-amber-400 text-amber-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Original
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-medium text-slate-900">
                      {variant.isControl ? 'Versão Original' : `Variante ${index}`}
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

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nome da Variante *
                      </label>
                      <Input
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        placeholder="Ex: Botão Verde"
                        className={cn(
                          "h-10",
                          validationErrors[`variant_${index}_name`] && "border-red-500"
                        )}
                      />
                      {validationErrors[`variant_${index}_name`] && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors[`variant_${index}_name`]}</p>
                      )}
                    </div>

                    {formData.testType === 'split_url' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {variant.isControl ? 'URL Original' : 'URL da Variante *'}
                        </label>
                        <Input
                          value={variant.url}
                          onChange={(e) => updateVariant(index, 'url', e.target.value)}
                          placeholder={
                            variant.isControl
                              ? 'Será preenchida automaticamente'
                              : 'https://seusite.com/variante-a'
                          }
                          disabled={variant.isControl}
                          className={cn(
                            "h-10",
                            variant.isControl && "bg-slate-50",
                            validationErrors[`variant_${index}_url`] && "border-red-500"
                          )}
                        />
                        {validationErrors[`variant_${index}_url`] && (
                          <p className="text-sm text-red-600 mt-1">{validationErrors[`variant_${index}_url`]}</p>
                        )}
                        {variant.isControl && (
                          <p className="text-sm text-slate-500 mt-1">
                            Usará automaticamente a URL configurada na etapa anterior
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Descrição
                      </label>
                      <Textarea
                        value={variant.description}
                        onChange={(e) => updateVariant(index, 'description', e.target.value)}
                        placeholder="Descreva as mudanças desta variante..."
                        className="min-h-[60px]"
                        rows={2}
                      />
                    </div>

                    {!variant.isControl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVariantAsControl(index)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Crown className="w-4 h-4 mr-2" />
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
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Variante
                </Button>
              )}
            </div>

            {formData.testType === 'split_url' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Como funciona o Teste de URL</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Os visitantes serão automaticamente direcionados para as diferentes URLs que você configurou.
                      A versão original sempre usará a URL da página principal.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Objetivo do Teste</h3>
              <p className="text-slate-600">Defina como medir o sucesso</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  O que você quer medir?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'page_view', title: 'Acesso a uma página', desc: 'Ex: página de obrigado, checkout' },
                    { value: 'click', title: 'Clique em um elemento', desc: 'Ex: botão, link, imagem' },
                    { value: 'form_submit', title: 'Envio de formulário', desc: 'Ex: cadastro, contato, newsletter' }
                  ].map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => updateFormData({ goalType: goal.value as any })}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all',
                        formData.goalType === goal.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <h4 className="font-medium">{goal.title}</h4>
                      <p className="text-sm text-slate-600">{goal.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
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
                    "h-12 text-base",
                    validationErrors.goalValue && "border-red-500"
                  )}
                />
                {validationErrors.goalValue && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {validationErrors.goalValue}
                  </p>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  {formData.goalType === 'page_view' && 'URL que indica uma conversão bem-sucedida'}
                  {formData.goalType === 'click' && 'Use seletores CSS como #id, .classe, ou tag'}
                  {formData.goalType === 'form_submit' && 'Seletor do formulário que será monitorado'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Algoritmo de Otimização
                </label>
                <Select
                  value={formData.algorithm}
                  onValueChange={(value: any) => updateFormData({ algorithm: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thompson_sampling">
                      <div>
                        <div className="font-medium">Thompson Sampling (Recomendado)</div>
                        <div className="text-sm text-slate-500">Otimiza automaticamente para a melhor variante</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="uniform">
                      <div>
                        <div className="font-medium">Distribuição Uniforme</div>
                        <div className="text-sm text-slate-500">Divide o tráfego igualmente entre variantes</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Resumo do Experimento</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p><strong>Página:</strong> {formData.targetUrl || 'Não definida'}</p>
                <p><strong>Tipo:</strong> {formData.testType === 'split_url' ? 'Dividir URLs' : 'Visual'}</p>
                <p><strong>Variantes:</strong> {formData.variants.length}</p>
                <p><strong>Objetivo:</strong> {
                  formData.goalType === 'page_view' ? 'Acesso a página' :
                  formData.goalType === 'click' ? 'Clique em elemento' :
                  'Envio de formulário'
                }</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />

      <div ref={modalRef} className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Criar Experimento A/B
              </h2>
              <p className="text-slate-600 text-sm">Etapa {step} de 3</p>
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

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              {steps.map((stepItem, index) => (
                <div key={stepItem.number} className="flex items-center">
                  <span className={cn(
                    'font-medium',
                    stepItem.number === step ? 'text-blue-600' :
                    stepItem.number < step ? 'text-green-600' : 'text-slate-400'
                  )}>
                    {stepItem.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="w-12 mx-3 h-px bg-slate-200" />
                  )}
                </div>
              ))}
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              onClick={step === 1 ? onClose : handlePrev}
              variant="outline"
              disabled={saving}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Cancelar' : 'Anterior'}
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
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