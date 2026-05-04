import { supabase, DEMO_OWNER_ID } from './supabaseClient'

export type XqUser = {
  id: string
  email: string
  full_name: string
  banned: boolean
  agent_id: string
  role?: string
  license_override?: string
  created_at: string
}

export type XqLicense = {
  id: string
  user_id: string | null
  key: string
  plan: 'Free' | 'Pro'
  status: 'active' | 'revoked' | 'expired' | 'suspended'
  expires_at: string | null
  created_at: string
}

export type XqSubscription = {
  id: string
  user_id: string | null
  plan: 'Free' | 'Pro'
  status: string
  starts_at: string
  expires_at: string | null
}

export type XqAuditLog = {
  id: string
  level: string
  message: string
  created_at: string
}

// Seed state flag — avoid duplicate seeds per session
let seeded = false

export async function ensureSeed(): Promise<void> {
  if (seeded) return
  seeded = true

  const { data: existing } = await supabase
    .from('xq_users')
    .select('id')
    .eq('owner_id', DEMO_OWNER_ID)
    .limit(1)

  if (existing && existing.length > 0) return

  const seedUsers = [
    { email: 'jan.kowalski@example.com', full_name: 'Jan Kowalski', agent_id: 'XQ-001' },
    { email: 'anna.nowak@example.com', full_name: 'Anna Nowak', agent_id: 'XQ-002' },
    { email: 'piotr.wisniewski@example.com', full_name: 'Piotr Wiśniewski', agent_id: 'XQ-003' },
    { email: 'katarzyna.wojcik@example.com', full_name: 'Katarzyna Wójcik', agent_id: 'XQ-004' },
  ]

  const { data: users } = await supabase
    .from('xq_users')
    .insert(seedUsers.map((u) => ({ ...u, owner_id: DEMO_OWNER_ID })))
    .select()

  if (!users) return

  const now = Date.now()
  const licenses = users.map((u, i) => ({
    owner_id: DEMO_OWNER_ID,
    user_id: u.id,
    key: generateKey(),
    plan: i % 2 === 0 ? 'Pro' : 'Free',
    status: 'active',
    expires_at: new Date(now + (365 - i * 30) * 86400_000).toISOString(),
  }))
  await supabase.from('xq_licenses').insert(licenses)

  const subs = users.map((u, i) => ({
    owner_id: DEMO_OWNER_ID,
    user_id: u.id,
    plan: i % 2 === 0 ? 'Pro' : 'Free',
    status: 'active',
    expires_at: new Date(now + (365 - i * 30) * 86400_000).toISOString(),
  }))
  await supabase.from('xq_subscriptions').insert(subs)

  const logs = [
    { level: 'INFO', message: 'Inicjalizacja panelu QUASAR' },
    { level: 'INFO', message: 'Synchronizacja z Wazuh Manager — OK' },
    { level: 'DEBUG', message: 'Załadowano 4 agentów' },
    { level: 'WARN', message: 'Agent UBUNTU-SRV-03 nieaktywny > 1h' },
  ]
  await supabase.from('xq_audit_logs').insert(logs.map((l) => ({ ...l, owner_id: DEMO_OWNER_ID })))
}

export async function listUsers(): Promise<XqUser[]> {
  await ensureSeed()
  const { data } = await supabase
    .from('xq_users')
    .select('*')
    .eq('owner_id', DEMO_OWNER_ID)
    .order('created_at', { ascending: false })
  return (data ?? []) as XqUser[]
}

export async function addUser(input: { email: string; full_name: string }): Promise<XqUser | null> {
  const { data } = await supabase
    .from('xq_users')
    .insert({ ...input, owner_id: DEMO_OWNER_ID, agent_id: 'XQ-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0') })
    .select()
    .maybeSingle()
  await writeLog('INFO', `Dodano użytkownika ${input.email}`)
  return data as XqUser | null
}

export async function toggleBan(id: string, banned: boolean): Promise<void> {
  await supabase.from('xq_users').update({ banned }).eq('id', id).eq('owner_id', DEMO_OWNER_ID)
  await writeLog(banned ? 'WARN' : 'INFO', `${banned ? 'Zablokowano' : 'Odblokowano'} konto ${id.slice(0, 8)}`)
}

