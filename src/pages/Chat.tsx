import { useEffect, useRef, useState } from 'react'
import { Send, Bot, User as UserIcon, Sparkles, Headphones, Circle } from 'lucide-react'
import { supabase, DEMO_OWNER_ID } from '../services/supabaseClient'

type AiMsg = { id: string; role: 'user' | 'assistant'; content: string; created_at: string }
type SupportMsg = { id: string; sender: 'user' | 'admin'; content: string; admin_name?: string; admin_role?: string; sender_name?: string; sender_role?: string; created_at: string }

const AI_SUGGESTIONS = [
  'Jak uruchomić pełne skanowanie?',
  'Czy moja licencja jest aktywna?',
  'Co robić gdy wykryto zagrożenie?',
  'Jak zarządzać kwarantanną?',
]

function mockAiReply(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (lower.includes('licencj')) return 'Twoja licencja Pro jest aktywna. Szczegóły znajdziesz w sekcji „Moje konto".'
  if (lower.includes('skanow')) return 'Aby uruchomić pełne skanowanie, przejdź do zakładki „Skanowanie" i wybierz opcję „Pełne skanowanie". Szacowany czas: 15–20 minut.'
  if (lower.includes('zagroż') || lower.includes('wirus')) return 'QUASAR automatycznie reaguje na zagrożenia. Krytyczne alerty trafiają do kwarantanny i są zapisywane w dzienniku zdarzeń.'
  if (lower.includes('kwarant')) return 'W zakładce „Kwarantanna" znajdziesz wszystkie izolowane pliki. Możesz je przywrócić lub trwale usunąć.'
  return 'Dziękuję za pytanie. Jeśli potrzebujesz bardziej szczegółowej pomocy, skontaktuj się z naszym zespołem wsparcia po prawej stronie.'
}

