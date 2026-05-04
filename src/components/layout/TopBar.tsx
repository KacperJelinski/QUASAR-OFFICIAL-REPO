import { useEffect, useRef, useState } from 'react'
import { Minus, X, Bell, RefreshCw, ShieldOff, CheckCheck, Trash2, CircleCheck, CircleAlert, TriangleAlert, Info, LogOut } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import type { AppUser } from '../../services/authService'

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Panel główny',
  protection: 'Ochrona',
  scan: 'Skanowanie',
  quarantine: 'Kwarantanna',
  history: 'Historia',
  optimization: 'Optymalizacja',
  scheduler: 'Harmonogram',
  reports: 'Raporty',
  account: 'Moje konto',
  settings: 'Ustawienia',
  admin: 'Panel administratora',
  chat: 'Czat / Wsparcie',
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s} s temu`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min temu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h temu`
  const d = Math.floor(h / 24)
  return `${d} d temu`
}

const SEVERITY_ICON = {
  success: CircleCheck,
  info: Info,
  warning: TriangleAlert,
  danger: CircleAlert,
} as const

const SEVERITY_COLOR: Record<string, string> = {
  success: 'var(--primary)',
  info: 'oklch(0.7 0.14 220)',
  warning: 'oklch(0.82 0.17 85)',
  danger: 'oklch(0.577 0.245 27.325)',
}

export function TopBar({ user, onLogout }: { user?: AppUser; onLogout?: () => void }) {
  const { currentPage, isLoading, refreshStatus, masterProtection, notifList, unreadCount, markAllNotificationsRead, clearNotifications } = useApp()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const activeColor = masterProtection ? 'oklch(0.65 0.18 142)' : 'oklch(0.577 0.245 27.325)'
  const activeBg = masterProtection ? 'oklch(0.65 0.18 142 / 0.08)' : 'oklch(0.577 0.245 27.325 / 0.08)'
  const activeBorder = masterProtection ? 'oklch(0.65 0.18 142 / 0.2)' : 'oklch(0.577 0.245 27.325 / 0.2)'

  return (
    <header
      className="flex items-center justify-between h-11 px-4 shrink-0 relative select-none"
      style={{
        background: 'linear-gradient(to bottom, oklch(0.16 0 0), oklch(0.13 0 0))',
        borderBottom: '1px solid oklch(0.2 0 0)',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, oklch(0.28 0 0), transparent)' }} />

      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-foreground tracking-wide">QUASAR</span>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <span className="text-[11px] text-muted-foreground">{PAGE_TITLES[currentPage] ?? currentPage}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full"
        style={{ background: activeBg, border: `1px solid ${activeBorder}` }}>
        {masterProtection ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: activeColor, boxShadow: `0 0 6px ${activeColor}` }} />
            <span className="text-[11px] font-medium" style={{ color: activeColor }}>Ochrona aktywna</span>
          </>
        ) : (
          <>
            <ShieldOff className="w-3 h-3" style={{ color: activeColor }} />
            <span className="text-[11px] font-medium" style={{ color: activeColor }}>Ochrona nieaktywna</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={refreshStatus}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors hover:bg-white/5"
          title="Odśwież"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen(o => !o)}
            className="relative h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors hover:bg-white/5"
            title="Powiadomienia"
          >
            <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'bell-wiggle' : ''}`} />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--primary)', boxShadow: '0 0 6px var(--primary)' }} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full ping-dot" style={{ background: 'var(--primary)' }} />
              </>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-8 w-80 rounded-xl border shadow-2xl z-50 overflow-hidden notif-pop"
              style={{
                background: 'linear-gradient(180deg, oklch(0.16 0 0), oklch(0.13 0 0))',
                borderColor: 'var(--border)',
                boxShadow: '0 16px 48px oklch(0 0 0 / 0.55)',
              }}>
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">Powiadomienia</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 rounded-full font-bold" style={{ background: 'var(--primary)', color: 'oklch(0.08 0 0)' }}>{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={markAllNotificationsRead} className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5" title="Oznacz jako przeczytane">
                    <CheckCheck className="w-3 h-3" />
                  </button>
                  <button onClick={clearNotifications} className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-white/5" title="Wyczyść">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <Bell className="w-6 h-6 text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground">Brak powiadomień</p>
                  </div>
                ) : notifList.map((n, i) => {
                  const Icon = SEVERITY_ICON[n.severity]
                  const color = SEVERITY_COLOR[n.severity]
                  return (
                    <div key={n.id}
                      className="flex items-start gap-2.5 px-3.5 py-2.5 border-b border-border/40 hover:bg-white/[0.02] transition-colors notif-item"
                      style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: `${color.replace(')', ' / 0.12)')}` }}>
                        <Icon className="w-3 h-3" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold truncate ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: 'var(--primary)' }} />}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {user && onLogout && (
          <>
            <div className="w-px h-4 mx-0.5" style={{ background: 'var(--border)' }} />
            <button
              onClick={onLogout}
              title={`Wyloguj (${user.first_name || user.full_name})`}
              className="h-7 px-2 flex items-center gap-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all text-[11px] font-medium"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">{user.first_name || user.full_name.split(' ')[0]}</span>
            </button>
          </>
        )}
        <div className="w-px h-4 mx-1" style={{ background: 'var(--border)' }} />
        <button className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/80 hover:text-white transition-all duration-150">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  )
}
