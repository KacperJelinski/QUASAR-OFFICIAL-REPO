import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Lock, LockOpen, Key, Terminal, RefreshCw, Eye, EyeOff, TriangleAlert as AlertTriangle, ShieldOff, Users, Ban, CirclePlus as PlusCircle, Copy, Trash2, CircleCheck as CheckCircle2, Server, Activity, ShieldCheck, LayoutDashboard, Gift, Coins, Monitor, Plus, Minus, Power, TrendingUp, MessageSquare, UserCog, Send, Crown, Mail, Pencil, X, Phone, Clock, Check, Shield, Star, Target, Microscope, Swords, Ghost, Flame, Zap, Award, Trophy, Skull, Bug, Cpu, Wifi, Settings2, ChevronDown, CirclePause as PauseCircle, CirclePlay as PlayCircle, RotateCcw } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Switch } from '../components/ui/Switch'
import { Badge } from '../components/ui/Badge'
import {
  listUsers, listLicenses, generateLicense, revokeLicense, extendLicense,
  suspendLicense, unsuspendLicense, unrevokeLicense, deleteLicense,
  listLogs, writeLog, daysUntil,
  listAllPoints, adjustPoints,
  listRemoteSessions, setRemoteEnabled,
  generateKey,
  type XqUser, type XqLicense, type XqAuditLog, type XqPoints, type XqRemoteSession,
} from '../services/adminService'
import { forceSync, fetchAgentStatus, type WazuhAgent } from '../services/wazuhService'
import { supabase, DEMO_OWNER_ID } from '../services/supabaseClient'

type AdminRole = 'Admin' | 'CEO'

type XqAdministrator = {
  id: string
  email: string
  full_name: string
  role: AdminRole
  password_hash: string
  created_at: string
}

type XqActivationCode = {
  id: string
  code: string
  plan: 'Free' | 'Pro'
  duration_days: number
  used: boolean
  used_at: string | null
  used_by: string | null
  expires_at: string | null
  code_expires_at?: string | null
  created_at: string
}

type SupportConversation = {
  user_id: string | null
  owner_email: string
  messages: SupportMessage[]
  last_message: string
  unread: number
}

type SupportMessage = {
  id: string
  sender: 'user' | 'admin'
  content: string
  admin_name?: string
  admin_role?: string
  sender_name?: string
  sender_role?: string
  created_at: string
}

function Section({ title, icon: Icon, right, children }: { title: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
      <div className="relative flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-primary/10 border border-primary/15">
            <Icon className="w-3 h-3 text-primary" strokeWidth={2} />
          </div>
          <p className="text-xs font-semibold text-foreground tracking-tight">{title}</p>
        </div>
        {right}
      </div>
      <div className="relative p-4">{children}</div>
    </div>
  )
}

function Tab({ id, label, icon: Icon, active, count, onClick }: { id: string; label: string; icon: any; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      key={id}
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer group"
      style={{
        background: active ? 'oklch(0.65 0.18 142 / 0.12)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--muted-foreground)',
        border: `1px solid ${active ? 'oklch(0.65 0.18 142 / 0.25)' : 'var(--border)'}`,
      }}
    >
      <Icon className="w-3 h-3" strokeWidth={2} />
      {label}
      {typeof count === 'number' && (
        <span className="ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: active ? 'oklch(0.65 0.18 142 / 0.2)' : 'oklch(0.25 0 0)', color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}>
          {count}
        </span>
      )}
    </button>
  )
}

type ExtendedUser = XqUser & {
  phone?: string
  first_name?: string
  last_name?: string
  password_hash?: string
  status?: 'active' | 'banned' | 'suspended'
  suspended_until?: string | null
  suspension_reason?: string
  suspended_by?: string
  banned_by?: string
  registered_via_app?: boolean
}

type EditField = 'name' | 'email' | 'phone' | 'password' | null
type ActionPanel = 'suspend' | 'ban' | null

