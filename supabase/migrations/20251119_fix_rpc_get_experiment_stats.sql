-- ==================================================================================
-- Melhorar função RPC get_experiment_stats para ser mais robusta
-- ==================================================================================
-- Este script corrige problemas com a função get_experiment_stats
-- que estava retornando 400 Bad Request

-- Versão melhorada da função get_experiment_stats
CREATE OR REPLACE FUNCTION public.get_experiment_stats(
    p_experiment_id UUID DEFAULT NULL,
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
SET search_path = public
AS $$
DECLARE
    v_experiment_id UUID;
BEGIN
    -- Usar o parâmetro que foi passado
    v_experiment_id := COALESCE(p_experiment_id, experiment_uuid);

    RETURN QUERY
    SELECT
        e.id as experiment_id,
        e.name as experiment_name,
        e.status::TEXT as status,
        v.id as variant_id,
        v.name as variant_name,
        v.is_control,
        COALESCE(vs.visitors, 0)::INTEGER as visitors,
        COALESCE(vs.conversions, 0)::INTEGER as conversions,
        COALESCE(vs.revenue, 0)::DECIMAL as revenue,
        CASE
            WHEN COALESCE(vs.visitors, 0) > 0
            THEN ROUND((COALESCE(vs.conversions, 0)::DECIMAL / vs.visitors) * 100, 2)
            ELSE 0::DECIMAL
        END as conversion_rate,
        -- Total do experimento
        (SELECT SUM(COALESCE(vs2.visitors, 0))
         FROM variant_stats vs2
         WHERE vs2.experiment_id = e.id)::INTEGER as total_visitors,
        (SELECT SUM(COALESCE(vs2.conversions, 0))
         FROM variant_stats vs2
         WHERE vs2.experiment_id = e.id)::INTEGER as total_conversions
    FROM experiments e
    JOIN variants v ON v.experiment_id = e.id
    LEFT JOIN variant_stats vs ON vs.variant_id = v.id AND vs.experiment_id = e.id
    WHERE v.is_active = TRUE
      AND (v_experiment_id IS NULL OR e.id = v_experiment_id)
    ORDER BY e.created_at DESC, v.created_at ASC;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION public.get_experiment_stats(UUID, UUID) IS 'Retorna estatísticas agregadas de experimentos e variantes - Suporta ambos os nomes de parâmetro';

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_experiment_stats(UUID, UUID) 
TO authenticated, anon, service_role;

-- Função auxiliar para obter estatísticas simplificadas de um experimento
CREATE OR REPLACE FUNCTION public.get_experiment_stats_simple(p_experiment_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'total_visitors', COALESCE(SUM(vs.visitors), 0),
        'total_conversions', COALESCE(SUM(vs.conversions), 0),
        'total_revenue', COALESCE(SUM(vs.revenue), 0),
        'conversion_rate', CASE
            WHEN SUM(vs.visitors) > 0
            THEN ROUND((SUM(vs.conversions)::DECIMAL / SUM(vs.visitors)) * 100, 2)
            ELSE 0
        END
    ) INTO v_result
    FROM variant_stats vs
    WHERE vs.experiment_id = p_experiment_id;

    RETURN COALESCE(v_result, json_build_object(
        'total_visitors', 0,
        'total_conversions', 0,
        'total_revenue', 0,
        'conversion_rate', 0
    ));
END;
$$;

COMMENT ON FUNCTION public.get_experiment_stats_simple(UUID) IS 'Retorna estatísticas simplificadas de um experimento em formato JSON';

GRANT EXECUTE ON FUNCTION public.get_experiment_stats_simple(UUID) 
TO authenticated, anon, service_role;

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Funções RPC de estatísticas atualizadas com sucesso';
    RAISE NOTICE '   - get_experiment_stats(p_experiment_id UUID, experiment_uuid UUID) - Melhorada';
    RAISE NOTICE '   - get_experiment_stats_simple(p_experiment_id UUID) - Nova versão';
    RAISE NOTICE '';
    RAISE NOTICE 'A função now aceita ambos os parâmetros:';
    RAISE NOTICE '   - p_experiment_id (parâmetro positional)';
    RAISE NOTICE '   - experiment_uuid (parâmetro nomeado - compatibilidade)';
    RAISE NOTICE '';
END $$;

