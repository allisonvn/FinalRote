'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { User, Loader2, UserPlus, LogIn, BarChart3, Shield, Zap, TrendingUp } from 'lucide-react'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('signin')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check for existing session and redirect immediately
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        window.location.href = '/dashboard'
        return
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Create organization for new user
          if (event === 'SIGNED_UP' as any) {
            await createUserOrganization(session.user)
          }
          
          // Redirect immediately
          window.location.href = '/dashboard'
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const createUserOrganization = async (user: any) => {
    try {
      // Create organization
      const orgName = user.user_metadata?.full_name 
        ? `${user.user_metadata.full_name}'s Organization`
        : 'Minha Organização'
      
      const { data: org, error: orgError } = await (supabase as any)
        .from('organizations')
        .insert({
          name: orgName,
          slug: `org-${user.id.slice(0, 8)}`
        })
        .select()
        .single()

      if (orgError) {
        console.error('Error creating organization:', orgError)
        return
      }

      // Add user as owner
      const { error: memberError } = await (supabase as any)
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) {
        console.error('Error creating membership:', memberError)
      }

      // Create a default project so the user can start creating experiments immediately
      const { error: projectError } = await (supabase as any)
        .from('projects')
        .insert({
          organization_id: org.id,
          name: 'Projeto Padrão'
        })
        .select('id')
        .single()

      if (projectError) {
        console.error('Error creating default project:', projectError)
      }
    } catch (error) {
      console.error('Error setting up user:', error)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        if (error.message.includes('email_not_confirmed')) {
          setMessage('Por favor, verifique seu email e clique no link de confirmação antes de fazer login.')
        } else {
          setMessage(`Erro: ${error.message}`)
        }
      } else {
        setMessage('Login realizado com sucesso!')
        // O redirecionamento será feito pelo listener de auth state
      }
    } catch (error) {
      setMessage('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error, data } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          }
        }
      })

      if (error) {
        if (error.message.includes('User already registered')) {
          setMessage('Este email já está cadastrado. Tente fazer login.')
        } else if (error.message.includes('Password should be at least')) {
          setMessage('A senha deve ter pelo menos 6 caracteres.')
        } else {
          setMessage(`Erro: ${error.message}`)
        }
      } else {
        // Se o cadastro foi bem-sucedido, tentar confirmar automaticamente e fazer login
        if (data.user) {
          try {
            // Confirmar email automaticamente usando API route segura
            const response = await fetch('/api/auth/confirm-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId: data.user.id
              })
            })
            
            if (response.ok) {
              // Após confirmar, fazer login automaticamente
              const { error: loginError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
              })
              
              if (loginError) {
                setMessage('Conta criada e confirmada! Faça login com suas credenciais.')
              } else {
                setMessage('Conta criada com sucesso!')
                // O listener de auth state vai fazer o redirecionamento
              }
            } else {
              setMessage('Conta criada! Verifique seu email para confirmação.')
            }
          } catch (confirmError) {
            setMessage('Conta criada! Verifique seu email para confirmação.')
          }
        } else {
          setMessage('Conta criada! Verifique seu email para confirmação.')
        }
      }
    } catch (error) {
      setMessage('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Se usuário já está logado, redirecionar imediatamente
  if (user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'
    }
    return null
  }

  return (
    <div className="relative min-h-screen p-4 flex items-center justify-center">
      {/* Brand link */}
      <Link href="/" className="absolute left-4 top-4 inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground">
        <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold">Rota Final</span>
      </Link>
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: value props */}
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold tracking-tight">Teste A/B inteligente com otimização automática</h1>
          <p className="mt-3 text-muted-foreground">Crie, execute e acompanhe experimentos sem esforço. Algoritmos avançados maximizam suas conversões em tempo real.</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-3"><Shield className="w-4 h-4 mt-0.5 text-green-600" /> Enterprise security, RLS e HMAC</li>
            <li className="flex items-start gap-3"><Zap className="w-4 h-4 mt-0.5 text-yellow-600" /> Zero-flicker com SSR e Edge</li>
            <li className="flex items-start gap-3"><TrendingUp className="w-4 h-4 mt-0.5 text-blue-600" /> Analytics em tempo real</li>
          </ul>
        </div>
        {/* Right: card */}
        <Card className="w-full backdrop-blur bg-white/80 dark:bg-black/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Entrar ou criar conta</CardTitle>
            <CardDescription>Use seu email para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Entrar
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Seu nome completo"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar conta
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm text-center ${
              message.includes('sucesso') || message.includes('criada')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Ao continuar, você concorda com nossos{' '}
              <a href="#" className="underline">Termos de Uso</a>
              {' '}e{' '}
              <a href="#" className="underline">Política de Privacidade</a>
            </p>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
