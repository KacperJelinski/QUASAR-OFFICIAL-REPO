import React from 'react'
import { cn } from '../../utils/cn'

interface CardProps {
  className?: string
  children: React.ReactNode
  glass?: boolean
  glow?: boolean
  onClick?: () => void
}

export function Card({ className, children, glass, glow, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border p-4 transition-all duration-200 relative',
        glass
          ? 'bg-card/60 backdrop-blur-sm border-border/60'
          : 'bg-card border-border/80',
        glow && 'border-primary/25',
        onClick && 'cursor-pointer hover:border-primary/40',
        'card-elevated',
        className
      )}
      style={{
        boxShadow: glow
          ? '0 4px 24px oklch(0 0 0 / 0.35), 0 0 0 1px oklch(0.65 0.18 142 / 0.08)'
          : '0 4px 24px oklch(0 0 0 / 0.3), 0 1px 4px oklch(0 0 0 / 0.2)',
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mb-3', className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn('text-xs font-semibold text-muted-foreground uppercase tracking-widest', className)}>
      {children}
    </h3>
  )
}
