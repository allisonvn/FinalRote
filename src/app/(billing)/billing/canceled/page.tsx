'use client'

import Link from 'next/link'

export default function BillingCanceledPage() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gray-500/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-white mb-3">Assinatura cancelada</h1>
        <p className="text-gray-400 mb-8">
          Sua assinatura foi cancelada. Voce ainda pode acessar seus dados, mas nao pode criar novos experimentos.
        </p>

        {/* Info Box */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-6 text-left">
          <h3 className="text-white font-medium mb-2">Seus dados estao seguros</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• Todos os seus experimentos e dados foram preservados</li>
            <li>• Voce pode exportar seus dados a qualquer momento</li>
            <li>• Reative sua assinatura para continuar usando</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Reativar assinatura
          </Link>

          <Link
            href="/billing"
            className="block w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Ver detalhes do faturamento
          </Link>

          <a
            href="mailto:suporte@rotafinal.com.br?subject=Feedback%20-%20Cancelamento"
            className="block text-gray-400 hover:text-white text-sm transition-colors mt-4"
          >
            Conte-nos por que voce cancelou (feedback)
          </a>
        </div>
      </div>
    </div>
  )
}
