'use client'

import { useState } from 'react'
import { Copy, Check, Code, FileText, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface CodeGeneratorProps {
  experimentName: string
  experimentId: string
  variants: Array<{
    id: string
    name: string
    description?: string
  }>
  baseUrl?: string
  apiKey?: string
}

export default function CodeGenerator({ 
  experimentName, 
  experimentId, 
  variants = [],
  baseUrl = window.location.origin,
  apiKey = '' 
}: CodeGeneratorProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(section)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  // Código do SDK - v2.1 COM ANTI-FLICKER
  const sdkCode = `<!-- RotaFinal SDK v2.1 - Anti-Flicker -->
<!-- IMPORTANTE: Adicione no <head> sem async/defer -->
<script src="${baseUrl}/rotafinal-sdk.js"></script>

<script>
  // Inicializar SDK
  const rf = new RotaFinal({
    debug: false // true para debug
  });

  // Executar experimento
  rf.runExperiment('${experimentId}');
</script>`

  // Código do experimento - SIMPLIFICADO
  const experimentCode = `<!-- OPÇÃO 1: Teste Split URL (Redirecionamento) -->
<!-- O SDK redireciona automaticamente para a URL configurada -->
<!-- Não precisa de código adicional! -->

<!-- OPÇÃO 2: Teste Visual (mesma página) -->
<!-- Use este código se quiser mudar elementos na mesma página -->
<script>
  // Executar após SDK carregar a variante
  const rf = new RotaFinal({ debug: false });

  rf.runExperiment('${experimentId}', {
    autoRedirect: false, // Desabilitar redirecionamento
    onVariant: (variant) => {
      console.log('Variante:', variant.name);

      // Aplicar mudanças baseado na variante
      if (variant.name === 'Variante A') {
        // Exemplo: Mudar cor do botão
        document.querySelector('#meu-botao').style.background = 'red';
        document.querySelector('#meu-botao').textContent = 'COMPRE AGORA!';

        // Exemplo: Mudar título
        document.querySelector('h1').textContent = 'Novo Título!';
      }

      // Rastrear visualização
      rf.track('page_view');
    }
  });
</script>

<!-- Exemplo de estrutura com variantes -->
${variants.map((variant, index) => `<!-- ${variant.name}: ${variant.description || ''} -->`).join('\n')}`

  // Código completo
  const fullCode = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste A/B: ${experimentName}</title>

    <!-- RotaFinal SDK - NO <HEAD> SEM ASYNC/DEFER -->
    <script src="${baseUrl}/rotafinal-sdk.js"></script>
</head>
<body>
    <h1>Experimento: ${experimentName}</h1>
    <p>Esta página faz parte de um teste A/B</p>

    <button id="cta-button" style="padding: 15px 30px; font-size: 18px; background: blue; color: white; border: none; border-radius: 5px; cursor: pointer;">
        Clique Aqui
    </button>

    <script>
        // Inicializar SDK
        const rf = new RotaFinal({ debug: true });

        // Executar experimento
        rf.runExperiment('${experimentId}', {
            onVariant: (variant) => {
                console.log('Variante atribuída:', variant.name);

                // Exemplo: Rastrear visualização
                rf.track('page_view');
            }
        });

        // Rastrear conversão ao clicar no botão
        document.getElementById('cta-button').addEventListener('click', () => {
            rf.conversion('click', 1);
            alert('Conversão registrada!');
        });
    </script>
</body>
</html>`

  // Código de rastreamento de conversões
  const trackingCode = `<!-- Rastreamento de Conversões -->
<script>
  // 1. Rastrear conversão simples
  function trackConversion() {
    rf.conversion('conversion', 1);
    console.log('Conversão registrada!');
  }

  // 2. Rastrear compra com valor
  function trackPurchase(value) {
    rf.conversion('purchase', value, { currency: 'BRL' });
    console.log('Compra registrada: R$', value);
  }

  // 3. Rastrear evento customizado
  function trackCustomEvent(eventName) {
    rf.track(eventName, { experiment: '${experimentName}' });
    console.log('Evento registrado:', eventName);
  }

  // 4. Rastrear clique em botão
  function trackButtonClick() {
    rf.track('button_click', { button_type: 'cta' });
  }

  // 5. Rastrear cadastro
  function trackSignup() {
    rf.conversion('signup', 1, { source: 'experiment' });
  }
</script>

<!-- Exemplos de uso nos elementos HTML -->
<!--
<button onclick="trackConversion()">Botão de Conversão</button>
<button onclick="trackPurchase(99.90)">Comprar por R$ 99,90</button>
<button onclick="trackButtonClick()">CTA Principal</button>
<form onsubmit="trackSignup(); return true;">...</form>
-->`

  const CopyButton = ({ text, section, label }: { text: string; section: string; label: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, section)}
      className="absolute top-2 right-2 h-8 w-8 p-0"
    >
      {copiedSection === section ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Código de Integração
          </CardTitle>
          <CardDescription>
            Código personalizado para o experimento: <Badge variant="secondary">{experimentName}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="step-by-step" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="step-by-step">Passo a Passo</TabsTrigger>
              <TabsTrigger value="experiment">Experimento</TabsTrigger>
              <TabsTrigger value="tracking">Conversões</TabsTrigger>
              <TabsTrigger value="complete">Completo</TabsTrigger>
            </TabsList>

            <TabsContent value="step-by-step" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <CardTitle className="text-lg">Adicione o SDK RotaFinal</CardTitle>
                    </div>
                    <CardDescription>
                      Cole este código no <code>&lt;head&gt;</code> do seu site
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <CopyButton text={sdkCode} section="sdk" label="Copiar SDK" />
                      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{sdkCode}</code>
                      </pre>
                    </div>
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <Lightbulb className="h-4 w-4" />
                        <span className="font-bold">IMPORTANTE:</span>
                      </div>
                      <ul className="text-sm text-red-600 mt-2 space-y-1 list-disc list-inside">
                        <li>Adicione <strong>NO &lt;head&gt;</strong> (não no body)</li>
                        <li><strong>SEM async ou defer</strong> (síncrono!)</li>
                        <li>Antes de qualquer outro script</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <CardTitle className="text-lg">Configure as Variantes</CardTitle>
                    </div>
                    <CardDescription>
                      Crie as diferentes versões do seu experimento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Você tem {variants.length} variante(s) configurada(s):
                      </p>
                      {variants.map((variant) => (
                        <div key={variant.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Badge variant={variant.name === 'control' ? 'default' : 'secondary'}>
                            {variant.name}
                          </Badge>
                          <span className="text-sm">{variant.description || 'Sem descrição'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <CardTitle className="text-lg">Pronto! 🎉</CardTitle>
                    </div>
                    <CardDescription>
                      Seu teste A/B está funcionando automaticamente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-green-700 font-medium">✅ Tudo configurado!</p>
                      <p className="text-sm text-green-600 mt-1">
                        O RotaFinal vai automaticamente atribuir variantes para seus visitantes
                        e coletar dados do experimento.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="experiment">
              <div className="relative">
                <CopyButton text={experimentCode} section="experiment" label="Copiar Experimento" />
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto max-h-96">
                  <code>{experimentCode}</code>
                </pre>
              </div>
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>Importante:</strong> Customize o conteúdo dentro de cada div de variante 
                  para criar as diferentes versões do seu teste.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="tracking">
              <div className="relative">
                <CopyButton text={trackingCode} section="tracking" label="Copiar Tracking" />
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto max-h-96">
                  <code>{trackingCode}</code>
                </pre>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Use essas funções para rastrear diferentes ações dos usuários.
                  Quanto mais conversões você rastrear, melhores serão os insights!
                </p>
              </div>
            </TabsContent>

            <TabsContent value="complete">
              <div className="relative">
                <CopyButton text={fullCode} section="complete" label="Copiar Tudo" />
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto max-h-96">
                  <code>{fullCode}</code>
                </pre>
              </div>
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  Este é um exemplo completo funcionando. Salve como .html e teste localmente!
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
