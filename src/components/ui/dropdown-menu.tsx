'use client'

import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Simple dropdown implementation without Radix UI

interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
  disabled?: boolean
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({ open: false, setOpen: () => {} })

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext)

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
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, align = 'center', children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext)
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
        'absolute top-full z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        align === 'end' && 'right-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'start' && 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = 'DropdownMenuContent'

export const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ className, inset, disabled, onClick, children, ...props }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext)

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled) {
      onClick?.(event)
      setOpen(false)
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
        disabled && 'pointer-events-none opacity-50',
        inset && 'pl-8',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuItem.displayName = 'DropdownMenuItem'

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-sm font-semibold',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

// Placeholder exports for compatibility
export const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuSubContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuSubTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuCheckboxItem = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuRadioItem = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const DropdownMenuShortcut = ({ children }: { children: React.ReactNode }) => <>{children}</>