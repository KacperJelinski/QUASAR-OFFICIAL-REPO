import React from 'react'
import { cn } from '../../utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        {
          'bg-primary/15 text-primary': variant === 'default',
          'bg-green-500/15 text-green-400': variant === 'success',
          'bg-yellow-500/15 text-yellow-400': variant === 'warning',
          'bg-red-500/15 text-red-400': variant === 'danger',
          'bg-blue-500/15 text-blue-400': variant === 'info',
          'border border-border text-muted-foreground': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
