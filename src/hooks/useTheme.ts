'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as Theme
    if (stored) {
      setTheme(stored)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return undefined

    const root = document.documentElement

    const applyTheme = (theme: Theme) => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.toggle('dark', systemTheme === 'dark')
      } else {
        root.classList.toggle('dark', theme === 'dark')
      }
    }

    applyTheme(theme)
    localStorage.setItem('theme', theme)

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }

    return undefined
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(current => {
      if (current === 'light') return 'dark'
      if (current === 'dark') return 'system'
      return 'light'
    })
  }

  const setSpecificTheme = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  const resolvedTheme = mounted
    ? theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    : 'light'

  return {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme: setSpecificTheme,
    mounted
  }
}