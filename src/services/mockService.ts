// Mock service layer - replace with real API calls (e.g., Wazuh) later

export interface SystemStatus {
  protected: boolean
  lastScan: string
  activeProtections: number
  totalProtections: number
  threatsBlockedToday: number
  version: string
  definitionsDate: string
}

export interface Threat {
  id: string
  fileName: string
  filePath: string
  threatType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  detectedAt: string
  status: 'quarantined' | 'deleted' | 'restored'
}

export interface ScanResult {
  id: string
  type: 'quick' | 'full' | 'custom'
  startedAt: string
  completedAt: string
  filesScanned: number
  threatsFound: number
  duration: string
  status: 'completed' | 'in_progress' | 'cancelled'
}

export interface HistoryEvent {
  id: string
  type: 'scan' | 'threat' | 'update' | 'action' | 'protection'
  title: string
  description: string
  timestamp: string
  severity?: 'info' | 'warning' | 'danger' | 'success'
}

export interface ProtectionSetting {
  id: string
  name: string
  description: string
  enabled: boolean
  icon: string
}

export interface OptimizationItem {
  id: string
  category: string
  label: string
  size?: string
  count?: number
  status: 'pending' | 'cleaning' | 'done'
}

export interface ScheduledScan {
  id: string
  name: string
  type: 'quick' | 'full' | 'custom'
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  day?: string
  enabled: boolean
  nextRun: string
}

export interface Subscription {
  plan: 'free' | 'pro' | 'enterprise'
  expiresAt: string
  daysRemaining: number
  features: string[]
  activationCode?: string
}

export interface ReportData {
  threatsBlocked: number[]
  scansPerformed: number[]
  labels: string[]
  totalThreats: number
  totalScans: number
  systemHealthScore: number
}

// --- Mock Data ---

const mockStatus: SystemStatus = {
  protected: true,
  lastScan: '2 godziny temu',
  activeProtections: 4,
  totalProtections: 4,
  threatsBlockedToday: 0,
  version: '5.2.1',
  definitionsDate: '02.05.2026',
}

const mockThreats: Threat[] = [
  {
    id: '1',
    fileName: 'malware.exe',
    filePath: 'C:\\Users\\Użytkownik\\Downloads\\malware.exe',
    threatType: 'Trojan',
    severity: 'critical',
    detectedAt: '20.05.2024 10:15',
    status: 'quarantined',
  },
  {
    id: '2',
    fileName: 'hacktool.dll',
    filePath: 'C:\\Windows\\System32\\hacktool.dll',
    threatType: 'HackTool',
    severity: 'high',
    detectedAt: '19.05.2024 22:31',
    status: 'quarantined',
  },
  {
    id: '3',
    fileName: 'virus.js',
    filePath: 'C:\\Users\\Użytkownik\\AppData\\Local\\virus.js',
    threatType: 'JS:Malware',
    severity: 'medium',
    detectedAt: '18.05.2024 18:42',
    status: 'quarantined',
  },
]

const mockScanHistory: ScanResult[] = [
  {
    id: '1',
    type: 'full',
    startedAt: '02.05.2026 08:00',
    completedAt: '02.05.2026 08:15',
    filesScanned: 284532,
    threatsFound: 0,
    duration: '15:42',
    status: 'completed',
  },
  {
    id: '2',
    type: 'quick',
    startedAt: '01.05.2026 14:30',
    completedAt: '01.05.2026 14:32',
    filesScanned: 24830,
    threatsFound: 0,
    duration: '2:14',
    status: 'completed',
  },
  {
    id: '3',
    type: 'full',
    startedAt: '28.04.2026 09:00',
    completedAt: '28.04.2026 09:18',
    filesScanned: 281100,
    threatsFound: 1,
    duration: '18:05',
    status: 'completed',
  },
]

const mockHistory: HistoryEvent[] = [
  { id: '1', type: 'scan', title: 'Pełne skanowanie zakończone', description: 'Przeskanowano 284 532 pliki — nie wykryto zagrożeń', timestamp: '02.05.2026 08:15', severity: 'success' },
  { id: '2', type: 'update', title: 'Definicje wirusów zaktualizowane', description: 'Baza definicji: 02.05.2026 — wersja 5.2.1', timestamp: '02.05.2026 06:00', severity: 'info' },
  { id: '3', type: 'scan', title: 'Szybkie skanowanie zakończone', description: 'Przeskanowano 24 830 plików — nie wykryto zagrożeń', timestamp: '01.05.2026 14:32', severity: 'success' },
  { id: '4', type: 'protection', title: 'Zagrożenie zablokowane', description: 'Ochrona w czasie rzeczywistym zablokowała potencjalne zagrożenie', timestamp: '30.04.2026 11:20', severity: 'warning' },
  { id: '5', type: 'scan', title: 'Pełne skanowanie zakończone', description: 'Przeskanowano 281 100 plików — 1 zagrożenie poddane kwarantannie', timestamp: '28.04.2026 09:18', severity: 'warning' },
  { id: '6', type: 'threat', title: 'Zagrożenie poddane kwarantannie', description: 'Plik trojan.exe przeniesiony do kwarantanny', timestamp: '28.04.2026 09:18', severity: 'danger' },
  { id: '7', type: 'action', title: 'Optymalizacja systemu', description: 'Wyczyszczono 2,4 GB plików tymczasowych', timestamp: '25.04.2026 15:00', severity: 'info' },
]

