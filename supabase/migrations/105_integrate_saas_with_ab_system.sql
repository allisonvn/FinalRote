-- =====================================================
-- Migration: Integrar Sistema de Assinaturas SaaS
-- Description: Integra plans/subscriptions com organizations existentes
-- Version: 2.0.0 (integrado)
-- Date: 2025-11-19
-- =====================================================

-- =====================================================
-- 1. ATUALIZAR TABELA ORGANIZATIONS
-- =====================================================

-- Adicionar campos de subscription à tabela organizations existente
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subscription_id uuid,
  ADD COLUMN IF NOT EXISTS plan_slug text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trialing'
    CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'paused')),
  ADD COLUMN IF NOT EXISTS subscription_start timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_end timestamptz,
  ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

-- Índices para subscription
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_id ON public.organizations(subscription_id);
CREATE INDEX IF NOT EXISTS idx_organizations_plan_slug ON public.organizations(plan_slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON public.organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_is_blocked ON public.organizations(is_blocked);

COMMENT ON COLUMN public.organizations.subscription_id IS 'Referência para a tabela subscriptions';
COMMENT ON COLUMN public.organizations.plan_slug IS 'Slug do plano atual (trial, starter, pro, enterprise)';
COMMENT ON COLUMN public.organizations.subscription_status IS 'Status da assinatura';
COMMENT ON COLUMN public.organizations.is_blocked IS 'Se a organização está bloqueada por inadimplência';

-- =====================================================
-- 2. CRIAR TABELA DE USAGE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organization_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Período de medição
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,

  -- Contadores de uso
  experiments_count integer DEFAULT 0,
  active_experiments_count integer DEFAULT 0,
  projects_count integer DEFAULT 0,
  visitors_count integer DEFAULT 0,
  events_count integer DEFAULT 0,

  -- Dados adicionais
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(org_id, period_start)
);

CREATE INDEX idx_organization_usage_org_id ON public.organization_usage(org_id);
CREATE INDEX idx_organization_usage_period ON public.organization_usage(period_start, period_end);

COMMENT ON TABLE public.organization_usage IS 'Tracking de uso de recursos por organização';

-- =====================================================
-- 3. ATUALIZAR TABELA SUBSCRIPTIONS
-- =====================================================

-- Modificar subscriptions para referenciar organizations ao invés de users
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey,
  DROP CONSTRAINT IF EXISTS unique_active_subscription_per_user;

-- Adicionar coluna org_id se não existir
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Manter user_id para saber quem criou, mas org_id é a referência principal
-- Criar constraint de unicidade por organização
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS unique_active_subscription_per_org;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT unique_active_subscription_per_org
  UNIQUE (org_id, status)
  WHERE status IN ('active', 'trialing');

-- Adicionar índice
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(org_id);

-- Adicionar FK de volta para organizations
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_subscription_fk,
  ADD CONSTRAINT organizations_subscription_fk
    FOREIGN KEY (subscription_id)
    REFERENCES public.subscriptions(id)
    ON DELETE SET NULL;

COMMENT ON COLUMN public.subscriptions.org_id IS 'Organização dona desta assinatura';

-- =====================================================
-- 4. FUNÇÕES DE VERIFICAÇÃO DE LIMITES
-- =====================================================

