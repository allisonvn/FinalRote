import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params
    const tableName = table

    // Mock data para constraints - não fazer query ao Supabase pois information_schema não está no RLS
    const mockConstraints: any = {
      experiments: [
        { constraint_name: 'experiments_pkey', constraint_type: 'PRIMARY KEY', table_name: 'experiments' },
        { constraint_name: 'experiments_project_id_fkey', constraint_type: 'FOREIGN KEY', table_name: 'experiments' }
      ]
    }

    // Agrupar constraints por tipo
    const groupedConstraints = {
      primary_keys: mockConstraints[tableName]?.filter((c: any) => c.constraint_type === 'PRIMARY KEY') || [],
      foreign_keys: mockConstraints[tableName]?.filter((c: any) => c.constraint_type === 'FOREIGN KEY') || [],
      unique_constraints: mockConstraints[tableName]?.filter((c: any) => c.constraint_type === 'UNIQUE') || [],
      check_constraints: mockConstraints[tableName]?.filter((c: any) => c.constraint_type === 'CHECK') || []
    }

    // Análise de constraints críticas
    const criticalAnalysis = {
      has_primary_key: groupedConstraints.primary_keys.length > 0,
      has_foreign_keys: groupedConstraints.foreign_keys.length > 0,
      has_unique_constraints: groupedConstraints.unique_constraints.length > 0,
      has_check_constraints: groupedConstraints.check_constraints.length > 0,
      potential_issues: [] as string[]
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
        total_constraints: mockConstraints[tableName]?.length || 0,
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