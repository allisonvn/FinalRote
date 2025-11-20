#!/usr/bin/env node

/**
 * Script para diagnosticar erros do dashboard
 * Uso: node diagnose-dashboard-errors.js
 */

const https = require('https');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Iniciando diagnóstico do dashboard...\n');

// Verificação 1: Variáveis de ambiente
console.log('📋 1. Verificando variáveis de ambiente...');
if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL não está definida');
} else {
  console.log(`✅ SUPABASE_URL: ${SUPABASE_URL.substring(0, 30)}...`);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não está definida');
} else {
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
}

// Verificação 2: Conectividade com Supabase
console.log('\n📋 2. Testando conectividade com Supabase...');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData,
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runDiagnostics() {
  try {
    // Teste 1: Verificar se project_settings existe
    console.log('\n📋 3. Verificando tabela project_settings...');
    
    const checkTableSQL = `
      SELECT EXISTS(
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'project_settings'
      ) AS exists;
    `;

    try {
      const result = await makeRequest('POST', '/rest/v1/rpc/execute_sql', {
        query: checkTableSQL,
      });

      if (result.status === 200) {
        console.log('✅ Conseguiu conectar ao Supabase via RPC');
      } else if (result.status === 404) {
        console.log('⚠️ RPC execute_sql não disponível (normal em alguns setups)');
      } else {
        console.log(`⚠️ Status: ${result.status}`);
      }
    } catch (error) {
      console.log('⚠️ Não foi possível usar RPC execute_sql');
    }

    // Teste 2: Verificar funções RPC
    console.log('\n📋 4. Verificando funções RPC...');

    const functions = [
      { name: 'get_experiment_stats', params: {} },
      { name: 'create_project_settings_table_if_not_exists', params: {} },
    ];

    for (const func of functions) {
      try {
        const result = await makeRequest('POST', `/rest/v1/rpc/${func.name}`, func.params);
        
        if (result.status === 200) {
          console.log(`✅ Função ${func.name} disponível`);
        } else if (result.status === 400) {
          console.log(`⚠️ Função ${func.name} existe mas retornou 400 (pode ser parâmetro)`);
        } else if (result.status === 404) {
          console.log(`❌ Função ${func.name} NÃO ENCONTRADA`);
        } else {
          console.log(`⚠️ Função ${func.name} retornou status ${result.status}`);
        }
      } catch (error) {
        console.log(`⚠️ Erro ao testar função ${func.name}: ${error.message}`);
      }
    }

    // Teste 3: Testar acesso a tabelas
    console.log('\n📋 5. Verificando acesso a tabelas...');

    const tables = ['projects', 'experiments', 'variants', 'events', 'project_settings'];

    for (const table of tables) {
      try {
        const result = await makeRequest('GET', `/rest/v1/${table}?limit=1`, null);
        
        if (result.status === 200) {
          console.log(`✅ Tabela ${table} acessível`);
        } else if (result.status === 404) {
          console.log(`❌ Tabela ${table} NÃO ENCONTRADA`);
        } else if (result.status === 403) {
          console.log(`⚠️ Tabela ${table} - Acesso negado`);
        } else {
          console.log(`⚠️ Tabela ${table} - Status ${result.status}`);
        }
      } catch (error) {
        console.log(`⚠️ Erro ao acessar tabela ${table}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error.message);
  }

  // Recomendações
  console.log('\n' + '='.repeat(60));
  console.log('📌 RECOMENDAÇÕES\n');
  console.log('Se você viu ❌ para project_settings:');
  console.log('  1. Execute: node apply-project-settings-migration.js');
  console.log('  2. Ou aplique manualmente em: https://app.supabase.com/project/_/sql/new');
  console.log('  3. Cole o conteúdo de: supabase/migrations/20251119_ensure_project_settings.sql\n');

  console.log('Se você viu ⚠️ para get_experiment_stats:');
  console.log('  1. Execute: supabase/migrations/20251119_fix_rpc_get_experiment_stats.sql\n');

  console.log('Mais informações em: CORRECAO_ERROS_DASHBOARD_19_11_2025.md');
  console.log('='.repeat(60));
}

runDiagnostics();

