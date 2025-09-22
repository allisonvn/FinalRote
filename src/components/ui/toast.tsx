'use client'

import { useEffect, useState } from 'react'
import { Check, X, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toastManager } from '@/hooks/useToast'

type Toast = {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

const toastIcons = {
  success: Check,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const toastStyles = {
  success: 'bg-success/10 border-success/20 text-success-foreground',
  error: 'bg-danger/10 border-danger/20 text-danger-foreground',
  warning: 'bg-warning/10 border-warning/20 text-warning-foreground',
  info: 'bg-info/10 border-info/20 text-info-foreground'
}

export function Toast({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const Icon = toastIcons[toast.type]

  useEffect(() => {
    // Trigger animation
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
  }, [])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 200)
  }

  return (
    <div
      className={cn(
        'relative flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-200 ease-out',
        toastStyles[toast.type],
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0',
        isLeaving && 'translate-x-full opacity-0'
      )}
    >
      <div className="flex-shrink-0">
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-semibold">{toast.title}</h4>
        {toast.description && (
          <p className="text-sm opacity-90">{toast.description}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="text-sm font-medium underline underline-offset-2 hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleRemove}
        className="flex-shrink-0 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts)
    setToasts(toastManager.getToasts())
    return unsubscribe
  }, [])

  const removeToast = (id: string) => {
    toastManager.removeToast(id)
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}