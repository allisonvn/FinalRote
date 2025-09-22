'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Simple popover implementation without Radix UI

interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({ open: false, setOpen: () => {} })

export function Popover({ children, open: controlledOpen, onOpenChange }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </PopoverContext.Provider>
  )
}

export const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: () => setOpen(!open),
      ref
    } as any)
  }

  return (
    <button
      ref={ref}
      onClick={() => setOpen(!open)}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
PopoverTrigger.displayName = 'PopoverTrigger'

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  PopoverContentProps
>(({ className, align = 'center', sideOffset = 4, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      className={cn(
        'absolute top-full z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md',
        align === 'end' && 'right-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'start' && 'left-0',
        className
      )}
      style={{ marginTop: sideOffset }}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverContent.displayName = 'PopoverContent'