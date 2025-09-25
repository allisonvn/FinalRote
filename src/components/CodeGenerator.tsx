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
}

export default function CodeGenerator({ 
  experimentName, 
  experimentId, 
  variants = [],
  baseUrl = window.location.origin 
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

  // Código do SDK
  const sdkCode = `<!-- RotaFinal SDK -->
<script src="${baseUrl}/rotafinal-sdk.js"></script>
<script>
  // Inicializar RotaFinal
  const rf = new RotaFinal({
    debug: true // Remova em produção
  });
</script>`

  // Código do experimento
  const experimentCode = `<!-- Estrutura do Experimento: ${experimentName} -->
${variants.map((variant, index) => `<!-- Variante ${variant.name.toUpperCase()}: ${variant.description || 'Sem descrição'} -->
<div id="variant-${variant.name}" class="rf-variant" style="display: none;">
  <!-- Conteúdo da variante ${variant.name} aqui -->
  <h2>Versão ${variant.name.toUpperCase()}</h2>
  <p>Customize este conteúdo para a variante ${variant.name}</p>
  <button onclick="rf.conversion('button_click', 1)">
    ${variant.name === 'control' ? 'Botão Original' : `Botão Variante ${variant.name.toUpperCase()}`}
  </button>
</div>
`).join('\n')}

<script>
  // Executar experimento
  async function runExperiment() {
    try {
      // Obter variante do experimento
      const variant = await rf.getVariant('${experimentName}');
      
      console.log('Variante atribuída:', variant);
      
      // Esconder todas as variantes
      document.querySelectorAll('.rf-variant').forEach(el => {
        el.style.display = 'none';
      });
      
      // Mostrar variante atribuída
      const variantElement = document.getElementById('variant-' + variant);
      if (variantElement) {
        variantElement.style.display = 'block';
      } else {
        // Fallback para controle
        const controlElement = document.getElementById('variant-control');
        if (controlElement) {
          controlElement.style.display = 'block';
        }
      }
      
    } catch (error) {
      console.error('Erro no experimento:', error);
      // Mostrar variante de controle em caso de erro
      const controlElement = document.getElementById('variant-control');
      if (controlElement) {
        controlElement.style.display = 'block';
      }
    }
  }

  // Executar quando a página carregar
  document.addEventListener('DOMContentLoaded', runExperiment);
</script>`

  // Código completo
  const fullCode = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste A/B: ${experimentName}</title>
    <style>
        .rf-variant {
            padding: 20px;
            border: 2px solid #ddd;
            border-radius: 8px;
            margin: 10px 0;
        }
        .rf-button {
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        .rf-button:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <h1>Experimento: ${experimentName}</h1>
    
    ${experimentCode}
    
    ${sdkCode}
</body>
</html>`

  // Código de rastreamento de conversões
  const trackingCode = `<!-- Rastreamento de Conversões -->
<script>
  // Função para rastrear diferentes tipos de conversão
  function trackConversion(eventName, value = 1, properties = {}) {
    rf.conversion(eventName, value, {
      experiment: '${experimentName}',
      page: window.location.pathname,
      ...properties
    });
    
    console.log('Conversão registrada:', eventName);
  }

  // Exemplos de uso:
  
  // 1. Rastrear clique em botão
  function trackButtonClick() {
    trackConversion('button_click', 1, { button_type: 'cta' });
  }
  
  // 2. Rastrear compra
  function trackPurchase(value) {
    trackConversion('purchase', value, { currency: 'BRL' });
  }
  
  // 3. Rastrear cadastro
  function trackSignup() {
    trackConversion('signup', 1, { source: 'experiment' });
  }
  
  // 4. Rastrear visualização de produto
  function trackProductView(productId) {
    trackConversion('product_view', 1, { product_id: productId });
  }
</script>

<!-- Exemplos de como usar nos elementos HTML -->
<!-- 
<button onclick="trackButtonClick()">Botão Principal</button>
<button onclick="trackPurchase(99.90)">Comprar por R$ 99,90</button>
<form onsubmit="trackSignup()">...</form>
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
                      Cole este código no <code>&lt;head&gt;</code> ou antes do <code>&lt;/body&gt;</code> do seu site
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <CopyButton text={sdkCode} section="sdk" label="Copiar SDK" />
                      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{sdkCode}</code>
                      </pre>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Lightbulb className="h-4 w-4" />
                        <span className="font-medium">Dica:</span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        Coloque preferencialmente no <code>&lt;head&gt;</code> para carregar mais rápido
                      </p>
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
