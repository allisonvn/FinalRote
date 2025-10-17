# ⚡ INSTRUÇÕES RÁPIDAS - DIAGNÓSTICO DE CONVERSÕES

**Status:** 🎯 EXECUTE AGORA

---

## 🚀 INÍCIO RÁPIDO (5 MINUTOS)

### 1️⃣ DIAGNÓSTICO INICIAL

**Acesse:** Supabase Dashboard → SQL Editor  
**Execute:** `scripts/diagnose-conversions.sql`

**O que esperar:**
```
🟢 OK: Conversões sendo contabilizadas
🔴 PROBLEMA: Conversões em EVENTS mas não em VARIANT_STATS  
🔵 INFO: Nenhuma conversão registrada ainda
```

---

### 2️⃣ VERIFICAR FUNÇÕES RPC

**Acesse:** Supabase Dashboard → SQL Editor  
**Execute:** `scripts/verify-rpc-functions.sql`

**O que esperar:**
```
✅ TUDO OK: Funções existem e têm permissões corretas
❌ CRÍTICO: Função increment_variant_conversions NÃO EXISTE
```

---

### 3️⃣ CORRIGIR variant_stats (SE NECESSÁRIO)

**Quando executar:** Se diagnóstico mostrou números divergentes

**Acesse:** Supabase Dashboard → SQL Editor  
**Execute:** `scripts/init-variant-stats.sql`

**O que esperar:**
```
✅ INICIALIZAÇÃO COMPLETA
   Total conversões: X
   Receita total: R$ Y
```

---

### 4️⃣ TESTAR CONVERSÃO

**Acesse:** http://localhost:3000/test-conversion-debug.html

**Preencha:**
- ID do Experimento: `[cole aqui o UUID]`
- Variante: `Controle` ou `Variante A`
- Valor: `100`

**Clique:** "🚀 Simular Visitante + Conversão"

**O que esperar:**
```
✅ Visitor ID gerado
✅ Experimento encontrado
✅ Evento conversion registrado com sucesso
✅ TESTE COMPLETO!
```

---

### 5️⃣ VERIFICAR LOGS DO SERVIDOR

**Abra:** Terminal onde Next.js está rodando (`npm run dev`)

**O que procurar:**
```
📊 [CONVERSION] Iniciando registro de conversão
✅ [SUCCESS] Variante encontrada pelo nome
📈 [CONVERSION] Chamando increment_variant_conversions
✅ [CONVERSION] Estatísticas atualizadas com sucesso
```

**Se ver isso:** ✅ Sistema funcionando!

**Se ver erro:**
```
❌ [ERROR] Erro na função RPC...
```
→ Execute novamente o Passo 2

---

### 6️⃣ VALIDAR NA INTERFACE

**Recarregue o Dashboard:**
```
Ctrl + Shift + R (force refresh)
```

**Verifique:**
- ✅ Visão Geral → Card de Conversões
- ✅ Experimentos → Detalhes do Experimento
- ✅ Modal → Conversões da Variante
- ✅ Aba Relatórios → Gráficos

---

## 🔴 CENÁRIOS COMUNS

### Cenário 1: Nenhuma Conversão Registrada
```
Status: 🔵 Nenhuma conversão registrada ainda
```

**Causa:** conversion-tracker.js não instalado ou experimento sem tráfego

**Solução:**
1. Execute o Passo 4 (teste)
2. Verifique se conversion-tracker.js está na página de sucesso
3. Confirme que experimento está ativo

---

### Cenário 2: Conversões em EVENTS mas não em VARIANT_STATS
```
Status: 🔴 Conversões em EVENTS mas não em VARIANT_STATS
```

**Causa:** Função RPC não executou ou variant_stats não inicializado

**Solução:**
1. Execute Passo 3 (init-variant-stats.sql)
2. Execute Passo 2 (verify-rpc-functions.sql)
3. Repita teste (Passo 4)

---

### Cenário 3: Números Divergentes
```
Status: 🟡 Números divergentes entre EVENTS e VARIANT_STATS
```

**Causa:** Eventos antigos sem variant_id ou atualizações parciais

**Solução:**
1. Execute Passo 3 (init-variant-stats.sql) - corrige automaticamente
2. Force refresh no dashboard (Ctrl+Shift+R)

---

### Cenário 4: Função RPC Não Existe
```
Status: ❌ Função increment_variant_conversions NÃO EXISTE
```

**Causa:** Migration não executada

**Solução:**
```sql
-- No Supabase SQL Editor, execute:
supabase/migrations/20250102000000_add_mab_algorithms.sql
```

---

## 📋 CHECKLIST DE 1 MINUTO

Execute em ordem:

1. ☐ `diagnose-conversions.sql` → Ver status geral
2. ☐ `verify-rpc-functions.sql` → Confirmar funções
3. ☐ `init-variant-stats.sql` → Corrigir dados (se necessário)
4. ☐ Teste em `test-conversion-debug.html` → Simular conversão
5. ☐ Verificar logs do servidor → Confirmar sucesso
6. ☐ Recarregar dashboard → Ver conversões

---

## 🎯 RESULTADO ESPERADO

Após executar todos os passos:

```
✅ Scripts SQL sem erros
✅ Funções RPC funcionando
✅ Teste de conversão bem-sucedido
✅ Logs do servidor mostrando sucesso
✅ Conversões aparecendo na interface
```

---

## 📞 PRECISA DE AJUDA?

Se nada funcionar, compartilhe:

1. Output de `diagnose-conversions.sql`
2. Output de `verify-rpc-functions.sql`
3. Logs do servidor durante teste
4. Print da interface

---

## 📁 ARQUIVOS CRIADOS

```
scripts/
  ├─ diagnose-conversions.sql          # Diagnóstico completo
  ├─ verify-rpc-functions.sql          # Verificar RPC
  └─ init-variant-stats.sql            # Corrigir dados

public/
  └─ test-conversion-debug.html        # Página de teste

src/app/api/track/
  └─ route.ts                          # Logs detalhados ✅

docs/
  ├─ GUIA_DIAGNOSTICO_CONVERSOES.md   # Guia completo
  ├─ RESUMO_IMPLEMENTACAO_DIAGNOSTICO.md
  └─ INSTRUCOES_RAPIDAS_DIAGNOSTICO.md (este arquivo)
```

---

**✅ PRONTO PARA USAR!**

Comece pelo Passo 1 e siga em ordem.

