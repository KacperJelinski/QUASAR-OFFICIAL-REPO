import { useEffect, useRef, useState } from 'react'
import { Shield, Folder, Square, CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, FileText, Clock, Activity, Cpu, HardDrive, Gauge, Zap, FolderOpen, ArrowRight, X, Play, ChevronRight, ChartBar as BarChart3, ScanLine, Crosshair } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis } from 'recharts'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useApp } from '../store/AppContext'

const SCAN_TYPES = [
  {
    type: 'quick' as const,
    icon: Zap,
    title: 'Szybkie',
    subtitle: 'Quick Scan',
    desc: 'Kluczowe obszary systemowe i aktywne procesy',
    duration: '~2–3 min',
    hue: '142',
    files: '~25k',
    threat: 'Niskie ryzyko',
    segments: 25,
  },
  {
    type: 'full' as const,
    icon: Shield,
    title: 'Pełne',
    subtitle: 'Full Scan',
    desc: 'Całkowita analiza dysku i zasobów systemowych',
    duration: '~15–20 min',
    hue: '220',
    files: '~280k',
    threat: 'Głęboka analiza',
    segments: 30,
  },
  {
    type: 'custom' as const,
    icon: Crosshair,
    title: 'Cel',
    subtitle: 'Custom Scan',
    desc: 'Precyzyjne skanowanie wybranych lokalizacji',
    duration: 'Zmienny',
    hue: '60',
    files: 'Wybrane',
    threat: 'Precyzyjne',
    segments: 20,
  },
]

function HexagonIcon({ hue, icon: Icon, active }: { hue: string; icon: any; active?: boolean }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 52, height: 52 }}>
      <svg viewBox="0 0 52 52" className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(30deg)' }}>
        <polygon
          points="26,2 48,14 48,38 26,50 4,38 4,14"
          fill={`oklch(0.65 0.18 ${hue} / ${active ? '0.18' : '0.1'})`}
          stroke={`oklch(0.65 0.18 ${hue} / ${active ? '0.5' : '0.25'})`}
          strokeWidth="1"
        />
      </svg>
      <Icon className="w-5 h-5 relative z-10" style={{ color: `oklch(0.72 0.16 ${hue})` }} strokeWidth={1.8} />
    </div>
  )
}

function ScanTypeCard({ icon: Icon, title, subtitle, desc, duration, hue, files, segments, onClick }: Omit<typeof SCAN_TYPES[0], 'type' | 'threat'> & { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const color = `oklch(0.72 0.16 ${hue})`
  const colorSoft = `oklch(0.65 0.18 ${hue} / 0.12)`
  const colorBorder = `oklch(0.65 0.18 ${hue} / ${hovered ? '0.45' : '0.2'})`

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative overflow-hidden rounded-2xl text-left transition-all duration-300 cursor-pointer"
      style={{
        background: hovered
          ? `linear-gradient(145deg, oklch(0.65 0.18 ${hue} / 0.1), oklch(0.16 0 0) 55%)`
          : `linear-gradient(145deg, oklch(0.65 0.18 ${hue} / 0.04), oklch(0.14 0 0) 65%)`,
        border: `1px solid ${colorBorder}`,
        boxShadow: hovered
          ? `0 12px 40px oklch(0 0 0 / 0.5), 0 0 24px oklch(0.65 0.18 ${hue} / 0.12), inset 0 1px 0 oklch(1 0 0 / 0.05)`
          : '0 4px 16px oklch(0 0 0 / 0.3)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}>
      {/* Ambient corner glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl transition-opacity duration-300 pointer-events-none"
        style={{ background: `oklch(0.65 0.18 ${hue})`, opacity: hovered ? 0.18 : 0.06 }} />

      {/* Segment dots along top edge */}
      <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden rounded-t-2xl">
        <div className="h-full transition-all duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, oklch(0.65 0.18 ${hue} / 0.8), transparent)`,
            opacity: hovered ? 1 : 0.4,
          }} />
      </div>

      <div className="relative p-5 flex flex-col gap-4">
        {/* Top row: hex icon + title + arrow */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <HexagonIcon hue={hue} icon={Icon} active={hovered} />
            <div>
              <p className="text-base font-bold text-foreground leading-none">{title}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mt-0.5" style={{ color }}>{subtitle}</p>
            </div>
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: colorSoft,
              border: `1px solid ${colorBorder}`,
              transform: hovered ? 'scale(1.15) rotate(45deg)' : 'scale(1) rotate(0deg)',
            }}>
            <ChevronRight className="w-3.5 h-3.5" style={{ color }} />
          </div>
        </div>

        {/* Desc */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>

        {/* Stats row */}
        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: `oklch(0.65 0.18 ${hue} / 0.15)` }}>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `oklch(0.65 0.18 ${hue} / 0.14)`, color }}>
              {files} plików
            </span>
          </div>
        </div>

        {/* Mini segment bar */}
        <div className="flex items-center gap-0.5 h-1">
          {Array.from({ length: segments }, (_, i) => (
            <div key={i} className="flex-1 h-full rounded-full transition-all duration-500"
              style={{
                background: `oklch(0.65 0.18 ${hue} / ${hovered ? (i < segments * 0.7 ? '0.7' : i < segments * 0.9 ? '0.4' : '0.15') : '0.2'})`,
                transitionDelay: `${i * 12}ms`,
              }} />
          ))}
        </div>
      </div>
    </button>
  )
}

