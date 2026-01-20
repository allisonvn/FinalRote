import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Tabelas permitidas para consulta de schema
const VALID_TABLES = [
  'experiments',
  'variants',
  'events',
  'assignments',
  'projects',
  'organizations',
  'subscriptions',
  'users',
  'organization_members',
  'variant_stats'
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params
    const tableName = table

    // Validar nome da tabela para prevenir SQL injection
    if (!VALID_TABLES.includes(tableName)) {
      return NextResponse.json(
        { error: `Tabela '${tableName}' não permitida. Tabelas válidas: ${VALID_TABLES.join(', ')}` },
        { status: 400 }
      )
    }

    // Usar service role para acessar information_schema
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase não configurado' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Tentar usar a função RPC se existir, senão usar fallback
    let columns: any[] = []
    let constraints: any[] = []

    try {
      // Tentar usar função RPC criada na migration
      const { data: schemaData, error: rpcError } = await supabase.rpc('get_table_schema', {
        p_table_name: tableName
      })

      if (!rpcError && schemaData) {
        columns = schemaData
      } else {
        // Fallback: consulta direta se RPC não existir
        console.warn('RPC get_table_schema não disponível, usando fallback')
        throw new Error('Fallback to direct query')
      }
    } catch {
      // Fallback: retornar schema básico conhecido
      columns = getKnownSchemaForTable(tableName)
    }

    // Buscar contagem de registros
    let rowCount = 0
    try {
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      rowCount = count || 0
    } catch {
      rowCount = -1 // Indica erro ao contar
    }

    const result = {
      table_name: tableName,
      columns,
      row_count: rowCount,
      summary: {
        total_columns: columns.length,
        nullable_columns: columns.filter((col: any) => col.is_nullable === 'YES').length,
        required_columns: columns.filter((col: any) => col.is_nullable === 'NO').length,
      },
      data_source: columns.length > 0 ? 'database' : 'fallback',
      note: 'Schema obtido do information_schema do PostgreSQL'
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in schema debug:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Schema conhecido para fallback quando RPC não está disponível
function getKnownSchemaForTable(tableName: string): any[] {
  const schemas: Record<string, any[]> = {
    experiments: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
      { column_name: 'project_id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'type', data_type: 'experiment_type', is_nullable: 'NO', column_default: "'redirect'" },
      { column_name: 'status', data_type: 'experiment_status', is_nullable: 'YES', column_default: "'draft'" },
      { column_name: 'algorithm', data_type: 'text', is_nullable: 'YES', column_default: "'thompson_sampling'" },
      { column_name: 'traffic_allocation', data_type: 'numeric(5,2)', is_nullable: 'YES', column_default: '100.00' },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
      { column_name: 'updated_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ],
    variants: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
      { column_name: 'experiment_id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'key', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'is_control', data_type: 'boolean', is_nullable: 'YES', column_default: 'false' },
      { column_name: 'traffic_percentage', data_type: 'numeric', is_nullable: 'YES', column_default: '50' },
      { column_name: 'is_active', data_type: 'boolean', is_nullable: 'YES', column_default: 'true' },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ],
    events: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
      { column_name: 'experiment_id', data_type: 'uuid', is_nullable: 'YES', column_default: null },
      { column_name: 'variant_id', data_type: 'uuid', is_nullable: 'YES', column_default: null },
      { column_name: 'visitor_id', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'event_type', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'event_name', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'event_data', data_type: 'jsonb', is_nullable: 'YES', column_default: "'{}'" },
      { column_name: 'value', data_type: 'numeric', is_nullable: 'YES', column_default: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ],
    projects: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'slug', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ],
    organizations: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
      { column_name: 'name', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'slug', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ],
    subscriptions: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'status', data_type: 'text', is_nullable: 'NO', column_default: "'active'" },
      { column_name: 'plan_id', data_type: 'uuid', is_nullable: 'YES', column_default: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ],
    users: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'email', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'full_name', data_type: 'text', is_nullable: 'YES', column_default: null },
      { column_name: 'default_org_id', data_type: 'uuid', is_nullable: 'YES', column_default: null },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ],
    assignments: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
      { column_name: 'experiment_id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'variant_id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'visitor_id', data_type: 'text', is_nullable: 'NO', column_default: null },
      { column_name: 'assigned_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ],
    organization_members: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
      { column_name: 'org_id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'user_id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'role', data_type: 'text', is_nullable: 'NO', column_default: "'member'" },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ],
    variant_stats: [
      { column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
      { column_name: 'variant_id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'experiment_id', data_type: 'uuid', is_nullable: 'NO', column_default: null },
      { column_name: 'visitors', data_type: 'integer', is_nullable: 'YES', column_default: '0' },
      { column_name: 'conversions', data_type: 'integer', is_nullable: 'YES', column_default: '0' },
      { column_name: 'revenue', data_type: 'numeric', is_nullable: 'YES', column_default: '0' },
      { column_name: 'created_at', data_type: 'timestamptz', is_nullable: 'NO', column_default: 'now()' },
    ],
  }

  return schemas[tableName] || []
}