function UserDetailModal({ user, onClose, onUpdated }: { user: ExtendedUser; onClose: () => void; onUpdated: (u: ExtendedUser) => void }) {
  const [editField, setEditField] = useState<EditField>(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionPanel, setActionPanel] = useState<ActionPanel>(null)
  const [suspendDays, setSuspendDays] = useState(7)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendBy, setSuspendBy] = useState('Admin')
  const [banBy, setBanBy] = useState('Admin')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isBanned = user.status === 'banned' || user.banned
  const isSuspended = user.status === 'suspended' && user.suspended_until && new Date(user.suspended_until) > new Date()

  async function saveField(field: EditField) {
    if (!field || !editVal.trim()) return
    setSaving(true)
    const updates: Record<string, string> = {}
    if (field === 'name') {
      const parts = editVal.trim().split(' ')
      updates.full_name = editVal.trim()
      updates.first_name = parts[0] ?? ''
      updates.last_name = parts.slice(1).join(' ') ?? ''
    } else if (field === 'email') { updates.email = editVal.trim() }
    else if (field === 'phone') { updates.phone = editVal.trim() }
    else if (field === 'password') { updates.password_hash = editVal.trim() }
    await supabase.from('xq_users').update(updates).eq('id', user.id)
    await writeLog('INFO', `Zmieniono ${field} dla użytkownika ${user.email}`)
    onUpdated({ ...user, ...updates })
    setSaving(false)
    setEditField(null)
    setEditVal('')
  }

  async function handleBan() {
    const newBanned = !isBanned
    await supabase.from('xq_users').update({
      banned: newBanned, status: newBanned ? 'banned' : 'active',
      banned_by: newBanned ? banBy : '',
    }).eq('id', user.id)
    await writeLog(newBanned ? 'WARN' : 'INFO', `${newBanned ? 'Zablokowano' : 'Odblokowano'} konto ${user.email} przez ${banBy}`)
    onUpdated({ ...user, banned: newBanned, status: newBanned ? 'banned' : 'active', banned_by: newBanned ? banBy : '' })
    setActionPanel(null)
  }

  async function handleSuspend() {
    const until = new Date(Date.now() + suspendDays * 86400_000).toISOString()
    await supabase.from('xq_users').update({
      status: 'suspended', suspended_until: until,
      suspension_reason: suspendReason, suspended_by: suspendBy, banned: false,
    }).eq('id', user.id)
    await writeLog('WARN', `Zawieszono konto ${user.email} na ${suspendDays} dni przez ${suspendBy}: ${suspendReason}`)
    onUpdated({ ...user, status: 'suspended', suspended_until: until, suspension_reason: suspendReason, suspended_by: suspendBy })
    setActionPanel(null)
  }

  async function handleUnsuspend() {
    await supabase.from('xq_users').update({ status: 'active', suspended_until: null, suspension_reason: '', suspended_by: '' }).eq('id', user.id)
    await writeLog('INFO', `Cofnięto zawieszenie konta ${user.email}`)
    onUpdated({ ...user, status: 'active', suspended_until: null, suspension_reason: '', suspended_by: '' })
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('xq_users').delete().eq('id', user.id)
    await writeLog('WARN', `Usunięto konto ${user.email}`)
    onClose()
  }

  const statusBadge = isBanned
    ? <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'oklch(0.577 0.245 27.325 / 0.15)', color: 'oklch(0.75 0.2 27)' }}>ZABLOKOWANY</span>
    : isSuspended
      ? <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'oklch(0.82 0.17 50 / 0.15)', color: 'oklch(0.82 0.17 50)' }}>ZAWIESZONY</span>
      : <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'oklch(0.65 0.18 142 / 0.15)', color: 'var(--primary)' }}>AKTYWNY</span>

  const rows: { label: string; value: string; field: EditField; icon: React.ComponentType<{className?: string}> }[] = [
    { label: 'Imię i nazwisko', value: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '—', field: 'name', icon: Users },
    { label: 'E-mail', value: user.email, field: 'email', icon: Mail },
    { label: 'Telefon', value: (user as ExtendedUser).phone || '—', field: 'phone', icon: Phone },
    { label: 'Hasło', value: '••••••••', field: 'password', icon: Lock },
  ]

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'oklch(0 0 0 / 0.7)' }} onClick={onClose}>
      <div className="w-[480px] max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{ background: 'oklch(0.135 0 0)', borderColor: 'oklch(0.22 0 0)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'oklch(0.22 0 0)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
              style={{ background: 'oklch(0.65 0.18 142 / 0.15)', color: 'var(--primary)' }}>
              {(user.full_name || user.email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{user.full_name || user.email}</p>
              <div className="flex items-center gap-1.5 mt-0.5">{statusBadge}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Data fields */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Dane użytkownika</p>
            {rows.map(({ label, value, field, icon: Icon }) => (
              <div key={field} className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: 'oklch(0.16 0 0)', borderColor: 'oklch(0.22 0 0)' }}>
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
                  {editField === field ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        autoFocus
                        type={field === 'password' ? 'password' : 'text'}
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveField(field)}
                        className="flex-1 px-2 py-1 rounded-lg text-xs border outline-none"
                        style={{ background: 'oklch(0.18 0 0)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                        placeholder={`Nowe: ${label.toLowerCase()}`}
                      />
                      <button onClick={() => saveField(field)} disabled={saving}
                        className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer"
                        style={{ background: 'var(--primary)' }}>
                        <Check className="w-3 h-3" style={{ color: 'var(--primary-foreground)' }} />
                      </button>
                      <button onClick={() => { setEditField(null); setEditVal('') }}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                        style={{ background: 'oklch(0.22 0 0)' }}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground font-medium truncate">{value}</p>
                  )}
                </div>
                {editField !== field && (
                  <button onClick={() => { setEditField(field); setEditVal(field !== 'password' ? value : '') }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer">
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Registration info */}
          <div className="p-3 rounded-xl border text-xs text-muted-foreground"
            style={{ background: 'oklch(0.16 0 0)', borderColor: 'oklch(0.22 0 0)' }}>
            <div className="flex items-center justify-between">
              <span>Rejestracja przez aplikację:</span>
              <span className="font-semibold text-foreground">{user.registered_via_app ? 'Tak' : 'Nie (admin)'}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Data rejestracji:</span>
              <span className="font-semibold text-foreground">{new Date(user.created_at).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            {isSuspended && user.suspended_until && (
              <>
                <div className="flex items-center justify-between mt-1">
                  <span>Zawieszone przez:</span>
                  <span className="font-semibold text-foreground">{user.suspended_by || '—'}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>Powód:</span>
                  <span className="font-semibold text-foreground">{user.suspension_reason || '—'}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>Do:</span>
                  <span className="font-semibold" style={{ color: 'oklch(0.82 0.17 50)' }}>
                    {new Date(user.suspended_until).toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </>
            )}
            {isBanned && user.banned_by && (
              <div className="flex items-center justify-between mt-1">
                <span>Zablokowane przez:</span>
                <span className="font-semibold" style={{ color: 'oklch(0.75 0.2 27)' }}>{user.banned_by}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Zarządzanie kontem</p>

            {/* Suspend panel */}
            {actionPanel === 'suspend' ? (
              <div className="p-3 rounded-xl border space-y-3" style={{ background: 'oklch(0.82 0.17 50 / 0.05)', borderColor: 'oklch(0.82 0.17 50 / 0.3)' }}>
                <p className="text-xs font-semibold" style={{ color: 'oklch(0.82 0.17 50)' }}>Zawieszenie konta</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Dni zawieszenia</label>
                    <input type="number" min={1} max={365} value={suspendDays} onChange={e => setSuspendDays(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg text-xs border outline-none"
                      style={{ background: 'oklch(0.16 0 0)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Zawieszone przez</label>
                    <input type="text" value={suspendBy} onChange={e => setSuspendBy(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-xs border outline-none"
                      style={{ background: 'oklch(0.16 0 0)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Powód</label>
                  <input type="text" value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                    placeholder="Np. naruszenie regulaminu..."
                    className="w-full px-2 py-1.5 rounded-lg text-xs border outline-none"
                    style={{ background: 'oklch(0.16 0 0)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSuspend}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: 'oklch(0.82 0.17 50)', color: 'oklch(0.08 0 0)' }}>
                    Zawieś konto
                  </button>
                  <button onClick={() => setActionPanel(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-muted-foreground"
                    style={{ background: 'oklch(0.22 0 0)' }}>
                    Anuluj
                  </button>
                </div>
              </div>
            ) : actionPanel === 'ban' ? (
              <div className="p-3 rounded-xl border space-y-3" style={{ background: 'oklch(0.577 0.245 27.325 / 0.05)', borderColor: 'oklch(0.577 0.245 27.325 / 0.3)' }}>
                <p className="text-xs font-semibold text-destructive">Zablokowanie konta</p>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Zablokowane przez</label>
                  <input type="text" value={banBy} onChange={e => setBanBy(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs border outline-none"
                    style={{ background: 'oklch(0.16 0 0)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleBan}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-destructive-foreground"
                    style={{ background: 'var(--destructive)' }}>
                    {isBanned ? 'Odblokuj konto' : 'Zablokuj konto'}
                  </button>
                  <button onClick={() => setActionPanel(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-muted-foreground"
                    style={{ background: 'oklch(0.22 0 0)' }}>
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {isSuspended ? (
                  <button onClick={handleUnsuspend}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: 'oklch(0.65 0.18 142 / 0.12)', color: 'var(--primary)', border: '1px solid oklch(0.65 0.18 142 / 0.25)' }}>
                    <Check className="w-3 h-3" /> Cofnij zawieszenie
                  </button>
                ) : (
                  <button onClick={() => setActionPanel('suspend')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: 'oklch(0.82 0.17 50 / 0.1)', color: 'oklch(0.82 0.17 50)', border: '1px solid oklch(0.82 0.17 50 / 0.25)' }}>
                    <Clock className="w-3 h-3" /> Zawieś konto
                  </button>
                )}
                <button onClick={() => setActionPanel('ban')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  style={{
                    background: isBanned ? 'oklch(0.65 0.18 142 / 0.1)' : 'oklch(0.577 0.245 27.325 / 0.1)',
                    color: isBanned ? 'var(--primary)' : 'oklch(0.75 0.2 27)',
                    border: `1px solid ${isBanned ? 'oklch(0.65 0.18 142 / 0.25)' : 'oklch(0.577 0.245 27.325 / 0.25)'}`,
                  }}>
                  <Ban className="w-3 h-3" /> {isBanned ? 'Odblokuj' : 'Zablokuj'}
                </button>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'oklch(0.75 0.2 27)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                    <Trash2 className="w-3 h-3" /> Usuń konto
                  </button>
                ) : (
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    style={{ background: 'var(--destructive)', color: 'var(--primary-foreground)' }}>
                    <Trash2 className="w-3 h-3" /> {deleting ? 'Usuwanie...' : 'Potwierdź usunięcie'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function UsersTab() {
  const [users, setUsers] = useState<ExtendedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ExtendedUser | null>(null)

  async function reload() {
    setLoading(true)
    const { data } = await supabase
      .from('xq_users')
      .select('*')
      .eq('owner_id', DEMO_OWNER_ID)
      .order('created_at', { ascending: false })
    setUsers((data ?? []) as ExtendedUser[])
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      u.full_name.toLowerCase().includes(q) ||
      (u.phone ?? '').includes(q) ||
      (u.first_name ?? '').toLowerCase().includes(q) ||
      (u.last_name ?? '').toLowerCase().includes(q)
    )
  })

  function getStatusInfo(u: ExtendedUser) {
    const isBanned = u.status === 'banned' || u.banned
    const isSuspended = u.status === 'suspended' && u.suspended_until && new Date(u.suspended_until) > new Date()
    if (isBanned) return { label: 'Zablokowany', color: 'oklch(0.75 0.2 27)', bg: 'oklch(0.577 0.245 27.325 / 0.12)' }
    if (isSuspended) return { label: 'Zawieszony', color: 'oklch(0.82 0.17 50)', bg: 'oklch(0.82 0.17 50 / 0.1)' }
    return { label: 'Aktywny', color: 'var(--primary)', bg: 'oklch(0.65 0.18 142 / 0.1)' }
  }

  return (
    <div className="space-y-4">
      {selected && (
        <UserDetailModal
          user={selected}
          onClose={() => { setSelected(null); reload() }}
          onUpdated={u => { setSelected(u); setUsers(prev => prev.map(x => x.id === u.id ? u : x)) }}
        />
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Szukaj po nazwie, e-mailu, telefonie..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Button variant="outline" onClick={reload}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider" style={{ background: 'var(--secondary)' }}>
              <th className="px-4 py-2.5">Użytkownik</th>
              <th className="px-4 py-2.5">Telefon</th>
              <th className="px-4 py-2.5">Rejestracja</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Ładowanie...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">Brak użytkowników</td></tr>
            )}
            {filtered.map(u => {
              const status = getStatusInfo(u)
              const displayName = u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email
              return (
                <tr key={u.id} className="border-t border-border/60 hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: 'oklch(0.65 0.18 142 / 0.12)', color: 'var(--primary)' }}>
                        {displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{u.phone || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString('pl-PL')}</span>
                    {u.registered_via_app && (
                      <span className="ml-1 text-[9px] px-1 py-0.5 rounded" style={{ background: 'oklch(0.65 0.18 142 / 0.1)', color: 'var(--primary)' }}>App</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelected(u)}>
                      <UserCog className="w-3.5 h-3.5" />
                      Zarządzaj
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LicenseManageMenu({ license, onDone }: { license: XqLicense; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const btnRef = useRef<HTMLDivElement>(null)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setOpen(false)
    await action()
    onDone()
    setBusy(false)
  }

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setOpen(v => !v)
  }

  const isActive = license.status === 'active'
  const isSuspended = license.status === 'suspended'
  const isRevoked = license.status === 'revoked'

  return (
    <div className="relative" ref={btnRef}>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={handleOpen}
        className="flex items-center gap-1 pr-2"
      >
        <Settings2 className="w-3.5 h-3.5" />
        Zarządzaj
        <ChevronDown className="w-3 h-3 ml-0.5 text-muted-foreground" />
      </Button>

      {open && menuPos && createPortal(
        <>
          {/* backdrop to close on outside click */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 min-w-[180px] rounded-xl border shadow-lg overflow-hidden"
            style={{ background: 'var(--popover)', borderColor: 'var(--border)', top: menuPos.top, right: menuPos.right }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Akcje</p>
            </div>

            {isActive && (
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary/60 text-left cursor-pointer"
                style={{ color: 'oklch(0.82 0.17 50)' }}
                onClick={() => run(() => suspendLicense(license.id))}
              >
                <PauseCircle className="w-3.5 h-3.5 shrink-0" />
                Zawieś licencję
              </button>
            )}

            {isSuspended && (
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary/60 text-left cursor-pointer"
                style={{ color: 'var(--primary)' }}
                onClick={() => run(() => unsuspendLicense(license.id))}
              >
                <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                Cofnij zawieszenie
              </button>
            )}

            {isActive && (
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary/60 text-left cursor-pointer"
                style={{ color: 'oklch(0.75 0.2 27)' }}
                onClick={() => run(() => revokeLicense(license.id))}
              >
                <Ban className="w-3.5 h-3.5 shrink-0" />
                Unieważnij licencję
              </button>
            )}

            {isRevoked && (
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary/60 text-left cursor-pointer"
                style={{ color: 'var(--primary)' }}
                onClick={() => run(() => unrevokeLicense(license.id))}
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                Cofnij unieważnienie
              </button>
            )}

            {(isActive || isSuspended) && (
              <>
                <div className="h-px mx-2 my-1" style={{ background: 'var(--border)' }} />
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary/60 text-left cursor-pointer"
                  style={{ color: 'var(--foreground)' }}
                  onClick={() => run(() => extendLicense(license.id, 30))}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Przedłuż +30 dni
                </button>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

function LicensesTab() {
  const [licenses, setLicenses] = useState<XqLicense[]>([])
  const [users, setUsers] = useState<XqUser[]>([])
  const [selUser, setSelUser] = useState<string>('')
  const [plan, setPlan] = useState<'Free' | 'Pro'>('Pro')
  const [days, setDays] = useState(365)
  const [copied, setCopied] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    const [l, u] = await Promise.all([listLicenses(), listUsers()])
    setLicenses(l); setUsers(u)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  async function handleGenerate() {
    await generateLicense({ user_id: selUser || null, plan, days })
    reload()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteLicense(id)
    setDeleting(null)
    reload()
  }

  async function handleCopy(key: string) {
    try { await navigator.clipboard.writeText(key) } catch { /* noop */ }
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u])), [users])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1.2fr_auto_auto_auto] gap-2 p-3 rounded-xl"
        style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
        <select
          value={selUser}
          onChange={(e) => setSelUser(e.target.value)}
          className="flex h-9 w-full rounded-lg border px-3 text-sm"
          style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <option value="">— Bez przypisania —</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
        </select>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value as 'Free' | 'Pro')}
          className="flex h-9 rounded-lg border px-3 text-sm"
          style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <option value="Free">Plan Free</option>
          <option value="Pro">Plan Pro</option>
        </select>
        <Input type="number" value={days} onChange={(e) => setDays(parseInt(e.target.value) || 30)} className="w-24" placeholder="dni" />
        <Button variant="primary" onClick={handleGenerate}>
          <Key className="w-4 h-4" />
          Generuj klucz
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider" style={{ background: 'var(--secondary)' }}>
              <th className="px-4 py-2.5">Klucz</th>
              <th className="px-4 py-2.5">Plan</th>
              <th className="px-4 py-2.5">Użytkownik</th>
              <th className="px-4 py-2.5">Wygasa</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Ładowanie...</td></tr>}
            {!loading && licenses.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Brak licencji</td></tr>}
            {licenses.map((l) => {
              const u = l.user_id ? userMap[l.user_id] : null
              const left = daysUntil(l.expires_at)
              return (
                <tr key={l.id} className="border-t border-border/60 hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-foreground">{l.key}</span>
                      <button
                        onClick={() => handleCopy(l.key)}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {copied === l.key
                          ? <CheckCircle2 className="w-3 h-3 text-primary" />
                          : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={l.plan === 'Pro' ? 'default' : 'info'}>{l.plan}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={left < 30 ? 'text-destructive font-semibold' : 'text-foreground'}>
                      {left} dni
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {l.status === 'active' && <Badge variant="success">Aktywna</Badge>}
                    {l.status === 'suspended' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                        style={{ background: 'oklch(0.82 0.17 50 / 0.12)', color: 'oklch(0.82 0.17 50)' }}>
                        Zawieszona
                      </span>
                    )}
                    {l.status === 'revoked' && <Badge variant="danger">Unieważniona</Badge>}
                    {l.status === 'expired' && <Badge variant="outline">Wygasła</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <LicenseManageMenu license={l} onDone={reload} />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deleting === l.id}
                        onClick={() => handleDelete(l.id)}
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        title="Usuń licencję z widoku"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LogsTab() {
  const [logs, setLogs] = useState<XqAuditLog[]>([])
  const [loading, setLoading] = useState(true)

  async function reload() {
    setLoading(true)
    setLogs(await listLogs())
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Najnowsze 100 wpisów dziennika zdarzeń</p>
        <Button size="sm" variant="outline" onClick={reload}>
          <RefreshCw className="w-3.5 h-3.5" />
          Odśwież
        </Button>
      </div>
      <div className="rounded-xl p-3 font-mono text-[11px] max-h-[320px] overflow-y-auto"
        style={{ background: 'oklch(0.09 0 0)', border: '1px solid oklch(0.18 0 0)' }}>
        {loading && <p className="text-muted-foreground">Ładowanie...</p>}
        {!loading && logs.length === 0 && <p className="text-muted-foreground">Brak zdarzeń</p>}
        {logs.map((l) => (
          <p key={l.id} className={
            l.level === 'ERROR' ? 'text-destructive' :
            l.level === 'WARN' ? 'text-warning' :
            l.level === 'DEBUG' ? 'text-blue-400' : 'text-muted-foreground'
          }>
            [{new Date(l.created_at).toLocaleString('pl-PL')}] {l.level.padEnd(5)} — {l.message}
          </p>
        ))}
      </div>
    </div>
  )
}

function WazuhTab() {
  const [agents, setAgents] = useState<WazuhAgent[]>([])
  const [syncing, setSyncing] = useState(false)
  const [syncOk, setSyncOk] = useState(false)
  const [apiUrl, setApiUrl] = useState('https://wazuh.quasar.example.com/api')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    fetchAgentStatus().then(setAgents)
  }, [])

  async function handleSync() {
    setSyncing(true); setSyncOk(false)
    const ok = await forceSync()
    await writeLog('INFO', 'Wymuszono synchronizację z Wazuh Manager')
    await new Promise((r) => setTimeout(r, 700))
    setSyncing(false); setSyncOk(ok)
    setTimeout(() => setSyncOk(false), 2500)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Adres API Wazuh</label>
          <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} className="font-mono text-xs" />
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Token autoryzacyjny</label>
          <div className="relative">
            <Input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Wklej token..."
              className="pr-10 font-mono text-xs"
            />
            <button type="button" onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <Button variant={syncOk ? 'primary' : 'outline'} onClick={handleSync} disabled={syncing}>
        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Synchronizowanie...' : syncOk ? 'Zsynchronizowano!' : 'Wymuś synchronizację z Wazuh'}
      </Button>

      <div className="rounded-xl overflow-hidden border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider" style={{ background: 'var(--secondary)' }}>
              <th className="px-4 py-2.5">Agent</th>
              <th className="px-4 py-2.5">System</th>
              <th className="px-4 py-2.5">IP</th>
              <th className="px-4 py-2.5">Wersja</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id} className="border-t border-border/60 hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{a.os}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.ip}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{a.version}</td>
                <td className="px-4 py-3">
                  {a.status === 'active' && <Badge variant="success">Online</Badge>}
                  {a.status === 'disconnected' && <Badge variant="danger">Offline</Badge>}
                  {a.status === 'never_connected' && <Badge variant="outline">Nie połączony</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SettingsTab() {
  const [debugLogs, setDebugLogs] = useState(false)
  const [apiUrl, setApiUrl] = useState('https://api.quasar.example.com/v1')
  const [agentId, setAgentId] = useState('XQ-2026-PL-00142')
  const [realToken, setRealToken] = useState('')
  const [showToken, setShowToken] = useState(false)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Adres URL endpointu QUASAR API</label>
        <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://api.example.com/v1" />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Identyfikator agenta</label>
        <Input value={agentId} onChange={(e) => setAgentId(e.target.value)} className="font-mono" />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Token autoryzacyjny</label>
        <div className="relative">
          <Input
            type={showToken ? 'text' : 'password'}
            value={realToken}
            onChange={(e) => setRealToken(e.target.value)}
            className="pr-10 font-mono"
            placeholder="Wprowadź token..."
          />
          <button type="button" onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Rozszerzone logi debugowania</p>
          <p className="text-xs text-muted-foreground">Aktywne zdarzenia rejestrowane do Supabase</p>
        </div>
        <Switch checked={debugLogs} onCheckedChange={setDebugLogs} />
      </div>
      <Button variant="primary">Zapisz konfigurację</Button>
    </div>
  )
}

function OverviewTab() {
  const [users, setUsers] = useState<XqUser[]>([])
  const [licenses, setLicenses] = useState<XqLicense[]>([])
  const [logs, setLogs] = useState<XqAuditLog[]>([])

  useEffect(() => {
    Promise.all([listUsers(), listLicenses(), listLogs()]).then(([u, l, lg]) => {
      setUsers(u); setLicenses(l); setLogs(lg)
    })
  }, [])

  const active = users.filter(u => !u.banned).length
  const banned = users.filter(u => u.banned).length
  const proLic = licenses.filter(l => l.plan === 'Pro' && l.status === 'active').length
  const freeLic = licenses.filter(l => l.plan === 'Free' && l.status === 'active').length

  const trend = Array.from({ length: 14 }, (_, i) => ({
    d: i + 1,
    users: Math.max(0, users.length - 14 + i + Math.floor(Math.sin(i / 2) * 2)),
    events: Math.max(2, 8 + Math.floor(Math.sin(i / 1.5) * 4) + Math.floor(Math.random() * 3)),
  }))

  const logsByLevel = logs.reduce<Record<string, number>>((acc, l) => { acc[l.level] = (acc[l.level] ?? 0) + 1; return acc }, {})
  const logData = [
    { name: 'INFO', value: logsByLevel.INFO ?? 0, color: 'oklch(0.7 0.14 220)' },
    { name: 'WARN', value: logsByLevel.WARN ?? 0, color: 'oklch(0.82 0.17 85)' },
    { name: 'ERROR', value: logsByLevel.ERROR ?? 0, color: 'var(--destructive)' },
    { name: 'DEBUG', value: logsByLevel.DEBUG ?? 0, color: 'oklch(0.6 0.1 280)' },
  ].filter(d => d.value > 0)

  const stats = [
    { label: 'Użytkowników', value: users.length, sub: `${active} aktywnych`, hue: '142', icon: Users },
    { label: 'Aktywnych licencji', value: proLic + freeLic, sub: `${proLic} Pro · ${freeLic} Free`, hue: '220', icon: ShieldCheck },
    { label: 'Zablokowanych', value: banned, sub: banned > 0 ? 'wymagają uwagi' : 'brak', hue: '27', icon: Ban },
    { label: 'Zdarzeń (7d)', value: logs.length, sub: 'w dzienniku', hue: '60', icon: Activity },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="relative overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-3 slide-in" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20" style={{ background: `oklch(0.72 0.15 ${s.hue})` }} />
              <div className="relative flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `oklch(0.72 0.15 ${s.hue} / 0.12)` }}>
                  <Icon className="w-4 h-4" style={{ color: `oklch(0.72 0.15 ${s.hue})` }} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{s.sub}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Aktywność 14 dni</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }} />Użytkownicy</span>
              <span className="flex items-center gap-1 text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'oklch(0.7 0.14 220)' }} />Zdarzenia</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="adminUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="adminEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.7 0.14 220)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.7 0.14 220)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="d" tick={{ fontSize: 10, fill: 'oklch(0.48 0 0)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: 'oklch(0.14 0 0)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="events" stroke="oklch(0.7 0.14 220)" strokeWidth={1.8} fill="url(#adminEvents)" />
                <Area type="monotone" dataKey="users" stroke="var(--primary)" strokeWidth={2} fill="url(#adminUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rozkład logów</span>
          </div>
          <div className="relative" style={{ height: 140 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={logData} dataKey="value" innerRadius={38} outerRadius={62} paddingAngle={3} stroke="none">
                  {logData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-foreground tabular-nums">{logs.length}</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">zdarzeń</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {logData.map(d => (
              <div key={d.name} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
                <span className="text-[10px] font-bold text-foreground tabular-nums ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type ShopBadge = {
  id: string
  key: string
  name: string
  description: string
  icon: string
  cost: number
  category_tab: number
  hue: string
  active: boolean
}

const CATEGORY_LABELS_DEFAULT = ['Obrona', 'Łowiectwo', 'Elita']

const ICON_OPTIONS = [
  'Shield', 'ShieldCheck', 'Star', 'Crown', 'Target', 'Microscope', 'Swords', 'Ghost',
  'Flame', 'Zap', 'Award', 'Trophy', 'Skull', 'Bug', 'Cpu', 'Wifi', 'Gift', 'Key',
]

const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  Shield, ShieldCheck, Star, Crown, Target, Microscope, Swords, Ghost,
  Flame, Zap, Award, Trophy, Skull, Bug, Cpu, Wifi, Gift, Key,
}

function BadgeIconPreview({ icon, hue, size = 'md' }: { icon: string; hue: string; size?: 'sm' | 'md' }) {
  const Icon = ICON_COMPONENTS[icon] ?? Shield
  const s = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
  const ic = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  return (
    <div className={`${s} rounded-lg flex items-center justify-center shrink-0`}
      style={{ background: `oklch(0.65 0.18 ${hue} / 0.15)` }}>
      <Icon className={ic} style={{ color: `oklch(0.72 0.15 ${hue})` }} strokeWidth={1.8} />
    </div>
  )
}

function ShopTab() {
  const [badges, setBadges] = useState<ShopBadge[]>([])
  const [catLabels, setCatLabels] = useState<string[]>(CATEGORY_LABELS_DEFAULT)
  const [editingCat, setEditingCat] = useState<number | null>(null)
  const [catInput, setCatInput] = useState('')
  const [filterTab, setFilterTab] = useState<number | 'all'>('all')
  const [editingBadge, setEditingBadge] = useState<ShopBadge | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const [form, setForm] = useState({
    name: '', description: '', icon: 'Shield', cost: 100,
    category_tab: 1, hue: '142', active: true,
  })

  async function reload() {
    const { data } = await supabase.from('xq_badge_catalog').select('*').order('category_tab').order('created_at')
    if (data) setBadges(data as ShopBadge[])
  }
  useEffect(() => { reload() }, [])

  async function handleAdd() {
    if (!form.name.trim()) return
    await supabase.from('xq_badge_catalog').insert({
      key: form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      name: form.name.trim(),
      description: form.description.trim(),
      icon: form.icon,
      cost: form.cost,
      category_tab: form.category_tab,
      hue: form.hue,
      active: form.active,
    })
    setForm({ name: '', description: '', icon: 'Shield', cost: 100, category_tab: 1, hue: '142', active: true })
    reload()
  }

  async function handleSaveEdit() {
    if (!editingBadge) return
    await supabase.from('xq_badge_catalog').update({
      name: editingBadge.name,
      description: editingBadge.description,
      icon: editingBadge.icon,
      cost: editingBadge.cost,
      category_tab: editingBadge.category_tab,
      hue: editingBadge.hue,
      active: editingBadge.active,
    }).eq('id', editingBadge.id)
    setEditingBadge(null)
    reload()
  }

  async function handleDelete(id: string) {
    await supabase.from('xq_badge_catalog').delete().eq('id', id)
    reload()
  }

  async function handleToggleActive(id: string, v: boolean) {
    await supabase.from('xq_badge_catalog').update({ active: v }).eq('id', id)
    reload()
  }

  const filtered = filterTab === 'all' ? badges : badges.filter(b => b.category_tab === filterTab)

  return (
    <div className="space-y-4">
      {/* Category name editors */}
      <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Kategorie:</span>
        {[1, 2, 3].map(cat => (
          <div key={cat} className="flex items-center gap-1.5">
            {editingCat === cat ? (
              <>
                <input
                  value={catInput}
                  onChange={e => setCatInput(e.target.value)}
                  className="h-7 rounded-md border px-2 text-xs text-foreground"
                  style={{ background: 'var(--input)', borderColor: 'var(--border)', width: 120 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { const l = [...catLabels]; l[cat - 1] = catInput; setCatLabels(l); setEditingCat(null) }
                    if (e.key === 'Escape') setEditingCat(null)
                  }}
                  autoFocus
                />
                <button onClick={() => { const l = [...catLabels]; l[cat - 1] = catInput; setCatLabels(l); setEditingCat(null) }}
                  className="text-primary text-xs px-2 py-1 rounded-md hover:bg-primary/10">OK</button>
              </>
            ) : (
              <button onClick={() => { setEditingCat(cat); setCatInput(catLabels[cat - 1]) }}
                className="flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium transition-colors hover:bg-secondary"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                <span className="text-muted-foreground">{cat}.</span>
                {catLabels[cat - 1]}
                <Pencil className="w-2.5 h-2.5 text-muted-foreground ml-0.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add badge form */}
      <div className="p-3 rounded-xl space-y-2" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Dodaj odznakę</p>
        <div className="grid grid-cols-[1.2fr_1.8fr_auto] gap-2">
          <Input placeholder="Nazwa odznaki" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Opis" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="relative">
            <button
              onClick={() => setShowIconPicker(v => !v)}
              className="flex items-center gap-2 h-9 px-3 rounded-lg border text-sm transition-colors hover:bg-secondary"
              style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              <BadgeIconPreview icon={form.icon} hue={form.hue} size="sm" />
              <span className="text-xs">{form.icon}</span>
            </button>
            {showIconPicker && (
              <div className="absolute z-50 top-10 right-0 w-64 p-2 rounded-xl border shadow-lg grid grid-cols-6 gap-1"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                {ICON_OPTIONS.map(ic => {
                  const Ic = ICON_COMPONENTS[ic] ?? Shield
                  return (
                    <button key={ic} title={ic}
                      onClick={() => { setForm(f => ({ ...f, icon: ic })); setShowIconPicker(false) }}
                      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors"
                      style={{ background: form.icon === ic ? 'oklch(0.65 0.18 142 / 0.15)' : 'transparent' }}>
                      <Ic className="w-4 h-4" style={{ color: form.icon === ic ? 'var(--primary)' : 'var(--muted-foreground)' }} strokeWidth={1.8} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-[auto_auto_auto_auto_auto] gap-2 items-center">
          <Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: parseInt(e.target.value) || 0 }))} className="w-24" placeholder="koszt" />
          <select value={form.category_tab} onChange={e => setForm(f => ({ ...f, category_tab: parseInt(e.target.value) }))}
            className="flex h-9 rounded-lg border px-2 text-sm text-foreground"
            style={{ background: 'var(--input)', borderColor: 'var(--border)' }}>
            {[1, 2, 3].map(c => <option key={c} value={c}>{catLabels[c - 1]}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Kolor:</span>
            {['142', '220', '30', '280', '85', '330', '195', '60'].map(h => (
              <button key={h} onClick={() => setForm(f => ({ ...f, hue: h }))}
                className="w-5 h-5 rounded-full border-2 transition-all"
                style={{ background: `oklch(0.65 0.18 ${h})`, borderColor: form.hue === h ? 'var(--foreground)' : 'transparent' }} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
            <span className="text-xs text-muted-foreground">Aktywna</span>
          </div>
          <Button variant="primary" onClick={handleAdd} disabled={!form.name.trim()}>
            <Plus className="w-4 h-4" />Dodaj
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5">
        {(['all', 1, 2, 3] as const).map(t => (
          <button key={String(t)} onClick={() => setFilterTab(t)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              background: filterTab === t ? 'oklch(0.65 0.18 142 / 0.12)' : 'transparent',
              color: filterTab === t ? 'var(--primary)' : 'var(--muted-foreground)',
              border: `1px solid ${filterTab === t ? 'oklch(0.65 0.18 142 / 0.25)' : 'var(--border)'}`,
            }}>
            {t === 'all' ? 'Wszystkie' : `${t}. ${catLabels[t - 1]}`}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-muted-foreground">{filtered.length} odznak</span>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-3 gap-2">
        {filtered.length === 0 && <div className="col-span-3 py-8 text-center text-muted-foreground text-sm">Brak odznak</div>}
        {filtered.map(b => {
          const isEditing = editingBadge?.id === b.id
          if (isEditing && editingBadge) {
            return (
              <div key={b.id} className="relative overflow-hidden rounded-xl border bg-card/80 p-3 space-y-2"
                style={{ borderColor: 'oklch(0.65 0.18 142 / 0.35)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Edycja</span>
                  <button onClick={() => setEditingBadge(null)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
                <Input value={editingBadge.name} onChange={e => setEditingBadge(b => b ? { ...b, name: e.target.value } : b)} placeholder="Nazwa" />
                <Input value={editingBadge.description} onChange={e => setEditingBadge(b => b ? { ...b, description: e.target.value } : b)} placeholder="Opis" />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" value={editingBadge.cost} onChange={e => setEditingBadge(b => b ? { ...b, cost: parseInt(e.target.value) || 0 } : b)} placeholder="koszt" />
                  <select value={editingBadge.category_tab} onChange={e => setEditingBadge(b => b ? { ...b, category_tab: parseInt(e.target.value) } : b)}
                    className="flex h-9 rounded-lg border px-2 text-xs text-foreground"
                    style={{ background: 'var(--input)', borderColor: 'var(--border)' }}>
                    {[1, 2, 3].map(c => <option key={c} value={c}>{catLabels[c - 1]}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  {ICON_OPTIONS.map(ic => {
                    const Ic = ICON_COMPONENTS[ic] ?? Shield
                    return (
                      <button key={ic} onClick={() => setEditingBadge(b => b ? { ...b, icon: ic } : b)} title={ic}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-primary/10 transition-colors"
                        style={{ background: editingBadge.icon === ic ? 'oklch(0.65 0.18 142 / 0.15)' : 'transparent' }}>
                        <Ic className="w-3.5 h-3.5" style={{ color: editingBadge.icon === ic ? 'var(--primary)' : 'var(--muted-foreground)' }} strokeWidth={1.8} />
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-1">
                  {['142', '220', '30', '280', '85', '330', '195', '60'].map(h => (
                    <button key={h} onClick={() => setEditingBadge(b => b ? { ...b, hue: h } : b)}
                      className="w-5 h-5 rounded-full border-2 transition-all"
                      style={{ background: `oklch(0.65 0.18 ${h})`, borderColor: editingBadge.hue === h ? 'var(--foreground)' : 'transparent' }} />
                  ))}
                </div>
                <Button variant="primary" className="w-full" onClick={handleSaveEdit}>
                  <CheckCircle2 className="w-3.5 h-3.5" />Zapisz
                </Button>
              </div>
            )
          }
          return (
            <div key={b.id} className="relative overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-3">
              <div className="flex items-start gap-2 mb-2">
                <BadgeIconPreview icon={b.icon} hue={b.hue ?? '142'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{b.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{b.description || '—'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/60">
                    <Coins className="w-3 h-3" style={{ color: 'oklch(0.82 0.17 85)' }} />
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: 'oklch(0.82 0.17 85)' }}>{b.cost}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded text-muted-foreground border border-border/50">{catLabels[(b.category_tab ?? 1) - 1]}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={b.active} onCheckedChange={v => handleToggleActive(b.id, v)} />
                  <button onClick={() => setEditingBadge(b)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(b.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PointsTab() {
  const [users, setUsers] = useState<XqUser[]>([])
  const [points, setPoints] = useState<XqPoints[]>([])
  const [selUser, setSelUser] = useState('')
  const [amount, setAmount] = useState(50)
  const [reason, setReason] = useState('Bonus administracyjny')

  async function reload() {
    const [u, p] = await Promise.all([listUsers(), listAllPoints()])
    setUsers(u); setPoints(p)
  }
  useEffect(() => { reload() }, [])

  const ptsByUser = new Map(points.map(p => [p.user_id, p]))
  const totalBalance = points.reduce((s, p) => s + p.balance, 0)
  const totalLifetime = points.reduce((s, p) => s + p.lifetime, 0)

  async function handleAdjust(delta: number) {
    if (!selUser) return
    await adjustPoints(selUser, delta, reason || (delta >= 0 ? 'Dodano punkty' : 'Odjęto punkty'))
    reload()
  }

  const topUsers = [...users].map(u => ({ u, p: ptsByUser.get(u.id)?.balance ?? 0 })).sort((a, b) => b.p - a.p).slice(0, 5)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Saldo łączne', value: totalBalance, hue: '85' },
          { label: 'Punkty lifetime', value: totalLifetime, hue: '142' },
          { label: 'Aktywnych kont', value: points.filter(p => p.balance > 0).length, hue: '220' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `oklch(0.72 0.15 ${s.hue} / 0.12)` }}>
              <Coins className="w-5 h-5" style={{ color: `oklch(0.72 0.15 ${s.hue})` }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto_auto_auto_auto_1.4fr] gap-2 p-3 rounded-xl items-center" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
        <select value={selUser} onChange={e => setSelUser(e.target.value)}
          className="flex h-9 w-full rounded-lg border px-3 text-sm"
          style={{ background: 'var(--input)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
          <option value="">— Wybierz użytkownika —</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
        </select>
        <Input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="w-24" placeholder="ilość" />
        <Input placeholder="Powód" value={reason} onChange={e => setReason(e.target.value)} className="w-52" />
        <Button variant="primary" onClick={() => handleAdjust(amount)} disabled={!selUser || amount <= 0}>
          <Plus className="w-3.5 h-3.5" />Dodaj
        </Button>
        <Button variant="outline" onClick={() => handleAdjust(-amount)} disabled={!selUser || amount <= 0}>
          <Minus className="w-3.5 h-3.5" />Odejmij
        </Button>
        <div className="text-right text-[11px] text-muted-foreground">
          Wybrany: <span className="font-bold text-foreground tabular-nums">{selUser ? (ptsByUser.get(selUser)?.balance ?? 0) : '—'}</span> pkt
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Top 5 użytkowników</span>
          </div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <BarChart data={topUsers.map(t => ({ name: t.u.full_name.split(' ')[0], value: t.p }))} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'oklch(0.48 0 0)' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ background: 'oklch(0.14 0 0)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} cursor={{ fill: 'oklch(0.18 0 0)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="oklch(0.82 0.17 85)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/60 bg-muted/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Wszyscy użytkownicy</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {users.map(u => {
              const pts = ptsByUser.get(u.id)?.balance ?? 0
              return (
                <div key={u.id} className="flex items-center justify-between px-4 py-2 border-b border-border/40 hover:bg-secondary/30">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{u.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/60">
                    <Coins className="w-3 h-3" style={{ color: 'oklch(0.82 0.17 85)' }} />
                    <span className="text-xs font-bold tabular-nums" style={{ color: 'oklch(0.82 0.17 85)' }}>{pts}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function RemoteTab() {
  const [sessions, setSessions] = useState<XqRemoteSession[]>([])
  const [users, setUsers] = useState<XqUser[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<{ t: number; v: number }[]>(
    Array.from({ length: 20 }, (_, i) => ({ t: i, v: 20 + Math.random() * 40 }))
  )

  async function reload() {
    const [s, u] = await Promise.all([listRemoteSessions(), listUsers()])
    setSessions(s); setUsers(u)
  }
  useEffect(() => { reload() }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setMetrics(prev => {
        const last = prev[prev.length - 1]
        return [...prev.slice(1), { t: (last?.t ?? 0) + 1, v: Math.max(8, Math.min(92, (last?.v ?? 40) + (Math.random() - 0.5) * 18)) }]
      })
    }, 900)
    return () => clearInterval(id)
  }, [])

  const userMap = new Map(users.map(u => [u.id, u]))
  const selectedSession = sessions.find(s => s.id === selected) ?? null
  const selectedUser = selectedSession ? userMap.get(selectedSession.user_id) : null
  const activeCount = sessions.filter(s => s.enabled).length

  async function handleToggle(s: XqRemoteSession, v: boolean) {
    await setRemoteEnabled(s.id, v)
    reload()
  }

  return (
    <div className="grid grid-cols-[1fr_1.4fr] gap-3">
      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sesje zdalne</span>
          <Badge variant={activeCount > 0 ? 'success' : 'outline'}>{activeCount} aktywne</Badge>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {sessions.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">Brak sesji</div>}
          {sessions.map(s => {
            const u = userMap.get(s.user_id)
            const isSel = selected === s.id
            return (
              <button key={s.id} onClick={() => setSelected(s.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 border-b border-border/40 transition-colors text-left ${isSel ? 'bg-primary/8' : 'hover:bg-secondary/30'}`}
                style={isSel ? { borderLeft: '2px solid var(--primary)' } : undefined}>
                <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 relative"
                  style={{ background: s.enabled ? 'oklch(0.65 0.18 142 / 0.15)' : 'var(--muted)' }}>
                  <Monitor className="w-3.5 h-3.5" style={{ color: s.enabled ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                  {s.enabled && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full glow-pulse" style={{ background: 'var(--primary)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{u?.full_name ?? '—'}</p>
                  <p className="text-[10px] text-muted-foreground truncate font-mono">{u?.agent_id ?? s.user_id.slice(0, 8)}</p>
                </div>
                <Switch checked={s.enabled} onCheckedChange={(v) => handleToggle(s, v)} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Podgląd zdalnego pulpitu</span>
          </div>
          {selectedSession?.enabled && <Badge variant="success">Połączono</Badge>}
        </div>

        <div className="relative flex-1 min-h-[320px]" style={{ background: 'oklch(0.08 0 0)' }}>
          {/* Fake desktop preview */}
          {!selectedSession || !selectedSession.enabled ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <ShieldOff className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-semibold text-foreground">{selectedSession ? 'Sesja wyłączona' : 'Wybierz sesję z listy'}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {selectedSession ? 'Włącz zdalny dostęp przełącznikiem' : 'Kliknij użytkownika po lewej stronie'}
              </p>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 40%, oklch(0.65 0.18 142 / 0.04), transparent 70%)' }} />
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'oklch(0.82 0.17 85)' }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="ml-2 text-[10px] font-mono text-muted-foreground truncate">
                    {selectedUser?.full_name} · {selectedUser?.agent_id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-md p-2 border border-border/60" style={{ background: 'oklch(0.12 0 0)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">CPU</p>
                    <div style={{ height: 50 }}>
                      <ResponsiveContainer>
                        <AreaChart data={metrics}>
                          <defs>
                            <linearGradient id="rcpuG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={1.5} fill="url(#rcpuG)" isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs font-bold text-foreground tabular-nums">{Math.round(metrics[metrics.length - 1]?.v ?? 0)}%</p>
                  </div>
                  <div className="rounded-md p-2 border border-border/60" style={{ background: 'oklch(0.12 0 0)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Sieć</p>
                    <div style={{ height: 50 }}>
                      <ResponsiveContainer>
                        <AreaChart data={metrics.map(m => ({ t: m.t, v: 100 - m.v }))}>
                          <defs>
                            <linearGradient id="rnetG" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="oklch(0.7 0.14 220)" stopOpacity={0.5} />
                              <stop offset="100%" stopColor="oklch(0.7 0.14 220)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="v" stroke="oklch(0.7 0.14 220)" strokeWidth={1.5} fill="url(#rnetG)" isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs font-bold text-foreground tabular-nums">{Math.round(100 - (metrics[metrics.length - 1]?.v ?? 0))} Mb/s</p>
                  </div>
                </div>

                <div className="rounded-md p-3 border border-border/60 font-mono text-[10px] space-y-0.5" style={{ background: 'oklch(0.1 0 0)' }}>
                  <p className="text-muted-foreground">[OK] Sesja SSH ustanowiona — agent {selectedUser?.agent_id}</p>
                  <p className="text-primary">[OK] Szyfrowanie AES-256-GCM aktywne</p>
                  <p className="text-muted-foreground">[INFO] Uprawnienia: odczyt / zapis / zarządzanie</p>
                  <p className="text-muted-foreground">[INFO] Ostatnia aktywność: {new Date().toLocaleTimeString('pl-PL')}</p>
                  <p className="text-primary">_<span className="animate-pulse">|</span></p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-t border-border/60 bg-muted/20">
          <Button size="sm" variant="outline" disabled={!selectedSession?.enabled}>
            <Activity className="w-3 h-3" />Akcje
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedSession?.enabled}>
            <Terminal className="w-3 h-3" />Konsola
          </Button>
          <div className="ml-auto">
            <Button size="sm" variant={selectedSession?.enabled ? 'destructive' : 'primary'}
              disabled={!selectedSession}
              onClick={() => selectedSession && handleToggle(selectedSession, !selectedSession.enabled)}>
              <Power className="w-3 h-3" />{selectedSession?.enabled ? 'Rozłącz' : 'Połącz'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CodesTab() {
  const [codes, setCodes] = useState<XqActivationCode[]>([])
  const [users, setUsers] = useState<XqUser[]>([])
  const [plan, setPlan] = useState<'Free' | 'Pro'>('Pro')
  const [days, setDays] = useState(365)
  const [expDays, setExpDays] = useState(30)
  const [copied, setCopied] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    const [{ data: codesData }, fetchedUsers] = await Promise.all([
      supabase.from('xq_activation_codes').select('*').order('created_at', { ascending: false }),
      listUsers(),
    ])
    setCodes((codesData ?? []) as XqActivationCode[])
    setUsers(fetchedUsers)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  const userMap = useMemo(() => {
    const m = new Map<string, XqUser>()
    for (const u of users) m.set(u.id, u)
    return m
  }, [users])

  async function handleGenerate() {
    const code = generateKey()
    await supabase.from('xq_activation_codes').insert({
      code,
      plan,
      duration_days: days,
      used: false,
      code_expires_at: new Date(Date.now() + expDays * 86400_000).toISOString(),
    })
    await writeLog('INFO', `Wygenerowano kod aktywacyjny ${plan} na ${days} dni`)
    reload()
  }

  async function handleDelete(id: string) {
    await supabase.from('xq_activation_codes').delete().eq('id', id)
    reload()
  }

  async function handleRevoke(c: XqActivationCode) {
    if (revoking) return
    setRevoking(c.id)
    await supabase.from('xq_activation_codes')
      .update({ used: false, used_at: null, used_by: null })
      .eq('id', c.id)
    await writeLog('WARN', `Cofnięto aktywację kodu ${c.code.slice(0, 8)} (użytkownik: ${c.used_by ?? 'nieznany'})`)
    setCodes(prev => prev.map(x => x.id === c.id ? { ...x, used: false, used_at: null, used_by: null } : x))
    setRevoking(null)
  }

  async function handleCopy(code: string) {
    try { await navigator.clipboard.writeText(code) } catch { /* noop */ }
    setCopied(code)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[auto_auto_auto_auto] gap-2 p-3 rounded-xl items-center"
        style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
        <select value={plan} onChange={e => setPlan(e.target.value as 'Free' | 'Pro')}
          className="flex h-9 rounded-lg border px-3 text-sm text-foreground"
          style={{ background: 'var(--input)', borderColor: 'var(--border)' }}>
          <option value="Free">Plan Free</option>
          <option value="Pro">Plan Pro</option>
        </select>
        <div className="flex items-center gap-2">
          <Input type="number" value={days} onChange={e => setDays(parseInt(e.target.value) || 30)} className="w-24" placeholder="dni licencji" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">dni licencji</span>
        </div>
        <div className="flex items-center gap-2">
          <Input type="number" value={expDays} onChange={e => setExpDays(parseInt(e.target.value) || 7)} className="w-20" placeholder="ważność" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">dni ważności kodu</span>
        </div>
        <Button variant="primary" onClick={handleGenerate}>
          <Key className="w-4 h-4" />
          Generuj kod
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider" style={{ background: 'var(--secondary)' }}>
              <th className="px-4 py-2.5">Kod</th>
              <th className="px-4 py-2.5">Plan</th>
              <th className="px-4 py-2.5">Licencja</th>
              <th className="px-4 py-2.5">Aktywował</th>
              <th className="px-4 py-2.5">Wygaśnięcie kodu</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Ładowanie...</td></tr>}
            {!loading && codes.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Brak kodów</td></tr>}
            {codes.map(c => {
              const exp = (c.code_expires_at ?? (c as any).expires_at) ? daysUntil((c.code_expires_at ?? (c as any).expires_at)!) : null
              const activatedUser = c.used_by ? (userMap.get(c.used_by) ?? null) : null
              return (
                <tr key={c.id} className="border-t border-border/60 hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{c.code}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.plan === 'Pro' ? 'default' : 'info'}>{c.plan}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">{c.duration_days} dni</td>
                  <td className="px-4 py-3 text-xs">
                    {c.used ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-foreground">
                          {activatedUser ? activatedUser.full_name : c.used_by ? c.used_by.slice(0, 16) : 'Nieznany użytkownik'}
                        </span>
                        {activatedUser && <span className="text-muted-foreground">{activatedUser.email}</span>}
                        {c.used_at && <span className="text-muted-foreground">{new Date(c.used_at).toLocaleDateString('pl-PL')}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {exp !== null
                      ? <span className={exp < 3 ? 'text-destructive font-semibold' : 'text-foreground'}>{exp} dni</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.used ? <Badge variant="outline">Użyty</Badge> : <Badge variant="success">Aktywny</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => handleCopy(c.code)} disabled={c.used}>
                        {copied === c.code ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                      {c.used && (
                        <Button size="sm" variant="outline" onClick={() => handleRevoke(c)} disabled={revoking === c.id}
                          title="Cofnij aktywację — użytkownik traci licencję">
                          <Ban className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ChatsTab({ adminName, adminRole }: { adminName: string; adminRole: AdminRole }) {
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function reload() {
    const { data } = await supabase
      .from('xq_support_messages')
      .select('*')
      .order('created_at', { ascending: true })

    const msgs = (data ?? []) as SupportMessage[]

    const grouped = new Map<string, SupportMessage[]>()
    for (const m of msgs) {
      const key = (m as any).owner_id ?? 'unknown'
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(m)
    }

    const convs: SupportConversation[] = Array.from(grouped.entries()).map(([oid, msgs]) => ({
      user_id: oid,
      owner_email: oid === DEMO_OWNER_ID ? 'jan.kowalski@example.com' : oid.slice(0, 8),
      messages: msgs,
      last_message: msgs[msgs.length - 1]?.content ?? '',
      unread: msgs.filter(m => m.sender === 'user').length,
    }))
    setConversations(convs)
    if (!selected && convs.length > 0) setSelected(convs[0].user_id)
  }

  useEffect(() => { reload() }, [])

  const current = conversations.find(c => c.user_id === selected) ?? null

  async function handleClearConversation() {
    if (!selected || clearing) return
    setClearing(true)
    await supabase.from('xq_support_messages').delete().eq('owner_id', selected)
    setSelected(null)
    await reload()
    setClearing(false)
  }

  async function handleClearAll() {
    if (clearing) return
    setClearing(true)
    await supabase.from('xq_support_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    setSelected(null)
    setConversations([])
    setClearing(false)
  }

  async function handleReply() {
    if (!reply.trim() || !selected || sending) return
    setSending(true)
    await supabase.from('xq_support_messages').insert({
      owner_id: selected,
      sender: 'admin',
      content: reply.trim(),
      sender_name: adminName,
      sender_role: adminRole,
    })
    setReply('')
    await reload()
    setSending(false)
  }

  return (
    <div className="grid grid-cols-[280px_1fr] gap-3 h-[480px]">
      {/* Conversation list */}
      <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Konwersacje ({conversations.length})
          </span>
          {conversations.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              title="Wyczyść wszystkie czaty"
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
              <Trash2 className="w-3 h-3" />
              Wyczyść wszystko
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Brak wiadomości</p>
            </div>
          )}
          {conversations.map(c => (
            <button key={c.user_id}
              onClick={() => setSelected(c.user_id)}
              className="w-full text-left px-3 py-2.5 border-b border-border/40 hover:bg-secondary/30 transition-colors"
              style={selected === c.user_id ? { background: 'oklch(0.65 0.18 142 / 0.08)', borderLeft: '2px solid var(--primary)' } : undefined}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'oklch(0.65 0.18 142 / 0.15)', color: 'var(--primary)' }}>
                  {c.owner_email.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{c.owner_email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.last_message || 'Brak wiadomości'}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{c.messages.length} msg</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden flex flex-col">
        {!current ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Wybierz konwersację
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-muted/20">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground flex-1">{current.owner_email}</span>
              <button
                onClick={handleClearConversation}
                disabled={clearing}
                title="Wyczyść tę konwersację"
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50">
                <Trash2 className="w-3 h-3" />
                Wyczyść
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {current.messages.map(m => {
                const isUser = m.sender === 'user'
                return (
                  <div key={m.id} className={`flex gap-2 ${isUser ? '' : 'flex-row-reverse'}`}>
                    <div className="max-w-[75%] flex flex-col gap-0.5">
                      {!isUser && (m.sender_name || m.admin_name) && (
                        <div className={`flex items-center gap-1 px-1 ${isUser ? '' : 'justify-end'}`}>
                          <span className="text-[10px] font-semibold" style={{ color: 'oklch(0.7 0.14 220)' }}>{m.sender_name || m.admin_name}</span>
                          {(m.sender_role || m.admin_role) && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded uppercase"
                              style={{ background: (m.sender_role || m.admin_role) === 'CEO' ? 'oklch(0.82 0.17 85 / 0.15)' : 'oklch(0.7 0.14 220 / 0.15)', color: (m.sender_role || m.admin_role) === 'CEO' ? 'oklch(0.82 0.17 85)' : 'oklch(0.7 0.14 220)' }}>
                              {m.sender_role || m.admin_role}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="rounded-xl px-3 py-2 text-xs text-foreground"
                        style={{
                          background: isUser ? 'var(--secondary)' : 'oklch(0.7 0.14 220 / 0.1)',
                          border: `1px solid ${isUser ? 'var(--border)' : 'oklch(0.7 0.14 220 / 0.2)'}`,
                        }}>
                        {m.content}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-2 p-3 border-t border-border/60">
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReply()}
                placeholder={`Odpowiedz jako ${adminName} (${adminRole})...`}
                className="flex-1 h-9 rounded-lg border px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
                style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
              />
              <Button size="sm" variant="primary" onClick={handleReply} disabled={!reply.trim() || sending}>
                <Send className="w-3.5 h-3.5" />
                Wyślij
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AdministratorsTab({ currentRole }: { currentRole: AdminRole }) {
  const [admins, setAdmins] = useState<XqAdministrator[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<AdminRole>('Admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)

  async function reload() {
    setLoading(true)
    const { data } = await supabase
      .from('xq_administrators')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })
    setAdmins((data ?? []) as XqAdministrator[])
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  async function handleAdd() {
    if (!email.trim() || !password.trim()) return
    await supabase.from('xq_administrators').insert({
      email: email.trim(),
      full_name: name.trim() || email.trim().split('@')[0],
      role,
      password,
    })
    await writeLog('INFO', `Dodano administratora ${email} (${role})`)
    setEmail(''); setName(''); setPassword('')
    reload()
  }

  async function handleDelete(id: string) {
    await supabase.from('xq_administrators').delete().eq('id', id)
    reload()
  }

  return (
    <div className="space-y-4">
      {currentRole !== 'CEO' && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
          <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
          <span className="text-muted-foreground">Tylko CEO może dodawać i usuwać administratorów.</span>
        </div>
      )}

      {currentRole === 'CEO' && (
        <div className="grid grid-cols-[1fr_1fr_auto_1.4fr_auto] gap-2 p-3 rounded-xl"
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
          <Input placeholder="Imię i nazwisko" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="adres@email.pl" value={email} onChange={e => setEmail(e.target.value)} type="email" />
          <select value={role} onChange={e => setRole(e.target.value as AdminRole)}
            className="flex h-9 rounded-lg border px-3 text-sm text-foreground"
            style={{ background: 'var(--input)', borderColor: 'var(--border)' }}>
            <option value="Admin">Admin</option>
            <option value="CEO">CEO</option>
          </select>
          <Input placeholder="Hasło" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <Button variant="primary" onClick={handleAdd} disabled={!email.trim() || !password.trim()}>
            <PlusCircle className="w-4 h-4" />
            Dodaj
          </Button>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider" style={{ background: 'var(--secondary)' }}>
              <th className="px-4 py-2.5">Administrator</th>
              <th className="px-4 py-2.5">Rola</th>
              <th className="px-4 py-2.5">Dodany</th>
              {currentRole === 'CEO' && <th className="px-4 py-2.5 text-right">Akcje</th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Ładowanie...</td></tr>}
            {!loading && admins.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Brak administratorów</td></tr>}
            {admins.map(a => (
              <tr key={a.id} className="border-t border-border/60 hover:bg-secondary/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{ background: a.role === 'CEO' ? 'oklch(0.82 0.17 85 / 0.15)' : 'oklch(0.7 0.14 220 / 0.15)', color: a.role === 'CEO' ? 'oklch(0.82 0.17 85)' : 'oklch(0.7 0.14 220)' }}>
                      {a.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{a.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {a.role === 'CEO' && <Crown className="w-3.5 h-3.5" style={{ color: 'oklch(0.82 0.17 85)' }} />}
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md"
                      style={{
                        background: a.role === 'CEO' ? 'oklch(0.82 0.17 85 / 0.15)' : 'oklch(0.7 0.14 220 / 0.15)',
                        color: a.role === 'CEO' ? 'oklch(0.82 0.17 85)' : 'oklch(0.7 0.14 220)',
                      }}>
                      {a.role}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString('pl-PL')}
                </td>
                {currentRole === 'CEO' && (
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminPanel() {
  const [unlocked, setUnlocked] = useState(false)
  const [adminInfo, setAdminInfo] = useState<{ name: string; role: AdminRole } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [logging, setLogging] = useState(false)
  const [tab, setTab] = useState<'overview' | 'users' | 'licenses' | 'codes' | 'shop' | 'points' | 'chats' | 'admins' | 'remote' | 'wazuh' | 'logs' | 'settings'>('overview')

  async function handleUnlock() {
    if (!email.trim() || !password.trim()) return
    setLogging(true)
    setError(null)

    const { data } = await supabase
      .from('xq_administrators')
      .select('full_name, role, password')
      .eq('email', email.trim())
      .maybeSingle()

    setLogging(false)

    if (!data) {
      setError('Nie znaleziono administratora o tym adresie e-mail.')
      return
    }
    if (data.role !== 'Admin' && data.role !== 'CEO') {
      setError('Brak uprawnień administracyjnych.')
      return
    }
    if (data.password !== password) {
      setError('Nieprawidłowe hasło.')
      setTimeout(() => setError(null), 2500)
      return
    }

    setAdminInfo({ name: data.full_name, role: data.role as AdminRole })
    setUnlocked(true)
    setEmail('')
    setPassword('')
    writeLog('INFO', `Panel administratora odblokowany przez ${data.full_name} (${data.role})`)
  }

  if (!unlocked) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full p-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 40%, oklch(0.65 0.18 142 / 0.04) 0%, transparent 70%)' }} />
        <div className="relative w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl blur-3xl opacity-50" style={{ background: 'oklch(0.48 0 0)' }} />
              <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, oklch(0.2 0 0), oklch(0.16 0 0))', border: '1px solid oklch(0.25 0 0)', boxShadow: '0 8px 32px oklch(0 0 0 / 0.5)' }}>
                <ShieldOff className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground text-center mb-2">Panel administratora</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Zaloguj się jako administrator lub CEO QUASAR.
          </p>
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                placeholder="adres@email.pl"
                className="flex h-10 w-full rounded-lg border px-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2"
                style={{ background: 'var(--input)', borderColor: error ? 'var(--destructive)' : 'var(--border)' } as React.CSSProperties}
              />
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                placeholder="Hasło administratora"
                className="flex h-10 w-full rounded-lg border px-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2"
                style={{ background: 'var(--input)', borderColor: error ? 'var(--destructive)' : 'var(--border)' } as React.CSSProperties}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
            <Button variant="primary" className="w-full" onClick={handleUnlock} disabled={logging || !email.trim() || !password.trim()}>
              <LockOpen className="w-4 h-4" />
              {logging ? 'Logowanie...' : 'Zaloguj się'}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-6">
            Dostęp tylko dla upoważnionych administratorów systemu QUASAR.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-5 h-full overflow-y-auto">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Panel administratora</h2>
          <p className="text-xs text-muted-foreground">Zalogowany jako {adminInfo?.name} ({adminInfo?.role})</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/10">
            {adminInfo?.role === 'CEO'
              ? <Crown className="w-3 h-3 text-primary" />
              : <LockOpen className="w-3 h-3 text-primary" />}
            <span className="text-[11px] text-primary font-medium">{adminInfo?.role} · aktywny</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setUnlocked(false); setAdminInfo(null) }}>
            <Lock className="w-3.5 h-3.5" />
            Wyloguj
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <Tab id="overview" label="Pulpit" icon={LayoutDashboard} active={tab === 'overview'} onClick={() => setTab('overview')} />
        <Tab id="users" label="Użytkownicy" icon={Users} active={tab === 'users'} onClick={() => setTab('users')} />
        <Tab id="licenses" label="Licencje" icon={Key} active={tab === 'licenses'} onClick={() => setTab('licenses')} />
        <Tab id="codes" label="Kody aktyw." icon={Key} active={tab === 'codes'} onClick={() => setTab('codes')} />
        <Tab id="shop" label="Sklep / Odznaki" icon={Gift} active={tab === 'shop'} onClick={() => setTab('shop')} />
        <Tab id="points" label="Punkty" icon={Coins} active={tab === 'points'} onClick={() => setTab('points')} />
        <Tab id="chats" label="Czaty" icon={MessageSquare} active={tab === 'chats'} onClick={() => setTab('chats')} />
        <Tab id="admins" label="Administratorzy" icon={UserCog} active={tab === 'admins'} onClick={() => setTab('admins')} />
        <Tab id="remote" label="Zdalny dostęp" icon={Monitor} active={tab === 'remote'} onClick={() => setTab('remote')} />
        <Tab id="wazuh" label="Wazuh / Agenci" icon={Activity} active={tab === 'wazuh'} onClick={() => setTab('wazuh')} />
        <Tab id="logs" label="Logi" icon={Terminal} active={tab === 'logs'} onClick={() => setTab('logs')} />
        <Tab id="settings" label="Konfiguracja API" icon={Server} active={tab === 'settings'} onClick={() => setTab('settings')} />
      </div>

      {tab === 'overview' && <Section title="Przegląd systemu" icon={LayoutDashboard}><OverviewTab /></Section>}
      {tab === 'users' && <Section title="Zarządzanie użytkownikami" icon={Users}><UsersTab /></Section>}
      {tab === 'licenses' && <Section title="Licencje i klucze" icon={ShieldCheck}><LicensesTab /></Section>}
      {tab === 'codes' && <Section title="Kody aktywacyjne" icon={Key}><CodesTab /></Section>}
      {tab === 'shop' && <Section title="Sklep / Zarządzanie odznakami" icon={Gift}><ShopTab /></Section>}
      {tab === 'points' && <Section title="Zarządzanie punktami" icon={Coins}><PointsTab /></Section>}
      {tab === 'chats' && <Section title="Czaty wsparcia" icon={MessageSquare}><ChatsTab adminName={adminInfo?.name ?? 'Admin'} adminRole={adminInfo?.role ?? 'Admin'} /></Section>}
      {tab === 'admins' && <Section title="Administratorzy systemu" icon={UserCog}><AdministratorsTab currentRole={adminInfo?.role ?? 'Admin'} /></Section>}
      {tab === 'remote' && <Section title="Zdalny dostęp do urządzeń" icon={Monitor}><RemoteTab /></Section>}
      {tab === 'wazuh' && <Section title="Integracja z Wazuh" icon={Activity}><WazuhTab /></Section>}
      {tab === 'logs' && <Section title="Dziennik zdarzeń" icon={Terminal}><LogsTab /></Section>}
      {tab === 'settings' && <Section title="Konfiguracja API QUASAR" icon={Server}><SettingsTab /></Section>}
    </div>
  )
}