-- Função: Obter limites do plano da organização
CREATE OR REPLACE FUNCTION get_organization_limits(org_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  limits jsonb;
BEGIN
  SELECT p.limits INTO limits
  FROM public.organizations o
  JOIN public.plans p ON p.slug = o.plan_slug
  WHERE o.id = org_uuid;

  RETURN COALESCE(limits, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Obter features do plano da organização
CREATE OR REPLACE FUNCTION get_organization_features(org_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  features jsonb;
BEGIN
  SELECT p.features INTO features
  FROM public.organizations o
  JOIN public.plans p ON p.slug = o.plan_slug
  WHERE o.id = org_uuid;

  RETURN COALESCE(features, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Verificar se organização pode criar novo experimento
CREATE OR REPLACE FUNCTION can_create_experiment(org_uuid uuid)
RETURNS boolean AS $$
DECLARE
  current_count integer;
  max_limit integer;
BEGIN
  -- Buscar contagem atual de experimentos ativos
  SELECT COUNT(*) INTO current_count
  FROM public.experiments e
  JOIN public.projects p ON p.id = e.project_id
  WHERE p.org_id = org_uuid
    AND e.status IN ('draft', 'running', 'paused');

  -- Buscar limite do plano (-1 significa ilimitado)
  SELECT (limits->>'max_experiments')::integer INTO max_limit
  FROM public.plans
  WHERE slug = (SELECT plan_slug FROM public.organizations WHERE id = org_uuid);

  -- Se ilimitado ou dentro do limite
  RETURN (max_limit = -1) OR (current_count < max_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Verificar se organização pode criar novo projeto
CREATE OR REPLACE FUNCTION can_create_project(org_uuid uuid)
RETURNS boolean AS $$
DECLARE
  current_count integer;
  max_limit integer;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM public.projects
  WHERE org_id = org_uuid;

  SELECT (limits->>'max_projects')::integer INTO max_limit
  FROM public.plans
  WHERE slug = (SELECT plan_slug FROM public.organizations WHERE id = org_uuid);

  RETURN (max_limit = -1) OR (current_count < max_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Verificar se tem acesso a feature
CREATE OR REPLACE FUNCTION organization_has_feature(org_uuid uuid, feature_key text)
RETURNS boolean AS $$
DECLARE
  has_access boolean;
BEGIN
  SELECT (features->>feature_key)::boolean INTO has_access
  FROM public.plans
  WHERE slug = (SELECT plan_slug FROM public.organizations WHERE id = org_uuid);

  RETURN COALESCE(has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Verificar se organização está ativa
CREATE OR REPLACE FUNCTION is_organization_active(org_uuid uuid)
RETURNS boolean AS $$
DECLARE
  org_status record;
BEGIN
  SELECT
    is_active,
    is_blocked,
    subscription_status,
    subscription_end
  INTO org_status
  FROM public.organizations
  WHERE id = org_uuid;

  -- Organização deve estar ativa, não bloqueada e com subscription válida
  RETURN org_status.is_active
    AND NOT org_status.is_blocked
    AND org_status.subscription_status IN ('active', 'trialing')
    AND (org_status.subscription_end IS NULL OR org_status.subscription_end > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Atualizar uso da organização (chamada periodicamente)
CREATE OR REPLACE FUNCTION update_organization_usage(org_uuid uuid)
RETURNS void AS $$
DECLARE
  period_start timestamptz;
  period_end timestamptz;
BEGIN
  -- Período atual (mês corrente)
  period_start := date_trunc('month', now());
  period_end := date_trunc('month', now()) + interval '1 month';

  INSERT INTO public.organization_usage (
    org_id,
    period_start,
    period_end,
    experiments_count,
    active_experiments_count,
    projects_count,
    visitors_count,
    events_count
  )
  SELECT
    org_uuid,
    period_start,
    period_end,
    (SELECT COUNT(*) FROM public.experiments e
     JOIN public.projects p ON p.id = e.project_id
     WHERE p.org_id = org_uuid),
    (SELECT COUNT(*) FROM public.experiments e
     JOIN public.projects p ON p.id = e.project_id
     WHERE p.org_id = org_uuid AND e.status IN ('running', 'paused')),
    (SELECT COUNT(*) FROM public.projects WHERE org_id = org_uuid),
    (SELECT COUNT(DISTINCT visitor_id) FROM public.events ev
     JOIN public.projects p ON p.id = ev.project_id
     WHERE p.org_id = org_uuid
       AND ev.created_at >= period_start
       AND ev.created_at < period_end),
    (SELECT COUNT(*) FROM public.events ev
     JOIN public.projects p ON p.id = ev.project_id
     WHERE p.org_id = org_uuid
       AND ev.created_at >= period_start
       AND ev.created_at < period_end)
  ON CONFLICT (org_id, period_start)
  DO UPDATE SET
    experiments_count = EXCLUDED.experiments_count,
    active_experiments_count = EXCLUDED.active_experiments_count,
    projects_count = EXCLUDED.projects_count,
    visitors_count = EXCLUDED.visitors_count,
    events_count = EXCLUDED.events_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGERS PARA VALIDAÇÃO DE LIMITES
-- =====================================================

-- Trigger: Validar limite ao criar experimento
CREATE OR REPLACE FUNCTION validate_experiment_limit()
RETURNS TRIGGER AS $$
DECLARE
  org_uuid uuid;
  can_create boolean;
BEGIN
  -- Buscar org_id do projeto
  SELECT org_id INTO org_uuid
  FROM public.projects
  WHERE id = NEW.project_id;

  -- Verificar se pode criar
  SELECT can_create_experiment(org_uuid) INTO can_create;

  IF NOT can_create THEN
    RAISE EXCEPTION 'Limite de experimentos atingido para este plano. Faça upgrade para criar mais experimentos.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_experiment_limit
  BEFORE INSERT ON public.experiments
  FOR EACH ROW
  EXECUTE FUNCTION validate_experiment_limit();

-- Trigger: Validar limite ao criar projeto
CREATE OR REPLACE FUNCTION validate_project_limit()
RETURNS TRIGGER AS $$
DECLARE
  can_create boolean;
BEGIN
  SELECT can_create_project(NEW.org_id) INTO can_create;

  IF NOT can_create THEN
    RAISE EXCEPTION 'Limite de projetos atingido para este plano. Faça upgrade para criar mais projetos.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_project_limit
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION validate_project_limit();

-- =====================================================
-- 6. ATUALIZAR RLS POLICIES
-- =====================================================

-- Policy adicional: bloquear acesso se organização estiver bloqueada
CREATE OR REPLACE FUNCTION is_org_blocked(org_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_uuid AND is_blocked = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar verificação de bloqueio às policies existentes de experiments
DROP POLICY IF EXISTS "experiments_select_org_members" ON public.experiments;
CREATE POLICY "experiments_select_org_members" ON public.experiments
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR (
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.organization_members om ON om.org_id = p.org_id
        WHERE p.id = experiments.project_id
          AND om.user_id = auth.uid()
      )
      AND NOT is_org_blocked((SELECT org_id FROM public.projects WHERE id = experiments.project_id))
    )
  );

-- =====================================================
-- 7. VIEW PARA DASHBOARD DE ASSINATURAS
-- =====================================================

CREATE OR REPLACE VIEW organization_subscription_view AS
SELECT
  o.id as org_id,
  o.name as org_name,
  o.slug as org_slug,
  o.plan_slug,
  o.subscription_status,
  o.subscription_start,
  o.subscription_end,
  o.is_blocked,
  o.blocked_reason,

  -- Dados do plano
  p.name as plan_name,
  p.price_monthly,
  p.price_yearly,
  p.features,
  p.limits,

  -- Dados da subscription
  s.id as subscription_id,
  s.kiwify_subscription_id,
  s.billing_cycle,
  s.cancel_at_period_end,

  -- Uso atual
  u.experiments_count,
  u.active_experiments_count,
  u.projects_count,
  u.visitors_count,
  u.events_count,

  -- Limites vs Uso
  CASE
    WHEN (p.limits->>'max_experiments')::integer = -1 THEN 'unlimited'
    ELSE (p.limits->>'max_experiments')::text || ' / ' || COALESCE(u.experiments_count::text, '0')
  END as experiments_limit_status,

  CASE
    WHEN (p.limits->>'max_projects')::integer = -1 THEN 'unlimited'
    ELSE (p.limits->>'max_projects')::text || ' / ' || COALESCE(u.projects_count::text, '0')
  END as projects_limit_status

FROM public.organizations o
LEFT JOIN public.plans p ON p.slug = o.plan_slug
LEFT JOIN public.subscriptions s ON s.id = o.subscription_id
LEFT JOIN LATERAL (
  SELECT * FROM public.organization_usage
  WHERE org_id = o.id
  ORDER BY period_start DESC
  LIMIT 1
) u ON true;

COMMENT ON VIEW organization_subscription_view IS 'View consolidada de assinaturas e uso por organização';

-- =====================================================
-- 8. FUNÇÃO PARA SINCRONIZAR SUBSCRIPTION → ORGANIZATION
-- =====================================================

CREATE OR REPLACE FUNCTION sync_subscription_to_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar dados da organization baseado na subscription
  UPDATE public.organizations
  SET
    subscription_id = NEW.id,
    plan_slug = (SELECT slug FROM public.plans WHERE id = NEW.plan_id),
    subscription_status = NEW.status,
    subscription_start = NEW.current_period_start,
    subscription_end = NEW.current_period_end,
    is_blocked = CASE
      WHEN NEW.status IN ('unpaid', 'canceled') THEN true
      ELSE false
    END,
    blocked_reason = CASE
      WHEN NEW.status = 'unpaid' THEN 'payment_overdue'
      WHEN NEW.status = 'canceled' THEN 'subscription_canceled'
      ELSE NULL
    END,
    blocked_at = CASE
      WHEN NEW.status IN ('unpaid', 'canceled') THEN now()
      ELSE NULL
    END
  WHERE id = NEW.org_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_subscription_to_org
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_to_organization();

-- =====================================================
-- 9. ENABLE RLS E GRANTS
-- =====================================================

ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;

-- Policies para organization_usage
CREATE POLICY "organization_usage_select" ON public.organization_usage
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE org_id = organization_usage.org_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "organization_usage_manage_service" ON public.organization_usage
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Grants
GRANT SELECT ON public.organization_usage TO authenticated;
GRANT ALL ON public.organization_usage TO service_role;
GRANT SELECT ON organization_subscription_view TO authenticated;

-- =====================================================
-- 10. MIGRAÇÃO DE DADOS EXISTENTES
-- =====================================================

-- Atualizar organizações existentes para trial
UPDATE public.organizations
SET
  plan_slug = 'trial',
  subscription_status = 'trialing',
  subscription_start = created_at,
  subscription_end = created_at + interval '14 days'
WHERE plan_slug IS NULL;

-- =====================================================
-- VERIFICAÇÃO E SUCESSO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ INTEGRAÇÃO SAAS COMPLETA!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Organizations atualizadas: %', (SELECT COUNT(*) FROM public.organizations);
  RAISE NOTICE 'Funções de validação criadas: 7';
  RAISE NOTICE 'Triggers de limite criados: 2';
  RAISE NOTICE 'View de subscription criada';
  RAISE NOTICE '========================================';
END $$;
