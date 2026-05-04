import { useEffect, useState } from 'react'
import {
  Trash2, RotateCcw, ShieldAlert, Bug, Biohazard,
  TriangleAlert as AlertTriangle, Archive, Skull, Flame, FileX,
  ChevronRight, Eye, X, Lock, Activity,
} from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useApp } from '../store/AppContext'
import type { Threat } from '../services/mockService'
import { cn } from '../utils/cn'

const SEV_CONFIG: Record<string, { label: string; hue: string; icon: any }> = {
  critical: { label: 'Krytyczne', hue: '27', icon: Skull },
  high: { label: 'Wysokie', hue: '50', icon: Flame },
  medium: { label: 'Średnie', hue: '220', icon: Bug },
  low: { label: 'Niskie', hue: '142', icon: AlertTriangle },
}

function ThreatRow({
  threat,
  onRestore,
  onDelete,
  selected,
  onSelect,
}: {
  threat: Threat
  onRestore: () => void
  onDelete: () => void
  selected: boolean
  onSelect: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const cfg = SEV_CONFIG[threat.severity] ?? SEV_CONFIG.low
  const color = `oklch(0.72 0.18 ${cfg.hue})`
  const SevIcon = cfg.icon

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative overflow-hidden flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-all duration-200',
        selected ? 'bg-muted/50' : 'hover:bg-muted/25'
      )}
      style={{
        borderLeft: `2px solid ${selected ? color : 'transparent'}`,
        transition: 'border-color 0.2s, background 0.2s',
      }}>
      {/* Left indicator on hover */}
      {!selected && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-60 transition-opacity"
          style={{ background: color }} />
      )}

      {/* Threat icon */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `oklch(0.65 0.18 ${cfg.hue} / 0.1)`,
            border: `1px solid oklch(0.65 0.18 ${cfg.hue} / 0.25)`,
          }}>
          <SevIcon className="w-4.5 h-4.5" style={{ color }} strokeWidth={1.8} />
        </div>
        {selected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
            style={{ background: color, boxShadow: `0 0 6px ${color}` }}>
            <Eye className="w-1.5 h-1.5 text-black" />
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground truncate">{threat.fileName}</p>
          <Badge variant={threat.severity === 'critical' ? 'danger' : threat.severity === 'high' ? 'warning' : 'info'}>
            {threat.threatType}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-mono">{threat.filePath}</p>
        <p className="text-[10px] text-muted-foreground mt-1 opacity-60">{threat.detectedAt}</p>
      </div>

      {/* Severity badge */}
      <div className="shrink-0 text-right">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{ background: `oklch(0.65 0.18 ${cfg.hue} / 0.1)`, border: `1px solid oklch(0.65 0.18 ${cfg.hue} / 0.25)` }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{cfg.label}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={onRestore}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
          style={{ background: 'oklch(0.2 0 0)', border: '1px solid oklch(0.28 0 0)', color: 'var(--muted-foreground)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--foreground)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)' }}>
          <RotateCcw className="w-3 h-3" />
          Przywróć
        </button>
        <button
          onClick={() => { if (confirmDelete) { onDelete(); setConfirmDelete(false) } else setConfirmDelete(true) }}
          onBlur={() => setConfirmDelete(false)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
          style={{
            background: confirmDelete ? 'oklch(0.577 0.245 27.325 / 0.15)' : 'oklch(0.2 0 0)',
            border: `1px solid ${confirmDelete ? 'oklch(0.577 0.245 27.325 / 0.4)' : 'oklch(0.28 0 0)'}`,
            color: confirmDelete ? 'var(--destructive)' : 'var(--muted-foreground)',
          }}>
          <Trash2 className="w-3 h-3" />
          {confirmDelete ? 'Potwierdź' : 'Usuń'}
        </button>
      </div>
    </div>
  )
}

