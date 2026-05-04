import { useEffect, useRef, useState } from 'react'
import { Zap, Trash2, AppWindow, Settings2, CircleCheck as CheckCircle2, Loader as Loader2, HardDrive, Cpu, MemoryStick, Wind, Sparkles, Rocket, FileCog, Globe as Globe2, TrendingUp, Activity, ChartBar as BarChart3, ArrowUp } from 'lucide-react'
import { RadialBar, RadialBarChart, ResponsiveContainer, PolarAngleAxis, LineChart, Line } from 'recharts'
import { Badge } from '../components/ui/Badge'
import { cn } from '../utils/cn'

type OptItem = {
  id: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { strokeWidth?: number }>
  label: string
  detail: string
  size: string
  status: 'pending' | 'cleaning' | 'done'
  hue: string
  savings: string
}

const METRICS = [
  { id: 'cpu', label: 'CPU', icon: Cpu, value: 34, hue: '142', trend: -8 },
  { id: 'ram', label: 'RAM', icon: MemoryStick, value: 62, hue: '220', trend: +5 },
  { id: 'disk', label: 'Dysk', icon: HardDrive, value: 78, hue: '30', trend: +12 },
  { id: 'net', label: 'Sieć', icon: Globe2, value: 18, hue: '195', trend: -3 },
]

const INIT_ITEMS: OptItem[] = [
  { id: 'junk', icon: Trash2, label: 'Pliki tymczasowe', detail: '2,4 GB do wyczyszczenia', size: '2,4 GB', status: 'pending', hue: '30', savings: '2.4 GB' },
  { id: 'startup', icon: AppWindow, label: 'Programy startowe', detail: '7 aplikacji uruchamia się z systemem', size: '7 apk.', status: 'pending', hue: '220', savings: '7 apk.' },
  { id: 'registry', icon: Settings2, label: 'Błędy rejestru', detail: '15 problemów do naprawienia', size: '15 błędów', status: 'pending', hue: '85', savings: '15 błędów' },
  { id: 'cache', icon: FileCog, label: 'Cache aplikacji', detail: '890 MB w pamięci podręcznej', size: '890 MB', status: 'pending', hue: '195', savings: '890 MB' },
  { id: 'ram2', icon: MemoryStick, label: 'Nieużywana pamięć RAM', detail: '1,8 GB do zwolnienia', size: '1,8 GB', status: 'pending', hue: '160', savings: '1.8 GB' },
  { id: 'net', icon: Globe2, label: 'Optymalizacja DNS', detail: 'Opóźnienie +18 ms', size: '+18 ms', status: 'pending', hue: '280', savings: '-18 ms' },
]

function delay(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)) }

function HealthGauge({ score, animated }: { score: number; animated?: boolean }) {
  const [display, setDisplay] = useState(score)
  const prevScore = useRef(score)

  useEffect(() => {
    if (!animated) { setDisplay(score); return }
    const start = prevScore.current
    const end = score
    const diff = end - start
    if (diff === 0) return
    let frame = 0
    const total = 40
    const tick = () => {
      frame++
      setDisplay(Math.round(start + (diff * frame) / total))
      if (frame < total) requestAnimationFrame(tick)
      else prevScore.current = end
    }
    requestAnimationFrame(tick)
  }, [score, animated])

  const hue = score >= 80 ? '142' : score >= 60 ? '85' : '27'
  const gaugeData = [{ name: 'score', value: display, fill: `oklch(0.65 0.18 ${hue})` }]

  return (
    <div className="relative" style={{ width: 140, height: 140 }}>
      <div className="absolute inset-0 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: `oklch(0.65 0.18 ${hue})`, animation: 'soft-breathe 3s ease-in-out infinite' }} />
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="68%" outerRadius="96%" data={gaugeData} startAngle={215} endAngle={-35}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'oklch(0.18 0 0)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold tabular-nums text-foreground leading-none">{display}</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground mt-0.5">Kondycja</span>
      </div>
    </div>
  )
}

