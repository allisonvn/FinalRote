import { useState, useCallback, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type Toast = {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

type ToastOptions = Omit<Toast, 'id'> & {
  duration?: number
}

let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((options: ToastOptions) => {
    const id = `toast-${++toastCounter}`
    const duration = options.duration ?? (options.type === 'error' ? 6000 : 4000)

    const toast: Toast = {
      id,
      duration,
      ...options
    }

    setToasts(prev => [...prev, toast])

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const removeAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const success = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => {
    return addToast({
      type: 'success',
      title,
      description,
      ...options
    })
  }, [addToast])

  const error = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => {
    return addToast({
      type: 'error',
      title,
      description,
      duration: 6000, // Errors stay longer
      ...options
    })
  }, [addToast])

  const warning = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => {
    return addToast({
      type: 'warning',
      title,
      description,
      ...options
    })
  }, [addToast])

  const info = useCallback((title: string, description?: string, options?: Partial<ToastOptions>) => {
    return addToast({
      type: 'info',
      title,
      description,
      ...options
    })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info
  }
}

// Global toast manager
class ToastManager {
  private listeners: ((toasts: Toast[]) => void)[] = []
  private toasts: Toast[] = []

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  getToasts() {
    return this.toasts
  }

  addToast(options: ToastOptions) {
    const id = `toast-${++toastCounter}`
    const duration = options.duration ?? (options.type === 'error' ? 6000 : 4000)

    const toast: Toast = {
      id,
      duration,
      ...options
    }

    this.toasts = [...this.toasts, toast]
    this.notify()

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id)
      }, duration)
    }

    return id
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notify()
  }

  removeAllToasts() {
    this.toasts = []
    this.notify()
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.toasts))
  }
}

export const toastManager = new ToastManager()

// Global toast functions
export const toast = {
  success: (title: string, description?: string, options?: Partial<ToastOptions>) =>
    toastManager.addToast({ type: 'success', title, description, ...options }),

  error: (title: string, description?: string, options?: Partial<ToastOptions>) =>
    toastManager.addToast({ type: 'error', title, description, duration: 6000, ...options }),

  warning: (title: string, description?: string, options?: Partial<ToastOptions>) =>
    toastManager.addToast({ type: 'warning', title, description, ...options }),

  info: (title: string, description?: string, options?: Partial<ToastOptions>) =>
    toastManager.addToast({ type: 'info', title, description, ...options }),

  remove: (id: string) => toastManager.removeToast(id),
  removeAll: () => toastManager.removeAllToasts()
}