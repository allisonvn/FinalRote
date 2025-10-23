import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { ClientWrapper } from '@/components/client-wrapper'
import { ChunkErrorBoundary } from '@/components/ChunkErrorBoundary'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rota Final - Teste A/B com Multi-Armed Bandit',
  description: 'Plataforma profissional de teste A/B que otimiza automaticamente suas conversões',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`} suppressHydrationWarning>
        {/* Script para interceptar ChunkLoadError */}
        <Script
          id="robust-chunk-error-handler"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                console.log('Robust ChunkErrorHandler inicializado');
                
                // Interceptar erros globais
                const handleGlobalError = (event) => {
                  const error = event.error;
                  if (error && (
                    error.name === 'ChunkLoadError' ||
                    error.message?.includes('Loading chunk') ||
                    error.message?.includes('ChunkLoadError') ||
                    error.message?.includes('ERR_ABORTED') ||
                    error.message?.includes('net::ERR_ABORTED') ||
                    error.message?.includes('404 (Not Found)')
                  )) {
                    console.warn('ChunkLoadError detectado globalmente:', error);
                    
                    // Recarregar página imediatamente para chunks 404
                    if (error.message?.includes('404 (Not Found)') || error.message?.includes('ERR_ABORTED')) {
                      console.log('Chunk 404 detectado, recarregando página...');
                      setTimeout(() => {
                        window.location.reload();
                      }, 500);
                      return;
                    }
                    
                    // Para outros tipos de ChunkLoadError, tentar recarregar após delay
                    setTimeout(() => {
                      console.log('Recarregando página devido a ChunkLoadError...');
                      window.location.reload();
                    }, 2000);
                  }
                };

                // Interceptar rejeições de promise não tratadas
                const handleUnhandledRejection = (event) => {
                  const error = event.reason;
                  if (error && (
                    error.name === 'ChunkLoadError' ||
                    error.message?.includes('Loading chunk') ||
                    error.message?.includes('ChunkLoadError') ||
                    error.message?.includes('ERR_ABORTED') ||
                    error.message?.includes('net::ERR_ABORTED') ||
                    error.message?.includes('404 (Not Found)')
                  )) {
                    console.warn('ChunkLoadError detectado em promise rejeitada:', error);
                    
                    // Recarregar página imediatamente para chunks 404
                    if (error.message?.includes('404 (Not Found)') || error.message?.includes('ERR_ABORTED')) {
                      console.log('Chunk 404 detectado em promise, recarregando página...');
                      setTimeout(() => {
                        window.location.reload();
                      }, 500);
                      return;
                    }
                    
                    // Para outros tipos de ChunkLoadError, tentar recarregar após delay
                    setTimeout(() => {
                      console.log('Recarregando página devido a ChunkLoadError em promise...');
                      window.location.reload();
                    }, 2000);
                  }
                };

                // Interceptar fetch para chunks específicos
                const originalFetch = window.fetch;
                window.fetch = async (input, init) => {
                  try {
                    const response = await originalFetch(input, init);
                    
                    // Verificar se é uma requisição para chunks do Next.js que falhou
                    const url = typeof input === 'string' ? input : input.toString();
                    if (url.includes('/_next/static/chunks/') && !response.ok) {
                      console.warn('Chunk 404 detectado:', url, 'Status:', response.status);
                      
                      // Recarregar página imediatamente para chunks 404
                      setTimeout(() => {
                        console.log('Recarregando página devido a chunk 404...');
                        window.location.reload();
                      }, 500);
                    }
                    
                    return response;
                  } catch (error) {
                    // Verificar se é um erro de chunk loading
                    if (error && (
                      error.name === 'ChunkLoadError' ||
                      error.message?.includes('Loading chunk') ||
                      error.message?.includes('ChunkLoadError') ||
                      error.message?.includes('ERR_ABORTED') ||
                      error.message?.includes('net::ERR_ABORTED')
                    )) {
                      console.warn('ChunkLoadError em fetch:', error);
                      
                      // Recarregar página após delay
                      setTimeout(() => {
                        console.log('Recarregando página devido a ChunkLoadError em fetch...');
                        window.location.reload();
                      }, 1000);
                    }
                    
                    throw error;
                  }
                };

                // Interceptar webpack require
                const originalWebpackRequire = window.__webpack_require__;
                if (originalWebpackRequire) {
                  window.__webpack_require__ = (id) => {
                    try {
                      return originalWebpackRequire(id);
                    } catch (error) {
                      // Verificar se é um erro de chunk loading
                      if (error && (
                        error.name === 'ChunkLoadError' ||
                        error.message?.includes('Loading chunk') ||
                        error.message?.includes('ChunkLoadError') ||
                        error.message?.includes('ERR_ABORTED') ||
                        error.message?.includes('net::ERR_ABORTED')
                      )) {
                        console.warn('ChunkLoadError em webpack require:', error);
                        
                        // Recarregar página após delay
                        setTimeout(() => {
                          console.log('Recarregando página devido a ChunkLoadError em webpack...');
                          window.location.reload();
                        }, 1000);
                      }
                      throw error;
                    }
                  };
                }

                // Adicionar listeners
                window.addEventListener('error', handleGlobalError);
                window.addEventListener('unhandledrejection', handleUnhandledRejection);

                // Cleanup quando a página for descarregada
                window.addEventListener('beforeunload', () => {
                  window.removeEventListener('error', handleGlobalError);
                  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
                });
              })();
            `
          }}
        />
        
        <ChunkErrorBoundary>
          <ClientWrapper>
            {/* Background layers */}
            <div className="fixed inset-0 -z-10">
              <div className="absolute inset-0 bg-grid-slate [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
              <div className="spotlight left-[-10%] top-[-10%]" />
              <div className="spotlight right-[-15%] bottom-[-20%]" />
            </div>

            {children}

            {/* Global UI helpers */}
            <Toaster richColors position="top-right" />
          </ClientWrapper>
        </ChunkErrorBoundary>
      </body>
    </html>
  )
}
