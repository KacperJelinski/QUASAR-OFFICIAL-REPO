import { LayoutDashboard, Shield, Search, Archive, History, Zap, Clock, ChartBar as BarChart2, User, Settings, Lock, ShieldCheck, MessageCircle, Crown, Activity } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useApp } from '../../store/AppContext'

const ALWAYS_UNLOCKED = new Set(['account', 'chat', 'admin'])

const NAV_PRIMARY = [
  { id: 'dashboard', label: 'Panel główny', icon: LayoutDashboard },
  { id: 'protection', label: 'Ochrona', icon: Shield },
  { id: 'scan', label: 'Skanowanie', icon: Search },
  { id: 'quarantine', label: 'Kwarantanna', icon: Archive },
  { id: 'history', label: 'Historia', icon: History },
] as const

const NAV_SECONDARY = [
  { id: 'optimization', label: 'Optymalizacja', icon: Zap },
  { id: 'scheduler', label: 'Harmonogram', icon: Clock },
  { id: 'reports', label: 'Raporty', icon: BarChart2 },
  { id: 'chat', label: 'Czat / Wsparcie', icon: MessageCircle },
] as const

const NAV_ACCOUNT = [
  { id: 'account', label: 'Moje konto', icon: User },
  { id: 'settings', label: 'Ustawienia', icon: Settings },
] as const

function NavButton({ id, label, icon: Icon, badge }: { id: string; label: string; icon: any; badge?: React.ReactNode }) {
  const { currentPage, navigate, licenseLocked } = useApp()
  const isActive = currentPage === id
  const locked = licenseLocked && !ALWAYS_UNLOCKED.has(id)

  return (
    <button
      onClick={() => !locked && navigate(id as any)}
      disabled={locked}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative',
        locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
        isActive && !locked ? 'text-sidebar-accent-foreground font-semibold' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
      )}
      style={isActive && !locked ? {
        background: 'linear-gradient(90deg, var(--glow-primary-soft), transparent 120%)',
      } : undefined}
    >
      {isActive && !locked && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
          style={{ background: 'var(--primary)', boxShadow: '0 0 10px var(--glow-primary)' }} />
      )}
      {!isActive && !locked && (
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'oklch(1 0 0 / 0.035)' }} />
      )}
      <Icon
        className={cn('w-4 h-4 shrink-0 transition-all relative z-10', isActive && !locked ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}
        strokeWidth={isActive ? 2.2 : 1.8}
      />
      <span className="flex-1 text-left truncate relative z-10">{label}</span>
      {locked
        ? <Lock className="w-3 h-3 text-muted-foreground/50 relative z-10 shrink-0" strokeWidth={1.8} />
        : badge}
    </button>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-4 pb-1.5 text-[10px] font-bold tracking-[0.14em] text-muted-foreground/70 uppercase">
      {children}
    </p>
  )
}

