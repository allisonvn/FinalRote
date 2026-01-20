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
  Building2,
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Users,
  CreditCard,
  Filter,
  RefreshCw,
  Download,
  BarChart3,
  ExternalLink
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  subscription_status: string
  subscription_plan: string | null
  created_at: string
  updated_at: string
  members_count: number
  projects_count: number
  experiments_count: number
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    slug: '',
    owner_email: ''
  })
  const [actionLoading, setActionLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadOrganizations()
  }, [statusFilter])

  const loadOrganizations = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter)
      }

      const { data: orgsData, error } = await query

      if (error) throw error

      // Para cada org, contar membros, projetos e experimentos
      const orgsWithCounts: Organization[] = await Promise.all(
        (orgsData || []).map(async (org) => {
          const [
            { count: membersCount },
            { count: projectsCount },
            { data: projects }
          ] = await Promise.all([
            supabase.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
            supabase.from('projects').select('id').eq('organization_id', org.id)
          ])

          let experimentsCount = 0
          if (projects && projects.length > 0) {
            const { count } = await supabase
              .from('experiments')
              .select('*', { count: 'exact', head: true })
              .in('project_id', projects.map(p => p.id))
            experimentsCount = count || 0
          }

          return {
            ...org,
            members_count: membersCount || 0,
            projects_count: projectsCount || 0,
            experiments_count: experimentsCount
          }
        })
      )

      setOrganizations(orgsWithCounts)
    } catch (error) {
      console.error('Erro ao carregar organizações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrg = async () => {
    if (!newOrgData.name || !newOrgData.slug) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrgData)
      })

      if (!response.ok) throw new Error('Erro ao criar organização')

      setIsCreateDialogOpen(false)
      setNewOrgData({ name: '', slug: '', owner_email: '' })
      loadOrganizations()
    } catch (error) {
      console.error('Erro ao criar organização:', error)
      alert('Erro ao criar organização')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteOrg = async () => {
    if (!selectedOrg) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Erro ao deletar organização')

      setIsDeleteDialogOpen(false)
      setSelectedOrg(null)
      loadOrganizations()
    } catch (error) {
      console.error('Erro ao deletar organização:', error)
      alert('Erro ao deletar organização')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (org: Organization, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ subscription_status: newStatus })
        .eq('id', org.id)

      if (error) throw error
      loadOrganizations()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const filteredOrgs = organizations.filter(org => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      org.name.toLowerCase().includes(search) ||
      org.slug.toLowerCase().includes(search)
    )
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: { className: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Ativo' },
      trialing: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Trial' },
      past_due: { className: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Pendente' },
      canceled: { className: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelado' },
      inactive: { className: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Inativo' }
    }
    const style = styles[status as keyof typeof styles] || styles.inactive
    return <Badge className={style.className}>{style.label}</Badge>
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  return (
    <AdminLayout
      title="Gerenciar Organizações"
      description={`${organizations.length} organizações cadastradas`}
      actions={
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Nova Organização
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Criar Nova Organização</DialogTitle>
              <DialogDescription className="text-slate-400">
                Preencha os dados da nova organização.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Minha Empresa"
                  value={newOrgData.name}
                  onChange={(e) => {
                    setNewOrgData({
                      ...newOrgData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    })
                  }}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="minha-empresa"
                  value={newOrgData.slug}
                  onChange={(e) => setNewOrgData({ ...newOrgData, slug: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-500">URL: rotafinal.com/org/{newOrgData.slug || 'slug'}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner_email">Email do Proprietário</Label>
                <Input
                  id="owner_email"
                  type="email"
                  placeholder="proprietario@email.com"
                  value={newOrgData.owner_email}
                  onChange={(e) => setNewOrgData({ ...newOrgData, owner_email: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-500">Deixe vazio para criar sem proprietário</p>
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
                onClick={handleCreateOrg}
                disabled={actionLoading || !newOrgData.name || !newOrgData.slug}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading ? 'Criando...' : 'Criar Organização'}
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
                placeholder="Buscar por nome ou slug..."
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
                <SelectItem value="trialing">Trial</SelectItem>
                <SelectItem value="past_due">Pendentes</SelectItem>
                <SelectItem value="canceled">Cancelados</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={loadOrganizations}
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

      {/* Organizations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card className="col-span-full bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-slate-500" />
              <p className="text-slate-500">Carregando organizações...</p>
            </CardContent>
          </Card>
        ) : filteredOrgs.length === 0 ? (
          <Card className="col-span-full bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-slate-500 opacity-50" />
              <p className="text-slate-500">Nenhuma organização encontrada</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrgs.map((org) => (
            <Card key={org.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">{org.name}</CardTitle>
                      <CardDescription className="text-slate-500">/{org.slug}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuLabel className="text-slate-400">Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem asChild className="text-slate-300 hover:bg-slate-700">
                        <Link href={`/root-panel/organizations/${org.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:bg-slate-700">
                        <Link href={`/root-panel/organizations/${org.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuLabel className="text-slate-500 text-xs">Alterar Status</DropdownMenuLabel>
                      {['active', 'trialing', 'past_due', 'canceled', 'inactive'].map((status) => (
                        <DropdownMenuItem
                          key={status}
                          className="text-slate-300 hover:bg-slate-700"
                          onClick={() => handleUpdateStatus(org, status)}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          {status === 'active' && 'Ativar'}
                          {status === 'trialing' && 'Trial'}
                          {status === 'past_due' && 'Marcar Pendente'}
                          {status === 'canceled' && 'Cancelar'}
                          {status === 'inactive' && 'Inativar'}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem
                        className="text-red-400 hover:bg-red-500/10"
                        onClick={() => {
                          setSelectedOrg(org)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  {getStatusBadge(org.subscription_status)}
                  <span className="text-xs text-slate-500">
                    Criado em {formatDate(org.created_at)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <Users className="h-3 w-3" />
                    </div>
                    <p className="text-lg font-semibold text-white">{org.members_count}</p>
                    <p className="text-xs text-slate-500">Membros</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <Building2 className="h-3 w-3" />
                    </div>
                    <p className="text-lg font-semibold text-white">{org.projects_count}</p>
                    <p className="text-xs text-slate-500">Projetos</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                      <BarChart3 className="h-3 w-3" />
                    </div>
                    <p className="text-lg font-semibold text-white">{org.experiments_count}</p>
                    <p className="text-xs text-slate-500">Testes</p>
                  </div>
                </div>
                <Link href={`/root-panel/organizations/${org.id}`} className="block mt-4">
                  <Button
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    Ver Detalhes
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tem certeza que deseja deletar a organização <strong>{selectedOrg?.name}</strong>?
              Esta ação não pode ser desfeita e removerá todos os projetos e experimentos associados.
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
              onClick={handleDeleteOrg}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Deletando...' : 'Deletar Organização'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
