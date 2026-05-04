import { Shield, Clock, ShieldCheck, CreditCard, Search, RefreshCw, ArrowRight, Cpu, Wifi, MessageCircle, TrendingUp, Activity, Zap, HardDrive, TriangleAlert as AlertTriangle, Server, Gauge, Phone } from 'lucide-react'
import { useApp } from '../store/AppContext'

function AnimatedShield({ isProtected }: { isProtected: boolean }) {
  const color = isProtected ? 'oklch(0.65 0.18 142)' : 'oklch(0.577 0.245 27.325)'
  const colorMid = isProtected ? 'oklch(0.65 0.18 142 / 0.3)' : 'oklch(0.577 0.245 27.325 / 0.3)'
  const colorFaint = isProtected ? 'oklch(0.65 0.18 142 / 0.08)' : 'oklch(0.577 0.245 27.325 / 0.08)'

  return (
    <div className="relative flex items-center justify-center w-40 h-40 shrink-0">
      <div className="absolute inset-0 rounded-full blur-3xl soft-breathe" style={{ background: colorFaint }} />
      <div className="absolute w-28 h-28 rounded-full border ring-animate" style={{ borderColor: colorMid }} />
      <div className="absolute w-28 h-28 rounded-full border ring-animate-delay" style={{ borderColor: isProtected ? 'oklch(0.65 0.18 142 / 0.2)' : 'oklch(0.577 0.245 27.325 / 0.2)' }} />
      <div className="absolute w-28 h-28 rounded-full border ring-animate-delay2" style={{ borderColor: isProtected ? 'oklch(0.65 0.18 142 / 0.12)' : 'oklch(0.577 0.245 27.325 / 0.12)' }} />
      <div className="absolute w-24 h-24 rounded-full"
        style={{ background: `radial-gradient(circle, ${isProtected ? 'oklch(0.65 0.18 142 / 0.12)' : 'oklch(0.577 0.245 27.325 / 0.12)'} 0%, transparent 70%)` }} />
      <div className={isProtected ? 'shield-animate' : 'shield-animate-danger'}>
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`shieldGrad${isProtected ? 'ok' : 'err'}`} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d="M12 2L3 7V12C3 16.5 7 20.7 12 22C17 20.7 21 16.5 21 12V7L12 2Z"
            fill={`url(#shieldGrad${isProtected ? 'ok' : 'err'})`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          {isProtected && (<path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />)}
          {!isProtected && (<>
            <line x1="12" y1="8" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16" r="0.8" fill={color} />
          </>)}
        </svg>
      </div>
    </div>
  )
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const w = 100, h = 28
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 4) - 2}`).join(' ')
  const area = `0,${h} ${pts} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-7">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#spark-${color})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Dashboard() {
  const { status, startScan, navigate, isLoading, licenseDaysLeft, masterProtection, threats, points, daysTogether } = useApp()

  if (isLoading || !status) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl soft-breathe" />
            <Shield className="relative w-12 h-12 text-primary shield-animate" />
          </div>
          <p className="text-sm text-muted-foreground">Inicjalizacja ochrony...</p>
        </div>
      </div>
    )
  }

  const isProtected = status.protected && masterProtection

  const threatsChart = [1, 3, 0, 2, 4, 1, 2, 0, 3, 5, 2, 1, 4, 2]
  const scansChart = [2, 1, 3, 2, 4, 3, 5, 4, 3, 5, 4, 6, 5, 4]
  const activities = [
    { t: '14:32', txt: 'Szybkie skanowanie zakończone', type: 'ok' },
    { t: '14:01', txt: 'Wykryto nowe urządzenie "Xiaomi-5G"', type: 'warn' },
    { t: '13:48', txt: 'Aktualizacja definicji v5.2.1', type: 'info' },
    { t: '12:20', txt: 'Ransomware zablokowany', type: 'danger' },
    { t: '10:15', txt: 'Backup wykonany pomyślnie', type: 'info' },
    { t: '08:00', txt: 'Pełne skanowanie 284 532 plików', type: 'ok' },
  ]

  return (
    <div className="flex flex-col gap-3 p-5 h-full overflow-y-auto">
      {/* HERO ROW: status + right side info grid */}
      <div className="grid grid-cols-12 gap-3">
        {/* Main status card (spans 8) */}
        <div className={`col-span-8 relative overflow-hidden rounded-2xl border card-elevated-lg ${isProtected ? 'border-primary/25 bg-card' : 'border-destructive/30 bg-card'}`}>
          <div className={`absolute inset-0 pointer-events-none ${isProtected ? 'radial-glow' : 'radial-glow-danger'}`} />
          <div className="relative flex items-center gap-5 px-5 py-4">
            <AnimatedShield isProtected={isProtected} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${isProtected ? 'bg-primary glow-pulse' : 'bg-destructive glow-pulse'}`} />
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                  {isProtected ? 'Ochrona aktywna' : !masterProtection ? 'Ochrona wyłączona' : 'Zagrożenie wykryte'}
                </span>
              </div>
              <h2 className={`text-3xl font-bold mb-1 tracking-tight ${isProtected ? 'gradient-text text-glow-primary' : 'gradient-text-danger'}`}>
                {isProtected ? 'Jesteś chroniony' : !masterProtection ? 'System niezabezpieczony' : 'Wymagana uwaga'}
              </h2>
              <p className="text-xs text-muted-foreground mb-3 max-w-md">
                {isProtected
                  ? 'Wszystkie moduły działają. Ostatni skan: ' + status.lastScan
                  : 'Włącz ochronę i przeskanuj system.'}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => startScan('quick')}
                  className="btn-glow relative flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, oklch(0.65 0.18 142) 0%, oklch(0.58 0.16 155) 100%)`,
                    color: 'oklch(0.08 0 0)',
                    boxShadow: `0 0 20px oklch(0.65 0.18 142 / 0.4), 0 4px 12px oklch(0.65 0.18 142 / 0.2)`,
                  }}>
                  <Search className="w-3.5 h-3.5" strokeWidth={2.5} />Szybkie skanowanie
                </button>
                <button onClick={() => startScan('full')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs border border-border/80 bg-secondary/50 hover:bg-secondary hover:border-primary/30 text-foreground transition-all cursor-pointer">
                  <Shield className="w-3.5 h-3.5" />Pełne
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-xs border border-border/80 bg-secondary/50 hover:bg-secondary hover:border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" />Aktualizuj
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${isProtected ? 'oklch(0.65 0.18 142 / 0.5)' : 'oklch(0.577 0.245 27.325 / 0.5)'}, transparent)` }} />
        </div>

        {/* Right column (spans 4) — user summary + license */}
        <div className="col-span-4 flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-2xl border border-primary/25 p-4 bg-card card-elevated">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: 'var(--primary)' }} />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Plan Pro</span>
                <CreditCard className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-2xl font-bold gradient-text tabular-nums">{licenseDaysLeft}</p>
              <p className="text-[11px] text-muted-foreground">dni do wygaśnięcia</p>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (licenseDaysLeft / 365) * 100)}%`, background: 'linear-gradient(90deg, var(--primary), oklch(0.58 0.16 155))' }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="rounded-2xl border border-border/60 bg-card p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Punkty</span>
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums">{points.toLocaleString('pl-PL')}</p>
              <p className="text-[10px] text-muted-foreground">Wymienisz w zakładce konto</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-3 flex flex-col justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Razem</span>
              </div>
              <p className="text-lg font-bold text-foreground tabular-nums">{daysTogether} dni</p>
              <p className="text-[10px] text-muted-foreground">Z QUASAR</p>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Zagrożenia (14d)', value: threats.length.toString(), sub: 'wszystkie zablokowane', icon: Shield, color: 'oklch(0.65 0.18 142)', data: threatsChart },
          { label: 'Skanowania (14d)', value: '53', sub: 'wykonanych', icon: Activity, color: 'oklch(0.72 0.18 200)', data: scansChart },
          { label: 'Obciążenie CPU', value: '12%', sub: 'niska aktywność', icon: Cpu, color: 'oklch(0.75 0.15 60)', data: [8, 12, 10, 14, 9, 11, 13, 10, 8, 9, 14, 12, 11, 12] },
          { label: 'Sieć', value: '82 Mb/s', sub: 'chroniony ruch', icon: Wifi, color: 'oklch(0.7 0.15 160)', data: [30, 50, 40, 65, 55, 70, 60, 82, 75, 90, 80, 82, 70, 82] },
        ].map((s) => (
          <div key={s.label} className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-3 card-elevated hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${s.color.replace(')', ' / 0.12)')}`.replace('oklch(', 'oklch(') }}>
                  <s.icon className="w-3 h-3" style={{ color: s.color }} strokeWidth={1.8} />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</span>
              </div>
              <TrendingUp className="w-3 h-3 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mb-1">{s.sub}</p>
            <Sparkline data={s.data} color={s.color} />
          </div>
        ))}
      </div>

      {/* BOTTOM: activity + quick access + system */}
      <div className="grid grid-cols-12 gap-3">
        {/* Activity feed */}
        <div className="col-span-5 rounded-xl border border-border/60 bg-card p-3 card-elevated">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Ostatnia aktywność</p>
            </div>
            <button onClick={() => navigate('history')} className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer">zobacz wszystko</button>
          </div>
          <div className="space-y-1.5">
            {activities.map((a, i) => {
              const col = a.type === 'ok' ? 'var(--primary)' : a.type === 'danger' ? 'var(--destructive)' : a.type === 'warn' ? 'oklch(0.75 0.15 60)' : 'oklch(0.72 0.18 200)'
              return (
                <div key={i} className="flex items-center gap-2.5 py-1 float-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-10">{a.t}</span>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: col, boxShadow: `0 0 6px ${col}` }} />
                  <span className="text-xs text-foreground flex-1 truncate">{a.txt}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick access */}
        <div className="col-span-4 rounded-xl border border-border/60 bg-card p-3 card-elevated">
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Szybki dostęp</p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Ochrona', sub: '4/4', page: 'protection' as const, icon: ShieldCheck, accent: true },
              { label: 'Skanowanie', sub: '2h temu', page: 'scan' as const, icon: Search },
              { label: 'Kwarantanna', sub: `${threats.length} elementy`, page: 'quarantine' as const, icon: AlertTriangle },
              { label: 'Czat AI', sub: 'beta', page: 'chat' as const, icon: MessageCircle },
              { label: 'Harmonogram', sub: '2 aktywne', page: 'scheduler' as const, icon: Clock },
              { label: 'Optymalizacja', sub: '2.4 GB', page: 'optimization' as const, icon: Gauge },
            ].map((item) => (
              <button key={item.page} onClick={() => navigate(item.page)}
                className="group flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-secondary/30 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer text-left">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${item.accent ? 'bg-primary/10' : 'bg-muted'}`}>
                  <item.icon className={`w-3 h-3 ${item.accent ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* System health */}
        <div className="col-span-3 rounded-xl border border-border/60 bg-card p-3 card-elevated">
          <div className="flex items-center gap-1.5 mb-2">
            <Server className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Stan systemu</p>
          </div>
          <div className="space-y-2.5">
            {[
              { label: 'Pamięć RAM', value: 42, icon: HardDrive, color: 'oklch(0.65 0.18 142)' },
              { label: 'Dysk C:', value: 68, icon: HardDrive, color: 'oklch(0.75 0.15 60)' },
              { label: 'Procesor', value: 12, icon: Cpu, color: 'oklch(0.72 0.18 200)' },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <r.icon className="w-3 h-3" style={{ color: r.color }} />
                    <span className="text-[11px] text-muted-foreground">{r.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-foreground tabular-nums">{r.value}%</span>
                </div>
                <div className="h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.value}%`, background: r.color, boxShadow: `0 0 6px ${r.color}` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Wersja</span>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">{status.version}</span>
          </div>
        </div>
      </div>

      {/* Contact footer */}
      <div className="mx-1 px-4 py-3 rounded-xl flex items-center justify-center gap-6"
        style={{ background: 'oklch(0.155 0 0)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground">Kontakt telefoniczny:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">Multi-Servis:</span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--primary)' }}>505 012 914</span>
        </div>
        <div className="w-px h-3 bg-border/60" />
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground">CEO aplikacji:</span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: 'var(--primary)' }}>735 044 757</span>
        </div>
      </div>
    </div>
  )
}
