# ✅ Verificação: URLs Sendo Salvas no Supabase

## 🎯 Como Confirmar que as URLs Estão Sendo Salvas

### Método 1: Via Dashboard (Interface Visual)

1. **Crie um novo experimento de teste:**
   - Nome: "Teste de URLs"
   - URL da Página: `https://exemplo.com/pagina-original`
   - Configure as variantes:
     - Controle: usa a URL da página original
     - Variante A: `https://exemplo.com/pagina-variante`
   - Complete todas as etapas

2. **Abra o modal "Detalhes do Experimento"**
   - Clique em "Detalhes" no experimento criado
   - Vá para a aba "URLs e Configurações"
   - **✅ Deve mostrar:**
     ```
     Controle: https://exemplo.com/pagina-original
     Variante A: https://exemplo.com/pagina-variante
     ```

3. **Verifique o Console (F12):**
   ```
   🔍 Buscando dados das variantes para experimento: [id]
   📊 Variantes encontradas: [
     {name: "Controle", redirect_url: "https://exemplo.com/pagina-original"},
     {name: "Variante A", redirect_url: "https://exemplo.com/pagina-variante"}
   ]
   ✅ Dados das variantes processados: [...]
   🎨 Renderizando URLs com dados: [...]
   🔗 URLs encontradas: [
     {name: "Controle", url: "https://exemplo.com/pagina-original"},
     {name: "Variante A", url: "https://exemplo.com/pagina-variante"}
   ]
   ```

### Método 2: Via SQL (Direto no Supabase)

Execute esta query no SQL Editor do Supabase:

```sql
-- Verificar experimentos e suas variantes com URLs
SELECT 
  e.name as experimento,
  e.target_url as url_original,
  v.name as variante,
  v.redirect_url as url_variante,
  v.is_control,
  e.created_at
FROM experiments e
LEFT JOIN variants v ON v.experiment_id = e.id
WHERE e.name LIKE '%teste%'  -- ou filtre pelo nome do seu experimento
ORDER BY e.created_at DESC, v.is_control DESC;
```

**✅ Resultado esperado:**
```
experimento | url_original          | variante    | url_variante          | is_control
-----------|-----------------------|-------------|----------------------|------------
teste      | https://esmalt.com... | Controle    | https://esmalt.com...| true
teste      | https://esmalt.com... | Variante A  | null                 | false
```

### Método 3: Via API (Teste Programático)

Crie um arquivo `test-variant-urls.js`:

```javascript
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://yourproject.supabase.co'
const supabaseKey = 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testVariantUrls() {
  // Buscar um experimento específico
  const { data: experiment } = await supabase
    .from('experiments')
    .select('*')
    .eq('name', 'teste')
    .single()
  
  console.log('📊 Experimento:', experiment)
  console.log('🔗 URL Original:', experiment.target_url)
  
  // Buscar variantes desse experimento
  const { data: variants } = await supabase
    .from('variants')
    .select('*')
    .eq('experiment_id', experiment.id)
    .order('is_control', { ascending: false })
  
  console.log('\n📋 Variantes:')
  variants.forEach(v => {
    console.log(`  - ${v.name}:`)
    console.log(`    URL: ${v.redirect_url || 'Não configurada'}`)
    console.log(`    Controle: ${v.is_control ? 'Sim' : 'Não'}`)
  })
  
  // Verificar se URLs estão salvas
  const urlsConfigured = variants.every(v => 
    v.is_control || v.redirect_url !== null
  )
  
  console.log(`\n${urlsConfigured ? '✅' : '❌'} URLs ${urlsConfigured ? 'estão' : 'NÃO estão'} configuradas corretamente`)
}

testVariantUrls()
```

## 🔴 Sinais de Problema

Se algo não estiver funcionando, você verá:

### No Console do Navegador:
```
❌ Erro ao criar variantes: [mensagem de erro]
❌ Nenhuma variante foi criada!
❌ Erro ao buscar variantes: [mensagem de erro]
```

### No Modal de Detalhes:
- Aba "URLs e Configurações" vazia
- Mensagem: "Nenhuma variante encontrada"
- URLs aparecem como `null` ou não aparecem

### No SQL:
```sql
SELECT * FROM variants WHERE experiment_id = 'seu-experimento-id';
-- Retorna 0 resultados ou redirect_url = null
```

