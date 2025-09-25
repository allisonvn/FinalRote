'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, Pause, BarChart3, Code, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import CodeGenerator from '@/components/CodeGenerator'

interface Experiment {
  id: string
  name: string
  description?: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  type: string
  traffic_allocation: number
  created_at: string
  variants?: Variant[]
}

interface Variant {
  id: string
  name: string
  description?: string
  is_control: boolean
  traffic_percentage: number
  visitors: number
  conversions: number
  conversion_rate: number
}

export default function ExperimentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [experiment, setExperiment] = useState<Experiment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExperiment()
  }, [params.id])

  const loadExperiment = async () => {
    try {
      // Simular carregamento de experimento
      // Em produção, faria a chamada real para a API
      const mockExperiment: Experiment = {
        id: params.id as string,
        name: 'teste correto',
        description: 'Experimento de teste para validar funcionalidades',
        status: 'draft',
        type: 'redirect',
        traffic_allocation: 100,
        created_at: new Date().toISOString(),
        variants: [
          {
            id: '1',
            name: 'control',
            description: 'Versão original',
            is_control: true,
            traffic_percentage: 34,
            visitors: 120,
            conversions: 12,
            conversion_rate: 10.0
          },
          {
            id: '2', 
            name: 'a',
            description: 'Variante A - Verde',
            is_control: false,
            traffic_percentage: 33,
            visitors: 115,
            conversions: 18,
            conversion_rate: 15.7
          },
          {
            id: '3',
            name: 'b',
            description: 'Variante B - Vermelha',
            is_control: false,
            traffic_percentage: 33,
            visitors: 110,
            conversions: 14,
            conversion_rate: 12.7
          }
        ]
      }
      
      setExperiment(mockExperiment)
    } catch (error) {
      console.error('Erro ao carregar experimento:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'completed': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return 'Executando'
      case 'paused': return 'Pausado'
      case 'completed': return 'Concluído'
      default: return 'Rascunho'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Carregando experimento...</p>
        </div>
      </div>
    )
  }

  if (!experiment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Experimento não encontrado</h2>
          <p className="text-gray-600 mb-4">O experimento solicitado não existe ou você não tem permissão para acessá-lo.</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{experiment.name}</h1>
              <p className="text-gray-600 mt-1">{experiment.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <Badge className={`${getStatusColor(experiment.status)} text-white`}>
                  {getStatusText(experiment.status)}
                </Badge>
                <span className="text-sm text-gray-500">
                  Criado em {new Date(experiment.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {experiment.status === 'draft' && (
                <Button>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Experimento
                </Button>
              )}
              {experiment.status === 'running' && (
                <Button variant="outline">
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar Experimento
                </Button>
              )}
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="integration" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="integration">
              <Code className="w-4 h-4 mr-2" />
              Integração
            </TabsTrigger>
            <TabsTrigger value="results">
              <BarChart3 className="w-4 h-4 mr-2" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="variants">Variantes</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="integration" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Como Integrar Este Experimento</CardTitle>
                  <CardDescription>
                    Siga as instruções abaixo para adicionar o teste A/B ao seu site.
                    Todo o código é gerado automaticamente e personalizado para este experimento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 mb-6">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">!</div>
                      <div>
                        <h4 className="font-medium text-blue-900">Antes de começar</h4>
                        <p className="text-sm text-blue-700">
                          Certifique-se de que você tem acesso ao código HTML do seu site.
                          Você precisará adicionar algumas linhas de código.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <CodeGenerator
                    experimentName={experiment.name}
                    experimentId={experiment.id}
                    variants={experiment.variants || []}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Resultados do Experimento</CardTitle>
                  <CardDescription>
                    Acompanhe o desempenho das variantes em tempo real
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {experiment.variants && experiment.variants.length > 0 ? (
                    <div className="space-y-4">
                      {experiment.variants.map((variant) => (
                        <div key={variant.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{variant.name}</h4>
                              {variant.is_control && (
                                <Badge variant="outline">Controle</Badge>
                              )}
                            </div>
                            <Badge variant="secondary">
                              {variant.traffic_percentage}% do tráfego
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{variant.description}</p>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold">{variant.visitors}</div>
                              <div className="text-sm text-gray-500">Visitantes</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold">{variant.conversions}</div>
                              <div className="text-sm text-gray-500">Conversões</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {variant.conversion_rate.toFixed(1)}%
                              </div>
                              <div className="text-sm text-gray-500">Taxa de Conversão</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Ainda não há dados para mostrar.</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Inicie o experimento para começar a coletar dados.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="variants" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>🎯 Variantes do Experimento</CardTitle>
                <CardDescription>
                  Gerencie as diferentes versões do seu teste A/B
                </CardDescription>
              </CardHeader>
              <CardContent>
                {experiment.variants && experiment.variants.length > 0 ? (
                  <div className="space-y-4">
                    {experiment.variants.map((variant) => (
                      <div key={variant.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{variant.name}</h4>
                              {variant.is_control && (
                                <Badge variant="outline">Controle</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{variant.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">{variant.traffic_percentage}%</div>
                            <div className="text-sm text-gray-500">do tráfego</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma variante configurada.</p>
                    <Button className="mt-4">Adicionar Variante</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>⚙️ Configurações do Experimento</CardTitle>
                <CardDescription>
                  Ajuste as configurações do seu teste A/B
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome do Experimento</label>
                    <input 
                      type="text" 
                      value={experiment.name}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <textarea 
                      value={experiment.description || ''}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Alocação de Tráfego</label>
                    <input 
                      type="number" 
                      value={experiment.traffic_allocation}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      max="100"
                      readOnly
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
