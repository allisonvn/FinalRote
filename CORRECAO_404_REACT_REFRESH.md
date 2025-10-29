# 🔧 Correção: Erros 404 em arquivos de desenvolvimento (react-refresh.js, main.js, etc.)

## Problema
Os seguintes arquivos estão retornando 404 no console:
- `react-refresh.js`
- `main.js`
- `_app.js`
- `_error.js`

## Causa
Esses são arquivos gerados automaticamente pelo Next.js durante o desenvolvimento. Os erros 404 geralmente ocorrem quando:
1. O cache do Next.js está corrompido (`.next/`)
2. O servidor de desenvolvimento precisa ser reiniciado
3. O cache do navegador está desatualizado

## Solução Rápida

### 1. Parar o servidor atual
```bash
# Opção 1: Usar o script de reset
./scripts/reset-dev.sh

# Opção 2: Manual
lsof -ti:3001 | xargs kill -9
```

### 2. Limpar cache
```bash
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force
```

### 3. Reiniciar o servidor
```bash
npm run dev
```

### 4. Limpar cache do navegador
- **Chrome/Edge**: `Ctrl+Shift+Delete` (Windows) ou `Cmd+Shift+Delete` (Mac)
- Ou usar **modo anônimo/privado**: `Ctrl+Shift+N` (Chrome) ou `Cmd+Shift+N` (Mac)

## Correções Aplicadas

### ✅ Middleware (`middleware.ts`)
Atualizado para retornar `NextResponse.next()` ao invés de `undefined` para arquivos `/_next/`, garantindo bypass completo:

```typescript
if (pathname.startsWith('/_next/')) {
  return NextResponse.next() // ✅ Bypass completo
}
```

## Script de Reset Criado

Um script foi criado em `scripts/reset-dev.sh` para automatizar o processo:

```bash
./scripts/reset-dev.sh
```

Este script:
- ✅ Para o servidor na porta 3001
- ✅ Remove cache do Next.js (`.next`)
- ✅ Remove cache do webpack (`node_modules/.cache`)
- ✅ Limpa cache do npm

## Prevenção

Para evitar esses problemas no futuro:
1. **Reinicie o servidor** após mudanças significativas no código
2. **Limpe o cache** regularmente durante desenvolvimento
3. **Use modo anônimo** para testar se é problema de cache do navegador
4. **Mantenha o Next.js atualizado**

## Verificação

Após reiniciar, verifique no console do navegador:
- ✅ Nenhum erro 404 para `react-refresh.js`
- ✅ Nenhum erro 404 para `main.js`
- ✅ Nenhum erro 404 para `_app.js`
- ✅ Hot reload funcionando corretamente

## Nota sobre Fontes

O aviso sobre `e4af272ccee01ff0-s.p.woff2` é normal e não afeta o funcionamento. É apenas um aviso de otimização do navegador sobre preload de fontes.
