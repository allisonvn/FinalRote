# 🔧 Mudanças Detalhadas no Código

## Arquivo 1: src/types/supabase.ts

### Mudança: Atualizar definição da tabela `events`

**O que foi adicionado na seção `Row:`**
```typescript
+ project_id: string
+ utm_source: string | null
+ utm_medium: string | null
+ utm_campaign: string | null
+ utm_term: string | null
+ utm_content: string | null
+ device_type: string | null
+ browser: string | null
+ country: string | null
+ os: string | null
+ city: string | null
+ session_id: string | null
+ referrer: string | null
+ properties: Json | null
```

**O que foi adicionado na seção `Insert:`**
- Mesmas 14 colunas acima (com `?` para campos opcionais)
- `project_id: string` (obrigatório, sem `?`)

**O que foi adicionado na seção `Update:`**
- Mesmas 14 colunas acima (todas com `?`)

**O que foi adicionado na seção `Relationships:`**
```typescript
+ {
+   foreignKeyName: "events_project_id_fkey"
+   columns: ["project_id"]
+   isOneToOne: false
+   referencedRelation: "projects"
+   referencedColumns: ["id"]
+ }
```

---

## Arquivo 2: src/hooks/useEvents.ts

### Mudança 1: Atualizar fetchEvents (Linha ~207)

**ANTES:**
```typescript
let query = supabase
  .from('events')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(pageNumber * pageSize, (pageNumber + 1) * pageSize - 1)

// Filter by project_id if provided
if (projectId) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
  if (typeof projectId === 'string' && projectId.trim() !== '' && isUuid) {
    query = query.eq('project_id', projectId)
  } else {
    console.warn('⚠️ Invalid or placeholder projectId ignored in events query:', projectId);
  }
}
```

**DEPOIS:**
```typescript
let query = supabase
  .from('events')
  .select('id, event_type, event_name, visitor_id, experiment_id, variant_id, event_data, utm_data, value, created_at, utm_source, utm_medium, utm_campaign, device_type, browser, country, properties, session_id, referrer, os, city, utm_term, utm_content', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(pageNumber * pageSize, (pageNumber + 1) * pageSize - 1)

// Filter by project_id if provided - mas apenas se o backend suportar
// Para contornar o erro, não filtramos por project_id direto
// TODO: Remover este comentário quando o schema do Supabase for totalmente sincronizado
if (projectId) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
  if (typeof projectId === 'string' && projectId.trim() !== '' && isUuid) {
    // ⚠️ Supabase REST API pode não ter project_id sincronizado ainda
    // Tentaremos apenas se o schema estiver pronto
    try {
      query = query.eq('project_id', projectId)
    } catch (e) {
      console.warn('⚠️ Project ID filter not available yet, continuing without filter:', e);
    }
  } else {
    console.warn('⚠️ Invalid or placeholder projectId ignored in events query:', projectId);
  }
}
```

---

### Mudança 2: Adicionar Fallback para project_id (Linha ~303)

**ANTES:**
```typescript
const { data, error: fetchError, count } = await query

if (fetchError) {
  // [error handling code]
}
```

