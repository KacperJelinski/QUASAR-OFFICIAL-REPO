import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { User, Mail, Key, Phone, CreditCard, Crown, CircleCheck as CheckCircle2, Camera, Star, Coins, Gift, Lock, Shield, Zap, Flame, HeartHandshake, ShieldCheck, Swords, Package, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { useApp } from '../store/AppContext'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Shield, ShieldCheck, Swords, Crown, Star, Gift, Lock, Zap, Flame,
}

function BadgeIcon({ icon, hue, size = 'sm' }: { icon: string; hue: string; size?: 'sm' | 'md' }) {
  const Icon = ICON_MAP[icon] ?? Shield
  const s = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  const ic = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
  return (
    <div className={`${s} rounded-md flex items-center justify-center`}
      style={{ background: `oklch(0.72 0.15 ${hue} / 0.18)`, border: `1px solid oklch(0.72 0.15 ${hue} / 0.35)` }}>
      <Icon className={ic} style={{ color: `oklch(0.72 0.15 ${hue})` }} strokeWidth={2} />
    </div>
  )
}

export function Account() {
  const {
    points, daysTogether,
    badgeCatalog, inventory, equippedBadges,
    activateLicenseCode, removeLicense, purchaseBadge, toggleBadgeEquip,
    licenseDaysLeft, licenseLocked, licensePlan,
    appUser, refreshUserData,
  } = useApp()

  // Re-fetch from DB every time this page mounts (picks up admin changes immediately)
  useEffect(() => { refreshUserData() }, [])

  const [username, setUsername] = useState(() => appUser?.full_name || 'Jan Kowalski')
  const [email, setEmail] = useState(() => appUser?.email || 'jan.kowalski@example.com')
  const [phone, setPhone] = useState(() => appUser?.phone || '')
  const [newPassword, setNewPassword] = useState('')
  const [activationCode, setActivationCode] = useState('')
  const [activating, setActivating] = useState(false)
  const [activationMsg, setActivationMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [shopMsg, setShopMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null)
  const [view, setView] = useState<'shop' | 'inventory'>('shop')
  const [shopTab, setShopTab] = useState(1)

  const handleSave = async () => {
    if (!appUser?.id) return
    setSaveError(null)
    const parts = username.trim().split(' ')
    const updates: Record<string, string> = {
      full_name: username.trim(),
      first_name: parts[0] ?? '',
      last_name: parts.slice(1).join(' '),
      email: email.trim(),
      phone: phone.trim(),
    }
    if (newPassword.trim()) updates.password_hash = newPassword.trim()

    const { error } = await supabase
      .from('xq_users')
      .update(updates)
      .eq('id', appUser.id)

    if (error) {
      setSaveError('Błąd zapisu. Spróbuj ponownie.')
    } else {
      setSaved(true)
      setNewPassword('')
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const handleActivate = async () => {
    setActivating(true)
    setActivationMsg(null)
    const result = await activateLicenseCode(activationCode)
    setActivationMsg({ ok: result.ok, text: result.message })
    if (result.ok) setActivationCode('')
    setActivating(false)
  }

  const handleBuy = async (id: string) => {
    const result = await purchaseBadge(id)
    setShopMsg({ id, ok: result.ok, text: result.message })
    setTimeout(() => setShopMsg(null), 2500)
  }

  const nextMilestone = daysTogether < 30 ? 30 : daysTogether < 90 ? 90 : daysTogether < 180 ? 180 : daysTogether < 365 ? 365 : 730
  const prevMilestone = daysTogether < 30 ? 0 : daysTogether < 90 ? 30 : daysTogether < 180 ? 90 : daysTogether < 365 ? 180 : 365
  const milestonePct = Math.min(100, Math.round(((daysTogether - prevMilestone) / (nextMilestone - prevMilestone)) * 100))
  const level = Math.floor(daysTogether / 30) + 1

  const tabs = [...new Set(badgeCatalog.map(b => b.category_tab))].sort()
  const shopBadges = badgeCatalog.filter(b => b.active && b.category_tab === shopTab)
  const inventoryBadges = badgeCatalog.filter(b => inventory.includes(b.id))

  const equippedBadgeItems = badgeCatalog.filter(b => equippedBadges.includes(b.id))

  return (
    <div className="flex flex-col gap-3 p-5 h-full overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Moje konto</h2>
        <p className="text-xs text-muted-foreground">Zarządzaj profilem, subskrypcją i odznakam</p>
      </div>

      {/* Top row: profile + loyalty + points */}
      <div className="grid grid-cols-3 gap-3">
        {/* Profile card */}
        <div className="relative overflow-hidden rounded-xl border p-4"
          style={{ background: 'var(--card)', borderColor: 'oklch(0.65 0.18 142 / 0.25)', boxShadow: '0 4px 24px oklch(0 0 0 / 0.35)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: 'var(--primary)' }} />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, oklch(0.65 0.18 142 / 0.2), oklch(0.65 0.18 142 / 0.08))', border: '1px solid oklch(0.65 0.18 142 / 0.25)' }}>
                <User className="w-7 h-7 text-primary" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center shadow-lg" style={{ background: 'var(--primary)' }}>
                <Camera className="w-3 h-3" style={{ color: 'var(--primary-foreground)' }} />
              </button>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{username}</p>
              <p className="text-[11px] text-muted-foreground truncate">{email}</p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <Badge variant={licenseLocked ? 'outline' : 'default'}>{licenseLocked ? 'Nieaktywna' : licensePlan}</Badge>
                <Badge variant="outline">Lvl {level}</Badge>
              </div>
              {equippedBadgeItems.length > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  {equippedBadgeItems.map(b => (
                    <BadgeIcon key={b.id} icon={b.icon} hue={b.color_hue} size="sm" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Days together */}
        <div className="relative overflow-hidden rounded-xl border p-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 4px 24px oklch(0 0 0 / 0.3)' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'oklch(0.7 0.15 330 / 0.12)' }}>
              <HeartHandshake className="w-5 h-5" style={{ color: 'oklch(0.7 0.15 330)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Razem z QUASAR</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{daysTogether} <span className="text-xs font-normal text-muted-foreground">dni</span></p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'oklch(0.2 0 0)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${milestonePct}%`, background: 'oklch(0.7 0.15 330)', boxShadow: '0 0 6px oklch(0.7 0.15 330)' }} />
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">{nextMilestone}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Points */}
        <div className="relative overflow-hidden rounded-xl border p-4"
          style={{ background: 'var(--card)', borderColor: 'oklch(0.65 0.18 142 / 0.25)', boxShadow: '0 4px 24px oklch(0 0 0 / 0.35)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: 'oklch(0.82 0.17 85)' }} />
          <div className="relative flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'oklch(0.8 0.17 85 / 0.15)', boxShadow: '0 0 12px oklch(0.8 0.17 85 / 0.3)' }}>
              <Coins className="w-5 h-5" style={{ color: 'oklch(0.82 0.17 85)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Punkty lojalnościowe</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'oklch(0.82 0.17 85)' }}>{points}</p>
              <p className="text-[10px] text-muted-foreground">+{Math.floor(daysTogether / 7)} pkt ten tydzień</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shop / Inventory toggle */}
      <div className="relative rounded-xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {/* Tab switcher header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60"
          style={{ background: 'oklch(0.155 0 0)' }}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView('shop')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer"
              style={{
                background: view === 'shop' ? 'oklch(0.65 0.18 142 / 0.12)' : 'transparent',
                color: view === 'shop' ? 'var(--primary)' : 'var(--muted-foreground)',
                border: `1px solid ${view === 'shop' ? 'oklch(0.65 0.18 142 / 0.25)' : 'transparent'}`,
              }}>
              <ShoppingBag className="w-3 h-3" />
              Sklep odznak
            </button>
            <button
              onClick={() => setView('inventory')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer"
              style={{
                background: view === 'inventory' ? 'oklch(0.65 0.18 142 / 0.12)' : 'transparent',
                color: view === 'inventory' ? 'var(--primary)' : 'var(--muted-foreground)',
                border: `1px solid ${view === 'inventory' ? 'oklch(0.65 0.18 142 / 0.25)' : 'transparent'}`,
              }}>
              <Package className="w-3 h-3" />
              Ekwipunek
              {inventory.length > 0 && (
                <span className="ml-1 text-[10px] font-bold px-1.5 rounded-full"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                  {inventory.length}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/60 bg-muted/20">
            <Coins className="w-3 h-3" style={{ color: 'oklch(0.82 0.17 85)' }} />
            <span className="text-[11px] font-bold tabular-nums" style={{ color: 'oklch(0.82 0.17 85)' }}>{points}</span>
          </div>
        </div>

        {view === 'shop' && (
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Category tabs */}
            {tabs.length > 1 && (
              <div className="flex items-center gap-1 mb-4 sticky top-0 z-10 pb-1" style={{ background: 'var(--card)' }}>
                {tabs.map(t => (
                  <button key={t}
                    onClick={() => setShopTab(t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    style={{
                      background: shopTab === t ? 'oklch(0.65 0.18 142 / 0.15)' : 'oklch(0.155 0 0)',
                      color: shopTab === t ? 'var(--primary)' : 'var(--muted-foreground)',
                      border: `1px solid ${shopTab === t ? 'oklch(0.65 0.18 142 / 0.3)' : 'var(--border)'}`,
                    }}>
                    Kategoria {t}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {shopBadges.length === 0 && (
                <div className="col-span-3 py-8 text-center text-muted-foreground text-sm">
                  Brak odznak w tej kategorii
                </div>
              )}
              {shopBadges.map(badge => {
                const owned = inventory.includes(badge.id)
                const affordable = !owned && points >= badge.cost
                const msg = shopMsg?.id === badge.id ? shopMsg : null
                const Icon = ICON_MAP[badge.icon] ?? Shield

                return (
                  <div key={badge.id}
                    className={`relative overflow-hidden rounded-xl border p-3 transition-all ${owned ? 'opacity-60' : affordable ? 'hover:border-primary/40' : 'opacity-70'}`}
                    style={{ background: 'oklch(0.155 0 0)', borderColor: owned ? 'var(--border)' : `oklch(0.72 0.15 ${badge.color_hue} / 0.2)` }}>
                    <div className="absolute top-0 right-0 w-12 h-12 rounded-full blur-xl opacity-20 pointer-events-none"
                      style={{ background: `oklch(0.72 0.15 ${badge.color_hue})` }} />
                    <div className="relative flex items-start gap-2.5 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `oklch(0.72 0.15 ${badge.color_hue} / 0.15)`, boxShadow: `0 0 12px oklch(0.72 0.15 ${badge.color_hue} / 0.2)` }}>
                        <Icon className="w-5 h-5" style={{ color: `oklch(0.72 0.15 ${badge.color_hue})` }} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground leading-tight">{badge.name}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-border/60">
                        <Coins className="w-2.5 h-2.5" style={{ color: 'oklch(0.82 0.17 85)' }} />
                        <span className="text-[10px] font-bold tabular-nums" style={{ color: 'oklch(0.82 0.17 85)' }}>{badge.cost}</span>
                      </div>
                      {owned ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--primary)' }}>
                          <CheckCircle2 className="w-3 h-3" />
                          Posiadasz
                        </span>
                      ) : (
                        <button
                          onClick={() => handleBuy(badge.id)}
                          disabled={!affordable}
                          className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
                          style={{
                            background: affordable ? 'var(--primary)' : 'var(--muted)',
                            color: affordable ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                          }}>
                          Kup
                        </button>
                      )}
                    </div>
                    {msg && (
                      <div className={`absolute inset-x-0 bottom-0 text-center py-1 text-[10px] font-bold rounded-b-xl ${msg.ok ? 'text-primary bg-primary/10' : 'text-destructive bg-destructive/10'}`}>
                        {msg.text}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="p-4 max-h-96 overflow-y-auto">
            {inventoryBadges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-foreground">Ekwipunek jest pusty</p>
                <p className="text-xs text-muted-foreground mt-1">Zakup odznaki w sklepie, aby je tutaj zobaczyć.</p>
                <button onClick={() => setView('shop')}
                  className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                  Przejdź do sklepu
                </button>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-muted-foreground mb-3">
                  Wybierz do 3 odznak do wyświetlenia w profilu. Aktywne: {equippedBadges.length}/3
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {inventoryBadges.map(badge => {
                    const equipped = equippedBadges.includes(badge.id)
                    const Icon = ICON_MAP[badge.icon] ?? Shield
                    return (
                      <div key={badge.id}
                        className="relative overflow-hidden rounded-xl border p-3 transition-all cursor-pointer"
                        style={{
                          background: equipped ? `oklch(0.72 0.15 ${badge.color_hue} / 0.08)` : 'oklch(0.155 0 0)',
                          borderColor: equipped ? `oklch(0.72 0.15 ${badge.color_hue} / 0.4)` : 'var(--border)',
                          boxShadow: equipped ? `0 0 16px oklch(0.72 0.15 ${badge.color_hue} / 0.15)` : 'none',
                        }}
                        onClick={() => toggleBadgeEquip(badge.id)}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `oklch(0.72 0.15 ${badge.color_hue} / 0.18)` }}>
                            <Icon className="w-4.5 h-4.5" style={{ color: `oklch(0.72 0.15 ${badge.color_hue})` }} strokeWidth={1.8} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{badge.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{badge.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{equipped ? 'Kliknij aby zdjąć' : 'Kliknij aby założyć'}</span>
                          <div className="w-5 h-5 rounded-md flex items-center justify-center"
                            style={{ background: equipped ? `oklch(0.72 0.15 ${badge.color_hue} / 0.2)` : 'var(--muted)' }}>
                            {equipped && <CheckCircle2 className="w-3 h-3" style={{ color: `oklch(0.72 0.15 ${badge.color_hue})` }} />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Profile + subscription + activation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative overflow-hidden rounded-xl border p-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Dane profilu</p>
          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Nazwa użytkownika</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={username} onChange={e => setUsername(e.target.value)} className="pl-8" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Adres e-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={email} onChange={e => setEmail(e.target.value)} className="pl-8" type="email" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Numer telefonu</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="pl-8" placeholder="+48 000 000 000" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Nowe hasło</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pl-8" placeholder="Zostaw puste aby nie zmieniać" />
              </div>
            </div>
            {saveError && (
              <p className="text-xs text-destructive">{saveError}</p>
            )}
            <Button variant="primary" className="w-full" onClick={handleSave}>
              {saved ? <><CheckCircle2 className="w-4 h-4" />Zapisano!</> : 'Zapisz zmiany'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Subscription */}
          <div className="relative overflow-hidden rounded-xl border p-4"
            style={{ background: 'var(--card)', borderColor: licenseLocked ? 'oklch(0.577 0.245 27.325 / 0.25)' : 'oklch(0.65 0.18 142 / 0.25)' }}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-15 pointer-events-none"
              style={{ background: licenseLocked ? 'var(--destructive)' : 'var(--primary)' }} />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Subskrypcja</p>
            <div className="relative flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: licenseLocked ? 'oklch(0.577 0.245 27.325 / 0.12)' : 'oklch(0.65 0.18 142 / 0.15)',
                  boxShadow: licenseLocked ? '0 0 12px oklch(0.577 0.245 27.325 / 0.2)' : '0 0 12px var(--glow-primary-soft)',
                }}>
                <Crown className={`w-5 h-5 ${licenseLocked ? 'text-destructive' : 'text-primary'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">Plan {licensePlan}</p>
                  <Badge variant={licenseLocked ? 'danger' : 'success'}>{licenseLocked ? 'Nieaktywna' : 'Aktywna'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {licenseLocked ? 'Aktywuj kod aby odblokować' : `${licenseDaysLeft} dni pozostało`}
                </p>
              </div>
            </div>
            {!licenseLocked && (
              <>
                <div className="relative grid grid-cols-2 gap-1 mb-3">
                  {['Ochrona 24/7', 'Skanowanie zaawansowane', 'Ochrona sieci', 'Wsparcie priorytetowe'].map(f => (
                    <div key={f} className="flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-primary shrink-0" fill="currentColor" />
                      <span className="text-[11px] text-muted-foreground truncate">{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={removeLicense}
                  className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer"
                  style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'oklch(0.577 0.245 27.325)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                  <Trash2 className="w-3 h-3" />
                  Usuń licencję
                </button>
              </>
            )}
          </div>

          {/* Activation code */}
          <div className="relative overflow-hidden rounded-xl border p-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Kod aktywacyjny</p>
            <div className="space-y-2">
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={activationCode}
                  onChange={e => setActivationCode(e.target.value.toUpperCase())}
                  className="pl-8 uppercase tracking-widest text-sm font-mono"
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>
              {activationMsg && (
                <p className={`text-[11px] font-medium ${activationMsg.ok ? 'text-primary' : 'text-destructive'}`}>
                  {activationMsg.text}
                </p>
              )}
              <Button variant="primary" className="w-full" onClick={handleActivate} disabled={activating || !activationCode.trim()}>
                {activating ? 'Aktywowanie...' : 'Aktywuj licencję'}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Testowy kod: <span className="font-mono text-foreground">QUASAR-DEMO-2026</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
