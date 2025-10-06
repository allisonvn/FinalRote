import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { ClientWrapper } from '@/components/client-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rota Final - Teste A/B com Multi-Armed Bandit',
  description: 'Plataforma profissional de teste A/B que otimiza automaticamente suas conversões',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`} suppressHydrationWarning>
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
      </body>
    </html>
  )
}
