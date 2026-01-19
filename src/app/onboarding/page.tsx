'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    orgName: '',
    projectName: '',
    website: ''
  })

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Obter usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Sessao invalida. Faca login novamente.')
      }

      // 2. Criar organizacao
      const orgSlug = formData.orgName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 30)

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.orgName,
          slug: orgSlug + '-' + Date.now(),
          plan_slug: 'trial',
          subscription_status: 'trialing',
          is_active: true,
          created_by: user.id
        })
        .select('id')
        .single()

      if (orgError) {
        throw new Error('Erro ao criar organizacao: ' + orgError.message)
      }

      // 3. Adicionar usuario como owner
      await supabase
        .from('organization_members')
        .insert({
          org_id: org.id,
          user_id: user.id,
          role: 'owner',
          invited_by: user.id
        })

      // 4. Atualizar default_org_id do usuario
      const { error: updateError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          default_org_id: org.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
        })

      if (updateError) {
        console.error('Erro ao atualizar usuario:', updateError)
      }

      // 5. Criar projeto inicial se informado
      if (formData.projectName) {
        await supabase
          .from('projects')
          .insert({
            org_id: org.id,
            name: formData.projectName,
            domain: formData.website || null,
            is_active: true
          })
      }

      // 6. Redirecionar para dashboard
      router.push('/dashboard')
      router.refresh()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
      <SubscriptionBanner />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Bem-vindo ao Rota Final
          </h1>
          <p className="text-gray-400">
            Vamos configurar sua conta em poucos passos
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${s <= step ? 'bg-indigo-500' : 'bg-gray-600'
                }`}
            />
          ))}
        </div>

        {/* Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome da sua empresa ou projeto
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.orgName}
                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Minha Empresa"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.orgName}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  Continuar
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome do seu primeiro projeto (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Meu Site"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL do site (opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://meusite.com.br"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium rounded-lg transition-colors"
                  >
                    {loading ? 'Criando...' : 'Finalizar'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Voce pode alterar essas configuracoes depois nas settings.
        </p>
      </div>
    </div>
  )
}
