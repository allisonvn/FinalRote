# 🆘 DEBUG URGENTE - Sistema Parou de Funcionar

## ❓ PERGUNTAS IMPORTANTES

Por favor, responda estas perguntas para eu entender o problema:

### 1. O que exatamente "não deu certo"?

- [ ] Não consigo criar novo experimento
- [ ] Não consigo copiar o código
- [ ] O código não funciona na página
- [ ] Conversões não estão sendo detectadas
- [ ] Erro no console do navegador
- [ ] Erro ao salvar experimento
- [ ] Outro: _______________

### 2. O que significa "o teste parou de funcionar"?

- [ ] O experimento "esmalt" que estava funcionando parou
- [ ] O teste manual parou de funcionar
- [ ] Não consigo mais criar experimentos
- [ ] A página do dashboard não carrega
- [ ] Outro: _______________

### 3. Quando parou de funcionar?

- [ ] Logo após executar o SQL de correção
- [ ] Depois de recarregar a página
- [ ] Ao tentar criar novo experimento
- [ ] Não sei, estava funcionando antes

### 4. Há algum erro no console do navegador?

**Por favor, abra o Console (F12) e copie qualquer mensagem de erro aqui:**

```
[Cole os erros aqui]
```

### 5. Consegue criar um novo experimento?

- [ ] SIM, consigo criar
- [ ] NÃO, dá erro ao criar
- [ ] NÃO, o botão não funciona
- [ ] Não tentei ainda

---

## 🔧 VERIFICAÇÕES RÁPIDAS

### Verificação 1: O Servidor Está Rodando?

```bash
# No terminal, verifique se há erros
npm run dev
```

**Há algum erro?** _______________

### Verificação 2: Código Atual do Hook

Execute no terminal:

```bash
grep -A 10 "const conversionConfig" src/hooks/useSupabaseExperiments.ts
```

**Cole o resultado aqui:**

```
[Cole aqui]
```

### Verificação 3: Último Experimento no Banco

Execute no Supabase SQL Editor:

```sql
SELECT
  id,
  name,
  conversion_url,
  conversion_type,
  created_at
FROM experiments
ORDER BY created_at DESC
LIMIT 1;
```

**Cole o resultado aqui:**

```
[Cole aqui]
```

### Verificação 4: Variantes do Último Experimento

```sql
SELECT
  v.name,
  v.changes->'conversion'->>'url' as conversion_url,
  v.changes::text as all_changes
FROM variants v
WHERE v.experiment_id = (
  SELECT id FROM experiments ORDER BY created_at DESC LIMIT 1
);
```

**Cole o resultado aqui:**

```
[Cole aqui]
```

---

## 🔄 REVERTER ALTERAÇÕES (Se Necessário)

Se a alteração que fiz no código causou o problema, vamos reverter:

### Opção 1: Reverter o Hook (Código Original)

Substitua o conteúdo de `src/hooks/useSupabaseExperiments.ts` nas linhas 230-248 por:

```typescript
      // Preparar configuração de conversão para todas as variantes
      const conversionConfig = data.conversion_type ? {
        conversion: {
          type: data.conversion_type,
          url: data.conversion_url || null,
          selector: data.conversion_selector || null,
          value: data.conversion_value || 0
        }
      } : {}
```

(Remover os logs de debug também)

### Opção 2: Verificar Sintaxe

Possível erro de sintaxe na edição. Vamos verificar:

```bash
npm run lint
# ou
npm run type-check
```

**Cole erros aqui:**

```
[Cole aqui]
```

---

## 📋 CHECKLIST DE DIAGNÓSTICO

- [ ] Servidor está rodando sem erros
- [ ] Console do navegador não mostra erros
- [ ] Consigo acessar o dashboard
- [ ] Consigo ver os experimentos existentes
- [ ] Posso criar novo experimento (mesmo que não salve)
- [ ] Código do hook está correto (sem erros de sintaxe)

---

## 🆘 PRÓXIMOS PASSOS

**Por favor, preencha as seções acima e me diga:**

1. **O que exatamente parou de funcionar?**
2. **Qual erro aparece (se houver)?**
3. **Console do navegador mostra algum erro?**
4. **Servidor tem algum erro?**

Com essas informações, vou identificar o problema rapidamente e corrigir!
