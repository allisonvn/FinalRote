import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      )
    }

    // Usar service role client (servidor apenas)
    const supabase = createServiceClient()

    // Confirmar email do usuário
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true
    })

    if (error) {
      console.error('Erro ao confirmar email:', error)
      return NextResponse.json(
        { error: 'Falha ao confirmar email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na confirmação de email:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
