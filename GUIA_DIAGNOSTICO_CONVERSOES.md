# 🔍 GUIA COMPLETO DE DIAGNÓSTICO DE CONVERSÕES

**Data:** 17/10/2025  
**Status:** ✅ Ferramentas Criadas e Prontas para Uso

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Passo 1: Diagnóstico Inicial](#passo-1-diagnóstico-inicial)
3. [Passo 2: Verificar Funções RPC](#passo-2-verificar-funções-rpc)
4. [Passo 3: Inicializar/Corrigir variant_stats](#passo-3-inicializarcorrigir-variant_stats)
5. [Passo 4: Teste de Conversão](#passo-4-teste-de-conversão)
6. [Passo 5: Monitorar Logs do Servidor](#passo-5-monitorar-logs-do-servidor)
7. [Interpretação de Resultados](#interpretação-de-resultados)
8. [Correções Comuns](#correções-comuns)

---

## 🎯 VISÃO GERAL

Este guia vai te ajudar a diagnosticar e corrigir problemas no sistema de rastreamento de conversões. O problema mais comum é:

- ✅ **Visitantes sendo contados** corretamente
- ❌ **Conversões NÃO aparecem** na interface

### O Que Foi Implementado

1. **Scripts SQL de Diagnóstico**
   - `scripts/diagnose-conversions.sql` - Diagnóstico completo
   - `scripts/verify-rpc-functions.sql` - Verificação de funções RPC
   - `scripts/init-variant-stats.sql` - Correção de dados

2. **Logs Detalhados no Backend**
   - `src/app/api/track/route.ts` - Logs completos de conversão
   - Fallback automático se RPC falhar

3. **Página de Teste**
   - `public/test-conversion-debug.html` - Teste completo end-to-end

---

## 🔍 PASSO 1: DIAGNÓSTICO INICIAL

### Execute o Script de Diagnóstico

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo: `scripts/diagnose-conversions.sql`
4. Clique em **Run**

### O Que Esperar

O script vai mostrar 9 seções de diagnóstico:

```
1. EVENTOS DE CONVERSÃO NA TABELA EVENTS
   └─ Mostra quantos eventos de conversão existem

2. ÚLTIMOS 10 EVENTOS DE CONVERSÃO
   └─ Detalhe dos últimos eventos registrados

3. STATUS DA TABELA VARIANT_STATS
   └─ Quantos registros existem em variant_stats

4. COMPARAÇÃO EVENTS vs VARIANT_STATS
   └─ ⚠️ CRÍTICO: Identifica divergências

5. FUNÇÕES RPC RELACIONADAS A CONVERSÕES
   └─ Verifica se funções existem

6. POLÍTICAS RLS EM VARIANT_STATS
   └─ Verifica permissões

7. EXPERIMENTOS ATIVOS
   └─ Lista experimentos rodando

8. EVENTOS SEM variant_id
   └─ ⚠️ Problema comum

9. RESUMO EXECUTIVO
   └─ Status geral do sistema

10. RECOMENDAÇÕES AUTOMÁTICAS
    └─ Próximos passos sugeridos
```

### Cenários Possíveis

#### ✅ Cenário 1: Tudo OK
```
Status: 🟢 OK: Conversões sendo contabilizadas
```
**Ação:** Problema pode estar na interface. Vá para o Passo 6.

#### ⚠️ Cenário 2: Conversões em EVENTS mas não em VARIANT_STATS
```
Status: 🔴 PROBLEMA: Conversões em EVENTS mas não em VARIANT_STATS
```
**Ação:** Execute o Passo 3 (init-variant-stats.sql)

#### 🔵 Cenário 3: Nenhuma Conversão Registrada
```
Status: 🔵 INFO: Nenhuma conversão registrada ainda
```
**Ação:** Execute o Passo 4 (teste de conversão)

---

## ⚙️ PASSO 2: VERIFICAR FUNÇÕES RPC

### Execute o Script de Verificação

1. No **Supabase Dashboard** → **SQL Editor**
2. Copie e cole: `scripts/verify-rpc-functions.sql`
3. Clique em **Run**

### O Que Esperar

O script vai:

1. **Listar todas as funções RPC** existentes
2. **Mostrar a definição** da função `increment_variant_conversions`
3. **TESTAR A EXECUÇÃO** da função (e reverter o teste)
4. **Verificar permissões** para usuários anon e authenticated
5. **Mostrar resumo final** com status

### Resultados Esperados

```sql
✅ TUDO OK: Funções existem e têm permissões corretas
```

### Se Houver Erro

Se a função não existir ou não tiver permissões:

1. Execute a migration: `supabase/migrations/20250102000000_add_mab_algorithms.sql`
2. Ou execute manualmente no SQL Editor

---

## 🔧 PASSO 3: INICIALIZAR/CORRIGIR VARIANT_STATS

### Quando Executar

Execute se o diagnóstico mostrou:
- Conversões em `events` mas não em `variant_stats`
- Números divergentes entre tabelas
- Registros faltando em `variant_stats`

### Como Executar

1. No **Supabase Dashboard** → **SQL Editor**
2. Copie e cole: `scripts/init-variant-stats.sql`
3. Clique em **Run**

### O Que o Script Faz

```sql
1. Garante que variant_stats existe para todas as variantes ativas
2. Atualiza contadores de visitantes baseado em assignments
3. Atualiza conversões e receita baseado em events
4. Corrige eventos de conversão sem variant_id
5. Mostra relatório final
```

### Resultado Esperado

```
✅ INICIALIZAÇÃO COMPLETA
   - Total variant_stats registros: X
   - Total visitantes: Y
   - Total conversões: Z
   - Receita total: R$ W
```

---

## 🧪 PASSO 4: TESTE DE CONVERSÃO

### Acesse a Página de Teste

```
http://localhost:3000/test-conversion-debug.html
```

Ou, se em produção:
```
https://seu-dominio.com/test-conversion-debug.html
```

### Como Usar

1. **Cole o ID do Experimento**
   - Copie do dashboard ou banco de dados
   - Exemplo: `550e8400-e29b-41d4-a716-446655440000`

2. **Selecione uma Variante**
   - Escolha "Controle", "Variante A", etc.
   - Deve corresponder ao nome exato no banco

3. **Defina o Valor da Conversão**
   - Exemplo: `100.00`

4. **Clique em "Simular Visitante + Conversão"**

### O Que Observar

A página vai:

1. ✅ Gerar um `visitor_id` único
2. ✅ Buscar dados do experimento
3. ✅ Enviar evento `page_view` (visita)
4. ✅ Enviar evento `conversion` (conversão)
5. ✅ Mostrar logs detalhados

### Logs Esperados

```
✅ Visitor ID gerado: test_visitor_1234567890
✅ Experimento encontrado: Meu Teste A/B
✅ Variante encontrada: Variante A (ID: abc-123)
📄 ETAPA 1: Simulando visita inicial...
✅ Evento page_view registrado com sucesso
💰 ETAPA 2: Simulando conversão...
✅ Evento conversion registrado com sucesso
✅ TESTE COMPLETO!
```

---

## 📊 PASSO 5: MONITORAR LOGS DO SERVIDOR

### Abrir Terminal do Servidor Next.js

Se estiver rodando localmente:
```bash
npm run dev
```

### O Que Procurar

Quando a conversão for disparada (pela página de teste ou real), você deve ver:

```
📊 [CONVERSION] Iniciando registro de conversão
   experiment: abc-123
   visitor: test_visitor_123
   variant_name: Variante A
   variant_id: def-456
   value: 100

✅ [SUCCESS] Variante encontrada pelo nome: def-456

📈 [CONVERSION] Chamando increment_variant_conversions
   variant_id: def-456
   experiment_id: abc-123
   revenue: 100

✅ [CONVERSION] Estatísticas atualizadas com sucesso
```

### Se Houver Erro

#### Erro: Função RPC não encontrada
```
❌ [ERROR] Erro na função RPC increment_variant_conversions:
   code: 42883
   hint: No function matches the given name...
```
**Solução:** Execute a migration do Passo 2

#### Erro: variant_id não encontrado
```
❌ [ERROR] Não foi possível identificar variant_id para conversão
```
**Solução:** Verifique se o nome da variante está correto

#### Fallback Automático Ativado
```
🔄 [FALLBACK] Tentando atualização manual de variant_stats
✅ [SUCCESS] Fallback manual executado com sucesso
```
**Isso é OK:** O sistema tem fallback automático se a RPC falhar

---

## 📖 INTERPRETAÇÃO DE RESULTADOS

### Cenário 1: ✅ Tudo Funcionando

**Sintomas:**
- Scripts SQL mostram conversões em ambas as tabelas
- Números batem
- Teste funciona sem erros
- Logs do servidor mostram sucesso

**Problema:**
- A interface não está mostrando os dados corretamente

**Solução:**
- Execute o Passo 6 (verificar queries da interface)
- Limpe o cache do navegador
- Force refresh (Ctrl+Shift+R)

### Cenário 2: ⚠️ RPC Falhando

**Sintomas:**
- Eventos em `events` mas não em `variant_stats`
- Logs mostram erro na RPC
- Fallback manual funcionando

**Solução:**
1. Verifique permissões da função RPC
2. Execute `verify-rpc-functions.sql`
3. Se necessário, recrie a função manualmente

### Cenário 3: 🔴 Nada Sendo Registrado

**Sintomas:**
- Nenhum evento na tabela `events`
- Teste retorna erro 404 ou 500

**Problema:**
- `conversion-tracker.js` não está instalado
- Experimento não existe
- SDK não foi executado

**Solução:**
1. Verifique se o experimento existe
2. Instale o `conversion-tracker.js` na página de sucesso
3. Verifique logs do servidor para erros

---

## 🛠️ CORREÇÕES COMUNS

### Problema 1: Conversões Antigas Sem variant_id

**Comando SQL:**
```sql
-- Ver quantas conversões estão sem variant_id
SELECT COUNT(*) 
FROM events 
WHERE event_type = 'conversion' 
  AND variant_id IS NULL;
```

**Correção:**
Execute `scripts/init-variant-stats.sql` - ele corrige automaticamente

### Problema 2: variant_stats Vazio

**Correção:**
```bash
# Execute no Supabase SQL Editor
scripts/init-variant-stats.sql
```

### Problema 3: Função RPC Não Existe

**Correção:**
```bash
# Execute no Supabase SQL Editor
supabase/migrations/20250102000000_add_mab_algorithms.sql
```

### Problema 4: Interface Não Atualiza

**Correção:**
1. Force refresh no navegador (Ctrl+Shift+R)
2. Limpe cache do navegador
3. Reinicie o servidor Next.js
4. Verifique se está usando Service Client (não Client)

---

## ✅ CHECKLIST FINAL

Após executar todos os passos:

- [ ] Scripts SQL executados sem erros
- [ ] Funções RPC existem e funcionam
- [ ] variant_stats populado corretamente
- [ ] Teste de conversão bem-sucedido
- [ ] Logs do servidor mostram sucesso
- [ ] Números batem entre `events` e `variant_stats`
- [ ] Interface mostra conversões corretamente

---

## 📞 PRÓXIMOS PASSOS

Se após executar todos os passos o problema persistir:

1. **Compartilhe os resultados dos scripts SQL**
   - Copie e cole o output de `diagnose-conversions.sql`
   - Copie e cole o output de `verify-rpc-functions.sql`

2. **Compartilhe os logs do servidor**
   - Durante o teste de conversão
   - Procure por erros (❌) e avisos (⚠️)

3. **Verifique o console do navegador**
   - F12 → Console
   - Procure por erros JavaScript

4. **Tire prints da interface**
   - Visão Geral
   - Detalhes do Experimento
   - Aba Relatórios

---

## 📝 NOTAS IMPORTANTES

1. **Os scripts SQL são idempotentes** - podem ser executados múltiplas vezes sem causar problemas

2. **Os testes não afetam dados reais** - o script de verificação reverte as mudanças automaticamente

3. **Os logs detalhados foram adicionados** - ajudam a identificar exatamente onde está o problema

4. **O sistema tem fallback automático** - se a RPC falhar, tenta manualmente

5. **A página de teste funciona localmente e em produção** - útil para validar em ambos ambientes

---

**✅ FIM DO GUIA**

Se precisar de ajuda, execute os scripts e compartilhe os resultados!

