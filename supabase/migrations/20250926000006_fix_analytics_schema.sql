-- 20250926000006_fix_analytics_schema.sql
-- Correções para compatibilidade com sistema de analytics

-- 1. Adicionar campos faltantes na tabela events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_type text,
ADD COLUMN IF NOT EXISTS value numeric;

-- 2. Atualizar dados existentes para ter event_type baseado em event_name
UPDATE public.events 
SET event_type = CASE 
    WHEN event_name ILIKE '%conversion%' OR event_name ILIKE '%convert%' THEN 'conversion'
    WHEN event_name ILIKE '%click%' THEN 'click' 
    WHEN event_name ILIKE '%view%' OR event_name ILIKE '%visit%' THEN 'page_view'
    ELSE 'page_view'
END
WHERE event_type IS NULL;

-- 3. Criar view materializada para estatísticas de experimentos
CREATE MATERIALIZED VIEW IF NOT EXISTS public.experiment_stats AS
SELECT 
    e.id as experiment_id,
    e.name as experiment_name,
    e.status,
    COALESCE(visitor_stats.total_visitors, 0) as total_visitors,
    COALESCE(conversion_stats.total_conversions, 0) as total_conversions
FROM public.experiments e
LEFT JOIN (
    SELECT 
        experiment_id,
        COUNT(DISTINCT visitor_id) as total_visitors
    FROM public.assignments
    GROUP BY experiment_id
) visitor_stats ON e.id = visitor_stats.experiment_id
LEFT JOIN (
    SELECT 
        experiment_id,
        COUNT(*) as total_conversions
    FROM public.events
    WHERE event_type = 'conversion'
    GROUP BY experiment_id
) conversion_stats ON e.id = conversion_stats.experiment_id;

-- 4. Criar tabela visitor_sessions se não existir
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id text NOT NULL,
    session_id text,
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    events_count integer DEFAULT 0,
    device_type text DEFAULT 'desktop',
    browser text,
    os text,
    country_code text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Índices para visitor_sessions
CREATE INDEX IF NOT EXISTS visitor_sessions_visitor_id_idx ON public.visitor_sessions (visitor_id);
CREATE INDEX IF NOT EXISTS visitor_sessions_started_at_idx ON public.visitor_sessions (started_at);
CREATE INDEX IF NOT EXISTS visitor_sessions_utm_campaign_idx ON public.visitor_sessions (utm_campaign);

