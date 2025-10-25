# 🔧 Instruções para Execução Manual no Supabase

## ⚠️ IMPORTANTE: Execute estas instruções no Supabase Dashboard

### Passo 1: Acessar o Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `lmdnvjqgvqjwhdpqjzmm`
4. Vá para **SQL Editor** no menu lateral

### Passo 2: Executar as Correções

#### Correção 1: Verificar e Corrigir Tabela Experiments
```sql
DO $$
BEGIN
    -- Adicionar coluna algorithm se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'experiments' AND column_name = 'algorithm'
    ) THEN
        ALTER TABLE experiments ADD COLUMN algorithm TEXT DEFAULT 'uniform';
        RAISE NOTICE '✅ Coluna algorithm adicionada';
    END IF;

    -- Adicionar campos de conversão se não existirem
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
```

#### Correção 2: Verificar e Corrigir Tabela Variant Stats
```sql
DO $$
BEGIN
    -- Criar tabela se não existir
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

    -- Adicionar coluna last_updated se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'variant_stats' AND column_name = 'last_updated'
    ) THEN
        ALTER TABLE variant_stats ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Coluna last_updated adicionada em variant_stats';
    END IF;

    -- Adicionar coluna revenue se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'variant_stats' AND column_name = 'revenue'
    ) THEN
        ALTER TABLE variant_stats ADD COLUMN revenue DECIMAL(12,2) NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Coluna revenue adicionada em variant_stats';
    END IF;
END $$;
```

#### Correção 3: Criar Função increment_variant_visitors
```sql
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
```

#### Correção 4: Criar Função increment_variant_conversions
```sql
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
```

#### Correção 5: Inicializar Variant Stats para Variantes Existentes
```sql
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
```

### Passo 3: Verificar se as Correções Funcionaram

Execute esta query para verificar o status:

```sql
DO $$
DECLARE
    v_variant_stats_count INTEGER;
    v_functions_count INTEGER;
BEGIN
    -- Contar variant_stats inicializados
    SELECT COUNT(*) INTO v_variant_stats_count FROM variant_stats;

    -- Contar funções RPC
    SELECT COUNT(*) INTO v_functions_count
    FROM pg_proc
    WHERE proname IN (
        'increment_variant_visitors',
        'increment_variant_conversions'
    );

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CORREÇÃO COMPLETA FINALIZADA!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Variant stats inicializados: %', v_variant_stats_count;
    RAISE NOTICE 'Funções RPC criadas: % / 2', v_functions_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    IF v_functions_count < 2 THEN
        RAISE WARNING 'Algumas funções RPC não foram criadas corretamente!';
    END IF;
END $$;
```

### Passo 4: Testar o Sistema

Após executar todas as correções:

1. **Crie um novo experimento** no dashboard
2. **Adicione 2 variantes** ao experimento
3. **Inicie o experimento**
4. **Use o código gerado** para testar
5. **Verifique se as métricas** são atualizadas corretamente

### ✅ Resultado Esperado

Após executar todas as correções:
- ✅ Analytics contabilizando corretamente
- ✅ Testes A/B funcionando perfeitamente
- ✅ Conversões aparecendo no dashboard
- ✅ Estatísticas atualizadas em tempo real
- ✅ Sistema pronto para produção

### 🚨 Se Algo Não Funcionar

Se você encontrar algum erro durante a execução:
1. Copie a mensagem de erro exata
2. Me envie a mensagem
3. Eu ajudarei com diagnóstico adicional

### 📞 Próximos Passos

Após executar as correções:
1. Teste o sistema criando um novo experimento
2. Verifique se as variantes são criadas com variant_stats inicializados
3. Teste o tracking de eventos e conversões
4. Verifique se as métricas são atualizadas corretamente

---

**🎯 Execute estas instruções no Supabase Dashboard e o sistema estará completamente corrigido!**
