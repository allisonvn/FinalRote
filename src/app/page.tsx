import { ArrowRight, BarChart3, Target, Zap, Shield, TrendingUp, Users } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 dark:bg-black/40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Rota Final</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">Recursos</a>
            <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
            <Link href="/auth/signin" className="hover:text-gray-900">Entrar</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/auth/signin"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors md:ml-2"
            >
              Começar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none" aria-hidden>
          <div className="absolute left-1/2 top-10 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-300 via-indigo-300 to-purple-300 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              <span className="text-blue-600">Rota Final</span>
              <br />
              <span className="text-gray-700">Teste A/B Inteligente</span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Plataforma profissional de teste A/B com <strong>Multi-Armed Bandit</strong>. 
              Otimize suas conversões automaticamente com algoritmos avançados de machine learning.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/auth/signin"
                className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
              >
                Começar Gratuitamente
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Ver Dashboard
              </a>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-green-500" />
                Gratuito para começar
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                Configuração em 2 minutos
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                Otimização automática
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Por que escolher o Rota Final?</h2>
            <p className="mt-4 text-lg text-gray-600">
              Tecnologia avançada para otimização de conversões
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Armed Bandit</h3>
              <p className="text-gray-600">
                Algoritmos Thompson Sampling, UCB1 e Epsilon-Greedy para otimização automática e inteligente.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Zero-Flicker</h3>
              <p className="text-gray-600">
                Sistema anti-flicker avançado com SSR e Edge Functions. Experiência perfeita para seus usuários.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Estatísticas Avançadas</h3>
              <p className="text-gray-600">
                Análise bayesiana, p-values, intervalos de confiança e recomendações automáticas.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Enterprise Security</h3>
              <p className="text-gray-600">
                RLS, HMAC signing, rate limiting e multi-tenant. Segurança enterprise desde o primeiro dia.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Escalável</h3>
              <p className="text-gray-600">
                Suporta milhões de eventos por mês com PostgreSQL particionado e Edge Functions.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white/80 backdrop-blur">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics em tempo real</h3>
              <p className="text-gray-600">
                Dashboard em tempo real com métricas ao vivo, gráficos interativos e alertas automáticos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Pronto para otimizar suas conversões?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Configure seu primeiro teste A/B em menos de 2 minutos. 
            Sem compromisso, sem cartão de crédito.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/auth/signin"
              className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-700 transition-colors"
            >
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
            <a
              href="/dashboard"
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Ver Demo
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur border-t">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Rota Final</span>
            </div>
            <div className="text-sm text-gray-500">© 2025 Rota Final. Otimização inteligente de conversões.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
