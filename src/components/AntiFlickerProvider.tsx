'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AntiFlicker } from '@/lib/anti-flicker'
import RotaFinal from '@/lib/rotafinal-sdk'

interface AntiFlickerContextType {
  antiFlicker: AntiFlicker
  rotaFinal: RotaFinal | null
  ready: boolean
  hideElements: (selectors: string | string[]) => void
  showElements: () => void
}

const AntiFlickerContext = createContext<AntiFlickerContextType | null>(null)

export function useAntiFlicker() {
  const context = useContext(AntiFlickerContext)
  if (!context) {
    throw new Error('useAntiFlicker deve ser usado dentro de AntiFlickerProvider')
  }
  return context
}

interface AntiFlickerProviderProps {
  children: ReactNode
  apiKey?: string
  timeout?: number
  debug?: boolean
}

export function AntiFlickerProvider({
  children,
  apiKey,
  timeout = 3000,
  debug = false
}: AntiFlickerProviderProps) {
  const [antiFlicker] = useState(() => new AntiFlicker({ timeout, debug }))
  const [rotaFinal, setRotaFinal] = useState<RotaFinal | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Inicializar anti-flicker
    antiFlicker.init()

    // Inicializar SDK se API key fornecida
    if (apiKey) {
      const rf = new RotaFinal({
        apiKey,
        debug,
        enableAutoPageView: true,
        enableAutoClickTracking: true
      })
      setRotaFinal(rf)
    }

    // Escutar evento de ready
    const handleReady = () => {
      setReady(true)
    }

    window.addEventListener('rf:ready', handleReady)

    return () => {
      window.removeEventListener('rf:ready', handleReady)
      antiFlicker.destroy()
      if (rotaFinal) {
        rotaFinal.destroy()
      }
    }
  }, [antiFlicker, apiKey, debug])

  const hideElements = (selectors: string | string[]) => {
    antiFlicker.hide(selectors)
  }

  const showElements = () => {
    antiFlicker.ready()
  }

  return (
    <AntiFlickerContext.Provider
      value={{
        antiFlicker,
        rotaFinal,
        ready,
        hideElements,
        showElements
      }}
    >
      {children}
    </AntiFlickerContext.Provider>
  )
}

// Hook para usar com experimentos
export function useExperimentVariant(experimentKey: string, options?: {
  hideSelectors?: string[]
  context?: Record<string, any>
}) {
  const { rotaFinal, hideElements, showElements, ready } = useAntiFlicker()
  const [variant, setVariant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!rotaFinal) {
      setError(new Error('RotaFinal SDK não inicializado'))
      setLoading(false)
      return
    }

    // Ocultar elementos se especificado
    if (options?.hideSelectors) {
      hideElements(options.hideSelectors)
    }

    // Carregar variante
    const loadVariant = async () => {
      try {
        const result = await rotaFinal.getVariant(experimentKey, options?.context)
        setVariant(result)
        
        // Mostrar elementos após carregar variante
        if (options?.hideSelectors) {
          showElements()
        }
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    loadVariant()
  }, [experimentKey, rotaFinal])

  return {
    variant,
    loading,
    error,
    ready,
    isControl: variant?.variant_key === 'control',
    track: (eventType: string, eventName: string, properties?: any, value?: number) => {
      if (rotaFinal) {
        rotaFinal.track(eventType, eventName, properties, value, experimentKey)
      }
    },
    conversion: (name: string, value?: number, properties?: any) => {
      if (rotaFinal) {
        rotaFinal.track('conversion', name, properties, value, experimentKey)
      }
    }
  }
}

// Componente para renderização condicional baseada em variante
interface ExperimentProps {
  experimentKey: string
  hideSelectors?: string[]
  context?: Record<string, any>
  children: (props: {
    variant: any
    isControl: boolean
    loading: boolean
    track: (eventType: string, eventName: string, properties?: any, value?: number) => void
    conversion: (name: string, value?: number, properties?: any) => void
  }) => ReactNode
  fallback?: ReactNode
}

export function Experiment({
  experimentKey,
  hideSelectors,
  context,
  children,
  fallback = null
}: ExperimentProps) {
  const result = useExperimentVariant(experimentKey, { hideSelectors, context })

  if (result.loading) {
    return <>{fallback}</>
  }

  if (result.error) {
    console.error('Erro no experimento:', result.error)
    return <>{fallback}</>
  }

  return (
    <>
      {children({
        variant: result.variant,
        isControl: result.isControl,
        loading: result.loading,
        track: result.track,
        conversion: result.conversion
      })}
    </>
  )
}