const mockProtections: ProtectionSetting[] = [
  { id: 'realtime', name: 'Ochrona w czasie rzeczywistym', description: 'Blokuje złośliwe oprogramowanie w czasie rzeczywistym', enabled: true, icon: 'Shield' },
  { id: 'behavior', name: 'Monitorowanie zachowań', description: 'Monitoruje podejrzane zachowania aplikacji', enabled: true, icon: 'Eye' },
  { id: 'ransomware', name: 'Ochrona przed ransomware', description: 'Chroni pliki przed szyfrowaniem przez ransomware', enabled: true, icon: 'Lock' },
  { id: 'web', name: 'Ochrona sieci', description: 'Blokuje niebezpieczne strony internetowe', enabled: true, icon: 'Globe' },
  { id: 'firewall', name: 'Zapora sieciowa', description: 'Kontroluje ruch sieciowy przychodzący i wychodzący', enabled: true, icon: 'Flame' },
  { id: 'devices', name: 'Monitorowanie urządzeń', description: 'Wykrywa nowe urządzenia w Twojej sieci', enabled: true, icon: 'Router' },
  { id: 'keylogger', name: 'Szyfrowanie klawiatury', description: 'Chroni przed keyloggerami i przechwytywaniem klawiszy', enabled: true, icon: 'Keyboard' },
  { id: 'webcam', name: 'Ochrona kamery i mikrofonu', description: 'Blokuje nieautoryzowany dostęp do kamery i mikrofonu', enabled: true, icon: 'Camera' },
  { id: 'phishing', name: 'Ochrona przed phishingiem', description: 'Wykrywa podejrzane maile i fałszywe strony logowania', enabled: true, icon: 'Fish' },
  { id: 'usb', name: 'Kontrola USB', description: 'Skanuje podłączane pendrive i dyski zewnętrzne', enabled: true, icon: 'Usb' },
  { id: 'firewall', name: 'Zapora sieciowa', description: 'Filtruje ruch sieciowy i blokuje nieautoryzowane połączenia', enabled: true, icon: 'Flame' },
  { id: 'device', name: 'Wykrywanie urządzeń', description: 'Wykrywa nowe urządzenia USB i sieciowe w systemie', enabled: true, icon: 'Usb' },
  { id: 'keylogger', name: 'Anty-keylogger', description: 'Szyfruje wprowadzane dane przeciw keyloggerom', enabled: true, icon: 'KeyRound' },
  { id: 'privacy', name: 'Ochrona prywatności', description: 'Blokuje dostęp do kamery i mikrofonu bez zgody', enabled: true, icon: 'EyeOff' },
]

const mockSchedules: ScheduledScan[] = [
  { id: '1', name: 'Codzienne szybkie skanowanie', type: 'quick', frequency: 'daily', time: '08:00', enabled: true, nextRun: '03.05.2026 08:00' },
  { id: '2', name: 'Tygodniowe pełne skanowanie', type: 'full', frequency: 'weekly', time: '02:00', day: 'Niedziela', enabled: true, nextRun: '04.05.2026 02:00' },
]

const mockSubscription: Subscription = {
  plan: 'pro',
  expiresAt: '02.05.2027',
  daysRemaining: 365,
  features: ['Ochrona w czasie rzeczywistym', 'Skanowanie zaawansowane', 'Ochrona sieci', 'Wsparcie 24/7'],
}

const mockReport: ReportData = {
  threatsBlocked: [2, 0, 1, 3, 0, 1, 0],
  scansPerformed: [2, 1, 2, 1, 2, 1, 2],
  labels: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'],
  totalThreats: 23,
  totalScans: 48,
  systemHealthScore: 97,
}

// --- Service Functions ---

export const getStatus = async (): Promise<SystemStatus> => {
  await delay(300)
  return { ...mockStatus }
}

export const getThreats = async (): Promise<Threat[]> => {
  await delay(200)
  return [...mockThreats]
}

export const getScanHistory = async (): Promise<ScanResult[]> => {
  await delay(200)
  return [...mockScanHistory]
}

export const getHistory = async (): Promise<HistoryEvent[]> => {
  await delay(200)
  return [...mockHistory]
}

export const getProtections = async (): Promise<ProtectionSetting[]> => {
  await delay(200)
  return [...mockProtections]
}

export const getSchedules = async (): Promise<ScheduledScan[]> => {
  await delay(200)
  return [...mockSchedules]
}

export const getSubscription = async (): Promise<Subscription> => {
  await delay(200)
  return { ...mockSubscription }
}

export const getReport = async (): Promise<ReportData> => {
  await delay(300)
  return { ...mockReport }
}

export const startScan = async (_type: 'quick' | 'full' | 'custom'): Promise<{ scanId: string }> => {
  await delay(500)
  return { scanId: `scan_${Date.now()}` }
}

export const restoreThreat = async (id: string): Promise<void> => {
  await delay(300)
  console.log('Restore threat:', id)
}

export const deleteThreat = async (id: string): Promise<void> => {
  await delay(300)
  console.log('Delete threat:', id)
}

export const updateProtection = async (id: string, enabled: boolean): Promise<void> => {
  await delay(200)
  console.log('Update protection:', id, enabled)
}

export const optimizeSystem = async (): Promise<void> => {
  await delay(3000)
  console.log('System optimized')
}

export const activateLicense = async (code: string): Promise<boolean> => {
  await delay(1000)
  return code === 'SHIELD-PRO-2026'
}

// Helper
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
