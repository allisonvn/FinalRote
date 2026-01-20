import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  // No Next.js, variáveis NEXT_PUBLIC_* são incorporadas no build
  // Se não estiverem disponíveis, significa que não foram configuradas corretamente
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  if (!url || !key) {
    // No servidor (SSR), retornar cliente mock para evitar crash
    if (typeof window === 'undefined') {
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          signInWithPassword: async () => ({ data: null, error: { message: 'missing-env' } as any }),
          signUp: async () => ({ data: { user: null } as any, error: { message: 'missing-env' } as any }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } } as any),
          signOut: async () => ({ error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
        },
        from: () => ({ insert: async () => ({ data: null, error: { message: 'missing-env' } as any }) }),
      } as any
    }
    
    // No browser, lançar erro claro se variáveis não estiverem disponíveis
    // Isso indica que o build não incorporou as variáveis corretamente
    console.error('Supabase environment variables not found. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local and rebuild the application.')
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!\n\nCheck your Supabase project\'s API settings to find these values\nhttps://supabase.com/dashboard/project/_/settings/api')
  }
  
  return createBrowserClient<Database>(url, key)
}