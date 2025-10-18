-- Migration: Adicionar campos de conversão e configuração de experimentos
-- Data: 2025-10-18
-- Descrição: Adiciona campos necessários para rastreamento de conversões

-- =====================================================
-- ADICIONAR CAMPOS FALTANTES NA TABELA EXPERIMENTS
-- =====================================================

-- Adicionar target_url (URL onde o experimento será executado)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='target_url') THEN
        ALTER TABLE experiments ADD COLUMN target_url TEXT;
        COMMENT ON COLUMN experiments.target_url IS 'URL da página onde o experimento será executado';
    END IF;
END $$;

-- Adicionar conversion_url (URL da página de conversão/sucesso)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_url') THEN
        ALTER TABLE experiments ADD COLUMN conversion_url TEXT;
        COMMENT ON COLUMN experiments.conversion_url IS 'URL da página de conversão/sucesso (ex: /obrigado)';
    END IF;
END $$;

-- Adicionar conversion_type (tipo de conversão: page_view, click, form_submit)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_type') THEN
        ALTER TABLE experiments ADD COLUMN conversion_type TEXT DEFAULT 'page_view';
        COMMENT ON COLUMN experiments.conversion_type IS 'Tipo de conversão: page_view, click, form_submit';
    END IF;
END $$;

-- Adicionar conversion_value (valor monetário da conversão)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_value') THEN
        ALTER TABLE experiments ADD COLUMN conversion_value NUMERIC(10,2) DEFAULT 0.00;
        COMMENT ON COLUMN experiments.conversion_value IS 'Valor monetário de cada conversão (R$)';
    END IF;
END $$;

-- Adicionar duration_days (duração planejada do experimento)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='duration_days') THEN
        ALTER TABLE experiments ADD COLUMN duration_days INTEGER DEFAULT 14;
        COMMENT ON COLUMN experiments.duration_days IS 'Duração planejada do experimento em dias';
    END IF;
END $$;

-- =====================================================
-- INDICES PARA PERFORMANCE
-- =====================================================

-- Índice para busca por conversion_url (usado no rastreamento)
CREATE INDEX IF NOT EXISTS idx_experiments_conversion_url
ON experiments(conversion_url)
WHERE conversion_url IS NOT NULL;

-- Índice para busca por target_url
CREATE INDEX IF NOT EXISTS idx_experiments_target_url
ON experiments(target_url)
WHERE target_url IS NOT NULL;

-- =====================================================
-- ATUALIZAR EXPERIMENTOS EXISTENTES
-- =====================================================

-- Atualizar conversion_type padrão para experimentos existentes
UPDATE experiments
SET conversion_type = 'page_view'
WHERE conversion_type IS NULL;

-- Atualizar conversion_value padrão para experimentos existentes
UPDATE experiments
SET conversion_value = 0.00
WHERE conversion_value IS NULL;

-- Atualizar duration_days padrão para experimentos existentes
UPDATE experiments
SET duration_days = 14
WHERE duration_days IS NULL;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE experiments IS 'Experimentos A/B com suporte a MAB e rastreamento de conversões';

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se todos os campos foram adicionados corretamente
DO $$
DECLARE
    missing_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='target_url') THEN
        missing_fields := array_append(missing_fields, 'target_url');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_url') THEN
        missing_fields := array_append(missing_fields, 'conversion_url');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_type') THEN
        missing_fields := array_append(missing_fields, 'conversion_type');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='conversion_value') THEN
        missing_fields := array_append(missing_fields, 'conversion_value');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='experiments' AND column_name='duration_days') THEN
        missing_fields := array_append(missing_fields, 'duration_days');
    END IF;

    IF array_length(missing_fields, 1) > 0 THEN
        RAISE EXCEPTION 'ERRO: Campos faltando na tabela experiments: %', array_to_string(missing_fields, ', ');
    ELSE
        RAISE NOTICE '✅ Todos os campos de conversão foram adicionados com sucesso!';
    END IF;
END $$;
