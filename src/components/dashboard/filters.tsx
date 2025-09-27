'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  X,
  Calendar,
  Tag,
  BarChart3,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type FilterValue = string | string[] | null | undefined

interface FilterConfig {
  status?: 'all' | 'draft' | 'running' | 'paused' | 'completed'
  query?: string
  tags?: string[]
  dateRange?: string
  project?: string
  algorithm?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  view?: 'grid' | 'list'
}

interface FiltersProps {
  filters: FilterConfig
  onFiltersChange: (filters: FilterConfig) => void
  availableTags?: string[]
  availableProjects?: Array<{ id: string; name: string }>
  showViewToggle?: boolean
}

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'running', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Concluído' }
]

const algorithmOptions = [
  { value: 'all', label: 'Todos os algoritmos' },
  { value: 'thompson_sampling', label: 'Thompson Sampling' },
  { value: 'ucb1', label: 'UCB1' },
  { value: 'epsilon_greedy', label: 'Epsilon Greedy' },
  { value: 'uniform', label: 'Uniforme' }
]

const sortOptions = [
  { value: 'created_at', label: 'Data de criação' },
  { value: 'updated_at', label: 'Última atualização' },
  { value: 'name', label: 'Nome' },
  { value: 'status', label: 'Status' }
]

export function Filters({
  filters,
  onFiltersChange,
  availableTags = [],
  availableProjects = [],
  showViewToggle = true
}: FiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const updateFilter = (key: keyof FilterConfig, value: FilterValue) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      query: '',
      tags: [],
      dateRange: undefined,
      project: undefined,
      algorithm: undefined,
      sortBy: 'created_at',
      sortOrder: 'desc',
      view: filters.view
    })
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = (filters.tags || []).filter(tag => tag !== tagToRemove)
    updateFilter('tags', newTags)
  }

  const addTag = (tag: string) => {
    const currentTags = filters.tags || []
    if (!currentTags.includes(tag)) {
      updateFilter('tags', [...currentTags, tag])
    }
  }

  const hasActiveFilters = Boolean(
    (filters.status && filters.status !== 'all') ||
    filters.query ||
    (filters.tags && filters.tags.length > 0) ||
    filters.dateRange ||
    filters.project ||
    (filters.algorithm && filters.algorithm !== 'all')
  )

  const activeFilterCount = [
    filters.status !== 'all' ? 1 : 0,
    filters.query ? 1 : 0,
    filters.tags?.length || 0,
    filters.dateRange ? 1 : 0,
    filters.project ? 1 : 0,
    filters.algorithm !== 'all' ? 1 : 0
  ].reduce((sum, count) => sum + count, 0)

  return (
    <div className="space-y-6">
      {/* Enhanced Search and main filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Enhanced Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          <Input
            placeholder="Buscar experimentos..."
            value={filters.query || ''}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-10 pr-4 py-3 bg-white/90 dark:bg-background/90 border-border/60 hover:border-border focus:border-primary focus:bg-white dark:focus:bg-background transition-all duration-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg backdrop-blur-sm"
          />
        </div>

        {/* Enhanced Status filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => updateFilter('status', value as any)}
        >
          <SelectTrigger className="w-full sm:w-52 h-12 bg-white/90 dark:bg-background/90 border-border/60 hover:border-border focus:border-primary transition-all duration-200 rounded-xl shadow-sm hover:shadow-md backdrop-blur-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/60 shadow-xl">
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="rounded-lg">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Enhanced Advanced filters */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="relative h-12 px-4 bg-white/90 dark:bg-background/90 border-border/60 hover:border-border hover:bg-white dark:hover:bg-background transition-all duration-200 rounded-xl shadow-sm hover:shadow-md backdrop-blur-sm group"
            >
              <Filter className="mr-2 h-4 w-4 group-hover:text-primary transition-colors duration-200" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-primary text-primary-foreground animate-pulse" variant="secondary">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 rounded-xl border-border/60 shadow-xl bg-white/95 dark:bg-background/95 backdrop-blur-xl" align="end">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">Filtros Avançados</h4>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-primary hover:bg-primary/10 rounded-lg"
                  >
                    Limpar
                  </Button>
                )}
              </div>

              <Separator className="bg-border/60" />

              {/* Project filter */}
              {availableProjects.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Projeto</label>
                  <Select
                    value={filters.project || 'all'}
                    onValueChange={(value) => updateFilter('project', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os projetos</SelectItem>
                      <SelectItem value="none">Sem projeto</SelectItem>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Algorithm filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Algoritmo</label>
                <Select
                  value={filters.algorithm || 'all'}
                  onValueChange={(value) => updateFilter('algorithm', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {algorithmOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags filter */}
              {availableTags.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {availableTags.map((tag) => (
                      <Button
                        key={tag}
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => addTag(tag)}
                        disabled={(filters.tags || []).includes(tag)}
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Enhanced View toggle */}
        {showViewToggle && (
          <div className="flex rounded-xl border border-border/60 bg-white/90 dark:bg-background/90 backdrop-blur-sm shadow-sm overflow-hidden">
            <Button
              variant={filters.view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateFilter('view', 'grid')}
              className={`h-12 px-4 rounded-none transition-all duration-200 ${
                filters.view === 'grid' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-primary/10'
              }`}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={filters.view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateFilter('view', 'list')}
              className={`h-12 px-4 rounded-none transition-all duration-200 ${
                filters.view === 'list' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-primary/10'
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Enhanced Sort */}
        <div className="flex gap-2">
          <Select
            value={filters.sortBy || 'created_at'}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger className="w-44 h-12 bg-white/90 dark:bg-background/90 border-border/60 hover:border-border focus:border-primary transition-all duration-200 rounded-xl shadow-sm hover:shadow-md backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60 shadow-xl">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-lg">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-12 w-12 bg-white/90 dark:bg-background/90 border-border/60 hover:border-border hover:bg-primary/10 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md backdrop-blur-sm group"
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4 group-hover:text-primary transition-colors duration-200" />
            ) : (
              <SortDesc className="h-4 w-4 group-hover:text-primary transition-colors duration-200" />
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Active filters display */}
      {(filters.tags && filters.tags.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {filters.tags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary" 
              className="gap-2 px-3 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all duration-200 rounded-full"
            >
              <Tag className="h-3 w-3" />
              {tag}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-primary/20 rounded-full"
                onClick={() => removeTag(tag)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}