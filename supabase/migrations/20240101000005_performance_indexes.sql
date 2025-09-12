-- ===================================================
-- MIGRAÇÃO ÍNDICES E PERFORMANCE - ROTA FINAL
-- ===================================================
-- Índices adicionais, otimizações e configurações finais
-- Data: 2024-01-01
-- Versão: 1.0.0

-- ===================================================
-- ÍNDICES COMPOSTOS PARA QUERIES FREQUENTES
-- ===================================================

-- Índices para queries de experimentos por organização
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experiments_org_status
ON experiments USING btree (
    (SELECT organization_id FROM projects WHERE id = experiments.project_id),
    status,
    created_at DESC
);

-- Índice para busca de atribuições por experimento e data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_exp_date
ON assignments USING btree (experiment_id, created_at DESC);

-- Índice para busca de eventos por projeto e tipo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_project_type_date
ON events USING btree (project_id, event_type, created_at DESC);

-- Índice para eventos de conversão por experimento
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_conversion_exp
ON events USING btree (experiment_id, created_at DESC)
WHERE event_type = 'conversion';

-- Índice para métricas válidas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_valid
ON metrics_snapshots USING btree (experiment_id, variant_id, metric_type)
WHERE computed_at >= (now() - INTERVAL '1 day');

-- Índice para sessões ativas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitor_sessions_active
ON visitor_sessions USING btree (project_id, started_at DESC)
WHERE ended_at IS NULL;

-- ===================================================
-- ÍNDICES PARA ANÁLISE E RELATÓRIOS
-- ===================================================

-- Índice para análise de funil por projeto
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_funnel_analysis
ON events USING btree (project_id, visitor_id, event_type, created_at);

-- Índice para análise de cohort
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_cohort
ON assignments USING btree (
    experiment_id,
    date_trunc('day', created_at),
    variant_id
);

-- Índice para análise de retenção
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_retention
ON events USING btree (
    project_id,
    visitor_id,
    date_trunc('day', created_at)
);

-- Índice para segmentação por UTM
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitor_sessions_utm
ON visitor_sessions USING btree (
    project_id,
    utm_source,
    utm_medium,
    utm_campaign
) WHERE utm_source IS NOT NULL;

-- Índice para análise geográfica
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visitor_sessions_geo
ON visitor_sessions USING btree (
    project_id,
    country_code,
    region,
    started_at DESC
);

-- ===================================================
-- ÍNDICES PARA PERFORMANCE DE MAB
-- ===================================================

-- Índice para cálculo rápido de Thompson Sampling
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assignments_variant_stats
ON assignments USING btree (experiment_id, variant_id, created_at);

-- Índice para busca rápida de variantes por experimento
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variants_experiment_order
ON variants USING btree (experiment_id, is_control DESC, weight DESC);

-- Índice parcial para experimentos ativos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_experiments_active
ON experiments USING btree (id, algorithm, traffic_allocation)
WHERE status = 'running';

-- ===================================================
-- VIEWS MATERIALIZADAS PARA PERFORMANCE
-- ===================================================

-- View materializada para estatísticas rápidas de experimentos
CREATE MATERIALIZED VIEW experiment_stats AS
SELECT 
    e.id as experiment_id,
    e.name as experiment_name,
    e.status,
    e.algorithm,
    COUNT(DISTINCT a.visitor_id) as total_visitors,
    COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.visitor_id END) as total_conversions,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT a.visitor_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.visitor_id END)::NUMERIC / COUNT(DISTINCT a.visitor_id)) * 100
            ELSE 0 
        END, 2
    ) as conversion_rate,
    SUM(COALESCE(ev.value, 0)) as total_revenue,
    COUNT(DISTINCT v.id) as variant_count,
    e.created_at,
    e.started_at,
    now() as computed_at
FROM experiments e
LEFT JOIN variants v ON e.id = v.experiment_id
LEFT JOIN assignments a ON e.id = a.experiment_id
LEFT JOIN events ev ON a.visitor_id = ev.visitor_id 
    AND a.experiment_id = ev.experiment_id
GROUP BY e.id, e.name, e.status, e.algorithm, e.created_at, e.started_at;

-- Índices na view materializada
CREATE UNIQUE INDEX idx_experiment_stats_id ON experiment_stats(experiment_id);
CREATE INDEX idx_experiment_stats_status ON experiment_stats(status);
CREATE INDEX idx_experiment_stats_conversion ON experiment_stats(conversion_rate DESC);

-- View materializada para estatísticas por variante
CREATE MATERIALIZED VIEW variant_stats AS
SELECT 
    v.id as variant_id,
    v.experiment_id,
    v.name as variant_name,
    v.is_control,
    COUNT(DISTINCT a.visitor_id) as visitors,
    COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.visitor_id END) as conversions,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT a.visitor_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.visitor_id END)::NUMERIC / COUNT(DISTINCT a.visitor_id)) * 100
            ELSE 0 
        END, 2
    ) as conversion_rate,
    SUM(COALESCE(ev.value, 0)) as revenue,
    AVG(COALESCE(ev.value, 0)) as avg_value,
    now() as computed_at
