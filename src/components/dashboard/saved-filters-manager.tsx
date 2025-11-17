'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bookmark, Trash2, Check, X, Save } from 'lucide-react'
import { useSavedFilters, type SavedFilter } from '@/hooks/useSavedFilters'
import type { EventFilters } from '@/components/dashboard/advanced-event-filters'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SavedFiltersManagerProps {
  currentFilters: EventFilters
  onLoadFilter: (filters: EventFilters) => void
}

export function SavedFiltersManager({ currentFilters, onLoadFilter }: SavedFiltersManagerProps) {
  const { savedFilters, saveFilter, deleteFilter, loadFilter } = useSavedFilters()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [filterName, setFilterName] = useState('')

  const handleSave = () => {
    if (!filterName.trim()) {
      toast.error('Digite um nome para o filtro')
      return
    }

    saveFilter(filterName, currentFilters)
    toast.success(`Filtro "${filterName}" salvo com sucesso!`)
    setFilterName('')
    setIsSaving(false)
  }

  const handleLoad = (id: string) => {
    const filters = loadFilter(id)
    if (filters) {
      onLoadFilter(filters)
      setIsOpen(false)
      const filterObj = savedFilters.find(f => f.id === id)
      toast.success(`Filtro "${filterObj?.name}" aplicado`)
    }
  }

  const handleDelete = (id: string, name: string) => {
    deleteFilter(id)
    toast.success(`Filtro "${name}" removido`)
  }

  const hasActiveFilters = () => {
    return currentFilters.search !== '' ||
      currentFilters.eventType !== 'all' ||
      currentFilters.experimentId !== 'all' ||
      currentFilters.dateFrom !== undefined ||
      currentFilters.dateTo !== undefined ||
      currentFilters.visitorId !== '' ||
      currentFilters.device !== '' ||
      currentFilters.browser !== '' ||
      currentFilters.country !== '' ||
      currentFilters.utmSource !== '' ||
      currentFilters.utmMedium !== '' ||
      currentFilters.utmCampaign !== '' ||
      currentFilters.minValue !== undefined ||
      currentFilters.maxValue !== undefined
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "border-2 relative",
            savedFilters.length > 0 && "border-blue-500 text-blue-700"
          )}
        >
          <Bookmark className="h-4 w-4 mr-2" />
          Filtros Salvos
          {savedFilters.length > 0 && (
            <Badge className="ml-2 bg-blue-600 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs">
              {savedFilters.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Filtros Salvos</h3>
            {hasActiveFilters() && !isSaving && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSaving(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Salvar Atual
              </Button>
            )}
          </div>

          {/* Save New Filter Form */}
          {isSaving && (
            <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200 space-y-3">
              <Input
                placeholder="Nome do filtro..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className="border-2"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsSaving(false)
                    setFilterName('')
                  }}
                  className="border-2"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Saved Filters List */}
          {savedFilters.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Bookmark className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Nenhum filtro salvo ainda</p>
              <p className="text-xs mt-1">Configure filtros e salve para reutilizar</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="group p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => handleLoad(filter.id)}
                        className="flex-1 text-left"
                      >
                        <h4 className="font-semibold text-slate-900 text-sm mb-1">
                          {filter.name}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Salvo em {new Date(filter.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(filter.id, filter.name)}
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Filter Preview */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {filter.filters.eventType !== 'all' && (
                        <Badge variant="secondary" className="text-xs">
                          {filter.filters.eventType}
                        </Badge>
                      )}
                      {filter.filters.dateFrom && (
                        <Badge variant="secondary" className="text-xs">
                          📅 Período
                        </Badge>
                      )}
                      {filter.filters.device && (
                        <Badge variant="secondary" className="text-xs">
                          📱 {filter.filters.device}
                        </Badge>
                      )}
                      {(filter.filters.utmSource || filter.filters.utmMedium || filter.filters.utmCampaign) && (
                        <Badge variant="secondary" className="text-xs">
                          🎯 UTMs
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
