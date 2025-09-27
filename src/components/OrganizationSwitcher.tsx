'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Building2, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'

export function OrganizationSwitcher() {
  const { user, switchOrganization, createOrganization } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgSlug, setNewOrgSlug] = useState('')

  if (!user) return null

  const handleSwitchOrg = async (orgId: string) => {
    try {
      await switchOrganization(orgId)
      toast.success('Organização alterada!')
    } catch (error) {
      toast.error('Erro ao trocar organização')
    }
  }

  const handleCreateOrg = async () => {
    if (!newOrgName.trim() || !newOrgSlug.trim()) {
      toast.error('Nome e slug são obrigatórios')
      return
    }

    try {
      setIsCreating(true)
      await createOrganization(newOrgName, newOrgSlug)
      setNewOrgName('')
      setNewOrgSlug('')
      toast.success('Organização criada!')
    } catch (error) {
      toast.error('Erro ao criar organização')
    } finally {
      setIsCreating(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setNewOrgName(name)
    if (!newOrgSlug) {
      setNewOrgSlug(generateSlug(name))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Building2 className="h-4 w-4 mr-2" />
          {user.currentOrg?.name || 'Selecionar organização'}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="start">
        {user.organizations?.map(({ organization, membership }) => (
          <DropdownMenuItem
            key={organization.id}
            onClick={() => handleSwitchOrg(organization.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">{organization.name}</span>
              <span className="text-xs text-muted-foreground">
                {membership.role}
              </span>
            </div>
            {user.currentOrg?.id === organization.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="p-2 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Criar nova organização
          </div>
          <input
            type="text"
            placeholder="Nome da organização"
            value={newOrgName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
          />
          <input
            type="text"
            placeholder="slug"
            value={newOrgSlug}
            onChange={(e) => setNewOrgSlug(e.target.value)}
            className="w-full px-2 py-1 text-sm border rounded"
          />
          <Button
            size="sm"
            onClick={handleCreateOrg}
            disabled={isCreating || !newOrgName.trim() || !newOrgSlug.trim()}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            {isCreating ? 'Criando...' : 'Criar'}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
