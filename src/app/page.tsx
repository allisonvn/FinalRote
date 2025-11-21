import { ArrowRight, BarChart3, Target, Zap, Shield, TrendingUp, Users, Check, Sparkles, Code, Rocket, Clock, Brain, ChevronDown, Award, Star, Quote, ArrowUpRight, Layout, Smartphone, Globe } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-slate [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] opacity-40 dark:opacity-20" />
        <div className="spotlight left-[-10%] top-[-10%] opacity-30" />
        <div className="spotlight right-[-15%] bottom-[-20%] opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-primary opacity-5 blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* A/B Test Version Banner - Meta Indicator */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-2 px-4 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Experimentando o Futuro da Otimização</span>
          <span className="hidden sm:inline opacity-80">• Versão 2.0 com IA Neural</span>
        </div>
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Rota Final</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Recursos</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">Como Funciona</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Preços</a>
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all"
            >
              Começar Agora
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-20 pb-24 sm:pt-32 sm:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 mb-8 hover:bg-primary/15 transition-colors cursor-default">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Mais de 10.000 experimentos ativos</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 drop-shadow-sm">
            Dobre suas vendas online
            <span className="block mt-2 bg-gradient-brand bg-clip-text text-transparent pb-2">
              com Inteligência Artificial
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            Pare de adivinhar. Nossa IA testa suas páginas 24/7 e <strong className="text-foreground">direciona o tráfego automaticamente</strong> para a versão que coloca mais dinheiro no seu bolso.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="group inline-flex items-center rounded-xl bg-gradient-primary px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-xl border border-border bg-card/50 backdrop-blur-sm px-8 py-4 text-base font-semibold text-foreground hover:bg-card/80 hover:border-primary/30 transition-all duration-300"
            >
              <Rocket className="w-5 h-5 mr-2 text-primary" />
              Ver Como Funciona
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm hover:bg-card/50 transition-colors">
              <div className="text-4xl font-bold text-primary mb-2">+127%</div>
              <div className="text-sm text-muted-foreground font-medium">Aumento médio em conversão</div>
            </div>
            <div className="p-6 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm hover:bg-card/50 transition-colors">
              <div className="text-4xl font-bold text-accent mb-2">R$ 2,4M</div>
              <div className="text-sm text-muted-foreground font-medium">Receita extra gerada em 2024</div>
            </div>
            <div className="p-6 rounded-2xl bg-card/30 border border-border/50 backdrop-blur-sm hover:bg-card/50 transition-colors">
              <div className="text-4xl font-bold text-success mb-2">2 min</div>
              <div className="text-sm text-muted-foreground font-medium">Tempo de instalação</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section - "The Old Way vs New Way" */}
      <div className="py-24 relative">
        <div className="absolute inset-0 bg-secondary/30 -z-10 skew-y-3 transform origin-top-left scale-110" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Por que continuar adivinhando?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              O método tradicional de testes é lento e caro. A Rota Final muda o jogo transformando incerteza em lucro previsível.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group card-glass p-8 rounded-2xl hover-lift relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Chega de "Achismo"</h3>
              <p className="text-muted-foreground leading-relaxed">
                Não debata qual cor de botão é melhor. Deixe os dados decidirem. Nossa IA testa milhares de combinações enquanto você dorme.
              </p>
            </div>

            <div className="group card-glass p-8 rounded-2xl hover-lift relative overflow-hidden border-primary/20 shadow-lg shadow-primary/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Inteligência Real</h3>
              <p className="text-muted-foreground leading-relaxed">
                Diferente de testes A/B comuns, nosso algoritmo Multi-Armed Bandit aprende rápido e <strong>para de mandar tráfego para o que não vende.</strong>
              </p>
            </div>

            <div className="group card-glass p-8 rounded-2xl hover-lift relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">ROI Imediato</h3>
              <p className="text-muted-foreground leading-relaxed">
                Não espere o teste acabar para lucrar. Como a IA prioriza a versão vencedora desde o início, você ganha dinheiro durante o próprio teste.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Quem usa, vende mais
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Junte-se a milhares de empreendedores que desbloquearam o potencial máximo de suas páginas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Testimonial 1 */}
            <div className="card-glass p-8 rounded-2xl hover:border-primary/30 transition-colors">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "Otimizamos nossa landing page e o ROI subiu <strong>43% em duas semanas</strong>. O melhor é que a ferramenta faz tudo sozinha, eu só acompanho o dashboard."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  MR
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Marina Rodrigues</p>
                  <p className="text-xs text-muted-foreground">E-commerce de Moda</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="card-glass p-8 rounded-2xl hover:border-primary/30 transition-colors">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "Para infoprodutos, cada clique conta. A Rota Final me mostrou que meu título B convertia o dobro do A. <strong>Isso salvou meu lançamento.</strong>"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                  RP
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Rafael Pinheiro</p>
                  <p className="text-xs text-muted-foreground">Produtor Digital</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="card-glass p-8 rounded-2xl hover:border-primary/30 transition-colors">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">
                "Usamos para testar preços e ofertas. O tracking de UTM é perfeito para saber de qual anúncio vem a venda. Ferramenta essencial."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  TC
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Thiago Costa</p>
                  <p className="text-xs text-muted-foreground">SaaS Founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-secondary/20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-6">
              Tudo o que você precisa para <span className="text-primary">escalar</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas simplificadas para quem quer resultado, não burocracia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-glass p-8 rounded-2xl hover-lift border-t-4 border-t-blue-500">
              <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                <Layout className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Editor Visual Simples</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Crie variações do seu site sem tocar em código. Nosso editor visual permite mudar textos, imagens e cores em segundos.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-glass p-8 rounded-2xl hover-lift border-t-4 border-t-green-500">
              <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Performance Extrema</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Seu site continua rápido. Nosso script é ultraleve (menos de 5kb) e carrega de forma assíncrona para não afetar seu SEO.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-glass p-8 rounded-2xl hover-lift border-t-4 border-t-purple-500">
              <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Otimizado para Mobile</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                A maioria das vendas acontece no celular. Teste versões específicas para mobile e garanta a melhor experiência em qualquer tela.
              </p>
            </div>

            {/* Feature 4 - UTM Tracking (Highlighted) */}
            <div className="card-glass p-8 rounded-2xl hover-lift border-t-4 border-t-rose-500 md:col-span-2 lg:col-span-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="w-14 h-14 bg-rose-500/10 rounded-xl flex items-center justify-center mb-6">
                    <Target className="w-7 h-7 text-rose-600 dark:text-rose-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Rastreamento Avançado de Origem (UTMs)</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    Saiba exatamente qual campanha do Facebook, Google ou Email está trazendo os melhores clientes.
                    Cruze dados de conversão com a origem do tráfego (`utm_source`, `utm_campaign`) para otimizar seu orçamento de mídia.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-rose-500" />
                      Identifique campanhas com ROI negativo
                    </li>
                    <li className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-rose-500" />
                      Otimize criativos baseado em conversão real
                    </li>
                  </ul>
                </div>
                <div className="flex-1 bg-background/50 p-6 rounded-xl border border-border/50 w-full">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">utm_source</span>
                      <span className="font-mono text-rose-600 font-medium">facebook_ads</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">utm_campaign</span>
                      <span className="font-mono text-blue-600 font-medium">verao_2025_promo</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1">
                      <span className="text-muted-foreground">Taxa de Conversão</span>
                      <span className="font-bold text-green-600">+12.5% <span className="text-xs font-normal text-muted-foreground">(vs média)</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-24 bg-background relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground mb-6">
              3 passos para a <span className="text-primary">máxima conversão</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simplicidade radical. Você não precisa de desenvolvedores ou designers caros.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connector Line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-card border border-border rounded-2xl flex items-center justify-center shadow-lg mb-8 relative z-10 group-hover:border-primary/50 group-hover:shadow-primary/20 transition-all">
                <Code className="w-10 h-10 text-primary" />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm border-4 border-background">1</div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Instale o Pixel</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Copie e cole uma linha de código no seu site. Compatível com WordPress, Shopify, Wix, Hotmart e qualquer plataforma web.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-card border border-border rounded-2xl flex items-center justify-center shadow-lg mb-8 relative z-10 group-hover:border-primary/50 group-hover:shadow-primary/20 transition-all">
                <Target className="w-10 h-10 text-accent" />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-sm border-4 border-background">2</div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Crie o Teste</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Defina a página e crie as variações. Mude títulos, imagens ou ofertas. Nossa interface guia você em cada passo.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-card border border-border rounded-2xl flex items-center justify-center shadow-lg mb-8 relative z-10 group-hover:border-primary/50 group-hover:shadow-primary/20 transition-all">
                <TrendingUp className="w-10 h-10 text-success" />
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-success text-success-foreground rounded-full flex items-center justify-center font-bold text-sm border-4 border-background">3</div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Lucre Mais</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Acompanhe em tempo real. Nossa IA identifica a vencedora e maximiza suas conversões automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Preços Transparentes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Invista no crescimento do seu negócio. Otimização paga a si mesma.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="card-glass p-8 rounded-2xl flex flex-col h-full hover:border-primary/30 transition-all">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">R$ 49</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Para quem está começando</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  5 experimentos simultâneos
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  10.000 visitantes/mês
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  2 projetos
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  Tracking Básico
                </li>
              </ul>

              <Link
                href="/auth/signin"
                className="w-full block text-center py-3 px-4 rounded-lg border border-border hover:bg-secondary transition-colors font-semibold text-foreground"
              >
                Começar Agora
              </Link>
            </div>

            {/* Pro Plan - Highlighted */}
            <div className="card-glass p-8 rounded-2xl flex flex-col h-full relative border-primary/50 shadow-xl shadow-primary/10 scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                MAIS POPULAR
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-primary mb-2">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-foreground">R$ 99</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Para negócios em crescimento</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-foreground font-medium">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  25 experimentos simultâneos
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground font-medium">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  100.000 visitantes/mês
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground font-medium">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  10 projetos
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground font-medium">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <strong>IA de Otimização Automática</strong>
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground font-medium">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  Tracking Avançado de UTMs
                </li>
                <li className="flex items-start gap-3 text-sm text-foreground font-medium">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  Domínios Personalizados
                </li>
              </ul>

              <Link
                href="/auth/signin"
                className="w-full block text-center py-3 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-bold shadow-lg shadow-primary/25"
              >
                Começar Teste Grátis
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="card-glass p-8 rounded-2xl flex flex-col h-full hover:border-primary/30 transition-all">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">R$ 299</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Para agências e grandes volumes</p>
              </div>
              
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  Experimentos Ilimitados
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  Visitantes Ilimitados
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  Projetos Ilimitados
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  API & Webhooks
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  Suporte Prioritário 24/7
                </li>
              </ul>

              <Link
                href="/auth/signin"
                className="w-full block text-center py-3 px-4 rounded-lg border border-border hover:bg-secondary transition-colors font-semibold text-foreground"
              >
                Falar com Vendas
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center">
             <p className="text-sm text-muted-foreground">
              7 dias de garantia incondicional. Cancele a qualquer momento.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Dúvidas Comuns
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: "Preciso saber programar?", a: "Não! Se você sabe copiar e colar (CTRL+C / CTRL+V), você consegue usar. Nossa ferramenta foi feita para marqueteiros e empreendedores, não para desenvolvedores." },
              { q: "Funciona no meu site?", a: "Sim. WordPress, Shopify, Wix, Landingi, ClickFunnels, HTML puro... qualquer site que aceite scripts externos é compatível." },
              { q: "Quanto tempo para ver resultados?", a: "Depende do seu tráfego. Sites com mais de 100 visitantes/dia costumam ter resultados conclusivos em menos de uma semana. Nossa IA acelera isso descartando opções ruins rapidamente." },
              { q: "Afeta a velocidade do site?", a: "Praticamente zero. Nosso script é menor que uma imagem pequena (5kb) e carrega depois do conteúdo principal (assíncrono), garantindo que seu site continue rápido." }
            ].map((item, i) => (
              <div key={i} className="card-glass p-6 rounded-xl hover:border-primary/30 transition-colors">
                <h3 className="text-lg font-bold text-foreground mb-2">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary/20 border-t border-border">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-gradient-primary rounded-lg flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">Rota Final</span>
              </div>
              <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                Plataforma de otimização de conversão com Inteligência Artificial.
                Transformamos cliques em clientes, automaticamente.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Recursos</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Preços</a></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                <li><Link href="/docs" className="hover:text-primary transition-colors">Documentação</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacidade</Link></li>
                <li><Link href="/auth/signin" className="hover:text-primary transition-colors">Login</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2025 Rota Final. Todos os direitos reservados.</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card px-3 py-1 rounded-full border border-border/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Todos os sistemas operacionais</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
