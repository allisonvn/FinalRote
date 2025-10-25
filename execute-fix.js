const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lmdnvjqgvqjwhdpqjzmm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZG52anFndnFqd2hkcHFqem1tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTA0MzY0MCwiZXhwIjoyMDUwNjE5NjQwfQ.ZmFzZGZhc2RmYXNkZmFzZGZhc2RmYXNkZmFzZGZhc2RmYXNkZmFzZGZh';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeFix() {
  console.log('🔧 Iniciando correção completa do sistema...');
  
  try {
    // Ler o arquivo SQL
    const fs = require('fs');
    const sqlContent = fs.readFileSync('./FIX_COMPLETE_SYSTEM.sql', 'utf8');
    
    // Dividir o SQL em partes menores para execução
    const sqlParts = sqlContent.split('-- ==================================================================================');
    
    for (let i = 0; i < sqlParts.length; i++) {
      const part = sqlParts[i].trim();
      if (part && !part.startsWith('CORREÇÃO COMPLETA DO SISTEMA DE A/B TESTING')) {
        console.log(`📋 Executando parte ${i + 1}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql_query: part });
          
          if (error) {
            console.error(`❌ Erro na parte ${i + 1}:`, error.message);
          } else {
            console.log(`✅ Parte ${i + 1} executada com sucesso`);
          }
        } catch (err) {
          console.error(`❌ Erro na execução da parte ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Correção completa finalizada!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar a correção
executeFix();