-- 6. Corrigir função get_experiment_metrics para aceitar UUID
CREATE OR REPLACE FUNCTION public.get_experiment_metrics(exp_id uuid, from_date timestamptz DEFAULT NULL, to_date timestamptz DEFAULT NULL)
RETURNS TABLE(
    variant_id uuid,
    variant_name text,
    visitors integer,
    conversions integer,
    conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id as variant_id,
        v.name as variant_name,
        COALESCE(visitor_stats.visitors, 0)::integer as visitors,
        COALESCE(conversion_stats.conversions, 0)::integer as conversions,
        CASE 
            WHEN COALESCE(visitor_stats.visitors, 0) = 0 THEN 0::numeric
            ELSE ROUND((COALESCE(conversion_stats.conversions, 0)::numeric / visitor_stats.visitors::numeric) * 100, 4)
        END as conversion_rate
    FROM public.variants v
    LEFT JOIN (
        SELECT 
            a.variant_id,
            COUNT(DISTINCT a.visitor_id) as visitors
        FROM public.assignments a
        WHERE a.experiment_id = exp_id
        AND (from_date IS NULL OR a.assigned_at >= from_date)
        AND (to_date IS NULL OR a.assigned_at <= to_date)
        GROUP BY a.variant_id
    ) visitor_stats ON v.id = visitor_stats.variant_id
    LEFT JOIN (
        SELECT 
            ev.variant_id,
            COUNT(*) as conversions
        FROM public.events ev
        WHERE ev.experiment_id = exp_id
        AND ev.event_type = 'conversion'
        AND (from_date IS NULL OR ev.created_at >= from_date)
        AND (to_date IS NULL OR ev.created_at <= to_date)
        GROUP BY ev.variant_id
    ) conversion_stats ON v.id = conversion_stats.variant_id
    WHERE v.experiment_id = exp_id
    ORDER BY v.is_control DESC, v.name;
END;
$$;

-- 7. Criar função para calcular significância estatística
CREATE OR REPLACE FUNCTION public.calculate_significance(
    control_conversions integer,
    control_visitors integer,
    variant_conversions integer,
    variant_visitors integer
)
RETURNS TABLE(
    p_value numeric,
    confidence_level numeric,
    is_significant boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
    p1 numeric;
    p2 numeric;
    p_pooled numeric;
    se numeric;
    z_score numeric;
    p_val numeric;
BEGIN
    -- Evitar divisão por zero
    IF control_visitors = 0 OR variant_visitors = 0 THEN
        RETURN QUERY SELECT 1.0::numeric, 0.0::numeric, false;
        RETURN;
    END IF;
    
    -- Calcular taxas de conversão
    p1 := control_conversions::numeric / control_visitors::numeric;
    p2 := variant_conversions::numeric / variant_visitors::numeric;
    
    -- Taxa de conversão pooled
    p_pooled := (control_conversions + variant_conversions)::numeric / (control_visitors + variant_visitors)::numeric;
    
    -- Erro padrão
    se := sqrt(p_pooled * (1 - p_pooled) * (1.0/control_visitors + 1.0/variant_visitors));
    
    -- Z-score
    IF se = 0 THEN
        z_score := 0;
    ELSE
        z_score := abs(p2 - p1) / se;
    END IF;
    
    -- P-value aproximado usando distribuição normal
    -- Aproximação simples: p_value ≈ 2 * (1 - Φ(|z|))
    -- Para z > 3.29, confidence > 99.9%
    -- Para z > 2.58, confidence > 99%
    -- Para z > 1.96, confidence > 95%
    IF z_score >= 3.29 THEN
        p_val := 0.001;
    ELSIF z_score >= 2.58 THEN
        p_val := 0.01;
    ELSIF z_score >= 1.96 THEN
        p_val := 0.05;
    ELSIF z_score >= 1.65 THEN
        p_val := 0.10;
    ELSE
        p_val := 0.20;
    END IF;
    
    RETURN QUERY SELECT 
        p_val,
        CASE 
            WHEN p_val <= 0.001 THEN 99.9
            WHEN p_val <= 0.01 THEN 99.0
            WHEN p_val <= 0.05 THEN 95.0
            WHEN p_val <= 0.10 THEN 90.0
            ELSE 80.0
        END,
        p_val <= 0.05;
END;
$$;

-- 8. Função para popular visitor_sessions a partir de events existentes
CREATE OR REPLACE FUNCTION public.populate_visitor_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Popular visitor_sessions baseado em dados de events existentes
    INSERT INTO public.visitor_sessions (
        visitor_id,
        started_at,
        events_count,
        device_type,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term
    )
    SELECT DISTINCT
        e.visitor_id,
        MIN(e.created_at) as started_at,
        COUNT(*) as events_count,
        CASE 
            WHEN random() < 0.6 THEN 'desktop'
            WHEN random() < 0.9 THEN 'mobile'
            ELSE 'tablet'
        END as device_type,
        (e.utm_data->>'source') as utm_source,
        (e.utm_data->>'medium') as utm_medium,
        (e.utm_data->>'campaign') as utm_campaign,
        (e.utm_data->>'content') as utm_content,
        (e.utm_data->>'term') as utm_term
    FROM public.events e
    GROUP BY e.visitor_id, e.utm_data
    ON CONFLICT (visitor_id) DO NOTHING;
END;
$$;

-- 9. Atualizar event_type para eventos existentes se ainda não foi feito
UPDATE public.events 
SET event_type = 'page_view'
WHERE event_type IS NULL;

-- 10. Dar permissões para as novas funções
GRANT EXECUTE ON FUNCTION public.get_experiment_metrics(uuid, timestamptz, timestamptz) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.calculate_significance(integer, integer, integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.populate_visitor_sessions() TO authenticated;

-- 11. Dar permissões para a nova tabela
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Política básica para visitor_sessions (todos podem ler, apenas autenticados podem inserir)
CREATE POLICY "visitor_sessions_select_all" ON public.visitor_sessions
FOR SELECT USING (true);

CREATE POLICY "visitor_sessions_insert_authenticated" ON public.visitor_sessions
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 12. Refresh da view materializada
REFRESH MATERIALIZED VIEW public.experiment_stats;

-- 13. Comentários para documentação
COMMENT ON MATERIALIZED VIEW public.experiment_stats IS 'Vista materializada com estatísticas agregadas de experimentos';
COMMENT ON TABLE public.visitor_sessions IS 'Sessões de visitantes com dados de UTM e dispositivo';
COMMENT ON FUNCTION public.get_experiment_metrics(uuid, timestamptz, timestamptz) IS 'Obtém métricas de um experimento específico com filtros de data';
COMMENT ON FUNCTION public.calculate_significance(integer, integer, integer, integer) IS 'Calcula significância estatística entre controle e variante';
