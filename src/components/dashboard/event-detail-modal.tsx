'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  X,
  Eye,
  MousePointer,
  Target,
  Activity,
  Calendar,
  Clock,
  User,
  Tag,
  Code,
  Copy,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  MapPin,
  Smartphone,
  Download,
  Sparkles,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface EventProperty {
  key: string
  value: any
  type: string
}

interface Event {
  id: string
  event_type: string
  event_name: string
  visitor_id: string
  experiment_id?: string
  variant_id?: string
  properties: Record<string, any>
  value?: number
  created_at: string
  session_id?: string
  device_type?: string
  browser?: string
  os?: string
  country?: string
  city?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

interface EventDetailModalProps {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetailModal({ event, open, onOpenChange }: EventDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  if (!event) return null

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const exportEventData = () => {
    const dataStr = JSON.stringify(event, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `event-${event.id}-${Date.now()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return <Eye className="h-6 w-6" />
      case 'click':
        return <MousePointer className="h-6 w-6" />
      case 'conversion':
        return <Target className="h-6 w-6" />
      default:
        return <Activity className="h-6 w-6" />
    }
  }

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-200'
      case 'click':
        return 'bg-green-500 text-white border-green-400 shadow-lg shadow-green-200'
      case 'conversion':
        return 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-200'
      case 'custom':
        return 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-200'
      default:
        return 'bg-gray-500 text-white border-gray-400 shadow-lg shadow-gray-200'
    }
  }

  const getEventGradient = (eventType: string) => {
    switch (eventType) {
      case 'page_view':
        return 'from-blue-600 via-blue-700 to-cyan-800'
      case 'click':
        return 'from-green-600 via-green-700 to-emerald-800'
      case 'conversion':
        return 'from-purple-600 via-purple-700 to-pink-800'
      default:
        return 'from-slate-600 via-slate-700 to-slate-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  }

  const formatPropertyValue = (value: any): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const getPropertyType = (value: any): string => {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden border-0 shadow-2xl">
        {/* Header */}
        <div className={cn("relative bg-gradient-to-br p-10 pb-14", getEventGradient(event.event_type))}>
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />

          <DialogHeader className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl" />
                <div className="relative p-5 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                  <div className="text-white">
                    {getEventIcon(event.event_type)}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20 rounded-xl transition-all h-10 w-10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <DialogTitle className="text-4xl font-black text-white mb-3 leading-tight">
              {event.event_name}
            </DialogTitle>

            <DialogDescription className="text-white/80 text-lg font-medium">
              Detalhes completos do evento de tracking
            </DialogDescription>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Badge className={cn(getEventBadgeColor(event.event_type), "font-bold px-4 py-1.5 text-sm")}>
                {event.event_type.toUpperCase()}
              </Badge>
              {event.experiment_id && (
                <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-xl font-semibold px-4 py-1.5 text-sm shadow-lg">
                  <Target className="w-3.5 h-3.5 mr-1.5" />
                  Exp: {event.experiment_id.slice(0, 8)}...
                </Badge>
              )}
              {event.variant_id && (
                <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-xl font-semibold px-4 py-1.5 text-sm shadow-lg">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Variante: {event.variant_id.slice(0, 8)}...
                </Badge>
              )}
              {event.value && (
                <Badge className="bg-emerald-500 text-white border-emerald-400 font-bold px-4 py-1.5 text-sm shadow-lg">
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                  R$ {event.value.toFixed(2)}
                </Badge>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <ScrollArea className="max-h-[calc(95vh-380px)]">
          <div className="p-8 space-y-8">
            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button
                onClick={exportEventData}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
              <Button
                onClick={() => copyToClipboard(JSON.stringify(event, null, 2), 'full')}
                variant="outline"
                className="flex-1 border-2 hover:bg-slate-50 transition-all"
              >
                {copiedField === 'full' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Tudo
                  </>
                )}
              </Button>
            </div>

            {/* Event Metadata */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Metadados do Evento
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event ID */}
                <div className="group p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-600" />
                      Event ID
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(event.id, 'id')}
                      className="h-7 px-2 hover:bg-white/70 transition-all"
                    >
                      {copiedField === 'id' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-600" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm font-mono font-semibold text-slate-900 truncate">{event.id}</p>
                </div>

                {/* Visitor ID */}
                <div className="group p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-purple-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      Visitor ID
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(event.visitor_id, 'visitor')}
                      className="h-7 px-2 hover:bg-white/70 transition-all"
                    >
                      {copiedField === 'visitor' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-purple-600" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm font-mono font-semibold text-purple-900 truncate">{event.visitor_id}</p>
                </div>

                {/* Created At */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all">
                  <span className="text-sm font-bold text-emerald-700 flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Data e Hora
                  </span>
                  <p className="text-sm font-semibold text-emerald-900">{formatDate(event.created_at)}</p>
                </div>

                {/* Session ID */}
                {event.session_id && (
                  <div className="group p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 hover:border-orange-300 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-orange-700 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        Session ID
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(event.session_id!, 'session')}
                        className="h-7 px-2 hover:bg-white/70 transition-all"
                      >
                        {copiedField === 'session' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-orange-600" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm font-mono font-semibold text-orange-900 truncate">{event.session_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Device & Browser Info */}
            {(event.device_type || event.browser || event.os) && (
              <>
                <Separator className="my-8" />
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                      <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">
                      Informações Técnicas
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {event.device_type && (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-300 hover:shadow-lg transition-all">
                        <span className="text-xs font-black text-purple-700 uppercase tracking-wider mb-2 block">
                          Dispositivo
                        </span>
                        <p className="text-lg font-black text-purple-900 capitalize">{event.device_type}</p>
                      </div>
                    )}
                    {event.browser && (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-300 hover:shadow-lg transition-all">
                        <span className="text-xs font-black text-blue-700 uppercase tracking-wider mb-2 block">
                          Navegador
                        </span>
                        <p className="text-lg font-black text-blue-900">{event.browser}</p>
                      </div>
                    )}
                    {event.os && (
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-50 border-2 border-cyan-300 hover:shadow-lg transition-all">
                        <span className="text-xs font-black text-cyan-700 uppercase tracking-wider mb-2 block">
                          Sistema
                        </span>
                        <p className="text-lg font-black text-cyan-900">{event.os}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Location Info */}
            {(event.country || event.city) && (
              <>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    Localização
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.country && (
                      <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
                        <span className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1 block">
                          País
                        </span>
                        <p className="text-sm font-bold text-red-900">{event.country}</p>
                      </div>
                    )}
                    {event.city && (
                      <div className="p-4 rounded-xl bg-orange-50 border-2 border-orange-200">
                        <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1 block">
                          Cidade
                        </span>
                        <p className="text-sm font-bold text-orange-900">{event.city}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* UTM Parameters */}
            {(event.utm_source || event.utm_medium || event.utm_campaign) && (
              <>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ExternalLink className="h-5 w-5 text-indigo-600" />
                    Parâmetros UTM
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {event.utm_source && (
                      <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-200">
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1 block">
                          Source
                        </span>
                        <p className="text-sm font-bold text-indigo-900">{event.utm_source}</p>
                      </div>
                    )}
                    {event.utm_medium && (
                      <div className="p-4 rounded-xl bg-violet-50 border-2 border-violet-200">
                        <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-1 block">
                          Medium
                        </span>
                        <p className="text-sm font-bold text-violet-900">{event.utm_medium}</p>
                      </div>
                    )}
                    {event.utm_campaign && (
                      <div className="p-4 rounded-xl bg-fuchsia-50 border-2 border-fuchsia-200">
                        <span className="text-xs font-semibold text-fuchsia-600 uppercase tracking-wide mb-1 block">
                          Campaign
                        </span>
                        <p className="text-sm font-bold text-fuchsia-900">{event.utm_campaign}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Custom Properties */}
            {event.properties && typeof event.properties === 'object' && Object.keys(event.properties).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Code className="h-5 w-5 text-slate-600" />
                  Propriedades Personalizadas
                </h3>

                <div className="rounded-xl bg-slate-900 p-6 overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono leading-relaxed">
                    {JSON.stringify(event.properties, null, 2)}
                  </pre>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(event.properties).map(([key, value]) => (
                    <div key={key} className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-slate-900">{key}</span>
                            <Badge variant="secondary" className="text-xs">
                              {getPropertyType(value)}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 font-mono break-all">
                            {formatPropertyValue(value)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(formatPropertyValue(value), key)}
                          className="shrink-0"
                        >
                          {copiedField === key ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t-2 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all px-8 font-bold"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
