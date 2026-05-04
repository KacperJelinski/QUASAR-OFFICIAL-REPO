import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { SystemStatus, Threat, ProtectionSetting } from '../services/mockService'
import { getStatus, getThreats, getProtections } from '../services/mockService'
import { supabase, DEMO_OWNER_ID } from '../services/supabaseClient'
import type { AppUser } from '../services/authService'
import { loadUserData, saveUserData, loadActiveSubscription } from '../services/userDataService'

type Page =
  | 'dashboard'
  | 'protection'
  | 'scan'
  | 'quarantine'
  | 'history'
  | 'optimization'
  | 'scheduler'
  | 'reports'
  | 'account'
  | 'settings'
  | 'admin'
  | 'chat'

type Theme = 'dark' | 'light'

type AccentColor = {
  label: string
  value: string
  class: string
}

export const ACCENT_COLORS: AccentColor[] = [
  { label: 'Zielony', value: '142', class: 'bg-emerald-500' },
  { label: 'Niebieski', value: '220', class: 'bg-blue-500' },
  { label: 'Turkusowy', value: '185', class: 'bg-cyan-500' },
  { label: 'Pomarańczowy', value: '60', class: 'bg-orange-500' },
  { label: 'Czerwony', value: '25', class: 'bg-red-500' },
]

export interface AppNotification {
  id: string
  title: string
  body: string
  severity: 'info' | 'success' | 'warning' | 'danger'
  createdAt: number
  read: boolean
}

export type BadgeItem = {
  id: string
  key?: string
  name: string
  description: string
  cost: number
  icon: string
  category_tab: number
  active: boolean
  color_hue: string
  hue?: string
}


function computeDaysLeft(activatedAt: string | null, durationDays: number): number {
  if (!activatedAt) return 0
  const expiry = new Date(activatedAt).getTime() + durationDays * 86400_000
  return Math.max(0, Math.ceil((expiry - Date.now()) / 86400_000))
}

export const DEFAULT_BADGES: BadgeItem[] = [
  { id: 'b1', name: 'Pierwszy Strażnik', description: 'Za pierwsze aktywowanie ochrony QUASAR', cost: 50, icon: 'Shield', category_tab: 1, active: true, color_hue: '142' },
  { id: 'b2', name: 'Tarcza Tytana', description: 'Legendarny obrońca systemu', cost: 200, icon: 'ShieldCheck', category_tab: 1, active: true, color_hue: '220' },
  { id: 'b3', name: 'Ghost Hunter', description: 'Mistrz wykrywania ukrytych zagrożeń', cost: 150, icon: 'Ghost', category_tab: 2, active: true, color_hue: '280' },
  { id: 'b4', name: 'Zero Day Master', description: 'Ekspert od zagrożeń dnia zerowego', cost: 300, icon: 'Swords', category_tab: 2, active: true, color_hue: '30' },
  { id: 'b5', name: 'Elite Guardian', description: 'Strażnik elitarny — szczyt bezpieczeństwa', cost: 250, icon: 'Crown', category_tab: 3, active: true, color_hue: '85' },
  { id: 'b6', name: 'Legend Quasar', description: 'Tytuł przyznawany tylko największym legendom', cost: 500, icon: 'Star', category_tab: 3, active: true, color_hue: '330' },
]

interface AppState {
  currentPage: Page
  theme: Theme
  accentHue: string
  status: SystemStatus | null
  threats: Threat[]
  protections: ProtectionSetting[]
  isLoading: boolean
  scanActive: boolean
  scanProgress: number
  scanType: 'quick' | 'full' | 'custom' | null
  scanFilesCount: number
  scanThreatsFound: number
  scanLogs: string[]
  notifications: boolean
  language: string
  autoStart: boolean
  licenseActivatedAt: string | null
  licenseDurationDays: number
  licenseDaysLeft: number
  licenseLocked: boolean
  licensePlan: 'Pro' | 'Free'
  masterProtection: boolean
  points: number
  joinedAt: string
  daysTogether: number
  notifList: AppNotification[]
  unreadCount: number
  badgeCatalog: BadgeItem[]
  inventory: string[]
  equippedBadges: string[]
  userLevel: number
  isAdmin: boolean
  appUser: AppUser | null
}

