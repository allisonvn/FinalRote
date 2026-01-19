'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function BlockedContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason') || 'unknown'

  const reasonMessages = {
    payment_overdue: {
      title: 'Pagamento em atraso',
      description: 'Sua conta foi bloqueada devido a pagamentos pendentes. Regularize sua situacao para continuar usando o servico.'
    },
    chargeback: {
      title: 'Chargeback detectado',
      description: 'Detectamos uma contestacao de pagamento em sua conta. Entre em contato com nosso suporte para resolver.'
    },
    terms_violation: {
      title: 'Violacao de termos',
      description: 'Sua conta foi suspensa por violacao dos termos de uso. Entre em contato com o suporte para mais informacoes.'
    },
    unknown: {
      title: 'Conta bloqueada',
      description: 'Sua conta foi temporariamente bloqueada. Entre em contato com nosso suporte para mais informacoes.'
    }
  } as const

  const info = reasonMessages[reason as keyof typeof reasonMessages] || reasonMessages.unknown
  const { title, description } = info

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4m8 0H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2h-3" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
        <p className="text-gray-400 mb-8">{description}</p>

        {/* Actions */}
        <div className="space-y-3">
          {reason === 'payment_overdue' && (
            <Link
              href="/billing"
              className="block w-full text-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Regularizar pagamento
            </Link>
          )}

          <a
            href="mailto:suporte@rotafinal.com.br?subject=Conta%20bloqueada"
            className="block w-full text-center py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Contatar suporte
          </a>

          <Link
            href="/auth/signin"
            className="block text-gray-400 hover:text-white text-sm transition-colors"
          >
            Fazer login com outra conta
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BlockedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    }>
      <BlockedContent />
    </Suspense>
  )
}
