import { supabase, DEMO_OWNER_ID } from './supabaseClient'

export type UserData = {
  points: number
  inventory: string[]
  equipped_badges: string[]
  license_activated_at: string | null
  license_duration_days: number
}

export async function loadUserData(userId: string): Promise<UserData> {
  // Load non-points data from xq_user_data
  const [{ data: ud }, { data: pts }] = await Promise.all([
    supabase
      .from('xq_user_data')
      .select('inventory, equipped_badges, license_activated_at, license_duration_days')
      .eq('user_id', userId)
      .maybeSingle(),
    // Points come from xq_points (admin-managed)
    supabase
      .from('xq_points')
      .select('balance')
      .eq('user_id', userId)
      .eq('owner_id', DEMO_OWNER_ID)
      .maybeSingle(),
  ])

  return {
    points: pts?.balance ?? 0,
    inventory: ud?.inventory ?? [],
    equipped_badges: ud?.equipped_badges ?? [],
    license_activated_at: ud?.license_activated_at ?? null,
    license_duration_days: ud?.license_duration_days ?? 0,
  }
}

export async function saveUserData(userId: string, patch: Partial<UserData>): Promise<void> {
  const { points, ...rest } = patch

  // Save non-points data to xq_user_data (no owner_id column in this table)
  if (Object.keys(rest).length > 0) {
    await supabase
      .from('xq_user_data')
      .upsert(
        { user_id: userId, ...rest, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
  }

  // Save points to xq_points
  if (typeof points === 'number') {
    const { data: existing } = await supabase
      .from('xq_points')
      .select('id, lifetime')
      .eq('user_id', userId)
      .eq('owner_id', DEMO_OWNER_ID)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('xq_points')
        .update({ balance: points, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('xq_points')
        .insert({ owner_id: DEMO_OWNER_ID, user_id: userId, balance: points, lifetime: points })
    }
  }
}

export async function loadActiveSubscription(userId: string): Promise<{ activatedAt: string; durationDays: number } | null> {
  const { data } = await supabase
    .from('xq_subscriptions')
    .select('starts_at, expires_at, status, plan')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data || !data.expires_at) return null

  const expires = new Date(data.expires_at)
  if (expires < new Date()) return null

  const starts = new Date(data.starts_at ?? data.expires_at)
  const durationDays = Math.max(1, Math.ceil((expires.getTime() - starts.getTime()) / 86400_000))

  return { activatedAt: data.starts_at ?? new Date().toISOString(), durationDays }
}
