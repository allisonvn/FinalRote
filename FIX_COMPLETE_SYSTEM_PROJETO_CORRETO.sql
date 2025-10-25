-- ==================================================================================
-- CORREÇÃO COMPLETA DO SISTEMA DE A/B TESTING
-- Projeto: qptaizbqcgproqtvwvet
-- ==================================================================================

-- 1.1 Verificar tabela experiments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'experiments' AND column_name = 'algorithm'
    ) THEN
        ALTER TABLE experiments ADD COLUMN algorithm TEXT DEFAULT 'uniform';
        RAISE NOTICE '✅ Coluna algorithm adicionada';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'experiments' AND column_name = 'target_url'
    ) THEN
        ALTER TABLE experiments ADD COLUMN target_url TEXT;
        RAISE NOTICE '✅ Coluna target_url adicionada';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'experiments' AND column_name = 'conversion_url'
    ) THEN
        ALTER TABLE experiments ADD COLUMN conversion_url TEXT;
        RAISE NOTICE '✅ Coluna conversion_url adicionada';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'experiments' AND column_name = 'conversion_type'
    ) THEN
        ALTER TABLE experiments ADD COLUMN conversion_type TEXT DEFAULT 'page_view';
        RAISE NOTICE '✅ Coluna conversion_type adicionada';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'experiments' AND column_name = 'conversion_value'
    ) THEN
        ALTER TABLE experiments ADD COLUMN conversion_value DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Coluna conversion_value adicionada';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'experiments' AND column_name = 'duration_days'
    ) THEN
        ALTER TABLE experiments ADD COLUMN duration_days INTEGER DEFAULT 30;
        RAISE NOTICE '✅ Coluna duration_days adicionada';
    END IF;
END $$;

-- 1.2 Verificar e corrigir tabela variant_stats
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'variant_stats') THEN
        CREATE TABLE variant_stats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
            variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
            visitors INTEGER NOT NULL DEFAULT 0,
            conversions INTEGER NOT NULL DEFAULT 0,
            revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(experiment_id, variant_id)
        );
        RAISE NOTICE '✅ Tabela variant_stats criada';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'variant_stats' AND column_name = 'last_updated'
    ) THEN
        ALTER TABLE variant_stats ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Coluna last_updated adicionada em variant_stats';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'variant_stats' AND column_name = 'revenue'
    ) THEN
        ALTER TABLE variant_stats ADD COLUMN revenue DECIMAL(12,2) NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Coluna revenue adicionada em variant_stats';
    END IF;
END $$;

-- 1.3 Verificar tabela events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'variant_id'
    ) THEN
        ALTER TABLE events ADD COLUMN variant_id UUID REFERENCES variants(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Coluna variant_id adicionada em events';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'event_data'
    ) THEN
        ALTER TABLE events ADD COLUMN event_data JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Coluna event_data adicionada em events';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = 'value'
    ) THEN
        ALTER TABLE events ADD COLUMN value DECIMAL(10,2);
        RAISE NOTICE '✅ Coluna value adicionada em events';
    END IF;
END $$;

-- 1.4 Verificar tabela assignments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments') THEN
        CREATE TABLE assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
            variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
            visitor_id TEXT NOT NULL,
            context JSONB DEFAULT '{}'::jsonb,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(experiment_id, visitor_id)
        );
        CREATE INDEX idx_assignments_visitor ON assignments(visitor_id);
        CREATE INDEX idx_assignments_experiment ON assignments(experiment_id);
        RAISE NOTICE '✅ Tabela assignments criada';
    END IF;
END $$;

