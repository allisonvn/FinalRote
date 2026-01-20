'use client'

import { useState, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Shield,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Home,
  FileText,
  AlertTriangle,
  Activity,
  Database,
  Bell,
  Search,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/root-panel', icon: Home },
  { name: 'Usuários', href: '/root-panel/users', icon: Users },
  { name: 'Organizações', href: '/root-panel/organizations', icon: Building2 },
  { name: 'Assinaturas', href: '/root-panel/subscriptions', icon: CreditCard },
  { name: 'Experimentos', href: '/root-panel/experiments', icon: BarChart3 },
  { name: 'Analytics', href: '/root-panel/analytics', icon: Activity },
  { name: 'Logs', href: '/root-panel/logs', icon: FileText },
  { name: 'Alertas', href: '/root-panel/alerts', icon: AlertTriangle },
  { name: 'Configurações', href: '/root-panel/settings', icon: Settings },
]

export function AdminLayout({ children, title, description, actions }: AdminLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/signin'
  }

  return (
    <div className="relative min-h-screen bg-slate-900">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
          {!sidebarCollapsed && (
            <Link href="/root-panel" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
                <Shield className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span className="font-bold text-lg text-white">Admin Panel</span>
            </Link>
          )}

          {sidebarCollapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white mx-auto">
              <Shield className="h-5 w-5" strokeWidth={1.75} />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/root-panel' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                  isActive
                    ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white border border-transparent',
                  sidebarCollapsed && 'justify-center'
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                {!sidebarCollapsed && isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-red-500" />
                )}
                <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.75} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-slate-700 p-4">
          <Button
            variant="ghost"
            className={cn(
              'w-full text-slate-400 hover:text-red-400 hover:bg-red-600/10',
              sidebarCollapsed ? 'justify-center' : 'justify-start gap-3'
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" strokeWidth={1.75} />
            {!sidebarCollapsed && <span>Sair</span>}
          </Button>
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-700 bg-slate-800/95 backdrop-blur-sm px-4 lg:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex text-slate-400 hover:text-white hover:bg-slate-700"
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
              {title && <h1 className="text-lg font-semibold text-white truncate">{title}</h1>}
              {description && <p className="text-sm text-slate-400">{description}</p>}
            </div>
          )}

          {/* Header actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.75} />
              <Input
                placeholder="Buscar usuários, orgs..."
                className="w-64 pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative h-10 w-10 text-slate-400 hover:text-white hover:bg-slate-700">
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            </Button>

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