function BiohazardRing({ count }: { count: number }) {
  const r = 48
  const circ = 2 * Math.PI * r
  const pct = Math.min(count / 10, 1)
  const offset = circ - pct * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: 128, height: 128 }}>
      <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: 'var(--destructive)', animation: 'soft-breathe 3s ease-in-out infinite' }} />
      <svg viewBox="0 0 112 112" width="128" height="128" className="absolute inset-0 -rotate-90">
        {/* Outer dashes */}
        {Array.from({ length: 24 }, (_, i) => {
          const angle = (i / 24) * 2 * Math.PI - Math.PI / 2
          const or = 54, ir = 51
          return (
            <line key={i}
              x1={56 + ir * Math.cos(angle)} y1={56 + ir * Math.sin(angle)}
              x2={56 + or * Math.cos(angle)} y2={56 + or * Math.sin(angle)}
              stroke="oklch(0.577 0.245 27.325 / 0.2)" strokeWidth="1.5"
            />
          )
        })}
        <circle cx="56" cy="56" r={r} fill="none" stroke="oklch(0.2 0 0)" strokeWidth="5" />
        <circle cx="56" cy="56" r={r} fill="none"
          stroke="url(#dangerGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ filter: 'drop-shadow(0 0 8px oklch(0.577 0.245 27.325 / 0.5))' }}
        />
        <defs>
          <linearGradient id="dangerGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.577 0.245 27.325)" />
            <stop offset="100%" stopColor="oklch(0.65 0.2 40)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative flex flex-col items-center z-10">
        <span className="text-3xl font-extrabold tabular-nums leading-none gradient-text-danger">{count}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">zagrożenia</span>
      </div>
    </div>
  )
}

