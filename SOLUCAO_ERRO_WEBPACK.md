# ✅ Solução: Erro "Cannot find module './611.js'"

## 🐛 Erro Encontrado

```
Error: Cannot find module './611.js'
Require stack:
- .next/server/webpack-runtime.js
- .next/server/pages/_document.js
```

**Tipo:** Erro de Runtime do Next.js  
**Versão:** Next.js 15.5.4 (Webpack)

---

## 🔍 Causa do Erro

Este é um erro comum do Next.js causado por **cache corrompido do webpack**. Acontece quando:

1. ✅ Mudanças significativas no código
2. ✅ Build anterior foi interrompido
3. ✅ Cache do `.next` ficou inconsistente
4. ✅ Módulos webpack foram renumerados mas cache ainda referencia números antigos

---

## ✅ Solução Aplicada

### Passo 1: Limpar Cache do Next.js

```bash
rm -rf .next
```

Isso remove completamente o diretório `.next` que contém:
- Cache do webpack
- Bundles compilados
- Arquivos de build corrompidos

### Passo 2: Reiniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O Next.js irá:
- ✅ Recriar o diretório `.next`
- ✅ Recompilar todos os módulos
- ✅ Gerar novos chunks do webpack
- ✅ Reconstruir o cache limpo

---

## 🔧 Comandos Úteis para Problemas Similares

### Limpar Cache Completo

```bash
# Remover .next (cache do Next.js)
rm -rf .next

# Remover node_modules (se o problema persistir)
rm -rf node_modules
npm install

# Limpar cache do npm
npm cache clean --force

# Rebuild completo
npm run build
```

### Verificar Estado do Build

```bash
# Verificar se há erros de build
npm run build

# Iniciar em modo desenvolvimento
npm run dev

# Iniciar em modo produção
npm start
```

---

## 🚨 Quando Este Erro Aparece

### Cenários Comuns:

1. **Após mudanças grandes no código**
   - Adição/remoção de muitos arquivos
   - Refatoração significativa
   - Mudança de estrutura de pastas

2. **Build interrompido**
   - Ctrl+C durante compilação
   - Erro durante build
   - Sistema reiniciado durante build

3. **Problemas de cache**
   - Cache corrompido
   - Versão do Next.js atualizada
   - Dependências mudaram

4. **Hot Module Replacement (HMR) com problemas**
   - Muitas atualizações rápidas
   - Arquivos deletados durante dev
   - Mudanças conflitantes

---

## 📝 Prevenção

### Boas Práticas:

1. **Sempre pare o servidor corretamente**
   ```bash
   # Não: Fechar terminal bruscamente
   # Sim: Ctrl+C no terminal do servidor
   ```

2. **Limpe cache periodicamente**
   ```bash
   # Antes de commits importantes
   rm -rf .next
   npm run dev
   ```

3. **Use .gitignore correto**
   ```gitignore
   # .gitignore
   .next/
   node_modules/
   ```

4. **Build em produção regularmente**
   ```bash
   # Verificar se build production funciona
   npm run build
   ```

---

## 🎯 Resultado

**Status:** ✅ **RESOLVIDO**

- ✅ Cache `.next` removido
- ✅ Servidor reiniciado
- ✅ Build limpo gerado
- ✅ Erro não deve mais aparecer

---

## 🔄 Se o Erro Persistir

### Opção 1: Rebuild Completo

```bash
# Limpar tudo
rm -rf .next node_modules package-lock.json

# Reinstalar
npm install

# Rebuild
npm run build
```

### Opção 2: Verificar Dependências

```bash
# Verificar versões
npm list next react react-dom

# Atualizar se necessário
npm update next
```

### Opção 3: Verificar Arquivos Corrompidos

```bash
# Verificar integridade
npm run build 2>&1 | grep -i error

# Se houver erros específicos, corrigir os arquivos
```

---

## 📚 Referências

- [Next.js - Common Errors](https://nextjs.org/docs/messages)
- [Webpack Module Not Found](https://webpack.js.org/configuration/resolve/)
- [Next.js Issue Tracker](https://github.com/vercel/next.js/issues)

---

## 💡 Dica Extra

**Adicione um script no `package.json` para limpar cache facilmente:**

```json
{
  "scripts": {
    "clean": "rm -rf .next",
    "clean:all": "rm -rf .next node_modules package-lock.json && npm install",
    "dev:clean": "npm run clean && npm run dev",
    "build:clean": "npm run clean && npm run build"
  }
}
```

Agora você pode usar:
```bash
npm run clean        # Limpar só .next
npm run clean:all    # Limpar tudo e reinstalar
npm run dev:clean    # Limpar e rodar dev
npm run build:clean  # Limpar e fazer build
```

---

## ✅ Conclusão

O erro foi causado por **cache corrompido do webpack** e foi **resolvido completamente** ao:

1. ✅ Remover diretório `.next`
2. ✅ Reiniciar servidor de desenvolvimento
3. ✅ Deixar Next.js reconstruir cache limpo

**Problema resolvido!** 🎉

