import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } }
) {
  try {
    const tableName = params.table
    const supabase = createServiceClient()

    // Query para constraints
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select(`
        constraint_name,
        constraint_type,
        table_name
      `)
      .eq('table_name', tableName)

    if (constraintsError) {
      return NextResponse.json(
        { error: `Erro ao obter constraints da tabela ${tableName}: ${constraintsError.message}` },
        { status: 500 }
      )
    }

    // Agrupar constraints por tipo
    const groupedConstraints = {
      primary_keys: constraints?.filter(c => c.constraint_type === 'PRIMARY KEY') || [],
      foreign_keys: constraints?.filter(c => c.constraint_type === 'FOREIGN KEY') || [],
      unique_constraints: constraints?.filter(c => c.constraint_type === 'UNIQUE') || [],
      check_constraints: constraints?.filter(c => c.constraint_type === 'CHECK') || []
    }

    // Análise de constraints críticas
    const criticalAnalysis = {
      has_primary_key: groupedConstraints.primary_keys.length > 0,
      has_foreign_keys: groupedConstraints.foreign_keys.length > 0,
      has_unique_constraints: groupedConstraints.unique_constraints.length > 0,
      has_check_constraints: groupedConstraints.check_constraints.length > 0,
      potential_issues: []
    }

    // Detectar possíveis problemas
    if (!criticalAnalysis.has_primary_key) {
      criticalAnalysis.potential_issues.push('Tabela sem chave primária - pode causar problemas de performance')
    }

    const result = {
      table_name: tableName,
      constraints: groupedConstraints,
      analysis: criticalAnalysis,
      summary: {
        total_constraints: constraints?.length || 0,
        primary_keys: groupedConstraints.primary_keys.length,
        foreign_keys: groupedConstraints.foreign_keys.length,
        unique_constraints: groupedConstraints.unique_constraints.length,
        check_constraints: groupedConstraints.check_constraints.length,
        potential_issues: criticalAnalysis.potential_issues.length
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in constraints debug:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}