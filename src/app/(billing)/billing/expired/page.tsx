'use client'

import Link from 'next/link'

export default function BillingExpiredPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-white mb-3">Assinatura expirada</h1>
        <p className="text-gray-400 mb-8">
          O periodo da sua assinatura chegou ao fim. Renove agora para continuar usando todos os recursos do Rota Final.
        </p>

        {/* Info Box */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-6 text-left">
          <h3 className="text-white font-medium mb-2">Nao perca seus dados</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• Seus experimentos e historico estao preservados por 30 dias</li>
            <li>• O tracking sera pausado ate a renovacao</li>
            <li>• Renove agora e retome de onde parou</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Renovar assinatura
          </Link>

          <a
            href="https://kiwify.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Acessar area do cliente
          </a>

          <a
            href="mailto:suporte@rotafinal.com.br"
            className="block text-gray-400 hover:text-white text-sm transition-colors mt-4"
          >
            Preciso de ajuda
          </a>
        </div>
      </div>
    </div>
  )
}
