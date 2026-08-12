import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  clearMemory,
  createConversation,
  deleteConversation,
  deleteMemoryItem,
  getConversation,
  getHealth,
  listConversations,
  listMemory,
  streamChat,
  type Conversation,
  type Health,
  type MemoryCategory,
  type MemoryItem,
  type Message,
} from './api'
import './index.css'

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastFailed, setLastFailed] = useState<string | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [statusNote, setStatusNote] = useState<string | null>(null)
  const [composerFocused, setComposerFocused] = useState(false)
  const [threadKey, setThreadKey] = useState(0)
  const [enterIds, setEnterIds] = useState<Record<string, true>>({})
  const [memoryOpen, setMemoryOpen] = useState(false)
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([])
  const [memoryBusy, setMemoryBusy] = useState(false)
  const [memoryFilter, setMemoryFilter] = useState<MemoryCategory | 'all'>('all')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const stickToBottomRef = useRef(true)

  useEffect(() => {
    void bootstrap()
    const t = window.setInterval(() => {
      void refreshHealth()
    }, 8000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (!stickToBottomRef.current) return
    const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
    const streamBehavior: ScrollBehavior =
      streamingText !== null || prefersReducedMotion() ? 'auto' : behavior
    bottomRef.current?.scrollIntoView({ behavior: streamBehavior })
  }, [messages, busy, streamingText])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [draft])

  function markEnter(id: string) {
    setEnterIds((prev) => (prev[id] ? prev : { ...prev, [id]: true }))
  }

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

  async function refreshMemory(filter: MemoryCategory | 'all' = memoryFilter) {
    try {
      setMemoryItems(await listMemory(filter === 'all' ? null : filter))
    } catch {
      /* panel shows empty / prior list */
    }
  }

  async function bootstrap() {
    await refreshHealth()
    await refreshMemory()
    const list = await listConversations()
    setConversations(list)
    if (list[0]) {
      await openConversation(list[0].id)
    }
  }

  async function onDeleteMemory(id: string) {
    if (memoryBusy) return
    setMemoryBusy(true)
    try {
      await deleteMemoryItem(id)
      setMemoryItems((prev) => prev.filter((m) => m.id !== id))
      void refreshHealth()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Memory löschen fehlgeschlagen')
    } finally {
      setMemoryBusy(false)
    }
  }

  async function onClearMemory() {
    if (memoryBusy) return
    const ok = window.confirm('Alles löschen, was Jarvis über Sie weiß?')
    if (!ok) return
    setMemoryBusy(true)
    try {
      await clearMemory()
      setMemoryItems([])
      void refreshHealth()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Memory leeren fehlgeschlagen')
    } finally {
      setMemoryBusy(false)
    }
  }

  async function openConversation(id: string) {
    setError(null)
    setLastFailed(null)
    setActiveId(id)
    setSidebarOpen(false)
    setThreadKey((k) => k + 1)
    setEnterIds({})
    stickToBottomRef.current = true
    const data = await getConversation(id)
    setMessages(data.messages)
  }

  async function onNewChat() {
    setError(null)
    setLastFailed(null)
    const created = await createConversation()
    setConversations((prev) => [created, ...prev])
    setActiveId(created.id)
    setMessages([])
    setEnterIds({})
    setThreadKey((k) => k + 1)
    setSidebarOpen(false)
    stickToBottomRef.current = true
  }

  async function onDeleteChat() {
    if (!activeId || busy) return
    const ok = window.confirm('Dieses Gespräch wirklich löschen?')
    if (!ok) return
    try {
      await deleteConversation(activeId)
      const remaining = conversations.filter((c) => c.id !== activeId)
      setConversations(remaining)
      setMessages([])
      setEnterIds({})
      setActiveId(remaining[0]?.id ?? null)
      setThreadKey((k) => k + 1)
      if (remaining[0]) {
        await openConversation(remaining[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  function onMessagesScroll() {
    const el = messagesRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distance < 96
  }

  async function sendMessage(content: string) {
    if (!content || busy) return
    setBusy(true)
    setError(null)
    setLastFailed(null)
    setStatusNote(null)
    setStreamingText('')
    stickToBottomRef.current = true

    let conversationId = activeId
    try {
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
      markEnter(optimistic.id)
      setMessages((prev) => [...prev, optimistic])

      let acc = ''
      await streamChat(conversationId, content, {
        onMeta: (meta) => {
          markEnter(meta.user_message.id)
          setMessages((prev) => {
            const withoutTmp = prev.filter((m) => m.id !== optimistic.id)
            return [...withoutTmp, meta.user_message]
          })
          if (meta.using_fallback) {
            setStatusNote(`Fallback-Modell aktiv: ${meta.model}`)
          }
        },
        onToken: (token) => {
          acc += token
          setStreamingText(acc)
        },
        onReplace: (text) => {
          acc = text
          setStreamingText(text)
        },
        onRetry: (attempt) => {
          setStatusNote(`Antwort wird neu generiert (Versuch ${attempt})…`)
          acc = ''
          setStreamingText('')
        },
        onDone: (payload) => {
          setStreamingText(null)
          markEnter(payload.assistant_message.id)
          setMessages((prev) => [...prev, payload.assistant_message])
          setConversations((prev) => {
            const rest = prev.filter((c) => c.id !== payload.conversation.id)
            return [payload.conversation, ...rest]
          })
          setStatusNote(null)
        },
        onError: (detail) => {
          setError(detail)
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Senden fehlgeschlagen'
      setError(msg)
      setLastFailed(content)
      setStreamingText(null)
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('tmp-')))
    } finally {
      setBusy(false)
      textareaRef.current?.focus()
      void refreshHealth()
      void refreshMemory()
    }
  }

  async function onSend() {
    const content = draft.trim()
    if (!content || busy) return
    setDraft('')
    await sendMessage(content)
  }

  async function onRetry() {
    if (!lastFailed || busy) return
    await sendMessage(lastFailed)
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
  const fallback = Boolean(health?.using_fallback)

  return (
    <div className="app">
      <div
        className={`backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" />
          <div>
            <h1>Jarvis</h1>
            <p>lokal · privat · v0.5.0</p>
          </div>
        </div>

        <button className="new-chat" type="button" onClick={() => void onNewChat()}>
          + Neues Gespräch
        </button>

        <button
          className={`memory-toggle ${memoryOpen ? 'active' : ''}`}
          type="button"
          onClick={() => {
            setMemoryOpen((o) => !o)
            void refreshMemory()
          }}
        >
          Was Jarvis über mich weiß
          {typeof health?.memory_count === 'number' ? (
            <span className="memory-count">{health.memory_count}</span>
          ) : null}
        </button>

        {memoryOpen ? (
          <div className="memory-panel">
            <div className="memory-filters" role="tablist" aria-label="Memory-Kategorien">
              {(['all', 'pref', 'fact', 'boundary', 'open_loop'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={memoryFilter === f}
                  className={`memory-filter ${memoryFilter === f ? 'active' : ''}`}
                  onClick={() => {
                    setMemoryFilter(f)
                    void refreshMemory(f)
                  }}
                >
                  {f === 'all' ? 'Alle' : f}
                </button>
              ))}
            </div>
            {memoryItems.length === 0 ? (
              <p className="memory-empty">Noch nichts gespeichert.</p>
            ) : (
              <ul className="memory-list">
                {memoryItems.map((m) => {
                  const uncertain =
                    m.confidence < 0.7 || Boolean(m.expires_at)
                  return (
                    <li key={m.id} className="memory-item">
                      <div className="memory-meta">
                        <span className="memory-cat">{m.category}</span>
                        {uncertain ? (
                          <span className="memory-uncertain">unsicher</span>
                        ) : null}
                        <span className="memory-key">{m.key}</span>
                      </div>
                      <div className="memory-value">{m.value}</div>
                      <button
                        type="button"
                        className="memory-del"
                        disabled={memoryBusy}
                        onClick={() => void onDeleteMemory(m.id)}
                        aria-label={`Erinnerung ${m.key} löschen`}
                      >
                        Löschen
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            {memoryItems.length > 0 ? (
              <button
                type="button"
                className="memory-clear"
                disabled={memoryBusy}
                onClick={() => void onClearMemory()}
              >
                Alles löschen
              </button>
            ) : null}
          </div>
        ) : null}

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

        <div className={`status ${healthOk ? (fallback ? 'warn' : '') : 'error'}`}>
          {healthOk ? (
            <>
              Ollama: <strong>online</strong>
              <br />
              Modell: {health?.model}
              {fallback ? (
                <>
                  <br />
                  <strong>Fallback</strong> — besser:{' '}
                  {health?.configured_model || 'qwen2.5:7b'}
                </>
              ) : null}
            </>
          ) : (
            <>
              Status: <strong>Problem</strong>
              <br />
              {health?.error ||
                (!health?.ollama
                  ? 'Ollama offline — bitte starten'
                  : `Modell fehlt — ollama pull ${health?.configured_model || health?.model}`)}
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
          <h2 key={threadKey}>{activeTitle}</h2>
          <div className="topbar-actions">
            {activeId ? (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => void onDeleteChat()}
                disabled={busy}
              >
                Löschen
              </button>
            ) : null}
          </div>
        </div>

        {fallback && healthOk ? (
          <div className="fallback-banner">
            {health?.warning ||
              `Fallback-Modell aktiv (${health?.model}). Für beste Qualität: ollama pull ${health?.configured_model}`}
          </div>
        ) : null}

        <div className="messages" ref={messagesRef} onScroll={onMessagesScroll}>
          <div className="messages-inner">
            {messages.length === 0 && !busy && streamingText === null ? (
              <div className="empty">
                <h3>Jarvis</h3>
                <p>Schreib einfach los — lokal, ohne Cloud-Hirn.</p>
              </div>
            ) : null}

            {messages.map((m) => {
              const enter =
                enterIds[m.id] &&
                (m.role === 'user' ? 'enter-user' : 'enter-assistant')
              return (
                <div key={m.id} className={`row ${m.role}${enter ? ` ${enter}` : ''}`}>
                  {m.role === 'assistant' ? (
                    <div className="avatar jarvis">J</div>
                  ) : null}
                  <div className="bubble">{m.content}</div>
                </div>
              )
            })}

            {streamingText !== null ? (
              <div className="row assistant streaming">
                <div className="avatar jarvis">J</div>
                <div className="bubble">
                  {streamingText ? (
                    <>
                      {streamingText}
                      <span className="stream-caret" aria-hidden />
                    </>
                  ) : (
                    <div className="typing" aria-label="Jarvis schreibt">
                      <span />
                      <span />
                      <span />
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="composer-wrap">
          {statusNote ? <div className="status-note">{statusNote}</div> : null}
          {error ? (
            <div className="error-banner">
              <div>{error}</div>
              {lastFailed ? (
                <button type="button" className="retry-btn" onClick={() => void onRetry()}>
                  Erneut senden
                </button>
              ) : null}
            </div>
          ) : null}
          <div className={`composer ${composerFocused ? 'is-focused' : ''}`}>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
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
