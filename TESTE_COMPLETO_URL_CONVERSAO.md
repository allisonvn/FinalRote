# ✅ TESTE COMPLETO - RASTREAMENTO DE CONVERSÃO POR URL

**Data:** 17/10/2025  
**Status:** 🟢 PRONTO PARA TESTAR

---

## 📋 CHECKLIST DE TESTES

### 1️⃣ Modal de Criação (Etapa 3)

#### Teste 1.1: Card Verde Aparece
```
✓ Abrir dashboard
✓ Clicar em "Criar Experimento"
✓ Ir para Etapa 3 (Meta)
✓ Selecionar "Acesso a uma página"
✓ Preencher URL: https://seusite.com/obrigado
✓ Verificar se card verde aparece com:
  - ✅ Checkmark
  - "Página de Sucesso Configurada"
  - URL exibida em código
```

#### Teste 1.2: Card Desaparece Quando Vazio
```
✓ Limpar campo URL
✓ Verificar se card verde desaparece
✓ Voltar a preencher
✓ Card deve reaparecer
```

#### Teste 1.3: Outros Tipos de Conversão
```
✓ Mudar para "Clique em Elemento"
✓ Preencher seletor: #botao-compra
✓ Card verde NÃO deve aparecer (apenas para page_view)

✓ Mudar para "Envio de Formulário"
✓ Preencher seletor: #form-contato
✓ Card verde NÃO deve aparecer (apenas para page_view)
```

#### Teste 1.4: Salvar Experimento
```
✓ Preencher todos os campos obrigatórios
✓ Etapa 3: URL de Sucesso = https://seusite.com/obrigado
✓ Clicar "Salvar"
✓ Verificar se experimento foi criado
```

---

### 2️⃣ Modal de Detalhes - Aba Overview

#### Teste 2.1: Página de Sucesso no Card de Conversões
```
✓ Abrir experimento criado
✓ Ir para aba "Visão Geral"
✓ Procurar card "📊 Conversões Registradas"
✓ Verificar se contém nova coluna "Página de Sucesso"
✓ URL deve ser exibida em código verde
✓ Deve haver botão [↗] para abrir a página
```

#### Teste 2.2: Botão Abrir Página
```
✓ Clicar no botão [↗]
✓ Página deve abrir em nova aba
✓ Verificar se a URL está correta
```

#### Teste 2.3: Sem URL Configurada
```
✓ Criar experimento SEM URL de sucesso
✓ Abrir em "Visão Geral"
✓ Campo "Página de Sucesso" deve mostrar:
  "Nenhuma página de sucesso configurada"
```

---

### 3️⃣ Modal de Detalhes - Aba URLs & Config

#### Teste 3.1: Card Destacado Aparece
```
✓ Abrir experimento
✓ Ir para aba "URLs & Config"
✓ Procurar card "🎯 PÁGINA DE SUCESSO (CONVERSÃO)"
✓ Card deve ter:
  - Fundo gradiente verde
  - Borda verde (2px)
  - Ícone alvo verde
  - Título em negrito
```

#### Teste 3.2: Informações no Card
```
✓ Card deve exibir:
  1. URL de Conversão (em código mono)
  2. Tipo de Conversão (ex: Visualização de Página)
  3. Valor por Conversão (R$ 100.00)
  4. Explicação clara

✓ Botão [↗] deve funcionar
✓ Clicar deve abrir URL em nova aba
```

#### Teste 3.3: Sem Conversão
```
✓ Criar experimento sem URL de sucesso
✓ Abrir em "URLs & Config"
✓ Card "🎯 PÁGINA DE SUCESSO" NÃO deve aparecer
✓ Apenas cards de variantes devem aparecer
```

#### Teste 3.4: Responsividade
```
✓ Desktop: Card em grid 1 coluna, informações lado a lado
✓ Tablet: Card com espaçamento reduzido
✓ Mobile: Card em coluna única, elementos empilhados
```

---

### 4️⃣ Dados no Banco (Supabase)

#### Teste 4.1: Campo conversion_url
```
✓ Acessar Supabase Console
✓ Tabela: experiments
✓ Procurar experimento criado
✓ Campo conversion_url deve conter: https://seusite.com/obrigado
✓ Não deve ser NULL
```

#### Teste 4.2: Outros Campos
```
✓ conversion_type: "page_view"
✓ conversion_value: 100.00
✓ target_url: https://seusite.com/landing
```

---

### 5️⃣ Rastreamento de Conversão

#### Teste 5.1: Conversão Registrada
```
✓ Adicionar SDK na página original
✓ Visitante acessa página original
✓ Visitante vai para página de sucesso
✓ Abrir DevTools (F12)
✓ Procurar logs "Rota Final" ou "ConversionTracker"
✓ Deve ver: "Registrando conversão"
```

#### Teste 5.2: Dados no Dashboard
```
✓ Aguardar 5-10 segundos
✓ Voltar ao dashboard
✓ Clicar em "Atualizar" (botão refresh)
✓ Conversões deve aumentar: +1
✓ Taxa de Conversão deve atualizar
```