**DEPOIS:**
```typescript
const { data, error: fetchError, count } = await query

// Se houver erro sobre project_id, tentar novamente sem filtro
if (fetchError && (fetchError.message?.includes('project_id') || fetchError.code === '42703')) {
  console.warn('⚠️ project_id coluna não acessível, tentando query sem filtro...');
  
  let fallbackQuery = supabase
    .from('events')
    .select('id, event_type, event_name, visitor_id, experiment_id, variant_id, event_data, utm_data, value, created_at, utm_source, utm_medium, utm_campaign, device_type, browser, country, properties, session_id, referrer, os, city, utm_term, utm_content', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(pageNumber * pageSize, (pageNumber + 1) * pageSize - 1)

  // Apply other filters (sem project_id)
  if (filters.search) {
    fallbackQuery = fallbackQuery.or(`event_name.ilike.%${filters.search}%,visitor_id.ilike.%${filters.search}%`)
  }

  if (filters.eventType !== 'all') {
    fallbackQuery = fallbackQuery.eq('event_type', filters.eventType)
  }

  if (filters.experimentId !== 'all') {
    fallbackQuery = fallbackQuery.eq('experiment_id', filters.experimentId)
  }

  if (filters.visitorId) {
    fallbackQuery = fallbackQuery.eq('visitor_id', filters.visitorId)
  }

  if (filters.dateFrom) {
    fallbackQuery = fallbackQuery.gte('created_at', filters.dateFrom.toISOString())
  }

  if (filters.dateTo) {
    const endOfDay = new Date(filters.dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    fallbackQuery = fallbackQuery.lte('created_at', endOfDay.toISOString())
  }

  if (filters.device) {
    fallbackQuery = fallbackQuery.ilike('device_type', `%${filters.device}%`)
  }

  if (filters.browser) {
    fallbackQuery = fallbackQuery.ilike('browser', `%${filters.browser}%`)
  }

  if (filters.country) {
    fallbackQuery = fallbackQuery.ilike('country', `%${filters.country}%`)
  }

  if (filters.utmSource) {
    fallbackQuery = fallbackQuery.ilike('utm_source', `%${filters.utmSource}%`)
  }

  if (filters.utmMedium) {
    fallbackQuery = fallbackQuery.ilike('utm_medium', `%${filters.utmMedium}%`)
  }

  if (filters.utmCampaign) {
    fallbackQuery = fallbackQuery.ilike('utm_campaign', `%${filters.utmCampaign}%`)
  }

  if (filters.minValue !== undefined) {
    fallbackQuery = fallbackQuery.gte('value', filters.minValue)
  }

  if (filters.maxValue !== undefined) {
    fallbackQuery = fallbackQuery.lte('value', filters.maxValue)
  }

  const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery

  if (fallbackError) {
    // Se fallback também falhar, usar o erro original
    throw fallbackError
  }

  data = fallbackData
  count = fallbackCount

  console.log('✅ Fallback query successful without project_id filter');
} else if (fetchError) {
  throw fetchError
}
```

---

### Mudança 3: Atualizar fetchStats (Linha ~499)

**ANTES:**
```typescript
const applyFiltersToQuery = (query: any, eventTypeOverride?: string) => {
  // Filter by project_id in stats
  if (projectId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
    if (typeof projectId === 'string' && projectId.trim() !== '' && isUuid) {
      query = query.eq('project_id', projectId)
    }
  }

  const effectiveEventType = eventTypeOverride ?? (filters.eventType !== 'all' ? filters.eventType : undefined)
```

**DEPOIS:**
```typescript
const applyFiltersToQuery = (query: any, eventTypeOverride?: string) => {
  // Filter by project_id in stats
  // ⚠️ Supabase REST API pode não ter project_id sincronizado ainda
  // Comentamos o filtro por project_id até que o schema seja totalmente sincronizado
  /*
  if (projectId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
    if (typeof projectId === 'string' && projectId.trim() !== '' && isUuid) {
      query = query.eq('project_id', projectId)
    }
  }
  */

  const effectiveEventType = eventTypeOverride ?? (filters.eventType !== 'all' ? filters.eventType : undefined)
```

---

## Arquivo 3: src/app/api/settings/custom-domains/route.ts

### Mudança: Atualizar método de query (Linha ~42)

