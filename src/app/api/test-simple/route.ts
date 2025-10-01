import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [TEST] API simples funcionando')
    
    const body = await request.json()
    console.log('🔍 [TEST] Body recebido:', body)
    
    return NextResponse.json({
      success: true,
      message: 'API simples funcionando',
      received: body
    })
    
  } catch (error) {
    console.error('❌ [TEST] Erro na API simples:', error)
    return NextResponse.json(
      { error: 'Erro na API simples', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API simples funcionando - GET'
  })
}
