'use client'

import { useState } from 'react'
import { ChevronRight, Copy, Check, FileText, Globe, Code2, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface InstallationGuideProps {
  experimentName: string
  baseUrl?: string
}

export default function InstallationGuide({ 
  experimentName,
  baseUrl = window.location.origin 
}: InstallationGuideProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [copiedCode, setCopiedCode] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const sdkCode = `<script src="${baseUrl}/rotafinal-sdk.js"></script>
<script>
  const rf = new RotaFinal({ debug: true });
  
  async function runExperiment() {
    const variant = await rf.getVariant('${experimentName}');
    // Seu código aqui
  }
  
  document.addEventListener('DOMContentLoaded', runExperiment);
</script>`

  const steps = [
    {
      id: 1,
      title: 'Acesse seu site',
      description: 'Abra o editor de código ou painel administrativo do seu site',
      icon: Globe,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Você pode adicionar o código do RotaFinal em qualquer uma dessas plataformas:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              'WordPress', 'Shopify', 'Wix', 'Squarespace',
              'HTML/CSS', 'React', 'Vue.js', 'Angular'
            ].map((platform) => (
              <div key={platform} className="p-3 bg-gray-50 rounded-lg text-center text-sm">
                {platform}
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Encontre o arquivo HTML',
      description: 'Localize onde você pode editar o código HTML da página',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">Procure por um destes locais:</p>
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg">
              <strong>WordPress:</strong> Aparência → Editor de Temas → header.php
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <strong>Shopify:</strong> Online Store → Themes → Actions → Edit Code → theme.liquid
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <strong>HTML:</strong> Abra seu arquivo .html em qualquer editor
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <strong>Outros:</strong> Procure por "Custom Code", "HTML/CSS" ou "Scripts"
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Cole o código',
      description: 'Adicione o código do RotaFinal antes da tag </body>',
      icon: Code2,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Cole este código antes da tag <code className="bg-gray-100 px-2 py-1 rounded">&lt;/body&gt;</code>:
          </p>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(sdkCode)}
              className="absolute top-2 right-2 z-10"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </>
              )}
            </Button>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{sdkCode}</code>
            </pre>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>💡 Dica:</strong> Se você não encontrar a tag &lt;/body&gt;, 
              procure por "footer" ou "rodapé" na sua plataforma.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Salve e teste',
      description: 'Salve as alterações e visite seu site para testar',
      icon: Zap,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">🎉 Parabéns!</h4>
            <p className="text-green-700 text-sm">
              Seu teste A/B está funcionando! Agora você pode:
            </p>
            <ul className="text-green-700 text-sm mt-2 space-y-1">
              <li>• Abrir o console do navegador (F12) para ver os logs</li>
              <li>• Recarregar a página para ver diferentes variantes</li>
              <li>• Acompanhar os resultados no dashboard</li>
            </ul>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">🔍 Como testar:</h4>
            <ol className="text-blue-700 text-sm space-y-1">
              <li>1. Visite seu site em uma aba anônima</li>
              <li>2. Abra as ferramentas do desenvolvedor (F12)</li>
              <li>3. Vá para a aba Console</li>
              <li>4. Procure por mensagens do RotaFinal</li>
              <li>5. Recarregue para ver variantes diferentes</li>
            </ol>
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps.find(step => step.id === currentStep)!

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-500" />
          Guia de Instalação Visual
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Experimento: {experimentName}</Badge>
          <Badge variant="secondary">Passo {currentStep} de {steps.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all ${
                  currentStep >= step.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}
                onClick={() => setCurrentStep(step.id)}
              >
                {step.id}
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <currentStepData.icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
              <p className="text-gray-600">{currentStepData.description}</p>
            </div>
          </div>
          
          <div className="pl-15">
            {currentStepData.content}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Anterior
          </Button>
          
          {currentStep < steps.length ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)}>
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="bg-green-500 hover:bg-green-600">
              Concluído! 🎉
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
