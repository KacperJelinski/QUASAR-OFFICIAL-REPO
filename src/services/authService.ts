import { supabase, DEMO_OWNER_ID } from './supabaseClient'

export type AppUser = {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  password_hash: string
  status: 'active' | 'banned' | 'suspended'
  suspended_until: string | null
  suspension_reason: string
  suspended_by: string
  banned_by: string
  registered_via_app: boolean
  created_at: string
}

export type LoginResult =
  | { ok: true; user: AppUser }
  | { ok: false; reason: 'invalid_credentials' }
  | { ok: false; reason: 'banned'; banned_by: string }
  | { ok: false; reason: 'suspended'; suspended_until: string; suspension_reason: string; suspended_by: string }

const LS_APP_USER = 'quasar_app_user_id'

export function getStoredUserId(): string | null {
  return localStorage.getItem(LS_APP_USER)
}

export function storeUserId(id: string) {
  localStorage.setItem(LS_APP_USER, id)
}

export function clearStoredUser() {
  localStorage.removeItem(LS_APP_USER)
}

export async function getStoredUser(): Promise<AppUser | null> {
  const id = getStoredUserId()
  if (!id) return null
  const { data } = await supabase
    .from('xq_users')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  return data as AppUser | null
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const { data } = await supabase
    .from('xq_users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('registered_via_app', true)
    .maybeSingle()

  if (!data || data.password_hash !== password) {
    return { ok: false, reason: 'invalid_credentials' }
  }

  const user = data as AppUser

  // Check suspension expiry
  if (user.status === 'suspended' && user.suspended_until) {
    if (new Date(user.suspended_until) > new Date()) {
      return {
        ok: false,
        reason: 'suspended',
        suspended_until: user.suspended_until,
        suspension_reason: user.suspension_reason,
        suspended_by: user.suspended_by,
      }
    } else {
      // Suspension expired, unblock
      await supabase.from('xq_users')
        .update({ status: 'active', suspended_until: null, suspension_reason: '', suspended_by: '' })
        .eq('id', user.id)
      user.status = 'active'
    }
  }

  if (user.status === 'banned') {
    return { ok: false, reason: 'banned', banned_by: user.banned_by }
  }

  return { ok: true, user }
}

export async function registerUser(input: {
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
}): Promise<{ ok: boolean; message: string; user?: AppUser }> {
  const email = input.email.toLowerCase().trim()

  // Check if email already exists
  const { data: existing } = await supabase
    .from('xq_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return { ok: false, message: 'Konto z tym adresem e-mail już istnieje.' }
  }

  const full_name = `${input.first_name.trim()} ${input.last_name.trim()}`.trim()

  const { data } = await supabase
    .from('xq_users')
    .insert({
      owner_id: DEMO_OWNER_ID,
      email,
      first_name: input.first_name.trim(),
      last_name: input.last_name.trim(),
      full_name,
      phone: input.phone.trim(),
      password_hash: input.password,
      status: 'active',
      registered_via_app: true,
      agent_id: 'XQ-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
    })
    .select()
    .maybeSingle()

  if (!data) {
    return { ok: false, message: 'Błąd podczas tworzenia konta. Spróbuj ponownie.' }
  }

  return { ok: true, message: 'Konto zostało utworzone.', user: data as AppUser }
}

// CEO admin accounts — these bypass the registered_via_app check
export const ADMIN_ACCOUNTS = [
  { email: 'kacper.jelinski@quasar.pl', password: 'Admin2026!', name: 'Kacper Jeliński', role: 'CEO' },
  { email: 'tomasz@quasar.pl', password: 'Admin2026!', name: 'Tomasz', role: 'Admin' },
]

export async function loginAdmin(email: string, password: string): Promise<{ ok: boolean; name: string; role: string } | null> {
  const acc = ADMIN_ACCOUNTS.find(a => a.email === email.toLowerCase().trim() && a.password === password)
  return acc ? { ok: true, name: acc.name, role: acc.role } : null
}
