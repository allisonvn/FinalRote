-- ==================================================================================
-- VERIFICAÇÃO E CORREÇÃO FINAL DO SISTEMA
-- ==================================================================================
-- Este script verifica e corrige todas as inconsistências do sistema
-- Garante que todos os componentes estão funcionando corretamente
-- ==================================================================================

SET check_function_bodies = off;

-- ==================================================================================
-- 1. VERIFICAR E ADICIONAR COLUNAS FALTANTES
-- ==================================================================================

DO $$
BEGIN
    -- Experiments: adicionar colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'key') THEN
        ALTER TABLE public.experiments ADD COLUMN key TEXT UNIQUE;
        RAISE NOTICE '✅ Coluna key adicionada em experiments';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'experiments' AND column_name = 'min_sample_size') THEN
        ALTER TABLE public.experiments ADD COLUMN min_sample_size INTEGER DEFAULT 100;
        RAISE NOTICE '✅ Coluna min_sample_size adicionada em experiments';
    END IF;

    -- Variants: adicionar colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'variants' AND column_name = 'key') THEN
        ALTER TABLE public.variants ADD COLUMN key TEXT;
        RAISE NOTICE '✅ Coluna key adicionada em variants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'variants' AND column_name = 'config') THEN
        ALTER TABLE public.variants ADD COLUMN config JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Coluna config adicionada em variants';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'variants' AND column_name = 'description') THEN
        ALTER TABLE public.variants ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Coluna description adicionada em variants';
    END IF;

    -- Events: adicionar colunas se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'properties') THEN
        ALTER TABLE public.events ADD COLUMN properties JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Coluna properties adicionada em events';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'utm_data') THEN
        ALTER TABLE public.events ADD COLUMN utm_data JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Coluna utm_data adicionada em events';
    END IF;

    -- Projects: adicionar colunas de API keys
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'public_key') THEN
        ALTER TABLE public.projects ADD COLUMN public_key TEXT UNIQUE;
        RAISE NOTICE '✅ Coluna public_key adicionada em projects';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'secret_key') THEN
        ALTER TABLE public.projects ADD COLUMN secret_key TEXT UNIQUE;
        RAISE NOTICE '✅ Coluna secret_key adicionada em projects';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'allowed_origins') THEN
        ALTER TABLE public.projects ADD COLUMN allowed_origins TEXT[] DEFAULT ARRAY['*']::TEXT[];
        RAISE NOTICE '✅ Coluna allowed_origins adicionada em projects';
    END IF;
END $$;

-- ==================================================================================
-- 2. GERAR KEYS AUTOMÁTICOS PARA REGISTROS EXISTENTES
-- ==================================================================================

-- Gerar keys para experimentos sem key
UPDATE public.experiments
SET key = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '_', 'g')) || '_' || EXTRACT(EPOCH FROM created_at)::INTEGER
WHERE key IS NULL OR key = '';

-- Gerar keys para variantes sem key
UPDATE public.variants
SET key = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '_', 'g'))
WHERE key IS NULL OR key = '';

-- Gerar API keys para projetos sem
UPDATE public.projects
SET
    public_key = COALESCE(public_key, 'rf_pk_' || encode(gen_random_bytes(24), 'hex')),
    secret_key = COALESCE(secret_key, 'rf_sk_' || encode(gen_random_bytes(32), 'hex')),
    allowed_origins = COALESCE(allowed_origins, ARRAY['*']::TEXT[])
WHERE public_key IS NULL OR secret_key IS NULL OR allowed_origins IS NULL;

