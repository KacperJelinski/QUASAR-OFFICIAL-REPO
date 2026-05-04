import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, Search, Shield, Calendar, Zap, Timer, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Switch } from '../components/ui/Switch'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { getSchedules } from '../services/mockService'
import type { ScheduledScan } from '../services/mockService'

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
const DAYS_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']

const FREQ_LABELS: Record<string, string> = { daily: 'Codziennie', weekly: 'Co tydzień', monthly: 'Co miesiąc' }
const TYPE_LABELS: Record<string, string> = { quick: 'Szybkie', full: 'Pełne', custom: 'Niestandardowe' }
const TYPE_HUE: Record<string, string> = { quick: '142', full: '220', custom: '30' }

export function Scheduler() {
  const [schedules, setSchedules] = useState<ScheduledScan[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'quick' | 'full' | 'custom'>('quick')
  const [newFreq, setNewFreq] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [newTime, setNewTime] = useState('08:00')
  const [newDay, setNewDay] = useState('Poniedziałek')

  useEffect(() => { getSchedules().then(setSchedules) }, [])

  const toggleSchedule = (id: string) => setSchedules(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  const deleteSchedule = (id: string) => setSchedules(prev => prev.filter(s => s.id !== id))
  const addSchedule = () => {
    if (!newName.trim()) return
    setSchedules(prev => [...prev, {
      id: Date.now().toString(),
      name: newName, type: newType, frequency: newFreq,
      time: newTime, day: newFreq === 'weekly' ? newDay : undefined,
      enabled: true, nextRun: `Następny run: ${newTime}`,
    }])
    setNewName('')
    setShowNew(false)
  }

  const activeCount = schedules.filter(s => s.enabled).length
  // Compute dots per day of week
  const dayDots = DAYS.map((d, idx) =>
    schedules.filter(s =>
      s.enabled && (s.frequency === 'daily' || (s.frequency === 'weekly' && s.day === d) || (s.frequency === 'monthly' && idx === 0))
    )
  )

  return (
    <div className="flex flex-col gap-3 p-5 h-full overflow-y-auto">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Harmonogram</h2>
          <p className="text-xs text-muted-foreground">Zaplanowane skanowania automatyczne</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-medium text-primary tabular-nums">{activeCount} aktywnych</span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowNew(!showNew)}>
            <Plus className="w-3.5 h-3.5" />Dodaj
          </Button>
        </div>
      </div>

      {/* Week calendar */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ten tydzień</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_SHORT.map((d, i) => {
            const dots = dayDots[i]
            const isToday = i === ((new Date().getDay() + 6) % 7)
            return (
              <div key={d}
                className="relative rounded-lg border p-2 min-h-[72px] flex flex-col gap-1 transition-all"
                style={{
                  borderColor: isToday ? 'oklch(0.65 0.18 142 / 0.4)' : 'var(--border)',
                  background: isToday ? 'oklch(0.65 0.18 142 / 0.05)' : 'oklch(0.155 0 0)',
                }}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>{d}</span>
                  {isToday && <span className="w-1 h-1 rounded-full glow-pulse" style={{ background: 'var(--primary)' }} />}
                </div>
                <div className="flex flex-col gap-0.5">
                  {dots.slice(0, 3).map(s => (
                    <div key={s.id} className="flex items-center gap-1 truncate">
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: `oklch(0.72 0.15 ${TYPE_HUE[s.type]})` }} />
                      <span className="text-[9px] text-foreground/80 tabular-nums truncate">{s.time}</span>
                    </div>
                  ))}
                  {dots.length > 3 && <span className="text-[9px] text-muted-foreground">+{dots.length - 3}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* New schedule form */}
      {showNew && (
        <div className="rounded-xl border border-primary/30 bg-card/70 backdrop-blur-sm p-4 slide-in">
          <p className="text-sm font-semibold text-foreground mb-3">Nowy harmonogram skanowania</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Nazwa</label>
              <Input placeholder="Np. Codzienne szybkie skanowanie" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Typ</label>
              <div className="flex gap-1">
                {(['quick', 'full', 'custom'] as const).map(t => (
                  <button key={t} onClick={() => setNewType(t)}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${newType === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Częstotliwość</label>
              <div className="flex gap-1">
                {(['daily', 'weekly', 'monthly'] as const).map(f => (
                  <button key={f} onClick={() => setNewFreq(f)}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${newFreq === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                    {FREQ_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Godzina</label>
              <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
            </div>
            {newFreq === 'weekly' && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">Dzień</label>
                <select value={newDay} onChange={e => setNewDay(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-input/30 px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={addSchedule}>Zapisz</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowNew(false)}>Anuluj</Button>
          </div>
        </div>
      )}

      {/* Schedules list */}
      <div className="space-y-1.5">
        {schedules.map((s, i) => {
          const Icon = s.type === 'quick' ? Search : Shield
          const hue = TYPE_HUE[s.type]
          return (
            <div key={s.id}
              className={`group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-3 transition-all slide-in ${!s.enabled ? 'opacity-55' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative"
                  style={{ background: s.enabled ? `oklch(0.72 0.15 ${hue} / 0.12)` : 'var(--muted)' }}>
                  <Icon className="w-4 h-4" style={{ color: s.enabled ? `oklch(0.72 0.15 ${hue})` : 'var(--muted-foreground)' }} strokeWidth={1.8} />
                  {s.enabled && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full glow-pulse" style={{ background: `oklch(0.72 0.15 ${hue})` }} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <Badge variant="outline">{TYPE_LABELS[s.type]}</Badge>
                    <Badge variant="outline">{FREQ_LABELS[s.frequency]}</Badge>
                    {s.day && <Badge variant="outline">{s.day}</Badge>}
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="w-3 h-3" />{s.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                      <Timer className="w-3 h-3" />Następny
                    </div>
                    <p className="text-[11px] font-semibold text-foreground tabular-nums">{s.nextRun.replace('Następny run: ', '')}</p>
                  </div>
                  <Switch checked={s.enabled} onCheckedChange={() => toggleSchedule(s.id)} />
                  <button onClick={() => deleteSchedule(s.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {s.enabled && (
                <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.2 0 0)' }}>
                  <div className="h-full w-1/3 rounded-full"
                    style={{ background: `linear-gradient(90deg, transparent, oklch(0.72 0.15 ${hue}), transparent)`, animation: 'progress-shine 2.4s ease-in-out infinite' }} />
                </div>
              )}
            </div>
          )
        })}

        {schedules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/60 bg-card/30">
            <Clock className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Brak zaplanowanych skanowań</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowNew(true)}>
              <Plus className="w-3.5 h-3.5" />Dodaj pierwszy harmonogram
            </Button>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-lg p-2.5 border border-border/50 bg-muted/20 flex items-center gap-2">
        <ChevronRight className="w-3 h-3 text-primary" />
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Wskazówka: </span>
          Planuj pełne skanowania na noc, a szybkie na poranek — nie obciążą systemu w godzinach pracy.
        </p>
      </div>
    </div>
  )
}
