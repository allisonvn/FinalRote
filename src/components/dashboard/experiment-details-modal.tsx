"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  X, Target, Users, TrendingUp, BarChart3, Calendar, Globe,
  Crown, Brain, Zap, Play, Pause, StopCircle, Eye, Settings,
  AlertTriangle, CheckCircle2, Clock, Award, Sparkles,
  LineChart, PieChart, Activity, TrendingDown, ArrowUpRight,
  ArrowDownRight, Percent, DollarSign, MousePointer, Share2,
  Download, RefreshCw, Edit3, Copy, ExternalLink, Info,
  Shield, Rocket, Star, Trophy, FlaskConical, Layers, Code
} from 'lucide-react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts'

interface ExperimentDetailsModalProps {
  experiment: any
  isOpen: boolean
  onClose: () => void
}

// Mock data para demonstração
const mockTimeSeriesData = [
  { date: '01/01', conversions: 45, visitors: 1200, conversionRate: 3.75 },
  { date: '02/01', conversions: 52, visitors: 1350, conversionRate: 3.85 },
  { date: '03/01', conversions: 48, visitors: 1180, conversionRate: 4.07 },
  { date: '04/01', conversions: 61, visitors: 1420, conversionRate: 4.30 },
  { date: '05/01', conversions: 58, visitors: 1290, conversionRate: 4.50 },
  { date: '06/01', conversions: 67, visitors: 1480, conversionRate: 4.53 },
  { date: '07/01', conversions: 72, visitors: 1560, conversionRate: 4.62 }
]

const mockVariantData = [
  { name: 'Original', conversions: 156, visitors: 3240, conversionRate: 4.81, confidence: 95, color: '#f59e0b' },
  { name: 'Variante A', conversions: 187, visitors: 3180, conversionRate: 5.88, confidence: 98, color: '#10b981' },
  { name: 'Variante B', conversions: 142, visitors: 3100, conversionRate: 4.58, confidence: 85, color: '#8b5cf6' }
]

const COLORS = ['#f59e0b', '#10b981', '#8b5cf6', '#f97316', '#06b6d4']