export async function listLicenses(): Promise<XqLicense[]> {
  await ensureSeed()
  const { data } = await supabase
    .from('xq_licenses')
    .select('*')
    .eq('owner_id', DEMO_OWNER_ID)
    .order('created_at', { ascending: false })
  return (data ?? []) as XqLicense[]
}

export async function generateLicense(input: {
  user_id: string | null
  plan: 'Free' | 'Pro'
  days: number
}): Promise<XqLicense | null> {
  const expiresAt = new Date(Date.now() + input.days * 86400_000).toISOString()
  const startsAt = new Date().toISOString()

  const { data } = await supabase
    .from('xq_licenses')
    .insert({
      owner_id: DEMO_OWNER_ID,
      user_id: input.user_id,
      key: generateKey(),
      plan: input.plan,
      status: 'active',
      expires_at: expiresAt,
    })
    .select()
    .maybeSingle()

  // Sync subscription so the user app sees the license immediately
  if (input.user_id) {
    await syncSubscriptionForUser(input.user_id, input.plan, startsAt, expiresAt)
  }

  await writeLog('INFO', `Wygenerowano nową licencję ${input.plan} na ${input.days} dni`)
  return data as XqLicense | null
}

export async function revokeLicense(id: string): Promise<void> {
  const { data: lic } = await supabase
    .from('xq_licenses')
    .select('user_id')
    .eq('id', id)
    .eq('owner_id', DEMO_OWNER_ID)
    .maybeSingle()

  await supabase.from('xq_licenses').update({ status: 'revoked' }).eq('id', id).eq('owner_id', DEMO_OWNER_ID)

  // Remove user's subscription so the app reflects revocation immediately
  if (lic?.user_id) {
    await supabase.from('xq_subscriptions')
      .update({ status: 'revoked' })
      .eq('user_id', lic.user_id)
      .eq('owner_id', DEMO_OWNER_ID)
      .eq('status', 'active')
  }

  await writeLog('WARN', `Unieważniono licencję ${id.slice(0, 8)}`)
}

export async function extendLicense(id: string, days: number): Promise<void> {
  const { data } = await supabase
    .from('xq_licenses')
    .select('expires_at, user_id, plan')
    .eq('id', id)
    .eq('owner_id', DEMO_OWNER_ID)
    .maybeSingle()
  const base = data?.expires_at ? new Date(data.expires_at).getTime() : Date.now()
  const next = new Date(Math.max(base, Date.now()) + days * 86400_000).toISOString()
  await supabase.from('xq_licenses').update({ expires_at: next, status: 'active' }).eq('id', id).eq('owner_id', DEMO_OWNER_ID)

  // Sync subscription expiry
  if (data?.user_id) {
    await syncSubscriptionForUser(data.user_id, (data.plan as 'Free' | 'Pro') ?? 'Pro', new Date().toISOString(), next)
  }

  await writeLog('INFO', `Przedłużono licencję ${id.slice(0, 8)} o ${days} dni`)
}

export async function suspendLicense(id: string): Promise<void> {
  const { data: lic } = await supabase
    .from('xq_licenses')
    .select('user_id')
    .eq('id', id)
    .eq('owner_id', DEMO_OWNER_ID)
    .maybeSingle()

  await supabase.from('xq_licenses').update({ status: 'suspended' }).eq('id', id).eq('owner_id', DEMO_OWNER_ID)

  if (lic?.user_id) {
    await supabase.from('xq_subscriptions')
      .update({ status: 'suspended' })
      .eq('user_id', lic.user_id)
      .eq('owner_id', DEMO_OWNER_ID)
      .eq('status', 'active')
  }

  await writeLog('WARN', `Zawieszono licencję ${id.slice(0, 8)}`)
}

export async function unsuspendLicense(id: string): Promise<void> {
  const { data: lic } = await supabase
    .from('xq_licenses')
    .select('user_id, plan, expires_at')
    .eq('id', id)
    .eq('owner_id', DEMO_OWNER_ID)
    .maybeSingle()

  await supabase.from('xq_licenses').update({ status: 'active' }).eq('id', id).eq('owner_id', DEMO_OWNER_ID)

  if (lic?.user_id && lic.expires_at) {
    await syncSubscriptionForUser(lic.user_id, (lic.plan as 'Free' | 'Pro') ?? 'Pro', new Date().toISOString(), lic.expires_at)
  }

  await writeLog('INFO', `Cofnięto zawieszenie licencji ${id.slice(0, 8)}`)
}