interface AppActions {
  navigate: (page: Page) => void
  setTheme: (theme: Theme) => void
  setAccentHue: (hue: string) => void
  startScan: (type: 'quick' | 'full' | 'custom') => void
  stopScan: () => void
  toggleProtection: (id: string) => void
  setMasterProtection: (v: boolean) => void
  setNotifications: (v: boolean) => void
  setLanguage: (lang: string) => void
  setAutoStart: (v: boolean) => void
  refreshStatus: () => void
  addPoints: (n: number, reason?: string) => void
  spendPoints: (n: number) => boolean
  pushNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
  activateLicenseCode: (code: string) => Promise<{ ok: boolean; message: string }>
  removeLicense: () => Promise<void>
  refreshUserData: () => Promise<void>
  purchaseBadge: (badgeId: string) => Promise<{ ok: boolean; message: string }>
  toggleBadgeEquip: (badgeId: string) => void
}

type AppContextType = AppState & AppActions

const AppContext = createContext<AppContextType | null>(null)

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Ochrona aktywna', body: 'Wszystkie moduły działają prawidłowo', severity: 'success', createdAt: Date.now() - 1000 * 60 * 3, read: false },
  { id: 'n2', title: 'Definicje zaktualizowane', body: 'Baza sygnatur odświeżona — wersja 5.2.1', severity: 'info', createdAt: Date.now() - 1000 * 60 * 45, read: false },
  { id: 'n3', title: 'Nowy bonus dostępny', body: 'Sprawdź sklep bonusów w zakładce Moje konto', severity: 'info', createdAt: Date.now() - 1000 * 60 * 60 * 2, read: false },
  { id: 'n4', title: 'Szybkie skanowanie zakończone', body: 'Brak zagrożeń w 24 830 plikach', severity: 'success', createdAt: Date.now() - 1000 * 60 * 60 * 20, read: true },
]