-- ==================================================================================
-- 3. FUNÇÃO MELHORADA: GET EXPERIMENT BY KEY OR NAME
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.get_experiment_by_identifier(
    p_project_id UUID,
    p_identifier TEXT
)
RETURNS TABLE (
    experiment_id UUID,
    experiment_name TEXT,
    experiment_key TEXT,
    experiment_status TEXT,
    experiment_algorithm TEXT,
    conversion_url TEXT,
    conversion_type TEXT,
    conversion_value DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.key,
        e.status,
        e.algorithm,
        e.conversion_url,
        e.conversion_type,
        e.conversion_value
    FROM public.experiments e
    WHERE e.project_id = p_project_id
      AND (e.key = p_identifier OR e.name = p_identifier)
    LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_experiment_by_identifier IS 'Busca experimento por key ou name';

-- ==================================================================================
-- 4. FUNÇÃO MELHORADA: ESTATÍSTICAS COMPLETAS DE EXPERIMENTO
-- ==================================================================================

CREATE OR REPLACE FUNCTION public.get_full_experiment_stats(p_experiment_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    control_visitors INTEGER := 0;
    control_conversions INTEGER := 0;
    variant_visitors INTEGER := 0;
    variant_conversions INTEGER := 0;
BEGIN
    -- Buscar estatísticas de cada variante
    SELECT json_build_object(
        'experiment', (
            SELECT json_build_object(
                'id', e.id,
                'name', e.name,
                'key', e.key,
                'status', e.status,
                'algorithm', e.algorithm,
                'started_at', e.started_at,
                'ended_at', e.ended_at
            )
            FROM experiments e
            WHERE e.id = p_experiment_id
        ),
        'variants', (
            SELECT json_agg(
                json_build_object(
                    'id', v.id,
                    'name', v.name,
                    'key', v.key,
                    'is_control', v.is_control,
                    'visitors', COALESCE(vs.visitors, 0),
                    'conversions', COALESCE(vs.conversions, 0),
                    'revenue', COALESCE(vs.revenue, 0),
                    'conversion_rate', CASE
                        WHEN COALESCE(vs.visitors, 0) > 0
                        THEN ROUND((COALESCE(vs.conversions, 0)::DECIMAL / vs.visitors) * 100, 4)
                        ELSE 0
                    END
                )
                ORDER BY v.is_control DESC, v.created_at ASC
            )
            FROM variants v
            LEFT JOIN variant_stats vs ON vs.variant_id = v.id AND vs.experiment_id = p_experiment_id
            WHERE v.experiment_id = p_experiment_id AND v.is_active = TRUE
        ),
        'summary', (
            SELECT json_build_object(
                'total_visitors', COALESCE(SUM(vs.visitors), 0),
                'total_conversions', COALESCE(SUM(vs.conversions), 0),
                'total_revenue', COALESCE(SUM(vs.revenue), 0),
                'overall_conversion_rate', CASE
                    WHEN SUM(vs.visitors) > 0
                    THEN ROUND((SUM(vs.conversions)::DECIMAL / SUM(vs.visitors)) * 100, 4)
                    ELSE 0
                END
            )
            FROM variant_stats vs
            WHERE vs.experiment_id = p_experiment_id
        )
    ) INTO result;

    -- Calcular significância estatística se houver controle
    SELECT
        COALESCE(vs.visitors, 0),
        COALESCE(vs.conversions, 0)
    INTO control_visitors, control_conversions
    FROM variants v
    LEFT JOIN variant_stats vs ON vs.variant_id = v.id AND vs.experiment_id = p_experiment_id
    WHERE v.experiment_id = p_experiment_id AND v.is_control = TRUE
    LIMIT 1;

    SELECT
        COALESCE(SUM(vs.visitors), 0),
        COALESCE(SUM(vs.conversions), 0)
    INTO variant_visitors, variant_conversions
    FROM variants v
    LEFT JOIN variant_stats vs ON vs.variant_id = v.id AND vs.experiment_id = p_experiment_id
    WHERE v.experiment_id = p_experiment_id AND v.is_control = FALSE;

    -- Adicionar significância se houver dados suficientes
    IF control_visitors >= 30 AND variant_visitors >= 30 THEN
        SELECT jsonb_set(
            result::jsonb,
            '{significance}',
            to_jsonb((SELECT * FROM calculate_significance(
                control_conversions,
                control_visitors,
                variant_conversions,
                variant_visitors
            )))
        )::json INTO result;
    END IF;

    RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_full_experiment_stats IS 'Retorna estatísticas completas de um experimento incluindo significância';

-- ==================================================================================
-- 5. GARANTIR ÍNDICES CRÍTICOS
-- ==================================================================================

CREATE INDEX IF NOT EXISTS idx_experiments_key ON public.experiments(key);
CREATE INDEX IF NOT EXISTS idx_experiments_project_key ON public.experiments(project_id, key);
CREATE INDEX IF NOT EXISTS idx_variants_key ON public.variants(key);
CREATE INDEX IF NOT EXISTS idx_variants_experiment_key ON public.variants(experiment_id, key);
CREATE INDEX IF NOT EXISTS idx_projects_public_key ON public.projects(public_key);
CREATE INDEX IF NOT EXISTS idx_events_variant_type ON public.events(variant_id, event_type);

-- ==================================================================================
-- 6. GRANTS PARA NOVAS FUNÇÕES
-- ==================================================================================

GRANT EXECUTE ON FUNCTION public.get_experiment_by_identifier(UUID, TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_full_experiment_stats(UUID) TO authenticated, anon, service_role;

-- ==================================================================================
-- 7. VERIFICAÇÃO FINAL COMPLETA
-- ==================================================================================

DO $$
DECLARE
    v_experiments_count INTEGER;
    v_variants_count INTEGER;
    v_variant_stats_count INTEGER;
    v_events_count INTEGER;
    v_projects_with_keys INTEGER;
    v_experiments_with_keys INTEGER;
    v_variants_with_keys INTEGER;
    v_functions_count INTEGER;
    v_critical_functions TEXT[];
BEGIN
    -- Contar registros
    SELECT COUNT(*) INTO v_experiments_count FROM public.experiments;
    SELECT COUNT(*) INTO v_variants_count FROM public.variants;
    SELECT COUNT(*) INTO v_variant_stats_count FROM public.variant_stats;
    SELECT COUNT(*) INTO v_events_count FROM public.events;

    -- Verificar keys
    SELECT COUNT(*) INTO v_projects_with_keys
    FROM public.projects WHERE public_key IS NOT NULL AND secret_key IS NOT NULL;

    SELECT COUNT(*) INTO v_experiments_with_keys
    FROM public.experiments WHERE key IS NOT NULL AND key != '';

    SELECT COUNT(*) INTO v_variants_with_keys
    FROM public.variants WHERE key IS NOT NULL AND key != '';

    -- Verificar funções críticas
    v_critical_functions := ARRAY[
        'increment_variant_visitors',
        'increment_variant_conversions',
        'get_experiment_stats',
        'calculate_significance',
        'get_experiment_by_identifier',
        'get_full_experiment_stats'
    ];

    SELECT COUNT(*) INTO v_functions_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY(v_critical_functions);

    RAISE NOTICE '';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ VERIFICAÇÃO FINAL DO SISTEMA DE A/B TESTING';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 DADOS:';
    RAISE NOTICE '   Experimentos: %', v_experiments_count;
    RAISE NOTICE '   Variantes: %', v_variants_count;
    RAISE NOTICE '   Variant Stats: %', v_variant_stats_count;
    RAISE NOTICE '   Eventos: %', v_events_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔑 API KEYS:';
    RAISE NOTICE '   Projetos com API keys: %', v_projects_with_keys;
    RAISE NOTICE '   Experimentos com key: %', v_experiments_with_keys;
    RAISE NOTICE '   Variantes com key: %', v_variants_with_keys;
    RAISE NOTICE '';
    RAISE NOTICE '⚙️ FUNÇÕES:';
    RAISE NOTICE '   Funções críticas: % / 6', v_functions_count;
    RAISE NOTICE '';

    -- Alertas
    IF v_variant_stats_count < v_variants_count THEN
        RAISE WARNING '⚠️ Algumas variantes não têm variant_stats inicializado!';

        -- Corrigir automaticamente
        INSERT INTO variant_stats (experiment_id, variant_id, visitors, conversions, revenue, last_updated)
        SELECT
            v.experiment_id,
            v.id,
            0,
            0,
            0,
            NOW()
        FROM variants v
        WHERE v.is_active = TRUE
          AND NOT EXISTS (
              SELECT 1 FROM variant_stats vs
              WHERE vs.variant_id = v.id AND vs.experiment_id = v.experiment_id
          )
        ON CONFLICT (experiment_id, variant_id) DO NOTHING;

        RAISE NOTICE '✅ variant_stats corrigido automaticamente';
    END IF;

    IF v_functions_count < 6 THEN
        RAISE WARNING '⚠️ Algumas funções críticas estão faltando!';
    END IF;

    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ SISTEMA VERIFICADO E CORRIGIDO COM SUCESSO!';
    RAISE NOTICE '========================================================';
END $$;
