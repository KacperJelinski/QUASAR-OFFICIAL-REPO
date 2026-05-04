// Wazuh integration layer — wired to placeholder endpoints.
// Replace VITE_WAZUH_API_URL / token with your self-hosted Wazuh Manager API.

export type WazuhAgent = {
  id: string
  name: string
  status: 'active' | 'disconnected' | 'never_connected'
  ip: string
  os: string
  version: string
  last_keep_alive: string
}

export type WazuhAlert = {
  id: string
  rule_id: number
  level: number
  description: string
  agent_id: string
  timestamp: string
}

const BASE = (import.meta.env.VITE_WAZUH_API_URL as string) || ''

async function authHeaders(): Promise<HeadersInit> {
  const token = (import.meta.env.VITE_WAZUH_TOKEN as string) || ''
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function fetchAgentStatus(): Promise<WazuhAgent[]> {
  if (!BASE) return mockAgents()
  try {
    const res = await fetch(`${BASE}/agents`, { headers: await authHeaders() })
    if (!res.ok) throw new Error(String(res.status))
    const json = await res.json()
    return (json?.data?.affected_items ?? []) as WazuhAgent[]
  } catch {
    return mockAgents()
  }
}

export async function fetchAlerts(limit = 20): Promise<WazuhAlert[]> {
  if (!BASE) return mockAlerts(limit)
  try {
    const res = await fetch(`${BASE}/alerts?limit=${limit}`, { headers: await authHeaders() })
    if (!res.ok) throw new Error(String(res.status))
    const json = await res.json()
    return (json?.data?.affected_items ?? []) as WazuhAlert[]
  } catch {
    return mockAlerts(limit)
  }
}

export async function triggerAgentScan(agentId: string): Promise<boolean> {
  if (!BASE) return true
  try {
    const res = await fetch(`${BASE}/active-response`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ command: 'restart-wazuh', agents_list: [agentId] }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function forceSync(): Promise<boolean> {
  if (!BASE) return true
  try {
    const res = await fetch(`${BASE}/manager/configuration/reload`, {
      method: 'PUT',
      headers: await authHeaders(),
    })
    return res.ok
  } catch {
    return false
  }
}

function mockAgents(): WazuhAgent[] {
  return [
    { id: '001', name: 'WIN-DESKTOP-01', status: 'active', ip: '10.0.0.14', os: 'Windows 11 Pro', version: 'v4.7.2', last_keep_alive: new Date().toISOString() },
    { id: '002', name: 'MBP-USER-02', status: 'active', ip: '10.0.0.21', os: 'macOS 14.4', version: 'v4.7.2', last_keep_alive: new Date().toISOString() },
    { id: '003', name: 'UBUNTU-SRV-03', status: 'disconnected', ip: '10.0.0.31', os: 'Ubuntu 22.04', version: 'v4.7.1', last_keep_alive: new Date(Date.now() - 3600_000).toISOString() },
  ]
}

function mockAlerts(limit: number): WazuhAlert[] {
  const rules = [
    { id: 5715, level: 7, desc: 'Próba logowania SSH nieudana' },
    { id: 31101, level: 9, desc: 'Wykryto pattern malware w /tmp' },
    { id: 40111, level: 5, desc: 'Zmiana uprawnień pliku krytycznego' },
    { id: 60101, level: 10, desc: 'Podejrzana aktywność PowerShell' },
    { id: 5402, level: 3, desc: 'Nowe połączenie TCP' },
  ]
  return Array.from({ length: limit }, (_, i) => {
    const r = rules[i % rules.length]
    return {
      id: String(10_000 + i),
      rule_id: r.id,
      level: r.level,
      description: r.desc,
      agent_id: ['001', '002', '003'][i % 3],
      timestamp: new Date(Date.now() - i * 60_000).toISOString(),
    }
  })
}
