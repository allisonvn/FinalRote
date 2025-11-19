'use client';

/**
 * Subscription Banner Component
 * @description Banner para mostrar avisos de subscription (expirando, trial, bloqueada, etc)
 */

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, XCircle } from 'lucide-react';

interface SubscriptionStatus {
  status: string;
  subscription_end: string | null;
  plan_slug: string;
  is_blocked: boolean;
  blocked_reason: string | null;
}

export function SubscriptionBanner() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  async function fetchSubscriptionStatus() {
    try {
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !subscription) {
    return null;
  }

  // Não mostrar banner se tudo estiver ok
  if (
    subscription.status === 'active' &&
    !subscription.is_blocked &&
    subscription.plan_slug !== 'trial'
  ) {
    return null;
  }

  // Calcular dias até expiração
  const daysUntilExpiration = subscription.subscription_end
    ? Math.floor(
        (new Date(subscription.subscription_end).getTime() - Date.now()) /
          (24 * 60 * 60 * 1000)
      )
    : null;

  // Banner de trial
  if (subscription.plan_slug === 'trial' && subscription.status === 'trialing') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-400 mr-3" />
          <div className="flex-1">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Período de teste</span>
              {daysUntilExpiration !== null &&
                ` - ${daysUntilExpiration} dias restantes`}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Faça upgrade para continuar usando após o período de teste.
            </p>
          </div>
          <a
            href="/billing"
            className="ml-3 text-sm font-medium text-blue-700 hover:text-blue-600"
          >
            Ver Planos →
          </a>
        </div>
      </div>
    );
  }

  // Banner de expirando em breve
  if (
    daysUntilExpiration !== null &&
    daysUntilExpiration > 0 &&
    daysUntilExpiration <= 3
  ) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
          <div className="flex-1">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Assinatura expirando</span>
              {` - ${daysUntilExpiration} ${daysUntilExpiration === 1 ? 'dia' : 'dias'} restantes`}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Atualize seu método de pagamento para evitar interrupções.
            </p>
          </div>
          <a
            href="/billing"
            className="ml-3 text-sm font-medium text-yellow-700 hover:text-yellow-600"
          >
            Atualizar →
          </a>
        </div>
      </div>
    );
  }

  // Banner de pagamento atrasado
  if (subscription.status === 'past_due') {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-400 mr-3" />
          <div className="flex-1">
            <p className="text-sm text-red-700">
              <span className="font-medium">Pagamento em atraso</span>
            </p>
            <p className="text-xs text-red-600 mt-1">
              Atualize seu pagamento para evitar o bloqueio da conta.
            </p>
          </div>
          <a
            href="/billing"
            className="ml-3 text-sm font-medium text-red-700 hover:text-red-600"
          >
            Regularizar →
          </a>
        </div>
      </div>
    );
  }

  return null;
}
