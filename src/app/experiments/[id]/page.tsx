'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Play, Pause, BarChart3, Code, Settings, Info, Sparkles, Target, Users, TrendingUp, CheckCircle2, Trophy, Zap, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import CodeGenerator from '@/components/CodeGenerator'
import { createClient } from '@/lib/supabase/client'
import { ExperimentDomainsConfig } from '@/components/experiment-domains-config'
import { cn } from '@/lib/utils'

interface Experiment {
  id: string
  name: string
  description?: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  type: string
  traffic_allocation: number
  created_at: string
  project_id?: string
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
  const [projectApiKey, setProjectApiKey] = useState('')

  useEffect(() => {
    loadExperiment()
  }, [params.id])

  const loadExperiment = async () => {
    try {
      // Verificar se o ID é válido (não é "new" ou string inválida)
      const experimentId = params.id as string
      
      // Se o ID for "new", redirecionar para o dashboard
      if (experimentId === 'new') {
        console.log('Redirecionando para o dashboard para criar novo experimento')
        router.push('/dashboard')
        return
      }
      
      if (!experimentId || !experimentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('ID de experimento inválido:', experimentId)
        setLoading(false)
        return
      }

      const supabase = createClient()
      
      // Buscar experimento com variantes
      const { data, error } = await supabase
        .from('experiments')
        .select(`
          *,
          variants:variants(*)
        `)
        .eq('id', experimentId)
        .maybeSingle()
      
      if (error || !data) {
        if (error) {
          console.error('Erro ao carregar experimento:', error.message || error)
        } else if (!data) {
          console.error('Experimento não encontrado')
        }
        setLoading(false)
        return
      }
      
      setExperiment(data)
      
      // Buscar API Key do projeto
      if (data.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('api_key')
          .eq('id', data.project_id)
          .single()
        
        if (projectData?.api_key) {
          setProjectApiKey(projectData.api_key)
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar experimento:', error instanceof Error ? error.message : String(error))
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
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* HERO SECTION - Gradiente Extraordinário */}
      <div className="relative w-full min-h-[40vh] overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/40 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-cyan-400/20 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 w-full py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={cn(
                    "px-4 py-2 text-sm font-bold shadow-xl",
                    experiment.status === 'running' ? 'bg-emerald-500 text-white border-0' :
                    experiment.status === 'completed' ? 'bg-blue-500 text-white border-0' :
                    experiment.status === 'paused' ? 'bg-amber-500 text-white border-0' :
                    'bg-slate-500 text-white border-0'
                  )}>
                    {experiment.status === 'running' && <Zap className="w-4 h-4 mr-2 animate-pulse" />}
                    {getStatusText(experiment.status)}
                  </Badge>
                  <span className="text-sm text-indigo-200 font-medium backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
                    Criado em {new Date(experiment.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-none tracking-tight mb-3">
                    {experiment.name}
                  </h1>
                  <p className="text-xl text-indigo-100/90 leading-relaxed max-w-3xl">
                    {experiment.description || 'Acompanhe o desempenho do seu experimento em tempo real'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {experiment.status === 'draft' && (
                  <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105">
                    <Play className="w-5 h-5 mr-2" />
                    Iniciar Experimento
                  </Button>
                )}
                {experiment.status === 'running' && (
                  <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/40 backdrop-blur-xl font-bold shadow-xl transition-all hover:scale-105">
                    <Pause className="w-5 h-5 mr-2" />
                    Pausar Experimento
                  </Button>
                )}
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/40 backdrop-blur-xl font-bold shadow-xl transition-all hover:scale-105">
                  <Settings className="w-5 h-5 mr-2" />
                  Configurações
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="w-full bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <Tabs defaultValue="integration" className="w-full space-y-8">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 bg-white/80 backdrop-blur-xl p-2 rounded-3xl shadow-2xl border-0">
              <TabsTrigger
                value="integration"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold rounded-2xl h-14 transition-all"
              >
                <Code className="w-5 h-5 mr-2" />
                Integração
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold rounded-2xl h-14 transition-all"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Resultados
              </TabsTrigger>
              <TabsTrigger
                value="variants"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold rounded-2xl h-14 transition-all"
              >
                <Target className="w-5 h-5 mr-2" />
                Variantes
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg font-bold rounded-2xl h-14 transition-all"
              >
                <Settings className="w-5 h-5 mr-2" />
                Config
              </TabsTrigger>
            </TabsList>

          <TabsContent value="integration" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl overflow-hidden">
              <div className="relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <CardHeader className="relative pb-8 pt-10 px-8">
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 shadow-lg">
                      <Code className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-black text-slate-900 mb-2">Como Integrar Este Experimento</CardTitle>
                      <CardDescription className="text-base text-slate-600">
                        Siga as instruções abaixo para adicionar o teste A/B ao seu site. Todo o código é gerado automaticamente e personalizado para este experimento.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-10 space-y-8">
                  <Alert className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-indigo-500 text-white rounded-full">
                        <Info className="w-5 h-5" />
                      </div>
                      <AlertDescription className="flex-1">
                        <h4 className="font-bold text-indigo-900 mb-2 text-lg">Antes de começar</h4>
                        <p className="text-indigo-700 leading-relaxed">
                          Certifique-se de que você tem acesso ao código HTML do seu site. Você precisará adicionar algumas linhas de código no &lt;head&gt; da página.
                        </p>
                      </AlertDescription>
                    </div>
                  </Alert>

                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-3xl"></div>
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border-2 border-indigo-100">
                      <CodeGenerator
                        experimentName={experiment.name}
                        experimentId={experiment.id}
                        experimentType={(experiment.type || 'redirect') as 'redirect' | 'element' | 'split_url' | 'mab'}
                        variants={experiment.variants || []}
                        apiKey={projectApiKey || ''}
                      />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl overflow-hidden">
              <div className="relative">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <CardHeader className="relative pb-8 pt-10 px-8">
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 shadow-lg">
                      <BarChart3 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-black text-slate-900 mb-2">Resultados do Experimento</CardTitle>
                      <CardDescription className="text-base text-slate-600">
                        Acompanhe o desempenho das variantes em tempo real
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                  {experiment.variants && experiment.variants.length > 0 ? (
                    <div className="space-y-6">
                      {experiment.variants.map((variant, index) => (
                        <Card key={variant.id} className={cn(
                          "relative overflow-hidden border-2 shadow-xl transition-all duration-500 hover:scale-[1.02]",
                          variant.is_control
                            ? "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300"
                            : "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200"
                        )}>
                          {/* Winner Badge */}
                          {!variant.is_control && variant.conversion_rate > 0 && (
                            <div className="absolute top-4 right-4">
                              <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg px-4 py-2">
                                <Trophy className="w-4 h-4 mr-2" />
                                Melhor Desempenho
                              </Badge>
                            </div>
                          )}

                          <CardContent className="p-8">
                            <div className="space-y-6">
                              {/* Header */}
                              <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                                    variant.is_control
                                      ? "bg-gradient-to-br from-slate-500/20 to-slate-600/20"
                                      : "bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
                                  )}>
                                    <span className="text-2xl font-black">{String.fromCharCode(65 + index)}</span>
                                  </div>
                                  <div>
                                    <h4 className="text-2xl font-black text-slate-900">{variant.name}</h4>
                                    {variant.is_control && (
                                      <Badge variant="outline" className="mt-1 font-bold border-slate-400">Controle</Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge className={cn(
                                  "text-base px-5 py-2 font-bold shadow-lg",
                                  variant.is_control
                                    ? "bg-slate-200 text-slate-700 border-slate-300"
                                    : "bg-indigo-500 text-white border-0"
                                )}>
                                  {variant.traffic_percentage}% do tráfego
                                </Badge>
                              </div>

                              {/* Description */}
                              {variant.description && (
                                <p className="text-slate-600 leading-relaxed">{variant.description}</p>
                              )}

                              {/* Metrics Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-sm border-2 border-slate-200 shadow-lg">
                                  <div className="flex items-center gap-3 mb-3">
                                    <Users className="w-6 h-6 text-indigo-600" />
                                    <span className="text-sm font-bold text-slate-600 uppercase">Visitantes</span>
                                  </div>
                                  <div className="text-4xl font-black text-slate-900">{variant.visitors.toLocaleString()}</div>
                                </div>

                                <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-sm border-2 border-slate-200 shadow-lg">
                                  <div className="flex items-center gap-3 mb-3">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                    <span className="text-sm font-bold text-slate-600 uppercase">Conversões</span>
                                  </div>
                                  <div className="text-4xl font-black text-slate-900">{variant.conversions.toLocaleString()}</div>
                                </div>

                                <div className={cn(
                                  "p-6 rounded-3xl border-2 shadow-xl",
                                  variant.conversion_rate > 0
                                    ? "bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300"
                                    : "bg-white/80 backdrop-blur-sm border-slate-200"
                                )}>
                                  <div className="flex items-center gap-3 mb-3">
                                    <TrendingUp className={cn(
                                      "w-6 h-6",
                                      variant.conversion_rate > 0 ? "text-emerald-600" : "text-slate-600"
                                    )} />
                                    <span className="text-sm font-bold text-slate-600 uppercase">Taxa de Conversão</span>
                                  </div>
                                  <div className={cn(
                                    "text-4xl font-black",
                                    variant.conversion_rate > 0 ? "text-emerald-600" : "text-slate-900"
                                  )}>
                                    {variant.conversion_rate.toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 mb-6 shadow-lg">
                        <BarChart3 className="w-16 h-16 text-slate-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">Ainda não há dados para mostrar</h3>
                      <p className="text-lg text-slate-600">
                        Inicie o experimento para começar a coletar dados em tempo real.
                      </p>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="variants" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl overflow-hidden">
              <div className="relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
                <CardHeader className="relative pb-8 pt-10 px-8">
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg">
                      <Target className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-black text-slate-900 mb-2">Variantes do Experimento</CardTitle>
                      <CardDescription className="text-base text-slate-600">
                        Gerencie as diferentes versões do seu teste A/B
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                  {experiment.variants && experiment.variants.length > 0 ? (
                    <div className="grid gap-6">
                      {experiment.variants.map((variant, index) => (
                        <Card key={variant.id} className={cn(
                          "relative overflow-hidden border-2 shadow-xl transition-all duration-300 hover:scale-[1.01]",
                          variant.is_control
                            ? "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300"
                            : "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
                        )}>
                          <CardContent className="p-8">
                            <div className="flex items-center justify-between flex-wrap gap-6">
                              <div className="flex items-center gap-4 flex-1">
                                <div className={cn(
                                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                                  variant.is_control
                                    ? "bg-gradient-to-br from-slate-500/20 to-slate-600/20"
                                    : "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
                                )}>
                                  <span className="text-3xl font-black">{String.fromCharCode(65 + index)}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-2xl font-black text-slate-900">{variant.name}</h4>
                                    {variant.is_control && (
                                      <Badge className="bg-slate-200 text-slate-700 border-slate-300 font-bold">Controle</Badge>
                                    )}
                                  </div>
                                  <p className="text-slate-600 leading-relaxed">
                                    {variant.description || 'Variante do experimento A/B'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-center p-6 rounded-3xl bg-white/80 backdrop-blur-sm shadow-lg border-2 border-slate-200">
                                <div className="text-4xl font-black text-slate-900 mb-1">{variant.traffic_percentage}%</div>
                                <div className="text-sm font-bold text-slate-600 uppercase">do tráfego</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-purple-50 to-pink-100 mb-6 shadow-lg">
                        <Target className="w-16 h-16 text-purple-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">Nenhuma variante configurada</h3>
                      <p className="text-lg text-slate-600 mb-6">
                        Adicione variantes para começar a testar diferentes versões
                      </p>
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all">
                        <Plus className="w-5 h-5 mr-2" />
                        Adicionar Variante
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl overflow-hidden">
              <div className="relative">
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
                <CardHeader className="relative pb-8 pt-10 px-8">
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 shadow-lg">
                      <Settings className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-black text-slate-900 mb-2">Configurações do Experimento</CardTitle>
                      <CardDescription className="text-base text-slate-600">
                        Ajuste as configurações do seu teste A/B
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-10 space-y-6">
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-bold text-slate-700 uppercase mb-3 block">Nome do Experimento</label>
                      <input
                        type="text"
                        value={experiment.name}
                        className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl text-lg font-semibold bg-white shadow-lg focus:border-blue-500 focus:outline-none transition-colors"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 uppercase mb-3 block">Descrição</label>
                      <textarea
                        value={experiment.description || ''}
                        className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl text-base font-medium bg-white shadow-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
                        rows={4}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700 uppercase mb-3 block">Alocação de Tráfego</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={experiment.traffic_allocation}
                          className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl text-lg font-semibold bg-white shadow-lg focus:border-blue-500 focus:outline-none transition-colors"
                          min="1"
                          max="100"
                          readOnly
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-2xl overflow-hidden">
              <div className="relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
                <CardHeader className="relative pb-8 pt-10 px-8">
                  <div className="flex items-start gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shadow-lg">
                      <Sparkles className="w-8 h-8 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-black text-slate-900 mb-2">Domínios Permitidos para Propagação de UTMs</CardTitle>
                      <CardDescription className="text-base text-slate-600">
                        Configure domínios personalizados onde os parâmetros UTM devem ser propagados automaticamente
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border-2 border-cyan-100">
                    <ExperimentDomainsConfig
                      experimentId={experiment.id}
                      projectId={experiment.project_id || ''}
                    />
                  </div>
                </CardContent>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}
