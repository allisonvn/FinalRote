# 🔄 Como Reverter as Mudanças

Se a alteração que fiz causou problemas, siga estes passos:

## OPÇÃO 1: Reverter o Hook (Rápido)

Abra o arquivo: `src/hooks/useSupabaseExperiments.ts`

Localize as linhas 230-248 e substitua por:

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

      // Criar variantes padrão
      // ✅ CORREÇÃO: Variante de controle usa a URL da página configurada na etapa 01
      const variants = [
```

**Isso remove:**
- Os logs de debug
- A condição adicional `|| data.conversion_url`

E volta ao código original.

## OPÇÃO 2: Usar Git (Se disponível)

Se o código está no Git:

```bash
# Reverter apenas o arquivo modificado
git checkout HEAD -- src/hooks/useSupabaseExperiments.ts

# Verificar status
git status
```

## OPÇÃO 3: Copiar Backup

Se você fez backup antes, restaure o arquivo original.

---

## ⚠️ IMPORTANTE

**Antes de reverter, me diga:**

1. **Qual é o erro exato?**
2. **O que parou de funcionar especificamente?**
3. **Console mostra algum erro?**

Pode ser que o problema não seja relacionado à minha alteração!