export function Sidebar() {
  const { currentPage, navigate, threats, licenseDaysLeft, licensePlan, licenseLocked, isAdmin } = useApp()
  const quarantineCount = threats.length

  return (
    <aside className="flex flex-col w-[236px] shrink-0 h-full relative bg-sidebar">
      <div className="absolute right-0 top-0 bottom-0 w-px"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--sidebar-border) 15%, var(--sidebar-border) 85%, transparent)' }} />

      {/* Logo */}
      <div className="relative flex items-center gap-3 px-4 py-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl opacity-80"
            style={{ background: 'var(--glow-primary-soft)' }} />
          <div className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, oklch(0.65 0.18 142 / 0.28), oklch(0.65 0.18 142 / 0.06))',
              border: '1px solid oklch(0.65 0.18 142 / 0.2)',
              boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.05)',
            }}>
            <ShieldCheck className="w-5 h-5 text-primary" strokeWidth={2.2} />
          </div>
        </div>
        <div>
          <p className="text-base font-bold text-sidebar-foreground leading-none tracking-tight">QUASAR</p>
          <p className="text-[10px] text-muted-foreground mt-1 tracking-[0.14em] font-medium">ANTIVIRUS PRO</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        <GroupLabel>Ochrona</GroupLabel>
        <div className="space-y-0.5">
          {NAV_PRIMARY.map((item) => (
            <NavButton
              key={item.id}
              {...item}
              badge={item.id === 'quarantine' && quarantineCount > 0 ? (
                <span className="relative z-10 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                  style={{ background: 'var(--destructive)', boxShadow: '0 0 6px oklch(0.577 0.245 27.325 / 0.5)' }}>
                  {quarantineCount}
                </span>
              ) : undefined}
            />
          ))}
        </div>

        <GroupLabel>Narzędzia</GroupLabel>
        <div className="space-y-0.5">
          {NAV_SECONDARY.map((item) => <NavButton key={item.id} {...item} />)}
        </div>

        <GroupLabel>Konto</GroupLabel>
        <div className="space-y-0.5">
          {NAV_ACCOUNT.map((item) => <NavButton key={item.id} {...item} />)}
          {isAdmin && <button
            onClick={() => navigate('admin')}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer group relative',
              currentPage === 'admin' ? 'text-sidebar-accent-foreground font-semibold' : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
            )}
            style={currentPage === 'admin' ? { background: 'linear-gradient(90deg, var(--glow-primary-soft), transparent 120%)' } : undefined}
          >
            {currentPage === 'admin' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                style={{ background: 'var(--primary)', boxShadow: '0 0 10px var(--glow-primary)' }} />
            )}
            {currentPage !== 'admin' && (
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'oklch(1 0 0 / 0.035)' }} />
            )}
            <Lock className={cn('w-4 h-4 shrink-0 relative z-10', currentPage === 'admin' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} strokeWidth={1.8} />
            <span className="flex-1 text-left truncate relative z-10">Panel admina</span>
          </button>}
        </div>
      </nav>

      {/* License status */}
      <div className="mx-3 mb-3">
        <div
          onClick={() => navigate('account')}
          className="relative overflow-hidden rounded-xl p-3 cursor-pointer group transition-all duration-300"
          style={licenseLocked ? {
            background: 'linear-gradient(135deg, oklch(0.577 0.245 27.325 / 0.08), oklch(0.13 0 0))',
            border: '1px solid oklch(0.577 0.245 27.325 / 0.25)',
          } : {
            background: 'linear-gradient(135deg, oklch(0.65 0.18 142 / 0.12), oklch(0.65 0.18 142 / 0.02))',
            border: '1px solid oklch(0.65 0.18 142 / 0.18)',
            boxShadow: '0 8px 24px oklch(0 0 0 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.04)',
          }}
        >
          {!licenseLocked && (
            <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity"
              style={{ background: 'var(--primary)' }} />
          )}
          <div className="relative flex items-center gap-2 mb-1.5">
            <Crown className={cn('w-3.5 h-3.5', licenseLocked ? 'text-muted-foreground' : 'text-primary')} />
            <span className="text-[11px] font-bold text-foreground tracking-wide">
              {licenseLocked ? 'Licencja nieaktywna' : `Plan ${licensePlan}`}
            </span>
          </div>
          {licenseLocked ? (
            <p className="relative text-[10px]" style={{ color: 'oklch(0.577 0.245 27.325)' }}>
              Aktywuj kod w Moim koncie
            </p>
          ) : (
            <>
              <p className="relative text-[10px] text-muted-foreground mb-1">Wygasa za</p>
              <div className="relative flex items-baseline gap-1">
                <span className="text-2xl font-extrabold gradient-text tracking-tight">{licenseDaysLeft}</span>
                <span className="text-xs text-muted-foreground">dni</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live status */}
      <div className="mx-4 mb-4 flex items-center gap-2 px-1">
        <div className="relative flex items-center justify-center w-4 h-4">
          {licenseLocked ? (
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'oklch(0.577 0.245 27.325)' }} />
          ) : (
            <>
              <div className="absolute w-3 h-3 rounded-full opacity-40 glow-pulse" style={{ background: 'var(--primary)' }} />
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }} />
            </>
          )}
        </div>
        <Activity className="w-3 h-3 text-muted-foreground" />
        <span className="text-[11px] font-medium" style={{ color: licenseLocked ? 'oklch(0.577 0.245 27.325)' : 'var(--muted-foreground)' }}>
          {licenseLocked ? 'Antywirus · offline' : 'Antywirus · online'}
        </span>
      </div>
    </aside>
  )
}
