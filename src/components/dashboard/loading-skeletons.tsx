import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton para gráficos/charts
 * Usado como loading state para EventTrendsChart
 */
export function ChartSkeleton() {
  return (
    <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Chart area */}
        <div className="space-y-3">
          <Skeleton className="h-[300px] w-full" />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 justify-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Skeleton para tabelas
 * Usado como loading state para UTMAnalysisTable e listas
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>

        {/* Table Header */}
        <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-200">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Table Rows */}
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

/**
 * Skeleton para cards de insights
 * Usado como loading state para EventInsights
 */
export function InsightsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton para timeline
 * Usado como loading state para EventTimeline
 */
export function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
          <div className="space-y-6">
            {/* Session Header */}
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>

            {/* Timeline Events */}
            <div className="space-y-4 ml-6 border-l-2 border-slate-200 pl-6">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-8 w-8 rounded-lg absolute -ml-[44px]" />
                  <div className="space-y-2 p-4 rounded-xl bg-slate-50">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton para lista de eventos
 * Usado como loading state para VirtualizedEventList
 */
export function EventListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        </Card>
      ))}
    </div>
  )
}

/**
 * Skeleton genérico para componentes
 * Fallback padrão quando não há skeleton específico
 */
export function GenericSkeleton() {
  return (
    <Card className="backdrop-blur-xl bg-white/95 border-0 shadow-xl p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </Card>
  )
}
