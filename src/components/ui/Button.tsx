import React from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', className, style, children, ...props }: ButtonProps) {
  const baseStyle: React.CSSProperties =
    variant === 'primary' ? {
      background: 'linear-gradient(135deg, var(--primary) 0%, oklch(0.58 0.16 155) 100%)',
      color: 'var(--primary-foreground)',
      boxShadow: '0 0 14px var(--glow-primary-soft), 0 4px 12px oklch(0 0 0 / 0.3)',
    } : variant === 'destructive' ? {
      background: 'var(--destructive)',
      color: 'var(--destructive-foreground)',
      boxShadow: '0 4px 10px oklch(0 0 0 / 0.3)',
    } : variant === 'secondary' ? {
      background: 'var(--secondary)',
      color: 'var(--secondary-foreground)',
      boxShadow: '0 2px 6px oklch(0 0 0 / 0.2)',
    } : variant === 'outline' ? {
      background: 'oklch(1 0 0 / 0.03)',
      color: 'var(--foreground)',
      border: '1px solid var(--border)',
    } : {} // ghost

  return (
    <button
      className={cn(
        'btn-glow inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        variant === 'primary' && 'active:scale-[0.97]',
        variant === 'ghost' && 'text-foreground hover:bg-secondary',
        variant === 'outline' && 'hover:bg-secondary hover:border-primary/40',
        size === 'sm' && 'text-xs px-3 py-1.5 h-7',
        size === 'md' && 'text-sm px-4 py-2 h-9',
        size === 'lg' && 'text-base px-6 py-2.5 h-11',
        className
      )}
      style={{ ...baseStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  )
}
