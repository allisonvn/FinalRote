'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ReactNode } from 'react'

// Lista de emails de administradores do sistema
const ADMIN_EMAILS = [
  'admin@rotafinal.com',
  'suporte@rotafinal.com',
  'eu@allison.com.br',
  // Adicione emails de administradores aqui
]

export default function RootPanelLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const checkAdminAccess = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error || !session?.user) {
          if (mounted) window.location.href = '/auth/signin?redirectTo=/root-panel'
          return
        }

        // Verificar se é admin pelo email ou metadata
        const userEmail = session.user.email || ''
        const userMetadata = session.user.user_metadata || {}
        const isSystemAdmin = ADMIN_EMAILS.includes(userEmail) || userMetadata.is_super_admin === true

        // Verificar também no banco se o usuário é admin global
        const { data: adminCheck } = await supabase
          .from('system_admins')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        const hasAdminAccess = isSystemAdmin || !!adminCheck

        if (!hasAdminAccess) {
          if (mounted) {
            window.location.href = '/dashboard?error=access_denied'
          }
          return
        }

        if (mounted) {
          setUser(session.user)
          setIsAdmin(true)
          setLoading(false)
        }
      } catch (error) {
        console.error('Admin access check error:', error)
        if (mounted) window.location.href = '/auth/signin'
      }
    }

    checkAdminAccess()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (!session?.user) {
        window.location.href = '/auth/signin'
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Verificando acesso administrativo...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-medium">Acesso negado</p>
          <p className="text-slate-500 text-sm mt-2">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {children}
    </div>
  )
}
