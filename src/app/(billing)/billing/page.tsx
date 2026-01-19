'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner'

interface SubscriptionInfo {
  planName: string
  status: string
  periodEnd: string | null
  price: number | null
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSubscription() {
      const supabase = createClient()

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userData } = await supabase
          .from('users')
          .select('default_org_id')
          .eq('id', user.id)
          .single()

        if (!userData?.default_org_id) return

        const { data: org } = await supabase
          .from('organizations')
          .select('plan_slug, subscription_status, subscription_end')
          .eq('id', userData.default_org_id)
          .single()

        if (org) {
          setSubscription({
            planName: org.plan_slug || 'Trial',
            status: org.subscription_status || 'unknown',
            periodEnd: org.subscription_end,
            price: null
          })
        }
      } catch (err) {
        console.error('Erro ao carregar subscription:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSubscription()
  }, [])

  const defaultStatus = { label: 'Desconhecido', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' }

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: 'Ativa', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
    trialing: { label: 'Periodo de teste', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    past_due: { label: 'Pagamento pendente', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    canceled: { label: 'Cancelada', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
    unpaid: { label: 'Nao paga', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
    unknown: defaultStatus
  }

  const statusInfo = statusLabels[subscription?.status || 'unknown'] ?? defaultStatus

  return (
    <div className="w-full">
      <SubscriptionBanner />
      <div className="max-w-2xl mx-auto pt-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
            ← Voltar ao dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Faturamento</h1>
          <p className="text-gray-400 mt-2">Gerencie sua assinatura e pagamentos</p>
        </div>

        {loading ? (
          <div className="bg-gray-800/50 rounded-xl p-8 text-center">
            <p className="text-gray-400">Carregando...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">Plano atual</h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white capitalize">
                    {subscription?.planName || 'Sem plano'}
                  </p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm border ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {subscription?.periodEnd && (
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Proximo vencimento</p>
                    <p className="text-white font-medium">
                      {new Date(subscription.periodEnd).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">Acoes</h2>

              <div className="space-y-3">
                <a
                  href="https://kiwify.com.br" // Link para area do cliente Kiwify
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-center"
                >
                  Gerenciar assinatura
                </a>

                <Link
                  href="/pricing"
                  className="block w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors text-center"
                >
                  Ver planos disponiveis
                </Link>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h2 className="text-lg font-semibold text-white mb-2">Precisa de ajuda?</h2>
              <p className="text-gray-400 text-sm mb-4">
                Entre em contato com nosso suporte para duvidas sobre faturamento.
              </p>
              <a
                href="mailto:suporte@rotafinal.com.br"
                className="text-indigo-400 hover:text-indigo-300 text-sm"
              >
                suporte@rotafinal.com.br
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