export function AppProvider({ children, appUser: _appUser }: { children: React.ReactNode; appUser?: AppUser }) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [theme, setThemeState] = useState<Theme>('dark')
  const [accentHue, setAccentHueState] = useState<string>('142')
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [threats, setThreats] = useState<Threat[]>([])
  const [protections, setProtections] = useState<ProtectionSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [scanActive, setScanActive] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanType, setScanType] = useState<'quick' | 'full' | 'custom' | null>(null)
  const [scanFilesCount, setScanFilesCount] = useState(0)
  const [scanThreatsFound, setScanThreatsFound] = useState(0)
  const [scanLogs, setScanLogs] = useState<string[]>([])
  const [notifications, setNotificationsState] = useState(true)
  const [language, setLanguageState] = useState('pl')
  const [autoStart, setAutoStartState] = useState(true)
  const [masterProtection, setMasterProtectionState] = useState(false)
  const [points, setPoints] = useState(0)
  const [notifList, setNotifList] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS)
  const [scanInterval, setScanIntervalRef] = useState<ReturnType<typeof setInterval> | null>(null)
  const [badgeCatalog, setBadgeCatalog] = useState<BadgeItem[]>(DEFAULT_BADGES)
  const [inventory, setInventory] = useState<string[]>([])
  const [equippedBadges, setEquippedBadges] = useState<string[]>([])
  const [userDataLoaded, setUserDataLoaded] = useState(false)

  const [licenseActivatedAt, setLicenseActivatedAt] = useState<string | null>(null)
  const [licenseDurationDays, setLicenseDurationDays] = useState<number>(0)

  // Track refs for DB save (avoid stale closures)
  const pointsRef = useRef(points)
  const inventoryRef = useRef(inventory)
  const equippedRef = useRef(equippedBadges)
  const licActivatedRef = useRef(licenseActivatedAt)
  const licDurationRef = useRef(licenseDurationDays)
  pointsRef.current = points
  inventoryRef.current = inventory
  equippedRef.current = equippedBadges
  licActivatedRef.current = licenseActivatedAt
  licDurationRef.current = licenseDurationDays

  const licenseDaysLeft = computeDaysLeft(licenseActivatedAt, licenseDurationDays)
  const licenseLocked = licenseDaysLeft === 0
  const licensePlan: 'Pro' | 'Free' = licenseDaysLeft > 0 ? 'Pro' : 'Free'

  const joinedAt = licenseActivatedAt ?? new Date(Date.now() - 187 * 86400_000).toISOString()

  const daysTogether = licenseActivatedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(licenseActivatedAt).getTime()) / 86400_000))
    : 0

  const userLevel = Math.max(1, Math.floor(daysTogether / 30) + 1)
  const unreadCount = notifList.filter(n => !n.read).length

  useEffect(() => {
    if (licenseLocked && currentPage !== 'account' && currentPage !== 'chat' && currentPage !== 'admin') {
      setCurrentPage('account')
    }
  }, [licenseLocked, currentPage])

  useEffect(() => {
    if (licenseLocked) {
      setMasterProtectionState(false)
      setProtections(prev => prev.map(p => ({ ...p, enabled: false })))
    } else {
      setMasterProtectionState(true)
      setProtections(prev => prev.map(p => ({ ...p, enabled: true })))
    }
  }, [licenseLocked])

  useEffect(() => { loadInitialData() }, [])

  // Load per-user data from DB on login
  useEffect(() => {
    if (!_appUser?.id) return
    let cancelled = false
    async function load() {
      const [userData, sub] = await Promise.all([
        loadUserData(_appUser!.id),
        loadActiveSubscription(_appUser!.id),
      ])
      if (cancelled) return
      setPoints(userData.points)
      setInventory(userData.inventory)
      setEquippedBadges(userData.equipped_badges)

      // License: prefer DB subscription (admin-granted), fall back to user_data code activation
      if (sub) {
        setLicenseActivatedAt(sub.activatedAt)
        setLicenseDurationDays(sub.durationDays)
      } else if (userData.license_activated_at) {
        setLicenseActivatedAt(userData.license_activated_at)
        setLicenseDurationDays(userData.license_duration_days)
      } else {
        setLicenseActivatedAt(null)
        setLicenseDurationDays(0)
      }
      setUserDataLoaded(true)
    }
    load()
    return () => { cancelled = true }
  }, [_appUser?.id])

  // Persist user data to DB whenever it changes (after initial load)
  useEffect(() => {
    if (!_appUser?.id || !userDataLoaded) return
    const tid = setTimeout(() => {
      saveUserData(_appUser!.id, {
        points: pointsRef.current,
        inventory: inventoryRef.current,
        equipped_badges: equippedRef.current,
        license_activated_at: licActivatedRef.current,
        license_duration_days: licDurationRef.current,
      })
    }, 800)
    return () => clearTimeout(tid)
  }, [points, inventory, equippedBadges, licenseActivatedAt, licenseDurationDays, userDataLoaded])

  // Periodically re-fetch subscription and points from DB (every 30s) to pick up admin changes
  useEffect(() => {
    if (!_appUser?.id || !userDataLoaded) return
    const interval = setInterval(async () => {
      const [sub, pts] = await Promise.all([
        loadActiveSubscription(_appUser!.id),
        supabase.from('xq_points').select('balance').eq('user_id', _appUser!.id).eq('owner_id', DEMO_OWNER_ID).maybeSingle(),
      ])
      if (sub) {
        setLicenseActivatedAt(sub.activatedAt)
        setLicenseDurationDays(sub.durationDays)
      } else if (!licActivatedRef.current) {
        setLicenseActivatedAt(null)
        setLicenseDurationDays(0)
      }
      if (pts.data?.balance !== undefined) {
        setPoints(pts.data.balance)
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [_appUser?.id, userDataLoaded])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') { root.classList.add('light'); root.classList.remove('dark') }
    else { root.classList.remove('light'); root.classList.add('dark') }
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', `oklch(0.65 0.18 ${accentHue})`)
    document.documentElement.style.setProperty('--accent', `oklch(0.65 0.18 ${accentHue})`)
    document.documentElement.style.setProperty('--ring', `oklch(0.65 0.18 ${accentHue})`)
    document.documentElement.style.setProperty('--sidebar-primary', `oklch(0.65 0.18 ${accentHue})`)
    document.documentElement.style.setProperty('--success', `oklch(0.65 0.18 ${accentHue})`)
    document.documentElement.style.setProperty('--chart-1', `oklch(0.65 0.18 ${accentHue})`)
  }, [accentHue])

  useEffect(() => {
    async function loadBadges() {
      const { data } = await supabase
        .from('xq_badge_catalog')
        .select('*')
        .order('category_tab', { ascending: true })
      if (data && data.length > 0) {
        // Normalize: map 'key' to 'id' and 'hue' to 'color_hue' for compatibility
        const normalized = data.map((b: any) => ({
          ...b,
          id: b.id ?? b.key,
          color_hue: b.color_hue ?? b.hue ?? '142',
        }))
        setBadgeCatalog(normalized as BadgeItem[])
      }
    }
    loadBadges()
  }, [])

  async function loadInitialData() {
    setIsLoading(true)
    try {
      const [s, t, p] = await Promise.all([getStatus(), getThreats(), getProtections()])
      setStatus(s)
      setThreats(t)
      setProtections(p)
    } finally {
      setIsLoading(false)
    }
  }

  const SCAN_LOG_MESSAGES = [
    'C:\\Windows\\System32\\drivers\\etc\\hosts',
    'C:\\Windows\\System32\\kernel32.dll',
    'C:\\Windows\\System32\\ntdll.dll',
    'C:\\Users\\Użytkownik\\AppData\\Local\\Temp',
    'C:\\Program Files\\Common Files',
    'C:\\Windows\\SysWOW64',
    'C:\\Users\\Użytkownik\\Documents',
    'C:\\Windows\\Prefetch',
    'C:\\Program Files (x86)',
    'C:\\Windows\\System32\\config',
    'C:\\Users\\Użytkownik\\AppData\\Roaming',
    'C:\\Windows\\WinSxS',
  ]

  function startScan(type: 'quick' | 'full' | 'custom') {
    if (scanActive) return
    setScanActive(true)
    setScanType(type)
    setScanProgress(0)
    setScanFilesCount(0)
    setScanThreatsFound(0)
    setScanLogs([])

    const totalFiles = type === 'quick' ? 24532 : 284532
    const duration = type === 'quick' ? 12000 : 25000
    const startTime = Date.now()

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)
      const filesCount = Math.floor((progress / 100) * totalFiles)
      setScanProgress(progress)
      setScanFilesCount(filesCount)

      if (Math.random() < 0.3) {
        const logMsg = SCAN_LOG_MESSAGES[Math.floor(Math.random() * SCAN_LOG_MESSAGES.length)]
        const now = new Date()
        const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`
        setScanLogs(prev => [`${timeStr} Skanowanie ${logMsg}`, ...prev.slice(0, 9)])
      }

      if (progress >= 100) {
        clearInterval(interval)
        setScanActive(false)
        setScanProgress(100)
        pushNotification({ title: 'Skanowanie zakończone', body: `Przeskanowano ${totalFiles.toLocaleString('pl')} plików`, severity: 'success' })
      }
    }, 200)

    setScanIntervalRef(interval)
    setCurrentPage('scan')
  }

  function stopScan() {
    if (scanInterval) clearInterval(scanInterval)
    setScanActive(false)
    setScanProgress(0)
    setScanType(null)
  }

  function toggleProtection(id: string) {
    setProtections(prev => {
      const next = prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
      const anyActive = next.some(p => p.enabled)
      if (!anyActive) {
        setMasterProtectionState(false)
        pushNotification({ title: 'Ochrona wyłączona', body: 'UWAGA: wszystkie moduły są wyłączone — system bez ochrony', severity: 'danger' })
      } else {
        setMasterProtectionState(true)
      }
      return next
    })
  }

  function setMasterProtection(v: boolean) {
    setMasterProtectionState(v)
    setProtections(prev => prev.map(p => ({ ...p, enabled: v })))
    pushNotification({
      title: v ? 'Ochrona włączona' : 'Ochrona wyłączona',
      body: v ? 'Wszystkie moduły ochrony zostały aktywowane' : 'UWAGA: system jest bez ochrony',
      severity: v ? 'success' : 'danger',
    })
  }

  function addPoints(n: number, reason?: string) {
    setPoints(p => p + n)
    if (reason) pushNotification({ title: `+${n} punktów`, body: reason, severity: 'success' })
  }

  function spendPoints(n: number): boolean {
    if (points < n) return false
    setPoints(p => p - n)
    return true
  }

  function pushNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    const full: AppNotification = { ...n, id: `n${Date.now()}_${Math.random().toString(36).slice(2,6)}`, createdAt: Date.now(), read: false }
    setNotifList(prev => [full, ...prev].slice(0, 40))
  }

  function markAllNotificationsRead() {
    setNotifList(prev => prev.map(n => ({ ...n, read: true })))
  }

  function clearNotifications() {
    setNotifList([])
  }

  async function activateLicenseCode(code: string): Promise<{ ok: boolean; message: string }> {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return { ok: false, message: 'Wprowadź kod aktywacyjny.' }

    const { data } = await supabase
      .from('xq_activation_codes')
      .select('*')
      .eq('code', trimmed)
      .eq('used', false)
      .maybeSingle()

    if (!data) return { ok: false, message: 'Nieprawidłowy lub już użyty kod.' }

    const codeExpiry = data.code_expires_at ?? data.expires_at
    if (codeExpiry && new Date(codeExpiry) < new Date()) {
      return { ok: false, message: 'Ten kod aktywacyjny wygasł.' }
    }

    const activatedAt = new Date().toISOString()
    const days = data.duration_days ?? 365

    await supabase.from('xq_activation_codes').update({ used: true, used_at: activatedAt }).eq('id', data.id)

    setLicenseActivatedAt(activatedAt)
    setLicenseDurationDays(days)

    addPoints(100, 'Aktywacja licencji')
    pushNotification({ title: 'Licencja aktywowana!', body: `Plan ${data.plan ?? 'Pro'} aktywny przez ${days} dni`, severity: 'success' })

    return { ok: true, message: `Licencja aktywowana! Ważna przez ${days} dni.` }
  }

  async function purchaseBadge(badgeId: string): Promise<{ ok: boolean; message: string }> {
    if (inventory.includes(badgeId)) return { ok: false, message: 'Posiadasz już tę odznakę.' }
    const badge = badgeCatalog.find(b => b.id === badgeId)
    if (!badge) return { ok: false, message: 'Odznaka nie istnieje.' }
    if (!spendPoints(badge.cost)) return { ok: false, message: 'Za mało punktów.' }
    setInventory(prev => [...prev, badgeId])
    pushNotification({ title: 'Odznaka odblokowana!', body: badge.name, severity: 'success' })
    return { ok: true, message: `Zakupiono: ${badge.name}` }
  }

  function toggleBadgeEquip(badgeId: string) {
    setEquippedBadges(prev =>
      prev.includes(badgeId) ? prev.filter(id => id !== badgeId) : [...prev, badgeId].slice(-3)
    )
  }

  async function removeLicense() {
    setLicenseActivatedAt(null)
    setLicenseDurationDays(0)
    if (_appUser?.id) {
      await Promise.all([
        supabase.from('xq_subscriptions')
          .update({ status: 'revoked' })
          .eq('user_id', _appUser.id)
          .eq('owner_id', DEMO_OWNER_ID)
          .eq('status', 'active'),
        saveUserData(_appUser.id, { license_activated_at: null, license_duration_days: 0 }),
      ])
    }
  }

  async function refreshUserData() {
    if (!_appUser?.id) return
    const [userData, sub] = await Promise.all([
      loadUserData(_appUser.id),
      loadActiveSubscription(_appUser.id),
    ])
    setPoints(userData.points)
    setInventory(userData.inventory)
    setEquippedBadges(userData.equipped_badges)

    if (sub) {
      setLicenseActivatedAt(sub.activatedAt)
      setLicenseDurationDays(sub.durationDays)
    } else if (userData.license_activated_at) {
      setLicenseActivatedAt(userData.license_activated_at)
      setLicenseDurationDays(userData.license_duration_days)
    } else {
      setLicenseActivatedAt(null)
      setLicenseDurationDays(0)
    }
  }

  const value: AppContextType = {
    currentPage, theme, accentHue, status, threats, protections, isLoading,
    scanActive, scanProgress, scanType, scanFilesCount, scanThreatsFound, scanLogs,
    notifications, language, autoStart,
    licenseActivatedAt, licenseDurationDays, licenseDaysLeft, licenseLocked, licensePlan,
    masterProtection, points, joinedAt, daysTogether, notifList, unreadCount,
    badgeCatalog, inventory, equippedBadges, userLevel,
    isAdmin: ['jelkacperapple@gmail.com', 'tomekjel@gmail.com'].includes(_appUser?.email ?? ''),
    appUser: _appUser ?? null,
    navigate: setCurrentPage,
    setTheme: setThemeState,
    setAccentHue: setAccentHueState,
    startScan, stopScan, toggleProtection,
    setMasterProtection,
    setNotifications: setNotificationsState,
    setLanguage: setLanguageState,
    setAutoStart: setAutoStartState,
    refreshStatus: loadInitialData,
    addPoints, spendPoints,
    pushNotification, markAllNotificationsRead, clearNotifications,
    activateLicenseCode, removeLicense, refreshUserData, purchaseBadge, toggleBadgeEquip,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
