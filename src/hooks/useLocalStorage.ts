import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for changes to this key from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue, removeValue]
}

// Hook for managing user preferences
export function useUserPreferences() {
  const [preferences, setPreferences, clearPreferences] = useLocalStorage('user-preferences', {
    sidebarCollapsed: false,
    pinnedExperiments: [] as string[],
    defaultTimeRange: '30d' as '7d' | '30d' | '90d',
    showTooltips: true,
    autoRefresh: false,
    refreshInterval: 30000, // 30 seconds
    defaultView: 'grid' as 'grid' | 'list',
    theme: 'system' as 'light' | 'dark' | 'system'
  })

  const updatePreference = useCallback(
    <K extends keyof typeof preferences>(key: K, value: typeof preferences[K]) => {
      setPreferences(prev => ({ ...prev, [key]: value }))
    },
    [setPreferences]
  )

  const toggleSidebar = useCallback(() => {
    updatePreference('sidebarCollapsed', !preferences.sidebarCollapsed)
  }, [preferences.sidebarCollapsed, updatePreference])

  const pinExperiment = useCallback((id: string) => {
    updatePreference('pinnedExperiments', [...preferences.pinnedExperiments, id])
  }, [preferences.pinnedExperiments, updatePreference])

  const unpinExperiment = useCallback((id: string) => {
    updatePreference('pinnedExperiments', preferences.pinnedExperiments.filter(pid => pid !== id))
  }, [preferences.pinnedExperiments, updatePreference])

  const togglePin = useCallback((id: string) => {
    if (preferences.pinnedExperiments.includes(id)) {
      unpinExperiment(id)
    } else {
      pinExperiment(id)
    }
  }, [preferences.pinnedExperiments, pinExperiment, unpinExperiment])

  return {
    preferences,
    updatePreference,
    clearPreferences,
    toggleSidebar,
    pinExperiment,
    unpinExperiment,
    togglePin
  }
}