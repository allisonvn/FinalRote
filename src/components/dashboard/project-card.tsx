"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { BarChart3, Settings, Users, TrendingUp, Folder } from 'lucide-react'

interface ProjectCardProps {
  name: string
  description?: string
  createdAt?: string
  experimentsCount?: number
  activeExperiments?: number
  visitors30d?: number
  totalRevenue30d?: number
  onOpen?: () => void
  onSettings?: () => void
  className?: string
}

export function ProjectCard({
  name,
  description,
  createdAt,
  experimentsCount = 0,
  activeExperiments = 0,
  visitors30d = 0,
  totalRevenue30d = 0,
  onOpen,
  onSettings,
  className
}: ProjectCardProps) {
  const formatDate = (date?: string) => {
    if (!date) return null
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(new Date(date))
    } catch {
      return null
    }
  }

  return (
    <Card className={cn('relative overflow-hidden group card-glass hover-lift', className)}>
      {/* Gradient banner */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary/15 via-blue-400/15 to-purple-400/15" />
      <CardHeader className="relative pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-soft ring-1 ring-border/70">
            <Folder className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <CardTitle className="text-base">{name}</CardTitle>
            {createdAt && (
              <p className="text-xs text-muted-foreground">Criado em {formatDate(createdAt)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSettings} className="gap-1">
            <Settings className="h-4 w-4" strokeWidth={1.75} />
            <span className="hidden sm:inline">Configurar</span>
          </Button>
          <Button size="sm" onClick={onOpen} className="bg-gradient-primary text-primary-foreground shadow-soft hover:opacity-90">
            Abrir
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative pt-2">
        {description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-input p-3 text-center">
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-primary" strokeWidth={1.75} />
            <div className="text-sm font-semibold">{experimentsCount}</div>
            <div className="text-xs text-muted-foreground">Experimentos</div>
          </div>
          <div className="rounded-xl border border-input p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-success" strokeWidth={1.75} />
            <div className="text-sm font-semibold">{activeExperiments}</div>
            <div className="text-xs text-muted-foreground">Ativos</div>
          </div>
          <div className="rounded-xl border border-input p-3 text-center">
            <Users className="h-4 w-4 mx-auto mb-1 text-info" strokeWidth={1.75} />
            <div className="text-sm font-semibold">{visitors30d.toLocaleString('pt-BR')}</div>
            <div className="text-xs text-muted-foreground">Visitantes (30d)</div>
          </div>
          <div className="rounded-xl border border-input p-3 text-center">
            <BarChart3 className="h-4 w-4 mx-auto mb-1 text-warning" strokeWidth={1.75} />
            <div className="text-sm font-semibold">R$ {(totalRevenue30d/1000).toFixed(1)}k</div>
            <div className="text-xs text-muted-foreground">Receita (30d)</div>
          </div>
        </div>
      </CardContent>
      {/* bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 to-primary opacity-70" />
    </Card>
  )
}