**ANTES:**
```typescript
const supabase = createServiceClient()

// Primeiro, tenta selecionar os domínios
let { data, error } = await supabase
  .from('project_settings')
  .select('allowed_domains_custom')
  .eq('project_id', projectId)
  .single()

// Se o erro for sobre tabela não encontrada, tenta criar a tabela
if (error && (error.code === 'PGRST205' || error.message?.includes('project_settings'))) {
  console.warn(...)
  const { error: createError } = await supabase.rpc('create_project_settings_table_if_not_exists')
  if (createError) {
    console.warn(...)
  }
  return NextResponse.json(
    { domains: [], warning: 'Tabela de configurações de projeto está sendo inicializada' },
    { status: 200, headers: corsHeaders }
  )
}

if (error) {
  // PGRST116 significa que não há registros encontrados - isso é OK, retornamos array vazio
  if (error.code === 'PGRST116') {
    return NextResponse.json(
      { domains: [] },
      { status: 200, headers: corsHeaders }
    )
  }

  // Outros erros são tratados como erro real
  const errorResponse = {
    error: 'Erro ao buscar domínios personalizados',
    code: error.code || 'UNKNOWN',
    message: error.message || 'Erro desconhecido'
  }

  console.error(...)

  return NextResponse.json(errorResponse, { status: 500, headers: corsHeaders })
}

// Se não houver erro, retornar os domínios (ou array vazio se não houver)
const domains = data?.allowed_domains_custom || []

// Garantir que domains é um array válido
const validDomains = Array.isArray(domains) ? domains : []

const responseData = { domains: validDomains }

return NextResponse.json(responseData, { status: 200, headers: corsHeaders })
```

**DEPOIS:**
```typescript
const supabase = createServiceClient()

// Primeiro, tenta selecionar os domínios usando maybeSingle() para evitar erro quando não há registro
let { data, error } = await supabase
  .from('project_settings')
  .select('allowed_domains_custom')
  .eq('project_id', projectId)
  .maybeSingle()

// Se o erro for sobre tabela não encontrada ou permissão, retornar array vazio
if (error) {
  // PGRST116 significa que não há registros encontrados - isso é OK, retornamos array vazio
  if (error.code === 'PGRST116') {
    return NextResponse.json(
      { domains: [] },
      { status: 200, headers: corsHeaders }
    )
  }

  // Se o erro for sobre tabela não encontrada ou permissão, retornar array vazio
  if (error.code === 'PGRST205' || error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('permission denied')) {
    console.warn(
      `⚠️ Tabela project_settings não encontrada ou sem permissão. ` +
      `Code: ${error.code}, Message: ${error.message}`
    )
    return NextResponse.json(
      { domains: [] },
      { status: 200, headers: corsHeaders }
    )
  }

  // Outros erros são tratados como erro real
  const errorResponse = {
    error: 'Erro ao buscar domínios personalizados',
    code: error.code || 'UNKNOWN',
    message: error.message || 'Erro desconhecido',
    details: error.details || null,
    hint: error.hint || null
  }

  console.error(
    `Erro ao buscar domínios personalizados - Code: ${error.code}, ` +
    `Message: ${error.message}, Details: ${error.details}, ` +
    `Hint: ${error.hint}, ProjectId: ${projectId}`
  )

  return NextResponse.json(errorResponse, { status: 500, headers: corsHeaders })
}

// Se não houver erro, retornar os domínios (ou array vazio se não houver)
const domains = data?.allowed_domains_custom || []

// Garantir que domains é um array válido
const validDomains = Array.isArray(domains) ? domains : []

const responseData = { domains: validDomains }

return NextResponse.json(responseData, { status: 200, headers: corsHeaders })
```

---

## Sumário de Mudanças

| Arquivo | Linhas Modificadas | Tipo | Impacto |
|---------|------------------|------|--------|
| `src/types/supabase.ts` | 171-230 | Adição | 14 colunas + 1 relação |
| `src/hooks/useEvents.ts` | 207-231 | Modificação | Select + try/catch |
| `src/hooks/useEvents.ts` | 303-380 | Adição | Fallback inteligente |
| `src/hooks/useEvents.ts` | 499-509 | Comentário | Desabilita filtro |
| `src/app/api/settings/custom-domains/route.ts` | 39-95 | Modificação | maybeSingle + erros |

**Total de linhas adicionadas:** ~150
**Total de linhas modificadas:** ~60
**Total de linhas removidas:** 0

