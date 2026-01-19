# Especificação de Correções e Melhorias - Dashboard de Experimentos

Este documento detalha o plano de execução para as correções solicitadas no PRD2, baseando-se na análise do código existente e nas melhores práticas de padrões de projeto e estatística.

## 1. Visão Geral da Solução

O objetivo é remover dados hardcoded/mockados, utilizar implementações estatísticas robustas já existentes (`src/lib/statistics.ts`) e otimizar queries de banco de dados utilizando funções RPC do Supabase.

### Padrões Adotados
- **Single Source of Truth (SSOT)**: Todos os cálculos estatísticos devem usar `src/lib/statistics.ts`.
- **Database-First Aggregation**: Utilizar RPCs (`get_experiment_stats`) para agregações pesadas ao invés de buscar milhares de linhas e agregar no cliente.
- **Fail-Fast & Clear Feedback**: Em caso de falha de dados, mostrar estado vazio ou erro claro, ao invés de dados falsos (mock).
- **Hooks & Separation of Concerns**: Manter a lógica de transformação de dados em `src/lib/*` e deixar os componentes UI apenas para renderização.

---

## 2. Plano de Execução Detalhado

### FASE 1: Core - Métricas e Estatísticas (Backend/Lib Logic)

#### 1.1. Padronização Estatística (`src/lib/experiment-metrics.ts` & `src/lib/analytics.ts`)
- [ ] **Importar `analyzeExperiment`** de `@/lib/statistics` em ambos os arquivos.
- [ ] **Refatorar `experiment-metrics.ts`**:
    - Substituir lógica manual de Z-test pela chamada `analyzeExperiment(...)`.
    - Remover lógica de "Improvement = 100%" hardcoded. Calcular `((variant - control) / control) * 100`.
    - Remover `confidence: conversionRate > baseline ? 95 : 75`. Usar valor real retornado de `analyzeExperiment`.
    - **Receita**: Substituir `const avgOrderValue = 150` por query real na tabela `events` (sum `value` where type='conversion').

#### 1.2. Implementar Consumo de RPC (`src/lib/analytics.ts`)
- [ ] Verificar se a função RPC `get_experiment_stats` está disponível (já verificada na migração `20251119`).
- [ ] Criar função wrapper:
  ```typescript
  export async function getExperimentStatsFromRPC(experimentId?: string) {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_experiment_stats', {
      p_experiment_id: experimentId || null
    })
    // ...error handling
    return data
  }
  ```
- [ ] Substituir lógica complexa de `getExperimentMetrics` por essa chamada RPC onde possível, ou garantir que a lógica manual bata com a RPC.

#### 1.3. Lógica de Comparação Temporal (`src/lib/analytics.ts`)
- [ ] Implementar `getPreviousPeriodMetrics(range, experimentId)`.
    - Lógica: Calcular `startDate` e `endDate` baseados no `range` atual, deslocados para o passado.
    - Reutilizar queries existentes passando o intervalo de datas antigo.

#### 1.4. Limpeza de "Mock Data" (`src/lib/analytics.ts`)
- [ ] Em `getCampaignData`, remover o array estático de campanhas fake. Retornar `[]` se não houver dados reais.
- [ ] Em `getDeviceBreakdown`, remover dados hardcoded se a query falhar.
- [ ] Em `getVisitorTrends`, remover boosts artificiais (ex: `* 1200 / 10`). Usar dados puros.

---

### FASE 2: UI e Componentes (Frontend)

#### 2.1. Modal de Detalhes (`src/components/dashboard/experiment-details-modal.tsx`)
- [ ] **Remover Mock de Eventos**: No `catch` do fetch de eventos, setar `[]` e não dados fake.
- [ ] **Botões de Ação**: Implementar handlers para `Iniciar`, `Pausar`, `Finalizar`.
  - Endpoint: `PATCH /api/experiments/[id]/status` (ou direto via Supabase client se as policies permitirem).
  - Atualizar estado local após ação bem sucedida.

#### 2.2. Página de Experimentos (`src/app/dashboard/experiments/professional-page.tsx`)
- [ ] **Cálculo de Improvement**:
  - Garantir que está comparando `Variante Ativa vs Controle`.
  - Usar dados vindos de `experiment-metrics.ts` (já corrigidos na Fase 1).
- [ ] **Descrição**: Remover fallback para texto genérico. Usar `experiment.description || 'Sem descrição'`.

#### 2.3. Seção de Gráficos/Relatórios (`src/components/dashboard/charts-section.tsx`)
- [ ] **Badge de Lift**: Remover string hardcoded `+31.5% lift`.
  - Calcular: Média do `improvement` de todos os experimentos listados.
- [ ] **Comparação Anterior**:
  - Chamar `getPreviousPeriodMetrics`.
  - Calcular delta real ao invés de multiplicar por `0.85` arbitrariamente.
- [ ] **Busca/Filtro**:
  - Implementar filtragem do array `displayedMetrics` baseada no input de texto.
  - Implementar botão "Atualizar" (Refresh) simples que chama o fetch novamente.

---

## 3. Verificações de Qualidade (QA)

Após as alterações, verificar:
1. **Dados Zerados**: Criar um experimento novo sem dados. O dashboard deve mostrar 0 visitantes, 0 conversões, 0% confiança (e não dados fake ou erros).
2. **Dados Reais**: Simular visita/conversão no banco. O dashboard deve refletir exatamente esses números.
3. **Estatística**:
   - Cenário A: 100 visitas/10 conv (Controle) vs 100 visitas/15 conv (Variante). Confiança deve ser < 90%.
   - Cenário B: 1000 visitas/100 conv vs 1000 visitas/150 conv. Confiança deve ser > 95%.
4. **Performance**: O loading inicial da aba Analytics não deve travar com a chamada RPC.

## 4. Arquivos Impactados

| Arquivo | Prioridade | Descrição |
|---------|------------|-----------|
| `src/lib/experiment-metrics.ts` | Alta | Correção de cálculos estatísticos e receita |
| `src/lib/analytics.ts` | Alta | Remoção de mocks, integração RPC e estatísticas |
| `src/components/dashboard/experiment-details-modal.tsx` | Média | Funcionalidade de botões e limpeza visual |
| `src/app/dashboard/experiments/professional-page.tsx` | Média | Ajustes visuais de métricas |
| `src/components/dashboard/charts-section.tsx` | Média | Filtros e comparações reais |
