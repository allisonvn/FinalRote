'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Send error to monitoring service (e.g., Sentry)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error, { extra: errorInfo })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-danger/10 p-4">
                <AlertTriangle className="h-12 w-12 text-danger" />
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-4">Oops! Algo deu errado</h1>

            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Ocorreu um erro inesperado. Você pode tentar recarregar a página ou voltar ao início.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6 p-4 bg-muted rounded-lg">
                <summary className="cursor-pointer font-medium mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="text-sm font-mono whitespace-pre-wrap">
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      <br />
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>

              <Button variant="outline" onClick={this.handleReload} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Recarregar página
              </Button>

              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <Home className="h-4 w-4" />
                Ir ao início
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Se o problema persistir, entre em contato com o suporte.
              </p>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para capturar erros em componentes funcionais
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Unhandled error:', error, errorInfo)

    // Send to monitoring service
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // window.Sentry?.captureException(error, { extra: errorInfo })
    }
  }
}

// Componente de erro para páginas específicas
interface PageErrorProps {
  error?: Error | string
  reset?: () => void
  title?: string
  description?: string
  showDetails?: boolean
}

export function PageError({
  error,
  reset,
  title = 'Erro na página',
  description = 'Ocorreu um erro ao carregar esta página.',
  showDetails = false
}: PageErrorProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="rounded-full bg-danger/10 p-4 mb-6">
        <AlertTriangle className="h-12 w-12 text-danger" />
      </div>

      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>

      {showDetails && errorMessage && (
        <details className="mb-6 p-4 bg-muted rounded-lg max-w-xl w-full">
          <summary className="cursor-pointer font-medium mb-2">
            Detalhes do erro
          </summary>
          <p className="text-sm text-left font-mono">{errorMessage}</p>
        </details>
      )}

      <div className="flex gap-3">
        {reset && (
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        )}

        <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Recarregar página
        </Button>
      </div>
    </div>
  )
}

// Componente de erro para quando não há dados
export function EmptyState({
  icon: Icon = FileText,
  title = 'Nenhum dado encontrado',
  description = 'Não há informações para exibir no momento.',
  action
}: {
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{description}</p>

      {action}
    </div>
  )
}