export function Quarantine() {
  const { threats } = useApp()
  const [localThreats, setLocalThreats] = useState<Threat[]>(threats)
  const [selected, setSelected] = useState<string | null>(null)
  const [showDeleteAll, setShowDeleteAll] = useState(false)

  useEffect(() => { setLocalThreats(threats) }, [threats])

  const handleRestore = (id: string) => {
    setLocalThreats(prev => prev.filter(t => t.id !== id))
    if (selected === id) setSelected(null)
  }

  const handleDelete = (id: string) => {
    setLocalThreats(prev => prev.filter(t => t.id !== id))
    if (selected === id) setSelected(null)
  }

  const sevOrder = ['critical', 'high', 'medium', 'low'] as const
  const sevCounts = sevOrder.map(s => ({
    key: s,
    label: SEV_CONFIG[s].label,
    value: localThreats.filter(t => t.severity === s).length,
    color: `oklch(0.7 0.2 ${SEV_CONFIG[s].hue})`,
    hue: SEV_CONFIG[s].hue,
  }))

  const typeMap = new Map<string, number>()
  localThreats.forEach(t => typeMap.set(t.threatType, (typeMap.get(t.threatType) ?? 0) + 1))
  const typeData = Array.from(typeMap.entries()).map(([name, value], i) => ({
    name, value,
    color: ['oklch(0.65 0.2 27)', 'oklch(0.72 0.18 50)', 'oklch(0.68 0.15 220)'][i % 3],
  }))

  const weekData = [2, 1, 3, 0, 2, 1, localThreats.length].map((v, i) => ({ d: i, v }))

  if (localThreats.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-5 h-full overflow-y-auto">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">Kwarantanna</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Odizolowane zagrożenia: 0</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-24 rounded-2xl"
          style={{ background: 'oklch(0.13 0 0)', border: '1px solid var(--border)' }}>
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: 'var(--primary)' }} />
            <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'oklch(0.65 0.18 142 / 0.1)', border: '1px solid oklch(0.65 0.18 142 / 0.25)' }}>
              <Lock className="w-9 h-9 text-primary" />
            </div>
          </div>
          <p className="text-lg font-bold text-foreground">Kwarantanna jest pusta</p>
          <p className="text-sm text-muted-foreground mt-1.5">Nie wykryto żadnych zagrożeń w systemie</p>
          <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
            style={{ background: 'oklch(0.65 0.18 142 / 0.08)', border: '1px solid oklch(0.65 0.18 142 / 0.2)' }}>
            <Activity className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">System bezpieczny</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">Kwarantanna</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-destructive">{localThreats.length}</span> odizolowanych zagrożeń
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showDeleteAll ? (
            <>
              <button onClick={() => setShowDeleteAll(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                style={{ background: 'oklch(0.2 0 0)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                <X className="w-3 h-3" />
                Anuluj
              </button>
              <button onClick={() => { setLocalThreats([]); setShowDeleteAll(false); setSelected(null) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all btn-glow"
                style={{ background: 'var(--destructive)', color: 'white', boxShadow: '0 0 16px oklch(0.577 0.245 27.325 / 0.3)' }}>
                <Trash2 className="w-3 h-3" />
                Potwierdź usunięcie
              </button>
            </>
          ) : (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteAll(true)}>
              <Trash2 className="w-3.5 h-3.5" />
              Usuń wszystkie
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Biohazard ring + severity */}
        <div className="col-span-2 relative overflow-hidden rounded-2xl p-4"
          style={{
            background: 'linear-gradient(145deg, oklch(0.577 0.245 27.325 / 0.08), oklch(0.13 0 0) 55%)',
            border: '1px solid oklch(0.577 0.245 27.325 / 0.25)',
            boxShadow: '0 4px 24px oklch(0 0 0 / 0.4), 0 0 30px oklch(0.577 0.245 27.325 / 0.05)',
          }}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-12 pointer-events-none"
            style={{ background: 'var(--destructive)' }} />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, oklch(0.577 0.245 27.325 / 0.4), transparent)' }} />

          <div className="relative flex items-center gap-5">
            <BiohazardRing count={localThreats.length} />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-bold text-foreground mb-3">Poziomy zagrożeń</p>
              {sevCounts.map(s => {
                const pct = localThreats.length ? (s.value / localThreats.length) * 100 : 0
                const SevIcon = SEV_CONFIG[s.key].icon
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <SevIcon className="w-3 h-3 shrink-0" style={{ color: s.color }} strokeWidth={1.8} />
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.18 0 0)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                    </div>
                    <span className="text-[10px] font-bold tabular-nums w-4 text-right text-foreground">{s.value}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="relative overflow-hidden rounded-2xl p-3 flex flex-col"
          style={{ background: 'oklch(0.13 0 0)', border: '1px solid oklch(0.577 0.245 27.325 / 0.15)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Bug className="w-3 h-3 text-destructive" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Wg typu</span>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height={96}>
              <PieChart>
                <Pie data={typeData} dataKey="value" innerRadius={26} outerRadius={42} paddingAngle={4} stroke="none" startAngle={90} endAngle={450}>
                  {typeData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold tabular-nums gradient-text-danger">{localThreats.length}</span>
            </div>
          </div>
          <div className="space-y-1 mt-1">
            {typeData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-[10px] text-muted-foreground truncate">{d.name}</span>
                <span className="text-[10px] font-bold text-foreground ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar trend */}
        <div className="relative overflow-hidden rounded-2xl p-3 flex flex-col"
          style={{ background: 'oklch(0.13 0 0)', border: '1px solid oklch(0.577 0.245 27.325 / 0.15)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Biohazard className="w-3 h-3 text-destructive" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trend 7 dni</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={72}>
              <BarChart data={weekData} barSize={8}>
                <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                  {weekData.map((_, i) => (
                    <Cell key={i} fill={i === 6 ? 'oklch(0.577 0.245 27.325)' : 'oklch(0.4 0.1 27 / 0.6)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-1 pt-1.5" style={{ borderTop: '1px solid oklch(0.2 0 0)' }}>
            <span className="text-[10px] text-muted-foreground">7 dni</span>
            <div className="flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-destructive" />
              <span className="text-sm font-extrabold tabular-nums gradient-text-danger">{localThreats.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Threat table */}
      <div className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'oklch(0.13 0 0)',
          border: '1px solid oklch(0.577 0.245 27.325 / 0.18)',
          boxShadow: '0 4px 24px oklch(0 0 0 / 0.35)',
        }}>
        {/* Table header */}
        <div className="grid gap-4 px-4 py-2.5"
          style={{
            gridTemplateColumns: '2.5fr 1fr 1fr 1fr auto',
            background: 'oklch(0.11 0 0)',
            borderBottom: '1px solid oklch(0.577 0.245 27.325 / 0.12)',
          }}>
          {['Nazwa pliku', 'Typ zagrożenia', 'Poziom', 'Data wykrycia', 'Akcje'].map(col => (
            <span key={col} className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em]">{col}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ borderColor: 'oklch(0.18 0 0)' }}>
          {localThreats.map((threat) => (
            <ThreatRow
              key={threat.id}
              threat={threat}
              onRestore={() => handleRestore(threat.id)}
              onDelete={() => handleDelete(threat.id)}
              selected={selected === threat.id}
              onSelect={() => setSelected(selected === threat.id ? null : threat.id)}
            />
          ))}
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
        style={{ background: 'oklch(0.13 0 0)', border: '1px solid var(--border)' }}>
        <FileX className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Informacja: </span>
          Możesz przywrócić zaufany plik lub trwale go usunąć. Pliki w kwarantannie nie mogą wyrządzić szkody systemowi.
        </p>
      </div>
    </div>
  )
}
