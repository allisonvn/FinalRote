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
              Começar Agora
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
              <span className="text-sm font-semibold text-blue-700">Mais de 10.000 testes rodando agora</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6">
              Dobre suas vendas online
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                sem gastar mais com tráfego
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              Descubra automaticamente qual versão do seu site vende mais. Nossa <strong className="text-gray-900">Inteligência Artificial</strong> testa e otimiza suas páginas 24/7, enquanto você foca em crescer seu negócio.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#pricing"
                className="group inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-2xl hover:shadow-3xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
              >
                Ver Planos e Preços
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </a>
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
                <span className="text-gray-600">Configuração em <strong className="text-gray-900">2 minutos</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-600">Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-gray-600">Sem contrato, sem pegadinha</span>
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
              <div className="text-4xl font-bold text-blue-600 mb-2">+127%</div>
              <div className="text-sm text-gray-600">Aumento médio em vendas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">R$ 2,4M</div>
              <div className="text-sm text-gray-600">Gerados para clientes em 2024</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">2 min</div>
              <div className="text-sm text-gray-600">Para começar a vender mais</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Cada visitante que não compra é dinheiro jogado fora
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Você paga caro por cada clique. Se sua página não está otimizada, você está literalmente queimando dinheiro com anúncios que não convertem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Você adivinha o que funciona</h3>
              <p className="text-gray-600">Troca cor de botão, muda o título, testa uma foto diferente... mas sem dados, você está só chutando e desperdiçando tempo.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Testes levam eternidade</h3>
              <p className="text-gray-600">Quer testar 3 versões diferentes? Vai demorar meses para ter certeza de qual funciona melhor. Enquanto isso, você perde vendas.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Metade vê a versão pior</h3>
              <p className="text-gray-600">Em testes tradicionais, 50% dos seus clientes veem a versão que vende menos. É jogar dinheiro pela janela todos os dias.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
              Como a Rota Final <span className="text-blue-600">multiplica suas vendas</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Nossa Inteligência Artificial aprende sozinha qual versão do seu site vende mais. Enquanto testa, ela já direciona mais visitantes para a versão vencedora. Você ganha dinheiro durante o teste, não depois.
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
                <h3 className="text-2xl font-bold text-gray-900 mb-3">IA que Aprende Sozinha</h3>
                <p className="text-gray-700 mb-4">
                  Nossa Inteligência Artificial identifica qual versão vende mais e automaticamente mostra ela para mais pessoas. <strong>Você não perde vendas durante o teste.</strong> Quanto mais testa, mais vende.
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-700 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  Até 3x mais vendas vs. teste tradicional
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
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Seus Clientes Não Percebem Nada</h3>
                <p className="text-gray-700 mb-4">
                  Sem aqueles "pulos" ou "tremeliques" na página. Tudo carrega instantaneamente e suave. <strong>Seus visitantes têm uma experiência profissional, sempre.</strong>
                </p>
                <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                  <Check className="w-4 h-4" />
                  Página carrega perfeitamente, sem bugs
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
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Você Sabe Exatamente O Que Fazer</h3>
                <p className="text-gray-700 mb-4">
                  Dashboard simples mostra qual versão está vendendo mais, quanto a mais, e se você já pode tomar a decisão. <strong>Sem complicação, só resultados claros.</strong>
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-700 font-semibold">
                  <BarChart3 className="w-4 h-4" />
                  Gráficos simples que você entende
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
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Instala em 2 Minutos (Sério)</h3>
                <p className="text-gray-700 mb-4">
                  Cola um código no seu site e pronto. Funciona com WordPress, Shopify, Wix, ou qualquer plataforma. <strong>Se você consegue colar um código do Google Analytics, consegue instalar a Rota Final.</strong>
                </p>
                <div className="flex items-center gap-2 text-sm text-orange-700 font-semibold">
                  <Rocket className="w-4 h-4" />
                  Instalação mais rápida do mercado
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-20 h-[300px] w-[300px] rounded-full bg-blue-100/50 blur-3xl" />
          <div className="absolute right-1/4 bottom-20 h-[300px] w-[300px] rounded-full bg-purple-100/50 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
              3 passos para dobrar suas vendas
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Configure em 2 minutos e deixe a Inteligência Artificial trabalhar para você
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Connection lines - hidden on mobile */}
            <div className="hidden md:block absolute top-32 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"
                 style={{left: '20%', right: '20%'}} />

            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {/* Step 1 */}
              <div className="relative group">
                <div className="relative">
                  {/* Number badge */}
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Code className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Card */}
                  <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:border-blue-200 transition-all hover:shadow-2xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4 mx-auto">
                      <span className="text-2xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Cole um código no seu site</h3>
                    <p className="text-gray-600 text-center leading-relaxed">
                      Tão simples quanto instalar o Google Analytics. Funciona em WordPress, Shopify, Wix, ou qualquer plataforma. <strong className="text-gray-900">Leva 2 minutos, literalmente.</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="relative">
                  {/* Number badge */}
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Target className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Card */}
                  <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:border-indigo-200 transition-all hover:shadow-2xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-4 mx-auto">
                      <span className="text-2xl font-bold text-indigo-600">2</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Configure qual página testar</h3>
                    <p className="text-gray-600 text-center leading-relaxed">
                      Escolhe a página (homepage, checkout, produto...) e cria as versões que quer testar. <strong className="text-gray-900">Muda título, botão, imagem, layout...</strong> O que você quiser.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="relative">
                  {/* Number badge */}
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Card */}
                  <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100 hover:border-purple-200 transition-all hover:shadow-2xl">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4 mx-auto">
                      <span className="text-2xl font-bold text-purple-600">3</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">Veja suas vendas crescerem</h3>
                    <p className="text-gray-600 text-center leading-relaxed">
                      Nossa IA testa automaticamente e mostra a versão vencedora para mais pessoas. <strong className="text-gray-900">Você abre o dashboard e vê suas conversões subindo.</strong> Simples assim.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA at bottom */}
            <div className="mt-16 text-center">
              <a
                href="#pricing"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl hover:shadow-3xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
              >
                Ver Planos e Começar Agora
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
              <p className="mt-4 text-sm text-gray-500">Sem contrato • Cancele quando quiser</p>
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

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Planos e Preços
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal para seu negócio. Todos os planos incluem IA automática e otimização em tempo real.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 hover:shadow-xl transition-all">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">STARTER</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900">R$ 49,90</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <p className="text-sm text-gray-500">Ou R$ 499/ano (economize 2 meses)</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>5 experimentos</strong> simultâneos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>10.000 visitantes</strong>/mês</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>2 projetos</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>IA automática</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Analytics básico</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Suporte por email</span>
                </li>
              </ul>
              <Link
                href="/auth/signin"
                className="block w-full text-center rounded-xl bg-gray-900 text-white px-6 py-3 font-semibold hover:bg-gray-800 transition-all"
              >
                Começar Agora
              </Link>
            </div>

            {/* Pro Plan - Most Popular */}
            <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-blue-500 transform scale-105 hover:shadow-3xl transition-all relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">MAIS POPULAR</span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">PRO</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-blue-600">R$ 99,90</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <p className="text-sm text-gray-500">Ou R$ 999/ano (economize 2 meses)</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>25 experimentos</strong> simultâneos</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>100.000 visitantes</strong>/mês</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>10 projetos</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>IA automática</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Analytics avançado</strong> com insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Domínios personalizados</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>5 membros</strong> na equipe</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Suporte prioritário</span>
                </li>
              </ul>
              <Link
                href="/auth/signin"
                className="block w-full text-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Começar Agora
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-purple-200 hover:shadow-xl transition-all">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">ENTERPRISE</h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-purple-600">R$ 299,90</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <p className="text-sm text-gray-500">Ou R$ 2.999/ano (economize 2 meses)</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Experimentos ilimitados</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Visitantes ilimitados</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Projetos ilimitados</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>IA automática</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Analytics enterprise</strong> completo</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Domínios personalizados</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Equipe ilimitada</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Suporte dedicado + SLA</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Onboarding personalizado</span>
                </li>
              </ul>
              <Link
                href="/auth/signin"
                className="block w-full text-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Começar Agora
              </Link>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Todos os planos incluem: Sem contrato • Cancele quando quiser • Suporte em português
            </p>
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Quanto tempo leva para ver resultados?</h3>
              <p className="text-gray-600">
                Você começa a ver resultados desde o primeiro dia. Nossa IA aprende continuamente e otimiza em tempo real. Não precisa esperar semanas para saber o que funciona.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Funciona no meu site?</h3>
              <p className="text-gray-600">
                Sim! Funciona em WordPress, Shopify, Wix, ClickFunnels, ou qualquer plataforma. Se você consegue adicionar o código do Google Analytics, consegue adicionar a Rota Final.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Preciso saber programar ou estatística?</h3>
              <p className="text-gray-600">
                Não! A interface é visual e simples. Você cria versões da sua página, ativa o teste, e pronto. Nossa IA faz todo o trabalho pesado. Você só vê os resultados no dashboard.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Quanto custa?</h3>
              <p className="text-gray-600">
                A partir de R$ 49,90/mês. Sem contrato, sem pegadinha. Se não vender mais, você simplesmente cancela. Pagamento mensal ou anual com desconto.
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
                A plataforma que usa Inteligência Artificial para otimizar suas páginas e dobrar suas vendas no piloto automático.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-gray-900">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-gray-900">Preços</a></li>
                <li><Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link></li>
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
