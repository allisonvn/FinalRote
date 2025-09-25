'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, Users, Clock, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DataPoint {
  time: string
  visitors: number
  conversions: number
  conversionRate: number
}

interface RealTimeTrendsProps {
  experimentId: string
  refreshInterval?: number // segundos
  maxDataPoints?: number
}

export function RealTimeTrends({ 
  experimentId, 
  refreshInterval = 5,
  maxDataPoints = 30 
}: RealTimeTrendsProps) {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStats, setCurrentStats] = useState({
    visitors: 0,
    conversions: 0,
    conversionRate: 0,
    trend: 'stable' as 'up' | 'down' | 'stable'
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const supabase = createClient()

  const loadRealtimeData = async () => {
    try {
      // Buscar eventos dos últimos 30 minutos
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
      
      const { data: events, error } = await supabase
        .from('events')
        .select('visitor_id, event_type, created_at')
        .eq('experiment_id', experimentId)
        .gte('created_at', thirtyMinutesAgo)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Agrupar por minuto
      const minuteData = new Map<string, { visitors: Set<string>, conversions: number }>()
      
      events?.forEach(event => {
        const minute = new Date(event.created_at).toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
        
        if (!minuteData.has(minute)) {
          minuteData.set(minute, { visitors: new Set(), conversions: 0 })
        }
        
        const data = minuteData.get(minute)!
        data.visitors.add(event.visitor_id)
        
        if (event.event_type === 'conversion') {
          data.conversions++
        }
      })

      // Converter para array de data points
      const newDataPoints: DataPoint[] = Array.from(minuteData.entries())
        .map(([time, data]) => ({
          time,
          visitors: data.visitors.size,
          conversions: data.conversions,
          conversionRate: data.visitors.size > 0 
            ? (data.conversions / data.visitors.size) * 100 
            : 0
        }))
        .slice(-maxDataPoints)

      setData(newDataPoints)

      // Calcular estatísticas atuais
      if (newDataPoints.length > 0) {
        const latest = newDataPoints[newDataPoints.length - 1]
        const previous = newDataPoints[Math.max(0, newDataPoints.length - 6)] // 5 minutos atrás
        
        const trend = latest.conversionRate > previous.conversionRate ? 'up' : 
                     latest.conversionRate < previous.conversionRate ? 'down' : 'stable'
        
        setCurrentStats({
          visitors: latest.visitors,
          conversions: latest.conversions,
          conversionRate: latest.conversionRate,
          trend
        })
      }

      setLoading(false)
    } catch (err) {
      console.error('Erro ao carregar dados em tempo real:', err)
      setLoading(false)
    }
  }

  // Função para desenhar o gráfico
  const drawChart = () => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Configurar canvas
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Limpar canvas
    ctx.clearRect(0, 0, width, height)

    // Calcular escalas
    const maxVisitors = Math.max(...data.map(d => d.visitors), 1)
    const maxRate = Math.max(...data.map(d => d.conversionRate), 10)

    // Desenhar grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])

    // Grid horizontal
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    ctx.setLineDash([])

    // Função para mapear valores para coordenadas
    const getX = (index: number) => padding + (chartWidth / (data.length - 1)) * index
    const getY1 = (visitors: number) => padding + chartHeight - (visitors / maxVisitors) * chartHeight
    const getY2 = (rate: number) => padding + chartHeight - (rate / maxRate) * chartHeight

    // Desenhar linha de visitantes
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((point, index) => {
      const x = getX(index)
      const y = getY1(point.visitors)
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Desenhar área sob a linha de visitantes
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    ctx.beginPath()
    data.forEach((point, index) => {
      const x = getX(index)
      const y = getY1(point.visitors)
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.lineTo(getX(data.length - 1), padding + chartHeight)
    ctx.lineTo(getX(0), padding + chartHeight)
    ctx.closePath()
    ctx.fill()

    // Desenhar linha de taxa de conversão
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((point, index) => {
      const x = getX(index)
      const y = getY2(point.conversionRate)
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Desenhar pontos
    data.forEach((point, index) => {
      const x = getX(index)
      
      // Ponto de visitantes
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(x, getY1(point.visitors), 3, 0, Math.PI * 2)
      ctx.fill()

      // Ponto de taxa de conversão
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(x, getY2(point.conversionRate), 3, 0, Math.PI * 2)
      ctx.fill()
    })

    // Labels dos eixos
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Visitantes', padding, padding - 10)
    ctx.textAlign = 'right'
    ctx.fillText('Taxa de Conversão (%)', width - padding, padding - 10)

    // Labels do eixo X (tempo)
    ctx.textAlign = 'center'
    const step = Math.ceil(data.length / 5)
    data.forEach((point, index) => {
      if (index % step === 0 || index === data.length - 1) {
        const x = getX(index)
        const time = new Date(point.time).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        ctx.fillText(time, x, height - 10)
      }
    })
  }

  // Configurar atualização automática
  useEffect(() => {
    loadRealtimeData()
    
    const interval = setInterval(loadRealtimeData, refreshInterval * 1000)
    
    return () => {
      clearInterval(interval)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [experimentId, refreshInterval])

  // Redesenhar gráfico quando dados mudarem
  useEffect(() => {
    const animate = () => {
      drawChart()
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [data])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Carregando dados em tempo real...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tendências em Tempo Real</CardTitle>
            <CardDescription>Últimos 30 minutos de atividade</CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-muted-foreground">Visitantes</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Estatísticas em tempo real */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Visitantes/min</span>
            </div>
            <div className="text-2xl font-bold">{currentStats.visitors}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-muted-foreground mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Taxa de Conversão</span>
            </div>
            <div className="text-2xl font-bold">
              {currentStats.conversionRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Tendência</span>
            </div>
            <Badge variant={
              currentStats.trend === 'up' ? 'default' : 
              currentStats.trend === 'down' ? 'destructive' : 'secondary'
            }>
              {currentStats.trend === 'up' ? 'Alta' : 
               currentStats.trend === 'down' ? 'Baixa' : 'Estável'}
            </Badge>
          </div>
        </div>

        {/* Gráfico */}
        <div className="relative" style={{ height: '300px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ 
              width: '100%', 
              height: '100%',
              imageRendering: 'crisp-edges'
            }}
          />
          
          {data.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aguardando dados...</p>
              </div>
            </div>
          )}
        </div>

        {/* Indicador de atualização */}
        <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          Atualização a cada {refreshInterval} segundos
        </div>
      </CardContent>
    </Card>
  )
}
