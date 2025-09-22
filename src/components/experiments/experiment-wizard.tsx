'use client'

import { useState, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Settings,
  Target,
  Users,
  BarChart3,
  Code,
  Zap,
  AlertCircle,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ExperimentConfig {
  // Basic info
  name: string
  description: string
  hypothesis: string

  // Targeting
  targetUrl: string
  targeting: {
    countries: string[]
    devices: string[]
    browsers: string[]
    customRules: Array<{
      type: 'url' | 'cookie' | 'localStorage' | 'queryParam'
      operator: 'equals' | 'contains' | 'startsWith' | 'regex'
      value: string
    }>
  }

  // Traffic & timing
  trafficAllocation: number
  duration: number
  startDate?: Date
  endDate?: Date

  // Algorithm & stats
  algorithm: 'thompson_sampling' | 'ucb1' | 'epsilon_greedy' | 'uniform'
  minSampleSize: number
  significanceLevel: number
  minimumDetectableEffect: number

  // Goals
  primaryGoal: {
    type: 'pageview' | 'click' | 'form_submit' | 'custom_event' | 'revenue'
    name: string
    selector?: string
    eventName?: string
    value?: number
  }
  secondaryGoals: Array<{
    type: 'pageview' | 'click' | 'form_submit' | 'custom_event' | 'revenue'
    name: string
    selector?: string
    eventName?: string
  }>

  // Variants
  variants: Array<{
    name: string
    description: string
    weight: number
    isControl: boolean
    changes: Array<{
      type: 'element_text' | 'element_html' | 'element_style' | 'element_attribute' | 'redirect' | 'javascript'
      selector?: string
      value: string
      attribute?: string
    }>
  }>
}

interface ExperimentWizardProps {
  onComplete: (config: ExperimentConfig) => void
  onCancel: () => void
  initialConfig?: Partial<ExperimentConfig>
}

const steps = [
  {
    id: 'basic',
    title: 'Informações Básicas',
    description: 'Nome, descrição e hipótese',
    icon: Settings
  },
  {
    id: 'targeting',
    title: 'Segmentação',
    description: 'Onde e para quem executar',
    icon: Users
  },
  {
    id: 'goals',
    title: 'Objetivos',
    description: 'Métricas a serem medidas',
    icon: Target
  },
  {
    id: 'variants',
    title: 'Variantes',
    description: 'Versões para testar',
    icon: Code
  },
  {
    id: 'settings',
    title: 'Configurações',
    description: 'Algoritmo e estatísticas',
    icon: BarChart3
  }
]

export function ExperimentWizard({ onComplete, onCancel, initialConfig }: ExperimentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [config, setConfig] = useState<ExperimentConfig>({
    name: '',
    description: '',
    hypothesis: '',
    targetUrl: '',
    targeting: {
      countries: [],
      devices: [],
      browsers: [],
      customRules: []
    },
    trafficAllocation: 100,
    duration: 14,
    algorithm: 'thompson_sampling',
    minSampleSize: 1000,
    significanceLevel: 0.05,
    minimumDetectableEffect: 0.1,
    primaryGoal: {
      type: 'pageview',
      name: ''
    },
    secondaryGoals: [],
    variants: [
      {
        name: 'Controle',
        description: 'Versão original',
        weight: 50,
        isControl: true,
        changes: []
      },
      {
        name: 'Variante A',
        description: 'Nova versão',
        weight: 50,
        isControl: false,
        changes: []
      }
    ],
    ...initialConfig
  })

  const updateConfig = useCallback((updates: Partial<ExperimentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic
        return config.name.trim() && config.description.trim() && config.hypothesis.trim()
      case 1: // Targeting
        return config.targetUrl.trim()
      case 2: // Goals
        return config.primaryGoal.name.trim()
      case 3: // Variants
        return config.variants.length >= 2 && config.variants.every(v => v.name.trim())
      case 4: // Settings
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(config)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary text-primary',
                    !isCompleted && !isCurrent && 'border-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-24 h-px ml-4',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold">{steps[currentStep]?.title}</h2>
          <p className="text-muted-foreground">{steps[currentStep]?.description}</p>
        </div>
      </div>

      {/* Step content */}
      <Card className="p-8 mb-8">
        {currentStep === 0 && (
          <BasicInfoStep config={config} updateConfig={updateConfig} />
        )}
        {currentStep === 1 && (
          <TargetingStep config={config} updateConfig={updateConfig} />
        )}
        {currentStep === 2 && (
          <GoalsStep config={config} updateConfig={updateConfig} />
        )}
        {currentStep === 3 && (
          <VariantsStep config={config} updateConfig={updateConfig} />
        )}
        {currentStep === 4 && (
          <SettingsStep config={config} updateConfig={updateConfig} />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : handlePrev}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {currentStep === 0 ? 'Cancelar' : 'Anterior'}
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed()}
        >
          {currentStep === steps.length - 1 ? (
            <>
              <Zap className="h-4 w-4 mr-1" />
              Criar Experimento
            </>
          ) : (
            <>
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function BasicInfoStep({ config, updateConfig }: {
  config: ExperimentConfig
  updateConfig: (updates: Partial<ExperimentConfig>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">Nome do Experimento *</Label>
        <Input
          id="name"
          value={config.name}
          onChange={(e) => updateConfig({ name: e.target.value })}
          placeholder="Ex: Novo botão CTA principal"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          value={config.description}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Descreva o que será testado e o contexto do experimento"
          rows={3}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="hypothesis">Hipótese *</Label>
        <Textarea
          id="hypothesis"
          value={config.hypothesis}
          onChange={(e) => updateConfig({ hypothesis: e.target.value })}
          placeholder="Ex: Mudando a cor do botão para verde, esperamos um aumento de 15% nas conversões porque..."
          rows={3}
          className="mt-1"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Uma boa hipótese inclui: o que será mudado, o resultado esperado e o motivo
        </p>
      </div>
    </div>
  )
}

function TargetingStep({ config, updateConfig }: {
  config: ExperimentConfig
  updateConfig: (updates: Partial<ExperimentConfig>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="targetUrl">URL de Destino *</Label>
        <Input
          id="targetUrl"
          value={config.targetUrl}
          onChange={(e) => updateConfig({ targetUrl: e.target.value })}
          placeholder="https://seusite.com/pagina"
          className="mt-1"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Página onde o experimento será executado
        </p>
      </div>

      <div>
        <Label>Alocação de Tráfego</Label>
        <div className="mt-2">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="100"
              value={config.trafficAllocation}
              onChange={(e) => updateConfig({ trafficAllocation: Number(e.target.value) })}
              className="flex-1"
            />
            <Badge variant="outline">{config.trafficAllocation}%</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Porcentagem de visitantes que participarão do experimento
          </p>
        </div>
      </div>

      <div>
        <Label>Duração Estimada</Label>
        <Select
          value={config.duration.toString()}
          onValueChange={(value) => updateConfig({ duration: Number(value) })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">1 semana</SelectItem>
            <SelectItem value="14">2 semanas</SelectItem>
            <SelectItem value="30">1 mês</SelectItem>
            <SelectItem value="60">2 meses</SelectItem>
            <SelectItem value="90">3 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 bg-info/10 rounded-lg border border-info/20">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-info mt-0.5" />
          <div>
            <h4 className="font-medium text-info-foreground">Segmentação Avançada</h4>
            <p className="text-sm text-info-foreground/80 mt-1">
              Configurações de dispositivo, localização e regras customizadas estarão disponíveis após a criação.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function GoalsStep({ config, updateConfig }: {
  config: ExperimentConfig
  updateConfig: (updates: Partial<ExperimentConfig>) => void
}) {
  const handlePrimaryGoalUpdate = (updates: Partial<typeof config.primaryGoal>) => {
    updateConfig({
      primaryGoal: { ...config.primaryGoal, ...updates }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Meta Principal</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Tipo de Meta</Label>
            <Select
              value={config.primaryGoal.type}
              onValueChange={(value: any) => handlePrimaryGoalUpdate({ type: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pageview">Visualização de Página</SelectItem>
                <SelectItem value="click">Clique em Elemento</SelectItem>
                <SelectItem value="form_submit">Envio de Formulário</SelectItem>
                <SelectItem value="custom_event">Evento Customizado</SelectItem>
                <SelectItem value="revenue">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nome da Meta *</Label>
            <Input
              value={config.primaryGoal.name}
              onChange={(e) => handlePrimaryGoalUpdate({ name: e.target.value })}
              placeholder="Ex: Clique no botão CTA"
              className="mt-1"
            />
          </div>
        </div>

        {(config.primaryGoal.type === 'click' || config.primaryGoal.type === 'form_submit') && (
          <div>
            <Label>Seletor CSS</Label>
            <Input
              value={config.primaryGoal.selector || ''}
              onChange={(e) => handlePrimaryGoalUpdate({ selector: e.target.value })}
              placeholder="Ex: #cta-button, .signup-form"
              className="mt-1"
            />
          </div>
        )}

        {config.primaryGoal.type === 'custom_event' && (
          <div>
            <Label>Nome do Evento</Label>
            <Input
              value={config.primaryGoal.eventName || ''}
              onChange={(e) => handlePrimaryGoalUpdate({ eventName: e.target.value })}
              placeholder="Ex: purchase_completed"
              className="mt-1"
            />
          </div>
        )}
      </div>

      <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h4 className="font-medium text-warning-foreground">Importante</h4>
            <p className="text-sm text-warning-foreground/80 mt-1">
              A meta principal determina o sucesso do experimento. Certifique-se de que ela está alinhada com seu objetivo de negócio.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function VariantsStep({ config, updateConfig }: {
  config: ExperimentConfig
  updateConfig: (updates: Partial<ExperimentConfig>) => void
}) {
  const addVariant = () => {
    const newVariant = {
      name: `Variante ${String.fromCharCode(65 + config.variants.length - 1)}`,
      description: '',
      weight: 50,
      isControl: false,
      changes: []
    }

    updateConfig({
      variants: [...config.variants, newVariant]
    })
  }

  const updateVariant = (index: number, updates: Partial<typeof config.variants[0]>) => {
    const newVariants = [...config.variants]
    newVariants[index] = { ...newVariants[index], ...updates } as typeof config.variants[0]
    updateConfig({ variants: newVariants })
  }

  const removeVariant = (index: number) => {
    if (config.variants.length > 2) {
      const newVariants = config.variants.filter((_, i) => i !== index)
      updateConfig({ variants: newVariants })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Variantes do Experimento</h3>
        <Button onClick={addVariant} variant="outline" size="sm">
          Adicionar Variante
        </Button>
      </div>

      <div className="space-y-4">
        {config.variants.map((variant, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant={variant.isControl ? 'default' : 'secondary'}>
                  {variant.isControl ? 'Controle' : 'Teste'}
                </Badge>
                {!variant.isControl && config.variants.length > 2 && (
                  <Button
                    onClick={() => removeVariant(index)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={variant.name}
                  onChange={(e) => updateVariant(index, { name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Peso (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={variant.weight}
                  onChange={(e) => updateVariant(index, { weight: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>Descrição</Label>
              <Textarea
                value={variant.description}
                onChange={(e) => updateVariant(index, { description: e.target.value })}
                placeholder="Descreva as mudanças desta variante"
                rows={2}
                className="mt-1"
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="p-4 bg-info/10 rounded-lg border border-info/20">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-info mt-0.5" />
          <div>
            <h4 className="font-medium text-info-foreground">Configuração de Mudanças</h4>
            <p className="text-sm text-info-foreground/80 mt-1">
              As mudanças específicas de cada variante (texto, CSS, JavaScript) poderão ser configuradas após a criação do experimento.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsStep({ config, updateConfig }: {
  config: ExperimentConfig
  updateConfig: (updates: Partial<ExperimentConfig>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Algoritmo de Distribuição</h3>

        <Select
          value={config.algorithm}
          onValueChange={(value: any) => updateConfig({ algorithm: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thompson_sampling">Thompson Sampling (Recomendado)</SelectItem>
            <SelectItem value="ucb1">Upper Confidence Bound (UCB1)</SelectItem>
            <SelectItem value="epsilon_greedy">Epsilon Greedy</SelectItem>
            <SelectItem value="uniform">Distribuição Uniforme</SelectItem>
          </SelectContent>
        </Select>

        <p className="text-sm text-muted-foreground mt-2">
          Thompson Sampling otimiza automaticamente o tráfego para a melhor variante durante o teste.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Amostra Mínima</Label>
          <Input
            type="number"
            min="100"
            value={config.minSampleSize}
            onChange={(e) => updateConfig({ minSampleSize: Number(e.target.value) })}
            className="mt-1"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Visitantes por variante antes de declarar um vencedor
          </p>
        </div>

        <div>
          <Label>Nível de Significância</Label>
          <Select
            value={config.significanceLevel.toString()}
            onValueChange={(value) => updateConfig({ significanceLevel: Number(value) })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.01">99% (α = 0.01)</SelectItem>
              <SelectItem value="0.05">95% (α = 0.05)</SelectItem>
              <SelectItem value="0.1">90% (α = 0.10)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Efeito Mínimo Detectável</Label>
        <Select
          value={config.minimumDetectableEffect.toString()}
          onValueChange={(value) => updateConfig({ minimumDetectableEffect: Number(value) })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.05">5%</SelectItem>
            <SelectItem value="0.1">10%</SelectItem>
            <SelectItem value="0.15">15%</SelectItem>
            <SelectItem value="0.2">20%</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          Menor diferença que você quer detectar entre as variantes
        </p>
      </div>
    </div>
  )
}