export async function unrevokeLicense(id: string): Promise<void> {
  const { data: lic } = await supabase
    .from('xq_licenses')
    .select('user_id, plan, expires_at')
    .eq('id', id)
    .eq('owner_id', DEMO_OWNER_ID)
    .maybeSingle()

  await supabase.from('xq_licenses').update({ status: 'active' }).eq('id', id).eq('owner_id', DEMO_OWNER_ID)

  if (lic?.user_id && lic.expires_at) {
    await syncSubscriptionForUser(lic.user_id, (lic.plan as 'Free' | 'Pro') ?? 'Pro', new Date().toISOString(), lic.expires_at)
  }

  await writeLog('INFO', `Cofnięto unieważnienie licencji ${id.slice(0, 8)}`)
}

export async function deleteLicense(id: string): Promise<void> {
  const { data: lic } = await supabase
    .from('xq_licenses')
    .select('user_id')
    .eq('id', id)
    .eq('owner_id', DEMO_OWNER_ID)
    .maybeSingle()

  await supabase.from('xq_licenses').delete().eq('id', id).eq('owner_id', DEMO_OWNER_ID)

  if (lic?.user_id) {
    await supabase.from('xq_subscriptions')
      .update({ status: 'revoked' })
      .eq('user_id', lic.user_id)
      .eq('owner_id', DEMO_OWNER_ID)
  }

  await writeLog('WARN', `Usunięto licencję ${id.slice(0, 8)}`)
}

async function syncSubscriptionForUser(
  user_id: string,
  plan: 'Free' | 'Pro',
  starts_at: string,
  expires_at: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from('xq_subscriptions')
    .select('id')
    .eq('user_id', user_id)
    .eq('owner_id', DEMO_OWNER_ID)
    .maybeSingle()

  if (existing) {
    await supabase.from('xq_subscriptions')
      .update({ plan, status: 'active', starts_at, expires_at })
      .eq('id', existing.id)
  } else {
    await supabase.from('xq_subscriptions').insert({
      owner_id: DEMO_OWNER_ID,
      user_id,
      plan,
      status: 'active',
      starts_at,
      expires_at,
    })
  }
}

export async function listSubscriptions(): Promise<XqSubscription[]> {
  await ensureSeed()
  const { data } = await supabase
    .from('xq_subscriptions')
    .select('*')
    .eq('owner_id', DEMO_OWNER_ID)
    .order('created_at', { ascending: false })
  return (data ?? []) as XqSubscription[]
}

export async function assignSubscription(user_id: string, plan: 'Free' | 'Pro', days: number): Promise<void> {
  await supabase.from('xq_subscriptions').insert({
    owner_id: DEMO_OWNER_ID,
    user_id,
    plan,
    status: 'active',
    expires_at: new Date(Date.now() + days * 86400_000).toISOString(),
  })
  await writeLog('INFO', `Przypisano subskrypcję ${plan} użytkownikowi ${user_id.slice(0, 8)}`)
}

export async function listLogs(): Promise<XqAuditLog[]> {
  await ensureSeed()
  const { data } = await supabase
    .from('xq_audit_logs')
    .select('*')
    .eq('owner_id', DEMO_OWNER_ID)
    .order('created_at', { ascending: false })
    .limit(100)
  return (data ?? []) as XqAuditLog[]
}

export async function writeLog(level: string, message: string): Promise<void> {
  await supabase.from('xq_audit_logs').insert({ owner_id: DEMO_OWNER_ID, level, message })
}

export function generateKey(): string {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `XQ-${seg()}-${seg()}-${seg()}-${seg()}`
}

export function daysUntil(iso: string | null): number {
  if (!iso) return 0
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400_000))
}

// ─── Points ───

export type XqPoints = {
  id: string
  user_id: string
  balance: number
  lifetime: number
  updated_at: string
}

export async function getUserPoints(user_id: string): Promise<XqPoints | null> {
  const { data } = await supabase
    .from('xq_points')
    .select('*')
    .eq('owner_id', DEMO_OWNER_ID)
    .eq('user_id', user_id)
    .maybeSingle()
  return data as XqPoints | null
}

export async function listAllPoints(): Promise<XqPoints[]> {
  const { data } = await supabase
    .from('xq_points')
    .select('*')
    .eq('owner_id', DEMO_OWNER_ID)
  return (data ?? []) as XqPoints[]
}