## ✅ Sinais de Sucesso

### No Console do Navegador:
```
✅ Variantes criadas com sucesso: [array com 2 variantes]
✅ 2 de 2 variantes atualizadas com sucesso
📋 Variantes encontradas: [array com dados completos]
🔗 URLs encontradas: [array com URLs válidas]
```

### No Modal de Detalhes:
- Aba "URLs e Configurações" mostra todas as variantes
- Cada variante tem sua URL exibida
- Links "Abrir URL" funcionam
- Cards coloridos com status "✅ Configurada"

### No SQL:
```sql
SELECT * FROM variants WHERE experiment_id = 'seu-experimento-id';
-- Retorna 2+ resultados com redirect_url preenchidos
```

## 🔧 Resolução de Problemas

### Problema: "URLs não aparecem no modal"

**Causa Possível 1:** Cache do navegador
```bash
# Solução:
- Ctrl/Cmd + Shift + R (recarregar sem cache)
- Ou: Limpar cache do navegador
```

**Causa Possível 2:** Variantes não foram criadas
```sql
-- Verificar no SQL:
SELECT COUNT(*) as total_variantes 
FROM variants 
WHERE experiment_id = 'f026f949-df68-49f1-9ee8-56d2857ae09f';

-- Se retornar 0, as variantes não foram criadas
-- Execute o SQL de criação manual do arquivo SOLUCAO_PROBLEMA_VARIANTES_TESTE.md
```

**Causa Possível 3:** Permissões RLS (Row Level Security)
```sql
-- Verificar se RLS está bloqueando:
SELECT * FROM variants WHERE experiment_id = 'seu-id';

-- Se retornar erro de permissão, ajuste as políticas RLS
```

### Problema: "Experimento é criado mas sem variantes"

Com a correção aplicada, isso **NÃO deve mais acontecer** porque:

1. Sistema valida criação de variantes
2. Se falhar, reverte o experimento automaticamente
3. Mostra erro claro para o usuário

**Se ainda acontecer:**
```typescript
// Verifique os logs no console:
console.log('❌ Erro ao criar variantes:', variantsError)
console.log('❌ Nenhuma variante foi criada!')

// O experimento deve ter sido revertido automaticamente
// Verifique se ele aparece na lista de experimentos
```

## 📊 Monitoramento Contínuo

### Após Cada Criação de Experimento:

1. **Imediatamente após criar:**
   ```
   ✅ Mensagem de sucesso: "Experimento [nome] criado com sucesso!"
   ```

2. **Abra o experimento criado:**
   - Modal deve abrir sem erros
   - Aba "URLs e Configurações" deve carregar
   - URLs devem aparecer

3. **Verifique no SQL (opcional):**
   ```sql
   SELECT e.name, COUNT(v.id) as total_variantes
   FROM experiments e
   LEFT JOIN variants v ON v.experiment_id = e.id
   WHERE e.created_at > NOW() - INTERVAL '1 hour'
   GROUP BY e.id, e.name;
   ```

### Alertas Automáticos (Futuro)

Você pode adicionar um script de monitoramento:

```javascript
// scripts/check-experiments-integrity.js
async function checkExperimentsIntegrity() {
  const { data: experiments } = await supabase
    .from('experiments')
    .select('id, name')
  
  for (const exp of experiments) {
    const { data: variants } = await supabase
      .from('variants')
      .select('id')
      .eq('experiment_id', exp.id)
    
    if (!variants || variants.length === 0) {
      console.error(`⚠️ Experimento ${exp.name} (${exp.id}) não tem variantes!`)
      // Enviar alerta, email, etc.
    }
  }
}

// Executar a cada hora
setInterval(checkExperimentsIntegrity, 60 * 60 * 1000)
```

---

## ✅ Resumo

**Antes das correções:**
- ❌ Variantes podiam falhar silenciosamente
- ❌ Experimentos ficavam sem variantes
- ❌ URLs não eram salvas

**Depois das correções:**
- ✅ Variantes são validadas
- ✅ Experimentos incompletos são revertidos
- ✅ URLs são salvas no Supabase
- ✅ Erros são reportados claramente

**Para ter certeza que está funcionando:**
1. Crie um novo experimento
2. Abra o modal de detalhes
3. Verifique se as URLs aparecem
4. Confirme no SQL do Supabase

---

**Última atualização:** 09/10/2025

