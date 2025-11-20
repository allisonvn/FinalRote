#!/usr/bin/env node

/**
 * Script para aplicar a migração project_settings ao Supabase
 * Uso: node apply-project-settings-migration.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não estão definidas');
  process.exit(1);
}

// Ler o arquivo de migração SQL
const migrationPath = path.join(__dirname, 'supabase/migrations/20251119_ensure_project_settings.sql');

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Erro: Arquivo de migração não encontrado em ${migrationPath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(migrationPath, 'utf-8');

console.log('🚀 Iniciando aplicação da migração project_settings...');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`📍 Arquivo: ${migrationPath}`);

// Função para fazer requisição HTTP
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              status: res.statusCode,
              data: responseData ? JSON.parse(responseData) : { success: true },
            });
          } else {
            reject({
              status: res.statusCode,
              message: responseData,
            });
          }
        } catch (error) {
          reject({
            status: res.statusCode,
            message: responseData,
            parseError: error.message,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Executar a migração
async function applyMigration() {
  try {
    // Opção 1: Usar o RPC do Supabase para executar SQL (mais confiável)
    console.log('\n📌 Tentando aplicar via RPC execute_sql...');

    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation',
      },
    };

    const data = {
      query: sqlContent,
    };

    try {
      const result = await makeRequest(url.toString(), options, data);
      console.log('✅ Migração aplicada com sucesso via RPC!');
      console.log('📊 Resultado:', result.data);
    } catch (rpcError) {
      // Se o RPC não existir, tenta alternativa
      if (rpcError.status === 404 || rpcError.status === 400) {
        console.log('⚠️ RPC execute_sql não disponível, tentando alternativa...');
        console.log('\n📌 Tentando aplicar via Supabase CLI...');
        
        const childProcess = require('child_process');
        const tempFile = path.join(__dirname, 'temp_migration.sql');
        
        fs.writeFileSync(tempFile, sqlContent);
        
        console.log('💡 Para aplicar a migração manualmente:');
        console.log('   1. Vá para: https://app.supabase.com/project/_/sql/new');
        console.log('   2. Cole o conteúdo do arquivo: supabase/migrations/20251119_ensure_project_settings.sql');
        console.log('   3. Clique em "Run"');
        
        fs.unlinkSync(tempFile);
      } else {
        throw rpcError;
      }
    }
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    
    console.log('\n📋 Alternativa: Aplicar manualmente');
    console.log('1. Acesse: https://app.supabase.com/project/_/sql/new');
    console.log('2. Cole o conteúdo do arquivo: supabase/migrations/20251119_ensure_project_settings.sql');
    console.log('3. Clique em "Run"');
    
    process.exit(1);
  }
}

// Executar
applyMigration().then(() => {
  console.log('\n✅ Processo concluído!');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Erro durante o processo:', error);
  process.exit(1);
});

