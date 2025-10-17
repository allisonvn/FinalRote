import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params
    const tableName = table

    // Schema mockado baseado no que sabemos da tabela experiments
    const mockSchema = {
      experiments: {
        columns: [
          {
            column_name: 'id',
            data_type: 'uuid',
            is_nullable: 'NO',
            column_default: 'gen_random_uuid()',
            numeric_precision: null,
            numeric_scale: null,
            ordinal_position: 1
          },
          {
            column_name: 'project_id',
            data_type: 'uuid',
            is_nullable: 'NO',
            column_default: null,
            numeric_precision: null,
            numeric_scale: null,
            ordinal_position: 2
          },
          {
            column_name: 'name',
            data_type: 'text',
            is_nullable: 'NO',
            column_default: null,
            numeric_precision: null,
            numeric_scale: null,
            ordinal_position: 3
          },
          {
            column_name: 'description',
            data_type: 'text',
            is_nullable: 'YES',
            column_default: null,
            numeric_precision: null,
            numeric_scale: null,
            ordinal_position: 4
          },
          {
            column_name: 'type',
            data_type: 'USER-DEFINED',
            is_nullable: 'NO',
            column_default: "'redirect'::experiment_type",
            numeric_precision: null,
            numeric_scale: null,
            ordinal_position: 5
          },
          {
            column_name: 'traffic_allocation',
            data_type: 'numeric',
            is_nullable: 'YES',
            column_default: '100.00',
            numeric_precision: 5,
            numeric_scale: 2,
            ordinal_position: 6
          },
          {
            column_name: 'status',
            data_type: 'USER-DEFINED',
            is_nullable: 'YES',
            column_default: "'draft'::experiment_status",
            numeric_precision: null,
            numeric_scale: null,
            ordinal_position: 7
          },
          {
            column_name: 'user_id',
            data_type: 'uuid',
            is_nullable: 'YES',
            column_default: null,
            numeric_precision: null,
            numeric_scale: null,
            ordinal_position: 8
          },
          {
            column_name: 'created_at',
            data_type: 'timestamp with time zone',
            is_nullable: 'NO',
            column_default: 'now()',
            numeric_precision: null,
            numeric_scale: null,
            ordinal_position: 9
          },
          {
            column_name: 'updated_at',
            data_type: 'timestamp with time zone',
            is_nullable: 'NO',
            column_default: 'now()',
            numeric_precision: null,
            numeric_scale: null,
            ordinal_position: 10
          }
        ],
        constraints: [
          {
            constraint_name: 'experiments_pkey',
            constraint_type: 'PRIMARY KEY',
            table_name: 'experiments'
          },
          {
            constraint_name: 'experiments_project_id_fkey',
            constraint_type: 'FOREIGN KEY',
            table_name: 'experiments'
          }
        ]
      }
    }

    const schema = mockSchema[tableName as keyof typeof mockSchema]
    
    if (!schema) {
      return NextResponse.json(
        { error: `Tabela ${tableName} não encontrada no schema mockado` },
        { status: 404 }
      )
    }

    const result = {
      table_name: tableName,
      columns: schema.columns,
      constraints: schema.constraints,
      summary: {
        total_columns: schema.columns.length,
        nullable_columns: schema.columns.filter(col => col.is_nullable === 'YES').length,
        required_columns: schema.columns.filter(col => col.is_nullable === 'NO').length,
        numeric_columns: schema.columns.filter(col => col.data_type === 'numeric').length,
        text_columns: schema.columns.filter(col => col.data_type === 'text' || col.data_type === 'character varying').length,
        total_constraints: schema.constraints.length
      },
      analysis: {
        critical_fields: schema.columns.filter(col => 
          col.is_nullable === 'NO' && 
          !col.column_default
        ).map(col => ({
          name: col.column_name,
          type: col.data_type,
          precision: col.numeric_precision,
          scale: col.numeric_scale
        })),
        numeric_fields: schema.columns.filter(col => col.data_type === 'numeric').map(col => ({
          name: col.column_name,
          precision: col.numeric_precision,
          scale: col.numeric_scale,
          max_value: col.numeric_precision ? Math.pow(10, col.numeric_precision - col.numeric_scale) - 1 : null,
          max_decimal: col.numeric_scale ? Math.pow(10, col.numeric_scale) - 1 : null
        })),
        potential_issues: [] as any[]
      }
    }

    // Análise específica para problemas conhecidos
    if (tableName === 'experiments') {
      const trafficAllocationField = schema.columns.find(col => col.column_name === 'traffic_allocation')
      if (trafficAllocationField) {
        result.analysis.potential_issues.push({
          field: 'traffic_allocation',
          issue: 'Campo numeric(5,2) com constraint CHECK - máximo 99.99',
          solution: 'Valores devem estar entre 0.00 e 99.99 (precisão corrigida)',
          current_limits: {
            max_integer_part: 3,
            max_decimal_part: 2,
            max_value: 99.99,
            constraint: 'CHECK (traffic_allocation >= 0 AND traffic_allocation <= 99.99)',
            precision: 'numeric(5,2) - CORRIGIDO de numeric(5,6)'
          },
          status: 'CORRIGIDO - Precisão alterada de numeric(5,6) para numeric(5,2)'
        })
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in schema debug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
