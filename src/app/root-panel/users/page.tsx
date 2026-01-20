'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Mail,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  default_org_id: string | null
  is_blocked: boolean
  organizations: {
    id: string
    name: string
    subscription_status: string
  }[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUserData, setNewUserData] = useState({
    email: '',
    full_name: '',
    password: '',
    send_invite: true
  })
  const [actionLoading, setActionLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [statusFilter])

  const loadUsers = async () => {
    setLoading(true)
    try {
      // Buscar perfis de usuários
      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          avatar_url,
          created_at,
          updated_at,
          default_org_id,
          is_blocked
        `)
        .order('created_at', { ascending: false })

      if (statusFilter === 'blocked') {
        query = query.eq('is_blocked', true)
      } else if (statusFilter === 'active') {
        query = query.eq('is_blocked', false)
      }

      const { data: profilesData, error } = await query

      if (error) throw error

      // Para cada usuário, buscar suas organizações
      const usersWithOrgs: User[] = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: memberships } = await supabase
            .from('organization_members')
            .select(`
              organization:organizations (
                id,
                name,
                subscription_status
              )
            `)
            .eq('user_id', profile.id)

          return {
            ...profile,
            is_blocked: profile.is_blocked || false,
            organizations: memberships?.map((m: any) => m.organization).filter(Boolean) || []
          }
        })
      )

      setUsers(usersWithOrgs)
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserData.email) return

    setActionLoading(true)
    try {
      // Criar usuário via API admin
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      })

      if (!response.ok) throw new Error('Erro ao criar usuário')

      setIsCreateDialogOpen(false)
      setNewUserData({ email: '', full_name: '', password: '', send_invite: true })
      loadUsers()
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert('Erro ao criar usuário. Verifique os dados e tente novamente.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao deletar usuário')

      setIsDeleteDialogOpen(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      alert('Erro ao deletar usuário.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleBlock = async (user: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !user.is_blocked })
        .eq('id', user.id)

      if (error) throw error

      loadUsers()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      user.email?.toLowerCase().includes(search) ||
      user.full_name?.toLowerCase().includes(search)
    )
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (user: User) => {
    if (user.is_blocked) {
      return <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">Bloqueado</Badge>
    }
    return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>
  }

  return (
    <AdminLayout
      title="Gerenciar Usuários"
      description={`${users.length} usuários cadastrados`}
      actions={
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription className="text-slate-400">
                Preencha os dados do novo usuário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@email.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  placeholder="Nome do usuário"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha Temporária</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Deixe vazio para enviar convite"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="send_invite"
                  checked={newUserData.send_invite}
                  onChange={(e) => setNewUserData({ ...newUserData, send_invite: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-700"
                />
                <Label htmlFor="send_invite" className="text-sm">Enviar email de convite</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={actionLoading || !newUserData.email}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Filters */}
      <Card className="mb-6 bg-slate-800 border-slate-700">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600 text-white">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="blocked">Bloqueados</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadUsers}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Usuários</CardTitle>
          <CardDescription className="text-slate-400">
            Gerencie todos os usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Carregando usuários...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Usuário</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Organizações</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Cadastro</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-600 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                            ) : (
                              <Users className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {user.full_name || 'Sem nome'}
                            </p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.organizations.length > 0 ? (
                            user.organizations.slice(0, 2).map((org) => (
                              <Badge
                                key={org.id}
                                variant="secondary"
                                className="bg-slate-700 text-slate-300 text-xs"
                              >
                                {org.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">Nenhuma</span>
                          )}
                          {user.organizations.length > 2 && (
                            <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                              +{user.organizations.length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(user)}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuLabel className="text-slate-400">Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem asChild className="text-slate-300 hover:bg-slate-700 focus:bg-slate-700">
                              <Link href={`/root-panel/users/${user.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="text-slate-300 hover:bg-slate-700 focus:bg-slate-700">
                              <Link href={`/root-panel/users/${user.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-slate-300 hover:bg-slate-700 focus:bg-slate-700"
                              onClick={() => handleToggleBlock(user)}
                            >
                              {user.is_blocked ? (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                                  Desbloquear
                                </>
                              ) : (
                                <>
                                  <Ban className="mr-2 h-4 w-4 text-amber-400" />
                                  Bloquear
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                              className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                              onClick={() => {
                                setSelectedUser(user)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tem certeza que deseja deletar o usuário <strong>{selectedUser?.email}</strong>?
              Esta ação não pode ser desfeita.
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
              onClick={handleDeleteUser}
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