export function ExperimentDetailsModal({ experiment, isOpen, onClose }: ExperimentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!isOpen) return null

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'variants', label: 'Variantes', icon: Layers },
    { id: 'timeline', label: 'Timeline', icon: LineChart },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ]

  const statusConfig = {
    draft: { label: 'Rascunho', color: 'bg-slate-500', textColor: 'text-slate-700', bgColor: 'bg-slate-50' },
    running: { label: 'Executando', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    paused: { label: 'Pausado', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    completed: { label: 'Concluído', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' }
  }

  const status = statusConfig[experiment.status as keyof typeof statusConfig]

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Header com ações */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {experiment.name}
          </h2>
          <p className="text-slate-600 mt-2">{experiment.description || 'Experimento A/B para otimização de conversões'}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-2">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <Button variant="outline" className="rounded-xl border-2">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl">
            <Edit3 className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Total de Visitantes</p>
            <p className="text-3xl font-bold text-blue-700">9,520</p>
            <p className="text-sm text-blue-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              +12.5% vs anterior
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-900 mb-1">Conversões</p>
            <p className="text-3xl font-bold text-green-700">485</p>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              +24.8% vs anterior
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Percent className="w-6 h-6 text-white" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-purple-900 mb-1">Taxa de Conversão</p>
            <p className="text-3xl font-bold text-purple-700">5.09%</p>
            <p className="text-sm text-purple-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              +18.2% vs anterior
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900 mb-1">Confiabilidade</p>
            <p className="text-3xl font-bold text-amber-700">98.2%</p>
            <p className="text-sm text-amber-600 flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3 h-3" />
              Estatisticamente significativo
            </p>
          </div>
        </Card>
      </div>

      {/* Gráfico de performance */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Performance ao Longo do Tempo</h3>
            <p className="text-slate-600">Taxa de conversão diária dos últimos 7 dias</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={mockTimeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-lg">
                        <p className="font-semibold text-slate-900">{`Data: ${label}`}</p>
                        <p className="text-blue-600">{`Taxa: ${payload[0].value}%`}</p>
                        <p className="text-slate-600">{`Conversões: ${payload[0].payload.conversions}`}</p>
                        <p className="text-slate-600">{`Visitantes: ${payload[0].payload.visitors}`}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="conversionRate"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Insights e recomendações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-green-900 mb-2">Insight Principal</h4>
              <p className="text-green-800 mb-4">
                A Variante A está performando 24.8% melhor que o controle com alta confiabilidade estatística.
                Recomendamos implementar esta versão em 100% do tráfego.
              </p>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white rounded-lg">
                Implementar Variante
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-blue-900 mb-2">Algoritmo Inteligente</h4>
              <p className="text-blue-800 mb-4">
                Thompson Sampling está otimizando automaticamente o tráfego. 67% dos visitantes
                estão sendo direcionados para a variante com melhor performance.
              </p>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
                <Badge variant="outline" className="border-blue-300 text-blue-700">
                  IA Ativa
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderVariants = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Análise de Variantes</h3>
          <p className="text-slate-600">Performance detalhada de cada versão do teste</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg">
            <PieChart className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
        </div>
      </div>

      {/* Distribuição do tráfego */}
      <Card className="p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-4">Distribuição de Tráfego</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Tooltip />
              <RechartsPieChart>
                {mockVariantData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </RechartsPieChart>
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cards das variantes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {mockVariantData.map((variant, index) => (
          <Card key={variant.name} className={cn(
            "p-6 border-2 hover:shadow-xl transition-all duration-300",
            index === 0 ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50" :
            index === 1 ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50" :
            "border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold",
                  index === 0 ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                  index === 1 ? "bg-gradient-to-br from-green-500 to-emerald-500" :
                  "bg-gradient-to-br from-purple-500 to-pink-500"
                )}>
                  {index === 0 ? <Crown className="w-5 h-5" /> : index + 1}
                </div>
                <h4 className="font-bold text-lg">{variant.name}</h4>
              </div>
              {index === 0 && (
                <Badge className="bg-amber-500 text-white">Original</Badge>
              )}
              {index === 1 && variant.conversionRate > mockVariantData[0].conversionRate && (
                <Badge className="bg-green-500 text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  Vencedora
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">Visitantes</p>
                  <p className="text-2xl font-bold">{variant.visitors.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Conversões</p>
                  <p className="text-2xl font-bold">{variant.conversions}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-slate-600">Taxa de Conversão</p>
                  <p className="text-lg font-bold" style={{ color: variant.color }}>
                    {variant.conversionRate.toFixed(2)}%
                  </p>
                </div>
                <Progress
                  value={variant.conversionRate * 10}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-slate-600">Confiabilidade</p>
                  <p className="text-lg font-bold text-slate-700">{variant.confidence}%</p>
                </div>
                <Progress
                  value={variant.confidence}
                  className="h-2"
                />
              </div>

              {index === 1 && (
                <div className={cn(
                  "p-3 rounded-xl border-2",
                  "border-green-300 bg-green-50"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-bold text-green-900">
                      +{((variant.conversionRate / mockVariantData[0].conversionRate - 1) * 100).toFixed(1)}% vs Original
                    </p>
                  </div>
                  <p className="text-xs text-green-700">
                    Melhoria estatisticamente significativa
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderTimeline = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Timeline do Experimento</h3>
        <p className="text-slate-600">Histórico completo de eventos e alterações</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {[
            {
              date: '2024-01-07 14:30',
              type: 'optimization',
              title: 'Algoritmo otimizou distribuição',
              description: 'Thompson Sampling aumentou tráfego da Variante A para 67%',
              icon: Brain,
              color: 'text-purple-600 bg-purple-100'
            },
            {
              date: '2024-01-06 09:15',
              type: 'milestone',
              title: 'Significância estatística atingida',
              description: 'Experimento atingiu 95% de confiabilidade com 9.520 visitantes',
              icon: Award,
              color: 'text-green-600 bg-green-100'
            },
            {
              date: '2024-01-03 16:45',
              type: 'alert',
              title: 'Variante B pausada automaticamente',
              description: 'Performance inferior detectada pelo algoritmo inteligente',
              icon: AlertTriangle,
              color: 'text-yellow-600 bg-yellow-100'
            },
            {
              date: '2024-01-01 10:00',
              type: 'start',
              title: 'Experimento iniciado',
              description: 'Teste A/B ativado com distribuição uniforme de tráfego',
              icon: Play,
              color: 'text-blue-600 bg-blue-100'
            }
          ].map((event, index) => {
            const Icon = event.icon
            return (
              <div key={index} className="flex gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  event.color
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900">{event.title}</h4>
                    <p className="text-sm text-slate-500">{event.date}</p>
                  </div>
                  <p className="text-slate-600">{event.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Configurações do Experimento</h3>
        <p className="text-slate-600">Parâmetros e configurações técnicas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações Gerais
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-600">URL de Destino:</span>
              <span className="font-medium">https://exemplo.com/produto</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tipo de Teste:</span>
              <span className="font-medium">Divisão de URL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Algoritmo:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">Thompson Sampling</span>
                <Badge className="bg-purple-600 text-white text-xs">Premium</Badge>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tráfego Alocado:</span>
              <span className="font-medium">100%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Objetivos e Metas
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Meta Principal:</span>
              <span className="font-medium">Clique no CTA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Seletor CSS:</span>
              <span className="font-medium font-mono text-sm">#cta-button</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Duração:</span>
              <span className="font-medium">14 dias</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Amostra Mínima:</span>
              <span className="font-medium">1.000 visitantes</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Code className="w-5 h-5" />
          Código de Integração
        </h4>
        <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
          <code className="text-green-400 text-sm font-mono">
            {`<!-- Rota Final - Experimento: ${experiment.name} -->
<script src="https://cdn.rotafinal.com/js/experiment.js"></script>
<script>
  RotaFinal.init({
    experimentId: '${experiment.id}',
    apiKey: 'your-api-key'
  });
</script>`}
          </code>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="rounded-lg">
            <Copy className="w-4 h-4 mr-2" />
            Copiar Código
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg">
            <ExternalLink className="w-4 h-4 mr-2" />
            Documentação
          </Button>
        </div>
      </Card>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/80 to-slate-900/90 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className="relative w-full max-w-7xl max-h-[95vh] bg-white rounded-3xl shadow-2xl border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FlaskConical className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">Detalhes do Experimento</h2>
                  <Badge className={cn("text-white", status.color)}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-slate-600">Análise completa de performance e resultados</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-12 w-12 p-0 rounded-2xl hover:bg-slate-200/50 transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 bg-white rounded-2xl p-2 border-2 border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'variants' && renderVariants()}
          {activeTab === 'timeline' && renderTimeline()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  )
}