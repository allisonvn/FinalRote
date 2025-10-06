'use client'

import { ReactNode, useEffect, useState } from 'react'
import { AppProvider } from '@/providers/app-provider'
import { ToastContainer } from '@/components/ui/toast'
import { setupGlobalErrorHandlers } from '@/lib/error-handler'

interface ClientWrapperProps {
  children: ReactNode
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Setup global error handlers
    setupGlobalErrorHandlers()
  }, [])

  // Renderizar sempre o conteúdo, mas com providers apenas após montagem
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    )
  }

  return (
    <AppProvider>
      {children}
      <ToastContainer />
    </AppProvider>
  )
}
