import { ArrowRight, BarChart3, Target, Zap, Shield, TrendingUp, Users, Check, Sparkles, Code, Rocket, Clock, Brain, ChevronDown, Award } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* A/B Test Version Banner - Meta Indicator */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold">Você está vendo a Versão A desta página</span>
          <span className="hidden sm:inline text-purple-100">• Esta página está em teste A/B usando Rota Final</span>
        </div>
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80 bg-white/90 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Rota Final</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Recursos</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">Como Funciona</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Preços</a>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">Dashboard</Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/signin"
              className="hidden sm:inline-flex text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Começar Grátis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
        {/* Decorative background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-200/40 via-indigo-200/30 to-purple-200/20 blur-3xl" />
          <div className="absolute right-1/4 top-40 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-pink-200/30 to-purple-200/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-2 mb-8">
              <Award className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Plataforma #1 de Teste A/B Inteligente</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6">
              Aumente suas conversões em
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                até 300% com IA
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              Pare de perder dinheiro com palpites. Use <strong className="text-gray-900">Multi-Armed Bandit</strong> e algoritmos de machine learning para otimizar automaticamente cada visita ao seu site.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signin"
                className="group inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-2xl hover:shadow-3xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
              >
                Comece Grátis Agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Ver Como Funciona
              </a>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-600"><strong className="text-gray-900">Grátis</strong> para começar</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-600">Configuração em <strong className="text-gray-900">2 minutos</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-600">Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-600"><strong className="text-gray-900">+10.000</strong> testes rodando</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">3x</div>
              <div className="text-sm text-gray-600">Mais conversões em média</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">89%</div>
              <div className="text-sm text-gray-600">Menos tempo otimizando</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">2 min</div>
              <div className="text-sm text-gray-600">Para configurar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Você está perdendo dinheiro agora mesmo
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A cada 100 visitantes que não convertem, você deixa de ganhar. Testes A/B tradicionais são lentos, complexos e exigem conhecimento estatístico avançado.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Testes demoram semanas</h3>
              <p className="text-gray-600">Com testes A/B tradicionais, você precisa esperar significância estatística. Isso pode levar meses.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Requer expertise técnica</h3>
              <p className="text-gray-600">P-values, intervalos de confiança, análise bayesiana... você precisa ser um estatístico.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Deixa dinheiro na mesa</h3>
              <p className="text-gray-600">Durante o teste, 50% dos usuários veem a versão perdedora. Você literalmente perde conversões.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
              A solução: <span className="text-blue-600">Multi-Armed Bandit</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Algoritmos de IA que aprendem e otimizam em tempo real, direcionando automaticamente mais tráfego para as variantes vencedoras.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 hover:shadow-2xl transition-all">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 blur-2xl group-hover:opacity-70 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Otimização Automática com IA</h3>
                <p className="text-gray-700 mb-4">
                  Thompson Sampling, UCB1 e Epsilon-Greedy aprendem qual variante funciona melhor e automaticamente direcionam mais tráfego para ela. <strong>Você aumenta conversões durante o teste.</strong>
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-700 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Até 3x mais conversões vs. A/B tradicional
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 hover:shadow-2xl transition-all">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-100 rounded-full opacity-50 blur-2xl group-hover:opacity-70 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Zero-Flicker Experience</h3>
                <p className="text-gray-700 mb-4">
                  Sistema avançado com SSR e Edge Functions garante que seus usuários nunca vejam um "flash" de conteúdo. <strong>Experiência perfeita, sempre.</strong>
                </p>
                <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                  <Check className="w-4 h-4" />
                  100% sem flicker, 100% do tempo
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200 hover:shadow-2xl transition-all">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-100 rounded-full opacity-50 blur-2xl group-hover:opacity-70 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Estatísticas de Verdade</h3>
                <p className="text-gray-700 mb-4">
                  Análise bayesiana, p-values, intervalos de confiança, uplift e recomendações automáticas. <strong>Tudo calculado para você.</strong>
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-700 font-semibold">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard com insights acionáveis
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200 hover:shadow-2xl transition-all">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-100 rounded-full opacity-50 blur-2xl group-hover:opacity-70 transition-opacity" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                  <Code className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">SDK Simples de Integrar</h3>
                <p className="text-gray-700 mb-4">
                  Uma linha de código JavaScript. Pronto. Funciona com qualquer stack: React, Vue, PHP, WordPress, Shopify... <strong>Qualquer coisa.</strong>
                </p>
                <div className="flex items-center gap-2 text-sm text-orange-700 font-semibold">
                  <Rocket className="w-4 h-4" />
                  Configuração em 2 minutos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
              Simples como 1, 2, 3
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Configure seu primeiro teste A/B com Multi-Armed Bandit em menos de 2 minutos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <div className="pt-12 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Crie sua conta</h3>
                <p className="text-gray-600 text-center">
                  Cadastre-se gratuitamente e crie seu primeiro projeto. Sem cartão de crédito, sem compromisso.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <div className="pt-12 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Adicione 1 linha de código</h3>
                <p className="text-gray-600 text-center">
                  Cole nosso SDK no seu site. Funciona com qualquer plataforma: React, WordPress, Shopify, etc.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <div className="pt-12 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Veja os resultados</h3>
                <p className="text-gray-600 text-center">
                  Nossa IA otimiza automaticamente. Você só precisa ver suas conversões aumentarem no dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Enterprise-ready desde o dia 1
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Construído para escalar de 1 a 1 bilhão de visitantes por mês
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">RLS + HMAC</h4>
              <p className="text-sm text-gray-600">Segurança enterprise</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Multi-tenant</h4>
              <p className="text-sm text-gray-600">Organizações isoladas</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Escalável</h4>
              <p className="text-sm text-gray-600">Milhões de eventos</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Edge Functions</h4>
              <p className="text-sm text-gray-600">Latência ultra-baixa</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing/CTA Section */}
      <div id="pricing" className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Pronto para aumentar suas conversões?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de empresas que já aumentaram suas conversões em até 300% com Rota Final
            </p>

            <div className="inline-flex flex-col sm:flex-row items-center gap-4 mb-10">
              <Link
                href="/auth/signin"
                className="group inline-flex items-center rounded-xl bg-white px-10 py-5 text-lg font-bold text-blue-600 shadow-2xl hover:shadow-3xl hover:bg-gray-50 transition-all transform hover:scale-105"
              >
                Começar Grátis Agora
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-xl border-2 border-white/50 bg-white/10 backdrop-blur px-10 py-5 text-lg font-bold text-white hover:bg-white/20 transition-all"
              >
                Ver Dashboard Demo
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Grátis para sempre</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Configuração em 2 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">O que é Multi-Armed Bandit?</h3>
              <p className="text-gray-600">
                É um algoritmo de IA que aprende em tempo real qual variante funciona melhor e direciona automaticamente mais tráfego para ela. Diferente do A/B tradicional que divide 50/50, o MAB otimiza durante o teste.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Quanto tempo leva para ver resultados?</h3>
              <p className="text-gray-600">
                Com Multi-Armed Bandit, você começa a ver resultados desde o primeiro dia. O algoritmo aprende continuamente e otimiza em tempo real, sem precisar esperar significância estatística.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Preciso saber programar?</h3>
              <p className="text-gray-600">
                Não! Basta copiar e colar uma linha de JavaScript no seu site. Nossa interface visual permite criar e gerenciar testes sem escrever código.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">É realmente grátis?</h3>
              <p className="text-gray-600">
                Sim! Nosso plano gratuito inclui até 10.000 visitantes/mês e testes ilimitados. Você só paga quando precisa de mais tráfego ou recursos enterprise.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Rota Final</span>
              </div>
              <p className="text-gray-600 max-w-md">
                Plataforma inteligente de teste A/B com Multi-Armed Bandit. Otimize suas conversões automaticamente com IA.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-gray-900">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-gray-900">Preços</a></li>
                <li><Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link></li>
                <li><a href="#" className="hover:text-gray-900">Documentação</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Sobre</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
                <li><Link href="/auth/signin" className="hover:text-gray-900">Entrar</Link></li>
                <li><a href="#" className="hover:text-gray-900">Contato</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© 2025 Rota Final. Todos os direitos reservados.</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Esta página está em teste A/B • Versão A</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
