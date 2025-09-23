'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Settings, User, LogOut, Plus, Menu, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  user?: any
  onSignOut?: () => void
  onNewExperiment?: () => void
  query?: string
  onQueryChange?: (query: string) => void
  className?: string
}

export function DashboardHeader({
  user,
  onSignOut,
  onNewExperiment,
  query = '',
  onQueryChange,
  className
}: DashboardHeaderProps) {
  const router = useRouter()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
      className
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <span className="text-white font-bold text-sm">RF</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Rota Final
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">A/B Testing Platform</p>
              </div>
            </div>
          </div>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
              <Input
                placeholder="Buscar experimentos, projetos..."
                value={query}
                onChange={(e) => onQueryChange?.(e.target.value)}
                className="pl-10 bg-muted/30 border-border/50 focus:bg-background"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Actions - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                onClick={onNewExperiment}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-medium"
              >
                <Plus className="h-4 w-4 mr-2" strokeWidth={1.75} />
                Novo Experimento
              </Button>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-danger text-danger-foreground">
                3
              </Badge>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-56 rounded-lg border bg-popover/95 backdrop-blur-sm shadow-large py-2 z-50">
                  <div className="px-4 py-2 border-b border-border/50">
                    <p className="text-sm font-medium">{user?.email || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">Administrador</p>
                  </div>
                  
                  <div className="py-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors">
                      <User className="h-4 w-4" strokeWidth={1.75} />
                      Perfil
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors">
                      <Settings className="h-4 w-4" strokeWidth={1.75} />
                      Configurações
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => router.push('/settings')}
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                      Abrir Configurações
                    </button>
                  </div>
                  
                  <div className="border-t border-border/50 pt-2">
                    <button
                      onClick={onSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.75} />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-border/50 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar experimentos..."
                value={query}
                onChange={(e) => onQueryChange?.(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Mobile Actions */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={onNewExperiment}
                className="bg-gradient-primary text-primary-foreground justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Experimento
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showMobileMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false)
            setShowMobileMenu(false)
          }}
        />
      )}
    </header>
  )
}
