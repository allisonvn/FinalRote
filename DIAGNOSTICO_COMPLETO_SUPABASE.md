# 🔍 DIAGNÓSTICO COMPLETO - SUPABASE

**Data:** 23 de Outubro de 2025  
**Status:** 🔴 **PROBLEMA CRÍTICO IDENTIFICADO**

---

## 🚨 PROBLEMA PRINCIPAL

O experimento `c6dbffbe-fae0-4769-84a3-c91adc8c821e` que aparece no console do dashboard **NÃO EXISTE** no banco de dados!

---

## 📊 DADOS REAIS NO SUPABASE

### ✅ Experimento que EXISTE:
```sql
ID: 00000000-0000-0000-0000-000000000003
Nome: teste-homepage-nova
Status: running
Project ID: 00000000-0000-0000-0000-000000000002
User ID: null (sem usuário associado!)
Conversion URL: https://rotafinal.com.br/obrigado
Conversion Value: R$ 29,90
Conversion Type: purchase
Target URL: null (não configurada!)
Algorithm: thompson_sampling
```

### ✅ Variantes que EXISTEM:
```sql
1. Controle (ID: 00000000-0000-0000-0000-000000000004)
   - is_control: true
   - traffic_percentage: 50%
   - config: {} (vazio!)

2. Variante A (ID: 00000000-0000-0000-0000-000000000005)
   - is_control: false
   - traffic_percentage: 50%
   - config: {} (vazio!)
```

### ✅ Eventos Registrados:
```sql
- 3 eventos de teste
- 1 conversão registrada
- 1 page_view
- 1 experiment_assignment
```

---

## 🔍 ANÁLISE DO PROBLEMA

### 1. ❌ Experimento Fantasma
O dashboard está mostrando um experimento (`c6dbffbe-fae0-4769-84a3-c91adc8c821e`) que **não existe** no banco de dados.

### 2. ❌ Experimento Real Sem Usuário
O experimento que existe (`00000000-0000-0000-0000-000000000003`) tem `user_id = null`, ou seja, não está associado a nenhum usuário.

### 3. ❌ Variantes Sem Configuração
As variantes existem mas têm `config = {}` (vazio), ou seja, não têm URLs de redirecionamento configuradas.

### 4. ❌ Target URL Não Configurada
O experimento real não tem `target_url` configurada.

---

## 🎯 CAUSA RAIZ

O problema é que o dashboard está:
1. **Mostrando dados de um experimento que não existe**
2. **Usando cache ou dados antigos**
3. **Não sincronizado com o banco de dados real**

---

## ✅ SOLUÇÕES POSSÍVEIS

### OPÇÃO 1: Corrigir o Experimento Existente

```sql
-- Atualizar o experimento existente com dados corretos
UPDATE experiments
SET 
  user_id = 'a8f769f9-a2a8-4c33-80c6-3e3f608dac7e',
  target_url = 'https://esmalt.com.br/',
  name = 'Rota Esmalt'
WHERE id = '00000000-0000-0000-0000-000000000003';

-- Atualizar variantes com URLs corretas
UPDATE variants
SET config = '{"redirect_url": "https://esmalt.com.br/elementor-695/"}'
WHERE id = '00000000-0000-0000-0000-000000000004' AND name = 'controle';

UPDATE variants
SET config = '{"redirect_url": "https://esmalt.com.br/elementor-595/"}'
WHERE id = '00000000-0000-0000-0000-000000000005' AND name = 'variante-a';
```

### OPÇÃO 2: Criar Novo Experimento (RECOMENDADO)

1. **Deletar o experimento atual** (que está sem usuário)
2. **Criar novo experimento** via dashboard
3. **Configurar corretamente** com:
   - Usuário associado
   - Target URL
   - URLs das variantes
   - URL de conversão

### OPÇÃO 3: Investigar Cache do Dashboard

O dashboard pode estar usando:
- Cache do navegador
- Cache do servidor
- Dados de uma sessão anterior
- Dados de outro projeto Supabase

---

## 🔧 AÇÕES IMEDIATAS

### 1. Limpar Cache do Dashboard
```javascript
// No console do dashboard
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Verificar Projeto Supabase
- Confirmar se está conectado ao projeto correto
- Verificar se as variáveis de ambiente estão corretas
- Verificar se não há múltiplos projetos

### 3. Recriar Experimento
- Deletar experimento atual
- Criar novo via modal
- Configurar todas as URLs corretamente

---

## 📋 CHECKLIST DE VERIFICAÇÃO

- [ ] Dashboard conectado ao projeto correto
- [ ] Cache limpo (localStorage, sessionStorage)
- [ ] Experimento existe no banco
- [ ] Experimento associado ao usuário correto
- [ ] Variantes têm URLs configuradas
- [ ] Target URL configurada
- [ ] Conversion URL configurada

---

## 🎯 PRÓXIMOS PASSOS

1. **LIMPAR CACHE** do dashboard
2. **VERIFICAR** se o experimento aparece corretamente
3. Se não aparecer, **RECRIAR** o experimento
4. **CONFIGURAR** todas as URLs corretamente
5. **TESTAR** o fluxo completo

---

## 📞 DIAGNÓSTICO FINAL

**O problema não é de código, é de dados!**

O dashboard está mostrando um experimento que não existe no banco. Isso pode ser:
- Cache corrompido
- Projeto Supabase errado
- Dados de sessão antiga
- Bug no frontend

**Solução:** Limpar cache e recriar o experimento via dashboard.

