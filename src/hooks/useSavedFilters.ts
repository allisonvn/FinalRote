import { useState, useEffect } from 'react'
import type { EventFilters } from '@/components/dashboard/advanced-event-filters'

export interface SavedFilter {
  id: string
  name: string
  filters: EventFilters
  createdAt: string
}

const STORAGE_KEY = 'rota-final-saved-filters'

export function useSavedFilters() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])

  // Load saved filters from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSavedFilters(parsed)
      }
    } catch (error) {
      console.error('Error loading saved filters:', error)
    }
  }, [])

  // Save filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFilters))
    } catch (error) {
      console.error('Error saving filters:', error)
    }
  }, [savedFilters])

  const saveFilter = (name: string, filters: EventFilters) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString()
    }

    setSavedFilters(prev => [newFilter, ...prev])
    return newFilter
  }

  const deleteFilter = (id: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== id))
  }

  const loadFilter = (id: string): EventFilters | null => {
    const filter = savedFilters.find(f => f.id === id)
    return filter ? filter.filters : null
  }

  const updateFilter = (id: string, name: string, filters: EventFilters) => {
    setSavedFilters(prev => prev.map(f =>
      f.id === id
        ? { ...f, name, filters, createdAt: new Date().toISOString() }
        : f
    ))
  }

  return {
    savedFilters,
    saveFilter,
    deleteFilter,
    loadFilter,
    updateFilter
  }
}
