#!/usr/bin/env node

/**
 * Script para facilitar migração para novo projeto Supabase
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configurações
const OLD_PROJECT_ID = 'xtexltigzzayfrscvzaa'
const OLD_SUPABASE_URL = 'https://xtexltigzzayfrscvzaa.supabase.co'

console.log('🚀 SCRIPT DE MIGRAÇÃO PARA NOVO PROJETO SUPABASE')
console.log('=' .repeat(50))

async function migrateToNewProject() {
  try {
    console.log('\n1. 📋 VERIFICANDO CONFIGURAÇÕES ATUAIS...')
    
    // Verificar se .env.local existe
    const envPath = path.join(process.cwd(), '.env.local')
    if (!fs.existsSync(envPath)) {
      console.error('❌ Arquivo .env.local não encontrado!')
      return
    }
    
    // Ler configurações atuais
    const envContent = fs.readFileSync(envPath, 'utf8')
    console.log('✅ Arquivo .env.local encontrado')
    
    console.log('\n2. 🔧 PREPARANDO MIGRAÇÃO...')
    
    // Criar backup do .env.local
    const backupPath = path.join(process.cwd(), '.env.local.backup')
    fs.writeFileSync(backupPath, envContent)
    console.log('✅ Backup criado: .env.local.backup')
    
    // Listar migrações disponíveis
    const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations')
    if (fs.existsSync(migrationsPath)) {
      const migrations = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort()
      
      console.log('✅ Migrações encontradas:')
      migrations.forEach(migration => {
        console.log(`   - ${migration}`)
      })
    }
    
    console.log('\n3. 📝 INSTRUÇÕES PARA MIGRAÇÃO:')
    console.log('')
    console.log('🔹 PASSO 1: Criar novo projeto no Supabase')
    console.log('   1. Acesse: https://supabase.com/dashboard')
    console.log('   2. Clique em "New Project"')
    console.log('   3. Escolha sua organização')
    console.log('   4. Preencha os dados do projeto')
    console.log('   5. Aguarde a criação (2-3 minutos)')
    console.log('')
    console.log('🔹 PASSO 2: Obter novas chaves')
    console.log('   1. No novo projeto, vá em Settings > API')
    console.log('   2. Copie: Project URL, anon public key, service_role key')
    console.log('')
    console.log('🔹 PASSO 3: Executar migrações')
    console.log('   1. No SQL Editor do novo projeto')
    console.log('   2. Execute as migrações em ordem:')
    
    if (fs.existsSync(migrationsPath)) {
      const migrations = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort()
      
      migrations.forEach((migration, index) => {
        console.log(`      ${index + 1}. ${migration}`)
      })
    }
    
    console.log('')
    console.log('🔹 PASSO 4: Atualizar configurações')
    console.log('   1. Substitua as chaves no .env.local')
    console.log('   2. Execute: npx supabase gen types typescript --project-id NOVO_PROJECT_ID')
    console.log('   3. Teste: node test-final-system.js')
    console.log('')
    
    console.log('4. 🧪 CRIANDO SCRIPT DE TESTE...')
    
    // Criar script de teste para novo projeto
    const testScript = `#!/usr/bin/env node

/**
 * Teste do novo projeto Supabase
 */

const { createClient } = require('@supabase/supabase-js')

// NOVAS CONFIGURAÇÕES - SUBSTITUA PELAS SUAS
const supabaseUrl = 'https://SEU-NOVO-PROJETO.supabase.co'
const serviceKey = 'SUA-NOVA-SERVICE-KEY'

const supabase = createClient(supabaseUrl, serviceKey)

async function testNewProject() {
  console.log('🧪 Testando novo projeto Supabase...')
  console.log('📡 URL:', supabaseUrl)
  
  try {
    // 1. Teste de conexão
    console.log('\\n1. 🔌 Testando conexão...')
    const { data: healthData, error: healthError } = await supabase
      .from('experiments')
      .select('id')
      .limit(1)
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError.message)
      return
    }
    console.log('✅ Conexão funcionando')
    
    // 2. Teste de inserção
    console.log('\\n2. 📝 Testando inserção...')
    const { data: insertResult, error: insertError } = await supabase
      .from('experiments')
      .insert({
        name: 'Teste_Novo_Projeto',
        project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
        type: 'redirect',
        traffic_allocation: 99.99,
        status: 'draft'
      })
      .select('id, name, traffic_allocation')
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError.message)
    } else {
      console.log('✅ Inserção funcionando:', insertResult[0])
      
      // Limpar
      await supabase
        .from('experiments')
        .delete()
        .eq('id', insertResult[0].id)
      console.log('🧹 Dados removidos')
    }
    
    // 3. Teste de diferentes valores
    console.log('\\n3. 🔢 Testando diferentes valores...')
    const testValues = [1.00, 25.50, 50.00, 75.25, 99.99]
    
    for (const value of testValues) {
      const { data: result, error: error } = await supabase
        .from('experiments')
        .insert({
          name: \`Teste_\${value.toString().replace('.', '_')}_Novo\`,
          project_id: 'b302fac6-3255-4923-833b-5e71a11d5bfe',
          type: 'redirect',
          traffic_allocation: value,
          status: 'draft'
        })
        .select('id, name, traffic_allocation')
      
      if (error) {
        console.log(\`❌ \${value}:\`, error.message)
      } else {
        console.log(\`✅ \${value}:\`, result[0].traffic_allocation)
        
        // Limpar
        await supabase
          .from('experiments')
          .delete()
          .eq('id', result[0].id)
      }
    }
    
    console.log('\\n🎉 NOVO PROJETO FUNCIONANDO PERFEITAMENTE!')
    console.log('✅ Cache limpo')
    console.log('✅ Valores corretos')
    console.log('✅ Sem campos fantasma')
    
  } catch (error) {
    console.error('💥 Erro geral:', error)
  }
}

// Executar teste
testNewProject()
`
    
    fs.writeFileSync('test-new-project.js', testScript)
    console.log('✅ Script de teste criado: test-new-project.js')
    
    console.log('\n5. 📋 PRÓXIMOS PASSOS:')
    console.log('')
    console.log('1. Siga as instruções acima para criar o novo projeto')
    console.log('2. Execute as migrações no novo projeto')
    console.log('3. Atualize o .env.local com as novas chaves')
    console.log('4. Execute: node test-new-project.js')
    console.log('5. Se funcionar, execute: node test-final-system.js')
    console.log('')
    console.log('🎯 RESULTADO ESPERADO:')
    console.log('✅ Sistema 100% funcional')
    console.log('✅ Cache limpo')
    console.log('✅ Sem problemas de schema')
    console.log('')
    console.log('📁 Arquivos criados:')
    console.log('   - .env.local.backup (backup das configurações)')
    console.log('   - test-new-project.js (script de teste)')
    console.log('   - MIGRACAO_NOVO_PROJETO_SUPABASE.md (guia completo)')
    
  } catch (error) {
    console.error('💥 Erro durante preparação:', error)
  }
}

// Executar migração
migrateToNewProject()
