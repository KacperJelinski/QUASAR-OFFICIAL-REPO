import { Shield, Eye, Lock, Globe, Flame, Usb, KeyRound, EyeOff, ShieldOff, TriangleAlert, Activity, Zap, RefreshCw } from 'lucide-react'
import { Switch } from '../components/ui/Switch'
import { useApp } from '../store/AppContext'

const PROTECTION_ICONS: Record<string, React.ComponentType<any>> = {
  realtime: Shield,
  behavior: Eye,
  ransomware: Lock,
  web: Globe,
  firewall: Flame,
  device: Usb,
  keylogger: KeyRound,
  privacy: EyeOff,
}

const HUE: Record<string, string> = {
  realtime: '142',
  behavior: '220',
  ransomware: '85',
  web: '195',
  firewall: '30',
  device: '280',
  keylogger: '330',
  privacy: '160',
}

function ShieldRing({ pct, active }: { pct: number; active: boolean }) {
  const r = 70
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Outer glow */}
      {active && (
        <div className="absolute inset-0 rounded-full opacity-20 blur-2xl"
          style={{ background: 'var(--primary)', animation: 'pulse 3s ease-in-out infinite' }} />
      )}
      <svg viewBox="0 0 160 160" width="200" height="200" className="-rotate-90 absolute inset-0">
        {/* Track */}
        <circle cx="80" cy="80" r={r} fill="none" stroke="oklch(0.2 0 0)" strokeWidth="6" />
        {/* Progress */}
        <circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke={active ? 'url(#shieldGrad)' : 'oklch(0.577 0.245 27.325 / 0.5)'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={active ? offset : circ}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)',
            filter: active ? 'drop-shadow(0 0 8px var(--glow-primary))' : 'none',
          }}
        />
        {/* Tick marks */}
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i / 24) * 2 * Math.PI - Math.PI / 2
          const x1 = 80 + (r - 12) * Math.cos(angle)
          const y1 = 80 + (r - 12) * Math.sin(angle)
          const x2 = 80 + (r - 8) * Math.cos(angle)
          const y2 = 80 + (r - 8) * Math.sin(angle)
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="oklch(0.3 0 0)" strokeWidth="1.5" />
          )
        })}
        <defs>
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="oklch(0.75 0.16 165)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center */}
      <div className="relative flex flex-col items-center justify-center z-10">
        {active ? (
          <Shield className="w-10 h-10 text-primary mb-1" strokeWidth={1.5}
            style={{ filter: 'drop-shadow(0 0 12px var(--glow-primary))' }} />
        ) : (
          <ShieldOff className="w-10 h-10 text-destructive mb-1" strokeWidth={1.5} />
        )}
        <span className="text-2xl font-extrabold tabular-nums text-foreground">{active ? pct : 0}%</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">ochrona</span>
      </div>
    </div>
  )
}

