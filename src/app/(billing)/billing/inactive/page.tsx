'use client'

import Link from 'next/link'

export default function BillingInactivePage() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-white mb-3">Organizacao inativa</h1>
        <p className="text-gray-400 mb-8">
          Sua organizacao esta temporariamente inativa. Isso pode ocorrer apos o periodo de teste
          ou quando uma assinatura nao foi configurada.
        </p>

        {/* Info Box */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mb-6 text-left">
          <h3 className="text-white font-medium mb-2">O que isso significa?</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• Seus dados estao seguros e preservados</li>
            <li>• Voce nao pode criar novos experimentos</li>
            <li>• O tracking existente continua funcionando</li>
            <li>• Ative uma assinatura para restaurar o acesso completo</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Ver planos e ativar
          </Link>

          <a
            href="mailto:suporte@rotafinal.com.br"
            className="block w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Contatar suporte
          </a>

          <Link
            href="/"
            className="block text-gray-400 hover:text-white text-sm transition-colors mt-4"
          >
            Voltar para a pagina inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