function CircularProgress({ value, active }: { value: number; active: boolean }) {
  const r = 56
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      {active && (
        <div className="absolute inset-4 rounded-full blur-2xl opacity-25"
          style={{ background: 'var(--primary)', animation: 'soft-breathe 2s ease-in-out infinite' }} />
      )}
      <svg viewBox="0 0 128 128" width="160" height="160" className="absolute inset-0 -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="oklch(0.18 0 0)" strokeWidth="5" />
        {Array.from({ length: 36 }, (_, i) => {
          const angle = (i / 36) * 2 * Math.PI - Math.PI / 2
          const x1 = 64 + (r - 10) * Math.cos(angle)
          const y1 = 64 + (r - 10) * Math.sin(angle)
          const x2 = 64 + (r - 7) * Math.cos(angle)
          const y2 = 64 + (r - 7) * Math.sin(angle)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="oklch(0.22 0 0)" strokeWidth="1.5" />
        })}
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke="url(#cgGrad2)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.4s cubic-bezier(0.4,0,0.2,1)',
            filter: active ? 'drop-shadow(0 0 8px var(--glow-primary))' : 'none',
          }}
        />
        <defs>
          <linearGradient id="cgGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="oklch(0.72 0.16 165)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative flex flex-col items-center z-10">
        <span className="text-3xl font-extrabold text-foreground tabular-nums leading-none">{Math.round(value)}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5 font-semibold tracking-wider">%</span>
      </div>
    </div>
  )
}

