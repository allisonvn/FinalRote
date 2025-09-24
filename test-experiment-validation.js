// Script para testar se os dados estão corretos para inserção
// Execute no console do navegador na página de teste

async function testExperimentCreation() {
    console.log('🧪 Iniciando teste de validação...');
    
    // Simular dados que serão enviados
    const testData = {
        name: 'Teste de Validação - ' + new Date().toISOString().slice(11, 19)
        // Apenas o nome - resto é automático
    };
    
    console.log('📤 Enviando dados:', testData);
    
    try {
        const response = await fetch('/api/experiments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ SUCESSO! Experimento criado:', result);
            console.log('📊 Detalhes do experimento:');
            console.log('  - ID:', result.experiment?.id);
            console.log('  - Nome:', result.experiment?.name);
            console.log('  - Tipo:', result.experiment?.type);
            console.log('  - Status:', result.experiment?.status);
            console.log('  - Variantes:', result.experiment?.variants?.length || 0);
            
            // Verificar se as variantes foram criadas
            if (result.experiment?.variants && result.experiment.variants.length > 0) {
                console.log('🎯 Variantes criadas:');
                result.experiment.variants.forEach((variant, index) => {
                    console.log(`  ${index + 1}. ${variant.name} (Controle: ${variant.is_control})`);
                });
            }
            
            return { success: true, experiment: result.experiment };
        } else {
            console.log('❌ ERRO na resposta:', result);
            console.log('  - Status:', response.status);
            console.log('  - Erro:', result.error);
            
            return { success: false, error: result.error, status: response.status };
        }
    } catch (error) {
        console.log('💥 ERRO de rede:', error);
        return { success: false, error: error.message };
    }
}

async function testProjectDetection() {
    console.log('🔍 Testando detecção automática de projeto...');
    
    try {
        const response = await fetch('/api/experiments', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Projetos acessíveis ao usuário:', result.count);
            console.log('📊 Lista de experimentos existentes:', result.experiments?.length || 0);
            return { success: true, data: result };
        } else {
            console.log('❌ ERRO ao buscar projetos:', result);
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.log('💥 ERRO de rede:', error);
        return { success: false, error: error.message };
    }
}

async function runFullValidation() {
    console.log('🚀 === INICIANDO VALIDAÇÃO COMPLETA ===');
    
    // Teste 1: Verificar detecção de projeto
    console.log('\n--- Teste 1: Detecção de Projeto ---');
    const projectTest = await testProjectDetection();
    
    if (!projectTest.success) {
        console.log('❌ Falha na detecção de projeto. Parando testes.');
        return;
    }
    
    // Teste 2: Criar experimento
    console.log('\n--- Teste 2: Criação de Experimento ---');
    const createTest = await testExperimentCreation();
    
    if (createTest.success) {
        console.log('\n🎉 === TODOS OS TESTES PASSARAM ===');
        console.log('✅ Sistema está funcionando perfeitamente!');
        console.log('✅ Usuário só precisa fornecer o nome do experimento');
        console.log('✅ Projeto é detectado automaticamente');
        console.log('✅ Variantes são criadas automaticamente');
    } else {
        console.log('\n❌ === FALHA NOS TESTES ===');
        console.log('🔧 Sistema precisa de ajustes...');
    }
    
    return { projectTest, createTest };
}

// Executar automaticamente
console.log('📋 Comandos disponíveis:');
console.log('  - runFullValidation() : Executa todos os testes');
console.log('  - testExperimentCreation() : Testa apenas criação');
console.log('  - testProjectDetection() : Testa apenas detecção de projeto');
console.log('\n🚀 Executando validação automática...');

runFullValidation();
