import { useEffect, useState } from 'react'
import { Shield, Search, RefreshCw, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Info, Zap } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { getHistory } from '../services/mockService'
import type { HistoryEvent } from '../services/mockService'

const EVENT_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  scan: Search,
  threat: AlertTriangle,
  update: RefreshCw,
  action: Zap,
  protection: Shield,
}

const SEV_STYLE: Record<string, { bg: string; border: string; dot: string }> = {
  success: { bg: 'oklch(0.65 0.18 142 / 0.1)', border: 'oklch(0.65 0.18 142 / 0.25)', dot: 'var(--primary)' },
  info: { bg: 'oklch(0.6 0.2 220 / 0.1)', border: 'oklch(0.6 0.2 220 / 0.25)', dot: 'oklch(0.6 0.2 220)' },
  warning: { bg: 'oklch(0.7 0.15 60 / 0.1)', border: 'oklch(0.7 0.15 60 / 0.25)', dot: 'oklch(0.7 0.15 60)' },
  danger: { bg: 'oklch(0.577 0.245 27.325 / 0.1)', border: 'oklch(0.577 0.245 27.325 / 0.25)', dot: 'var(--destructive)' },
}

const SEVERITY_BADGES: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  success: 'success', info: 'info', warning: 'warning', danger: 'danger',
}

const SEVERITY_LABEL: Record<string, string> = {
  success: 'OK', info: 'Info', warning: 'Ostrzeżenie', danger: 'Zagrożenie',
}

export function History() {
  const [events, setEvents] = useState<HistoryEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    getHistory().then(e => { setEvents(e); setLoading(false) })
  }, [])

  const filters = [
    { id: 'all', label: 'Wszystkie' },
    { id: 'scan', label: 'Skanowania' },
    { id: 'threat', label: 'Zagrożenia' },
    { id: 'update', label: 'Aktualizacje' },
    { id: 'action', label: 'Akcje' },
  ]

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  return (
    <div className="flex flex-col gap-3 p-5 h-full overflow-y-auto">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Historia</h2>
          <p className="text-xs text-muted-foreground">Pełna historia zdarzeń systemowych</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border/60 bg-muted/30 w-fit">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 cursor-pointer"
            style={{
              background: filter === f.id ? 'var(--card)' : 'transparent',
              color: filter === f.id ? 'var(--foreground)' : 'var(--muted-foreground)',
              boxShadow: filter === f.id ? '0 1px 3px oklch(0 0 0 / 0.2)' : undefined,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-4 bottom-4 w-px"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--border) 10%, var(--border) 90%, transparent)' }} />

          <div className="space-y-1.5">
            {filtered.map((event, i) => {
              const Icon = EVENT_ICONS[event.type] ?? Info
              const sev = event.severity ?? 'info'
              const s = SEV_STYLE[sev]
              return (
                <div key={event.id} className="relative flex items-start gap-3 float-up" style={{ animationDelay: `${i * 25}ms` }}>
                  {/* Icon node */}
                  <div className="relative z-10 w-9 h-9 rounded-lg border flex items-center justify-center shrink-0"
                    style={{ background: s.bg, borderColor: s.border, color: s.dot } as React.CSSProperties}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </div>

                  {/* Card */}
                  <div className="flex-1 rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm p-2.5 transition-all duration-200 hover:border-primary/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant={SEVERITY_BADGES[sev]}>{SEVERITY_LABEL[sev]}</Badge>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{event.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Brak zdarzeń dla wybranego filtru</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
