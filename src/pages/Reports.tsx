import { useEffect, useState } from 'react'
import { ChartBar as BarChart2, Shield, Search, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { getReport } from '../services/mockService'
import type { ReportData } from '../services/mockService'

const TOOLTIP_STYLE = {
  background: 'oklch(0.16 0 0)',
  border: '1px solid oklch(0.25 0 0)',
  borderRadius: '10px',
  color: 'oklch(0.95 0 0)',
  fontSize: '12px',
  padding: '8px 12px',
  boxShadow: '0 8px 24px oklch(0 0 0 / 0.4)',
}

function StatCard({ icon: Icon, label, value, color, glow }: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string
  color: string
  glow?: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border p-4 transition-all duration-200"
      style={{
        background: 'var(--card)',
        borderColor: glow ? 'oklch(0.65 0.18 142 / 0.2)' : 'var(--border)',
        boxShadow: glow
          ? '0 4px 24px oklch(0 0 0 / 0.35), 0 0 20px oklch(0.65 0.18 142 / 0.06)'
          : '0 4px 24px oklch(0 0 0 / 0.3)',
      }}>
      {glow && <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: 'var(--primary)' }} />}
      <div className="relative flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${glow ? 'bg-primary/10' : 'bg-muted'}`}
          style={glow ? { boxShadow: '0 2px 8px oklch(0 0 0 / 0.2)' } : undefined}>
          <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  )
}

export function Reports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [period, setPeriod] = useState<'7' | '30'>('7')

  useEffect(() => { getReport().then(setData) }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <BarChart2 className="w-8 h-8 text-primary animate-pulse" />
    </div>
  )

  const chartData7 = data.labels.map((label, i) => ({
    label,
    zagrożenia: data.threatsBlocked[i],
    skanowania: data.scansPerformed[i],
  }))

  const chartData30 = Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    zagrożenia: [0,0,1,0,2,0,0,0,1,3,0,0,0,0,1,0,0,2,0,0,0,1,0,0,3,0,0,1,0,0][i] ?? 0,
    skanowania: [2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1][i] ?? 1,
  }))

  const chartData = period === '7' ? chartData7 : chartData30

  return (
    <div className="flex flex-col gap-3 p-5 h-full overflow-y-auto">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Raporty</h2>
          <p className="text-xs text-muted-foreground">Statystyki i analiza bezpieczeństwa</p>
        </div>
        <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--secondary)' }}>
          {([{ v: '7', l: '7 dni' }, { v: '30', l: '30 dni' }] as const).map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer"
              style={{
                background: period === v ? 'var(--card)' : 'transparent',
                color: period === v ? 'var(--foreground)' : 'var(--muted-foreground)',
                boxShadow: period === v ? '0 1px 4px oklch(0 0 0 / 0.3)' : undefined,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Shield} label="Łącznie zagrożeń zablokowanych" value={String(data.totalThreats)} color="text-primary" glow />
        <StatCard icon={Search} label="Łącznie skanowań wykonanych" value={String(data.totalScans)} color="text-blue-400" />
        <StatCard icon={TrendingUp} label="Kondycja systemu" value={`${data.systemHealthScore}%`} color="text-primary" glow />
      </div>

      {/* Threats chart */}
      <div className="rounded-xl border p-4 relative overflow-hidden"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 24px oklch(0 0 0 / 0.3)',
        }}>
        <div className="mb-4">
          <p className="text-sm font-bold text-foreground">Zagrożenia zablokowane</p>
          <p className="text-xs text-muted-foreground">Ostatnie {period} dni</p>
        </div>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.65 0.18 142)" stopOpacity={1} />
                  <stop offset="100%" stopColor="oklch(0.65 0.18 142)" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'oklch(0.48 0 0)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'oklch(0.48 0 0)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'oklch(0.65 0.18 142 / 0.05)' }} />
              <Bar dataKey="zagrożenia" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scans chart */}
      <div className="rounded-xl border p-4"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          boxShadow: '0 4px 24px oklch(0 0 0 / 0.3)',
        }}>
        <div className="mb-4">
          <p className="text-sm font-bold text-foreground">Wykonane skanowania</p>
          <p className="text-xs text-muted-foreground">Ostatnie {period} dni</p>
        </div>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.6 0.2 220)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="oklch(0.6 0.2 220)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0 0)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'oklch(0.48 0 0)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'oklch(0.48 0 0)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="skanowania" stroke="oklch(0.6 0.2 220)" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
