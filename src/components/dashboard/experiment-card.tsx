'use client'

import { useState } from 'react'
import {
  MoreVertical,
  Play,
  Pause,
  Square,
  Copy,
  Trash2,
  Edit,
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  Pin,
  PinOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useApp } from '@/providers/app-provider'
import { cn } from '@/lib/utils'

type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed'

interface Experiment {
  id: string
  name: string
  description?: string
  status: ExperimentStatus
  created_at: string
  project_id?: string
  algorithm?: string
  traffic_allocation?: number
  tags?: string[]
  variants?: Array<{
    id: string
    name: string
    key: string
    is_control: boolean
  }>
}

interface ExperimentCardProps {
  experiment: Experiment
  onStart?: (id: string) => void
  onPause?: (id: string) => void
  onStop?: (id: string) => void
  onDuplicate?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (id: string) => void
  onView?: (id: string) => void
}

const statusConfig = {
  draft: {
    label: 'Rascunho',
    color: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-300',
    icon: Edit
  },
  running: {
    label: 'Executando',
    color: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border border-emerald-600 shadow-lg',
    icon: Play
  },
  paused: {
    label: 'Pausado',
    color: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border border-amber-500 shadow-lg',
    icon: Pause
  },
  completed: {
    label: 'Concluído',
    color: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border border-blue-600 shadow-lg',
    icon: Square
  }
}

export function ExperimentCard({
  experiment,
  onStart,
  onPause,
  onStop,
  onDuplicate,
  onDelete,
  onEdit,
  onView
}: ExperimentCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { preferences, togglePin } = useApp()

  const isPinned = preferences.pinnedExperiments.includes(experiment.id)
  const status = statusConfig[experiment.status]
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString))
  }

  const canStart = experiment.status === 'draft' || experiment.status === 'paused'
  const canPause = experiment.status === 'running'
  const canStop = experiment.status === 'running' || experiment.status === 'paused'

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-input bg-card p-6',
        'card-glass hover-lift shadow-soft hover:shadow-large transition-all',
        isPinned && 'ring-1 ring-primary/30 bg-primary/5'
      )}
      role={onView ? 'button' : undefined}
      tabIndex={onView ? 0 : -1}
      onClick={() => onView?.(experiment.id)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onView) {
          e.preventDefault()
          onView(experiment.id)
        }
      }}
      aria-label={`Abrir ${experiment.name}`}
      style={{ cursor: onView ? 'pointer' as const : 'default' }}
    >
      {/* Subtle pattern background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_hsl(var(--foreground))_1px,_transparent_0)] [background-size:16px_16px]" />
      </div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="font-semibold text-base truncate cursor-pointer hover:text-primary"
              onClick={() => onView?.(experiment.id)}
            >
              {experiment.name}
            </h3>
            {isPinned && <Pin className="h-3 w-3 text-primary" strokeWidth={1.75} />}
          </div>
          {experiment.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {experiment.description}
            </p>
          )}
        </div>

        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {canStart && (
              <DropdownMenuItem onClick={() => onStart?.(experiment.id)}>
                <Play className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Iniciar
              </DropdownMenuItem>
            )}
            {canPause && (
              <DropdownMenuItem onClick={() => onPause?.(experiment.id)}>
                <Pause className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Pausar
              </DropdownMenuItem>
            )}
            {canStop && (
              <DropdownMenuItem onClick={() => onStop?.(experiment.id)}>
                <Square className="mr-2 h-4 w-4" strokeWidth={1.75} />
                Finalizar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit?.(experiment.id)}>
              <Edit className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate?.(experiment.id)}>
              <Copy className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => togglePin(experiment.id)}>
              {isPinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  Desafixar
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  Fixar
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(experiment.id)}
              className="text-danger focus:text-danger"
            >
              <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Enhanced Status badge */}
      <div className="flex items-center gap-2 mb-4">
        <Badge className={cn('gap-2 px-3 py-1.5 rounded-full font-medium transition-all duration-200 hover:scale-105', status.color)}>
          <StatusIcon className="h-3 w-3" strokeWidth={1.75} />
          {status.label}
        </Badge>
        {experiment.algorithm && (
          <Badge variant="outline" className="text-xs px-2 py-1 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 transition-all duration-200">
            {experiment.algorithm === 'thompson_sampling' ? 'Thompson' : experiment.algorithm}
          </Badge>
        )}
      </div>

      {/* Variants */}
      {experiment.variants && experiment.variants.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Variantes:</p>
          <div className="flex gap-1 flex-wrap">
            {experiment.variants.map((variant) => (
              <div
                key={variant.id}
                className={cn(
                  'px-2 py-1 rounded text-xs',
                  variant.is_control
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {variant.key}: {variant.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {experiment.tags && experiment.tags.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Tags:</p>
          <div className="flex gap-2 flex-wrap">
            {experiment.tags.slice(0, 4).map(tag => (
              <span key={tag} className="chip">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" strokeWidth={1.75} />
          <p className="text-xs text-muted-foreground">Visitantes</p>
          <p className="text-sm font-semibold">1.2k</p>
        </div>
        <div className="text-center">
          <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" strokeWidth={1.75} />
          <p className="text-xs text-muted-foreground">Taxa Conv.</p>
          <p className="text-sm font-semibold">3.4%</p>
        </div>
        <div className="text-center">
          <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" strokeWidth={1.75} />
          <p className="text-xs text-muted-foreground">Uplift</p>
          <p className="text-sm font-semibold text-success">+12%</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" strokeWidth={1.75} />
          {formatDate(experiment.created_at)}
        </div>
        {experiment.traffic_allocation && (
          <span>{experiment.traffic_allocation}% tráfego</span>
        )}
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 to-primary opacity-70" />
    </div>
  )
}
