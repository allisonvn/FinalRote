'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Mail,
  Calendar,
  Building2,
  CreditCard,
  Activity,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  ArrowLeft,
  Shield,
  Clock,
  BarChart3,
  ExternalLink,
  Save
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface UserDetails {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  default_org_id: string | null
  is_blocked: boolean
  phone: string | null
  organizations: {
    id: string
    name: string
    slug: string
    subscription_status: string
    role: string
    created_at: string
  }[]
  experiments_count: number
  events_count: number
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    full_name: '',
    email: '',
    phone: '',
    is_blocked: false
  })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadUserDetails()
  }, [userId])

  const loadUserDetails = async () => {
    setLoading(true)
    try {
      // Buscar perfil do usuário
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      // Buscar organizações do usuário
      const { data: memberships } = await supabase
        .from('organization_members')
        .select(`
          role,
          created_at,
          organization:organizations (
            id,
            name,
            slug,
            subscription_status
          )
        `)
        .eq('user_id', userId)

      // Contar experimentos
      const { count: experimentsCount } = await supabase
        .from('experiments')
        .select('*', { count: 'exact', head: true })
        .in('project_id',
          (await supabase
            .from('projects')
            .select('id')
            .in('organization_id', memberships?.map((m: any) => m.organization?.id) || [])
          ).data?.map((p: any) => p.id) || []
        )

      const userDetails: UserDetails = {
        ...profile,
        is_blocked: profile.is_blocked || false,
        organizations: memberships?.map((m: any) => ({
          id: m.organization?.id,
          name: m.organization?.name,
          slug: m.organization?.slug,
          subscription_status: m.organization?.subscription_status,
          role: m.role,
          created_at: m.created_at
        })).filter((o: any) => o.id) || [],
        experiments_count: experimentsCount || 0,
        events_count: 0
      }

      setUser(userDetails)
      setEditData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        is_blocked: profile.is_blocked || false
      })
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          phone: editData.phone,
          is_blocked: editData.is_blocked
        })
        .eq('id', user.id)

      if (error) throw error

      setIsEditing(false)
      loadUserDetails()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar alterações')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao deletar')

      router.push('/root-panel/users')
    } catch (error) {
      console.error('Erro ao deletar:', error)
      alert('Erro ao deletar usuário')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleBlock = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !user.is_blocked })
        .eq('id', user.id)

      if (error) throw error
      loadUserDetails()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSubscriptionBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      past_due: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      canceled: 'bg-red-500/20 text-red-400 border-red-500/30',
      inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
    return styles[status as keyof typeof styles] || styles.inactive
  }

  if (loading) {
    return (
      <AdminLayout title="Carregando...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout title="Usuário não encontrado">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">Usuário não encontrado</p>
            <Link href="/root-panel/users">
              <Button className="mt-4" variant="outline">
                Voltar para lista
              </Button>
            </Link>
          </CardContent>
        </Card>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title={isEditing ? 'Editar Usuário' : 'Detalhes do Usuário'}
      description={user.email}
      actions={
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleBlock}
                className={user.is_blocked
                  ? "border-green-600 text-green-400 hover:bg-green-500/10"
                  : "border-amber-600 text-amber-400 hover:bg-amber-500/10"
                }
              >
                {user.is_blocked ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Desbloquear
                  </>
                ) : (
                  <>
                    <Ban className="mr-2 h-4 w-4" />
                    Bloquear
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {actionLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* Back button */}
      <Link href="/root-panel/users" className="inline-flex items-center text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para lista
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Informações do Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={editData.full_name}
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editData.email}
                      disabled
                      className="bg-slate-700/50 border-slate-600 text-slate-400"
                    />
                    <p className="text-xs text-slate-500">O email não pode ser alterado</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="+55 11 99999-9999"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_blocked"
                      checked={editData.is_blocked}
                      onChange={(e) => setEditData({ ...editData, is_blocked: e.target.checked })}
                      className="rounded border-slate-600 bg-slate-700"
                    />
                    <Label htmlFor="is_blocked" className="text-sm">Usuário bloqueado</Label>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-6">
                  <div className="h-20 w-20 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-20 w-20 rounded-full" />
                    ) : (
                      <Users className="h-10 w-10 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {user.full_name || 'Sem nome'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-400">{user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {user.is_blocked ? (
                        <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                          <Ban className="mr-1 h-3 w-3" />
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Ativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizations */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Organizações</CardTitle>
              <CardDescription className="text-slate-400">
                Organizações que este usuário participa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.organizations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma organização</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.organizations.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-600 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{org.name}</p>
                          <p className="text-xs text-slate-500">/{org.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getSubscriptionBadge(org.subscription_status)}>
                          {org.subscription_status}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          {org.role}
                        </Badge>
                        <Link href={`/root-panel/organizations/${org.id}`}>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Building2 className="h-4 w-4" />
                  <span>Organizações</span>
                </div>
                <span className="font-medium text-white">{user.organizations.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <BarChart3 className="h-4 w-4" />
                  <span>Experimentos</span>
                </div>
                <span className="font-medium text-white">{user.experiments_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Activity className="h-4 w-4" />
                  <span>Eventos</span>
                </div>
                <span className="font-medium text-white">{user.events_count}</span>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Cadastro</span>
                </div>
                <p className="text-white text-sm">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Última atualização</span>
                </div>
                <p className="text-white text-sm">{formatDate(user.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-slate-800 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 text-base">Zona de Perigo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-4">
                Ações irreversíveis. Tenha cuidado.
              </p>
              <Button
                variant="destructive"
                className="w-full bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar Usuário
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tem certeza que deseja deletar o usuário <strong>{user.email}</strong>?
              Esta ação não pode ser desfeita e removerá todos os dados associados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Deletando...' : 'Deletar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
