-- ============================================================================
-- FIX: Adicionar coluna last_updated à tabela variant_stats (se não existir)
-- ============================================================================
-- Data: 17/10/2025
-- Problema: ERROR 42703: column "last_updated" does not exist
-- Causa: Tabela variant_stats pode ter sido criada sem a coluna last_updated
-- Solução: Adicionar coluna se não existir e atualizar funções RPC
-- ============================================================================

-- 1. Adicionar coluna last_updated se não existir
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
        
        RAISE NOTICE 'Coluna last_updated adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna last_updated já existe';
    END IF;
END $$;

-- 2. Adicionar comentário na coluna
COMMENT ON COLUMN public.variant_stats.last_updated IS 'Data e hora da última atualização das estatísticas';

-- 3. Criar/recriar índice para performance
DROP INDEX IF EXISTS idx_variant_stats_updated;
CREATE INDEX idx_variant_stats_updated ON public.variant_stats(last_updated);

-- 4. Atualizar registros existentes sem last_updated
UPDATE public.variant_stats 
SET last_updated = NOW() 
WHERE last_updated IS NULL;

-- 5. Recriar função increment_variant_visitors com tratamento correto
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

COMMENT ON FUNCTION public.increment_variant_visitors IS 'Incrementa contador de visitantes de uma variante';

-- 6. Recriar função increment_variant_conversions com tratamento correto
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

COMMENT ON FUNCTION public.increment_variant_conversions IS 'Incrementa contador de conversões e receita de uma variante';

-- 7. Verificação final
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'variant_stats' 
        AND column_name = 'last_updated'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ Coluna last_updated existe e está configurada corretamente';
    ELSE
        RAISE EXCEPTION '❌ Falha: Coluna last_updated não foi criada';
    END IF;
END $$;

-- 8. Log de conclusão
DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Migration completada com sucesso!';
    RAISE NOTICE '📊 Tabela variant_stats atualizada';
    RAISE NOTICE '🔧 Funções RPC atualizadas';
    RAISE NOTICE '📅 Data: %', NOW();
    RAISE NOTICE '================================================';
END $$;

