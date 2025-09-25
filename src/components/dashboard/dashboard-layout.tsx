'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Bell,
  User,
  ChevronLeft,
  Home,
  Database,
  Activity,
  Target,
  Users,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useApp } from '@/providers/app-provider'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard' as const, icon: Home },
  { name: 'Experimentos', href: '/dashboard/experiments' as const, icon: BarChart3 },
  { name: 'Projetos', href: '/dashboard/projects' as const, icon: Database },
  { name: 'Analytics', href: '/dashboard/analytics' as const, icon: TrendingUp },
  { name: 'Visitantes', href: '/dashboard/visitors' as const, icon: Users },
  { name: 'Metas', href: '/dashboard/goals' as const, icon: Target },
  { name: 'Configurações', href: '/settings' as const, icon: Settings },
]

export function DashboardLayout({ children, title, description, actions }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { preferences, toggleSidebar } = useApp()
  const pathname = usePathname()

  const sidebarCollapsed = preferences.sidebarCollapsed

  return (
    <div className="relative min-h-screen bg-gradient-surface bg-grid-slate">
      {/* Decorative spotlight for depth in light mode */}
      <div className="pointer-events-none absolute -top-24 -left-16 spotlight" />
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col sidebar-tonal card-glass shadow-soft transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-soft ring-1 ring-border/70">
                <Activity className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span className="font-bold text-lg">Rota Final</span>
            </Link>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href as any}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                  'ring-1 ring-transparent',
                  isActive
                    ? 'bg-primary/10 text-primary ring-primary/20'
                    : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground hover:ring-border/60',
                  sidebarCollapsed && 'justify-center'
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-full bg-gradient-to-b from-primary to-primary/60" />
                )}
                <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4" strokeWidth={1.75} />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">João Silva</p>
                <p className="text-xs text-muted-foreground truncate">joao@empresa.com</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          'relative z-10 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 bg-white/70 dark:bg-background/60 backdrop-blur-xl px-4 lg:px-6 supports-[backdrop-filter]:bg-white/70">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="hidden lg:flex"
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                sidebarCollapsed && 'rotate-180'
              )}
            />
          </Button>

          {/* Page title */}
          {(title || description) && (
            <div className="flex-1 min-w-0">
              {title && <h1 className="text-lg font-semibold truncate">{title}</h1>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
          )}

          {/* Header actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
              <Input
                placeholder="Buscar experimentos..."
                className="w-64 pl-9"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              <span className="sr-only">Notificações</span>
            </Button>

            {/* Global Time Range */}
            <Select
              value={preferences.defaultTimeRange}
              onValueChange={(v) => updatePreference('defaultTimeRange', v as any)}
            >
              <SelectTrigger className="w-[128px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
              </SelectContent>
            </Select>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Actions */}
            {actions}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
