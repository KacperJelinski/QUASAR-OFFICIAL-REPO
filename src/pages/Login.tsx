import { useState } from 'react'
import { Shield, Mail, Lock, User, Phone, Eye, EyeOff, TriangleAlert as AlertTriangle, Clock } from 'lucide-react'
import { loginUser, registerUser, storeUserId } from '../services/authService'
import type { AppUser } from '../services/authService'

interface LoginProps {
  onLogin: (user: AppUser) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', { dateStyle: 'long', timeStyle: 'short' })
}

export function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{
    type: 'error' | 'banned' | 'suspended'
    message: string
    details?: { suspended_until?: string; suspension_reason?: string; suspended_by?: string; banned_by?: string }
  } | null>(null)
  const [success, setSuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await loginUser(email, password)
    setLoading(false)
    if (result.ok) {
      storeUserId(result.user.id)
      onLogin(result.user)
    } else if (result.reason === 'banned') {
      setError({ type: 'banned', message: 'Konto zostało zablokowane.', details: { banned_by: result.banned_by } })
    } else if (result.reason === 'suspended') {
      setError({
        type: 'suspended',
        message: 'Konto zostało zawieszone.',
        details: {
          suspended_until: result.suspended_until,
          suspension_reason: result.suspension_reason,
          suspended_by: result.suspended_by,
        },
      })
    } else {
      setError({ type: 'error', message: 'Nieprawidłowy adres e-mail lub hasło.' })
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess('')
    if (!firstName.trim() || !lastName.trim()) {
      setError({ type: 'error', message: 'Podaj imię i nazwisko.' })
      return
    }
    if (!phone.trim()) {
      setError({ type: 'error', message: 'Podaj numer telefonu.' })
      return
    }
    if (password.length < 6) {
      setError({ type: 'error', message: 'Hasło musi mieć minimum 6 znaków.' })
      return
    }
    setLoading(true)
    const result = await registerUser({ first_name: firstName, last_name: lastName, email, phone, password })
    setLoading(false)
    if (result.ok && result.user) {
      storeUserId(result.user.id)
      onLogin(result.user)
    } else {
      setError({ type: 'error', message: result.message })
    }
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center overflow-hidden relative"
      style={{ background: 'oklch(0.1 0 0)' }}>
      {/* Ambient glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-[120px] opacity-10"
          style={{ background: 'var(--primary)' }} />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full blur-[100px] opacity-8"
          style={{ background: 'oklch(0.65 0.18 220)' }} />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 relative"
            style={{ background: 'oklch(0.65 0.18 142 / 0.15)', border: '1px solid oklch(0.65 0.18 142 / 0.35)', boxShadow: '0 0 32px oklch(0.65 0.18 142 / 0.2)' }}>
            <Shield className="w-8 h-8 text-primary" />
            <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.06)' }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">QUASAR</h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">Antivirus Pro</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'oklch(0.135 0 0)', borderColor: 'oklch(0.22 0 0)', boxShadow: '0 24px 64px oklch(0 0 0 / 0.5)' }}>
          {/* Tab switcher */}
          <div className="flex border-b" style={{ borderColor: 'oklch(0.22 0 0)' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m}
                onClick={() => { setMode(m); setError(null); setSuccess('') }}
                className="flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                style={{
                  color: mode === m ? 'var(--primary)' : 'var(--muted-foreground)',
                  borderBottom: mode === m ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-1px',
                  background: mode === m ? 'oklch(0.65 0.18 142 / 0.04)' : 'transparent',
                }}>
                {m === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Error/Block message */}
            {error && (
              <div className="mb-4 rounded-xl p-3.5 border"
                style={{
                  background: error.type === 'error'
                    ? 'oklch(0.577 0.245 27.325 / 0.08)'
                    : 'oklch(0.6 0.2 30 / 0.1)',
                  borderColor: error.type === 'error'
                    ? 'oklch(0.577 0.245 27.325 / 0.3)'
                    : 'oklch(0.6 0.2 30 / 0.4)',
                }}>
                <div className="flex items-start gap-2.5">
                  {error.type === 'suspended' ? (
                    <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'oklch(0.7 0.2 50)' }} />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: error.type === 'suspended' ? 'oklch(0.7 0.2 50)' : 'oklch(0.75 0.2 27)' }}>
                      {error.message}
                    </p>
                    {error.type === 'banned' && error.details?.banned_by && (
                      <p className="text-xs text-muted-foreground mt-1">Zablokowane przez: <span className="font-semibold text-foreground">{error.details.banned_by}</span></p>
                    )}
                    {error.type === 'suspended' && error.details && (
                      <div className="space-y-0.5 mt-1.5">
                        {error.details.suspended_by && (
                          <p className="text-xs text-muted-foreground">Zawieszone przez: <span className="font-semibold text-foreground">{error.details.suspended_by}</span></p>
                        )}
                        {error.details.suspension_reason && (
                          <p className="text-xs text-muted-foreground">Powód: <span className="font-semibold text-foreground">{error.details.suspension_reason}</span></p>
                        )}
                        {error.details.suspended_until && (
                          <p className="text-xs text-muted-foreground">Do: <span className="font-semibold text-foreground">{formatDate(error.details.suspended_until)}</span></p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-xl p-3 border text-sm font-medium"
                style={{ background: 'oklch(0.65 0.18 142 / 0.08)', borderColor: 'oklch(0.65 0.18 142 / 0.3)', color: 'var(--primary)' }}>
                {success}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Adres e-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="twoj@email.pl"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors"
                      style={{ background: 'oklch(0.16 0 0)', borderColor: 'oklch(0.25 0 0)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Hasło</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border outline-none transition-colors"
                      style={{ background: 'oklch(0.16 0 0)', borderColor: 'oklch(0.25 0 0)', color: 'var(--foreground)' }}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold mt-1 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 0 20px oklch(0.65 0.18 142 / 0.3)' }}>
                  {loading ? 'Logowanie...' : 'Zaloguj się'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Imię</label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Jan"
                        required
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm border outline-none"
                        style={{ background: 'oklch(0.16 0 0)', borderColor: 'oklch(0.25 0 0)', color: 'var(--foreground)' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Nazwisko</label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Kowalski"
                        required
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm border outline-none"
                        style={{ background: 'oklch(0.16 0 0)', borderColor: 'oklch(0.25 0 0)', color: 'var(--foreground)' }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Numer telefonu</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="000 000 000"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none"
                      style={{ background: 'oklch(0.16 0 0)', borderColor: 'oklch(0.25 0 0)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Adres e-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="twoj@email.pl"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none"
                      style={{ background: 'oklch(0.16 0 0)', borderColor: 'oklch(0.25 0 0)', color: 'var(--foreground)' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Hasło</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 6 znaków"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border outline-none"
                      style={{ background: 'oklch(0.16 0 0)', borderColor: 'oklch(0.25 0 0)', color: 'var(--foreground)' }}
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold mt-1 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 0 20px oklch(0.65 0.18 142 / 0.3)' }}>
                  {loading ? 'Tworzenie konta...' : 'Stwórz konto'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-5">
          QUASAR Antivirus Pro &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
