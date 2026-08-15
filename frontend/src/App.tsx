import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  clearMemory,
  createConversation,
  deleteConversation,
  deleteMemoryItem,
  getConversation,
  getHealth,
  getSettings,
  listConversations,
  listMemory,
  listResearchAudits,
  listReminders,
  patchSettings,
  removeReminder,
  streamChat,
  syncReminderAlarms,
  ensureModel,
  hasCachedModel,
  isModelReady,
  isGeminiConfigured,
  releaseModel,
  tvDiscover,
  tvPair,
  tvTest,
  testGemini,
  testGroq,
  type Conversation,
  type Health,
  type MemoryCategory,
  type MemoryItem,
  type Message,
  type Reminder,
  type ResearchAudit,
  type ResearchMeta,
  type Settings,
  type ToolMeta,
} from './api'
import './index.css'
import { playUiSound, unlockUiAudio } from './sounds'
import { TEST_PROMPTS } from './engine/test-prompts'
import { CalendarView } from './Calendar'
import { VoiceMode } from './VoiceMode'
import { consumeVoiceLaunch, pinVoiceShortcut } from './native/voice'

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function ToolChip({
  tool,
  onConfirm,
}: {
  tool: ToolMeta
  onConfirm?: (text: string) => void
}) {
  const status = tool.tool_status || ''
  const label =
    tool.label ||
    ({
      pending: 'Tool bereit — Confirm?',
      executed: 'Tool ausgeführt',
      aborted: 'Tool abgelehnt',
      duplicate: 'Todo schon offen',
      error: 'Tool-Fehler',
      timeout: 'Confirm abgelaufen',
      parse_miss: 'Tool unklar',
    } as Record<string, string>)[status] ||
    (status ? `Tool: ${status}` : 'Tool')
  return (
    <span className="tool-chip-wrap">
      <span className={`tool-chip tool-chip--${status || 'unknown'}`} data-status={status}>
        {label}
      </span>
      {status === 'pending' && onConfirm ? (
        <span className="confirm-row">
          <button type="button" className="confirm-btn yes" onClick={() => onConfirm('Ja')}>
            Ja
          </button>
          <button type="button" className="confirm-btn no" onClick={() => onConfirm('Nein')}>
            Nein
          </button>
        </span>
      ) : null}
    </span>
  )
}

