"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import OptimizedCodeGenerator from '@/components/OptimizedCodeGenerator'
import { analyzeExperiment } from '@/lib/statistics'
import {
  X, Users, TrendingUp, BarChart3, Code, Settings,
  CheckCircle2, Clock, Activity, RefreshCw, Edit3,
  Play, Pause, StopCircle
} from 'lucide-react'

interface ExperimentDetailsModalProps {
  experiment: any
  isOpen: boolean
  onClose: () => void
}

export function ExperimentDetailsModal({ experiment, isOpen, onClose }: ExperimentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [metrics, setMetrics] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [projectApiKey, setProjectApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(experiment.name)
  const [editedDescription, setEditedDescription] = useState(experiment.description || '')

  const supabase = createClient()

  // Função otimizada para buscar todos os dados necessários
  const loadExperimentData = async () => {
    if (!experiment?.id) {
      console.log('❌ Experiment ID não fornecido')
      return
    }

    console.log('📊 Carregando dados do experimento:', experiment.id)
    console.log('📋 Dados recebidos do experimento:', experiment)

    try {
      setLoading(true)

      // Buscar dados em paralelo para melhor performance
      const [statsData, variantsData, projectData] = await Promise.all([
        // Buscar métricas agregadas
        supabase
          .from('variant_stats')
          .select('visitors, conversions, revenue')
          .eq('experiment_id', experiment.id),

        // Buscar variantes com stats
        supabase
          .from('variants')
          .select(`
            id,
            name,
            is_control,
            redirect_url,
            traffic_percentage,
            is_active
          `)
          .eq('experiment_id', experiment.id)
          .order('is_control', { ascending: false }),

        // Buscar API key do projeto
        experiment.project_id ? supabase
          .from('projects')
          .select('api_key')
          .eq('id', experiment.project_id)
          .single() : null
      ])

      // Processar métricas totais
      let totalMetrics = (statsData.data || []).reduce(
        (acc, curr) => ({
          visitors: acc.visitors + (curr.visitors || 0),
          conversions: acc.conversions + (curr.conversions || 0),
          revenue: acc.revenue + (curr.revenue || 0)
        }),
        { visitors: 0, conversions: 0, revenue: 0 }
      )

      // Se variant_stats não tiver dados, buscar de assignments e conversions
      if (totalMetrics.visitors === 0 && totalMetrics.conversions === 0) {
        const { data: allAssignments } = await supabase
          .from('assignments')
          .select('id, variant_id')
          .eq('experiment_id', experiment.id)

        const { data: allConversions } = await supabase
          .from('events')
          .select('id, value as conversion_value')
          .eq('experiment_id', experiment.id)
          .eq('event_type', 'conversion')

        const totalRevenue = (allConversions || []).reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0)
        
        totalMetrics = {
          visitors: allAssignments?.length || 0,
          conversions: allConversions?.length || 0,
          revenue: totalRevenue === 0 && allConversions && allConversions.length > 0 && experiment.conversion_value
            ? allConversions.length * Number(experiment.conversion_value)
            : totalRevenue
        }
        
        console.log('💰 Receita total calculada:', {
          conversoes: allConversions?.length || 0,
          totalRevenue,
          conversion_value_experimento: experiment.conversion_value,
          receita_final: totalMetrics.revenue
        })
      }

      totalMetrics.conversionRate = totalMetrics.visitors > 0
        ? (totalMetrics.conversions / totalMetrics.visitors) * 100
        : 0

      console.log('📈 Métricas totais:', totalMetrics)
      setMetrics(totalMetrics)

      // Buscar stats individuais para cada variante
      const variantsWithStats = await Promise.all(
        (variantsData.data || []).map(async (variant) => {
          // Tentar buscar de variant_stats primeiro
          const { data: variantStats } = await supabase
            .from('variant_stats')
            .select('visitors, conversions, revenue')
            .eq('variant_id', variant.id)
            .maybeSingle()

          let visitors = variantStats?.visitors || 0
          let conversions = variantStats?.conversions || 0
          let revenue = variantStats?.revenue || 0

          // Se variant_stats não tiver dados, buscar de assignments e conversions
          if (!variantStats) {
            const { data: assignments } = await supabase
              .from('assignments')
              .select('id')
              .eq('variant_id', variant.id)
            
            const { data: conversions_data } = await supabase
              .from('events')
              .select('id, value as conversion_value')
              .eq('variant_id', variant.id)
              .eq('event_type', 'conversion')

            visitors = assignments?.length || 0
            conversions = conversions_data?.length || 0
            
            // Calcular receita das conversões registradas
            revenue = (conversions_data || []).reduce((sum, c) => sum + (Number(c.conversion_value) || 0), 0)
            
            // Se não houver valor nas conversões, usar o valor padrão do experimento
            if (revenue === 0 && conversions > 0 && experiment.conversion_value) {
              revenue = conversions * Number(experiment.conversion_value)
            }
            
            console.log(`💰 Variante ${variant.name}: ${conversions} conversões, receita = R$ ${revenue.toFixed(2)}`)
          }

          return {
            ...variant,
            visitors,
            conversions,
            revenue,
            conversionRate: visitors > 0 ? (conversions / visitors) * 100 : 0
          }
        })
      )

      console.log('🎯 Variantes encontradas:', variantsWithStats.length)
      console.log('📊 Dados das variantes:', variantsWithStats)
      setVariants(variantsWithStats)

      // Setar API key se disponível
      if (projectData?.data?.api_key) {
        setProjectApiKey(projectData.data.api_key)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (isOpen && experiment?.id) {
      loadExperimentData()
    }
  }, [isOpen, experiment?.id])

  // Refresh manual
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadExperimentData()
    setRefreshing(false)
  }

  // Salvar alterações
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('experiments')
        .update({
          name: editedName,
          description: editedDescription
        })
        .eq('id', experiment.id)

      if (error) throw error

      // Atualizar objeto local
      experiment.name = editedName
      experiment.description = editedDescription

      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar alterações')
    }
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'code', label: 'Código', icon: Code },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ]

  const statusConfig: any = {
    draft: { label: 'Rascunho', color: 'bg-gray-500' },
    running: { label: 'Executando', color: 'bg-green-500' },
    paused: { label: 'Pausado', color: 'bg-yellow-500' },
    completed: { label: 'Concluído', color: 'bg-blue-500' }
  }

  const status = statusConfig[experiment.status] || statusConfig.draft

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-4 md:inset-8 lg:inset-16 bg-white rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{experiment.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{experiment.description}</p>
            </div>
            <Badge className={`${status.color} text-white`}>
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Métricas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Visitantes</p>
                      <p className="text-2xl font-bold">
                        {loading ? '...' : (metrics?.visitors || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Conversões</p>
                      <p className="text-2xl font-bold">
                        {loading ? '...' : (metrics?.conversions || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Taxa de Conversão</p>
                      <p className="text-2xl font-bold">
                        {loading ? '...' : `${(metrics?.conversionRate || 0).toFixed(2)}%`}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Receita</p>
                      <p className="text-2xl font-bold">
                        {loading ? '...' : `R$ ${(metrics?.revenue || 0).toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Variantes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Desempenho das Variantes</h3>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">Carregando...</div>
                  ) : variants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma variante configurada
                    </div>
                  ) : (
                    variants.map((variant) => (
                      <Card key={variant.id} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-lg">{variant.name}</h4>
                            {variant.is_control && (
                              <Badge variant="outline">Controle</Badge>
                            )}
                            {!variant.is_active && (
                              <Badge variant="outline" className="bg-gray-100">Inativa</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {variant.conversionRate.toFixed(2)}%
                            </p>
                            <p className="text-xs text-gray-500">Taxa de Conversão</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Visitantes</p>
                            <p className="font-semibold">{variant.visitors.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Conversões</p>
                            <p className="font-semibold">{variant.conversions.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Receita</p>
                            <p className="font-semibold">R$ {variant.revenue.toFixed(2)}</p>
                          </div>
                        </div>

                        {variant.redirect_url && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-gray-500">URL de Redirecionamento:</p>
                            <p className="text-sm font-mono text-blue-600 truncate">
                              {variant.redirect_url}
                            </p>
                          </div>
                        )}

                        <div className="mt-4">
                          <Progress value={variant.traffic_percentage} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {variant.traffic_percentage}% do tráfego
                          </p>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Code Tab */}
          {activeTab === 'code' && (
            <div>
              <OptimizedCodeGenerator
                experimentName={experiment.name}
                experimentId={experiment.id}
                experimentType={experiment.type || 'redirect'}
                variants={variants}
                apiKey={projectApiKey}
                algorithm={experiment.algorithm || 'uniform'}
                conversionValue={experiment.conversion_value || 0}
                conversionConfig={experiment.conversion_config}
                projectId={experiment.project_id} // Passar projectId
              />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Experimento
                    </label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditedName(experiment.name)
                        setEditedDescription(experiment.description || '')
                        setIsEditing(false)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Informações Básicas</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Nome</p>
                        <p className="font-medium">{experiment.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Descrição</p>
                        <p className="text-gray-700">
                          {experiment.description || 'Nenhuma descrição'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tipo</p>
                        <p className="font-medium uppercase">{experiment.type || 'REDIRECT'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Algoritmo</p>
                        <p className="font-medium uppercase">
                          {experiment.algorithm || 'UNIFORM'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Criado em</p>
                        <p className="font-medium">
                          {new Date(experiment.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Configurações de Conversão */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Configurações de Conversão</h3>
                    <div className="space-y-3">
                      {experiment.target_url && (
                        <div>
                          <p className="text-sm text-gray-500">URL Alvo</p>
                          <p className="font-mono text-sm break-all">{experiment.target_url}</p>
                        </div>
                      )}
                      {experiment.conversion_url && (
                        <div>
                          <p className="text-sm text-gray-500">URL de Conversão</p>
                          <p className="font-mono text-sm break-all">{experiment.conversion_url}</p>
                        </div>
                      )}
                      {experiment.conversion_type && (
                        <div>
                          <p className="text-sm text-gray-500">Tipo de Conversão</p>
                          <p className="font-medium uppercase">{experiment.conversion_type}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Valor da Conversão</p>
                        <p className="font-medium">R$ {(experiment.conversion_value || 0).toFixed(2)}</p>
                      </div>
                      {experiment.conversion_selector && (
                        <div>
                          <p className="text-sm text-gray-500">Seletor de Conversão</p>
                          <p className="font-mono text-sm">{experiment.conversion_selector}</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Configurações do Experimento */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Parâmetros do Experimento</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Alocação de Tráfego</p>
                          <p className="font-medium">{((experiment.traffic_allocation || 1) * 100).toFixed(0)}%</p>
                        </div>
                        {experiment.duration_days && (
                          <div>
                            <p className="text-sm text-gray-500">Duração Planejada</p>
                            <p className="font-medium">{experiment.duration_days} dias</p>
                          </div>
                        )}
                        {experiment.confidence_level && (
                          <div>
                            <p className="text-sm text-gray-500">Nível de Confiança</p>
                            <p className="font-medium">{(experiment.confidence_level * 100).toFixed(0)}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Ações</h3>
                    <div className="space-y-2">
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Iniciar Experimento
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pausar Experimento
                      </Button>
                      <Button
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        variant="outline"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        Finalizar Experimento
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
