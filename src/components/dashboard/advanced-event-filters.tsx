'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useDebounce } from '@/hooks/useDebounce'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  X,
  Eye,
  MousePointer,
  Target,
  Activity,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface EventFilters {
  search: string
  eventType: string
  experimentId: string
  dateFrom: Date | undefined
  dateTo: Date | undefined
  visitorId: string
  device: string
  browser: string
  country: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  minValue: number | undefined
  maxValue: number | undefined
}

interface AdvancedEventFiltersProps {
  filters: EventFilters
  onFiltersChange: (filters: EventFilters) => void
  onReset: () => void
  experiments?: Array<{ id: string; name: string }>
  totalEvents: number
  filteredCount: number
}

export function AdvancedEventFilters({
  filters,
  onFiltersChange,
  onReset,
  experiments = [],
  totalEvents,
  filteredCount
}: AdvancedEventFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search)
  const debouncedSearch = useDebounce(searchInput, 500)

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch })
    }
  }, [debouncedSearch])

  const eventTypes = [
    { value: 'all', label: 'Todos os Tipos', icon: Activity },
    { value: 'page_view', label: 'Visualizações', icon: Eye },
    { value: 'click', label: 'Cliques', icon: MousePointer },
    { value: 'conversion', label: 'Conversões', icon: Target },
    { value: 'custom', label: 'Personalizados', icon: Activity }
  ]

  const updateFilter = (key: keyof EventFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  // Sync searchInput with external filter changes
  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  const hasActiveFilters =
    filters.search !== '' ||
    filters.eventType !== 'all' ||
    filters.experimentId !== 'all' ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined ||
    filters.visitorId !== '' ||
    filters.device !== '' ||
    filters.browser !== '' ||
    filters.country !== '' ||
    filters.utmSource !== '' ||
    filters.utmMedium !== '' ||
    filters.utmCampaign !== '' ||
    filters.minValue !== undefined ||
    filters.maxValue !== undefined

  const activeFilterCount = [
    filters.search !== '',
    filters.eventType !== 'all',
    filters.experimentId !== 'all',
    filters.dateFrom !== undefined,
    filters.dateTo !== undefined,
    filters.visitorId !== '',
    filters.device !== '',
    filters.browser !== '',
    filters.country !== '',
    filters.utmSource !== '',
    filters.utmMedium !== '',
    filters.utmCampaign !== '',
    filters.minValue !== undefined,
    filters.maxValue !== undefined
  ].filter(Boolean).length

  const handleReset = () => {
    setSearchInput('')
    onReset()
  }

  // Quick date filter helpers
  const setDateRange = (from: Date, to: Date) => {
    onFiltersChange({ ...filters, dateFrom: from, dateTo: to })
  }

  const setToday = () => {
    const today = new Date()
    setDateRange(startOfDay(today), endOfDay(today))
  }

  const setLast7Days = () => {
    const today = new Date()
    setDateRange(startOfDay(subDays(today, 6)), endOfDay(today))
  }

  const setLast30Days = () => {
    const today = new Date()
    setDateRange(startOfDay(subDays(today, 29)), endOfDay(today))
  }

  const setThisWeek = () => {
    const today = new Date()
    setDateRange(startOfWeek(today, { locale: ptBR }), endOfDay(today))
  }

  const setThisMonth = () => {
    const today = new Date()
    setDateRange(startOfMonth(today), endOfDay(today))
  }

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl">
        <div className="p-6 space-y-4">
          {/* Search & Quick Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Buscar por nome do evento, visitor ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-11 h-12 text-base border-2 border-slate-200 focus:border-blue-500 rounded-xl"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchInput('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-400 shrink-0" />
              <div className="flex flex-wrap gap-2">
                {eventTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      variant={filters.eventType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilter('eventType', type.value)}
                      className={cn(
                        "transition-all",
                        filters.eventType === type.value
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl"
                          : "bg-white hover:bg-slate-50 border-2 border-slate-200"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-1.5" />
                      {type.label}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Advanced Toggle */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                "border-2 transition-all shrink-0",
                showAdvanced
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "border-slate-200"
              )}
            >
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Avançado
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-blue-600 text-white">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {/* Quick Date Filters */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Período Rápido</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setToday}
                    className="border-2"
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setLast7Days}
                    className="border-2"
                  >
                    Últimos 7 dias
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setLast30Days}
                    className="border-2"
                  >
                    Últimos 30 dias
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setThisWeek}
                    className="border-2"
                  >
                    Esta semana
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={setThisMonth}
                    className="border-2"
                  >
                    Este mês
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date From */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11 border-2",
                          !filters.dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? (
                          format(filters.dateFrom, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => updateFilter('dateFrom', date)}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11 border-2",
                          !filters.dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? (
                          format(filters.dateTo, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => updateFilter('dateTo', date)}
                        initialFocus
                        locale={ptBR}
                        disabled={(date) =>
                          filters.dateFrom ? date < filters.dateFrom : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Experiment Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Experimento</Label>
                  <Select
                    value={filters.experimentId}
                    onValueChange={(value) => updateFilter('experimentId', value)}
                  >
                    <SelectTrigger className="h-11 border-2">
                      <SelectValue placeholder="Todos os experimentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os experimentos</SelectItem>
                      {experiments.map((exp) => (
                        <SelectItem key={exp.id} value={exp.id}>
                          {exp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Visitor ID Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Visitor ID</Label>
                  <Input
                    placeholder="visitor_123..."
                    value={filters.visitorId}
                    onChange={(e) => updateFilter('visitorId', e.target.value)}
                    className="h-11 border-2 border-slate-200 focus:border-blue-500"
                  />
                </div>

                {/* Device Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Dispositivo</Label>
                  <Select
                    value={filters.device}
                    onValueChange={(value) => updateFilter('device', value)}
                  >
                    <SelectTrigger className="h-11 border-2">
                      <SelectValue placeholder="Todos os dispositivos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os dispositivos</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Browser Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Navegador</Label>
                  <Input
                    placeholder="Chrome, Safari..."
                    value={filters.browser}
                    onChange={(e) => updateFilter('browser', e.target.value)}
                    className="h-11 border-2 border-slate-200 focus:border-blue-500"
                  />
                </div>

                {/* Country Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">País</Label>
                  <Input
                    placeholder="Brazil, USA..."
                    value={filters.country}
                    onChange={(e) => updateFilter('country', e.target.value)}
                    className="h-11 border-2 border-slate-200 focus:border-blue-500"
                  />
                </div>

                {/* UTM Source */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">UTM Source</Label>
                  <Input
                    placeholder="google, facebook..."
                    value={filters.utmSource}
                    onChange={(e) => updateFilter('utmSource', e.target.value)}
                    className="h-11 border-2 border-slate-200 focus:border-blue-500"
                  />
                </div>

                {/* UTM Medium */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">UTM Medium</Label>
                  <Input
                    placeholder="cpc, social..."
                    value={filters.utmMedium}
                    onChange={(e) => updateFilter('utmMedium', e.target.value)}
                    className="h-11 border-2 border-slate-200 focus:border-blue-500"
                  />
                </div>

                {/* UTM Campaign */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">UTM Campaign</Label>
                  <Input
                    placeholder="summer_sale..."
                    value={filters.utmCampaign}
                    onChange={(e) => updateFilter('utmCampaign', e.target.value)}
                    className="h-11 border-2 border-slate-200 focus:border-blue-500"
                  />
                </div>

                {/* Min Value */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Valor Mínimo (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={filters.minValue || ''}
                    onChange={(e) => updateFilter('minValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="h-11 border-2 border-slate-200 focus:border-blue-500"
                  />
                </div>

                {/* Max Value */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Valor Máximo (R$)</Label>
                  <Input
                    type="number"
                    placeholder="999.99"
                    value={filters.maxValue || ''}
                    onChange={(e) => updateFilter('maxValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="h-11 border-2 border-slate-200 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="border-2 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Filter Status Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="backdrop-blur-sm bg-blue-50 border-blue-300 text-blue-700 font-bold px-4 py-2">
            <Activity className="h-4 w-4 mr-2" />
            {filteredCount} de {totalEvents} eventos
          </Badge>

          {hasActiveFilters && (
            <Badge variant="outline" className="bg-purple-50 border-purple-300 text-purple-700 font-bold px-4 py-2">
              <Filter className="h-4 w-4 mr-2" />
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro ativo' : 'filtros ativos'}
            </Badge>
          )}
        </div>

        {/* Active Filters Pills */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.eventType !== 'all' && (
              <Badge className="bg-slate-900 text-white">
                Tipo: {eventTypes.find(t => t.value === filters.eventType)?.label}
                <button
                  onClick={() => updateFilter('eventType', 'all')}
                  className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.dateFrom && (
              <Badge className="bg-slate-900 text-white">
                De: {format(filters.dateFrom, "dd/MM/yy")}
                <button
                  onClick={() => updateFilter('dateFrom', undefined)}
                  className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.dateTo && (
              <Badge className="bg-slate-900 text-white">
                Até: {format(filters.dateTo, "dd/MM/yy")}
                <button
                  onClick={() => updateFilter('dateTo', undefined)}
                  className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