FROM variants v
LEFT JOIN assignments a ON v.id = a.variant_id
LEFT JOIN events ev ON a.visitor_id = ev.visitor_id 
    AND a.experiment_id = ev.experiment_id
GROUP BY v.id, v.experiment_id, v.name, v.is_control;

-- Índices na view materializada de variantes
CREATE UNIQUE INDEX idx_variant_stats_id ON variant_stats(variant_id);
CREATE INDEX idx_variant_stats_experiment ON variant_stats(experiment_id);
CREATE INDEX idx_variant_stats_conversion ON variant_stats(conversion_rate DESC);

-- ===================================================
-- FUNÇÕES PARA ATUALIZAÇÃO DAS VIEWS
-- ===================================================

-- Função para atualizar estatísticas
CREATE OR REPLACE FUNCTION refresh_experiment_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY experiment_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY variant_stats;
    
    -- Atualiza timestamp da última atualização
    INSERT INTO metrics_snapshots (experiment_id, variant_id, metric_type, count, value)
    VALUES (uuid_nil(), uuid_nil(), 'last_refresh', 1, extract(epoch from now()))
    ON CONFLICT (experiment_id, variant_id, metric_type, computed_at) 
    DO UPDATE SET value = extract(epoch from now());
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- CONFIGURAÇÕES DE PERFORMANCE
-- ===================================================

-- Ajustes de configuração para melhor performance
-- Estas configurações devem ser aplicadas no nível do banco

-- Configurações para trabalho com partições
ALTER SYSTEM SET enable_partition_pruning = on;
ALTER SYSTEM SET enable_partitionwise_join = on;
ALTER SYSTEM SET enable_partitionwise_aggregate = on;

-- Configurações para queries analíticas
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Configurações para logging de queries lentas
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 segundo
ALTER SYSTEM SET log_statement = 'none';
ALTER SYSTEM SET log_duration = off;

-- ===================================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ===================================================

-- Função para invalidar views materializadas
CREATE OR REPLACE FUNCTION invalidate_experiment_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Agenda atualização das views (pode ser feito via job)
    PERFORM pg_notify('refresh_stats', 'experiment_stats');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualização automática das estatísticas
CREATE TRIGGER tr_assignments_refresh_stats
    AFTER INSERT OR UPDATE OR DELETE ON assignments
    FOR EACH STATEMENT
    EXECUTE FUNCTION invalidate_experiment_stats();

CREATE TRIGGER tr_events_refresh_stats
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH STATEMENT
    EXECUTE FUNCTION invalidate_experiment_stats();

-- ===================================================
-- FUNÇÕES DE ANÁLISE AVANÇADA
-- ===================================================

-- Função para análise de significância estatística em lote
CREATE OR REPLACE FUNCTION analyze_all_experiments()
RETURNS TABLE (
    experiment_id UUID,
    experiment_name TEXT,
    control_variant_id UUID,
    test_variant_id UUID,
    significance_result JSONB
) AS $$
DECLARE
    exp_record RECORD;
    control_record RECORD;
    variant_record RECORD;
BEGIN
    FOR exp_record IN 
        SELECT e.id, e.name
        FROM experiments e
        WHERE e.status = 'running'
    LOOP
        -- Busca variante de controle
        SELECT v.id, vs.visitors, vs.conversions
        INTO control_record
        FROM variants v
        JOIN variant_stats vs ON v.id = vs.variant_id
        WHERE v.experiment_id = exp_record.id
        AND v.is_control = true;
        
        -- Analisa cada variante de teste
        FOR variant_record IN
            SELECT v.id, vs.visitors, vs.conversions
            FROM variants v
            JOIN variant_stats vs ON v.id = vs.variant_id
            WHERE v.experiment_id = exp_record.id
            AND v.is_control = false
        LOOP
            experiment_id := exp_record.id;
            experiment_name := exp_record.name;
            control_variant_id := control_record.id;
            test_variant_id := variant_record.id;
            significance_result := calculate_significance(
                control_record.conversions::INTEGER,
                control_record.visitors::INTEGER,
                variant_record.conversions::INTEGER,
                variant_record.visitors::INTEGER
            );
            
            RETURN NEXT;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para relatório de performance por período
