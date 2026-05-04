import { useEffect, useState } from 'react'
import { AppProvider, useApp } from './store/AppContext'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { Dashboard } from './pages/Dashboard'
import { Protection } from './pages/Protection'
import { Scan } from './pages/Scan'
import { Quarantine } from './pages/Quarantine'
import { History } from './pages/History'
import { Optimization } from './pages/Optimization'
import { Scheduler } from './pages/Scheduler'
import { Reports } from './pages/Reports'
import { Account } from './pages/Account'
import { Settings } from './pages/Settings'
import { AdminPanel } from './pages/AdminPanel'
import { Chat } from './pages/Chat'
import { Login } from './pages/Login'
import { getStoredUser, clearStoredUser } from './services/authService'
import type { AppUser } from './services/authService'

function PageRouter() {
  const { currentPage } = useApp()

  switch (currentPage) {
    case 'dashboard': return <Dashboard />
    case 'protection': return <Protection />
    case 'scan': return <Scan />
    case 'quarantine': return <Quarantine />
    case 'history': return <History />
    case 'optimization': return <Optimization />
    case 'scheduler': return <Scheduler />
    case 'reports': return <Reports />
    case 'account': return <Account />
    case 'settings': return <Settings />
    case 'admin': return <AdminPanel />
    case 'chat': return <Chat />
    default: return <Dashboard />
  }
}

function AppLayout({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background">
      <TopBar user={user} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden bg-background">
          <PageRouter />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<AppUser | null | 'loading'>('loading')

  useEffect(() => {
    getStoredUser().then(u => setUser(u))
  }, [])

  const handleLogin = (u: AppUser) => setUser(u)
  const handleLogout = () => {
    clearStoredUser()
    setUser(null)
  }

  if (user === 'loading') {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center" style={{ background: 'oklch(0.1 0 0)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <AppProvider appUser={user}>
      <AppLayout user={user} onLogout={handleLogout} />
    </AppProvider>
  )
}
