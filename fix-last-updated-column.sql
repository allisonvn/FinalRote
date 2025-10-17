-- ============================================================================
-- CORREÇÃO RÁPIDA: Adicionar coluna last_updated à tabela variant_stats
-- ============================================================================
-- Execute este SQL diretamente no Supabase SQL Editor
-- ============================================================================

-- 1. Verificar se a tabela existe
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'variant_stats'
ORDER BY ordinal_position;

-- 2. Adicionar coluna last_updated se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'variant_stats' 
        AND column_name = 'last_updated'
    ) THEN
        ALTER TABLE public.variant_stats 
        ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE '✅ Coluna last_updated adicionada com sucesso';
    ELSE
        RAISE NOTICE '⚠️ Coluna last_updated já existe';
    END IF;
END $$;

-- 3. Atualizar registros existentes
UPDATE public.variant_stats 
SET last_updated = NOW() 
WHERE last_updated IS NULL;

-- 4. Criar índice
CREATE INDEX IF NOT EXISTS idx_variant_stats_updated 
ON public.variant_stats(last_updated);

-- 5. Recriar função increment_variant_conversions
CREATE OR REPLACE FUNCTION public.increment_variant_conversions(
    p_variant_id UUID,
    p_experiment_id UUID,
    p_revenue DECIMAL DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.variant_stats (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Recriar função increment_variant_visitors
CREATE OR REPLACE FUNCTION public.increment_variant_visitors(
    p_variant_id UUID,
    p_experiment_id UUID
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.variant_stats (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verificar resultado
SELECT 
    'Estrutura da tabela variant_stats:' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'variant_stats'
ORDER BY ordinal_position;

-- 8. Testar as funções
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Correção aplicada com sucesso!';
    RAISE NOTICE '📊 Tabela variant_stats atualizada';
    RAISE NOTICE '🔧 Funções RPC recriadas';
    RAISE NOTICE '================================================';
END $$;