-- 1.5 Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_variant_stats_experiment ON variant_stats(experiment_id);
CREATE INDEX IF NOT EXISTS idx_variant_stats_variant ON variant_stats(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_stats_updated ON variant_stats(last_updated);
CREATE INDEX IF NOT EXISTS idx_events_experiment_visitor ON events(experiment_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_conversion ON events(experiment_id, event_type) WHERE event_type = 'conversion';

-- 2.1 Função para incrementar visitantes
CREATE OR REPLACE FUNCTION increment_variant_visitors(
    p_variant_id UUID,
    p_experiment_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO variant_stats (
        experiment_id,
        variant_id,
        visitors,
        conversions,
        revenue,
        last_updated
    )
    VALUES (
        p_experiment_id,
        p_variant_id,
        1,
        0,
        0,
        NOW()
    )
    ON CONFLICT (experiment_id, variant_id)
    DO UPDATE SET
        visitors = variant_stats.visitors + 1,
        last_updated = NOW();
END;
$$;

-- 2.2 Função para incrementar conversões
CREATE OR REPLACE FUNCTION increment_variant_conversions(
    p_variant_id UUID,
    p_experiment_id UUID,
    p_revenue DECIMAL DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO variant_stats (
        experiment_id,
        variant_id,
        visitors,
        conversions,
        revenue,
        last_updated
    )
    VALUES (
        p_experiment_id,
        p_variant_id,
        0,
        1,
        p_revenue,
        NOW()
    )
    ON CONFLICT (experiment_id, variant_id)
    DO UPDATE SET
        conversions = variant_stats.conversions + 1,
        revenue = variant_stats.revenue + p_revenue,
        last_updated = NOW();
END;
$$;

-- 2.3 Função para obter estatísticas do experimento (DROP primeiro se existir)
DROP FUNCTION IF EXISTS get_experiment_stats(uuid);

CREATE OR REPLACE FUNCTION get_experiment_stats(
    experiment_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    experiment_id UUID,
    experiment_name TEXT,
    status TEXT,
    variant_id UUID,
    variant_name TEXT,
    is_control BOOLEAN,
    visitors INTEGER,
    conversions INTEGER,
    revenue DECIMAL,
    conversion_rate DECIMAL,
    total_visitors INTEGER,
    total_conversions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as experiment_id,
        e.name as experiment_name,
        e.status::TEXT,
        v.id as variant_id,
        v.name as variant_name,
        v.is_control,
        COALESCE(vs.visitors, 0) as visitors,
        COALESCE(vs.conversions, 0) as conversions,
        COALESCE(vs.revenue, 0) as revenue,
        CASE
            WHEN COALESCE(vs.visitors, 0) > 0
            THEN ROUND((COALESCE(vs.conversions, 0)::DECIMAL / vs.visitors) * 100, 2)
            ELSE 0
        END as conversion_rate,
        (SELECT SUM(COALESCE(vs2.visitors, 0))
         FROM variant_stats vs2
         WHERE vs2.experiment_id = e.id) as total_visitors,
        (SELECT SUM(COALESCE(vs2.conversions, 0))
         FROM variant_stats vs2
         WHERE vs2.experiment_id = e.id) as total_conversions
    FROM experiments e
    JOIN variants v ON v.experiment_id = e.id
    LEFT JOIN variant_stats vs ON vs.variant_id = v.id AND vs.experiment_id = e.id
    WHERE v.is_active = TRUE
      AND (experiment_uuid IS NULL OR e.id = experiment_uuid)
    ORDER BY e.created_at DESC, v.created_at ASC;
END;
$$;

-- 2.4 Função para obter conversões diárias
DROP FUNCTION IF EXISTS get_daily_conversions(uuid, integer);

CREATE OR REPLACE FUNCTION get_daily_conversions(
    p_experiment_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    date DATE,
    variant_id UUID,
    variant_name TEXT,
    conversions INTEGER,
    revenue DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(e.created_at) as date,
        v.id as variant_id,
        v.name as variant_name,
        COUNT(*)::INTEGER as conversions,
        COALESCE(SUM(e.value), 0)::DECIMAL as revenue
    FROM events e
    JOIN variants v ON e.variant_id = v.id
    WHERE e.experiment_id = p_experiment_id
      AND e.event_type = 'conversion'
      AND e.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(e.created_at), v.id, v.name
    ORDER BY date DESC;
END;
$$;

-- 2.5 Função para calcular significância estatística
DROP FUNCTION IF EXISTS calculate_significance(integer, integer, integer, integer);

CREATE OR REPLACE FUNCTION calculate_significance(
    p_control_conversions INTEGER,
    p_control_visitors INTEGER,
    p_variant_conversions INTEGER,
    p_variant_visitors INTEGER
)
RETURNS TABLE (
    p_value DECIMAL,
    is_significant BOOLEAN,
    uplift DECIMAL
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    control_rate DECIMAL;
    variant_rate DECIMAL;
    pooled_rate DECIMAL;
    pooled_se DECIMAL;
    z_score DECIMAL;
    calculated_p_value DECIMAL;
    calculated_uplift DECIMAL;
BEGIN
    IF p_control_visitors = 0 OR p_variant_visitors = 0 THEN
        RETURN QUERY SELECT 1.0::DECIMAL, FALSE, 0.0::DECIMAL;
        RETURN;
    END IF;

    control_rate := p_control_conversions::DECIMAL / p_control_visitors;
    variant_rate := p_variant_conversions::DECIMAL / p_variant_visitors;

    IF control_rate > 0 THEN
        calculated_uplift := ((variant_rate - control_rate) / control_rate) * 100;
    ELSE
        calculated_uplift := 0;
    END IF;

    pooled_rate := (p_control_conversions + p_variant_conversions)::DECIMAL /
                   (p_control_visitors + p_variant_visitors);

    pooled_se := SQRT(pooled_rate * (1 - pooled_rate) *
                     (1.0/p_control_visitors + 1.0/p_variant_visitors));

    IF pooled_se > 0 THEN
        z_score := ABS((variant_rate - control_rate) / pooled_se);
    ELSE
        z_score := 0;
    END IF;

    IF z_score >= 2.58 THEN
        calculated_p_value := 0.01;
    ELSIF z_score >= 1.96 THEN
        calculated_p_value := 0.05;
    ELSIF z_score >= 1.645 THEN
        calculated_p_value := 0.10;
    ELSE
        calculated_p_value := 1.0;
    END IF;

    RETURN QUERY SELECT
        calculated_p_value,
        calculated_p_value < 0.05 as is_significant,
        calculated_uplift;
END;
$$;

-- 3.1 Trigger para inicializar variant_stats quando uma variante é criada
CREATE OR REPLACE FUNCTION init_variant_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO variant_stats (
        experiment_id,
        variant_id,
        visitors,
        conversions,
        revenue,
        last_updated
    )
    VALUES (
        NEW.experiment_id,
        NEW.id,
        0,
        0,
        0,
        NOW()
    )
    ON CONFLICT (experiment_id, variant_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_init_variant_stats ON variants;
CREATE TRIGGER trigger_init_variant_stats
    AFTER INSERT ON variants
    FOR EACH ROW
    EXECUTE FUNCTION init_variant_stats();

-- 4.1 Inicializar variant_stats para variantes existentes sem estatísticas
INSERT INTO variant_stats (experiment_id, variant_id, visitors, conversions, revenue, last_updated)
SELECT
    v.experiment_id,
    v.id as variant_id,
    0 as visitors,
    0 as conversions,
    0 as revenue,
    NOW() as last_updated
FROM variants v
WHERE v.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM variant_stats vs
      WHERE vs.variant_id = v.id AND vs.experiment_id = v.experiment_id
  )
ON CONFLICT (experiment_id, variant_id) DO NOTHING;

-- 5.1 Grant permissions
GRANT SELECT ON variant_stats TO authenticated, anon, service_role;
GRANT INSERT, UPDATE ON variant_stats TO service_role;
GRANT SELECT ON events TO authenticated, anon, service_role;
GRANT INSERT ON events TO authenticated, anon, service_role;
GRANT SELECT ON assignments TO authenticated, anon, service_role;
GRANT INSERT ON assignments TO authenticated, anon, service_role;

-- 5.2 Enable RLS se ainda não estiver
ALTER TABLE variant_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 5.3 Políticas permissivas para service_role
DROP POLICY IF EXISTS variant_stats_all_service ON variant_stats;
CREATE POLICY variant_stats_all_service ON variant_stats
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role' OR auth.role() = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS events_all_service ON events;
CREATE POLICY events_all_service ON events
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role' OR auth.role() = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS assignments_all_service ON assignments;
CREATE POLICY assignments_all_service ON assignments
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role' OR auth.role() = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role' OR auth.role() = 'service_role');

-- 6.1 Verificação final
DO $$
DECLARE
    v_variant_stats_count INTEGER;
    v_functions_count INTEGER;
    v_triggers_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_variant_stats_count FROM variant_stats;

    SELECT COUNT(*) INTO v_functions_count
    FROM pg_proc
    WHERE proname IN (
        'increment_variant_visitors',
        'increment_variant_conversions',
        'get_experiment_stats',
        'get_daily_conversions',
        'calculate_significance'
    );

    SELECT COUNT(*) INTO v_triggers_count
    FROM pg_trigger
    WHERE tgname = 'trigger_init_variant_stats';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CORREÇÃO COMPLETA FINALIZADA!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Variant stats inicializados: %', v_variant_stats_count;
    RAISE NOTICE 'Funções RPC criadas: % / 5', v_functions_count;
    RAISE NOTICE 'Triggers ativos: % / 1', v_triggers_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
