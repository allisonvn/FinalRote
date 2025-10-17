'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  retryCount: number
}

export class ChunkErrorBoundary extends Component<Props, State> {
  private maxRetries = 3
  private retryDelay = 2000

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Verificar se é um ChunkLoadError
    const isChunkError = error.name === 'ChunkLoadError' || 
                        error.message.includes('Loading chunk') ||
                        error.message.includes('ChunkLoadError')

    return {
      hasError: isChunkError,
      error: isChunkError ? error : undefined,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ChunkErrorBoundary capturou um erro:', error, errorInfo)
    
    // Só processar se for um ChunkLoadError
    const isChunkError = error.name === 'ChunkLoadError' || 
                        error.message.includes('Loading chunk') ||
                        error.message.includes('ChunkLoadError')

    if (isChunkError) {
      // Log interno do erro
      console.error('ChunkError capturado no layout:', error, errorInfo)
      
      // Chamar callback se fornecido
      this.props.onError?.(error, errorInfo)
      
      this.handleChunkError()
    }
  }

  private handleChunkError = () => {
    const { retryCount } = this.state
    
    if (retryCount < this.maxRetries) {
      console.log(`Tentativa ${retryCount + 1} de ${this.maxRetries} para resolver ChunkLoadError`)
      
      setTimeout(() => {
        this.setState(prevState => ({
          retryCount: prevState.retryCount + 1,
          hasError: false,
          error: undefined
        }))
      }, this.retryDelay * (retryCount + 1))
    } else {
      console.error('Máximo de tentativas atingido. Recarregando página...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: 0
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Erro de Carregamento
            </h3>
            
            <p className="text-sm text-gray-500 mb-4">
              Ocorreu um problema ao carregar parte da aplicação. 
              {this.state.retryCount < this.maxRetries ? (
                <>
                  <br />
                  Tentativa {this.state.retryCount + 1} de {this.maxRetries}...
                </>
              ) : (
                <>
                  <br />
                  Recarregando a página automaticamente...
                </>
              )}
            </p>

            <div className="flex space-x-3 justify-center">
              <button
                onClick={this.handleRetry}
                disabled={this.state.retryCount >= this.maxRetries}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tentar Novamente
              </button>
              
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700"
              >
                Recarregar Página
              </button>
            </div>

            {this.state.retryCount < this.maxRetries && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${((this.state.retryCount + 1) / this.maxRetries) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Aguardando próxima tentativa...
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
