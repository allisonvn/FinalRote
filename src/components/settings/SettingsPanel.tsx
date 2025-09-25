"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Sun, Moon, Shield, Bell, KeyRound, Globe2, User2 } from 'lucide-react'

interface SettingsPanelProps { className?: string }

export default function SettingsPanel({ className }: SettingsPanelProps) {
  const [nome, setNome] = useState('Usuário Demo')
  const [email] = useState('demo@rotafinal.com')
  const [tema, setTema] = useState<'auto'|'claro'|'escuro'>('auto')
  const [idioma, setIdioma] = useState<'pt-BR'>('pt-BR')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifSistema, setNotifSistema] = useState(true)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    try {
      const storedTema = localStorage.getItem('preferencias.tema') as any
      const storedIdioma = localStorage.getItem('preferencias.idioma') as any
      if (storedTema) setTema(storedTema)
      if (storedIdioma) setIdioma(storedIdioma)
    } catch {}
  }, [])

  const aplicarTema = (valor: 'auto'|'claro'|'escuro') => {
    setTema(valor)
    if (valor === 'auto') {
      document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    } else {
      document.documentElement.classList.toggle('dark', valor === 'escuro')
    }
    localStorage.setItem('preferencias.tema', valor)
    toast.success('Tema atualizado')
  }

  const salvar = async () => {
    try {
      setSalvando(true)
      localStorage.setItem('preferencias.idioma', idioma)
      toast.success('Configurações salvas com sucesso')
    } catch {
      toast.error('Não foi possível salvar as configurações')
    } finally { setSalvando(false) }
  }


  return (
    <div className={className}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie sua conta, preferências e integrações</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User2 className="w-4 h-4" /> Perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome</label>
                    <Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input value={email} disabled className="mt-1" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={salvar} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar alterações'}</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Senha atual</label>
                    <Input type="password" className="mt-1" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nova senha</label>
                    <Input type="password" className="mt-1" placeholder="Mínimo 8 caracteres" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Confirmar</label>
                    <Input type="password" className="mt-1" placeholder="Repita a senha" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => toast.info('Em breve: alteração de senha')}>Atualizar senha</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe2 className="w-4 h-4" /> Preferências</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tema</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Button variant={tema==='auto'?'default':'outline'} onClick={() => aplicarTema('auto')} className="w-full flex items-center gap-2">
                      <Sun className="w-4 h-4" /> Automático
                    </Button>
                    <Button variant={tema==='claro'?'default':'outline'} onClick={() => aplicarTema('claro')} className="w-full flex items-center gap-2">
                      <Sun className="w-4 h-4" /> Claro
                    </Button>
                    <Button variant={tema==='escuro'?'default':'outline'} onClick={() => aplicarTema('escuro')} className="w-full flex items-center gap-2">
                      <Moon className="w-4 h-4" /> Escuro
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Idioma</label>
                  <Select value={idioma} onValueChange={(v) => setIdioma(v as any)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Notificações</label>
                  <div className="mt-2 space-y-2 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={notifEmail} onChange={(e) => setNotifEmail(e.target.checked)} /> Email</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={notifSistema} onChange={(e) => setNotifSistema(e.target.checked)} /> Notificações do sistema</label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4" /> Notificações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <KeyRound className="w-4 h-4" />
                  <span className="font-medium">Integração Automática Ativa!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  ✨ Nenhuma chave API necessária. O sistema cuida de tudo automaticamente para você.
                </p>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bell className="w-4 h-4" />
                    Receba alertas semanais sobre seus experimentos por email
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
