-- =====================================================
-- Migration: Create Plans Table
-- Description: Planos de assinatura do SaaS
-- Version: 1.0.0
-- Date: 2025-11-19
-- =====================================================

-- Drop existing table if exists (development only)
DROP TABLE IF EXISTS public.plans CASCADE;

-- Create plans table
CREATE TABLE public.plans (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,

  -- Pricing
  price_monthly decimal(10,2) NOT NULL,
  price_yearly decimal(10,2),

  -- Kiwify integration
  kiwify_product_id text,
  kiwify_product_slug text,

  -- Features and limits (JSON)
  -- Example: {"custom_domains": true, "priority_support": true, "api_access": true}
  features jsonb DEFAULT '{}'::jsonb,

  -- Example: {"max_experiments": 10, "max_visitors": 10000, "max_projects": 3}
  limits jsonb DEFAULT '{}'::jsonb,

  -- Status
  is_active boolean DEFAULT true,
  is_public boolean DEFAULT true, -- Se deve aparecer na página de preços

  -- Display
  display_order integer DEFAULT 0,
  badge_text text, -- Ex: "Mais Popular", "Melhor Valor"
  badge_color text, -- Ex: "blue", "green", "purple"

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_plans_slug ON public.plans(slug);
CREATE INDEX idx_plans_is_active ON public.plans(is_active);
CREATE INDEX idx_plans_is_public ON public.plans(is_public);
CREATE INDEX idx_plans_display_order ON public.plans(display_order);
CREATE INDEX idx_plans_kiwify_product_id ON public.plans(kiwify_product_id);

-- Comments
COMMENT ON TABLE public.plans IS 'Planos de assinatura disponíveis no SaaS';
COMMENT ON COLUMN public.plans.slug IS 'Identificador único do plano (ex: starter, pro, enterprise)';
COMMENT ON COLUMN public.plans.features IS 'Recursos incluídos no plano em formato JSON';
COMMENT ON COLUMN public.plans.limits IS 'Limites e quotas do plano em formato JSON';
COMMENT ON COLUMN public.plans.kiwify_product_id IS 'ID do produto na Kiwify';

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Todos podem ver planos ativos e públicos
CREATE POLICY "Public plans are viewable by everyone"
  ON public.plans
  FOR SELECT
  USING (is_active = true AND is_public = true);

-- Usuários autenticados podem ver todos os planos ativos
CREATE POLICY "Authenticated users can view all active plans"
  ON public.plans
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND is_active = true
  );

-- Apenas admins podem inserir/atualizar/deletar planos
-- (será criada após a tabela users_extra)

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed data: Planos iniciais
INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, features, limits, is_active, is_public, display_order, badge_text, badge_color) VALUES
  (
    'Starter',
    'starter',
    'Perfeito para começar a testar e otimizar',
    49.90,
    499.00,
    '{"custom_domains": false, "priority_support": false, "api_access": true, "analytics": "basic", "team_members": 1}'::jsonb,
    '{"max_experiments": 5, "max_visitors": 10000, "max_projects": 2}'::jsonb,
    true,
    true,
    1,
    NULL,
    NULL
  ),
  (
    'Pro',
    'pro',
    'Para empresas que querem mais poder e recursos',
    99.90,
    999.00,
    '{"custom_domains": true, "priority_support": true, "api_access": true, "analytics": "advanced", "team_members": 5}'::jsonb,
    '{"max_experiments": 25, "max_visitors": 100000, "max_projects": 10}'::jsonb,
    true,
    true,
    2,
    'Mais Popular',
    'blue'
  ),
  (
    'Enterprise',
    'enterprise',
    'Solução completa para grandes empresas',
    299.90,
    2999.00,
    '{"custom_domains": true, "priority_support": true, "api_access": true, "analytics": "enterprise", "team_members": -1, "dedicated_support": true, "sla": true}'::jsonb,
    '{"max_experiments": -1, "max_visitors": -1, "max_projects": -1}'::jsonb,
    true,
    true,
    3,
    'Melhor Valor',
    'purple'
  ),
  (
    'Trial',
    'trial',
    'Período de teste gratuito por 14 dias',
    0.00,
    0.00,
    '{"custom_domains": false, "priority_support": false, "api_access": true, "analytics": "basic", "team_members": 1}'::jsonb,
    '{"max_experiments": 2, "max_visitors": 1000, "max_projects": 1}'::jsonb,
    true,
    false, -- Não aparece na página de preços
    0,
    'Teste Grátis',
    'green'
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 100_create_plans.sql completed successfully';
  RAISE NOTICE 'Created table: plans';
  RAISE NOTICE 'Seeded % plans', (SELECT COUNT(*) FROM public.plans);
END $$;