export function Chat() {
  const [aiMessages, setAiMessages] = useState<AiMsg[]>([])
  const [supportMessages, setSupportMessages] = useState<SupportMsg[]>([])
  const [aiInput, setAiInput] = useState('')
  const [supportInput, setSupportInput] = useState('')
  const [aiSending, setAiSending] = useState(false)
  const [supportSending, setSupportSending] = useState(false)
  const aiScrollRef = useRef<HTMLDivElement | null>(null)
  const supportScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { loadHistory() }, [])

  useEffect(() => {
    aiScrollRef.current?.scrollTo({ top: aiScrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [aiMessages])

  useEffect(() => {
    supportScrollRef.current?.scrollTo({ top: supportScrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [supportMessages])

  async function loadHistory() {
    const [{ data: ai }, { data: sup }] = await Promise.all([
      supabase.from('xq_chat_messages').select('*').eq('owner_id', DEMO_OWNER_ID).order('created_at', { ascending: true }).limit(50),
      supabase.from('xq_support_messages').select('*').eq('owner_id', DEMO_OWNER_ID).order('created_at', { ascending: true }).limit(100),
    ])
    setAiMessages((ai ?? []) as AiMsg[])
    setSupportMessages((sup ?? []) as SupportMsg[])
  }

  async function sendAi(prompt?: string) {
    const text = (prompt ?? aiInput).trim()
    if (!text || aiSending) return
    setAiSending(true)
    setAiInput('')
    const userMsg: AiMsg = { id: crypto.randomUUID(), role: 'user', content: text, created_at: new Date().toISOString() }
    setAiMessages(m => [...m, userMsg])
    await supabase.from('xq_chat_messages').insert({ owner_id: DEMO_OWNER_ID, role: 'user', content: text })
    await new Promise(r => setTimeout(r, 700))
    const reply = mockAiReply(text)
    const botMsg: AiMsg = { id: crypto.randomUUID(), role: 'assistant', content: reply, created_at: new Date().toISOString() }
    setAiMessages(m => [...m, botMsg])
    await supabase.from('xq_chat_messages').insert({ owner_id: DEMO_OWNER_ID, role: 'assistant', content: reply })
    setAiSending(false)
  }

  async function sendSupport(text?: string) {
    const content = (text ?? supportInput).trim()
    if (!content || supportSending) return
    setSupportSending(true)
    setSupportInput('')
    const msg: SupportMsg = { id: crypto.randomUUID(), sender: 'user', content, created_at: new Date().toISOString() }
    setSupportMessages(m => [...m, msg])
    await supabase.from('xq_support_messages').insert({ owner_id: DEMO_OWNER_ID, sender: 'user', content, sender_name: '', sender_role: '' })
    setSupportSending(false)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── LEFT: AI Chat ── */}
      <div className="flex flex-col flex-1 min-w-0" style={{ borderRight: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0"
          style={{ background: 'linear-gradient(to bottom, oklch(0.16 0 0), oklch(0.14 0 0))' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'oklch(0.65 0.18 142 / 0.15)', border: '1px solid oklch(0.65 0.18 142 / 0.3)' }}>
              <Bot className="w-4 h-4 text-primary" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">QUASAR AI</p>
              <p className="text-[10px] text-muted-foreground">Asystent sztucznej inteligencji</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-primary/20 bg-primary/10">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-[11px] text-primary font-medium">AI · beta</span>
          </div>
        </div>

        <div ref={aiScrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {aiMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'oklch(0.65 0.18 142 / 0.12)', border: '1px solid oklch(0.65 0.18 142 / 0.25)' }}>
                <Bot className="w-6 h-6 text-primary" strokeWidth={1.6} />
              </div>
              <p className="text-sm font-bold text-foreground mb-1">Cześć! Jak mogę pomóc?</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                Zadaj pytanie o ochronę, licencję lub konfigurację systemu.
              </p>
              <div className="flex flex-col gap-1.5 w-full max-w-xs">
                {AI_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => sendAi(s)}
                    className="text-left px-3 py-2 rounded-lg border border-border/60 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer text-xs text-foreground">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-muted-foreground shrink-0" />
                      {s}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-3">
            {aiMessages.map(m => (
              <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: m.role === 'user' ? 'var(--secondary)' : 'oklch(0.65 0.18 142 / 0.15)',
                    border: `1px solid ${m.role === 'user' ? 'var(--border)' : 'oklch(0.65 0.18 142 / 0.25)'}`,
                  }}>
                  {m.role === 'user'
                    ? <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    : <Bot className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className="max-w-[78%] rounded-2xl px-3 py-2 text-xs text-foreground"
                  style={{
                    background: m.role === 'user' ? 'var(--secondary)' : 'var(--card)',
                    border: `1px solid ${m.role === 'user' ? 'var(--border)' : 'oklch(0.65 0.18 142 / 0.18)'}`,
                  }}>
                  {m.content}
                </div>
              </div>
            ))}
            {aiSending && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'oklch(0.65 0.18 142 / 0.15)', border: '1px solid oklch(0.65 0.18 142 / 0.25)' }}>
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="rounded-2xl px-3 py-2.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary glow-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary glow-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary glow-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border/60 shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendAi()}
              placeholder="Zapytaj AI..."
              className="flex-1 h-10 rounded-xl border px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
              style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
            />
            <button onClick={() => sendAi()} disabled={!aiInput.trim() || aiSending}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--primary), oklch(0.58 0.16 155))', color: 'white' }}>
              <Send className="w-3.5 h-3.5" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Support Chat ── */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0"
          style={{ background: 'linear-gradient(to bottom, oklch(0.16 0 0), oklch(0.14 0 0))' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'oklch(0.7 0.14 220 / 0.15)', border: '1px solid oklch(0.7 0.14 220 / 0.3)' }}>
              <Headphones className="w-4 h-4" style={{ color: 'oklch(0.7 0.14 220)' }} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-tight">Wsparcie techniczne</p>
              <p className="text-[10px] text-muted-foreground">Zespół QUASAR · czas odpowiedzi ~5 min</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border" style={{ borderColor: 'oklch(0.7 0.14 220 / 0.3)', background: 'oklch(0.7 0.14 220 / 0.1)' }}>
            <Circle className="w-2 h-2 fill-current" style={{ color: 'oklch(0.65 0.18 142)' }} />
            <span className="text-[11px] font-medium" style={{ color: 'oklch(0.7 0.14 220)' }}>Online</span>
          </div>
        </div>

        <div ref={supportScrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {supportMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'oklch(0.7 0.14 220 / 0.12)', border: '1px solid oklch(0.7 0.14 220 / 0.25)' }}>
                <Headphones className="w-6 h-6" style={{ color: 'oklch(0.7 0.14 220)' }} strokeWidth={1.6} />
              </div>
              <p className="text-sm font-bold text-foreground mb-1">Wsparcie techniczne</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Napisz do naszego zespołu. Nasi specjaliści odpowiedzą tak szybko jak to możliwe.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {supportMessages.map(m => {
              const isUser = m.sender === 'user'
              return (
                <div key={m.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                    style={{
                      background: isUser ? 'var(--secondary)' : 'oklch(0.7 0.14 220 / 0.18)',
                      border: `1px solid ${isUser ? 'var(--border)' : 'oklch(0.7 0.14 220 / 0.3)'}`,
                      color: isUser ? 'var(--muted-foreground)' : 'oklch(0.7 0.14 220)',
                    }}>
                    {isUser ? <UserIcon className="w-3.5 h-3.5" /> : (m.admin_name?.slice(0, 2) ?? 'QS')}
                  </div>
                  <div className="max-w-[78%] flex flex-col gap-0.5">
                    {!isUser && (m.admin_name || m.sender_name) && (
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[10px] font-semibold" style={{ color: 'oklch(0.7 0.14 220)' }}>{m.sender_name || m.admin_name}</span>
                        {(m.sender_role || m.admin_role) && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                            style={{
                              background: (m.sender_role || m.admin_role) === 'CEO' ? 'oklch(0.82 0.17 85 / 0.15)' : 'oklch(0.7 0.14 220 / 0.15)',
                              color: (m.sender_role || m.admin_role) === 'CEO' ? 'oklch(0.82 0.17 85)' : 'oklch(0.7 0.14 220)',
                            }}>
                            {m.sender_role || m.admin_role}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="rounded-2xl px-3 py-2 text-xs text-foreground"
                      style={{
                        background: isUser ? 'var(--secondary)' : 'var(--card)',
                        border: `1px solid ${isUser ? 'var(--border)' : 'oklch(0.7 0.14 220 / 0.18)'}`,
                      }}>
                      {m.content}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border/60 shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={supportInput}
              onChange={e => setSupportInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendSupport()}
              placeholder="Napisz do supportu..."
              className="flex-1 h-10 rounded-xl border px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
              style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
            />
            <button onClick={() => sendSupport()} disabled={!supportInput.trim() || supportSending}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shrink-0"
              style={{ background: 'linear-gradient(135deg, oklch(0.7 0.14 220), oklch(0.6 0.14 230))', color: 'white' }}>
              <Send className="w-3.5 h-3.5" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
