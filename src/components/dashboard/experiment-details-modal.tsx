"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { config } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'
import { useSupabaseExperiments } from '@/hooks/useSupabaseExperiments'
import OptimizedCodeGenerator from '@/components/OptimizedCodeGenerator'
import {
  X, Target, Users, TrendingUp, BarChart3, Calendar, Globe,
  Crown, Brain, Zap, Play, Pause, StopCircle, Eye, Settings,
  AlertTriangle, CheckCircle2, Clock, Award, Sparkles,
  LineChart, PieChart, Activity, TrendingDown, ArrowUpRight,
  ArrowDownRight, Percent, DollarSign, MousePointer, Share2,
  Download, RefreshCw, Edit3, Copy, ExternalLink, Info,
  Shield, Rocket, Star, Trophy, FlaskConical, Layers, Code,
  Check, Plus
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
  const [apiKey, setApiKey] = useState('')
  const { updateVariant, updateVariants } = useSupabaseExperiments()
  const [isEditing, setIsEditing] = useState(false)
  const [editedExperiment, setEditedExperiment] = useState(experiment)
  const [saving, setSaving] = useState(false)

  // Função para calcular confiabilidade estatística real
  const calculateConfidence = (visitors: number, conversions: number) => {
    if (visitors === 0) return 0
    
    // Para experimentos com poucos dados, usar confiabilidade baixa
    if (visitors < 10) return 0
    if (visitors < 30) return 25
    if (visitors < 100) return 50
    if (visitors < 500) return 75
    if (visitors < 1000) return 85
    if (visitors < 2000) return 90
    if (visitors < 5000) return 95
    
    // Para experimentos com muitos dados, calcular baseado na taxa de conversão
    const conversionRate = conversions / visitors
    if (conversionRate > 0.1) return 99 // Taxa alta
    if (conversionRate > 0.05) return 95 // Taxa média-alta
    if (conversionRate > 0.02) return 90 // Taxa média
    if (conversionRate > 0.01) return 85 // Taxa baixa-média
    return 80 // Taxa muito baixa
  }
  const [projectData, setProjectData] = useState<any>(null)
  const [experimentMetrics, setExperimentMetrics] = useState<any>(null)
  const [variantData, setVariantData] = useState<any[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Atualizar experimento editado quando o prop muda
  useEffect(() => {
    setEditedExperiment(experiment)
  }, [experiment])
  const supabase = createClient()

  // Função para buscar métricas do experimento - OTIMIZADA
  const fetchExperimentMetrics = async (experimentId: string) => {
    try {
      console.log('📊 Buscando métricas do experimento:', experimentId)

      // Tentar buscar de variant_stats primeiro (mais rápido)
      const { data: stats, error: statsError } = await supabase
        .from('variant_stats')
        .select('visitors, conversions, revenue')
        .eq('experiment_id', experimentId)

      console.log('📈 Stats encontradas:', stats, 'Erro:', statsError)

      // Se variant_stats tem dados, usar eles
      if (stats && stats.length > 0) {
        const totalVisitors = stats.reduce((sum, s) => sum + (s.visitors || 0), 0)
        const totalConversions = stats.reduce((sum, s) => sum + (s.conversions || 0), 0)
        const totalValue = stats.reduce((sum, s) => sum + (s.revenue || 0), 0)
        const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

        const metrics = {
          visitors: totalVisitors,
          conversions: totalConversions,
          conversionRate,
          totalValue,
          confidence: calculateConfidence(totalVisitors, totalConversions)
        }

        console.log('✅ Métricas de variant_stats:', metrics)
        return metrics
      }

      // Fallback: buscar diretamente das tabelas events e assignments
      console.log('⚠️ variant_stats vazio, usando fallback')

      const [visitorsResult, conversionsResult] = await Promise.all([
        supabase
          .from('assignments')
          .select('visitor_id', { count: 'exact', head: true })
          .eq('experiment_id', experimentId),
        supabase
          .from('events')
          .select('value')
          .eq('experiment_id', experimentId)
          .eq('event_type', 'conversion')
      ])

      const totalVisitors = visitorsResult.count || 0
      const conversions = conversionsResult.data || []
      const totalConversions = conversions.length
      const totalValue = conversions.reduce((sum, conv) => sum + (conv.value || 0), 0)
      const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

      const metrics = {
        visitors: totalVisitors,
        conversions: totalConversions,
        conversionRate,
        totalValue,
        confidence: calculateConfidence(totalVisitors, totalConversions)
      }

      console.log('✅ Métricas de fallback:', metrics)
      return metrics
    } catch (error) {
      console.error('Erro ao buscar métricas:', error)
      return {
        visitors: 0,
        conversions: 0,
        conversionRate: 0,
        totalValue: 0,
        confidence: 0
      }
    }
  }

  // Função para buscar dados das variantes - OTIMIZADA
  const fetchVariantData = async (experimentId: string) => {
    try {
      console.log('🔍 Buscando dados das variantes para experimento:', experimentId)

      // Buscar variantes básicas
      const { data: variants, error: variantsError } = await supabase
        .from('variants')
        .select('*')
        .eq('experiment_id', experimentId)
        .order('is_control', { ascending: false })

      if (variantsError) {
        console.error('Erro ao buscar variantes:', variantsError)
        return []
      }

      console.log('📊 Variantes encontradas:', variants)

      // Buscar stats para todas as variantes
      const variantMetrics = await Promise.all(
        (variants || []).map(async (variant) => {
          // Tentar buscar de variant_stats primeiro
          const { data: stats } = await supabase
            .from('variant_stats')
            .select('visitors, conversions, revenue')
            .eq('variant_id', variant.id)
            .eq('experiment_id', experimentId)
            .maybeSingle()

          let visitorCount = 0
          let conversionCount = 0
          let totalValue = 0

          if (stats) {
            // Usar dados de variant_stats se disponível
            visitorCount = stats.visitors || 0
            conversionCount = stats.conversions || 0
            totalValue = stats.revenue || 0
            console.log(`✅ Stats de variant_stats para ${variant.name}:`, stats)
          } else {
            // Fallback: buscar diretamente
            console.log(`⚠️ Usando fallback para ${variant.name}`)

            const [visitorsResult, conversionsResult] = await Promise.all([
              supabase
                .from('assignments')
                .select('visitor_id', { count: 'exact', head: true })
                .eq('experiment_id', experimentId)
                .eq('variant_id', variant.id),
              supabase
                .from('events')
                .select('value')
                .eq('experiment_id', experimentId)
                .eq('variant_id', variant.id)
                .eq('event_type', 'conversion')
            ])

            visitorCount = visitorsResult.count || 0
            const conversions = conversionsResult.data || []
            conversionCount = conversions.length
            totalValue = conversions.reduce((sum, conv) => sum + (conv.value || 0), 0)

            console.log(`✅ Stats de fallback para ${variant.name}:`, {
              visitors: visitorCount,
              conversions: conversionCount,
              revenue: totalValue
            })
          }

          const variantConversionRate = visitorCount > 0 ? (conversionCount / visitorCount) * 100 : 0

          const variantData = {
            id: variant.id,
            name: variant.name,
            is_control: variant.is_control,
            redirect_url: variant.redirect_url,
            traffic_percentage: variant.traffic_percentage,
            css_changes: variant.css_changes,
            js_changes: variant.js_changes,
            changes: variant.changes,
            visitors: visitorCount,
            conversions: conversionCount,
            conversionRate: variantConversionRate,
            totalValue,
            confidence: calculateConfidence(visitorCount, conversionCount),
            color: variant.is_control ? '#f59e0b' : '#10b981'
          }

          console.log(`📋 Variante ${variant.name} processada:`, variantData)
          return variantData
        })
      )

      console.log('✅ Dados das variantes processados:', variantMetrics)
      return variantMetrics
    } catch (error) {
      console.error('Erro ao buscar dados das variantes:', error)
      return []
    }
  }

  // Função para buscar dados da timeline
  const fetchTimeSeriesData = async (experimentId: string) => {
    try {
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('experiment_id', experimentId)
        .order('created_at', { ascending: true })

      // Agrupar por data
      const dailyData: { [key: string]: any } = {}
      
      events?.forEach(event => {
        const date = new Date(event.created_at).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        })
        
        if (!dailyData[date]) {
          dailyData[date] = {
            date,
            conversions: 0,
            visitors: 0,
            conversionRate: 0
          }
        }

        if (event.event_type === 'conversion') {
          dailyData[date].conversions++
        }
      })

      // Calcular visitantes únicos por dia
      const { data: assignments } = await supabase
        .from('assignments')
        .select('visitor_id, assigned_at')
        .eq('experiment_id', experimentId)
        .order('assigned_at', { ascending: true })

      assignments?.forEach(assignment => {
        const date = new Date(assignment.assigned_at).toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        })
        
        if (dailyData[date]) {
          dailyData[date].visitors++
        }
      })

      // Calcular taxa de conversão
      Object.values(dailyData).forEach((day: any) => {
        day.conversionRate = day.visitors > 0 ? (day.conversions / day.visitors) * 100 : 0
      })

      return Object.values(dailyData).slice(-7) // Últimos 7 dias
          } catch (error) {
      console.error('Erro ao buscar dados da timeline:', error)
      return []
    }
  }

  // Função para recarregar todos os dados
  const refreshData = async () => {
    if (!experiment?.project_id) return

    try {
      setLoading(true)
      console.log('🔄 Atualizando dados do experimento:', experiment.id)

      // Buscar métricas do experimento
      const metrics = await fetchExperimentMetrics(experiment.id)
      setExperimentMetrics(metrics)

      // Buscar dados das variantes
      const variants = await fetchVariantData(experiment.id)
      setVariantData(variants)

      // Buscar dados da timeline
      const timeline = await fetchTimeSeriesData(experiment.id)
      setTimeSeriesData(timeline)

      console.log('✅ Dados atualizados com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Buscar dados do projeto e API key
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!experiment?.project_id) {
        console.log('⚠️ Experimento sem project_id, pulando busca de dados do projeto')
        return
      }

      try {
        setLoading(true)
        console.log('🔍 Buscando dados do projeto para experimento:', experiment.id, 'project_id:', experiment.project_id)

        const { data: project } = await supabase
          .from('projects')
          .select('*')
          .eq('id', experiment.project_id)
          .single()

        setProjectData(project)
        setApiKey(project?.api_key || '')

        // Buscar métricas do experimento
        const metrics = await fetchExperimentMetrics(experiment.id)
        setExperimentMetrics(metrics)

        // Buscar dados das variantes
        const variants = await fetchVariantData(experiment.id)
        console.log('🔄 Definindo dados das variantes no estado:', variants)
        setVariantData(variants)

        // Buscar dados da timeline
        const timeline = await fetchTimeSeriesData(experiment.id)
        setTimeSeriesData(timeline)

      } catch (error) {
        console.error('Erro ao buscar dados do projeto:', error)
      } finally {
        setLoading(false)
      }
    }

    console.log('🔄 useEffect executado - isOpen:', isOpen, 'experiment:', !!experiment, 'experiment.id:', experiment?.id)

    if (isOpen && experiment) {
      console.log('✅ Condições atendidas, executando fetchProjectData')
      fetchProjectData()
    } else {
      console.log('❌ Condições não atendidas para fetchProjectData')
    }
  }, [isOpen, experiment, supabase])

  // ✅ REMOVIDO: generateIntegrationCode() e copyIntegrationCode()
  // Agora usa OptimizedCodeGenerator diretamente

  // Função para salvar alterações
  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('experiments')
        .update({
          name: editedExperiment.name,
          description: editedExperiment.description,
          status: editedExperiment.status,
          traffic_allocation: editedExperiment.traffic_allocation
        })
        .eq('id', editedExperiment.id)

      if (error) throw error

      // Atualizar o experimento original
      Object.assign(experiment, editedExperiment)
      
      setIsEditing(false)
      alert('Experimento atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar alterações. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // Função para cancelar edição
  const handleCancel = () => {
    setEditedExperiment(experiment)
    setIsEditing(false)
  }

  // Função para salvar alterações das variantes
  const handleSaveVariants = async () => {
    setSaving(true)
    try {
      // Usar a nova função do hook para atualizar múltiplas variantes
      await updateVariants(experiment.id, variantData)
      
      // Atualizar o estado local
      setEditedExperiment(prev => ({
        ...prev,
        variants: variantData
      }))
      
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao salvar variantes:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'variants', label: 'Variantes', icon: Layers },
    { id: 'urls', label: 'URLs & Config', icon: Globe },
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
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Experimento</label>
                <input
                  type="text"
                  value={editedExperiment.name}
                  onChange={(e) => setEditedExperiment({...editedExperiment, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome do experimento"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                <textarea
                  value={editedExperiment.description || ''}
                  onChange={(e) => setEditedExperiment({...editedExperiment, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Descreva o objetivo do experimento"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                {experiment.name}
              </h2>
              <p className="text-slate-600 mt-2">{experiment.description || 'Experimento A/B para otimização de conversões'}</p>
            </>
          )}
        </div>

        <div className="flex gap-3">
          {!isEditing ? (
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar
            </Button>
          ) : (
            <>
              <Button 
                variant="outline"
                className="rounded-xl border-2"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
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
            <p className="text-3xl font-bold text-blue-700">
              {loading ? '...' : (experimentMetrics?.visitors || 0).toLocaleString()}
            </p>
            <p className="text-sm text-blue-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              {experimentMetrics?.visitors > 0 ? 'Dados em tempo real' : 'Aguardando visitantes'}
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
            <p className="text-3xl font-bold text-green-700">
              {loading ? '...' : (experimentMetrics?.conversions || 0).toLocaleString()}
            </p>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              {experimentMetrics?.totalValue > 0 ? `R$ ${experimentMetrics.totalValue.toFixed(2)}` : 'Sem valor registrado'}
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
            <p className="text-3xl font-bold text-purple-700">
              {loading ? '...' : (experimentMetrics?.conversionRate || 0).toFixed(2)}%
            </p>
            <p className="text-sm text-purple-600 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" />
              {experimentMetrics?.conversionRate > 0 ? 'Performance ativa' : 'Aguardando conversões'}
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
            <p className="text-3xl font-bold text-amber-700">
              {loading ? '...' : (experimentMetrics?.confidence || 0)}%
            </p>
            <p className="text-sm text-amber-600 flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3 h-3" />
              {experimentMetrics?.confidence >= 95 ? 'Estatisticamente significativo' : 
               experimentMetrics?.confidence >= 85 ? 'Confiabilidade moderada' : 'Dados insuficientes'}
            </p>
          </div>
        </Card>
      </div>

      {/* Detalhes de Conversões */}
      {experimentMetrics?.conversions > 0 && (
        <Card className="p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xl font-bold text-green-900">📊 Conversões Registradas</h4>
                <Badge className="bg-green-600 text-white px-3 py-1 text-sm">
                  {experimentMetrics.conversions} conversões
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Valor Total</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {(experimentMetrics.totalValue || 0).toFixed(2)}
                  </p>
                </div>
                
                <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Taxa de Conversão</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {experimentMetrics.conversionRate.toFixed(2)}%
                  </p>
                </div>
                
                <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-green-900">Ticket Médio</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {experimentMetrics.conversions > 0 
                      ? (experimentMetrics.totalValue / experimentMetrics.conversions).toFixed(2) 
                      : '0.00'}
                  </p>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-semibold text-green-900">Página de Sucesso</p>
                </div>
                {experiment.conversion_url ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded flex-1 break-all">
                      {experiment.conversion_url}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(experiment.conversion_url, '_blank')}
                      className="p-1 h-6 w-6 flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Nenhuma página de sucesso configurada</p>
                )}
              </div>

              <div className="bg-white/70 backdrop-blur rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-semibold text-green-900">Como funciona o rastreamento</p>
                </div>
                <p className="text-sm text-green-800 leading-relaxed">
                  As conversões são registradas automaticamente quando os visitantes acessam a página de sucesso configurada. 
                  O sistema identifica qual variante o visitante estava vendo e registra a conversão com o valor de <strong>R$ {experiment.conversion_value || 0}</strong> por conversão.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Gráfico de performance */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Performance ao Longo do Tempo</h3>
            <p className="text-slate-600">Taxa de conversão diária dos últimos 7 dias</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        <div className="h-80">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-500">Carregando dados...</div>
            </div>
          ) : timeSeriesData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={timeSeriesData}>
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
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum dado disponível</p>
                <p className="text-sm text-slate-400">Os dados aparecerão conforme o experimento receber tráfego</p>
              </div>
            </div>
          )}
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
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-lg"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar Variantes
            </Button>
          )}
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
                {variantData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </RechartsPieChart>
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Cards das variantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-slate-500">Carregando variantes...</div>
          </div>
        ) : variantData.length > 0 ? (
          variantData.map((variant, index) => {
            const controlVariant = variantData.find(v => v.is_control)
            const isWinner = !variant.is_control && controlVariant && variant.conversionRate > controlVariant.conversionRate
            
            return (
              <Card key={variant.id} className={cn(
            "p-6 border-2 hover:shadow-xl transition-all duration-300",
                variant.is_control ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50" :
                isWinner ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50" :
            "border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold",
                      variant.is_control ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                      isWinner ? "bg-gradient-to-br from-green-500 to-emerald-500" :
                  "bg-gradient-to-br from-purple-500 to-pink-500"
                )}>
                      {variant.is_control ? <Crown className="w-5 h-5" /> : index + 1}
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => {
                        const updatedVariants = variantData.map(v => 
                          v.id === variant.id ? {...v, name: e.target.value} : v
                        )
                        setVariantData(updatedVariants)
                      }}
                      className="w-full px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-lg"
                    />
                  ) : (
                    <h4 className="font-bold text-lg">{variant.name}</h4>
                  )}
                </div>
              </div>
                  {variant.is_control && (
                <Badge className="bg-amber-500 text-white">Original</Badge>
              )}
                  {isWinner && (
                <Badge className="bg-green-500 text-white">
                  <Trophy className="w-3 h-3 mr-1" />
                  Vencedora
                </Badge>
              )}
            </div>

            {/* URLs e Configurações */}
            <div className="space-y-3 mb-4">
              {/* URL de Redirecionamento - sempre mostrar */}
              <div className="p-3 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-700">URL de Redirecionamento</span>
                </div>
                {isEditing ? (
                  <input
                    type="url"
                    value={variant.redirect_url || ''}
                    onChange={(e) => {
                      const updatedVariants = variantData.map(v => 
                        v.id === variant.id ? {...v, redirect_url: e.target.value} : v
                      )
                      setVariantData(updatedVariants)
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="https://exemplo.com"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    {variant.redirect_url ? (
                      <>
                        <a 
                          href={variant.redirect_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm truncate flex-1"
                        >
                          {variant.redirect_url}
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(variant.redirect_url, '_blank')}
                          className="p-1 h-6 w-6"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-slate-500 text-sm italic">Nenhuma URL configurada</span>
                    )}
                  </div>
                )}
              </div>

              {/* Configurações de Conversão - sempre mostrar */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Configuração de Conversão</span>
                </div>
                <div className="space-y-1 text-sm text-green-600">
                  <div><strong>Tipo:</strong> {variant.changes?.conversion?.type || 'page_view'}</div>
                  {variant.changes?.conversion?.url && (
                    <div><strong>URL:</strong> {variant.changes.conversion.url}</div>
                  )}
                  {variant.changes?.conversion?.selector && (
                    <div><strong>Seletor:</strong> {variant.changes.conversion.selector}</div>
                  )}
                  {variant.changes?.conversion?.event && (
                    <div><strong>Evento:</strong> {variant.changes.conversion.event}</div>
                  )}
                  {variant.changes?.target_url && (
                    <div><strong>URL Alvo:</strong> {variant.changes.target_url}</div>
                  )}
                  {!variant.changes?.conversion && !variant.changes?.target_url && (
                    <div className="text-slate-500 italic">Configuração padrão de conversão</div>
                  )}
                </div>
              </div>

              {/* Mudanças CSS */}
              {variant.css_changes && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">CSS Personalizado</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={variant.css_changes}
                      onChange={(e) => {
                        const updatedVariants = variantData.map(v => 
                          v.id === variant.id ? {...v, css_changes: e.target.value} : v
                        )
                        setVariantData(updatedVariants)
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                      rows={3}
                      placeholder="/* CSS personalizado */"
                    />
                  ) : (
                    <pre className="text-xs text-blue-600 bg-blue-100 p-2 rounded overflow-x-auto">
                      {variant.css_changes}
                    </pre>
                  )}
                </div>
              )}

              {/* Mudanças JavaScript */}
              {variant.js_changes && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">JavaScript Personalizado</span>
                  </div>
                  {isEditing ? (
                    <textarea
                      value={variant.js_changes}
                      onChange={(e) => {
                        const updatedVariants = variantData.map(v => 
                          v.id === variant.id ? {...v, js_changes: e.target.value} : v
                        )
                        setVariantData(updatedVariants)
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                      rows={3}
                      placeholder="// JavaScript personalizado"
                    />
                  ) : (
                    <pre className="text-xs text-purple-600 bg-purple-100 p-2 rounded overflow-x-auto">
                      {variant.js_changes}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Controle de Tráfego */}
              <div className="p-3 bg-slate-50 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-slate-600">Distribuição de Tráfego</p>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={variant.traffic_percentage || 0}
                        onChange={(e) => {
                          const updatedVariants = variantData.map(v => 
                            v.id === variant.id ? {...v, traffic_percentage: parseFloat(e.target.value) || 0} : v
                          )
                          setVariantData(updatedVariants)
                        }}
                        className="w-20 px-2 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right text-sm"
                      />
                      <span className="text-sm text-slate-600">%</span>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-slate-700">{variant.traffic_percentage || 0}%</p>
                  )}
                </div>
                <Progress
                  value={variant.traffic_percentage || 0}
                  className="h-2"
                />
              </div>

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
                      value={Math.min(variant.conversionRate * 10, 100)}
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

                  {isWinner && controlVariant && (
                <div className={cn(
                  "p-3 rounded-xl border-2",
                  "border-green-300 bg-green-50"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-bold text-green-900">
                          +{((variant.conversionRate / controlVariant.conversionRate - 1) * 100).toFixed(1)}% vs Original
                    </p>
                  </div>
                  <p className="text-xs text-green-700">
                    Melhoria estatisticamente significativa
                  </p>
                </div>
              )}
            </div>
          </Card>
            )
          })
        ) : (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhuma variante encontrada</p>
              <p className="text-sm text-slate-400">Configure as variantes do experimento</p>
            </div>
          </div>
        )}
      </div>

      {/* Botões de Ação para Edição */}
      {isEditing && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Modo de Edição Ativo</h4>
                <p className="text-sm text-slate-600">Faça suas alterações e salve para aplicar as mudanças</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="rounded-xl border-2"
                onClick={() => {
                  setVariantData(variantData) // Reset para dados originais
                  setIsEditing(false)
                }}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
                onClick={handleSaveVariants}
                disabled={saving}
              >
                {saving ? (
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )

  const renderUrls = () => {
    console.log('🎨 Renderizando URLs com dados:', variantData)
    console.log('🔗 URLs encontradas:', variantData.map(v => ({ name: v.name, url: v.redirect_url })))
    
    return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">URLs e Configurações</h3>
        <p className="text-slate-600">Detalhes das URLs configuradas e configurações de cada variante</p>
      </div>

      {/* Resumo das URLs */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Resumo das URLs
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{variantData.length}</div>
            <div className="text-sm text-slate-600">Total de Variantes</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{variantData.filter(v => v.redirect_url).length}</div>
            <div className="text-sm text-slate-600">Com URLs</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{variantData.filter(v => v.changes?.conversion).length}</div>
            <div className="text-sm text-slate-600">Com Tracking</div>
          </div>
        </div>
      </Card>

      {/* ✅ NOVO: Card de Conversão */}
      {experiment.conversion_url && (
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-green-900 mb-3">🎯 Página de Sucesso (Conversão)</h4>
              <div className="space-y-3">
                <div className="bg-white/70 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">URL de Conversão</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-green-700 bg-green-100 px-3 py-2 rounded flex-1 break-all font-mono">
                      {experiment.conversion_url}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(experiment.conversion_url, '_blank')}
                      className="p-1 h-6 w-6 flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white/70 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">Tipo de Conversão</span>
                  </div>
                  <div className="text-sm text-green-700">
                    {experiment.conversion_type === 'page_view' ? 'Visualização de Página' : 
                     experiment.conversion_type === 'click' ? 'Clique em Elemento' :
                     experiment.conversion_type === 'form_submit' ? 'Envio de Formulário' : 
                     experiment.conversion_type}
                  </div>
                </div>

                {experiment.conversion_value > 0 && (
                  <div className="bg-white/70 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-900">Valor por Conversão</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      R$ {experiment.conversion_value.toFixed(2)}
                    </div>
                  </div>
                )}

                <div className="bg-green-100/50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-800 leading-relaxed">
                    ℹ️ Quando visitantes acessam <strong>{experiment.conversion_url}</strong>, uma conversão será registrada automaticamente. 
                    Cada conversão será associada à variante que o visitante estava vendo e contabilizada no relatório de performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Lista detalhada das variantes */}
      <div className="space-y-4">
        {variantData.map((variant, index) => (
          <Card key={variant.id} className="p-6 border-2 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold",
                  variant.is_control ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                  "bg-gradient-to-br from-purple-500 to-pink-500"
                )}>
                  {variant.is_control ? <Crown className="w-5 h-5" /> : index + 1}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{variant.name}</h4>
                  <p className="text-sm text-slate-600">
                    {variant.is_control ? 'Variante de Controle' : 'Variante de Teste'} • {variant.traffic_percentage || 0}% do tráfego
                  </p>
                </div>
              </div>
              {variant.is_control && (
                <Badge className="bg-amber-500 text-white">Original</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* URLs */}
              <div className="space-y-4">
                <h5 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  URLs Configuradas
                </h5>
                
                {variant.redirect_url ? (
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">URL de Redirecionamento</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href={variant.redirect_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm truncate flex-1"
                      >
                        {variant.redirect_url}
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(variant.redirect_url, '_blank')}
                        className="p-1 h-6 w-6"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-100 rounded-lg border border-dashed">
                    <p className="text-sm text-slate-500 text-center mb-3">Nenhuma URL configurada</p>
                    {isEditing ? (
                      <input
                        type="url"
                        value={variant.redirect_url || ''}
                        onChange={(e) => {
                          const updatedVariants = variantData.map(v => 
                            v.id === variant.id ? {...v, redirect_url: e.target.value} : v
                          )
                          setVariantData(updatedVariants)
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="https://exemplo.com"
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Configurar URL
                      </Button>
                    )}
                  </div>
                )}

                {variant.changes?.conversion?.url && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">URL de Conversão</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href={variant.changes.conversion.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 text-sm truncate flex-1"
                      >
                        {variant.changes.conversion.url}
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(variant.changes.conversion.url, '_blank')}
                        className="p-1 h-6 w-6"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Configurações */}
              <div className="space-y-4">
                <h5 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurações
                </h5>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-700 mb-1">Distribuição de Tráfego</div>
                    <div className="flex items-center gap-2">
                      <Progress value={variant.traffic_percentage || 0} className="flex-1 h-2" />
                      <span className="text-sm font-bold text-slate-700">{variant.traffic_percentage || 0}%</span>
                    </div>
                  </div>

                  {variant.changes?.conversion ? (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-green-700 mb-2">Configuração de Conversão</div>
                      <div className="space-y-1 text-sm text-green-600">
                        <div><strong>Tipo:</strong> {variant.changes.conversion.type || 'page_view'}</div>
                        {variant.changes.conversion.selector && (
                          <div><strong>Seletor:</strong> <code className="bg-green-100 px-1 rounded">{variant.changes.conversion.selector}</code></div>
                        )}
                        {variant.changes.conversion.event && (
                          <div><strong>Evento:</strong> <code className="bg-green-100 px-1 rounded">{variant.changes.conversion.event}</code></div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-100 rounded-lg border border-dashed">
                      <p className="text-sm text-slate-500 text-center mb-3">Configuração padrão de conversão</p>
                      {isEditing ? (
                        <div className="space-y-2">
                          <select
                            value={variant.changes?.conversion?.type || 'page_view'}
                            onChange={(e) => {
                              const updatedVariants = variantData.map(v => 
                                v.id === variant.id ? {
                                  ...v, 
                                  changes: {
                                    ...v.changes,
                                    conversion: {
                                      ...v.changes?.conversion,
                                      type: e.target.value
                                    }
                                  }
                                } : v
                              )
                              setVariantData(updatedVariants)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="page_view">Visualização de Página</option>
                            <option value="click">Clique em Elemento</option>
                            <option value="form_submit">Envio de Formulário</option>
                            <option value="custom">Evento Customizado</option>
                          </select>
                          <input
                            type="text"
                            value={variant.changes?.conversion?.selector || ''}
                            onChange={(e) => {
                              const updatedVariants = variantData.map(v => 
                                v.id === variant.id ? {
                                  ...v, 
                                  changes: {
                                    ...v.changes,
                                    conversion: {
                                      ...v.changes?.conversion,
                                      selector: e.target.value
                                    }
                                  }
                                } : v
                              )
                              setVariantData(updatedVariants)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Seletor CSS (ex: #botao-comprar)"
                          />
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Configurar Conversão
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">{variant.visitors}</div>
                      <div className="text-xs text-blue-600">Visitantes</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">{variant.conversions}</div>
                      <div className="text-xs text-green-600">Conversões</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Código personalizado */}
            {(variant.css_changes || variant.js_changes) ? (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h5 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Código Personalizado
                </h5>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {variant.css_changes && (
                    <div>
                      <div className="text-sm font-medium text-slate-700 mb-2">CSS</div>
                      <pre className="text-xs text-blue-600 bg-blue-50 p-3 rounded border overflow-x-auto">
                        {variant.css_changes}
                      </pre>
                    </div>
                  )}
                  {variant.js_changes && (
                    <div>
                      <div className="text-sm font-medium text-slate-700 mb-2">JavaScript</div>
                      <pre className="text-xs text-purple-600 bg-purple-50 p-3 rounded border overflow-x-auto">
                        {variant.js_changes}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h5 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Código Personalizado
                </h5>
                <div className="p-4 bg-slate-100 rounded-lg border border-dashed">
                  <p className="text-sm text-slate-500 text-center mb-3">Nenhum código personalizado configurado</p>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CSS Personalizado</label>
                        <textarea
                          value={variant.css_changes || ''}
                          onChange={(e) => {
                            const updatedVariants = variantData.map(v => 
                              v.id === variant.id ? {...v, css_changes: e.target.value} : v
                            )
                            setVariantData(updatedVariants)
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                          rows={3}
                          placeholder="/* CSS personalizado */"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">JavaScript Personalizado</label>
                        <textarea
                          value={variant.js_changes || ''}
                          onChange={(e) => {
                            const updatedVariants = variantData.map(v => 
                              v.id === variant.id ? {...v, js_changes: e.target.value} : v
                            )
                            setVariantData(updatedVariants)
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                          rows={3}
                          placeholder="// JavaScript personalizado"
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Código
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
    )
  }

  const renderTimeline = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Timeline do Experimento</h3>
        <p className="text-slate-600">Histórico completo de eventos e alterações</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500">Carregando timeline...</div>
            </div>
          ) : (
            <>
              {/* Evento de criação */}
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
                  <Play className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900">Experimento criado</h4>
                    <p className="text-sm text-slate-500">
                      {new Date(experiment.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <p className="text-slate-600">
                    Experimento "{experiment.name}" foi criado e está {experiment.status === 'running' ? 'ativo' : experiment.status}
                  </p>
                </div>
              </div>

              {/* Eventos de conversão */}
              {experimentMetrics?.conversions > 0 && (
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-green-100 text-green-600">
                    <Target className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900">Primeira conversão registrada</h4>
                      <p className="text-sm text-slate-500">Recentemente</p>
                    </div>
                    <p className="text-slate-600">
                      {experimentMetrics.conversions} conversões registradas com valor total de R$ {experimentMetrics.totalValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Evento de significância estatística */}
              {experimentMetrics?.confidence >= 95 && (
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-green-100 text-green-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900">Significância estatística atingida</h4>
                      <p className="text-sm text-slate-500">Recentemente</p>
                    </div>
                    <p className="text-slate-600">
                      Experimento atingiu {experimentMetrics.confidence}% de confiabilidade com {experimentMetrics.visitors} visitantes
                    </p>
                  </div>
                </div>
              )}

              {/* Variante vencedora */}
              {variantData.length > 0 && (() => {
                const controlVariant = variantData.find(v => v.is_control)
                const winnerVariant = variantData.find(v => !v.is_control && v.conversionRate > (controlVariant?.conversionRate || 0))
                
                if (winnerVariant && controlVariant) {
            return (
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-purple-100 text-purple-600">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-900">Variante vencedora identificada</h4>
                          <p className="text-sm text-slate-500">Recentemente</p>
                        </div>
                        <p className="text-slate-600">
                          {winnerVariant.name} está performando {((winnerVariant.conversionRate / controlVariant.conversionRate - 1) * 100).toFixed(1)}% melhor que o controle
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* Estado atual */}
              <div className="flex gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                  experiment.status === 'running' ? "bg-green-100 text-green-600" :
                  experiment.status === 'paused' ? "bg-yellow-100 text-yellow-600" :
                  experiment.status === 'completed' ? "bg-blue-100 text-blue-600" :
                  "bg-gray-100 text-gray-600"
                )}>
                  {experiment.status === 'running' ? <Play className="w-6 h-6" /> :
                   experiment.status === 'paused' ? <Pause className="w-6 h-6" /> :
                   experiment.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> :
                   <Eye className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900">Status atual</h4>
                    <p className="text-sm text-slate-500">Agora</p>
                  </div>
                  <p className="text-slate-600">
                    Experimento está {experiment.status === 'running' ? 'ativo e coletando dados' :
                    experiment.status === 'paused' ? 'pausado temporariamente' :
                    experiment.status === 'completed' ? 'concluído' : 'em rascunho'}
                    {experimentMetrics?.visitors > 0 && ` com ${experimentMetrics.visitors} visitantes únicos`}
                  </p>
                </div>
              </div>
            </>
          )}
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
              <span className="text-slate-600">Tipo de Experimento:</span>
              <span className="font-medium">
                {experiment.type === 'redirect' ? 'Redirecionamento' :
                 experiment.type === 'element' ? 'Elemento' :
                 experiment.type === 'split_url' ? 'URL Split' :
                 experiment.type === 'mab' ? 'Multi-Armed Bandit' : 'Padrão'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tráfego Alocado:</span>
              <span className="font-medium">100%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Status:</span>
              {isEditing ? (
                <select
                  value={editedExperiment.status}
                  onChange={(e) => setEditedExperiment({...editedExperiment, status: e.target.value})}
                  className="px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Rascunho</option>
                  <option value="running">Ativo</option>
                  <option value="paused">Pausado</option>
                  <option value="completed">Concluído</option>
                </select>
              ) : (
                <Badge className={cn(
                  "text-white",
                  experiment.status === 'running' ? 'bg-green-500' :
                  experiment.status === 'paused' ? 'bg-yellow-500' :
                  experiment.status === 'completed' ? 'bg-blue-500' :
                  'bg-gray-500'
                )}>
                  {experiment.status === 'running' ? 'Ativo' :
                   experiment.status === 'paused' ? 'Pausado' :
                   experiment.status === 'completed' ? 'Concluído' :
                   'Rascunho'}
                </Badge>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Criado em:</span>
                <span className="font-medium">
                {new Date(experiment.created_at).toLocaleDateString('pt-BR')}
                </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Última Atualização:</span>
              <span className="font-medium">
                {new Date(experiment.updated_at || experiment.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Configurações das Variantes
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-600">Total de Variantes:</span>
              <span className="font-medium">{variantData.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Variante de Controle:</span>
              <span className="font-medium">
                {variantData.find(v => v.is_control)?.name || 'Não definida'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Variantes com URLs:</span>
              <span className="font-medium">
                {variantData.filter(v => v.redirect_url).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Variantes com CSS:</span>
              <span className="font-medium">
                {variantData.filter(v => v.css_changes).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Variantes com JS:</span>
              <span className="font-medium">
                {variantData.filter(v => v.js_changes).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Variantes com Tracking:</span>
              <span className="font-medium">
                {variantData.filter(v => v.changes?.conversion).length}
              </span>
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
              <span className="font-medium">Conversão</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Variantes:</span>
              <span className="font-medium">{variantData.length} configuradas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Visitantes Únicos:</span>
              <span className="font-medium">{experimentMetrics?.visitors || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Conversões:</span>
              <span className="font-medium">{experimentMetrics?.conversions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Taxa de Conversão:</span>
              <span className="font-medium">{experimentMetrics?.conversionRate?.toFixed(2) || '0.00'}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Valor Total:</span>
              <span className="font-medium">R$ {experimentMetrics?.totalValue?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Confiabilidade:</span>
              <span className="font-medium">{experimentMetrics?.confidence || 0}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ✅ NOVO: Usando OptimizedCodeGenerator v3.0 */}
      <div className="mt-6">
        <OptimizedCodeGenerator
          experimentName={experiment.name}
          experimentId={experiment.id}
          experimentType={experiment.type || 'redirect'}
          variants={variantData.map(v => ({
            id: v.id,
            name: v.name,
            description: v.description,
            redirect_url: v.redirect_url,
            traffic_percentage: v.traffic_percentage,
            css_changes: v.css_changes,
            js_changes: v.js_changes,
            changes: v.changes,
            is_control: v.is_control
          }))}
          baseUrl={config.baseUrl}
          apiKey={experiment.api_key || projectData?.api_key || ''}
          algorithm={experiment.algorithm || 'thompson_sampling'}
          conversionValue={experiment.conversionValue || 0}
        />
        </div>
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
          {activeTab === 'urls' && renderUrls()}
          {activeTab === 'timeline' && renderTimeline()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  )
}