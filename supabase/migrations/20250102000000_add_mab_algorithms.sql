-- Adicionar coluna algorithm à tabela experiments (se ainda não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='experiments' AND column_name='algorithm') THEN
        ALTER TABLE experiments ADD COLUMN algorithm TEXT DEFAULT 'uniform';
        COMMENT ON COLUMN experiments.algorithm IS 'Algoritmo de seleção de variantes: uniform, thompson_sampling, ucb1, epsilon_greedy';
    END IF;
END $$;

-- Criar tabela variant_stats para armazenar estatísticas das variantes
CREATE TABLE IF NOT EXISTS variant_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
    visitors INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(experiment_id, variant_id)
);

COMMENT ON TABLE variant_stats IS 'Estatísticas agregadas por variante para algoritmos MAB';
COMMENT ON COLUMN variant_stats.visitors IS 'Número total de visitantes atribuídos a esta variante';
COMMENT ON COLUMN variant_stats.conversions IS 'Número total de conversões desta variante';
COMMENT ON COLUMN variant_stats.revenue IS 'Receita total gerada por esta variante';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_variant_stats_experiment ON variant_stats(experiment_id);
CREATE INDEX IF NOT EXISTS idx_variant_stats_variant ON variant_stats(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_stats_updated ON variant_stats(last_updated);

-- Função para incrementar visitantes da variante
CREATE OR REPLACE FUNCTION increment_variant_visitors(
    p_variant_id UUID,
    p_experiment_id UUID
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO variant_stats (experiment_id, variant_id, visitors, conversions, revenue)
    VALUES (p_experiment_id, p_variant_id, 1, 0, 0)
    ON CONFLICT (experiment_id, variant_id)
    DO UPDATE SET
        visitors = variant_stats.visitors + 1,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_variant_visitors IS 'Incrementa contador de visitantes de uma variante';

-- Função para registrar conversão da variante
CREATE OR REPLACE FUNCTION increment_variant_conversions(
    p_variant_id UUID,
    p_experiment_id UUID,
    p_revenue DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO variant_stats (experiment_id, variant_id, visitors, conversions, revenue)
    VALUES (p_experiment_id, p_variant_id, 0, 1, p_revenue)
    ON CONFLICT (experiment_id, variant_id)
    DO UPDATE SET
        conversions = variant_stats.conversions + 1,
        revenue = variant_stats.revenue + p_revenue,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_variant_conversions IS 'Incrementa contador de conversões e receita de uma variante';

-- Função para obter estatísticas de um experimento (para algoritmos MAB)
CREATE OR REPLACE FUNCTION get_experiment_stats(p_experiment_id UUID)
RETURNS TABLE (
    variant_id UUID,
    variant_name TEXT,
    visitors INTEGER,
    conversions INTEGER,
    revenue DECIMAL,
    conversion_rate DECIMAL,
    average_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id as variant_id,
        v.name as variant_name,
        COALESCE(vs.visitors, 0) as visitors,
        COALESCE(vs.conversions, 0) as conversions,
        COALESCE(vs.revenue, 0) as revenue,
        CASE 
            WHEN COALESCE(vs.visitors, 0) > 0 
            THEN ROUND((COALESCE(vs.conversions, 0)::DECIMAL / vs.visitors) * 100, 2)
            ELSE 0
        END as conversion_rate,
        CASE 
            WHEN COALESCE(vs.conversions, 0) > 0 
            THEN ROUND(vs.revenue / vs.conversions, 2)
            ELSE 0
        END as average_revenue
    FROM variants v
    LEFT JOIN variant_stats vs ON v.id = vs.variant_id AND vs.experiment_id = p_experiment_id
    WHERE v.experiment_id = p_experiment_id
      AND v.is_active = TRUE
    ORDER BY v.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_experiment_stats IS 'Retorna estatísticas agregadas de todas as variantes de um experimento';

-- View para facilitar consultas de estatísticas
CREATE OR REPLACE VIEW experiment_stats_view AS
SELECT 
    e.id as experiment_id,
    e.name as experiment_name,
    e.algorithm,
    e.status,
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
    CASE 
        WHEN COALESCE(vs.conversions, 0) > 0 
        THEN ROUND(vs.revenue / vs.conversions, 2)
        ELSE 0
    END as average_revenue,
    vs.last_updated
FROM experiments e
LEFT JOIN variants v ON e.id = v.experiment_id
LEFT JOIN variant_stats vs ON v.id = vs.variant_id AND e.id = vs.experiment_id
WHERE v.is_active = TRUE
ORDER BY e.created_at DESC, v.created_at ASC;

COMMENT ON VIEW experiment_stats_view IS 'View consolidada com estatísticas de experimentos e variantes';

-- Inicializar variant_stats para experimentos existentes
INSERT INTO variant_stats (experiment_id, variant_id, visitors, conversions, revenue)
SELECT 
    v.experiment_id,
    v.id as variant_id,
    0 as visitors,
    0 as conversions,
    0 as revenue
FROM variants v
WHERE v.is_active = TRUE
ON CONFLICT (experiment_id, variant_id) DO NOTHING;

-- Atualizar valores padrão de algorithm para experimentos existentes
UPDATE experiments 
SET algorithm = 'uniform'
WHERE algorithm IS NULL;

-- Grant permissions
GRANT SELECT ON variant_stats TO authenticated, anon;
GRANT SELECT ON experiment_stats_view TO authenticated, anon;

-- Enable RLS
ALTER TABLE variant_stats ENABLE ROW LEVEL SECURITY;

-- Policies para variant_stats
CREATE POLICY "variant_stats_select_policy" ON variant_stats
    FOR SELECT
    USING (true);

CREATE POLICY "variant_stats_insert_policy" ON variant_stats
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "variant_stats_update_policy" ON variant_stats
    FOR UPDATE
    USING (true);

-- Função para buscar conversões por dia
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
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(e.created_at) as date,
        v.id as variant_id,
        v.name as variant_name,
        COUNT(*)::INTEGER as conversions,
        COALESCE(SUM(e.value), 0)::DECIMAL as revenue
    FROM events e
    JOIN variants v ON e.properties->>'variant' = v.name
    WHERE e.experiment_id = p_experiment_id
      AND e.event_type = 'conversion'
      AND e.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(e.created_at), v.id, v.name
    ORDER BY date DESC, v.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_daily_conversions IS 'Retorna conversões agrupadas por dia e variante';

-- Função para buscar métricas de experimento em tempo real
CREATE OR REPLACE FUNCTION get_experiment_metrics(p_experiment_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'visitors', COALESCE(SUM(vs.visitors), 0),
        'conversions', COALESCE(SUM(vs.conversions), 0),
        'revenue', COALESCE(SUM(vs.revenue), 0),
        'conversion_rate', CASE 
            WHEN SUM(vs.visitors) > 0 
            THEN ROUND((SUM(vs.conversions)::DECIMAL / SUM(vs.visitors)) * 100, 2)
            ELSE 0
        END,
        'variants', (
            SELECT json_agg(
                json_build_object(
                    'id', v.id,
                    'name', v.name,
                    'visitors', COALESCE(vs.visitors, 0),
                    'conversions', COALESCE(vs.conversions, 0),
                    'revenue', COALESCE(vs.revenue, 0),
                    'conversion_rate', CASE 
                        WHEN COALESCE(vs.visitors, 0) > 0 
                        THEN ROUND((COALESCE(vs.conversions, 0)::DECIMAL / vs.visitors) * 100, 2)
                        ELSE 0
                    END
                )
            )
            FROM variants v
            LEFT JOIN variant_stats vs ON v.id = vs.variant_id AND vs.experiment_id = p_experiment_id
            WHERE v.experiment_id = p_experiment_id AND v.is_active = TRUE
        )
    ) INTO result
    FROM variant_stats vs
    WHERE vs.experiment_id = p_experiment_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_experiment_metrics IS 'Retorna métricas completas de um experimento em formato JSON';

COMMENT ON TABLE experiments IS 'Experimentos A/B com suporte a algoritmos MAB';

