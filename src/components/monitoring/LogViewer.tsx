'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  AlertCircle, AlertTriangle, Info, Bug, Zap,
  RefreshCw, Download, Filter, Search, Clock,
  ChevronDown, ChevronUp, Copy, ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LogEntry {
  id: string
  level: string
  message: string
  timestamp: string
  user_id?: string
  organization_id?: string
  project_id?: string
  experiment_id?: string
  request_id?: string
  context?: any
  metadata?: any
  error_message?: string
  error_stack?: string
  duration_ms?: number
  tags?: string[]
}

interface LogViewerProps {
  organizationId?: string
  projectId?: string
  experimentId?: string
  maxLogs?: number
}

export function LogViewer({
  organizationId,
  projectId,
  experimentId,
  maxLogs = 100
}: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    level: 'all',
    search: '',
    timeRange: '1h'
  })
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [autoRefresh, setAutoRefresh] = useState(false)
  
  const supabase = createClient()

  const loadLogs = async () => {
    try {
      let query = supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(maxLogs)

      // Aplicar filtros
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }
      if (projectId) {
        query = query.eq('project_id', projectId)
      }
      if (experimentId) {
        query = query.eq('experiment_id', experimentId)
      }

      // Filtro por nível
      if (filter.level !== 'all') {
        query = query.eq('level', filter.level.toUpperCase())
      }

      // Filtro por tempo
      const timeRanges: Record<string, string> = {
        '1h': new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      if (timeRanges[filter.timeRange]) {
        query = query.gte('timestamp', timeRanges[filter.timeRange])
      }

      // Busca por texto
      if (filter.search) {
        query = query.or(`message.ilike.%${filter.search}%,error_message.ilike.%${filter.search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setLogs(data || [])
    } catch (err) {
      console.error('Erro ao carregar logs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Configurar auto-refresh
  useEffect(() => {
    loadLogs()

    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000) // 5 segundos
      return () => clearInterval(interval)
    }
  }, [filter, autoRefresh, organizationId, projectId, experimentId])

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'DEBUG': return <Bug className="w-4 h-4" />
      case 'INFO': return <Info className="w-4 h-4" />
      case 'WARN': return <AlertTriangle className="w-4 h-4" />
      case 'ERROR': return <AlertCircle className="w-4 h-4" />
      case 'FATAL': return <Zap className="w-4 h-4" />
      default: return null
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'DEBUG': return 'text-gray-500 bg-gray-50'
      case 'INFO': return 'text-blue-600 bg-blue-50'
      case 'WARN': return 'text-yellow-600 bg-yellow-50'
      case 'ERROR': return 'text-red-600 bg-red-50'
      case 'FATAL': return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Poderia adicionar um toast aqui
  }

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Level', 'Message', 'Error', 'Duration (ms)', 'Tags'],
      ...logs.map(log => [
        log.timestamp,
        log.level,
        log.message,
        log.error_message || '',
        log.duration_ms || '',
        (log.tags || []).join(', ')
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading && logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Carregando logs...</span>
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
            <CardTitle>Logs do Sistema</CardTitle>
            <CardDescription>
              Visualize e monitore logs em tempo real
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
            <Button size="sm" variant="outline" onClick={loadLogs}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
            <Button size="sm" variant="outline" onClick={exportLogs}>
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select
              value={filter.level}
              onValueChange={level => setFilter({ ...filter, level })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="fatal">Fatal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Select
              value={filter.timeRange}
              onValueChange={timeRange => setFilter({ ...filter, timeRange })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Última hora</SelectItem>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nos logs..."
                value={filter.search}
                onChange={e => setFilter({ ...filter, search: e.target.value })}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {/* Lista de logs */}
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            logs.map(log => {
              const isExpanded = expandedLogs.has(log.id)
              
              return (
                <div
                  key={log.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Badge className={getLevelColor(log.level)} variant="outline">
                        {getLevelIcon(log.level)}
                        <span className="ml-1">{log.level}</span>
                      </Badge>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{log.message}</span>
                          {log.duration_ms && (
                            <Badge variant="outline" className="text-xs">
                              {log.duration_ms}ms
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          {log.request_id && (
                            <span className="font-mono">{log.request_id}</span>
                          )}
                          {log.tags && log.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              {log.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {log.error_message && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
                            {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleLogExpansion(log.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pl-12 space-y-2">
                      {log.error_stack && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Stack Trace</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(log.error_stack!)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                            {log.error_stack}
                          </pre>
                        </div>
                      )}

                      {log.context && Object.keys(log.context).length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Contexto</span>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Metadados</span>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
