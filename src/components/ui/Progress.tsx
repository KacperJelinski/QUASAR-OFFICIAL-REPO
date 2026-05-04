import { cn } from '../../utils/cn'

interface ProgressProps {
  value: number
  className?: string
  barClassName?: string
}

export function Progress({ value, className, barClassName }: ProgressProps) {
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-300 ease-out', barClassName ?? 'bg-primary')}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
