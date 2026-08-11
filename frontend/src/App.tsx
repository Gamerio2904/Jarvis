import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  createConversation,
  getConversation,
  getHealth,
  listConversations,
  sendChat,
  type Conversation,
  type Health,
  type Message,
} from './api'
import './index.css'

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    void bootstrap()
    const t = window.setInterval(() => {
      void refreshHealth()
    }, 8000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [draft])

  async function refreshHealth() {
    try {
      setHealth(await getHealth())
    } catch {
      setHealth({
        ok: false,
        ollama: false,
        model: '?',
        model_ready: false,
        error: 'Backend nicht erreichbar',
      })
    }
  }

  async function bootstrap() {
    await refreshHealth()
    const list = await listConversations()
    setConversations(list)
    if (list[0]) {
      await openConversation(list[0].id)
    }
  }

  async function openConversation(id: string) {
    setError(null)
    setActiveId(id)
    setSidebarOpen(false)
    const data = await getConversation(id)
    setMessages(data.messages)
  }

  async function onNewChat() {
    setError(null)
    const created = await createConversation()
    setConversations((prev) => [created, ...prev])
    setActiveId(created.id)
    setMessages([])
    setSidebarOpen(false)
  }

  async function onSend() {
    const content = draft.trim()
    if (!content || busy) return

    setBusy(true)
    setError(null)
    setDraft('')

    try {
      let conversationId = activeId
      if (!conversationId) {
        const created = await createConversation()
        conversationId = created.id
        setConversations((prev) => [created, ...prev])
        setActiveId(created.id)
      }

      const optimistic: Message = {
        id: `tmp-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimistic])

      const result = await sendChat(conversationId, content)
      setMessages((prev) => {
        const withoutTmp = prev.filter((m) => m.id !== optimistic.id)
        return [...withoutTmp, result.user_message, result.assistant_message]
      })
      setConversations((prev) => {
        const rest = prev.filter((c) => c.id !== result.conversation.id)
        return [result.conversation, ...rest]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senden fehlgeschlagen')
    } finally {
      setBusy(false)
      textareaRef.current?.focus()
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void onSend()
    }
  }

  const activeTitle =
    conversations.find((c) => c.id === activeId)?.title ?? 'Jarvis'

  const healthOk = Boolean(health?.ok && health.model_ready)

  return (
    <div className="app">
      {sidebarOpen ? (
        <div className="backdrop" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" />
          <div>
            <h1>Jarvis</h1>
            <p>lokal · privat · v0.1</p>
          </div>
        </div>

        <button className="new-chat" type="button" onClick={() => void onNewChat()}>
          + Neues Gespräch
        </button>

        <div className="chat-list">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chat-item ${c.id === activeId ? 'active' : ''}`}
              onClick={() => void openConversation(c.id)}
            >
              {c.title}
            </button>
          ))}
        </div>

        <div className={`status ${healthOk ? '' : 'error'}`}>
          {healthOk ? (
            <>
              Ollama: <strong>online</strong>
              <br />
              Modell: {health?.model}
            </>
          ) : (
            <>
              Status: <strong>Problem</strong>
              <br />
              {health?.error ||
                (!health?.ollama
                  ? 'Ollama offline'
                  : `Modell fehlt — ollama pull ${health?.model}`)}
            </>
          )}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <button
            className="menu-btn"
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menü"
          >
            ☰
          </button>
          <h2>{activeTitle}</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Smalltalk MVP
          </span>
        </div>

        <div className="messages">
          <div className="messages-inner">
            {messages.length === 0 && !busy ? (
              <div className="empty">
                <h3>Jarvis</h3>
                <p>Schreib einfach los — lokal, ohne Cloud-Hirn.</p>
              </div>
            ) : null}

            {messages.map((m) => (
              <div key={m.id} className={`row ${m.role}`}>
                {m.role === 'assistant' ? (
                  <div className="avatar jarvis">J</div>
                ) : null}
                <div className="bubble">{m.content}</div>
              </div>
            ))}

            {busy ? (
              <div className="row assistant">
                <div className="avatar jarvis">J</div>
                <div className="bubble">
                  <div className="typing" aria-label="Jarvis schreibt">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="composer-wrap">
          {error ? <div className="error-banner">{error}</div> : null}
          <div className="composer">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Nachricht an Jarvis…"
              rows={1}
              disabled={busy}
            />
            <button type="button" onClick={() => void onSend()} disabled={busy || !draft.trim()}>
              Senden
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
