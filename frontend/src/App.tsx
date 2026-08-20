import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
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
  tvFireTest,
  testGemini,
  testGroq,
  readEyeImage,
  fileToJpegDataUrl,
  checkHomeFence,
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
  APP_VERSION,
} from './api'
import { researchStatusLabel } from './engine/research-parse'
import './index.css'
import { playUiSound, unlockUiAudio } from './sounds'
import { CalendarView } from './Calendar'
import { CompassView } from './CompassView'
import { VoiceMode } from './VoiceMode'
import { SettingsScreen, type SettingsTopic } from './SettingsScreen'
import { DriveMode } from './DriveMode'
import { WakeBubble } from './WakeBubble'
import { closeDrive, subscribeDrive } from './engine/drive'
import { DEBUG_CHAT_KIND, loadSettings } from './engine/store'
import { downloadChatDebug, expandPickedMessageIds } from './engine/chat-debug'
import {
  TEST_COPY_GROUPS,
  allTestPromptKeys,
  selectedTestPrompts,
  testPromptKey,
} from './engine/test-copy'
import { syncGlance } from './engine/glance'
import { pickAlarmTone } from './native/notify'
import { takeNativePhoto, setDebugHold } from './native/device'
import { consumeVoiceLaunch, onWakeHit, pinVoiceShortcut, requestBatteryUnrestricted, startWakeWord, stopWakeWord, wakeWordRunning, wakeWordWanted } from './native/voice'
import { bindChromeFx, prefersReducedMotion } from './fx'
import { completeSpotifyLogin, pendingSpotifyCode } from './engine/spotify'

function mapsRoutes(tool: ToolMeta): Array<{ title: string; url: string }> {
  const raw = tool.result
  if (!raw) return []
  const listed = raw.routes
  if (Array.isArray(listed)) {
    return listed
      .map((row) => {
        const r = row as { title?: string; url?: string }
        return r.url ? { title: r.title || 'Route', url: r.url } : null
      })
      .filter((r): r is { title: string; url: string } => Boolean(r))
  }
  if (typeof raw.url === 'string' && raw.url) {
    return [{ title: String(raw.destination || tool.preview || 'Route'), url: raw.url }]
  }
  return []
}

function opensDriveOverlay(tool?: ToolMeta | null): boolean {
  if (!tool) return false
  if (tool.tool === 'drive') return true
  return tool.action === 'nav' && (tool.tool === 'poi' || tool.tool === 'fuel')
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
      {tool.result?.confirmCall && onConfirm ? (
        <span className="confirm-row">
          <button type="button" className="confirm-btn yes" onClick={() => onConfirm('Ja')}>
            Anrufen
          </button>
          <button type="button" className="confirm-btn no" onClick={() => onConfirm('Nein')}>
            Nicht
          </button>
        </span>
      ) : null}
      {tool.tool === 'maps'
        ? mapsRoutes(tool).map((r) => (
            <a
              key={r.url}
              className="maps-btn"
              href={r.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault()
                window.open(r.url, '_blank', 'noopener,noreferrer')
              }}
            >
              Route in Google Maps{r.title ? ` · ${r.title}` : ''}
            </a>
          ))
        : null}
      {typeof tool.result?.tel === 'string' && tool.result.tel && !tool.result.confirmCall ? (
        <a
          className="maps-btn"
          href={String(tool.result.tel)}
          onClick={(e) => {
            e.preventDefault()
            window.open(String(tool.result?.tel), '_self')
          }}
        >
          Anrufen{tool.result.name ? ` · ${String(tool.result.name)}` : ''}
        </a>
      ) : null}
      {typeof tool.result?.sms === 'string' && tool.result.sms ? (
        <a
          className="maps-btn"
          href={String(tool.result.sms)}
          onClick={(e) => {
            e.preventDefault()
            window.open(String(tool.result?.sms), '_self')
          }}
        >
          SMS{tool.result.name ? ` · ${String(tool.result.name)}` : ''}
        </a>
      ) : null}
      {typeof tool.result?.image === 'string' && String(tool.result.image).startsWith('data:image/') ? (
        <img className="pc-shot" alt="PC-Bildschirm" src={String(tool.result.image)} />
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
  const sources = (research.sources || []).filter((s) => s.url)
  const status = researchStatusLabel(research)
  const query = (research.query || '').replace(/^[·.\s]+/, '').trim()
  if (!sources.length && !status && !query) return null
  return (
    <details className="sources-block">
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
              {s.snippet ? <p className="sources-snippet">{s.snippet}</p> : null}
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

function IconGear() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="currentColor"
        d="M19.14 12.94a7.6 7.6 0 0 0 .06-1l2.03-1.58-2-3.46-2.43.98a7.4 7.4 0 0 0-1.73-1L14.5 2h-5l-.57 2.88a7.4 7.4 0 0 0-1.73 1L4.77 4.9l-2 3.46 2.03 1.58a7.6 7.6 0 0 0 0 2L2.77 13.6l2 3.46 2.43-.98a7.4 7.4 0 0 0 1.73 1L9.5 22h5l.57-2.88a7.4 7.4 0 0 0 1.73-1l2.43.98 2-3.46zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
      />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="currentColor" d="M6 7h12l-1 14H7L6 7zm3-3h6l1 2H8l1-2z" />
    </svg>
  )
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="currentColor"
        d="M9 4h6l1.5 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5zm3 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
      />
    </svg>
  )
}