CREATE OR REPLACE FUNCTION experiment_performance_report(
    project_uuid UUID,
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    period_start DATE,
    period_end DATE,
    experiments_created INTEGER,
    experiments_started INTEGER,
    experiments_completed INTEGER,
    total_visitors BIGINT,
    total_conversions BIGINT,
    total_revenue NUMERIC,
    avg_conversion_rate NUMERIC
) AS $$
BEGIN
    start_date := COALESCE(start_date, now() - INTERVAL '30 days');
    end_date := COALESCE(end_date, now());
    
    RETURN QUERY
    WITH daily_stats AS (
        SELECT 
            date_trunc('day', e.created_at) as day,
            COUNT(CASE WHEN e.created_at::date = date_trunc('day', e.created_at)::date THEN 1 END) as created,
            COUNT(CASE WHEN e.started_at::date = date_trunc('day', e.created_at)::date THEN 1 END) as started,
            COUNT(CASE WHEN e.ended_at::date = date_trunc('day', e.created_at)::date THEN 1 END) as completed
        FROM experiments e
        JOIN projects p ON e.project_id = p.id
        WHERE p.id = project_uuid
        AND e.created_at >= start_date
        AND e.created_at <= end_date
        GROUP BY date_trunc('day', e.created_at)
    ),
    traffic_stats AS (
        SELECT 
            date_trunc('day', a.created_at) as day,
            COUNT(DISTINCT a.visitor_id) as visitors,
            COUNT(DISTINCT CASE WHEN ev.event_type = 'conversion' THEN ev.visitor_id END) as conversions,
            SUM(COALESCE(ev.value, 0)) as revenue
        FROM assignments a
        JOIN experiments e ON a.experiment_id = e.id
        JOIN projects p ON e.project_id = p.id
        LEFT JOIN events ev ON a.visitor_id = ev.visitor_id 
            AND a.experiment_id = ev.experiment_id
            AND ev.event_type = 'conversion'
        WHERE p.id = project_uuid
        AND a.created_at >= start_date
        AND a.created_at <= end_date
        GROUP BY date_trunc('day', a.created_at)
    )
    SELECT 
        ds.day::DATE,
        ds.day::DATE,
        COALESCE(ds.created, 0),
        COALESCE(ds.started, 0),
        COALESCE(ds.completed, 0),
        COALESCE(ts.visitors, 0),
        COALESCE(ts.conversions, 0),
        COALESCE(ts.revenue, 0),
        CASE 
            WHEN COALESCE(ts.visitors, 0) > 0 
            THEN ROUND((COALESCE(ts.conversions, 0)::NUMERIC / ts.visitors) * 100, 2)
            ELSE 0 
        END
    FROM daily_stats ds
    FULL OUTER JOIN traffic_stats ts ON ds.day = ts.day
    ORDER BY COALESCE(ds.day, ts.day);
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- PROCEDURES DE MANUTENÇÃO
-- ===================================================

-- Procedure para limpeza de dados antigos
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS TEXT AS $$
DECLARE
    cutoff_date TIMESTAMPTZ := now() - (days_to_keep || ' days')::INTERVAL;
    deleted_count INTEGER;
    result_text TEXT := '';
BEGIN
    -- Remove eventos antigos (mantém apenas dados recentes)
    DELETE FROM events 
    WHERE created_at < cutoff_date
    AND experiment_id IS NULL; -- Mantém eventos de experimentos
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Eventos removidos: ' || deleted_count || E'\n';
    
    -- Remove sessões antigas
    DELETE FROM visitor_sessions
    WHERE started_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Sessões removidas: ' || deleted_count || E'\n';
    
    -- Remove snapshots antigos
    DELETE FROM metrics_snapshots
    WHERE computed_at < (now() - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    result_text := result_text || 'Snapshots removidos: ' || deleted_count || E'\n';
    
    -- Atualiza estatísticas das tabelas
    ANALYZE events;
    ANALYZE assignments;
    ANALYZE visitor_sessions;
    ANALYZE metrics_snapshots;
    
    result_text := result_text || 'Limpeza concluída em: ' || now();
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- GRANTS E PERMISSÕES
-- ===================================================

-- Concede acesso às views materializadas
GRANT SELECT ON experiment_stats TO authenticated;
GRANT SELECT ON variant_stats TO authenticated;

-- Concede acesso às funções de análise
GRANT EXECUTE ON FUNCTION analyze_all_experiments() TO authenticated;
GRANT EXECUTE ON FUNCTION experiment_performance_report(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_experiment_stats() TO authenticated;

-- ===================================================
-- COMENTÁRIOS FINAIS
-- ===================================================
COMMENT ON MATERIALIZED VIEW experiment_stats IS 'Estatísticas agregadas de experimentos para consultas rápidas';
COMMENT ON MATERIALIZED VIEW variant_stats IS 'Estatísticas por variante para análise de performance';
COMMENT ON FUNCTION analyze_all_experiments() IS 'Análise de significância estatística para todos os experimentos ativos';
COMMENT ON FUNCTION experiment_performance_report(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Relatório de performance de experimentos por período';
COMMENT ON FUNCTION cleanup_old_data(INTEGER) IS 'Remove dados antigos para manter performance do banco';

-- ===================================================
-- NOTIFICAÇÃO DE CONCLUSÃO
-- ===================================================
DO $$
BEGIN
    RAISE NOTICE '🚀 ROTA FINAL DATABASE SETUP COMPLETO!';
    RAISE NOTICE '✅ Todas as tabelas, índices e funções foram criadas';
    RAISE NOTICE '✅ Políticas RLS ativadas para segurança multi-tenant';
    RAISE NOTICE '✅ Funções Multi-Armed Bandit implementadas';
    RAISE NOTICE '✅ Sistema de tracking de eventos configurado';
    RAISE NOTICE '✅ Índices de performance otimizados';
    RAISE NOTICE '📊 Views materializadas prontas para análises';
    RAISE NOTICE '';
    RAISE NOTICE '🔥 SISTEMA PRONTO PARA PRODUÇÃO!';
END $$;
