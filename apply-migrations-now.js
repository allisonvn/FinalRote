#!/usr/bin/env node

/**
 * Script para aplicar migrações diretamente via Supabase REST API
 * Não requer dotenv instalado
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente do .env.local manualmente
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não estão definidas');
  console.error('💡 Verifique seu arquivo .env.local');
  process.exit(1);
}

// Função para fazer requisição HTTP
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData,
          headers: res.headers,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

// Executar migração SQL
async function executeMigration(migrationName, sqlContent) {
  console.log(`\n📋 Executando: ${migrationName}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Tentar via RPC execute_sql se existir
    const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/execute_sql`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Prefer': 'return=representation',
      },
    };

    const payload = JSON.stringify({ query: sqlContent });

    try {
      const result = await makeRequest(rpcUrl, options, payload);
      
      if (result.status === 200 || result.status === 201) {
        console.log(`✅ ${migrationName} aplicada com sucesso via RPC!`);
        if (result.data) {
          try {
            const parsed = JSON.parse(result.data);
            if (parsed.length > 0) {
              console.log(`📊 Resultado: ${JSON.stringify(parsed[0], null, 2)}`);
            }
          } catch (e) {
            // Não é JSON, tudo bem
          }
        }
        return true;
      } else if (result.status === 404) {
        throw new Error('RPC não disponível');
      } else {
        const errorData = result.data ? result.data.substring(0, 200) : 'Sem detalhes';
        throw new Error(`Status ${result.status}: ${errorData}`);
      }
    } catch (rpcError) {
      if (rpcError.message === 'RPC não disponível' || rpcError.code === 'ENOTFOUND') {
        console.log('⚠️ RPC execute_sql não disponível, tentando método alternativo...');
        // Método alternativo: Executar via SQL direto
        console.log('💡 Método alternativo não disponível via REST API.');
        console.log('📝 Por favor, aplique manualmente via Supabase Dashboard:');
        console.log(`   1. Acesse: ${SUPABASE_URL.replace('/rest/v1', '')}/project/_/sql/new`);
        console.log(`   2. Cole o conteúdo de: supabase/migrations/${migrationName}`);
        console.log('   3. Clique em "Run"');
        return false;
      }
      throw rpcError;
    }
  } catch (error) {
    console.error(`❌ Erro ao aplicar ${migrationName}:`, error.message);
    return false;
  }
}

// Aplicar todas as migrações
async function applyAllMigrations() {
  console.log('🚀 Aplicando Migrações do Dashboard Rota Final');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 URL: ${SUPABASE_URL.substring(0, 50)}...`);

  const migrations = [
    {
      file: '20251119_ensure_project_settings.sql',
      name: 'Criar tabela project_settings',
    },
    {
      file: '20251119_create_rpc_helpers.sql',
      name: 'Criar funções RPC auxiliares',
    },
    {
      file: '20251119_fix_rpc_get_experiment_stats.sql',
      name: 'Melhorar função get_experiment_stats',
    },
  ];

  const results = [];

  for (const migration of migrations) {
    const filePath = path.join(__dirname, 'supabase', 'migrations', migration.file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`);
      results.push({ migration: migration.file, success: false });
      continue;
    }

    const sqlContent = fs.readFileSync(filePath, 'utf-8');
    const success = await executeMigration(migration.file, sqlContent);
    results.push({ migration: migration.file, success });

    // Pequeno delay entre migrações
    if (migration !== migrations[migrations.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Resumo final
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO DAS MIGRAÇÕES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  results.forEach(({ migration, success }) => {
    console.log(`${success ? '✅' : '❌'} ${migration}`);
  });

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`\n📈 Total: ${successCount}/${totalCount} migrações aplicadas\n`);

  if (successCount === totalCount) {
    console.log('✅ Todas as migrações foram aplicadas com sucesso!');
    console.log('⏳ Aguarde 2-5 minutos para o schema cache atualizar');
    console.log('🔄 Depois recarregue a página (Cmd+Shift+R)');
  } else if (successCount > 0) {
    console.log('⚠️ Algumas migrações precisam ser aplicadas manualmente');
    console.log('💡 Consulte: CORRECAO_ERROS_DASHBOARD_19_11_2025.md');
  } else {
    console.log('❌ Nenhuma migração foi aplicada automaticamente');
    console.log('💡 Aplique manualmente via Supabase Dashboard');
    console.log('📖 Leia: CORRECAO_ERROS_DASHBOARD_19_11_2025.md');
  }

  return successCount === totalCount;
}

// Executar
applyAllMigrations().then((allSuccess) => {
  process.exit(allSuccess ? 0 : 1);
}).catch((error) => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});

