-- Migration: RLS Performance Indexes and Helper Functions
-- Date: 2026-01-20
-- Description: Adiciona índices para melhorar performance de RLS e funções auxiliares

-- =====================================================
-- ÍNDICES PARA PERFORMANCE DE RLS
-- =====================================================

-- Índice para verificação de membership (usado em todas as policies)
CREATE INDEX IF NOT EXISTS idx_org_members_user_org
ON organization_members(user_id, org_id);

-- Índice composto para organization_members
CREATE INDEX IF NOT EXISTS idx_org_members_org_user_role
ON organization_members(org_id, user_id, role);

-- Índice para experiments por projeto
CREATE INDEX IF NOT EXISTS idx_experiments_project
ON experiments(project_id);

-- Índice para experiments por status
CREATE INDEX IF NOT EXISTS idx_experiments_status
ON experiments(status);

-- Índice composto para experiments
CREATE INDEX IF NOT EXISTS idx_experiments_project_status
ON experiments(project_id, status);

-- Índice para projects por organização
CREATE INDEX IF NOT EXISTS idx_projects_org
ON projects(org_id);

-- Índice para variants por experiment
CREATE INDEX IF NOT EXISTS idx_variants_experiment
ON variants(experiment_id);

-- Índice para variants ativos
CREATE INDEX IF NOT EXISTS idx_variants_experiment_active
ON variants(experiment_id, is_active) WHERE is_active = true;

-- Índice para assignments (busca por visitor)
CREATE INDEX IF NOT EXISTS idx_assignments_visitor_experiment
ON assignments(visitor_id, experiment_id);

-- Índice para events por experiment e data (para queries de analytics)
CREATE INDEX IF NOT EXISTS idx_events_experiment_created
ON events(experiment_id, created_at DESC);

-- Índice para events por tipo
CREATE INDEX IF NOT EXISTS idx_events_type_created
ON events(event_type, created_at DESC);

-- Índice para subscriptions por org
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_status
ON subscriptions(org_id, status);

-- Índice para users por default_org
CREATE INDEX IF NOT EXISTS idx_users_default_org
ON users(default_org_id);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para obter schema de tabela (debug)
CREATE OR REPLACE FUNCTION get_table_schema(p_table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  character_maximum_length integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    column_name::text,
    data_type::text,
    is_nullable::text,
    column_default::text,
    character_maximum_length
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = p_table_name
  ORDER BY ordinal_position;
$$;

-- Dar permissão apenas para authenticated
GRANT EXECUTE ON FUNCTION get_table_schema TO authenticated;

-- Função para incrementar visitors de variante (atomic)
CREATE OR REPLACE FUNCTION increment_variant_visitors(
  p_variant_id uuid,
  p_experiment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO variant_stats (variant_id, experiment_id, visitors, conversions, revenue)
  VALUES (p_variant_id, p_experiment_id, 1, 0, 0)
  ON CONFLICT (variant_id, experiment_id)
  DO UPDATE SET
    visitors = variant_stats.visitors + 1,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION increment_variant_visitors TO authenticated;
GRANT EXECUTE ON FUNCTION increment_variant_visitors TO service_role;

-- Função para incrementar conversões de variante
CREATE OR REPLACE FUNCTION increment_variant_conversions(
  p_variant_id uuid,
  p_experiment_id uuid,
  p_revenue numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO variant_stats (variant_id, experiment_id, visitors, conversions, revenue)
  VALUES (p_variant_id, p_experiment_id, 0, 1, p_revenue)
  ON CONFLICT (variant_id, experiment_id)
  DO UPDATE SET
    conversions = variant_stats.conversions + 1,
    revenue = variant_stats.revenue + p_revenue,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION increment_variant_conversions TO authenticated;
GRANT EXECUTE ON FUNCTION increment_variant_conversions TO service_role;

-- Função para verificar membership de forma eficiente
CREATE OR REPLACE FUNCTION is_org_member(p_org_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION is_org_member TO authenticated;

-- Função para verificar se usuário é admin/owner
CREATE OR REPLACE FUNCTION is_org_admin(p_org_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION is_org_admin TO authenticated;

-- =====================================================
-- TABELA PARA VARIANT_STATS (se não existir)
-- =====================================================

CREATE TABLE IF NOT EXISTS variant_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  experiment_id uuid NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  visitors integer DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(variant_id, experiment_id)
);

-- Índice para variant_stats
CREATE INDEX IF NOT EXISTS idx_variant_stats_experiment
ON variant_stats(experiment_id);

-- RLS para variant_stats
ALTER TABLE variant_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "variant_stats_select_policy" ON variant_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments e
      JOIN projects p ON e.project_id = p.id
      WHERE e.id = variant_stats.experiment_id
        AND is_org_member(p.org_id)
    )
  );

CREATE POLICY IF NOT EXISTS "variant_stats_insert_policy" ON variant_stats
  FOR INSERT
  WITH CHECK (true); -- Service role only

CREATE POLICY IF NOT EXISTS "variant_stats_update_policy" ON variant_stats
  FOR UPDATE
  USING (true); -- Service role only

-- =====================================================
-- ANALISAR TABELAS
-- =====================================================

ANALYZE organization_members;
ANALYZE experiments;
ANALYZE projects;
ANALYZE variants;
ANALYZE assignments;
ANALYZE events;
ANALYZE subscriptions;
ANALYZE users;
