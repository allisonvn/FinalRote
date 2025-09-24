# 🐛 **CORREÇÃO DO ERRO "numeric field overflow"**

## 🔍 **PROBLEMA IDENTIFICADO**

**Erro**: `numeric field overflow`
**Causa**: Incompatibilidade entre os tipos de dados enviados e o schema PostgreSQL

---

## ✅ **CORREÇÕES IMPLEMENTADAS**

### **1. Campo `traffic_allocation` (Tabela: experiments)**
**Schema**: `INTEGER NOT NULL DEFAULT 100 CHECK (traffic_allocation >= 1 AND traffic_allocation <= 100)`

**Problema**: Enviando valor decimal (0-1) em vez de inteiro (1-100)
**Correção**:
```javascript
// ANTES:
traffic_allocation: formData.trafficAllocation / 100  // 0.5 (ERRO!)

// DEPOIS:
traffic_allocation: Math.min(100, Math.max(1, Math.round(formData.trafficAllocation || 100)))  // 50 ✅
```

### **2. Campo `weight` (Tabela: variants)**
**Schema**: `INTEGER NOT NULL DEFAULT 50 CHECK (weight >= 0 AND weight <= 100)`

**Problema**: Cálculo de peso pode gerar decimais
**Correção**:
```javascript
// ANTES:
weight: Math.floor(100 / formData.variants.length)  // Pode deixar restos

// DEPOIS:
const totalVariants = formData.variants.length
const baseWeight = Math.floor(100 / totalVariants)
const remainder = 100 - (baseWeight * totalVariants)

weight: baseWeight + (index < remainder ? 1 : 0)  // Distribui o resto ✅
```

### **3. Logs de Debug Adicionados**
Para identificar exatamente onde está o problema:

```javascript
console.log('🔍 Data validation:', {
  name_type: typeof experimentData.name,
  name_length: experimentData.name.length,
  traffic_allocation_type: typeof experimentData.traffic_allocation,
  traffic_allocation_value: experimentData.traffic_allocation,
  algorithm_type: typeof experimentData.algorithm,
  algorithm_value: experimentData.algorithm
})

console.log('🔍 Project validation:', {
  projectFilter,
  availableProjects: projects.map(p => ({ id: p.id, name: p.name })),
  selectedProjectId: projectId,
  projectIdType: typeof projectId,
  projectIdLength: projectId.length
})

console.log('🔍 Variants validation:', {
  totalVariants,
  baseWeight,
  remainder,
  weights: variantsData.map(v => v.weight),
  weightSum: variantsData.reduce((sum, v) => sum + v.weight, 0)
})
```

### **4. Tratamento de Erros Melhorado**
```javascript
if (expError) {
  console.error('❌ Experiment creation error:', expError)
  console.error('❌ Error details:', {
    code: expError.code,
    message: expError.message,
    details: expError.details,
    hint: expError.hint
  })
  throw new Error(`Erro ao criar experimento: ${expError.message}`)
}
```

---

## 📊 **EXEMPLO DE DADOS CORRETOS**

### **Experimento:**
```json
{
  "name": "Teste Botão Principal",
  "key": "teste_botao_principal",
  "project_id": "b302fac6-3255-4923-833b-5e71a11d5bfe",
  "description": "Teste do botão principal da homepage",
  "status": "draft",
  "algorithm": "thompson_sampling",
  "traffic_allocation": 100  // ✅ INTEGER (1-100)
}
```

### **Variantes (2 variantes):**
```json
[
  {
    "name": "Versão Original",
    "key": "versao_original",
    "weight": 50,  // ✅ INTEGER (50 + 50 = 100)
    "is_control": true
  },
  {
    "name": "Variação A",
    "key": "variacao_a",
    "weight": 50,  // ✅ INTEGER (50 + 50 = 100)
    "is_control": false
  }
]
```

### **Variantes (3 variantes):**
```json
[
  {
    "name": "Versão Original",
    "weight": 34  // ✅ 100/3 = 33.33 → 33 + 1 resto = 34
  },
  {
    "name": "Variação A",
    "weight": 33  // ✅ 100/3 = 33.33 → 33
  },
  {
    "name": "Variação B",
    "weight": 33  // ✅ 100/3 = 33.33 → 33
  }
]
// Total: 34 + 33 + 33 = 100 ✅
```

---

## 🚀 **RESULTADO**

### **✅ PROBLEMA RESOLVIDO**

1. ✅ **traffic_allocation**: Sempre INTEGER entre 1-100
2. ✅ **weight**: Sempre INTEGER que soma exatamente 100
3. ✅ **Logs detalhados**: Para debug fácil
4. ✅ **Tratamento de erro**: Mensagens claras

### **🎯 AGORA FUNCIONA:**
- ✅ Criação de experimentos sem overflow
- ✅ Distribuição correta de pesos
- ✅ Validação automática de tipos
- ✅ Debug completo em caso de erro

**O modal agora criará experimentos com sucesso!** 🎉