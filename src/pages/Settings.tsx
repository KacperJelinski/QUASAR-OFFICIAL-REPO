import { Sun, Moon, Bell, Power, Palette } from 'lucide-react'
import { Switch } from '../components/ui/Switch'
import { useApp, ACCENT_COLORS } from '../store/AppContext'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-3">{title}</p>
      {children}
    </div>
  )
}

function SettingRow({ icon: Icon, label, sub, right }: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  sub: string
  right: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      {right}
    </div>
  )
}

export function Settings() {
  const { theme, setTheme, accentHue, setAccentHue, notifications, setNotifications, autoStart, setAutoStart } = useApp()

  return (
    <div className="flex flex-col gap-3 p-5 h-full overflow-y-auto">
      <div className="flex items-end justify-between pb-1">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Ustawienia</h2>
          <p className="text-xs text-muted-foreground">Personalizuj aplikację QUASAR</p>
        </div>
      </div>

      {/* Appearance */}
      <Section title="Wygląd">
        <SettingRow
          icon={theme === 'dark' ? Moon : Sun}
          label="Motyw"
          sub={theme === 'dark' ? 'Ciemny motyw aktywny' : 'Jasny motyw aktywny'}
          right={
            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--secondary)' }}>
              {([{ v: 'dark' as const, l: 'Ciemny', I: Moon }, { v: 'light' as const, l: 'Jasny', I: Sun }]).map(({ v, l, I }) => (
                <button key={v} onClick={() => setTheme(v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer"
                  style={{
                    background: theme === v ? 'var(--card)' : 'transparent',
                    color: theme === v ? 'var(--foreground)' : 'var(--muted-foreground)',
                    boxShadow: theme === v ? '0 1px 4px oklch(0 0 0 / 0.3)' : undefined,
                  }}>
                  <I className="w-3 h-3" />
                  {l}
                </button>
              ))}
            </div>
          }
        />

        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Kolor akcentu</p>
              <p className="text-xs text-muted-foreground">Motyw kolorystyczny interfejsu</p>
            </div>
          </div>
          <div className="flex gap-3 pl-11">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccentHue(color.value)}
                title={color.label}
                className="relative w-9 h-9 rounded-xl transition-all duration-200 cursor-pointer"
                style={{
                  background: `oklch(0.65 0.18 ${color.value})`,
                  transform: accentHue === color.value ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: accentHue === color.value
                    ? `0 0 16px oklch(0.65 0.18 ${color.value} / 0.6), 0 0 0 2px var(--background), 0 0 0 3.5px oklch(0.65 0.18 ${color.value})`
                    : `0 2px 8px oklch(0 0 0 / 0.3)`,
                }}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Powiadomienia">
        <SettingRow
          icon={Bell}
          label="Powiadomienia systemowe"
          sub="Alerty o zagrożeniach i aktualizacjach"
          right={<Switch checked={notifications} onCheckedChange={setNotifications} />}
        />
      </Section>

      {/* System */}
      <Section title="System">
        <SettingRow
          icon={Power}
          label="Uruchamiaj z systemem"
          sub="Automatyczny start ochrony przy logowaniu"
          right={<Switch checked={autoStart} onCheckedChange={setAutoStart} />}
        />
      </Section>

      {/* About */}
      <Section title="O programie">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Aplikacja</span>
            <span className="text-xs font-semibold text-foreground">QUASAR Antivirus Pro</span>
          </div>
          <div className="h-px" style={{ background: 'var(--border)' }} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Wersja</span>
            <span className="text-xs font-semibold text-foreground">5.2.1</span>
          </div>
          <div className="h-px" style={{ background: 'var(--border)' }} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Autorzy</span>
            <span className="text-xs font-semibold text-foreground">Kacper Jeliński</span>
          </div>
          <div className="h-px" style={{ background: 'var(--border)' }} />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Partnerzy</span>
            <span className="text-xs font-semibold text-foreground">Multi-Servis</span>
          </div>
        </div>
      </Section>
    </div>
  )
}