export async function adjustPoints(user_id: string, amount: number, reason: string): Promise<void> {
  const existing = await getUserPoints(user_id)
  const newBalance = Math.max(0, (existing?.balance ?? 0) + amount)
  const newLifetime = (existing?.lifetime ?? 0) + Math.max(0, amount)

  if (existing) {
    await supabase.from('xq_points')
      .update({ balance: newBalance, lifetime: newLifetime, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .eq('owner_id', DEMO_OWNER_ID)
  } else {
    await supabase.from('xq_points').insert({
      owner_id: DEMO_OWNER_ID, user_id, balance: newBalance, lifetime: newLifetime,
    })
  }
  await supabase.from('xq_point_transactions').insert({
    owner_id: DEMO_OWNER_ID, user_id, amount, kind: amount >= 0 ? 'credit' : 'debit', reason,
  })
  await writeLog('INFO', `Punkty: ${amount >= 0 ? '+' : ''}${amount} dla ${user_id.slice(0, 8)} (${reason})`)
}

// ─── Bonuses ───

export type XqBonus = {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  active: boolean
  created_at: string
}

export async function listBonuses(): Promise<XqBonus[]> {
  await ensureSeed()
  const { data } = await supabase
    .from('xq_bonuses')
    .select('*')
    .eq('owner_id', DEMO_OWNER_ID)
    .order('created_at', { ascending: false })
  if (!data || data.length === 0) {
    const defaults = [
      { name: '+30 dni Pro', description: 'Przedłużenie licencji', cost: 200, icon: 'Calendar' },
      { name: 'Boost skanowania', description: '2x szybsze skany przez 7 dni', cost: 120, icon: 'Zap' },
      { name: 'Sejf plików 10GB', description: 'Zaszyfrowany sejf', cost: 350, icon: 'Lock' },
    ]
    await supabase.from('xq_bonuses').insert(defaults.map(d => ({ ...d, owner_id: DEMO_OWNER_ID, active: true })))
    const { data: d2 } = await supabase.from('xq_bonuses').select('*').eq('owner_id', DEMO_OWNER_ID)
    return (d2 ?? []) as XqBonus[]
  }
  return data as XqBonus[]
}

export async function addBonus(input: { name: string; description: string; cost: number; icon?: string }): Promise<void> {
  await supabase.from('xq_bonuses').insert({ ...input, icon: input.icon ?? 'Gift', owner_id: DEMO_OWNER_ID, active: true })
  await writeLog('INFO', `Dodano bonus: ${input.name}`)
}

export async function toggleBonusActive(id: string, active: boolean): Promise<void> {
  await supabase.from('xq_bonuses').update({ active }).eq('id', id).eq('owner_id', DEMO_OWNER_ID)
}

export async function deleteBonus(id: string): Promise<void> {
  await supabase.from('xq_bonuses').delete().eq('id', id).eq('owner_id', DEMO_OWNER_ID)
  await writeLog('WARN', `Usunięto bonus ${id.slice(0, 8)}`)
}

// ─── Remote access ───

export type XqRemoteSession = {
  id: string
  user_id: string
  enabled: boolean
  status: string
  last_seen: string
  created_at: string
}

export async function listRemoteSessions(): Promise<XqRemoteSession[]> {
  const users = await listUsers()
  const { data } = await supabase
    .from('xq_remote_sessions')
    .select('*')
    .eq('owner_id', DEMO_OWNER_ID)

  const existing = new Map<string, XqRemoteSession>((data ?? []).map((r: XqRemoteSession) => [r.user_id, r]))

  for (const u of users) {
    if (!existing.has(u.id)) {
      const { data: created } = await supabase.from('xq_remote_sessions')
        .insert({ owner_id: DEMO_OWNER_ID, user_id: u.id, enabled: false, status: 'idle' })
        .select()
        .maybeSingle()
      if (created) existing.set(u.id, created as XqRemoteSession)
    }
  }
  return Array.from(existing.values())
}

export async function setRemoteEnabled(id: string, enabled: boolean): Promise<void> {
  await supabase.from('xq_remote_sessions')
    .update({ enabled, status: enabled ? 'connected' : 'idle', last_seen: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', DEMO_OWNER_ID)
  await writeLog(enabled ? 'WARN' : 'INFO', `Zdalny dostęp ${enabled ? 'włączony' : 'wyłączony'} dla sesji ${id.slice(0, 8)}`)
}