function SourcesBlock({
  research,
  onOpenAudit,
}: {
  research: ResearchMeta
  onOpenAudit?: (auditId?: string) => void
}) {
  const sources = research.sources || []
  const status = research.status_label || research.badge || research.status
  const query = research.query
  if (!sources.length && !status && !query) return null
  return (
    <details className="sources-block" open>
      <summary>
        <span className="sources-badge">{status || 'Quellen'}</span>
        {sources.length ? (
          <span className="sources-count">
            {sources.length} prüfbar
          </span>
        ) : null}
        {query ? <span className="sources-query"> · {query}</span> : null}
      </summary>
      {sources.length ? (
        <ul className="sources-list">
          {sources.map((s, i) => (
            <li key={`${s.url}-${i}`}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault()
                  window.open(s.url, '_blank', 'noopener,noreferrer')
                }}
              >
                [{i + 1}] {s.title}
              </a>
              {s.url ? <p className="sources-url">{s.url}</p> : null}
              {s.snippet ? <p>{s.snippet}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="sources-empty">
          {research.error
            ? `${research.status || 'Status'} · ${research.error}`
            : 'Suche gelaufen, aber keine Links geliefert.'}
        </p>
      )}
      {research.audit_id ? (
        <p className="sources-audit">
          <button
            type="button"
            className="linkish"
            onClick={() => onOpenAudit?.(research.audit_id)}
          >
            Im Audit merken ({research.audit_id.slice(0, 8)}…)
          </button>
        </p>
      ) : null}
      {research.privacy_note ? (
        <p className="sources-privacy">{research.privacy_note}</p>
      ) : null}
    </details>
  )
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
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsBusy, setSettingsBusy] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [momentGlint, setMomentGlint] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [audits, setAudits] = useState<ResearchAudit[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [remindBusy, setRemindBusy] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [shortcutMsg, setShortcutMsg] = useState<string | null>(null)
  const [streamResearch, setStreamResearch] = useState<ResearchMeta | null>(null)
  const [setupOpen, setSetupOpen] = useState(() => !isGeminiConfigured() && !isModelReady())
  const [downloadPct, setDownloadPct] = useState(0)
  const [downloadBusy, setDownloadBusy] = useState(false)
  const [downloadPhase, setDownloadPhase] = useState<'download' | 'load'>('download')
  const [hasLocalModel, setHasLocalModel] = useState(false)
  const [tvBusy, setTvBusy] = useState(false)
  const [tvMsg, setTvMsg] = useState<string | null>(null)
  const [tvFound, setTvFound] = useState<
    Array<{ host?: string; name?: string; mac?: string; port?: number }>
  >([])
  const [geminiBusy, setGeminiBusy] = useState(false)
  const [geminiMsg, setGeminiMsg] = useState<string | null>(null)
  const [groqBusy, setGroqBusy] = useState(false)
  const [groqMsg, setGroqMsg] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const stickToBottomRef = useRef(true)
  const sawTokenRef = useRef(false)

  useEffect(() => {
    const unlock = () => {
      void unlockUiAudio()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  useEffect(() => {
    void bootstrap()
    const t = window.setInterval(() => {
      void refreshHealth()
    }, 8000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (!busy) {
      sawTokenRef.current = false
      return
    }
    const started = Date.now()
    const cloud = Boolean(settings?.gemini_enabled && settings.gemini_api_key?.trim())
    const id = window.setInterval(() => {
      if (sawTokenRef.current) return
      const s = Math.max(1, Math.round((Date.now() - started) / 1000))
      setStatusNote(
        cloud
          ? `Jarvis denkt… ${s}s`
          : `Jarvis denkt… ${s}s — erstes Wort kann auf dem Handy dauern.`,
      )
    }, 1000)
    return () => window.clearInterval(id)
  }, [busy, settings?.gemini_enabled, settings?.gemini_api_key])

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
        error: 'Modell nicht geladen',
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

  async function refreshSettings() {
    try {
      setSettings(await getSettings())
    } catch {
      /* ignore */
    }
  }

  async function refreshReminders() {
    try {
      const rows = await listReminders()
      setReminders(rows.filter((r) => r.status === 'open'))
    } catch {
      setReminders([])
    }
  }

  async function onDeleteReminder(id: string) {
    if (remindBusy) return
    setRemindBusy(true)
    try {
      await removeReminder(id)
      setReminders((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erinnerung löschen fehlgeschlagen')
    } finally {
      setRemindBusy(false)
    }
  }

  async function refreshAudits() {
    try {
      setAudits(await listResearchAudits(20))
    } catch {
      setAudits([])
    }
  }

  async function patchSetting(patch: Partial<Settings>) {
    if (settingsBusy) return
    setSettingsBusy(true)
    try {
      const updated = await patchSettings(patch)
      setSettings(updated)
      if (patch.ui_sounds) {
        await unlockUiAudio()
        playUiSound('send', {
          enabled: true,
          volume: (updated.ui_sound_volume as 'low' | 'medium' | 'high') || 'low',
        })
      }
      if (updated.gemini_enabled && updated.gemini_api_key?.trim()) {
        setSetupOpen(false)
        void releaseModel()
      }
      void refreshHealth()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Settings speichern fehlgeschlagen')
    } finally {
      setSettingsBusy(false)
    }
  }

  async function onTvDiscover() {
    if (tvBusy) return
    setTvBusy(true)
    setTvMsg('Suche im WLAN…')
    try {
      const res = await tvDiscover()
      const items = (res.items || []) as Array<{
        host?: string
        name?: string
        mac?: string
        port?: number
      }>
      setTvFound(items)
      setTvMsg(
        items.length
          ? `${items.length} Gerät${items.length === 1 ? '' : 'e'} gefunden.`
          : res.message || 'Nichts gefunden.',
      )
    } catch (err) {
      setTvMsg(err instanceof Error ? err.message : 'Suchen fehlgeschlagen')
    } finally {
      setTvBusy(false)
    }
  }

  async function onTvPick(item: { host?: string; name?: string; mac?: string; port?: number }) {
    if (!item.host) return
    await patchSetting({
      tv_host: item.host,
      tv_name: item.name || settings?.tv_name || 'Wohnzimmer',
      tv_mac: item.mac || settings?.tv_mac || '',
      tv_port: item.port || settings?.tv_port || 8002,
    })
    setTvMsg(`Gewählt: ${item.name || item.host}`)
  }

  async function onTvPair() {
    if (tvBusy) return
    setTvBusy(true)
    setTvMsg('Koppeln — am Fernseher erlauben…')
    try {
      const res = await tvPair({
        host: settings?.tv_host,
        mac: settings?.tv_mac,
        name: settings?.tv_name,
        port: settings?.tv_port,
      })
      setTvMsg(res.message)
      await refreshSettings()
    } catch (err) {
      setTvMsg(err instanceof Error ? err.message : 'Koppeln fehlgeschlagen')
    } finally {
      setTvBusy(false)
    }
  }

  async function onGeminiTest() {
    if (geminiBusy) return
    setGeminiBusy(true)
    setGeminiMsg('Teste Gemini…')
    try {
      const res = await testGemini()
      setGeminiMsg(res.reply)
      await refreshHealth()
    } catch (err) {
      setGeminiMsg(err instanceof Error ? err.message : 'Test fehlgeschlagen')
    } finally {
      setGeminiBusy(false)
    }
  }

  async function onGroqTest() {
    if (groqBusy) return
    setGroqBusy(true)
    setGroqMsg('Teste Groq…')
    try {
      const res = await testGroq()
      setGroqMsg(res.reply)
    } catch (err) {
      setGroqMsg(err instanceof Error ? err.message : 'Test fehlgeschlagen')
    } finally {
      setGroqBusy(false)
    }
  }

  async function onTvTest() {
    if (tvBusy) return
    setTvBusy(true)
    setTvMsg('Teste Verbindung…')
    try {
      const res = await tvTest()
      setTvMsg(res.reply || (res.ok ? 'Erreichbar.' : 'Nicht erreichbar.'))
    } catch (err) {
      setTvMsg(err instanceof Error ? err.message : 'Test fehlgeschlagen')
    } finally {
      setTvBusy(false)
    }
  }

  async function bootstrap() {
    await refreshHealth()
    await refreshSettings()
    await refreshMemory()
    try {
      await syncReminderAlarms()
    } catch {
      /* browser ohne Notification ist ok */
    }
    await refreshReminders()
    try {
      if (await consumeVoiceLaunch()) {
        setVoiceOpen(true)
        setCalendarOpen(false)
      }
    } catch {
      /* browser ohne Deep-Link */
    }
    const s = await getSettings()
    const gemini = Boolean(s.gemini_enabled && s.gemini_api_key?.trim())
    try {
      setHasLocalModel(await hasCachedModel())
    } catch {
      setHasLocalModel(false)
    }
    if (gemini) {
      setSetupOpen(false)
      void releaseModel()
    } else if (isModelReady()) {
      setSetupOpen(false)
    } else {
      setSetupOpen(true)
    }
    try {
      const list = await listConversations()
      setConversations(list)
      if (list[0]) {
        await openConversation(list[0].id)
      }
    } catch {
      /* empty start is fine */
    }
  }

  async function downloadModel() {
    setDownloadBusy(true)
    setError(null)
    try {
      await ensureModel((p) => {
        setDownloadPct(p.pct)
        setDownloadPhase(p.phase)
      })
      setHasLocalModel(true)
      setSetupOpen(false)
      await bootstrap()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modell-Download fehlgeschlagen')
    } finally {
      setDownloadBusy(false)
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
    setStatusNote('Jarvis denkt…')
    setStreamingText('')
    setStreamResearch(null)
    stickToBottomRef.current = true
    playUiSound('send', {
      enabled: Boolean(settings?.ui_sounds),
      volume: (settings?.ui_sound_volume as 'low' | 'medium' | 'high') || 'low',
    })

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
          if (meta.research) setStreamResearch(meta.research)
          if (meta.using_fallback) {
            setStatusNote(`Fallback-Modell aktiv: ${meta.model}`)
          }
        },
        onToken: (token) => {
          sawTokenRef.current = true
          acc += token
          setStreamingText(acc)
          setStatusNote(null)
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
          setStreamResearch(null)
          markEnter(payload.assistant_message.id)
          const msg = payload.assistant_message
          if (payload.research && !msg.meta?.research) {
            msg.meta = { ...(msg.meta || {}), research: payload.research }
          }
          if (payload.tool && !msg.meta?.tool) {
            msg.meta = { ...(msg.meta || {}), tool: payload.tool }
          }
          setMessages((prev) => [...prev, msg])
          setConversations((prev) => {
            const rest = prev.filter((c) => c.id !== payload.conversation.id)
            return [payload.conversation, ...rest]
          })
          setStatusNote(null)
          playUiSound('receive', {
            enabled: Boolean(settings?.ui_sounds),
            volume: (settings?.ui_sound_volume as 'low' | 'medium' | 'high') || 'low',
          })
          const delight = (payload as { delight?: { moment?: string } }).delight
          if (delight?.moment) {
            setMomentGlint(true)
            window.setTimeout(() => setMomentGlint(false), 1200)
            playUiSound('moment', {
              enabled: Boolean(settings?.ui_sounds),
              volume: (settings?.ui_sound_volume as 'low' | 'medium' | 'high') || 'low',
            })
          }
          if (payload.research) void refreshAudits()
          if (payload.tool?.tool === 'reminder') void refreshReminders()
          if (payload.tool?.tool === 'calendar') {
            if (payload.tool.action === 'open') {
              setCalendarOpen(true)
              setSidebarOpen(false)
            }
          }
        },
        onError: (detail) => {
          setError(detail)
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Senden fehlgeschlagen'
      setError(msg)
      playUiSound('error', {
        enabled: Boolean(settings?.ui_sounds),
        volume: (settings?.ui_sound_volume as 'low' | 'medium' | 'high') || 'low',
      })
      setLastFailed(content)
      setStreamingText(null)
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('tmp-')))
    } finally {
      setBusy(false)
      textareaRef.current?.focus()
      void refreshHealth()
      void refreshMemory()
      void refreshSettings()
    }
  }

  async function onSend() {
    const content = draft.trim()
    if (!content || busy) return
    setDraft('')
    await sendMessage(content)
  }

  async function sendVoiceTurn(content: string): Promise<string> {
    let conversationId = activeId
    if (!conversationId) {
      const created = await createConversation()
      conversationId = created.id
      setConversations((prev) => [created, ...prev])
      setActiveId(created.id)
    }
    const optimistic: Message = {
      id: `tmp-voice-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    markEnter(optimistic.id)
    setMessages((prev) => [...prev, optimistic])
    let answer = ''
    await streamChat(
      conversationId,
      content,
      {
        onMeta: (meta) => {
          markEnter(meta.user_message.id)
          setMessages((prev) => {
            const withoutTmp = prev.filter((m) => m.id !== optimistic.id)
            return [...withoutTmp, meta.user_message]
          })
        },
        onDone: (payload) => {
          markEnter(payload.assistant_message.id)
          answer = payload.assistant_message.content
          setMessages((prev) => [...prev, payload.assistant_message])
          setConversations((prev) => {
            const rest = prev.filter((c) => c.id !== payload.conversation.id)
            return [payload.conversation, ...rest]
          })
          if (payload.tool?.tool === 'reminder') void refreshReminders()
        },
        onError: (detail) => {
          setError(detail)
        },
      },
      { voice: true },
    )
    return answer
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

  const healthOk = Boolean(health?.ok)
  const geminiOn = Boolean(settings?.gemini_enabled && settings.gemini_api_key?.trim())

  return (
    <div className="app">
      {setupOpen ? (
        <div className="setup-overlay" role="dialog" aria-labelledby="setup-title">
          <div className="setup-card">
            <h2 id="setup-title">Modell aufs Handy</h2>
            <p>
              Jarvis kann lokal auf dem Handy denken (einmal ~470 MB) oder über Gemini
              (Google). Das lokale Modell startet nur, wenn Gemini aus ist.
            </p>
            {downloadBusy ? (
              <p className="settings-hint">
                {downloadPhase === 'load' || hasLocalModel
                  ? 'Modell wird geladen — kein erneuter Download.'
                  : downloadPct > 0
                    ? `Download ${downloadPct}% … Gerät nicht sperren.`
                    : 'Download läuft … Gerät nicht sperren.'}
              </p>
            ) : (
              <p className="settings-hint">
                {hasLocalModel
                  ? 'Modell liegt auf dem Gerät. Einmal starten, dann chatten.'
                  : 'WLAN empfohlen. Das Modell bleibt auf dem Handy.'}
              </p>
            )}
            {error ? <p className="settings-hint setup-error">{error}</p> : null}
            <button
              type="button"
              className="retry-btn"
              disabled={downloadBusy}
              onClick={() => void downloadModel()}
            >
              {downloadBusy
                ? downloadPhase === 'load' || hasLocalModel
                  ? 'Modell starten…'
                  : `Laden ${downloadPct}%`
                : hasLocalModel
                  ? 'Modell starten'
                  : 'Modell herunterladen'}
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={downloadBusy}
              onClick={() => {
                setSetupOpen(false)
                setSidebarOpen(true)
                setSettingsPanelOpen(true)
              }}
            >
              Stattdessen Gemini (Google)
            </button>
            <p className="settings-hint">Gemini: Chat geht zu Google. Key von aistudio.google.com</p>
          </div>
        </div>
      ) : null}
      <div
        className={`backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className={`brand-mark${momentGlint ? ' glint' : ''}`} />
          <div>
            <h1>Jarvis</h1>
            <p>Handy · v1.5.1</p>
          </div>
        </div>

        <button className="new-chat" type="button" onClick={() => void onNewChat()}>
          + Neues Gespräch
        </button>
        <button
          type="button"
          className={`memory-toggle ${calendarOpen ? 'active' : ''}`}
          onClick={() => {
            setCalendarOpen(true)
            setSidebarOpen(false)
          }}
        >
          Kalender
        </button>
        <button
          type="button"
          className={`memory-toggle ${voiceOpen ? 'active' : ''}`}
          onClick={() => {
            setVoiceOpen(true)
            setCalendarOpen(false)
            setSidebarOpen(false)
          }}
        >
          Jarvis hören
        </button>

        <button
          type="button"
          className={`memory-toggle ${settingsPanelOpen ? 'active' : ''}`}
          onClick={() => {
            setSettingsPanelOpen((o) => !o)
            void refreshReminders()
          }}
        >
          Einstellungen
        </button>
        {settingsPanelOpen ? (
          <div className="settings-panel" id="settings">
            <section className="settings-section">
              <h3>Allgemein</h3>
              <p className="settings-hint">Version {settings?.version || '1.5.1'} · Handy</p>
            </section>
            <section className="settings-section">
              <h3>Gemini (Google)</h3>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings?.gemini_enabled)}
                  disabled={settingsBusy}
                  onChange={(e) => void patchSetting({ gemini_enabled: e.target.checked })}
                />
                <span>Gemini statt lokalem 0.5B</span>
              </label>
              <p className="settings-hint warn">
                An = Chat geht zu Google. Nicht privat. Bestes Free-Modell zuerst; bei Limit oder
                Überlastung sofort das nächste.
              </p>
              <label className="settings-inline">
                <span>API-Key</span>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  key={`gemini-key-${settings?.gemini_api_key ? 'set' : 'empty'}`}
                  defaultValue={settings?.gemini_api_key || ''}
                  disabled={settingsBusy}
                  placeholder="AIza… hier einfügen"
                  onBlur={(e) => void patchSetting({ gemini_api_key: e.target.value.trim() })}
                />
              </label>
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={geminiBusy || settingsBusy}
                  onClick={() => void onGeminiTest()}
                >
                  Testen
                </button>
              </div>
              {geminiMsg ? <p className="settings-hint">{geminiMsg}</p> : null}
              <p className="settings-hint">
                Key: aistudio.google.com/apikey — auf dem Handy speichern, nicht teilen.
              </p>
            </section>
            <section className="settings-section">
              <h3>Fallback Groq (optional)</h3>
              <p className="settings-hint">
                Kein dauerhaft kostenloses Modell ohne eigenen Key. Groq hat einen großen Free-Tier
                (Llama, ohne Kreditkarte). Nur wenn Gemini leer oder überlastet ist.
              </p>
              <label className="settings-inline">
                <span>API-Key</span>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  key={`groq-key-${settings?.groq_api_key ? 'set' : 'empty'}`}
                  defaultValue={settings?.groq_api_key || ''}
                  disabled={settingsBusy}
                  placeholder="gsk_… hier einfügen"
                  onBlur={(e) => void patchSetting({ groq_api_key: e.target.value.trim() })}
                />
              </label>
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={groqBusy || settingsBusy}
                  onClick={() => void onGroqTest()}
                >
                  Testen
                </button>
              </div>
              {groqMsg ? <p className="settings-hint">{groqMsg}</p> : null}
              <p className="settings-hint">Key: console.groq.com/keys — nicht teilen.</p>
            </section>
            <section className="settings-section">
              <h3>Modell</h3>
              <p className="settings-hint">
                {settings?.model_default || 'Qwen2.5 0.5B'} läuft auf diesem Handy (llama.cpp / WASM).
                Kleiner als der alte PC-7b — dafür ohne Server.
              </p>
              {!health?.model_ready && !geminiOn ? (
                <button
                  type="button"
                  className="retry-btn"
                  disabled={downloadBusy}
                  onClick={() => void downloadModel()}
                >
                  {downloadBusy
                    ? downloadPhase === 'load' || hasLocalModel
                      ? 'Modell starten…'
                      : `Laden ${downloadPct}%`
                    : hasLocalModel
                      ? 'Modell starten'
                      : 'Modell laden'}
                </button>
              ) : geminiOn ? (
                <p className="settings-hint">Lokal aus — Gemini übernimmt den Chat. Modell wird nicht geladen.</p>
              ) : (
                <p className="settings-hint">Modell bereit.</p>
              )}
            </section>
            <section className="settings-section">
              <h3>Delight</h3>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings?.delight_moments)}
                  disabled={settingsBusy}
                  onChange={(e) => void patchSetting({ delight_moments: e.target.checked })}
                />
                <span>Jarvis-Momente</span>
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings?.delight_jokes)}
                  disabled={settingsBusy}
                  onChange={(e) => void patchSetting({ delight_jokes: e.target.checked })}
                />
                <span>Inside Jokes</span>
              </label>
              <label className="settings-inline">
                <span>Witz-Frequenz</span>
                <select
                  value={settings?.delight_joke_frequency || 'selten'}
                  disabled={settingsBusy}
                  onChange={(e) => void patchSetting({ delight_joke_frequency: e.target.value })}
                >
                  <option value="selten">Selten</option>
                  <option value="normal">Normal</option>
                </select>
              </label>
            </section>
            <section className="settings-section">
              <h3>Ort & Wetter</h3>
              <p className="settings-hint">
                „Wetter heute“ / „Temperatur hier“ nutzt den Standort einmal. Zahlen kommen von
                Open-Meteo — Jarvis rät nicht. Oder „Wetter in München“.
              </p>
              <p className="settings-hint">
                {settings?.last_place
                  ? `Letzter Ort: ${settings.last_place}`
                  : 'Noch kein Standort. Einmal im Chat nach dem Wetter fragen.'}
              </p>
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={settingsBusy}
                  onClick={() =>
                    void patchSetting({
                      last_lat: '',
                      last_lon: '',
                      last_place: '',
                      last_fix_at: '',
                    })
                  }
                >
                  Ort vergessen
                </button>
              </div>
            </section>
            <section className="settings-section">
              <h3>Erinnerungen</h3>
              <p className="settings-hint">
                Chat: „in 20 Minuten Milch“, „morgen 8 Uhr Steuer“. Ping auch wenn die App im
                Hintergrund ist.
              </p>
              {reminders.length === 0 ? (
                <p className="memory-empty">Keine offenen Erinnerungen.</p>
              ) : (
                <ul className="memory-list">
                  {reminders.map((r) => (
                    <li key={r.id} className="memory-item">
                      <div className="memory-value">{r.title}</div>
                      <div className="memory-key">
                        {new Date(r.due_at).toLocaleString('de-DE', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <button
                        type="button"
                        className="memory-del"
                        disabled={remindBusy}
                        onClick={() => void onDeleteReminder(r.id)}
                      >
                        Löschen
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="settings-section">
              <h3>Sprachmodus</h3>
              <p className="settings-hint">
                Gespräch, kein Mitschnitt. Die Android-Standardstimme klingt oft nach Roboter
                (Pico). Mit Gemini-Key nimmt Jarvis die natürliche Gemini-Stimme (Charon, Deutsch).
              </p>
              <label className="settings-inline">
                <span>Stimme</span>
                <select
                  value={settings?.voice_tts || 'auto'}
                  disabled={settingsBusy}
                  onChange={(e) => void patchSetting({ voice_tts: e.target.value })}
                >
                  <option value="auto">Auto (Gemini wenn an, sonst System)</option>
                  <option value="gemini">Gemini — natürlich, geht ins Netz</option>
                  <option value="system">System — offline, oft hart</option>
                </select>
              </label>
              <p className="settings-hint">
                Ohne Gemini: unter Android „Text-in-Sprache-Ausgabe“ die Google-Stimme Deutsch
                installieren. Extra-Dienste wie ElevenLabs brauchen einen eigenen Key — nicht in
                dieser Version.
              </p>
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  onClick={() => {
                    setVoiceOpen(true)
                    setSidebarOpen(false)
                  }}
                >
                  Jetzt hören
                </button>
                <button
                  type="button"
                  className="retry-btn"
                  onClick={() => {
                    void pinVoiceShortcut().then((r) =>
                      setShortcutMsg(r.ok ? 'Shortcut-Dialog ist offen.' : r.message || 'Nicht gesetzt.'),
                    )
                  }}
                >
                  Shortcut auf Homescreen
                </button>
              </div>
              {shortcutMsg ? <p className="settings-hint">{shortcutMsg}</p> : null}
            </section>
            <section className="settings-section">
              <h3>Sound</h3>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings?.ui_sounds)}
                  disabled={settingsBusy}
                  onChange={(e) => void patchSetting({ ui_sounds: e.target.checked })}
                />
                <span>UI-Sounds</span>
              </label>
              <p className="settings-hint">
                An = kurzer Ton beim Senden. Beim Einschalten sollte es einmal piepen.
              </p>
              <label className="settings-inline">
                <span>Lautstärke</span>
                <select
                  value={settings?.ui_sound_volume || 'low'}
                  disabled={settingsBusy || !settings?.ui_sounds}
                  onChange={(e) => void patchSetting({ ui_sound_volume: e.target.value })}
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                </select>
              </label>
            </section>
            <section className="settings-section">
              <h3>Gerät</h3>
              <p className="settings-hint">
                Alles läuft auf diesem Handy. Kein Server, kein Token, keine NAS.
              </p>
            </section>
            <section className="settings-section">
              <h3>Fernseher</h3>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings?.tv_enabled)}
                  disabled={settingsBusy}
                  onChange={(e) => void patchSetting({ tv_enabled: e.target.checked })}
                />
                <span>TV-Steuerung an</span>
              </label>
              <p className="settings-hint">
                {settings?.tv_paired
                  ? `Gekoppelt: ${settings.tv_name || settings.tv_host || 'TV'}`
                  : 'Nicht gekoppelt. Suchen, am TV erlauben, dann testen.'}
              </p>
              <label className="settings-inline">
                <span>Name</span>
                <input
                  key={`tv-name-${settings?.tv_name || ''}`}
                  defaultValue={settings?.tv_name || ''}
                  disabled={settingsBusy}
                  onBlur={(e) => void patchSetting({ tv_name: e.target.value })}
                />
              </label>
              <label className="settings-inline">
                <span>Host</span>
                <input
                  key={`tv-host-${settings?.tv_host || ''}`}
                  defaultValue={settings?.tv_host || ''}
                  disabled={settingsBusy}
                  placeholder="192.168.1.20"
                  onBlur={(e) => void patchSetting({ tv_host: e.target.value })}
                />
              </label>
              <label className="settings-inline">
                <span>MAC</span>
                <input
                  key={`tv-mac-${settings?.tv_mac || ''}`}
                  defaultValue={settings?.tv_mac || ''}
                  disabled={settingsBusy}
                  placeholder="aa:bb:cc:dd:ee:ff"
                  onBlur={(e) => void patchSetting({ tv_mac: e.target.value })}
                />
              </label>
              <label className="settings-inline">
                <span>Port</span>
                <input
                  key={`tv-port-${settings?.tv_port || 8002}`}
                  defaultValue={String(settings?.tv_port || 8002)}
                  disabled={settingsBusy}
                  onBlur={(e) => {
                    const n = Number(e.target.value)
                    if (Number.isFinite(n)) void patchSetting({ tv_port: n })
                  }}
                />
              </label>
              <div className="settings-actions">
                <button type="button" className="retry-btn" disabled={tvBusy} onClick={() => void onTvDiscover()}>
                  Suchen
                </button>
                <button type="button" className="retry-btn" disabled={tvBusy} onClick={() => void onTvPair()}>
                  Koppeln
                </button>
                <button type="button" className="retry-btn" disabled={tvBusy} onClick={() => void onTvTest()}>
                  Testen
                </button>
              </div>
              {tvFound.length ? (
                <ul className="tv-found">
                  {tvFound.map((item) => (
                    <li key={`${item.host}-${item.mac || ''}`}>
                      <button type="button" disabled={tvBusy} onClick={() => void onTvPick(item)}>
                        {item.name || 'Samsung TV'} · {item.host}
                        {item.mac ? ` · ${item.mac}` : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {tvMsg ? <p className="settings-hint">{tvMsg}</p> : null}
              <p className="settings-hint">
                Chat: „Fernseher an/aus“, „lauter“, „HDMI 2“. Gleiches WLAN, kein Gastnetz.
              </p>
            </section>
            <section className="settings-section">
              <h3>Easter Eggs</h3>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={settings?.easter_eggs_enabled !== false}
                  disabled={settingsBusy}
                  onChange={(e) => void patchSetting({ easter_eggs_enabled: e.target.checked })}
                />
                <span>Easter Eggs aktiv</span>
              </label>
              <ul className="egg-list">
                {(settings?.easter_eggs || []).map((egg) => (
                  <li key={egg.command}>
                    <code>{egg.command}</code>
                    <span>{egg.description}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="settings-section">
              <h3>Forschung (Netz)</h3>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings?.research_opt_in)}
                  disabled={settingsBusy}
                  onChange={(e) => void patchSetting({ research_opt_in: e.target.checked })}
                />
                <span>Internet-Research (Opt-in)</span>
              </label>
              <p className="settings-hint">
                An = Websuche über Google (braucht Gemini). Wetter selbst kommt von Open-Meteo
                (Quelle sichtbar). Aus = keine erfundene Suche.
              </p>
              <button
                type="button"
                className={`audit-toggle ${auditOpen ? 'active' : ''}`}
                onClick={() => {
                  setAuditOpen((o) => !o)
                  void refreshAudits()
                }}
              >
                Research-Audit
              </button>
              {auditOpen ? (
                <div className="audit-panel">
                  {audits.length === 0 ? (
                    <p className="memory-empty">Noch keine Research-Turns.</p>
                  ) : (
                    <ul className="audit-list">
                      {audits.map((a) => (
                        <li key={a.id}>
                          <div className="audit-meta">
                            <span>{a.status}</span>
                            <time>{new Date(a.created_at).toLocaleString()}</time>
                          </div>
                          <div className="audit-query">{a.query}</div>
                          <div className="audit-sources">{a.sources?.length || 0} Quellen</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </section>
            <section className="settings-section danger-zone">
              <h3>Danger Zone</h3>
              <p className="settings-hint">Memory löschen braucht Bestätigung.</p>
              <button
                type="button"
                className="memory-clear"
                disabled={memoryBusy}
                onClick={() => void onClearMemory()}
              >
                Alles über mich löschen
              </button>
            </section>
          </div>
        ) : null}

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
              {(['all', 'pref', 'fact', 'joke', 'boundary', 'open_loop'] as const).map((f) => (
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

        <div className={`status ${healthOk ? (geminiOn ? 'warn' : '') : 'error'}`}>
          {healthOk ? (
            geminiOn ? (
              <>
                Gemini: <strong>an</strong>
                <br />
                Chat geht zu Google
              </>
            ) : (
              <>
                Gerät: <strong>bereit</strong>
                <br />
                Modell: {health?.model}
                <br />
                on-device · kein Server
              </>
            )
          ) : (
            <>
              Gerät: <strong>nicht bereit</strong>
              <br />
              {health?.error || 'Modell laden oder Gemini einschalten.'}
            </>
          )}
          {settings?.tv_enabled ? (
            <>
              <br />
              TV: {settings.tv_paired ? settings.tv_name || 'gekoppelt' : 'nicht gekoppelt'}
            </>
          ) : null}
        </div>
      </aside>

      <main className="main">
        {voiceOpen ? (
          <VoiceMode
            onClose={() => setVoiceOpen(false)}
            onTurn={(text) => sendVoiceTurn(text)}
          />
        ) : null}
        {calendarOpen ? <CalendarView onClose={() => setCalendarOpen(false)} /> : null}
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

        {geminiOn && healthOk ? (
          <div className="fallback-banner">
            Gemini (Google) — Nachrichten gehen ins Netz.
          </div>
        ) : null}

        <div className="messages" ref={messagesRef} onScroll={onMessagesScroll}>
          <div className="messages-inner">
            {messages.length === 0 && !busy && streamingText === null ? (
              <div className="empty">
                <h3>Jarvis</h3>
                <p>Ein Feld antippen — oder selbst schreiben. {geminiOn ? 'Gemini (Google), nicht privat.' : 'Lokal, ohne Cloud-Hirn.'}</p>
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
                  <div className="bubble">
                    <div className="bubble-text">{m.content}</div>
                    {m.role === 'assistant' && m.meta?.tool ? (
                      <ToolChip
                        tool={m.meta.tool}
                        onConfirm={(text) => void sendMessage(text)}
                      />
                    ) : null}
                    {m.role === 'assistant' && m.meta?.research ? (
                      <SourcesBlock
                        research={m.meta.research}
                        onOpenAudit={(id) => {
                          setSettingsPanelOpen(true)
                          setAuditOpen(true)
                          void refreshAudits()
                          if (id) setStatusNote(`Audit ${id.slice(0, 8)}… in Einstellungen`)
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              )
            })}

            {streamingText !== null ? (
              <div className="row assistant streaming">
                <div className="avatar jarvis">J</div>
                <div className="bubble">
                  {streamingText ? (
                    <>
                      <div className="bubble-text">
                        {streamingText}
                        <span className="stream-caret" aria-hidden />
                      </div>
                      {streamResearch ? (
                        <SourcesBlock
                          research={streamResearch}
                          onOpenAudit={(id) => {
                            setSettingsPanelOpen(true)
                            setAuditOpen(true)
                            void refreshAudits()
                            if (id) setStatusNote(`Audit ${id.slice(0, 8)}… in Einstellungen`)
                          }}
                        />
                      ) : null}
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
          <div className="prompt-chips" role="list" aria-label="Test-Prompts">
            {TEST_PROMPTS.map((text) => (
              <button
                key={text}
                type="button"
                className="prompt-chip"
                role="listitem"
                disabled={busy}
                onClick={() => void sendMessage(text)}
              >
                {text}
              </button>
            ))}
          </div>
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
            <button
              type="button"
              className="mic-btn"
              onClick={() => {
                setVoiceOpen(true)
                setCalendarOpen(false)
              }}
              aria-label="Sprachmodus"
            >
              Hören
            </button>
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
