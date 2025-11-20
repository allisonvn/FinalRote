'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUserPreferences } from '@/hooks/useLocalStorage'

type AppContextType = {
  preferences: ReturnType<typeof useUserPreferences>['preferences']
  updatePreference: ReturnType<typeof useUserPreferences>['updatePreference']
  toggleSidebar: ReturnType<typeof useUserPreferences>['toggleSidebar']
  togglePin: ReturnType<typeof useUserPreferences>['togglePin']
  clearPreferences: ReturnType<typeof useUserPreferences>['clearPreferences']
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const userPrefs = useUserPreferences()

  return (
    <AppContext.Provider
      value={{
        preferences: userPrefs.preferences,
        updatePreference: userPrefs.updatePreference,
        toggleSidebar: userPrefs.toggleSidebar,
        togglePin: userPrefs.togglePin,
        clearPreferences: userPrefs.clearPreferences
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    // Retornar valores padrão durante pré-renderização (SSR)
    return {
      preferences: {
        sidebarCollapsed: false,
        pinnedExperiments: [],
        theme: 'auto' as const,
        language: 'pt-BR' as const
      },
      updatePreference: () => {},
      toggleSidebar: () => {},
      togglePin: () => {},
      clearPreferences: () => {}
    }
  }
  return context
}