function CustomScanDialog({ onStart, onClose }: { onStart: (path: string) => void; onClose: () => void }) {
  const [path, setPath] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const PRESETS = [
    { label: 'Pulpit', value: 'C:\\Users\\Użytkownik\\Desktop', icon: '🖥' },
    { label: 'Dokumenty', value: 'C:\\Users\\Użytkownik\\Documents', icon: '📄' },
    { label: 'Pobrane', value: 'C:\\Users\\Użytkownik\\Downloads', icon: '⬇' },
    { label: 'Dysk C:\\', value: 'C:\\', icon: '💾' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'oklch(0 0 0 / 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="relative w-[500px] rounded-2xl overflow-hidden float-up"
        style={{
          background: 'oklch(0.13 0 0)',
          border: '1px solid oklch(0.65 0.18 60 / 0.3)',
          boxShadow: '0 32px 80px oklch(0 0 0 / 0.7), 0 0 60px oklch(0.65 0.18 60 / 0.06)',
        }}>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: 'oklch(0.72 0.15 60)' }} />
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(0.65 0.18 60 / 0.5), transparent)' }} />

        <div className="relative flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid oklch(0.65 0.18 60 / 0.15)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'oklch(0.65 0.18 60 / 0.15)', border: '1px solid oklch(0.65 0.18 60 / 0.3)' }}>
              <FolderOpen className="w-4 h-4" style={{ color: 'oklch(0.72 0.15 60)' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Skanowanie niestandardowe</p>
              <p className="text-[11px] text-muted-foreground">Wybierz lokalizację do przeskanowania</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/60 transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="relative p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Ścieżka skanowania</label>
            <div className="relative">
              <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                value={path}
                onChange={e => setPath(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && path.trim()) onStart(path.trim()) }}
                className="flex h-10 w-full rounded-xl border border-border/60 bg-muted/30 pl-9 pr-3 py-1 text-xs text-foreground font-mono placeholder:text-muted-foreground/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                placeholder="np. C:\Users\Użytkownik\Documents"
                style={{ background: 'oklch(0.155 0 0)' }}
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Szybki wybór</p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map(p => (
                <button key={p.value} onClick={() => setPath(p.value)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer"
                  style={{
                    background: path === p.value ? 'oklch(0.65 0.18 60 / 0.12)' : 'oklch(0.155 0 0)',
                    border: `1px solid ${path === p.value ? 'oklch(0.65 0.18 60 / 0.35)' : 'oklch(0.22 0 0)'}`,
                  }}>
                  <span className="text-sm">{p.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{p.label}</p>
                    <p className="text-[9px] text-muted-foreground font-mono truncate" style={{ maxWidth: 140 }}>{p.value}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Anuluj</Button>
            <button
              disabled={!path.trim()}
              onClick={() => path.trim() && onStart(path.trim())}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed btn-glow"
              style={{
                background: 'oklch(0.65 0.18 60)',
                color: 'oklch(0.1 0 0)',
                boxShadow: '0 0 16px oklch(0.65 0.18 60 / 0.3)',
              }}>
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              Rozpocznij skan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Scan() {
  const { scanActive, scanProgress, scanType, scanFilesCount, scanThreatsFound, scanLogs, startScan, stopScan } = useApp()
  const [activity, setActivity] = useState<{ t: number; cpu: number; io: number }[]>(() =>
    Array.from({ length: 24 }, (_, i) => ({ t: i, cpu: 18 + Math.random() * 8, io: 12 + Math.random() * 6 }))
  )
  const [showCustomDialog, setShowCustomDialog] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setActivity(prev => {
        const last = prev[prev.length - 1]
        const base = scanActive ? 62 : 22
        const ioBase = scanActive ? 48 : 14
        const cpu = Math.max(5, Math.min(95, (last?.cpu ?? base) + (Math.random() - 0.5) * 18 + (scanActive ? 2 : -1)))
        const io = Math.max(3, Math.min(88, (last?.io ?? ioBase) + (Math.random() - 0.5) * 14 + (scanActive ? 1 : -0.5)))
        return [...prev.slice(1), { t: (last?.t ?? 0) + 1, cpu, io }]
      })
    }, 700)
    return () => clearInterval(id)
  }, [scanActive])

  // Particle scan effect on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !scanActive) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles: { x: number; y: number; vx: number; vy: number; life: number; hue: number }[] = []
    let frame = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (Math.random() < 0.3) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          life: 1,
          hue: 142 + Math.random() * 30 - 15,
        })
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy; p.life -= 0.018
        if (p.life <= 0) { particles.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.5 * p.life, 0, Math.PI * 2)
        ctx.fillStyle = `oklch(0.65 0.18 ${p.hue} / ${p.life * 0.6})`
        ctx.fill()
      }
      frame = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(frame)
  }, [scanActive])

  const elapsed = scanActive
    ? Math.floor((scanProgress / 100) * (scanType === 'full' ? 25 : 12))
    : 0

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const isComplete = !scanActive && scanProgress === 100 && scanType !== null
  const currentScanMeta = SCAN_TYPES.find(s => s.type === scanType)

  return (
    <div className="flex flex-col gap-4 p-5 h-full overflow-y-auto">
      {showCustomDialog && (
        <CustomScanDialog
          onStart={(_path) => { setShowCustomDialog(false); startScan('custom') }}
          onClose={() => setShowCustomDialog(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground tracking-tight">Skanowanie</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Wykryj i wyeliminuj zagrożenia w systemie</p>
        </div>
        {!scanActive && !isComplete && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'oklch(0.65 0.18 142 / 0.08)', border: '1px solid oklch(0.65 0.18 142 / 0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
            <span className="text-[11px] font-medium text-muted-foreground">Gotowy do skanowania</span>
          </div>
        )}
      </div>

      {/* Scan type selection */}
      {!scanActive && !isComplete && (
        <div className="grid grid-cols-3 gap-3">
          {SCAN_TYPES.map((item) => (
            <ScanTypeCard
              key={item.type}
              {...item}
              onClick={() => item.type === 'custom' ? setShowCustomDialog(true) : startScan(item.type)}
            />
          ))}
        </div>
      )}

      {/* Active / complete scan panel */}
      {(scanActive || isComplete) && (
        <div className="relative overflow-hidden rounded-3xl"
          style={{
            background: isComplete && scanThreatsFound > 0
              ? 'linear-gradient(145deg, oklch(0.577 0.245 27.325 / 0.07), oklch(0.13 0 0) 50%)'
              : 'linear-gradient(145deg, oklch(0.65 0.18 142 / 0.08), oklch(0.13 0 0) 50%)',
            border: `1px solid ${isComplete && scanThreatsFound > 0 ? 'oklch(0.577 0.245 27.325 / 0.3)' : 'oklch(0.65 0.18 142 / 0.25)'}`,
            boxShadow: '0 8px 48px oklch(0 0 0 / 0.45)',
          }}>
          {/* Particle canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* Ambient corner */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: isComplete && scanThreatsFound > 0 ? 'var(--destructive)' : 'var(--primary)' }} />
          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${isComplete && scanThreatsFound > 0 ? 'oklch(0.577 0.245 27.325 / 0.5)' : 'oklch(0.65 0.18 142 / 0.5)'}, transparent)` }} />

          <div className="relative p-5">
            {/* Scan header row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {currentScanMeta && (
                  <HexagonIcon hue={currentScanMeta.hue} icon={currentScanMeta.icon} active />
                )}
                <div>
                  <p className="text-base font-bold text-foreground">
                    {isComplete ? 'Skanowanie zakończone' :
                      scanType === 'quick' ? 'Szybkie skanowanie' :
                      scanType === 'full' ? 'Pełne skanowanie' : 'Skanowanie niestandardowe'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isComplete ? `Przeskanowano ${scanFilesCount.toLocaleString('pl')} plików` : 'Analiza systemu w toku...'}
                  </p>
                </div>
                {scanActive && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full ml-2"
                    style={{ background: 'oklch(0.65 0.18 142 / 0.1)', border: '1px solid oklch(0.65 0.18 142 / 0.2)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary glow-pulse" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Live</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {scanActive && (
                  <Button variant="outline" size="sm" onClick={stopScan}>
                    <Square className="w-3 h-3" />
                    Zatrzymaj
                  </Button>
                )}
                {isComplete && (
                  <Button variant="secondary" size="sm" onClick={stopScan}>Nowe skanowanie</Button>
                )}
              </div>
            </div>

            {/* Main content: circular progress + stats */}
            <div className="flex gap-5 items-center mb-5">
              <CircularProgress value={scanProgress} active={scanActive} />

              <div className="flex-1 grid grid-cols-3 gap-3">
                {[
                  { label: 'Pliki', value: scanFilesCount.toLocaleString('pl'), sub: 'przeskanowane', hue: '142' },
                  { label: 'Zagrożenia', value: String(scanThreatsFound), sub: 'wykryte', hue: scanThreatsFound > 0 ? '27' : '142' },
                  { label: 'Czas', value: formatTime(elapsed), sub: 'trwania', hue: '220' },
                ].map(s => (
                  <div key={s.label} className="relative overflow-hidden rounded-2xl p-3.5"
                    style={{
                      background: 'oklch(0.1 0 0 / 0.8)',
                      border: `1px solid oklch(0.65 0.18 ${s.hue} / 0.15)`,
                    }}>
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl pointer-events-none"
                      style={{ background: `oklch(0.65 0.18 ${s.hue} / 0.12)` }} />
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: `oklch(0.72 0.15 ${s.hue})` }}>{s.label}</p>
                    <p className="text-2xl font-extrabold tabular-nums text-foreground leading-none">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4 h-2 rounded-full overflow-hidden" style={{ background: 'oklch(0.17 0 0)' }}>
              <div
                className="h-full rounded-full relative overflow-hidden transition-all duration-300"
                style={{
                  width: `${scanProgress}%`,
                  background: 'linear-gradient(90deg, var(--primary), oklch(0.72 0.16 165))',
                  boxShadow: '0 0 10px var(--glow-primary)',
                }}>
                {scanActive && <div className="absolute inset-0 progress-shine" />}
              </div>
            </div>

            {/* Activity + metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 rounded-xl p-3" style={{ background: 'oklch(0.1 0 0 / 0.7)', border: '1px solid oklch(0.22 0 0)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aktywność silnika</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />CPU</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'oklch(0.7 0.14 220)' }} />I/O</span>
                  </div>
                </div>
                <div style={{ height: 72 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activity}>
                      <defs>
                        <linearGradient id="cpuG2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ioG2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.7 0.14 220)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="oklch(0.7 0.14 220)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="t" hide />
                      <Area type="monotone" dataKey="io" stroke="oklch(0.7 0.14 220)" strokeWidth={1.5} fill="url(#ioG2)" isAnimationActive={false} />
                      <Area type="monotone" dataKey="cpu" stroke="var(--primary)" strokeWidth={2} fill="url(#cpuG2)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl p-3 flex flex-col gap-2.5" style={{ background: 'oklch(0.1 0 0 / 0.7)', border: '1px solid oklch(0.22 0 0)' }}>
                {[
                  { icon: Cpu, label: 'CPU', value: Math.round(activity[activity.length - 1]?.cpu ?? 0), hue: '142' },
                  { icon: HardDrive, label: 'Dysk', value: Math.round(activity[activity.length - 1]?.io ?? 0), hue: '220' },
                  { icon: Gauge, label: 'Prędkość', value: scanActive ? Math.round(1400 + scanProgress * 12) : 0, hue: '60', suffix: ' /s' },
                ].map(m => {
                  const MIcon = m.icon
                  const barVal = m.suffix ? Math.min(100, m.value / 50) : m.value
                  return (
                    <div key={m.label} className="flex items-center gap-2">
                      <MIcon className="w-3 h-3 shrink-0" style={{ color: `oklch(0.72 0.15 ${m.hue})` }} />
                      <span className="text-[10px] text-muted-foreground w-10 shrink-0">{m.label}</span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'oklch(0.2 0 0)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${barVal}%`, background: `oklch(0.72 0.15 ${m.hue})`, boxShadow: `0 0 4px oklch(0.72 0.15 ${m.hue} / 0.5)` }} />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-foreground w-12 text-right">{m.value}{m.suffix ?? '%'}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Scan log */}
            {scanActive && scanLogs.length > 0 && (
              <div className="mt-3 rounded-xl p-3 relative overflow-hidden"
                style={{ background: 'oklch(0.09 0 0)', border: '1px solid oklch(0.18 0 0)' }}>
                <div className="absolute left-0 right-0 h-8 scan-line pointer-events-none" />
                <p className="text-[10px] font-mono font-bold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  Dziennik skanowania
                </p>
                <div className="space-y-0.5">
                  {scanLogs.slice(0, 5).map((log, i) => (
                    <p key={i} className={`text-[11px] font-mono truncate flex items-center gap-2 ${i === 0 ? 'text-primary' : 'text-muted-foreground/50'}`}>
                      <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                      <span className="text-muted-foreground/40">{log.split(' ')[0]}</span>
                      {log.split(' ').slice(1).join(' ')}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Result */}
            {isComplete && (
              <div className="mt-3 flex items-center gap-3 p-4 rounded-2xl float-up"
                style={{
                  background: scanThreatsFound > 0 ? 'oklch(0.577 0.245 27.325 / 0.08)' : 'oklch(0.65 0.18 142 / 0.08)',
                  border: `1px solid ${scanThreatsFound > 0 ? 'oklch(0.577 0.245 27.325 / 0.3)' : 'oklch(0.65 0.18 142 / 0.3)'}`,
                }}>
                {scanThreatsFound > 0
                  ? <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                  : <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {scanThreatsFound > 0 ? `Wykryto ${scanThreatsFound} zagrożenie(ń)` : 'Brak zagrożeń!'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {scanThreatsFound > 0
                      ? 'Przejdź do Kwarantanny aby zarządzać wykrytymi plikami.'
                      : `Przeskanowano ${scanFilesCount.toLocaleString('pl')} plików. System jest bezpieczny.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan history */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3">Historia skanowań</p>
          <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
        </div>
        <div className="space-y-1.5">
          {[
            { date: '02.05.2026 08:00', type: 'Pełne', files: '284 532', threats: 0 },
            { date: '01.05.2026 14:30', type: 'Szybkie', files: '24 830', threats: 0 },
            { date: '28.04.2026 09:00', type: 'Pełne', files: '281 100', threats: 1 },
          ].map((scan, i) => (
            <div key={i}
              className="relative overflow-hidden flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 hover:border-primary/25 group cursor-pointer"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.165 0 0)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ background: 'linear-gradient(90deg, oklch(0.65 0.18 142 / 0.03), transparent)' }} />
              <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: scan.threats > 0 ? 'var(--destructive)' : 'var(--primary)' }} />
              <div className="relative flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${scan.threats > 0 ? '' : 'bg-primary/10'}`}
                  style={scan.threats > 0 ? { background: 'oklch(0.65 0.18 60 / 0.1)' } : {}}>
                  <FileText className={`w-4 h-4 ${scan.threats > 0 ? '' : 'text-primary'}`}
                    style={scan.threats > 0 ? { color: 'oklch(0.7 0.15 60)' } : {}} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{scan.type} skanowanie</p>
                  <p className="text-[11px] text-muted-foreground">{scan.date}</p>
                </div>
              </div>
              <div className="relative flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Pliki</p>
                  <p className="text-sm font-bold text-foreground tabular-nums">{scan.files}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Zagrożenia</p>
                  <p className={`text-sm font-bold tabular-nums ${scan.threats > 0 ? 'text-destructive' : 'text-primary'}`}>{scan.threats}</p>
                </div>
                <Badge variant={scan.threats > 0 ? 'warning' : 'success'}>
                  {scan.threats > 0 ? 'Ostrzeżenie' : 'Czyste'}
                </Badge>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
