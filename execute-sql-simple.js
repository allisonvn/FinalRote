// Script simples para executar SQL no Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lmdnvjqgvqjwhdpqjzmm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZG52anFndnFqd2hkcHFqem1tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTA0MzY0MCwiZXhwIjoyMDUwNjE5NjQwfQ.ZmFzZGZhc2RmYXNkZmFzZGZhc2RmYXNkZmFzZGZh';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL() {
  console.log('🔧 Executando correção do sistema...');
  
  try {
    // Executar as correções em partes menores
    const fixes = [
      // 1. Verificar e corrigir tabela experiments
      `
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
      END $$;
      `,
      
      // 2. Verificar tabela variant_stats
      `
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
      END $$;
      `,
      
      // 3. Função increment_variant_visitors
      `
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
      `,
      
      // 4. Função increment_variant_conversions
      `
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
      `,
      
      // 5. Inicializar variant_stats para variantes existentes
      `
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
      `
    ];
    
    for (let i = 0; i < fixes.length; i++) {
      console.log(`📋 Executando correção ${i + 1}/${fixes.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: fixes[i] });
        
        if (error) {
          console.error(`❌ Erro na correção ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Correção ${i + 1} executada com sucesso`);
        }
      } catch (err) {
        console.error(`❌ Erro na execução da correção ${i + 1}:`, err.message);
      }
    }
    
    console.log('🎉 Correção do sistema finalizada!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar a correção
executeSQL();
