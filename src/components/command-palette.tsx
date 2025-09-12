'use client'

import { useEffect, useMemo } from 'react'
import { Search, Plus, Target, BarChart3, Settings } from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const actions = useMemo(
    () => [
      { icon: <Plus className="w-4 h-4" />, label: 'Novo Experimento', href: '#' },
      { icon: <Target className="w-4 h-4" />, label: 'Novo Projeto', href: '#' },
      { icon: <BarChart3 className="w-4 h-4" />, label: 'Ver Relatórios', href: '#' },
      { icon: <Settings className="w-4 h-4" />, label: 'Configurações', href: '#' },
    ],
    []
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-auto mt-24 w-full max-w-xl rounded-2xl border bg-white/90 dark:bg-black/40 backdrop-blur shadow-lg">
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Busque ações… (⌘K)"
            className="w-full bg-transparent outline-none text-sm py-2"
          />
        </div>
        <div className="p-2">
          {actions.map((a, idx) => (
            <a
              key={idx}
              href={a.href}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={onClose}
            >
              <span className="text-muted-foreground">{a.icon}</span>
              <span>{a.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

