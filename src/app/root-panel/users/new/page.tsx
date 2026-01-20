'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserPlus,
  ArrowLeft,
  Mail,
  User,
  Lock,
  Building2,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirm_password: '',
    send_invite: true,
    create_org: false,
    org_name: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
    }

    if (formData.password && formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Senhas não coincidem'
    }

    if (formData.create_org && !formData.org_name) {
      newErrors.org_name = 'Nome da organização é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password || undefined,
          send_invite: formData.send_invite && !formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      // Se create_org está marcado, criar organização
      if (formData.create_org && formData.org_name) {
        const orgResponse = await fetch('/api/admin/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.org_name,
            slug: formData.org_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            owner_email: formData.email,
            subscription_status: 'trialing'
          })
        })

        if (!orgResponse.ok) {
          console.error('Erro ao criar organização, mas usuário foi criado')
        }
      }

      router.push('/root-panel/users')
    } catch (error: any) {
      setErrors({ submit: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout
      title="Novo Usuário"
      description="Criar um novo usuário no sistema"
    >
      {/* Back button */}
      <Link href="/root-panel/users" className="inline-flex items-center text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para lista
      </Link>

      <div className="max-w-2xl">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-red-400" />
              Criar Novo Usuário
            </CardTitle>
            <CardDescription className="text-slate-400">
              Preencha os dados do novo usuário. Você pode enviar um convite por email ou definir uma senha inicial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`bg-slate-700 border-slate-600 text-white ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  Nome Completo
                </Label>
                <Input
                  id="full_name"
                  placeholder="Nome do usuário"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Senha */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-400" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Deixe vazio para enviar convite"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`bg-slate-700 border-slate-600 text-white ${errors.password ? 'border-red-500' : ''}`}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-400">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-white">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirme a senha"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className={`bg-slate-700 border-slate-600 text-white ${errors.confirm_password ? 'border-red-500' : ''}`}
                    disabled={!formData.password}
                  />
                  {errors.confirm_password && (
                    <p className="text-sm text-red-400">{errors.confirm_password}</p>
                  )}
                </div>
              </div>

              {/* Opções */}
              <div className="space-y-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="send_invite"
                    checked={formData.send_invite}
                    onChange={(e) => setFormData({ ...formData, send_invite: e.target.checked })}
                    className="rounded border-slate-600 bg-slate-700 text-red-600 focus:ring-red-500"
                    disabled={!!formData.password}
                  />
                  <Label htmlFor="send_invite" className="text-white">
                    Enviar email de convite
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="create_org"
                    checked={formData.create_org}
                    onChange={(e) => setFormData({ ...formData, create_org: e.target.checked })}
                    className="rounded border-slate-600 bg-slate-700 text-red-600 focus:ring-red-500"
                  />
                  <Label htmlFor="create_org" className="text-white">
                    Criar organização para este usuário
                  </Label>
                </div>

                {formData.create_org && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="org_name" className="text-white flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      Nome da Organização
                    </Label>
                    <Input
                      id="org_name"
                      placeholder="Minha Empresa"
                      value={formData.org_name}
                      onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                      className={`bg-slate-700 border-slate-600 text-white ${errors.org_name ? 'border-red-500' : ''}`}
                    />
                    {errors.org_name && (
                      <p className="text-sm text-red-400">{errors.org_name}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Info box */}
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300">
                    <p className="font-medium text-amber-400 mb-1">Informação</p>
                    <p>
                      {formData.password
                        ? 'O usuário será criado com a senha definida e poderá fazer login imediatamente.'
                        : 'O usuário receberá um email de convite para definir sua senha e acessar o sistema.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {errors.submit && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4">
                <Link href="/root-panel/users">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {loading ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
