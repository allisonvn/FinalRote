'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-4">Oops! Algo deu errado</h1>

        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Ocorreu um erro inesperado. Você pode tentar recarregar a página ou voltar ao início.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-6 p-4 bg-muted rounded-lg">
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
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>

          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Recarregar página
          </Button>

          <Button variant="outline" onClick={() => window.location.href = '/'} className="gap-2">
            <Home className="h-4 w-4" />
            Voltar ao início
          </Button>
        </div>
      </Card>
    </div>
  )
}
