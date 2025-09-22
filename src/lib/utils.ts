import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('pt-BR', options).format(value)
}

export function formatPercent(value: number, decimals = 1) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100)
}

export function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency
  }).format(value)
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  }).format(dateObj)
}

export function formatDateTime(date: string | Date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

export function formatRelativeTime(date: string | Date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - dateObj.getTime()

  const seconds = Math.floor(diffInMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'agora mesmo'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  if (weeks < 4) return `${weeks}sem`
  if (months < 12) return `${months}mês`

  return formatDate(dateObj)
}

export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${randomPart}`
}

export function generateSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, '') // Remove hífens do início e fim
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    return new Promise<void>((resolve, reject) => {
      document.execCommand('copy') ? resolve() : reject()
      document.body.removeChild(textArea)
    })
  }
}

export function downloadFile(data: string, filename: string, type = 'text/plain') {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

export function calculateStatisticalSignificance(
  controlConversions: number,
  controlVisitors: number,
  variantConversions: number,
  variantVisitors: number
) {
  if (controlVisitors === 0 || variantVisitors === 0) return null

  const p1 = controlConversions / controlVisitors
  const p2 = variantConversions / variantVisitors

  const pooledProbability = (controlConversions + variantConversions) / (controlVisitors + variantVisitors)
  const standardError = Math.sqrt(pooledProbability * (1 - pooledProbability) * (1/controlVisitors + 1/variantVisitors))

  if (standardError === 0) return null

  const zScore = (p2 - p1) / standardError
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))

  return {
    zScore,
    pValue,
    isSignificant: pValue < 0.05,
    confidenceLevel: 1 - pValue,
    uplift: ((p2 - p1) / p1) * 100
  }
}

// Função auxiliar para calcular a CDF normal
function normalCDF(x: number) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

// Função de erro (aproximação)
function erf(x: number) {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911

  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizeHtml(html: string) {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}