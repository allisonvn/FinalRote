'use client'

import Link from 'next/link'

export default function BillingUnpaidPage() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-2xl font-bold text-white mb-3">Pagamento pendente</h1>
        <p className="text-gray-400 mb-8">
          Identificamos que seu ultimo pagamento nao foi processado. Atualize seu metodo de pagamento para continuar usando o servico.
        </p>

        {/* Warning Box */}
        <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/30 mb-6 text-left">
          <h3 className="text-red-400 font-medium mb-2">Atencao</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>• Seu acesso esta temporariamente limitado</li>
            <li>• Novos experimentos nao podem ser criados</li>
            <li>• O tracking existente pode ser interrompido em breve</li>
            <li>• Regularize para evitar perda de dados</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href="https://kiwify.com.br" // Link para area do cliente Kiwify
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Atualizar pagamento agora
          </a>

          <Link
            href="/billing"
            className="block w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            Ver detalhes do faturamento
          </Link>

          <a
            href="mailto:suporte@rotafinal.com.br?subject=Problema%20com%20pagamento"
            className="block text-gray-400 hover:text-white text-sm transition-colors mt-4"
          >
            Preciso de ajuda com o pagamento
          </a>
        </div>
      </div>
    </div>
  )
}
