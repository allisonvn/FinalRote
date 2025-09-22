"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DashboardSimple() {
  console.log('Dashboard Simple: Component rendering')
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('Dashboard Simple: Checking user...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('Dashboard Simple: User found:', session.user.id)
          setUser(session.user)
        } else {
          console.log('Dashboard Simple: No user found')
        }
      } catch (error) {
        console.error('Dashboard Simple: Error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Dashboard Funcionando!
          </h1>
          <p className="text-gray-600 mb-4">
            Se você está vendo esta mensagem, o dashboard está funcionando corretamente.
          </p>
          {user && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                ✅ Usuário Autenticado
              </h2>
              <p className="text-green-700">
                <strong>ID:</strong> {user.id}
              </p>
              <p className="text-green-700">
                <strong>Email:</strong> {user.email}
              </p>
            </div>
          )}
          <div className="mt-6">
            <button 
              onClick={() => window.location.href = '/auth/signin'}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
