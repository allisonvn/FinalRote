#!/usr/bin/env node

/**
 * Script para testar conexão com Supabase e verificar estado das tabelas
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');
  console.log(`URL: ${supabaseUrl}\n`);

  try {
    // Teste 1: Verificar tabela events
    console.log('📊 Verificando tabela events...');
    const { data: events, error: eventsError, count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (eventsError) {
      console.log(`❌ Erro ao buscar events: ${eventsError.message}`);
      console.log(`   Código: ${eventsError.code}`);
      console.log(`   Detalhes: ${JSON.stringify(eventsError.details)}`);
    } else {
      console.log(`✅ Tabela events existe!`);
      console.log(`   Total de eventos: ${count || 0}`);
      console.log(`   Primeiros ${events?.length || 0} eventos:`, events);
    }

    console.log('\n---\n');

    // Teste 2: Verificar tabela experiments
    console.log('🧪 Verificando tabela experiments...');
    const { data: experiments, error: experimentsError } = await supabase
      .from('experiments')
      .select('id, name, status')
      .limit(5);

    if (experimentsError) {
      console.log(`❌ Erro ao buscar experiments: ${experimentsError.message}`);
    } else {
      console.log(`✅ Tabela experiments existe!`);
      console.log(`   Total encontrado: ${experiments?.length || 0}`);
      console.log(`   Experiments:`, experiments);
    }

    console.log('\n---\n');

    // Teste 3: Verificar tabela projects
    console.log('📁 Verificando tabela projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(5);

    if (projectsError) {
      console.log(`❌ Erro ao buscar projects: ${projectsError.message}`);
    } else {
      console.log(`✅ Tabela projects existe!`);
      console.log(`   Total encontrado: ${projects?.length || 0}`);
      console.log(`   Projects:`, projects);
    }

    console.log('\n---\n');

    // Teste 4: Verificar tabela organizations
    console.log('🏢 Verificando tabela organizations...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .limit(5);

    if (orgsError) {
      console.log(`❌ Erro ao buscar organizations: ${orgsError.message}`);
    } else {
      console.log(`✅ Tabela organizations existe!`);
      console.log(`   Total encontrado: ${orgs?.length || 0}`);
      console.log(`   Organizations:`, orgs);
    }

    console.log('\n---\n');
    console.log('✅ Teste de conexão concluído!');

  } catch (err) {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  }
}

testConnection();