function ModuleCard({ protection, enabled, hue, onToggle }: {
  protection: { id: string; name: string; description: string; enabled: boolean }
  enabled: boolean
  hue: string
  onToggle: () => void
}) {
  const Icon = PROTECTION_ICONS[protection.id] ?? Shield

  return (
    <div className="relative overflow-hidden rounded-2xl border transition-all duration-300 group"
      style={{
        background: enabled
          ? `linear-gradient(135deg, oklch(0.65 0.18 ${hue} / 0.06), var(--card) 60%)`
          : 'var(--card)',
        borderColor: enabled ? `oklch(0.65 0.18 ${hue} / 0.25)` : 'var(--border)',
        boxShadow: enabled ? `0 4px 20px oklch(0 0 0 / 0.3), 0 0 12px oklch(0.65 0.18 ${hue} / 0.08)` : '0 2px 8px oklch(0 0 0 / 0.2)',
      }}>
      {enabled && (
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: `oklch(0.65 0.18 ${hue})` }} />
      )}

      <div className="relative p-3.5">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: enabled ? `oklch(0.65 0.18 ${hue} / 0.15)` : 'oklch(0.2 0 0)',
                boxShadow: enabled ? `0 0 16px oklch(0.65 0.18 ${hue} / 0.25)` : 'none',
                transition: 'all 0.3s ease',
              }}>
              <Icon className="w-5 h-5"
                style={{ color: enabled ? `oklch(0.72 0.15 ${hue})` : 'var(--muted-foreground)' }}
                strokeWidth={1.8} />
            </div>
            {enabled && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{
                  background: `oklch(0.65 0.18 ${hue})`,
                  boxShadow: `0 0 6px oklch(0.65 0.18 ${hue})`,
                  animation: 'pulse 2s ease-in-out infinite',
                }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{protection.name}</p>
              <Switch
                checked={protection.enabled}
                onCheckedChange={onToggle}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{protection.description}</p>

            {/* Status bar */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.2 0 0)' }}>
                {enabled && (
                  <div className="h-full rounded-full relative overflow-hidden"
                    style={{
                      width: '100%',
                      background: `linear-gradient(90deg, oklch(0.65 0.18 ${hue}), oklch(0.75 0.14 ${hue}))`,
                    }}>
                    <div className="absolute inset-0 progress-shine" />
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0"
                style={{ color: enabled ? `oklch(0.65 0.18 ${hue})` : 'var(--muted-foreground)' }}>
                {enabled ? 'AKTYWNY' : 'OFF'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Protection() {
  const { protections, toggleProtection, masterProtection, setMasterProtection, licenseLocked } = useApp()
  const activeCount = protections.filter(p => p.enabled).length
  const total = protections.length
  const pct = total > 0 ? Math.round((activeCount / total) * 100) : 0

  const threatLevel = !masterProtection ? 'Krytyczne' : pct === 100 ? 'Brak zagrożeń' : pct >= 75 ? 'Niskie' : 'Podwyższone'
  const threatColor = !masterProtection ? 'oklch(0.577 0.245 27.325)' : pct === 100 ? 'var(--primary)' : pct >= 75 ? 'oklch(0.82 0.17 85)' : 'oklch(0.577 0.245 27.325)'

  return (
    <div className="flex flex-col gap-4 p-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Ochrona</h2>
          <p className="text-xs text-muted-foreground">Zarządzaj modułami ochrony w czasie rzeczywistym</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
          style={{
            background: `${threatColor}14`,
            borderColor: `${threatColor}40`,
          }}>
          {masterProtection && pct === 100
            ? <Activity className="w-3 h-3" style={{ color: threatColor }} />
            : <TriangleAlert className="w-3 h-3" style={{ color: threatColor }} />}
          <span className="text-[11px] font-bold" style={{ color: threatColor }}>{threatLevel}</span>
        </div>
      </div>

      {/* Main hero card */}
      <div className="relative overflow-hidden rounded-3xl border"
        style={{
          background: masterProtection
            ? 'linear-gradient(135deg, oklch(0.65 0.18 142 / 0.08) 0%, oklch(0.13 0 0) 50%, oklch(0.14 0 0) 100%)'
            : 'linear-gradient(135deg, oklch(0.577 0.245 27.325 / 0.06) 0%, oklch(0.13 0 0) 60%)',
          borderColor: masterProtection ? 'oklch(0.65 0.18 142 / 0.2)' : 'oklch(0.577 0.245 27.325 / 0.25)',
          boxShadow: masterProtection
            ? '0 8px 40px oklch(0 0 0 / 0.4), 0 0 40px oklch(0.65 0.18 142 / 0.05)'
            : '0 8px 40px oklch(0 0 0 / 0.4)',
        }}>
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl"
            style={{ background: masterProtection ? 'oklch(0.65 0.18 142 / 0.07)' : 'oklch(0.577 0.245 27.325 / 0.06)' }} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl"
            style={{ background: masterProtection ? 'oklch(0.65 0.18 165 / 0.05)' : 'oklch(0.577 0.245 27.325 / 0.04)' }} />
        </div>

        <div className="relative flex items-center gap-8 p-6">
          <ShieldRing pct={pct} active={masterProtection} />

          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: masterProtection ? 'var(--primary)' : 'oklch(0.577 0.245 27.325)' }}>
                  {masterProtection ? 'Tarcza QUASAR · włączona' : 'Tarcza QUASAR · wyłączona'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground tracking-tight leading-snug">
                {masterProtection
                  ? 'System chroniony w czasie rzeczywistym'
                  : 'System bez ochrony — ryzyko zagrożeń'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                {masterProtection
                  ? `${activeCount} z ${total} modułów aktywnych · Ochrona wielowarstwowa`
                  : 'Aktywuj tarczę aby chronić swój system przed zagrożeniami'}
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Aktywne', value: masterProtection ? activeCount : 0, hue: '142' },
                { label: 'Nieaktywne', value: masterProtection ? (total - activeCount) : total, hue: '27' },
                { label: 'Poziom', value: masterProtection ? `${pct}%` : '0%', hue: '220' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-2.5 border border-border/50"
                  style={{ background: 'oklch(0.1 0 0 / 0.6)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{s.label}</p>
                  <p className="text-lg font-extrabold tabular-nums" style={{ color: `oklch(0.72 0.15 ${s.hue})` }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Master toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40"
              style={{ background: 'oklch(0.12 0 0 / 0.8)' }}>
              <div className="flex items-center gap-2">
                {masterProtection
                  ? <Zap className="w-4 h-4 text-primary" />
                  : <ShieldOff className="w-4 h-4 text-destructive" />}
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {masterProtection ? 'Ochrona włączona' : 'Ochrona wyłączona'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Przełącza wszystkie moduły jednocześnie</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {licenseLocked && (
                  <span className="text-[10px] text-destructive font-medium">Wymagana licencja</span>
                )}
                <Switch
                  checked={masterProtection}
                  onCheckedChange={setMasterProtection}
                  disabled={licenseLocked}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Moduły ochrony</p>
        </div>
        {masterProtection && (
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Aktualizacja definicji: dzisiaj 08:00</span>
          </div>
        )}
      </div>

      {/* Protection modules grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {protections.map((protection) => {
          const hue = HUE[protection.id] ?? '142'
          const enabled = protection.enabled
          return (
            <ModuleCard
              key={protection.id}
              protection={protection}
              enabled={enabled}
              hue={hue}
              onToggle={() => toggleProtection(protection.id)}
            />
          )
        })}
      </div>

      {/* Warning banner */}
      {!masterProtection && (
        <div className="relative overflow-hidden rounded-xl p-4 flex items-start gap-3"
          style={{
            background: 'linear-gradient(135deg, oklch(0.577 0.245 27.325 / 0.1), oklch(0.577 0.245 27.325 / 0.04))',
            border: '1px solid oklch(0.577 0.245 27.325 / 0.35)',
          }}>
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20"
            style={{ background: 'oklch(0.577 0.245 27.325)' }} />
          <TriangleAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">System bez ochrony</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Wszystkie moduły ochrony są wyłączone. Twój system jest narażony na wirusy, ransomware i inne zagrożenia.
              {licenseLocked && ' Aktywuj licencję aby włączyć ochronę.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
