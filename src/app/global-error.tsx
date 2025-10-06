'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logError, isChunkLoadError, handleChunkLoadError } from '@/lib/error-handler'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error using our error handler
    logError(error, {
      errorBoundary: 'global-error',
    })

    // Handle chunk load errors specifically
    if (isChunkLoadError(error)) {
      handleChunkLoadError(error)
    }
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="w-full max-w-2xl p-8 text-center bg-white rounded-lg shadow-lg">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-red-100 p-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-4 text-gray-900">Erro Crítico</h1>

            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Ocorreu um erro crítico no sistema. Por favor, tente recarregar a página ou entre em contato com o suporte.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="text-left mb-6 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer font-medium mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="text-sm font-mono whitespace-pre-wrap">
                  <strong>Error:</strong> {error.message}
                  {error.digest && (
                    <>
                      <br />
                      <strong>Digest:</strong> {error.digest}
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>

              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar página
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Home className="h-4 w-4" />
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
