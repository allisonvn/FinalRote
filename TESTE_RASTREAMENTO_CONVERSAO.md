# ✅ TESTE DO RASTREAMENTO DE CONVERSÃO

**Data:** 17/10/2025  
**Versão:** 2.0  
**Status:** 🟢 Pronto para Teste

---

## 🧪 TESTE PRÁTICO COMPLETO (15 minutos)

### Pré-requisito
```
✅ Experimento criado com:
   - URL de Sucesso: qualquer página
   - Valor: R$ 100.00
   - SDK instalado
```

### Passo 1: Preparar Ambiente
```bash
# Terminal 1: Rodar projeto
cd /Users/allisonnascimento/Desktop/site/rotafinal
npm run dev

# Abrir navegador
http://localhost:3001/dashboard
```

### Passo 2: Criar Experimento de Teste
```
1. Clique em "Criar Experimento"
2. Etapa 1:
   - Nome: "Teste Conversão"
   - URL: http://localhost:3000/teste
   
3. Etapa 2:
   - Original: http://localhost:3000/teste
   - Variante A: http://localhost:3000/teste?v=a
   
4. Etapa 3:
   - URL de Sucesso: http://localhost:3000/sucesso ← IMPORTANTE!
   - Valor: R$ 100.00 ← IMPORTANTE!
   
5. Salvar
```

### Passo 3: Simular Visitante
```bash
# Abrir Incógnito/Nova aba
1. Visitar: http://localhost:3000/teste

2. Abrir DevTools (F12)
3. Console
4. Ir para Aplicação → Storage → localStorage
5. Procurar por: rotafinal_exp_

# Deve ter um objeto com:
{
  "experimentId": "exp_...",
  "variantId": "var_...",
  "visitorId": "rf_...",
  "variant": "Original" ou "Variante A"
}
```

### Passo 4: Navegar para Sucesso
```
1. Ir para: http://localhost:3000/sucesso

2. DevTools Console deve mostrar:
   🎯 [ConversionTracker] Iniciando ConversionTracker
   🔍 [ConversionTracker] Procurando dados de atribuição...
   ✅ [ConversionTracker] Dados encontrados
   📡 [ConversionTracker] Buscando dados do experimento
   ✅ [ConversionTracker] Dados do experimento obtidos
   📊 [ConversionTracker] Registrando conversão
   📤 [ConversionTracker] Enviando conversão para API
   ✅ [ConversionTracker] Conversão registrada com sucesso!
   🎊 [ConversionTracker] Conversão rastreada com sucesso!
```

### Passo 5: Verificar API
```
1. DevTools → Network
2. Procurar por: POST /api/track
3. Request Payload deve ter:
   {
     "experiment_id": "exp_...",
     "visitor_id": "rf_...",
     "variant_id": "var_...",
     "value": 100.00,  ← VALOR REGISTRADO!
     "event_type": "conversion"
   }

4. Response deve ser:
   {
     "success": true,
     "message": "Evento registrado com sucesso",
     "experiment_id": "exp_..."
   }
```

### Passo 6: Verificar Supabase
```
1. Abrir Supabase Console
2. Tabela: events
3. Procurar novo evento com:
   - event_type: "conversion"
   - value: 100.00
   - timestamp: recente
   - experiment_id: "exp_..."
   
4. Tabela: variant_stats
5. Deve ter:
   - conversions: incrementado
   - revenue: +100.00
```

### Passo 7: Dashboard Atualiza
```
1. Voltar ao Dashboard
2. Atualizar página (F5)
3. Abrir o experimento criado
4. "Visão Geral":
   - Conversões: deve ser 1 ✅
   - Valor Total: R$ 100,00 ✅
   - Página de Sucesso: exibida ✅
```

---

## 🐛 SE ALGO NÃO FUNCIONAR

### Nenhuma atribuição encontrada

```javascript
// No console da página de teste:
localStorage.getItem('rotafinal_exp_...')

// Se retornar null:
// 1. SDK não foi executado
// 2. Verificar script na página
// 3. Verificar erros no console
```

### Conversão não envia

```javascript
// Na página de sucesso, execute:
RotaFinalConversionTracker.debug()

// Depois:
RotaFinalConversionTracker.test()

// Deve mostrar dados em tabela
```

### Valor zerado

```
1. Verificar Supabase:
   - Tabela experiments
   - Campo conversion_value
   - Deve estar preenchido

2. Se NULL:
   - Recriar experimento com valor
   - Ou editar diretamente no Supabase
```

---

## ✅ CHECKLIST COMPLETO

- [ ] Experimento criado com URL de sucesso
- [ ] Experimento criado com valor (R$ 100.00)
- [ ] Visitante acessa página original
- [ ] localStorage tem dados do SDK
- [ ] Visitante vai para página de sucesso
- [ ] Console mostra logs do ConversionTracker
- [ ] API recebe requisição POST /api/track
- [ ] Request payload inclui value
- [ ] Response retorna success: true
- [ ] Evento aparece em Supabase (events)
- [ ] variant_stats atualizado
- [ ] Dashboard mostra +1 conversão
- [ ] Dashboard mostra +R$ 100.00
- [ ] Tudo funcionando perfeitamente! ✅

---

## 📝 NOTAS IMPORTANTES

**Cada visitante só converte uma vez:**
- O sistema salva em localStorage: `rotafinal_conversion_exp_...`
- Impede duplicatas

**Para testar novamente:**
1. Abrir incógnito (nova sessão)
2. OU limpar localStorage

**Teste manual de debug:**
```javascript
// Na página de sucesso:
RotaFinalConversionTracker.debug()  // Ativa debug verbose
RotaFinalConversionTracker.test()   // Mostra dados em tabela
```

---

**Desenvolvido por:** AI Assistant  
**Data:** 17/10/2025  
**Versão:** 2.0  
**Status:** ✅ Pronto para Testar
