import { createClient as createClientBrowser } from '@/lib/supabase/client'
import { createClient as createClientServer } from '@/lib/supabase/server'

// Simplified auth helpers
export const auth = {
  async signInWithEmail(email: string) {
    const supabase = createClientBrowser()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })
    return { error }
  },

  async signInWithGoogle() {
    const supabase = createClientBrowser()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  async signInWithGitHub() {
    const supabase = createClientBrowser()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  },

  async signOut() {
    const supabase = createClientBrowser()
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const supabase = createClientBrowser()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null

    return user
  }
}

// Server-side auth helpers
export const authServer = {
  async getCurrentUser() {
    const supabase = await createClientServer()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null

    return user
  },

  async requireAuth() {
    const user = await this.getCurrentUser()
    if (!user) {
      throw new Error('Authentication required')
    }
    return user
  }
}