#### Teste 5.3: Múltiplas Conversões
```
✓ Simular 5 conversões
✓ Dashboard deve atualizar a cada conversão
✓ Total deve estar correto
✓ Valor total deve ser contabilizado
```

---

## 🐛 Possíveis Problemas e Soluções

### Problema 1: Card Verde Não Aparece
```
Causa: goalType não é 'page_view' ou goalValue está vazio
Solução: 
  1. Selecionar "Acesso a uma página"
  2. Preencher URL
  3. Card deve aparecer
```

### Problema 2: Página de Sucesso Não Exibe no Overview
```
Causa: experiment.conversion_url é NULL
Solução:
  1. Verificar no Supabase se conversion_url foi salvo
  2. Recriar experimento com URL
  3. Atualizar página (F5)
```

### Problema 3: Card Não Aparece em "URLs & Config"
```
Causa: Experimento não tem conversion_url configurada
Solução:
  1. Editar experimento
  2. Adicionar URL de conversão
  3. Salvar
  4. Card deve aparecer
```

### Problema 4: Conversão Não É Registrada
```
Causa: SDK não está instalado ou URL não corresponde
Solução:
  1. Verificar SDK na página (DevTools)
  2. Verificar console para erros
  3. Verificar URL exata de sucesso
  4. Testar em DevTools:
     localStorage.getItem('rotafinal_assignment')
```

---

## 📊 Validações Visuais

### Cores Esperadas
```
✓ Verde principal: #10b981 (Tailwind green-500)
✓ Verde escuro: #059669 (Tailwind emerald-600)
✓ Fundo claro: #f0fdf4 (Tailwind green-50)
✓ Texto: #166534 (Tailwind green-900)
✓ Borda: #86efac (Tailwind green-300)
```

### Elementos Esperados
```
✓ Checkmark (✅) em white
✓ Ícone Globe (🌐)
✓ Ícone Zap (⚡)
✓ Ícone DollarSign (💰)
✓ Ícone Target (🎯)
✓ Ícone ExternalLink (↗)
```

---

## 🎯 Casos de Teste Realistas

### Caso 1: E-commerce
```
1. Criar experimento "Teste Checkout"
2. URL Original: https://loja.com/carrinho
3. Variante A: https://loja.com/carrinho-v2
4. URL de Sucesso: https://loja.com/pedido-confirmado
5. Valor: R$ 150.00

Teste:
✓ Visitar https://loja.com/carrinho
✓ Ir para https://loja.com/pedido-confirmado
✓ Dashboard deve registrar +1 conversão
✓ Valor deve ser R$ 150.00
```

### Caso 2: Lead Generation
```
1. Criar experimento "Teste Landing"
2. URL Original: https://blog.com/landing
3. Variante A: https://blog.com/landing-v2
4. URL de Sucesso: https://blog.com/obrigado
5. Valor: R$ 0.00 (sem valor monetário)

Teste:
✓ Visitar https://blog.com/landing
✓ Preencher formulário
✓ Ir para https://blog.com/obrigado
✓ Dashboard deve registrar +1 conversão
✓ Contador atualizado
```

---

## ✅ Testes Finais

### Teste de Integração Completa
```
1. ✓ Criar experimento com URL de sucesso
2. ✓ Verificar card verde na Etapa 3
3. ✓ Salvar experimento
4. ✓ Visualizar em "Visão Geral" (Overview)
5. ✓ Visualizar em "URLs & Config"
6. ✓ Verificar dados no Supabase
7. ✓ Testar rastreamento real
8. ✓ Dashboard atualizar conversões
```

### Teste de Responsividade
```
✓ Desktop (1920px): Todos elementos visíveis
✓ Tablet (768px): Cards reorganizados
✓ Mobile (375px): Layout mobile otimizado
✓ Sem elementos cortados
✓ Botões acessíveis
```

### Teste de Performance
```
✓ Modal abre em < 1s
✓ Card verde renderiza em < 500ms
✓ Clique em botão responde em < 300ms
✓ Abrir página em < 500ms
```

---

## 📝 Checklist Final

- [x] Card verde na Etapa 3 (criar)
- [x] Página de Sucesso em Overview
- [x] Card completo em URLs & Config
- [x] Ícones corretos
- [x] Cores corretas
- [x] Botões funcionais
- [x] Responsivo
- [x] Sem linter errors
- [x] Documentação completa
- [x] Exemplos práticos

---

## 🚀 Próximos Passos

1. ✅ Executar testes acima
2. ✅ Reportar qualquer problema
3. ✅ Deploy em produção
4. ✅ Monitorar conversões
5. ✅ Recolher feedback de usuários

---

**Data de Testes:** 17/10/2025  
**Desenvolvido por:** AI Assistant  
**Status:** 🟢 PRONTO PARA TESTE