function MetricCard({ label, icon: Icon, value, hue, trend, optimized }: Omit<typeof METRICS[0], 'id'> & { optimized: boolean }) {
  const adjustedValue = optimized ? Math.max(5, value + (trend < 0 ? trend : 0)) : value
  const barColor = `oklch(0.72 0.15 ${hue})`

  // Mini sparkline
  const sparkData = Array.from({ length: 12 }, (_, i) => ({
    t: i,
    v: adjustedValue + (Math.random() - 0.5) * 15,
  }))

  return (
    <div className="relative overflow-hidden rounded-2xl p-3.5 flex flex-col gap-2 transition-all duration-500"
      style={{
        background: `linear-gradient(145deg, oklch(0.65 0.18 ${hue} / ${optimized ? '0.07' : '0.04'}), oklch(0.14 0 0) 65%)`,
        border: `1px solid oklch(0.65 0.18 ${hue} / ${optimized ? '0.3' : '0.15'})`,
      }}>
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-10 pointer-events-none"
        style={{ background: `oklch(0.65 0.18 ${hue})` }} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `oklch(0.65 0.18 ${hue} / 0.12)` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: barColor }} />
          </div>
          <span className="text-xs font-bold text-foreground">{label}</span>
        </div>
        {trend !== 0 && (
          <div className="flex items-center gap-0.5"
            style={{ color: trend < 0 ? 'var(--primary)' : 'oklch(0.577 0.245 27.325)' }}>
            <ArrowUp className={cn('w-2.5 h-2.5', trend > 0 && 'rotate-180')} />
            <span className="text-[10px] font-bold">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="text-2xl font-extrabold tabular-nums text-foreground">{adjustedValue}</span>
        <span className="text-xs text-muted-foreground mb-0.5">%</span>
        <div className="flex-1 ml-1" style={{ height: 28 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={barColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.2 0 0)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${adjustedValue}%`, background: barColor, boxShadow: `0 0 6px ${barColor}` }} />
      </div>
    </div>
  )
}

function OptItemCard({ item, index }: { item: OptItem; index: number }) {
  const Icon = item.icon
  const color = `oklch(0.72 0.15 ${item.hue})`
  const isDone = item.status === 'done'
  const isCleaning = item.status === 'cleaning'

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 transition-all duration-500"
      style={{
        background: isDone
          ? 'linear-gradient(145deg, oklch(0.65 0.18 142 / 0.08), oklch(0.14 0 0) 60%)'
          : `linear-gradient(145deg, oklch(0.65 0.18 ${item.hue} / 0.04), oklch(0.14 0 0) 70%)`,
        border: `1px solid ${isDone ? 'oklch(0.65 0.18 142 / 0.3)' : isCleaning ? `oklch(0.65 0.18 ${item.hue} / 0.3)` : 'oklch(0.22 0 0)'}`,
        animationDelay: `${index * 60}ms`,
        boxShadow: isDone ? '0 0 20px oklch(0.65 0.18 142 / 0.05)' : 'none',
      }}>
      {/* Top edge line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: isDone
            ? 'linear-gradient(90deg, transparent, oklch(0.65 0.18 142 / 0.4), transparent)'
            : isCleaning
            ? `linear-gradient(90deg, transparent, oklch(0.65 0.18 ${item.hue} / 0.4), transparent)`
            : 'transparent',
        }} />

      {isCleaning && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
          <div className="scan-line absolute left-0 right-0 h-6" style={{ top: '40%' }} />
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300"
          style={{
            background: isDone ? 'oklch(0.65 0.18 142 / 0.12)' : `oklch(0.65 0.18 ${item.hue} / 0.1)`,
            border: `1px solid ${isDone ? 'oklch(0.65 0.18 142 / 0.25)' : `oklch(0.65 0.18 ${item.hue} / 0.2)`}`,
            boxShadow: isDone ? '0 0 12px oklch(0.65 0.18 142 / 0.15)' : isCleaning ? `0 0 12px oklch(0.65 0.18 ${item.hue} / 0.2)` : 'none',
          }}>
          {isCleaning
            ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
            : isDone
            ? <CheckCircle2 className="w-5 h-5 text-primary" />
            : <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.8} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-sm font-bold text-foreground truncate">{item.label}</p>
            <Badge variant={isDone ? 'success' : isCleaning ? 'info' : 'warning'}>
              {isDone ? 'Gotowe' : isCleaning ? 'Czyszczenie...' : item.size}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{item.detail}</p>

          {isCleaning && (
            <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'oklch(0.18 0 0)' }}>
              <div className="h-full rounded-full relative overflow-hidden"
                style={{ width: '60%', background: `oklch(0.65 0.18 ${item.hue})`, animation: 'data-flow 1.5s ease-in-out infinite' }} />
            </div>
          )}
          {isDone && (
            <div className="flex items-center gap-1 mt-1.5">
              <ArrowUp className="w-2.5 h-2.5 text-primary rotate-180" />
              <span className="text-[10px] font-bold text-primary">Zwolniono {item.savings}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Optimization() {
  const [optimizing, setOptimizing] = useState(false)
  const [items, setItems] = useState<OptItem[]>(INIT_ITEMS)
  const [healthScore, setHealthScore] = useState(74)
  const [completed, setCompleted] = useState(false)
  const [perfData, setPerfData] = useState<{ t: number; v: number }[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({ t: i, v: 60 + Math.random() * 20 }))
  )

  const done = items.filter(i => i.status === 'done').length
  const pct = Math.round((done / items.length) * 100)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPerfData(prev => {
        const last = prev[prev.length - 1]
        const base = optimizing ? 72 : completed ? 88 : 65
        const v = Math.max(30, Math.min(98, (last?.v ?? base) + (Math.random() - 0.5) * 12 + (optimizing ? 1.5 : 0)))
        return [...prev.slice(1), { t: (last?.t ?? 0) + 1, v }]
      })
    }, 600)
    return () => clearInterval(intervalId)
  }, [optimizing, completed])

  const handleOptimize = async () => {
    setOptimizing(true)
    setCompleted(false)
    for (let i = 0; i < items.length; i++) {
      setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'cleaning' } : item))
      await delay(750)
      setItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'done' } : item))
      setHealthScore(s => Math.min(98, s + 4))
    }
    setOptimizing(false)
    setCompleted(true)
  }

  const handleReset = () => {
    setItems(INIT_ITEMS.map(i => ({ ...i, status: 'pending' as const })))
    setHealthScore(74)
    setCompleted(false)
  }

  const currentItem = items.find(i => i.status === 'cleaning')

  return (
    <div className="flex flex-col gap-4 p-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">Optymalizacja</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Popraw wydajność systemu jednym kliknięciem</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{ background: 'oklch(0.65 0.18 142 / 0.08)', border: '1px solid oklch(0.65 0.18 142 / 0.2)' }}>
          <CheckCircle2 className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-bold text-primary tabular-nums">{done}/{items.length}</span>
          <span className="text-[11px] text-muted-foreground">zakończono</span>
        </div>
      </div>

      {/* Hero panel */}
      <div className="relative overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(145deg, oklch(0.65 0.18 142 / 0.08), oklch(0.13 0 0) 55%)',
          border: '1px solid oklch(0.65 0.18 142 / 0.22)',
          boxShadow: '0 8px 40px oklch(0 0 0 / 0.4)',
        }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-12 pointer-events-none"
          style={{ background: 'var(--primary)' }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(0.65 0.18 142 / 0.5), transparent)' }} />

        {/* Current task status bar */}
        {optimizing && currentItem && (
          <div className="relative px-5 pt-4 pb-0">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Optymalizuję...</span>
              <span className="text-[11px] text-muted-foreground">— {currentItem.label}</span>
            </div>
          </div>
        )}

        <div className="relative grid grid-cols-[auto_1fr_auto] gap-5 items-center p-5">
          {/* Gauge */}
          <HealthGauge score={healthScore} animated />

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {METRICS.map(m => (
              <MetricCard key={m.id} {...m} optimized={completed} />
            ))}
          </div>

          {/* Action column */}
          <div className="flex flex-col items-stretch gap-3 min-w-[160px]">
            {!completed ? (
              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="btn-glow relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.65 0.18 142), oklch(0.58 0.16 155))',
                  color: 'oklch(0.08 0 0)',
                  boxShadow: optimizing ? '0 0 8px oklch(0.65 0.18 142 / 0.2)' : '0 0 24px oklch(0.65 0.18 142 / 0.4), 0 4px 12px oklch(0.65 0.18 142 / 0.2)',
                  transform: optimizing ? 'scale(0.98)' : 'scale(1)',
                }}>
                {optimizing
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Optymalizuję...</>
                  : <><Rocket className="w-4 h-4" />Optymalizuj teraz</>}
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="btn-glow relative flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all"
                style={{ background: 'oklch(0.2 0 0)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                <Wind className="w-4 h-4" />
                Sprawdź ponownie
              </button>
            )}

            {/* Progress ring */}
            <div className="relative overflow-hidden rounded-xl p-3"
              style={{ background: 'oklch(0.1 0 0 / 0.8)', border: '1px solid oklch(0.22 0 0)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Postęp</span>
                <span className="text-sm font-extrabold text-primary tabular-nums">{pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.18 0 0)' }}>
                <div className="h-full rounded-full relative overflow-hidden transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, var(--primary), oklch(0.72 0.16 165))',
                    boxShadow: pct > 0 ? '0 0 8px var(--glow-primary)' : 'none',
                  }}>
                  {optimizing && <div className="absolute inset-0 progress-shine" />}
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                <BarChart3 className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{done} z {items.length} zadań</span>
              </div>
            </div>

            {/* Performance sparkline */}
            <div className="relative overflow-hidden rounded-xl p-3"
              style={{ background: 'oklch(0.1 0 0 / 0.8)', border: '1px solid oklch(0.22 0 0)' }}>
              <div className="flex items-center gap-1 mb-1">
                <Activity className="w-2.5 h-2.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Wydajność</span>
              </div>
              <ResponsiveContainer width="100%" height={36}>
                <LineChart data={perfData}>
                  <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {items.map((item, i) => (
          <OptItemCard key={item.id} item={item} index={i} />
        ))}
      </div>

      {/* Completed banner */}
      {completed && (
        <div className="relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl float-up"
          style={{
            background: 'linear-gradient(135deg, oklch(0.65 0.18 142 / 0.1), oklch(0.14 0 0) 60%)',
            border: '1px solid oklch(0.65 0.18 142 / 0.3)',
            boxShadow: '0 0 30px oklch(0.65 0.18 142 / 0.08)',
          }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, oklch(0.65 0.18 142 / 0.5), transparent)' }} />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'oklch(0.65 0.18 142 / 0.15)', border: '1px solid oklch(0.65 0.18 142 / 0.3)', boxShadow: '0 0 16px oklch(0.65 0.18 142 / 0.2)' }}>
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">System zoptymalizowany!</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Zwolniono miejsce i przyspieszono działanie systemu. Kondycja wzrosła do <span className="font-bold text-primary">{healthScore}%</span>.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0"
            style={{ background: 'oklch(0.65 0.18 142 / 0.1)', border: '1px solid oklch(0.65 0.18 142 / 0.2)' }}>
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-extrabold text-primary">+24%</span>
          </div>
        </div>
      )}
    </div>
  )
}
