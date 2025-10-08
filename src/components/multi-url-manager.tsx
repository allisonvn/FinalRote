"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Page {
  id: number
  url: string
  weight: number
  description: string
  active: boolean
}

interface MultiUrlManagerProps {
  urls: Page[]
  onChange: (urls: Page[]) => void
  selectionMode?: 'random' | 'weighted' | 'sequential'
  onSelectionModeChange?: (mode: 'random' | 'weighted' | 'sequential') => void
  className?: string
}

export function MultiUrlManager({
  urls,
  onChange,
  selectionMode = 'random',
  onSelectionModeChange,
  className
}: MultiUrlManagerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const addUrl = () => {
    const newId = Math.max(0, ...urls.map(u => u.id)) + 1
    const equalWeight = urls.length > 0 ? 100 / (urls.length + 1) : 100
    
    // Redistribuir pesos igualmente
    const updatedUrls = urls.map(u => ({
      ...u,
      weight: equalWeight
    }))
    
    onChange([
      ...updatedUrls,
      {
        id: newId,
        url: '',
        weight: equalWeight,
        description: `Página ${urls.length + 1}`,
        active: true
      }
    ])
    
    setExpandedIds(new Set([...expandedIds, newId]))
  }

  const removeUrl = (id: number) => {
    const filtered = urls.filter(u => u.id !== id)
    
    // Redistribuir pesos igualmente
    if (filtered.length > 0) {
      const equalWeight = 100 / filtered.length
      onChange(filtered.map(u => ({ ...u, weight: equalWeight })))
    } else {
      onChange(filtered)
    }
    
    const newExpanded = new Set(expandedIds)
    newExpanded.delete(id)
    setExpandedIds(newExpanded)
  }

  const updateUrl = (id: number, field: keyof Page, value: any) => {
    onChange(
      urls.map(u => 
        u.id === id ? { ...u, [field]: value } : u
      )
    )
  }

  const distributeEqually = () => {
    const equalWeight = 100 / urls.length
    onChange(urls.map(u => ({ ...u, weight: equalWeight })))
  }

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const totalWeight = urls.reduce((sum, u) => sum + u.weight, 0)
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-base font-semibold">
            URLs do Teste ({urls.length})
          </Label>
          <p className="text-sm text-muted-foreground">
            Adicione múltiplas URLs para testar diferentes páginas
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addUrl}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar URL
        </Button>
      </div>

      {/* Selection Mode */}
      {urls.length > 1 && onSelectionModeChange && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <Label className="text-sm font-medium mb-2 block">
            Modo de Seleção
          </Label>
          <Select value={selectionMode} onValueChange={onSelectionModeChange}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="random">
                🎲 Aleatório - Distribuição uniforme entre URLs
              </SelectItem>
              <SelectItem value="weighted">
                ⚖️ Ponderado - Baseado nos pesos configurados
              </SelectItem>
              <SelectItem value="sequential">
                📊 Sequencial - Rotação entre as URLs
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            {selectionMode === 'random' && 'Cada visitante verá uma URL aleatória'}
            {selectionMode === 'weighted' && 'URLs com maior peso aparecem mais frequentemente'}
            {selectionMode === 'sequential' && 'As URLs são distribuídas de forma sequencial'}
          </p>
        </div>
      )}

      {/* Weight Distribution Warning */}
      {selectionMode === 'weighted' && urls.length > 1 && !isWeightValid && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              ⚠️ Total de pesos: {totalWeight.toFixed(1)}% (deve somar 100%)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={distributeEqually}
            >
              Distribuir Igualmente
            </Button>
          </div>
        </div>
      )}

      {/* URLs List */}
      <div className="space-y-3">
        {urls.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Nenhuma URL adicionada ainda
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUrl}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira URL
            </Button>
          </div>
        ) : (
          urls.map((page, index) => (
            <div
              key={page.id}
              className={cn(
                "rounded-lg border bg-card transition-colors",
                !page.active && "opacity-50"
              )}
            >
              {/* Compact View */}
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="cursor-grab text-muted-foreground hover:text-foreground"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="https://exemplo.com/pagina"
                      value={page.url}
                      onChange={(e) => updateUrl(page.id, 'url', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>

                  {selectionMode === 'weighted' && (
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={page.weight}
                        onChange={(e) => updateUrl(page.id, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleExpanded(page.id)}
                    className="shrink-0"
                  >
                    <span className="text-xs">
                      {expandedIds.has(page.id) ? '▼' : '▶'}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUrl(page.id)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Expanded View */}
                {expandedIds.has(page.id) && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div>
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        placeholder="Ex: Homepage principal"
                        value={page.description}
                        onChange={(e) => updateUrl(page.id, 'description', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`active-${page.id}`}
                        checked={page.active}
                        onChange={(e) => updateUrl(page.id, 'active', e.target.checked)}
                        className="rounded"
                      />
                      <Label
                        htmlFor={`active-${page.id}`}
                        className="text-sm cursor-pointer"
                      >
                        Página ativa
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {urls.length > 1 && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Total de URLs ativas:
            </span>
            <span className="font-medium">
              {urls.filter(u => u.active).length} de {urls.length}
            </span>
          </div>
          {selectionMode === 'weighted' && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">
                Soma dos pesos:
              </span>
              <span className={cn(
                "font-medium",
                isWeightValid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
              )}>
                {totalWeight.toFixed(1)}%
                {isWeightValid ? ' ✓' : ' ⚠️'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