function IconMic() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        fill="currentColor"
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z"
      />
    </svg>
  )
}

function IconSend() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path fill="currentColor" d="M3 11.5 21 3l-6.5 18-2.8-6.7z" />
    </svg>
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
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([])
  const [memoryBusy, setMemoryBusy] = useState(false)
  const [memoryFilter, setMemoryFilter] = useState<MemoryCategory | 'all'>('all')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsBusy, setSettingsBusy] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [settingsTopic, setSettingsTopic] = useState<SettingsTopic>('hub')
  const [settingsTestGroup, setSettingsTestGroup] = useState<string | null>(null)
  const [testKeys, setTestKeys] = useState<Record<string, true>>({})
  const [debugMode, setDebugMode] = useState(false)
  const [debugPicking, setDebugPicking] = useState(false)
  const [debugPicked, setDebugPicked] = useState<Record<string, true>>({})
  const [debugProgress, setDebugProgress] = useState<{
    i: number
    n: number
    text: string
    done: boolean
    cancelled?: boolean
    stopping?: boolean
  } | null>(null)
  const [debugDlBusy, setDebugDlBusy] = useState(false)
  const [debugDlMsg, setDebugDlMsg] = useState<string | null>(null)
  const [momentGlint, setMomentGlint] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [audits, setAudits] = useState<ResearchAudit[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [remindBusy, setRemindBusy] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [compassOpen, setCompassOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [driveOpen, setDriveOpen] = useState(false)
  const [wakeListening, setWakeListening] = useState(false)
  const [shortcutMsg, setShortcutMsg] = useState<string | null>(null)
  const [streamResearch, setStreamResearch] = useState<ResearchMeta | null>(null)
  const [setupOpen, setSetupOpen] = useState(() => !isGeminiConfigured() && !isModelReady())
  const [downloadPct, setDownloadPct] = useState(0)
  const [downloadBusy, setDownloadBusy] = useState(false)
  const [downloadPhase, setDownloadPhase] = useState<'download' | 'load'>('download')
  const [hasLocalModel, setHasLocalModel] = useState(false)
  const [tvBusy, setTvBusy] = useState(false)
  const [tvMsg, setTvMsg] = useState<string | null>(null)
  const [tvMsgOk, setTvMsgOk] = useState<boolean | null>(null)
  const [tvFound, setTvFound] = useState<
    Array<{ host?: string; name?: string; mac?: string; port?: number; kind?: string }>
  >([])
  const [geminiBusy, setGeminiBusy] = useState(false)
  const [geminiMsg, setGeminiMsg] = useState<string | null>(null)
  const [groqBusy, setGroqBusy] = useState(false)
  const [groqMsg, setGroqMsg] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const messagesRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const eyeFileRef = useRef<HTMLInputElement | null>(null)
  const eyeCamRef = useRef<HTMLInputElement | null>(null)
  const appRef = useRef<HTMLDivElement | null>(null)
  const stickToBottomRef = useRef(true)
  const sawTokenRef = useRef(false)
  const voiceHoldUntilRef = useRef(0)
  const activeIdRef = useRef<string | null>(null)
  const debugCancelRef = useRef(false)
  const debugChatIdRef = useRef<string | null>(null)
  const debugRunningRef = useRef(false)
  const busyRef = useRef(false)
  activeIdRef.current = activeId
  const [voiceSeed, setVoiceSeed] = useState('')
  const [voiceLaunchSeq, setVoiceLaunchSeq] = useState(0)

  function openVoiceMode(seed = '') {
    debugCancelRef.current = true
    debugRunningRef.current = false
    debugChatIdRef.current = null
    setDebugMode(false)
    setDebugProgress(null)
    setSetupOpen(false)
    setSettingsPanelOpen(false)
    voiceHoldUntilRef.current = Date.now() + 8000
    setVoiceSeed(seed || '')
    setVoiceLaunchSeq((n) => n + 1)
    setVoiceOpen(true)
    setCalendarOpen(false)
    setCompassOpen(false)
  }

  const overlayRef = useRef({
    settingsPanelOpen: false,
    settingsTopic: 'hub' as SettingsTopic,
    settingsTestGroup: null as string | null,
    calendarOpen: false,
    compassOpen: false,
    driveOpen: false,
    voiceOpen: false,
    sidebarOpen: false,
  })
  overlayRef.current = {
    settingsPanelOpen,
    settingsTopic,
    settingsTestGroup,
    calendarOpen,
    compassOpen,
    driveOpen,
    voiceOpen,
    sidebarOpen,
  }

  function settingsGoBack() {
    if (settingsTopic === 'tests' && settingsTestGroup) {
      setSettingsTestGroup(null)
      return
    }
    if (settingsTopic !== 'hub') {
      setSettingsTopic('hub')
      setSettingsTestGroup(null)
      return
    }
    setSettingsPanelOpen(false)
    setSettingsTestGroup(null)
  }

  function navigateBack(): boolean {
    const o = overlayRef.current
    if (o.settingsPanelOpen && o.settingsTopic === 'tests' && o.settingsTestGroup) {
      setSettingsTestGroup(null)
      return true
    }
    if (o.settingsPanelOpen && o.settingsTopic !== 'hub') {
      setSettingsTopic('hub')
      setSettingsTestGroup(null)
      return true
    }
    if (o.settingsPanelOpen) {
      setSettingsPanelOpen(false)
      setSettingsTestGroup(null)
      return true
    }
    if (o.compassOpen) {
      setCompassOpen(false)
      return true
    }
    if (o.calendarOpen) {
      setCalendarOpen(false)
      return true
    }
    if (o.voiceOpen) {
      setVoiceOpen(false)
      return true
    }
    if (o.driveOpen) {
      closeDrive()
      setDriveOpen(false)
      return true
    }
    if (o.sidebarOpen) {
      setSidebarOpen(false)
      return true
    }
    return false
  }

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && navigateBack()) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    let sub: { remove: () => Promise<void> } | null = null
    if (Capacitor.isNativePlatform()) {
      void CapApp.addListener('backButton', ({ canGoBack }) => {
        if (navigateBack()) return
        if (canGoBack) window.history.back()
        else void CapApp.minimizeApp()
      }).then((h) => {
        sub = h
      })
    }
    return () => {
      window.removeEventListener('keydown', onKey)
      void sub?.remove()
    }
  }, [])

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
    return subscribeDrive(() => {
      const on = Boolean(loadSettings().drive_mode)
      setDriveOpen(on)
      if (on) {
        setCalendarOpen(false)
        setSidebarOpen(false)
      }
    })
  }, [])

  useEffect(() => {
    const el = appRef.current
    if (!el) return
    return bindChromeFx(el)
  }, [])

  useEffect(() => {
    const pending = pendingSpotifyCode()
    if (!pending) return
    void completeSpotifyLogin(pending).then(() => {
      const u = new URL(window.location.href)
      u.search = ''
      u.hash = ''
      window.history.replaceState({}, '', u.pathname || '/')
    })
  }, [])

  useEffect(() => {
    void bootstrap()
    const t = window.setInterval(() => {
      void refreshHealth()
    }, 8000)
    const glance = window.setInterval(() => {
      void syncGlance()
    }, 5 * 60_000)
    return () => {
      window.clearInterval(t)
      window.clearInterval(glance)
    }
  }, [])

  useEffect(() => {
    let live = true
    async function tick() {
      const on = await wakeWordRunning()
      const wanted = await wakeWordWanted()
      if (!live) return
      setWakeListening(on)
      if (wanted && !on) void startWakeWord()
      if (settings && wanted !== settings.wake_word) {
        void patchSettings({ wake_word: wanted }).then((s) => setSettings(s))
      }
    }
    void tick()
    const id = window.setInterval(() => void tick(), 4000)
    return () => {
      live = false
      window.clearInterval(id)
    }
  }, [settings?.wake_word])

  useEffect(() => {
    const off = onWakeHit((utt) => openVoiceMode(utt || ''))
    let hideTimer = 0
    const vis = () => {
      window.clearTimeout(hideTimer)
      if (document.hidden) {
        // WebView flickers hidden during widget/shortcut resume; don't kill VoiceMode.
        hideTimer = window.setTimeout(() => {
          if (document.hidden && Date.now() >= voiceHoldUntilRef.current) {
            setVoiceOpen(false)
          }
        }, 400)
        return
      }
      void consumeVoiceLaunch().then((v) => {
        if (v.voice) openVoiceMode(v.utterance)
      })
    }
    document.addEventListener('visibilitychange', vis)
    let appState: { remove: () => Promise<void> } | null = null
    let urlOpen: { remove: () => Promise<void> } | null = null
    if (Capacitor.isNativePlatform()) {
      void CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) return
        void consumeVoiceLaunch().then((v) => {
          if (v.voice) openVoiceMode(v.utterance)
        })
      }).then((h) => {
        appState = h
      })
      void CapApp.addListener('appUrlOpen', ({ url }) => {
        if (url && /voice/i.test(url)) openVoiceMode()
      }).then((h) => {
        urlOpen = h
      })
    }
    return () => {
      off()
      window.clearTimeout(hideTimer)
      document.removeEventListener('visibilitychange', vis)
      void appState?.remove()
      void urlOpen?.remove()
    }
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
      setMemoryItems(
        (await listMemory(filter === 'all' ? null : filter)).filter((m) => !m.key.startsWith('alias:')),
      )
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
    setTvMsgOk(null)
    try {
      const res = await tvDiscover()
      const items = (res.items || []) as Array<{
        host?: string
        name?: string
        mac?: string
        port?: number
        kind?: string
      }>
      setTvFound(items)
      setTvMsg(
        items.length
          ? `${items.length} Gerät${items.length === 1 ? '' : 'e'} gefunden.`
          : res.message || 'Nichts gefunden.',
      )
      setTvMsgOk(items.length > 0)
    } catch (err) {
      setTvMsg(err instanceof Error ? err.message : 'Suchen fehlgeschlagen')
      setTvMsgOk(false)
    } finally {
      setTvBusy(false)
    }
  }

  async function onTvPick(item: {
    host?: string
    name?: string
    mac?: string
    port?: number
    kind?: string
  }) {
    if (!item.host) return
    if (item.kind === 'fire') {
      await patchSetting({
        tv_enabled: true,
        tv_fire_host: item.host,
        tv_fire_port: item.port || 5555,
      })
      setTvMsg(`Fire TV: ${item.host}. ADB-Dialog nur bei WLAN-ADB, dann testen.`)
      setTvMsgOk(true)
      return
    }
    await patchSetting({
      tv_host: item.host,
      tv_name: item.name || settings?.tv_name || 'Wohnzimmer',
      tv_mac: item.mac || settings?.tv_mac || '',
      tv_port: item.port || settings?.tv_port || 8002,
    })
    setTvMsg(`Gewählt: ${item.name || item.host}`)
    setTvMsgOk(true)
  }

  async function onTvPair() {
    if (tvBusy) return
    setTvBusy(true)
    setTvMsg('Koppeln — am Fernseher erlauben…')
    setTvMsgOk(null)
    try {
      const res = await tvPair({
        host: settings?.tv_host,
        mac: settings?.tv_mac,
        name: settings?.tv_name,
        port: settings?.tv_port,
      })
      setTvMsg(res.message)
      setTvMsgOk(true)
      await refreshSettings()
    } catch (err) {
      setTvMsg(err instanceof Error ? err.message : 'Koppeln fehlgeschlagen')
      setTvMsgOk(false)
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

  async function onTvFireTest(host?: string, port?: number) {
    if (tvBusy) return
    const ip = (host || settings?.tv_fire_host || '').trim()
    const p =
      typeof port === 'number' && Number.isFinite(port) && port > 0
        ? port
        : settings?.tv_fire_port || 5555
    setTvBusy(true)
    setTvMsgOk(null)
    setTvMsg('Teste Fire TV…')
    try {
      if (ip) {
        const updated = await patchSettings({ tv_fire_host: ip, tv_fire_port: p, tv_enabled: true })
        setSettings(updated)
      }
      const res = await tvFireTest({ host: ip, port: p })
      setTvMsg(res.reply || (res.ok ? 'Fire TV da.' : 'Fire TV nicht erreichbar.'))
      setTvMsgOk(Boolean(res.ok))
    } catch (err) {
      setTvMsg(err instanceof Error ? err.message : 'Fire-TV-Test fehlgeschlagen')
      setTvMsgOk(false)
    } finally {
      setTvBusy(false)
    }
  }

  async function onTvTest() {
    if (tvBusy) return
    setTvBusy(true)
    setTvMsg('Teste Verbindung…')
    setTvMsgOk(null)
    try {
      const res = await tvTest()
      setTvMsg(res.reply || (res.ok ? 'Erreichbar.' : 'Nicht erreichbar.'))
      setTvMsgOk(Boolean(res.ok))
    } catch (err) {
      setTvMsg(err instanceof Error ? err.message : 'Test fehlgeschlagen')
      setTvMsgOk(false)
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
      await syncGlance()
    } catch {
      /* browser ohne Notification ist ok */
    }
    try {
      const homeHits = await Promise.race([
        checkHomeFence(),
        new Promise<string[]>((resolve) => window.setTimeout(() => resolve([]), 6_000)),
      ])
      if (homeHits.length) setStatusNote(`Zuhause: ${homeHits.join('; ')}`)
    } catch {
      /* Standort nur auf dem Handy */
    }
    await refreshReminders()
    try {
      const launch = await consumeVoiceLaunch()
      if (launch.voice) {
        openVoiceMode(launch.utterance)
      }
    } catch {
      /* browser ohne Deep-Link */
    }
    const s = await getSettings()
    if (s.drive_mode) setDriveOpen(true)
    if (s.wake_word) {
      try {
        await startWakeWord()
      } catch {
        /* nur Android */
      }
    }
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
    if (debugChatIdRef.current && debugChatIdRef.current !== id) {
      debugCancelRef.current = true
      debugRunningRef.current = false
    }
    setError(null)
    setLastFailed(null)
    setActiveId(id)
    activeIdRef.current = id
    setSidebarOpen(false)
    setThreadKey((k) => k + 1)
    setEnterIds({})
    stickToBottomRef.current = true
    const data = await getConversation(id)
    setMessages(data.messages)
    const isDebug = data.kind === DEBUG_CHAT_KIND
    setDebugMode(isDebug)
    setDebugPicking(false)
    setDebugPicked({})
    setDebugDlMsg(null)
    if (isDebug) {
      debugChatIdRef.current = id
    } else {
      debugChatIdRef.current = null
      setDebugProgress(null)
    }
  }

  async function onNewChat() {
    debugCancelRef.current = true
    debugRunningRef.current = false
    debugChatIdRef.current = null
    setDebugMode(false)
    setDebugPicking(false)
    setDebugPicked({})
    setDebugProgress(null)
    setError(null)
    setLastFailed(null)
    const created = await createConversation()
    setConversations((prev) => [created, ...prev])
    setActiveId(created.id)
    activeIdRef.current = created.id
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
      if (debugChatIdRef.current === activeId) {
        debugCancelRef.current = true
        debugRunningRef.current = false
        debugChatIdRef.current = null
        setDebugMode(false)
        setDebugProgress(null)
      }
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

  async function sendMessage(content: string, opts?: { fromDebug?: boolean }) {
    if (!content) return
    if (debugRunningRef.current && !opts?.fromDebug) return
    if (busyRef.current) return
    busyRef.current = true
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

    let conversationId = activeIdRef.current
    try {
      if (!conversationId) {
        const created = await createConversation()
        conversationId = created.id
        activeIdRef.current = created.id
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
          if (payload.tool?.tool === 'reminder' || payload.tool?.tool === 'timer' || payload.tool?.tool === 'alarm') void refreshReminders()
          if (!debugChatIdRef.current) {
            if (payload.tool?.tool === 'calendar') {
              if (payload.tool.action === 'open') {
                setCalendarOpen(true)
                setCompassOpen(false)
                setSidebarOpen(false)
              }
            }
            if (payload.tool?.tool === 'device' && payload.tool.action === 'compass') {
              setCompassOpen(true)
              setCalendarOpen(false)
              setSidebarOpen(false)
            }
            if (opensDriveOverlay(payload.tool) || loadSettings().drive_mode) {
              if (payload.tool?.action === 'close') setDriveOpen(false)
              else {
                setDriveOpen(true)
                setCalendarOpen(false)
                setCompassOpen(false)
                setSidebarOpen(false)
              }
            }
            maybeOpenSettingsFromReply(payload.assistant_message.content)
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
      busyRef.current = false
      setBusy(false)
      if (!debugChatIdRef.current) textareaRef.current?.focus()
      void refreshHealth()
      void refreshMemory()
      void refreshSettings()
    }
  }

  async function onEyeFile(file: File) {
    if (!file || busy) return
    setBusy(true)
    setError(null)
    setStatusNote('Foto…')
    try {
      let conversationId = activeId
      if (!conversationId) {
        const created = await createConversation()
        conversationId = created.id
        setConversations((prev) => [created, ...prev])
        setActiveId(created.id)
      }
      const prepared = await fileToJpegDataUrl(file)
      const payload = 'error' in prepared ? `error:${prepared.error}` : prepared.dataUrl
      const { reply } = await readEyeImage(conversationId, payload)
      const conv = await getConversation(conversationId)
      setMessages(conv.messages)
      setConversations((prev) => {
        const rest = prev.filter((c) => c.id !== conv.id)
        return [conv, ...rest]
      })
      setStatusNote(null)
      if (!reply) setStatusNote('Nichts Lesbares auf dem Bild.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Foto fehlgeschlagen')
      setStatusNote(null)
    } finally {
      setBusy(false)
      if (eyeFileRef.current) eyeFileRef.current.value = ''
      if (eyeCamRef.current) eyeCamRef.current.value = ''
    }
  }

  async function onEyeCamera() {
    if (busy) return
    const shot = await takeNativePhoto()
    if (shot.ok && shot.dataUrl) {
      setBusy(true)
      setError(null)
      setStatusNote('Foto…')
      try {
        let conversationId = activeId
        if (!conversationId) {
          const created = await createConversation()
          conversationId = created.id
          setConversations((prev) => [created, ...prev])
          setActiveId(created.id)
        }
        const { reply } = await readEyeImage(conversationId, shot.dataUrl)
        const conv = await getConversation(conversationId)
        setMessages(conv.messages)
        setConversations((prev) => {
          const rest = prev.filter((c) => c.id !== conv.id)
          return [conv, ...rest]
        })
        setStatusNote(null)
        if (!reply) setStatusNote('Nichts Lesbares auf dem Bild.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Foto fehlgeschlagen')
        setStatusNote(null)
      } finally {
        setBusy(false)
      }
      return
    }
    if (shot.message) {
      setStatusNote(shot.message)
      return
    }
    eyeCamRef.current?.click()
  }

  async function onSend() {
    if (debugMode) return
    const content = draft.trim()
    if (!content || busy) return
    setDraft('')
    await sendMessage(content)
  }

  function toggleTestKey(key: string) {
    setTestKeys((prev) => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = true
      return next
    })
  }

  function toggleTestGroup(groupId: string, on: boolean) {
    const g = TEST_COPY_GROUPS.find((x) => x.id === groupId)
    if (!g) return
    setTestKeys((prev) => {
      const next = { ...prev }
      for (const item of g.items) {
        const k = testPromptKey(g.id, item)
        if (on) next[k] = true
        else delete next[k]
      }
      return next
    })
  }

  function toggleAllTests(on: boolean) {
    if (!on) {
      setTestKeys({})
      return
    }
    const next: Record<string, true> = {}
    for (const k of allTestPromptKeys()) next[k] = true
    setTestKeys(next)
  }

  function toggleDebugPicked(id: string) {
    setDebugPicked((prev) => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = true
      return next
    })
  }

  async function onDebugDownload(picked?: string[]) {
    const id = debugChatIdRef.current || activeId
    if (!id) return
    setDebugDlBusy(true)
    setDebugDlMsg(null)
    try {
      const r = await downloadChatDebug(id, picked)
      setDebugDlMsg(r.message)
      setStatusNote(r.ok ? r.message : r.message)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Download fehlgeschlagen'
      setDebugDlMsg(msg)
    } finally {
      setDebugDlBusy(false)
    }
  }

  async function startDebugTest() {
    const prompts = selectedTestPrompts(Object.keys(testKeys))
    if (!prompts.length) return
    if (debugRunningRef.current) {
      debugCancelRef.current = true
      const t0 = Date.now()
      while (debugRunningRef.current && Date.now() - t0 < 120_000) {
        await new Promise((r) => window.setTimeout(r, 80))
      }
    }
    if (busyRef.current) {
      setError('Warten, bis Jarvis fertig ist.')
      return
    }
    debugCancelRef.current = false

    setSettingsPanelOpen(false)
    setSettingsTopic('hub')
    setSettingsTestGroup(null)
    setCalendarOpen(false)
    setCompassOpen(false)
    setDriveOpen(false)
    setVoiceOpen(false)
    setSidebarOpen(false)
    setError(null)
    setLastFailed(null)

    const created = await createConversation('Debug-Test', DEBUG_CHAT_KIND)
    debugChatIdRef.current = created.id
    activeIdRef.current = created.id
    setActiveId(created.id)
    setConversations((prev) => [created, ...prev])
    setMessages([])
    setEnterIds({})
    setThreadKey((k) => k + 1)
    setDebugMode(true)
    setDebugPicking(false)
    setDebugPicked({})
    setDebugDlMsg(null)
    debugRunningRef.current = true
    void setDebugHold(true)
    setDebugProgress({ i: 0, n: prompts.length, text: prompts[0] || '', done: false })

    let finished = 0
    try {
    for (let i = 0; i < prompts.length; i++) {
      if (debugCancelRef.current) break
      setDebugProgress({ i, n: prompts.length, text: prompts[i], done: false, stopping: debugCancelRef.current })
      await sendMessage(prompts[i], { fromDebug: true })
      finished = i + 1
      if (debugCancelRef.current) break
    }
    } finally {
    debugRunningRef.current = false
    void setDebugHold(false)
    }
    if (debugCancelRef.current) {
      setDebugProgress({ i: finished, n: prompts.length, text: '', done: true, cancelled: true })
    } else {
      setDebugProgress({ i: prompts.length, n: prompts.length, text: '', done: true })
    }
  }

  function stopDebugTest() {
    if (!debugRunningRef.current) return
    debugCancelRef.current = true
    setDebugProgress((p) => (p && !p.done ? { ...p, stopping: true } : p))
  }

  async function sendVoiceTurn(
    content: string,
    onToken?: (piece: string, full: string) => void,
  ): Promise<string> {
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
    let acc = ''
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
        onToken: (piece) => {
          acc += piece
          onToken?.(piece, acc)
        },
        onDone: (payload) => {
          markEnter(payload.assistant_message.id)
          answer = payload.assistant_message.content
          setMessages((prev) => [...prev, payload.assistant_message])
          setConversations((prev) => {
            const rest = prev.filter((c) => c.id !== payload.conversation.id)
            return [payload.conversation, ...rest]
          })
          if (payload.tool?.tool === 'reminder' || payload.tool?.tool === 'timer' || payload.tool?.tool === 'alarm') void refreshReminders()
          if (opensDriveOverlay(payload.tool) || loadSettings().drive_mode) {
            if (payload.tool?.action === 'close') setDriveOpen(false)
            else setDriveOpen(true)
          }
          maybeOpenSettingsFromReply(payload.assistant_message.content)
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

  function openSettings(topic: SettingsTopic = 'hub') {
    setSettingsTopic(topic)
    setSettingsTestGroup(null)
    setSettingsPanelOpen(true)
    setSidebarOpen(false)
    void refreshReminders()
    void refreshMemory(memoryFilter)
    if (topic === 'forschung') void refreshAudits()
  }

  function maybeOpenSettingsFromReply(reply: string) {
    const t = reply || ''
    if (/Einstellungen\s*→\s*Fernseher/i.test(t)) openSettings('tv')
    else if (/Einstellungen\s*→\s*(?:Haus|Ventilator|Steckdose)|Broadlink|Fan-IP/i.test(t)) openSettings('haus')
    else if (/Einstellungen\s*→\s*APIs?|OMDb-Schlüssel|API-Keys?/i.test(t)) openSettings('apis')
    else if (/Einstellungen\s*→\s*Rabatt/i.test(t)) openSettings('rabatt')
    else if (/Einstellungen.*Gemini|Gemini an, aber kein/i.test(t)) openSettings('cloud')
    else if (/Einstellungen\s*→\s*Musik|Spotify-Client-ID|Spotify anmelden/i.test(t)) openSettings('musik')
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
  const debugHighlight = debugPicking
    ? new Set(expandPickedMessageIds(messages, Object.keys(debugPicked)))
    : null

  return (
    <div className="app" ref={appRef}>
      <div className="ambient" aria-hidden>
        <i className="orb orb-a" />
        <i className="orb orb-b" />
        <i className="orb orb-c" />
        <i className="orb orb-d" />
        <i className="spark s1" />
        <i className="spark s2" />
        <i className="spark s3" />
        <i className="spark s4" />
        <i className="spark s5" />
        <span className="grain" />
      </div>
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
                openSettings('cloud')
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
            <p>Handy · v{APP_VERSION}</p>
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
            openVoiceMode()
            setSidebarOpen(false)
          }}
        >
          Jarvis hören
        </button>

        <button
          type="button"
          className={`memory-toggle ${settingsPanelOpen ? 'active' : ''}`}
          onClick={() => openSettings('hub')}
        >
          Einstellungen
        </button>

        <button
          type="button"
          className={`memory-toggle ${settingsPanelOpen && settingsTopic === 'debug' ? 'active' : ''}`}
          onClick={() => openSettings('debug')}
        >
          Debug
        </button>

        <div className="chat-list">
          {conversations.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className={`chat-item ${c.id === activeId ? 'active' : ''}`}
              style={{ ['--i' as string]: i }}
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
                Gemini <strong>an</strong>
              </>
            ) : (
              <>
                Lokal <strong>bereit</strong>
              </>
            )
          ) : health?.blocked_reason === 'offline' ? (
            <>
              Gerät <strong>offline</strong>
            </>
          ) : health?.blocked_reason === 'no_key' ? (
            <>
              Gerät <strong>ohne Key</strong>
            </>
          ) : (
            <>
              Gerät <strong>ohne Modell</strong>
            </>
          )}
        </div>
      </aside>

      <main className={`main${driveOpen ? ' is-drive' : ''}${calendarOpen ? ' is-calendar' : ''}${compassOpen ? ' is-compass' : ''}${debugMode ? ' is-debug' : ''}`}>
        {voiceOpen ? (
          <VoiceMode
            key={voiceLaunchSeq}
            onClose={() => {
              setVoiceOpen(false)
              setVoiceSeed('')
            }}
            onTurn={(text, onTok) => sendVoiceTurn(text, onTok)}
            onPhoto={() => void onEyeCamera()}
            initialUtterance={voiceSeed}
          />
        ) : null}
        {calendarOpen ? <CalendarView onClose={() => setCalendarOpen(false)} /> : null}
        {compassOpen ? <CompassView onClose={() => setCompassOpen(false)} /> : null}
        {driveOpen ? (
          <DriveMode
            onClose={() => {
              closeDrive()
              setDriveOpen(false)
            }}
            onCommand={(text) => sendVoiceTurn(text)}
          />
        ) : null}
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
            <button
              type="button"
              className="ghost-btn icon-only"
              onClick={() => openSettings('hub')}
              aria-label="Einstellungen"
              title="Einstellungen"
            >
              <IconGear />
            </button>
            {activeId ? (
              <button
                type="button"
                className="ghost-btn icon-only"
                onClick={() => void onDeleteChat()}
                disabled={busy}
                aria-label="Gespräch löschen"
                title="Löschen"
              >
                <IconTrash />
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
                <div className="empty-halo" aria-hidden>
                  <i />
                  <i />
                  <i />
                </div>
                <h3>Jarvis</h3>
                <p>
                  {debugMode
                    ? 'Debug-Test. Prompts kommen von allein. Unten nur Download.'
                    : `Ein Feld antippen — oder selbst schreiben. ${geminiOn ? 'Gemini (Google), nicht privat.' : 'Lokal, ohne Cloud-Hirn.'}`}
                </p>
              </div>
            ) : null}

            {messages.map((m) => {
              const enter =
                enterIds[m.id] &&
                (m.role === 'user' ? 'enter-user' : 'enter-assistant')
              const picked = Boolean(debugHighlight?.has(m.id))
              return (
                <div
                  key={m.id}
                  className={`row ${m.role}${enter ? ` ${enter}` : ''}${debugPicking ? ' is-pick' : ''}${picked ? ' is-picked' : ''}`}
                  onClick={debugPicking ? () => toggleDebugPicked(m.id) : undefined}
                  onKeyDown={
                    debugPicking
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggleDebugPicked(m.id)
                          }
                        }
                      : undefined
                  }
                  role={debugPicking ? 'checkbox' : undefined}
                  aria-checked={debugPicking ? picked : undefined}
                  tabIndex={debugPicking ? 0 : undefined}
                >
                  {m.role === 'assistant' ? (
                    <div className="avatar jarvis">J</div>
                  ) : null}
                  <div className="bubble">
                    <div className="bubble-text">{m.content}</div>
                    {m.role === 'assistant' && m.meta?.tool ? (
                      <ToolChip
                        tool={m.meta.tool}
                        onConfirm={(text) => {
                          if (debugMode) return
                          void sendMessage(text)
                        }}
                      />
                    ) : null}
                    {m.role === 'assistant' && m.meta?.research ? (
                      <SourcesBlock
                        research={m.meta.research}
                        onOpenAudit={(id) => {
                          setAuditOpen(true)
                          openSettings('forschung')
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
                            setAuditOpen(true)
                            openSettings('forschung')
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
              {lastFailed && !debugMode ? (
                <button type="button" className="retry-btn" onClick={() => void onRetry()}>
                  Erneut senden
                </button>
              ) : null}
            </div>
          ) : null}
          {debugMode ? (
            <div className="debug-bar">
              <p className="debug-bar-status">
                {debugPicking
                  ? 'Nachrichten antippen. Auswahl lädt Frage plus Antwort nach Downloads.'
                  : debugProgress?.stopping && !debugProgress.done
                    ? 'Wird abgebrochen… aktuelle Antwort läuft noch.'
                    : debugProgress && !debugProgress.done
                      ? `Test ${Math.min(debugProgress.i + 1, debugProgress.n)}/${debugProgress.n} — ${debugProgress.text}`
                      : debugProgress?.cancelled
                        ? `Abgebrochen · ${debugProgress.i}/${debugProgress.n}`
                        : debugProgress?.done
                          ? `Fertig · ${debugProgress.n} Prompts`
                          : 'Debug-Chat. Nicht schreiben — nur Download.'}
              </p>
              {debugDlMsg ? <p className="debug-bar-status">{debugDlMsg}</p> : null}
              <div className="debug-bar-actions">
                {debugPicking ? (
                  <>
                    <button
                      type="button"
                      disabled={debugDlBusy || !Object.keys(debugPicked).length}
                      onClick={() => {
                        void onDebugDownload(Object.keys(debugPicked)).then(() => {
                          setDebugPicking(false)
                          setDebugPicked({})
                        })
                      }}
                    >
                      Auswahl laden
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDebugPicking(false)
                        setDebugPicked({})
                      }}
                    >
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <>
                    {debugProgress && !debugProgress.done ? (
                      <button
                        type="button"
                        className="is-stop"
                        disabled={Boolean(debugProgress.stopping)}
                        onClick={stopDebugTest}
                      >
                        {debugProgress.stopping ? 'Stoppe…' : 'Test abbrechen'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={debugDlBusy || messages.length === 0}
                      onClick={() => void onDebugDownload()}
                    >
                      Alles runterladen
                    </button>
                    <button
                      type="button"
                      disabled={debugDlBusy || messages.length === 0 || Boolean(debugProgress && !debugProgress.done)}
                      onClick={() => {
                        setDebugPicking(true)
                        setDebugPicked({})
                        setDebugDlMsg(null)
                      }}
                    >
                      Auswählen
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
          <div className={`composer ${composerFocused ? 'is-focused' : ''}`}>
            <input
              ref={eyeCamRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onEyeFile(file)
              }}
            />
            <input
              ref={eyeFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onEyeFile(file)
              }}
            />
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
            <div className="composer-actions">
              <button
                type="button"
                className="icon-btn"
                disabled={busy}
                onClick={() => void onEyeCamera()}
                aria-label="Kamera"
                title="Kamera"
              >
                <IconCamera />
              </button>
              <button
                type="button"
                className="icon-btn"
                disabled={busy}
                onClick={() => eyeFileRef.current?.click()}
                aria-label="Galerie"
                title="Galerie"
              >
                <span aria-hidden>🖼</span>
              </button>
              <button
                type="button"
                className="icon-btn mic-round"
                onClick={() => openVoiceMode()}
                aria-label="Spracheingabe"
                title="Hören"
              >
                <IconMic />
              </button>
              <button
                type="button"
                className="icon-btn send-round"
                onClick={() => void onSend()}
                disabled={busy || !draft.trim()}
                aria-label="Senden"
                title="Senden"
              >
                <IconSend />
              </button>
            </div>
          </div>
          {!voiceOpen ? (
            <WakeBubble
              listening={wakeListening}
              onTap={() => {
                openVoiceMode()
              }}
            />
          ) : null}
            </>
          )}
        </div>
      </main>

      {settingsPanelOpen ? (
        <SettingsScreen
          topic={settingsTopic}
          onTopic={(t) => {
            setSettingsTopic(t)
            setSettingsTestGroup(null)
            if (t === 'forschung') void refreshAudits()
            if (t === 'gedaechtnis') void refreshMemory(memoryFilter)
            if (t === 'wecker') void refreshReminders()
          }}
          testGroup={settingsTestGroup}
          onTestGroup={setSettingsTestGroup}
          testKeys={testKeys}
          onToggleTestKey={toggleTestKey}
          onToggleTestGroup={toggleTestGroup}
          onToggleAllTests={toggleAllTests}
          onStartTest={() => void startDebugTest()}
          onBack={settingsGoBack}
          onClose={() => {
            setSettingsPanelOpen(false)
            setSettingsTestGroup(null)
          }}
          settings={settings}
          settingsBusy={settingsBusy}
          patchSetting={patchSetting}
          health={health}
          geminiOn={geminiOn}
          downloadBusy={downloadBusy}
          downloadPhase={downloadPhase}
          downloadPct={downloadPct}
          hasLocalModel={hasLocalModel}
          downloadModel={() => void downloadModel()}
          geminiBusy={geminiBusy}
          geminiMsg={geminiMsg}
          onGeminiTest={() => void onGeminiTest()}
          groqBusy={groqBusy}
          groqMsg={groqMsg}
          onGroqTest={() => void onGroqTest()}
          reminders={reminders}
          remindBusy={remindBusy}
          onDeleteReminder={(id) => void onDeleteReminder(id)}
          onPickTone={() => {
            void pickAlarmTone().then((r) => {
              if (r.ok && r.uri) {
                void patchSetting({
                  alarm_tone_uri: r.uri,
                  alarm_tone_name: r.name || 'Eigener Ton',
                })
              } else if (r.message) {
                setError(r.message)
              }
            })
          }}
          onOpenVoice={() => {
            openVoiceMode()
            setSettingsPanelOpen(false)
          }}
          onPinShortcut={() => {
            void pinVoiceShortcut().then((r) =>
              setShortcutMsg(r.ok ? 'Shortcut-Dialog ist offen.' : r.message || 'Nicht gesetzt.'),
            )
          }}
          shortcutMsg={shortcutMsg}
          onWakeWord={(on) => {
            if (on) {
              void startWakeWord().then(() => {
                void patchSetting({ wake_word: true })
                void requestBatteryUnrestricted()
              })
            } else {
              void stopWakeWord().then(() => void patchSetting({ wake_word: false }))
            }
          }}
          tvBusy={tvBusy}
          tvMsg={tvMsg}
          tvMsgOk={tvMsgOk}
          tvFound={tvFound}
          onTvDiscover={() => void onTvDiscover()}
          onTvPair={() => void onTvPair()}
          onTvTest={() => void onTvTest()}
          onTvFireTest={(host, port) => void onTvFireTest(host, port)}
          onTvPick={(item) => void onTvPick(item)}
          auditOpen={auditOpen}
          onToggleAudit={() => {
            setAuditOpen((o) => !o)
            void refreshAudits()
          }}
          audits={audits}
          memoryItems={memoryItems}
          memoryBusy={memoryBusy}
          memoryFilter={memoryFilter}
          onMemoryFilter={(f) => {
            setMemoryFilter(f)
            void refreshMemory(f)
          }}
          onDeleteMemory={(id) => void onDeleteMemory(id)}
          onClearMemory={() => void onClearMemory()}
        />
      ) : null}
    </div>
  )
}

export default App
