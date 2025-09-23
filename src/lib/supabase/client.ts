import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !key) {
    // Evitar crash em export estático, cliente será criado em runtime no browser
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
  }
  return createBrowserClient<Database>(url, key)
}