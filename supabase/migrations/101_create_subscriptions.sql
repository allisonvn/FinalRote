-- =====================================================
-- Migration: Create Subscriptions Table
-- Description: Assinaturas dos usuários
-- Version: 1.0.0
-- Date: 2025-11-19
-- =====================================================

-- Drop existing table if exists (development only)
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,

  -- Kiwify integration
  kiwify_subscription_id text UNIQUE,
  kiwify_customer_id text,
  kiwify_order_id text,

  -- Status
  -- active: assinatura ativa e paga
  -- trialing: período de teste
  -- past_due: pagamento atrasado (grace period)
  -- canceled: cancelada mas ainda com acesso até o fim do período
  -- unpaid: bloqueada por falta de pagamento
  -- paused: pausada temporariamente
  status text NOT NULL DEFAULT 'trialing' CHECK (status IN (
    'active',
    'trialing',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
  )),

  -- Billing cycle
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),

  -- Dates
  trial_ends_at timestamptz,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,

  -- Cancellation
  cancel_at_period_end boolean DEFAULT false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  cancel_reason text,

  -- Payment tracking
  last_payment_at timestamptz,
  next_payment_at timestamptz,
  payment_failed_count integer DEFAULT 0,

  -- Pricing (armazenar o preço no momento da assinatura)
  price_amount decimal(10,2),
  currency text DEFAULT 'BRL',

  -- Metadata adicional
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_active_subscription_per_user UNIQUE (user_id, status) WHERE status IN ('active', 'trialing')
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_kiwify_subscription_id ON public.subscriptions(kiwify_subscription_id);
CREATE INDEX idx_subscriptions_kiwify_customer_id ON public.subscriptions(kiwify_customer_id);
CREATE INDEX idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_next_payment_at ON public.subscriptions(next_payment_at);
CREATE INDEX idx_subscriptions_created_at ON public.subscriptions(created_at DESC);

-- Partial indexes for active/expiring subscriptions
CREATE INDEX idx_subscriptions_active ON public.subscriptions(user_id, status) WHERE status = 'active';
CREATE INDEX idx_subscriptions_expiring_soon ON public.subscriptions(current_period_end) WHERE status IN ('active', 'trialing') AND current_period_end < now() + interval '7 days';

-- Comments
COMMENT ON TABLE public.subscriptions IS 'Assinaturas dos usuários';
COMMENT ON COLUMN public.subscriptions.status IS 'Status da assinatura: active, trialing, past_due, canceled, unpaid, paused';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'Se true, a assinatura será cancelada no fim do período atual';
COMMENT ON COLUMN public.subscriptions.payment_failed_count IS 'Contador de tentativas de pagamento falhadas';
COMMENT ON COLUMN public.subscriptions.metadata IS 'Dados adicionais em formato JSON';

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Usuários podem ver suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Apenas sistema/admin pode inserir assinaturas
-- (será refinada após criar users_extra com role de admin)

-- Usuários podem atualizar alguns campos (cancel_at_period_end, etc.)
CREATE POLICY "Users can update own subscription preferences"
  ON public.subscriptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Get active subscription for user
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid uuid)
RETURNS TABLE (
  subscription_id uuid,
  plan_name text,
  plan_slug text,
  status text,
  current_period_end timestamptz,
  features jsonb,
  limits jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as subscription_id,
    p.name as plan_name,
    p.slug as plan_slug,
    s.status,
    s.current_period_end,
    p.features,
    p.limits
  FROM public.subscriptions s
  JOIN public.plans p ON s.plan_id = p.id
  WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if subscription is active
CREATE OR REPLACE FUNCTION is_subscription_active(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = user_uuid
      AND status IN ('active', 'trialing')
      AND current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user has access to feature
CREATE OR REPLACE FUNCTION has_feature_access(user_uuid uuid, feature_key text)
RETURNS boolean AS $$
DECLARE
  has_access boolean;
BEGIN
  SELECT (p.features->feature_key)::boolean INTO has_access
  FROM public.subscriptions s
  JOIN public.plans p ON s.plan_id = p.id
  WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing')
    AND s.current_period_end > now()
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN COALESCE(has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get usage limit for user
CREATE OR REPLACE FUNCTION get_usage_limit(user_uuid uuid, limit_key text)
RETURNS integer AS $$
DECLARE
  limit_value integer;
BEGIN
  SELECT (p.limits->limit_key)::integer INTO limit_value
  FROM public.subscriptions s
  JOIN public.plans p ON s.plan_id = p.id
  WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing')
    AND s.current_period_end > now()
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- -1 significa ilimitado
  RETURN COALESCE(limit_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get subscriptions expiring soon (for cron job)
CREATE OR REPLACE FUNCTION get_expiring_subscriptions(days_ahead integer DEFAULT 7)
RETURNS TABLE (
  subscription_id uuid,
  user_id uuid,
  user_email text,
  plan_name text,
  current_period_end timestamptz,
  days_until_expiration integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as subscription_id,
    s.user_id,
    u.email as user_email,
    p.name as plan_name,
    s.current_period_end,
    EXTRACT(DAY FROM (s.current_period_end - now()))::integer as days_until_expiration
  FROM public.subscriptions s
  JOIN auth.users u ON s.user_id = u.id
  JOIN public.plans p ON s.plan_id = p.id
  WHERE s.status IN ('active', 'trialing')
    AND s.current_period_end > now()
    AND s.current_period_end < now() + (days_ahead || ' days')::interval
  ORDER BY s.current_period_end ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get overdue subscriptions (for cron job)
CREATE OR REPLACE FUNCTION get_overdue_subscriptions(grace_days integer DEFAULT 7)
RETURNS TABLE (
  subscription_id uuid,
  user_id uuid,
  user_email text,
  plan_name text,
  current_period_end timestamptz,
  days_overdue integer,
  payment_failed_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as subscription_id,
    s.user_id,
    u.email as user_email,
    p.name as plan_name,
    s.current_period_end,
    EXTRACT(DAY FROM (now() - s.current_period_end))::integer as days_overdue,
    s.payment_failed_count
  FROM public.subscriptions s
  JOIN auth.users u ON s.user_id = u.id
  JOIN public.plans p ON s.plan_id = p.id
  WHERE s.status = 'past_due'
    AND s.current_period_end < now() - (grace_days || ' days')::interval
  ORDER BY s.current_period_end ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 101_create_subscriptions.sql completed successfully';
  RAISE NOTICE 'Created table: subscriptions';
  RAISE NOTICE 'Created helper functions for subscription management';
END $$;
