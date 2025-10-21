-- ==========================================
-- Migration: Otimizar Conversões e Segurança
-- Data: 2025-10-21
-- Descrição: Adiciona índices para performance de conversões e corrige RLS
-- ==========================================

-- ==========================================
-- PARTE 1: ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para eventos de conversão
CREATE INDEX IF NOT EXISTS idx_events_conversion_lookup
  ON events(experiment_id, event_type, visitor_id)
  WHERE event_type = 'conversion';

CREATE INDEX IF NOT EXISTS idx_events_experiment_type
  ON events(experiment_id, event_type);

CREATE INDEX IF NOT EXISTS idx_events_visitor_experiment
  ON events(visitor_id, experiment_id, created_at);

-- Índice para assignments lookup rápido
CREATE INDEX IF NOT EXISTS idx_assignments_visitor_experiment
  ON assignments(visitor_id, experiment_id);

CREATE INDEX IF NOT EXISTS idx_assignments_experiment
  ON assignments(experiment_id, assigned_at DESC);

-- Índice para variant_stats
CREATE INDEX IF NOT EXISTS idx_variant_stats_experiment
  ON variant_stats(experiment_id, last_updated DESC);

-- Índice para experimentos com conversão configurada
CREATE INDEX IF NOT EXISTS idx_experiments_with_conversion
  ON experiments(conversion_url)
  WHERE conversion_url IS NOT NULL;

-- ==========================================
-- PARTE 2: CORRIGIR RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Drop políticas antigas de eventos, assignments e variant_stats
DROP POLICY IF EXISTS events_select_policy ON events;
DROP POLICY IF EXISTS assignments_select_policy ON assignments;
DROP POLICY IF EXISTS variant_stats_select_policy ON variant_stats;
DROP POLICY IF EXISTS events_insert_policy ON events;
DROP POLICY IF EXISTS assignments_insert_policy ON assignments;

-- ==========================================
-- RLS para EVENTS
-- ==========================================

-- SELECT: Usuários podem ver apenas eventos dos seus experimentos
CREATE POLICY events_select_by_org ON events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments e
      JOIN projects p ON e.project_id = p.id
      JOIN organization_members om ON p.org_id = om.org_id
      WHERE e.id = events.experiment_id
        AND om.user_id = auth.uid()
    )
  );

-- INSERT: Service role pode inserir (para APIs públicas)
-- Usuários autenticados também podem inserir eventos dos seus experimentos
CREATE POLICY events_insert_by_service ON events
  FOR INSERT
  WITH CHECK (
    -- Service role tem acesso total
    auth.jwt()->>'role' = 'service_role'
    OR
    -- Ou usuário tem acesso ao experimento
    EXISTS (
      SELECT 1 FROM experiments e
      JOIN projects p ON e.project_id = p.id
      JOIN organization_members om ON p.org_id = om.org_id
      WHERE e.id = events.experiment_id
        AND om.user_id = auth.uid()
    )
  );

-- ==========================================
-- RLS para ASSIGNMENTS
-- ==========================================

-- SELECT: Usuários podem ver apenas assignments dos seus experimentos
CREATE POLICY assignments_select_by_org ON assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments e
      JOIN projects p ON e.project_id = p.id
      JOIN organization_members om ON p.org_id = om.org_id
      WHERE e.id = assignments.experiment_id
        AND om.user_id = auth.uid()
    )
  );

-- INSERT: Service role pode inserir (para APIs públicas)
CREATE POLICY assignments_insert_by_service ON assignments
  FOR INSERT
  WITH CHECK (
    -- Service role tem acesso total
    auth.jwt()->>'role' = 'service_role'
    OR
    -- Ou usuário tem acesso ao experimento
    EXISTS (
      SELECT 1 FROM experiments e
      JOIN projects p ON e.project_id = p.id
      JOIN organization_members om ON p.org_id = om.org_id
      WHERE e.id = assignments.experiment_id
        AND om.user_id = auth.uid()
    )
  );

-- ==========================================
-- RLS para VARIANT_STATS
-- ==========================================

-- SELECT: Usuários podem ver apenas stats dos seus experimentos
CREATE POLICY variant_stats_select_by_org ON variant_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments e
      JOIN projects p ON e.project_id = p.id
      JOIN organization_members om ON p.org_id = om.org_id
      WHERE e.id = variant_stats.experiment_id
        AND om.user_id = auth.uid()
    )
  );

-- INSERT/UPDATE: Service role pode manipular (para RPCs)
CREATE POLICY variant_stats_write_by_service ON variant_stats
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ==========================================
-- PARTE 3: FUNÇÃO AUXILIAR PARA VERIFICAÇÃO DE ORGANIZAÇÃO
-- ==========================================

-- Função para verificar se um experimento pertence à organização do usuário
CREATE OR REPLACE FUNCTION user_has_access_to_experiment(p_experiment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM experiments e
    JOIN projects p ON e.project_id = p.id
    JOIN organization_members om ON p.org_id = om.org_id
    WHERE e.id = p_experiment_id
      AND om.user_id = auth.uid()
  );
END;
$$;

-- ==========================================
-- PARTE 4: OTIMIZAÇÕES DE QUERIES
-- ==========================================

-- Criar view materializada para stats agregadas (opcional, para dashboards)
CREATE MATERIALIZED VIEW IF NOT EXISTS experiment_stats_summary AS
SELECT
  e.id as experiment_id,
  e.name as experiment_name,
  e.status,
  COUNT(DISTINCT a.visitor_id) as total_visitors,
  COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.visitor_id END) as total_conversions,
  COALESCE(SUM(CASE WHEN ev.event_type = 'conversion' THEN ev.value ELSE 0 END), 0) as total_revenue,
  CASE
    WHEN COUNT(DISTINCT a.visitor_id) > 0
    THEN (COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.visitor_id END)::FLOAT / COUNT(DISTINCT a.visitor_id) * 100)
    ELSE 0
  END as conversion_rate
FROM experiments e
LEFT JOIN assignments a ON e.id = a.experiment_id
LEFT JOIN events ev ON e.id = ev.experiment_id AND ev.visitor_id = a.visitor_id
WHERE e.status IN ('running', 'completed')
GROUP BY e.id, e.name, e.status;

-- Índice na view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_experiment_stats_summary_id
  ON experiment_stats_summary(experiment_id);

-- Função para atualizar a view materializada
CREATE OR REPLACE FUNCTION refresh_experiment_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY experiment_stats_summary;
END;
$$;

-- ==========================================
-- PARTE 5: COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==========================================

COMMENT ON INDEX idx_events_conversion_lookup IS 'Índice otimizado para lookup de conversões por experimento';
COMMENT ON INDEX idx_events_experiment_type IS 'Índice para filtrar eventos por tipo dentro de um experimento';
COMMENT ON INDEX idx_assignments_visitor_experiment IS 'Índice para lookup rápido de assignments por visitante';
COMMENT ON FUNCTION user_has_access_to_experiment IS 'Verifica se usuário tem acesso ao experimento através da organização';
COMMENT ON MATERIALIZED VIEW experiment_stats_summary IS 'View materializada com estatísticas agregadas de experimentos para dashboards';
