"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

interface ExperimentDomainsConfigProps {
  experimentId: string
  projectId: string
}

export function ExperimentDomainsConfig({ experimentId, projectId }: ExperimentDomainsConfigProps) {
  const [domains, setDomains] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchDomains()
    }
  }, [projectId])

  const fetchDomains = async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/settings/custom-domains?projectId=${projectId}`)
      const data = await response.json()

      if (response.ok && data && data.domains) {
        setDomains(data.domains.join('\n'))
      }
    } catch (error) {
      console.error('Erro ao buscar domínios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!projectId) {
      toast.error('ID do projeto não encontrado')
      return
    }

    try {
      setSaving(true)
      const domainsArray = domains.split(/\s*,\s*|\n/).filter(d => d.trim() !== '')
      
      const response = await fetch(`/api/settings/custom-domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, domains: domainsArray })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Domínios salvos com sucesso!')
      } else {
        toast.error(data.error || 'Erro ao salvar domínios')
      }
    } catch (error) {
      console.error('Erro ao salvar domínios:', error)
      toast.error('Erro ao salvar domínios')
    } finally {
      setSaving(false)
    }
  }

  if (!projectId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ID do projeto não configurado para este experimento.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Os domínios configurados aqui serão combinados com a lista padrão de domínios de checkout e afiliados. 
          Eles serão usados para propagar automaticamente os parâmetros UTM em links e formulários.
        </AlertDescription>
      </Alert>

      <div>
        <label className="text-sm font-medium">
          Domínios Personalizados
        </label>
        <Textarea
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          placeholder="pay.hotmart.com&#10;meu-checkout.com.br&#10;outro-dominio.com"
          rows={6}
          className="mt-1 font-mono text-sm"
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Insira um domínio por linha ou separados por vírgula. Exemplos: pay.hotmart.com, checkout.exemplo.com
        </p>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={loading || saving}
        >
          {saving ? 'Salvando...' : 'Salvar Domínios'}
        </Button>
      </div>
    </div>
  )
}

