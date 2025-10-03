"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Save, Check, AlertCircle } from 'lucide-react'
import { useSupabaseExperiments } from '@/hooks/useSupabaseExperiments'
import { toast } from 'sonner'

interface UrlConfigurationDemoProps {
  experimentId: string
  variants: Array<{
    id: string
    name: string
    is_control: boolean
    redirect_url?: string
  }>
}

export function UrlConfigurationDemo({ experimentId, variants }: UrlConfigurationDemoProps) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const { updateVariant } = useSupabaseExperiments()

  // Inicializar URLs do estado
  useEffect(() => {
    const initialUrls: Record<string, string> = {}
    variants.forEach(variant => {
      initialUrls[variant.id] = variant.redirect_url || ''
    })
    setUrls(initialUrls)
  }, [variants])

  const handleUrlChange = (variantId: string, url: string) => {
    setUrls(prev => ({ ...prev, [variantId]: url }))
  }

  const handleSaveUrl = async (variantId: string) => {
    setSaving(prev => ({ ...prev, [variantId]: true }))
    
    try {
      await updateVariant(variantId, { redirect_url: urls[variantId] })
      toast.success('URL salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar URL:', error)
      toast.error('Erro ao salvar URL')
    } finally {
      setSaving(prev => ({ ...prev, [variantId]: false }))
    }
  }

  const hasUnsavedChanges = (variantId: string) => {
    const variant = variants.find(v => v.id === variantId)
    return variant && urls[variantId] !== (variant.redirect_url || '')
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Configuração de URLs das Páginas
        </CardTitle>
        <CardDescription>
          Configure as URLs das páginas para cada variante do experimento. As URLs são salvas automaticamente no Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.map((variant) => (
          <div key={variant.id} className="p-4 border rounded-lg bg-slate-50">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-3 h-3 rounded-full ${variant.is_control ? 'bg-orange-500' : 'bg-purple-500'}`} />
              <h3 className="font-medium">{variant.name}</h3>
              {variant.is_control && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  Controle
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                value={urls[variant.id] || ''}
                onChange={(e) => handleUrlChange(variant.id, e.target.value)}
                placeholder={
                  variant.is_control 
                    ? "URL da página original (automática)" 
                    : "https://seusite.com/variante"
                }
                disabled={variant.is_control}
                className="flex-1"
              />
              
              <Button
                onClick={() => handleSaveUrl(variant.id)}
                disabled={saving[variant.id] || !hasUnsavedChanges(variant.id)}
                size="sm"
                variant="outline"
              >
                {saving[variant.id] ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                ) : hasUnsavedChanges(variant.id) ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </Button>
            </div>
            
            {urls[variant.id] && (
              <div className="mt-2 flex items-center gap-2">
                <a 
                  href={urls[variant.id]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Abrir página
                </a>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">
                  {hasUnsavedChanges(variant.id) ? 'Alterações não salvas' : 'Salvo no Supabase'}
                </span>
              </div>
            )}
            
            {!urls[variant.id] && !variant.is_control && (
              <div className="mt-2 flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Configure uma URL para esta variante</span>
              </div>
            )}
          </div>
        ))}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• A variante de controle usa automaticamente a URL configurada no setup</li>
            <li>• As outras variantes precisam ter suas URLs configuradas manualmente</li>
            <li>• As URLs são salvas no Supabase e usadas pelo sistema de A/B testing</li>
            <li>• O experimento só funcionará corretamente quando todas as variantes tiverem URLs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
