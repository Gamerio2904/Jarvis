import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
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
  listMessages,
  listResearchAudits,
  listReminders,
  markFiredByNotifyId,
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
  ingestDocFile,
  checkHomeFence,
  pullRtcFrame,
  stopRtcLive,
  readRtcLive,
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
} from './api.ts'
import { researchStatusLabel } from './engine/research-parse.ts'
import { saveToDownloads } from './native/device.ts'
import { decodeHtml } from './engine/html-text.ts'
import './index.css'
import { playUiSound, unlockUiAudio } from './sounds.ts'
import { CalendarView } from './ui/Calendar.tsx'
import { HomeScreen } from './ui/HomeScreen.tsx'
import { GlanceRail } from './ui/GlanceRail.tsx'
import { MiniChat } from './ui/MiniChat.tsx'
import { VoiceSphere } from './ui/VoiceSphere.tsx'
import { HausScan } from './ui/HausScan.tsx'
import { hausStop, watchHausIncoming } from './native/haus.ts'
import { applyBackup, parseImportPayload } from './engine/backup.ts'
import { type HomeAppId } from './engine/home-apps.ts'
import { WatchlistOverlay } from './ui/WatchlistOverlay.tsx'
import { TimerChip } from './ui/TimerChip.tsx'
import { PcDashboard } from './ui/PcDashboard.tsx'
import { VoiceMode } from './ui/VoiceMode.tsx'
import { SettingsScreen, type SettingsTopic } from './ui/SettingsScreen.tsx'
import { DriveMode } from './ui/DriveMode.tsx'
import { ChessMode } from './ui/ChessMode.tsx'
import { Lage } from './ui/lage/Lage.tsx'
import { WakeBubble } from './ui/WakeBubble.tsx'
import { ToolChip } from './ui/ToolChip.tsx'
import { hideToolChip } from './ui/tool-chip.ts'
import { ChatBlocks } from './ui/ChatBlocks.tsx'
import { parseChatBlocks, type ChatBlock } from './engine/chat-blocks.ts'
import { clipboardImageFile } from './engine/clipboard-image.ts'
import { fileToJpegDataUrl } from './engine/eye.ts'
import { saveLastEyeImage } from './engine/agent-session.ts'
import { useOverlay } from './overlay.ts'
import { overlayHidesDrive, reduceOverlay, OVERLAY_INIT, type OverlayId } from './engine/overlay-fsm.ts'
import { closeDrive, subscribeDrive } from './engine/drive.ts'
import { addMessage, deleteMessage, loadSettings, patchMessage } from './engine/store.ts'
import { truncateSpoken } from './engine/turn-detect.ts'
import { warmCloud } from './engine/cloud-warm.ts'
import { syncGlance } from './engine/glance.ts'
import { tickOutlookWatch } from './engine/outlook-watch.ts'
import { tickWatchdog } from './engine/watchdog.ts'
import { tickPriceWatch } from './engine/watch-price.ts'
import { tickEpisodeMemory, tickSleepMemory } from './engine/sleep-memory.ts'
import { displayFolder } from './engine/folders.ts'
import { FOLDER_IDS } from './engine/folder-parse.ts'
import { setHeardNames } from './engine/heard.ts'
import { pickAlarmTone } from './native/notify.ts'
import { setPresenceChatHandler, syncPresenceBind } from './native/presence.ts'
import { consumeVoiceLaunch, onWakeHit, pinVoiceShortcut, requestBatteryUnrestricted, startWakeWord, stopWakeWord, wakeWordRunning, wakeWordWanted } from './native/voice.ts'
import { bindChromeFx, prefersReducedMotion } from './fx.ts'
import { bindKeyboardInset } from './engine/keyboard-inset.ts'
import { completeSpotifyLogin, pendingSpotifyCode } from './engine/spotify.ts'
import { beginTurn, endTurn, type TurnSource } from './engine/turn-gate.ts'
import { lageSessionActive, setLageSession } from './engine/lage-session.ts'
import { resolveUiTheme } from './fx/theme-transition.ts'
import { DebugChatDock } from './ui/DebugChatDock.tsx'
import {
  IconCal,
  IconChat,
  IconFilm,
  IconGearMini,
  IconGlobe,
  IconHome,
  IconMic,
  IconTisch,
  NavIsland,
} from './ui/NavIsland.tsx'
import { ReplyOrb } from './ui/ReplyOrb.tsx'
import { debugSnapshot, subscribeDebug } from './engine/debug-session.ts'
import { acceptWake, closeWake, type WakeGate } from './engine/wake-gate.ts'

function opensDriveOverlay(tool?: ToolMeta | null): boolean {
  if (!tool) return false
  if (tool.tool === 'drive') return true
  return tool.action === 'nav' && (tool.tool === 'poi' || tool.tool === 'fuel')
}

/** Schach/Sport/Suche sollen die Navi-Karte nicht wieder nach vorne holen. */
function hidesDriveOverlay(tool?: ToolMeta | null): boolean {
  const id = tool?.tool || ''
  return id === 'chess' || id === 'sport' || id === 'research' || id === 'calendar'
}

function opensChessOverlay(tool?: ToolMeta | null): boolean {
  return tool?.tool === 'chess'
}

function PcLiveDock() {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let alive = true
    async function tick() {
      if (!readRtcLive()) {
        if (alive) setSrc('')
        return
      }
      const r = await pullRtcFrame()
      if (!alive) return
      setSrc(r.ok && r.image ? r.image : '')
    }
    void tick()
    const id = window.setInterval(() => void tick(), 1000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [])
  if (!src) return null
  return (
    <div className="pc-live-dock">
      <img className="pc-live-frame" alt="PC live" src={src} />
      <button
        type="button"
        className="pc-live-stop"
        onClick={() => {
          void stopRtcLive().then(() => setSrc(''))
        }}
      >
        Live aus
      </button>
    </div>
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
  if (!sources.length && !status) return null
  return (
    <details className="sources-block" open>
      <summary>
        <span className="sources-badge">{status || 'Quellen'}</span>
        {sources.length > 1 ? (
          <span className="sources-count">prüfbar</span>
        ) : null}
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
                [{i + 1}] {decodeHtml(s.title)}
              </a>
              {s.url ? <p className="sources-url">{s.url}</p> : null}
              {s.snippet ? <p className="sources-snippet">{decodeHtml(s.snippet)}</p> : null}
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
  const activeIdRef = useRef<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [pasteImage, setPasteImage] = useState<{ src: string; alt: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const sendRef = useRef<(text: string) => Promise<unknown>>(async () => undefined)
  const driveCloseGenRef = useRef(0)
  const [debugRunning, setDebugRunning] = useState(() => debugSnapshot().running)
  const debugRunningRef = useRef(false)
  debugRunningRef.current = debugRunning
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastFailed, setLastFailed] = useState<string | null>(null)
  const [health, setHealth] = useState<Health | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatMenu, setChatMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const pressTimer = useRef(0)
  const pressFired = useRef('')
  useEffect(() => {
    if (!chatMenu) return
    const close = () => setChatMenu(null)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [chatMenu])
  const [statusNote, setStatusNote] = useState<string | null>(null)
  const [hausScan, setHausScan] = useState(false)
  const [composerFocused, setComposerFocused] = useState(false)
  const [threadKey, setThreadKey] = useState(0)
  const [enterIds, setEnterIds] = useState<Record<string, true>>({})
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>([])
  const [memoryBusy, setMemoryBusy] = useState(false)
  const [memoryFilter, setMemoryFilter] = useState<MemoryCategory | 'all'>('all')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsBusy, setSettingsBusy] = useState(false)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [settingsTopic, setSettingsTopic] = useState<SettingsTopic>('keys')
  const [momentGlint, setMomentGlint] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [audits, setAudits] = useState<ResearchAudit[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [remindBusy, setRemindBusy] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [homeOpen, setHomeOpen] = useState(true)
  const [railOpen, setRailOpen] = useState(false)
  const [lageSideChat, setLageSideChat] = useState(false)
  const [miniChatOpen, setMiniChatOpen] = useState(false)
  const [voiceCompact, setVoiceCompact] = useState(false)
  const [watchlistOpen, setWatchlistOpen] = useState(false)
  const [watchlistFocus, setWatchlistFocus] = useState<'watch' | 'favorite'>('watch')
  const overlayHistRef = useRef(false)
  const tischWasRef = useRef<boolean | null>(null)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [driveOpen, setDriveOpen] = useState(false)
  const [chessOpen, setChessOpen] = useState(false)
  const [overlay, setOverlay] = useState(OVERLAY_INIT)
  const voiceOpenRef = useRef(false)
  const micDeniedRef = useRef(false)
  const driveOpenRef = useRef(false)
  const wakeGateRef = useRef<WakeGate>({ lastAt: 0, open: false })
  voiceOpenRef.current = voiceOpen
  driveOpenRef.current = driveOpen
  const [wakeListening, setWakeListening] = useState(false)
  const [shortcutMsg, setShortcutMsg] = useState<string | null>(null)
  const [streamResearch, setStreamResearch] = useState<ResearchMeta | null>(null)
  const [setupOpen, setSetupOpen] = useState(() => {
    const s = loadSettings()
    return !isGeminiConfigured() && !s.groq_api_key.trim() && !isModelReady() && !s.setup_dismissed
  })
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
  const appRef = useRef<HTMLDivElement | null>(null)
  const stickToBottomRef = useRef(true)
  const sawTokenRef = useRef(false)
  const voiceHoldUntilRef = useRef(0)
  const voiceCutsRef = useRef(new Map<string, string>())
  const voiceReqRef = useRef<string | null>(null)
  const [voiceSeed, setVoiceSeed] = useState('')
  const [lageWide, setLageWide] = useState(false)

  useEffect(() => {
    const open = () => setHausScan(true)
    window.addEventListener('jarvis-haus-scan', open)
    const stop = watchHausIncoming((json) => {
      const choice = parseImportPayload(json)
      if (!choice || choice.kind !== 'haus') return
      void applyBackup(choice.data).then((line) => {
        setStatusNote(line)
        void hausStop()
      })
    })
    return () => {
      window.removeEventListener('jarvis-haus-scan', open)
      stop()
    }
  }, [])

  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  async function ensureConversation(): Promise<string> {
    if (activeIdRef.current) return activeIdRef.current
    const created = await createConversation()
    activeIdRef.current = created.id
    setConversations((prev) => [created, ...prev])
    setActiveId(created.id)
    return created.id
  }

  function patchOverlay(...actions: Parameters<typeof reduceOverlay>[1][]) {
    setOverlay((s) => {
      let next = s
      for (const action of actions) next = reduceOverlay(next, action)
      return next
    })
  }

  function openSheet(id: OverlayId) {
    patchOverlay({ type: 'exclusive', id })
  }

  function closeSheet(id: OverlayId) {
    patchOverlay({ type: 'drop', id })
  }

  function dropOverlayHistory() {
    if (!overlayHistRef.current) return
    overlayHistRef.current = false
    window.history.back()
  }

  function closeWatchlist() {
    setWatchlistOpen(false)
    closeSheet('watchlist')
    dropOverlayHistory()
  }

  /**
   * Jeder Weg aus dem Sprachmodus muss hier durch. Vorher setzten vier Pfade
   * nur `voiceOpen` zurück und ließen das Wake-Tor offen — `acceptWake` gab
   * danach für immer `null` zurück, der Sprachmodus war bis zum Neustart der
   * App nicht mehr aufzuwecken.
   */
  function closeVoice(clearSeed = false, fromPop = false) {
    const wasOpen = voiceOpenRef.current
    setVoiceOpen(false)
    setVoiceCompact(false)
    if (clearSeed) setVoiceSeed('')
    closeSheet('voice')
    wakeGateRef.current = closeWake(wakeGateRef.current)
    if (wasOpen && !fromPop) dropOverlayHistory()
    if (wasOpen) void tickEpisodeMemory()
  }

  function openVoiceMode(seed = '', compact = false) {
    const next = acceptWake(wakeGateRef.current, seed, Date.now())
    if (!next) return
    wakeGateRef.current = next
    voiceHoldUntilRef.current = Date.now() + 2500
    if (seed) setVoiceSeed(seed)
    setVoiceCompact(compact)
    setSettingsPanelOpen(false)
    setCalendarOpen(false)
    setWatchlistOpen(false)
    micDeniedRef.current = false
    setVoiceOpen(true)
    if (!compact) openSheet('voice')
  }

  function openDrive() {
    setDriveOpen(true)
    setCalendarOpen(false)
    setWatchlistOpen(false)
    setSidebarOpen(false)
    setChessOpen(false)
    closeVoice()
    patchOverlay({ type: 'drop', id: 'calendar' }, { type: 'drop', id: 'watchlist' }, { type: 'ensure', id: 'drive' })
  }

  function applyAppTool(tool?: ToolMeta | null) {
    if (!tool || tool.tool !== 'app') return
    if (tool.tool_status === 'error' || tool.tool_status === 'aborted') return
    const action = (tool.action || '').trim()
    const topic = String(tool.result?.topic || '') as SettingsTopic
    if (action === 'voice') {
      openVoiceMode()
      return
    }
    if (action === 'debug') {
      openSettings('debug')
      return
    }
    if (action === 'memory') {
      openSettings('gedaechtnis')
      return
    }
    if (action === 'settings') {
      openSettings(topic || 'allgemein')
      return
    }
    if (action === 'overlay.close') {
      setSettingsPanelOpen(false)
      setCalendarOpen(false)
      setWatchlistOpen(false)
      closeSheet('settings')
      closeSheet('calendar')
      closeSheet('watchlist')
      closeVoice()
      dropOverlayHistory()
      return
    }
    if (action === 'dock') {
      const dock = String(tool.result?.dock || '')
      if (dock) goDock(dock)
      return
    }
    if (action === 'set') {
      void refreshSettings()
    }
  }

  function applyHudTool(tool?: ToolMeta | null) {
    if (!tool || tool.tool !== 'hud') return
    const s = loadSettings()
    if (s.hud_force && !s.hud_hidden) {
      setHomeOpen(false)
      setLageSession(true)
      setCalendarOpen(false)
      setWatchlistOpen(false)
      setSettingsPanelOpen(false)
      closeSheet('calendar')
      closeSheet('watchlist')
      closeSheet('settings')
      closeVoice()
    } else {
      setLageSession(false)
    }
    void refreshSettings()
  }

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const apply = () => setLageWide(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    warmCloud()
  }, [])

  useEffect(() => {
    setPresenceChatHandler(async (conversationId, text) => {
      let reply = ''
      let tool: unknown
      await streamChat(conversationId, text, {
        onDone: (payload) => {
          reply = payload.assistant_message.content
          tool = payload.tool || null
        },
      })
      return { reply, tool }
    })
    return () => setPresenceChatHandler(undefined)
  }, [])

  useEffect(() => {
    const s = settings || loadSettings()
    const enabled = Boolean(s.presence_enabled) && s.presence_role !== 'window'
    void syncPresenceBind({ enabled, port: s.presence_port || 18791 })
  }, [settings?.presence_enabled, settings?.presence_port, settings?.presence_role])

  useEffect(() => {
    const s = settings || loadSettings()
    document.documentElement.dataset.theme = resolveUiTheme(s.ui_theme)
  }, [settings?.ui_theme])

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
        setWatchlistOpen(false)
        setSidebarOpen(false)
        patchOverlay({ type: 'drop', id: 'calendar' }, { type: 'drop', id: 'watchlist' }, { type: 'ensure', id: 'drive' })
      } else {
        patchOverlay({ type: 'drop', id: 'drive' })
      }
    })
  }, [])

  useEffect(() => {
    return subscribeDebug((snap) => setDebugRunning(snap.running))
  }, [])

  useEffect(() => {
    if (!debugRunning) return
    setSettingsPanelOpen(false)
    setSidebarOpen(false)
    closeSheet('settings')
  }, [debugRunning])

  useEffect(() => {
    const overlayOpen = settingsPanelOpen || calendarOpen || voiceOpen || driveOpen || chessOpen || watchlistOpen
    if (!overlayOpen) return
    if (!overlayHistRef.current) {
      window.history.pushState({ jarvisOverlay: true }, '')
      overlayHistRef.current = true
    }
    const onPop = () => {
      overlayHistRef.current = false
      if (settingsPanelOpen) {
        setSettingsPanelOpen(false)
        closeSheet('settings')
        return
      }
      if (watchlistOpen) {
        setWatchlistOpen(false)
        closeSheet('watchlist')
        return
      }
      if (calendarOpen) {
        setCalendarOpen(false)
        closeSheet('calendar')
        return
      }
      if (voiceOpen) {
        closeVoice(false, true)
        return
      }
      if (driveOpen) {
        driveCloseGenRef.current += 1
        closeDrive()
        setDriveOpen(false)
        closeSheet('drive')
        return
      }
      if (chessOpen) {
        setChessOpen(false)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [settingsPanelOpen, calendarOpen, voiceOpen, driveOpen, chessOpen, watchlistOpen])

  useEffect(() => {
    const el = appRef.current
    if (!el) return
    const unfx = bindChromeFx(el)
    const unkb = bindKeyboardInset(el)
    return () => {
      unfx()
      unkb()
    }
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
    const outlook = window.setInterval(() => {
      void tickOutlookWatch()
      void tickWatchdog()
      void tickPriceWatch()
    }, 20 * 60_000)
    const watchdog = window.setInterval(() => {
      if (document.hidden) return
      void tickWatchdog()
      void tickPriceWatch()
      void tickSleepMemory({ drive: driveOpenRef.current, voice: voiceOpenRef.current })
    }, 60_000)
    const vis = () => {
      if (document.hidden) {
        void tickEpisodeMemory()
        return
      }
      void tickOutlookWatch()
      void tickWatchdog()
      void tickPriceWatch()
      void tickSleepMemory({ drive: driveOpenRef.current, voice: voiceOpenRef.current })
    }
    document.addEventListener('visibilitychange', vis)
    // Läuft ein Timer ab, während die App vorne steht, muss die Zeile aus
    // `open` heraus. Sonst hielt der nächste Start sie für verpasst.
    const onTimerFire = (e: Event) => {
      const nid = (e as CustomEvent<{ id?: number }>).detail?.id
      if (typeof nid !== 'number') return
      void markFiredByNotifyId(nid).then(() => refreshReminders())
    }
    window.addEventListener('jarvis-timer-fire', onTimerFire)
    void tickOutlookWatch()
    void tickWatchdog()
    void tickPriceWatch()
    return () => {
      window.clearInterval(t)
      window.clearInterval(glance)
      window.clearInterval(outlook)
      window.clearInterval(watchdog)
      document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('jarvis-timer-fire', onTimerFire)
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
          if (document.hidden && Date.now() >= voiceHoldUntilRef.current) closeVoice()
        }, 400)
        return
      }
      void consumeVoiceLaunch().then((v) => {
        if (v.voice) openVoiceMode(v.utterance)
      })
    }
    document.addEventListener('visibilitychange', vis)
    return () => {
      off()
      window.clearTimeout(hideTimer)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])

  useEffect(() => {
    if (!busy) {
      sawTokenRef.current = false
      return
    }
    const started = Date.now()
    const cloud = Boolean(
      (settings?.gemini_enabled && settings.gemini_api_key?.trim()) || settings?.groq_api_key?.trim(),
    )
    const id = window.setInterval(() => {
      if (sawTokenRef.current) return
      const s = Math.max(1, Math.round((Date.now() - started) / 1000))
      setStatusNote(
        cloud
          ? `Ultron denkt… ${s}s`
          : `Ultron denkt… ${s}s — erstes Wort kann auf dem Handy dauern.`,
      )
    }, 1000)
    return () => window.clearInterval(id)
  }, [busy, settings?.gemini_enabled, settings?.gemini_api_key, settings?.groq_api_key])

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
      const all = await listMemory(null)
      setHeardNames(all.map((r) => r.key).filter(Boolean))
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

  /**
   * Stabil, weil `Lage` Effekte daran hängt. Inline war es bei jedem Render neu:
   * GPS holen → Pins laden → hierher melden → Settings neu setzen → Render →
   * von vorn. Das lief endlos und zog den Akku leer.
   */
  const onHudChange = useCallback(() => {
    void refreshSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const on = () => void refreshSettings()
    window.addEventListener('jarvis-settings', on)
    return () => window.removeEventListener('jarvis-settings', on)
  }, [])

  useEffect(() => {
    const onSay = (e: Event) => {
      const text = String((e as CustomEvent<{ text?: string }>).detail?.text || '')
      if (!text.trim()) return
      void sendRef.current(text)
    }
    window.addEventListener('jarvis-say', onSay)
    return () => window.removeEventListener('jarvis-say', onSay)
  }, [])

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
    wifiMac?: string
    wiredMac?: string
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
      tv_mac: item.wifiMac || item.mac || settings?.tv_mac || '',
      tv_mac_eth: item.wiredMac || settings?.tv_mac_eth || '',
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
    if (s.drive_mode && s.last_drive_json) {
      setDriveOpen(true)
      patchOverlay({ type: 'ensure', id: 'drive' })
    }
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
    } else if (isModelReady() || loadSettings().setup_dismissed) {
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
    const ok = window.confirm('Alles löschen, was Ultron über Sie weiß?')
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
    activeIdRef.current = created.id
    setConversations((prev) => [created, ...prev])
    setHomeOpen(false)
    setActiveId(created.id)
    setMessages([])
    setEnterIds({})
    setThreadKey((k) => k + 1)
    setSidebarOpen(false)
    stickToBottomRef.current = true
  }

  async function deleteChatById(id: string) {
    if (!id || busy) return
    const ok = window.confirm('Dieses Gespräch wirklich löschen?')
    if (!ok) return
    try {
      await deleteConversation(id)
      const remaining = conversations.filter((c) => c.id !== id)
      setConversations(remaining)
      if (id === activeId) {
        setMessages([])
        setEnterIds({})
        setActiveId(remaining[0]?.id ?? null)
        setThreadKey((k) => k + 1)
        if (remaining[0]) await openConversation(remaining[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Löschen fehlgeschlagen')
    }
  }

  async function onDeleteChat() {
    if (!activeId) return
    await deleteChatById(activeId)
  }

  async function downloadChat(id: string) {
    const conv = conversations.find((c) => c.id === id)
    const rows = await listMessages(id)
    const title = (conv?.title || 'Gespraech').replace(/\s+/g, ' ').trim() || 'Gespraech'
    const body = [
      title,
      '',
      ...rows.map((m) => `${m.role === 'user' ? 'Sie' : 'Ultron'}: ${m.content}`),
    ].join('\n')
    const slug = title
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'gespraech'
    const name = `${slug}-chat.txt`
    const saved = await saveToDownloads(name, body)
    if (saved.ok) return
    const blob = new Blob([body], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  function onMessagesScroll() {
    const el = messagesRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distance < 96
  }

  async function sendMessage(
    content: string,
    opts?: { conversationId?: string; source?: TurnSource; requestId?: string; blocks?: ChatBlock[] },
  ): Promise<{ reply: string; tool?: ToolMeta; error?: string }> {
    const source: TurnSource = opts?.source || 'user'
    if (!content) return { reply: '' }
    const conversationHint = opts?.conversationId || activeIdRef.current || undefined
    const ticket = beginTurn({ source, content, conversationId: conversationHint, requestId: opts?.requestId })
    if (!ticket.ok) {
      return { reply: '', error: ticket.reason === 'duplicate' ? 'duplicate' : 'busy' }
    }
    if (source !== 'debug') {
      setBusy(true)
      busyRef.current = true
    }
    setError(null)
    setLastFailed(null)
    if (source !== 'debug' || conversationHint === activeIdRef.current) setStatusNote('Ultron denkt…')
    setStreamingText('')
    setStreamResearch(null)
    stickToBottomRef.current = true
    playUiSound('send', {
      enabled: Boolean(settings?.ui_sounds),
      volume: (settings?.ui_sound_volume as 'low' | 'medium' | 'high') || 'low',
    })

    let conversationId = opts?.conversationId || (await ensureConversation())
    const closeGen = driveCloseGenRef.current
    let lastReply = ''
    let lastTool: ToolMeta | undefined
    let lastError: string | undefined
    const showUi = () => conversationId === activeIdRef.current
    try {
      if (loadSettings().presence_role === 'window') {
        const { postPresenceLine } = await import('./engine/presence.ts')
        const remote = await postPresenceLine(content)
        lastReply = remote.reply
        lastError = remote.ok ? undefined : remote.reply
        if (showUi()) {
          setMessages((prev) => [
            ...prev,
            {
              id: `win-u-${Date.now()}`,
              conversation_id: conversationId,
              role: 'user',
              content,
              created_at: new Date().toISOString(),
            },
            {
              id: `win-a-${Date.now()}`,
              conversation_id: conversationId,
              role: 'assistant',
              content: remote.reply,
              created_at: new Date().toISOString(),
            },
          ])
        }
        if (source !== 'debug') {
          setBusy(false)
          busyRef.current = false
          setStatusNote(null)
          setStreamingText(null)
        }
        endTurn({ source, conversationId })
        return { reply: remote.reply, error: lastError }
      }
      const optimistic: Message = {
        id: `tmp-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
        meta: opts?.blocks?.length ? { blocks: opts.blocks } : null,
      }
      markEnter(optimistic.id)
      if (showUi()) setMessages((prev) => [...prev, optimistic])

      let acc = ''
      await streamChat(conversationId, content, {
        onMeta: (meta) => {
          markEnter(meta.user_message.id)
          if (meta.conversation) {
            setConversations((prev) => {
              const rest = prev.filter((c) => c.id !== meta.conversation!.id)
              return [meta.conversation!, ...rest]
            })
          }
          if (!showUi()) return
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
          if (!showUi()) return
          sawTokenRef.current = true
          acc += token
          setStreamingText(acc)
          setStatusNote(null)
        },
        onReplace: (text) => {
          if (!showUi()) return
          acc = text
          setStreamingText(text)
        },
        onRetry: (attempt) => {
          if (!showUi()) return
          setStatusNote(`Antwort wird neu generiert (Versuch ${attempt})…`)
          acc = ''
          setStreamingText('')
        },
        onDone: (payload) => {
          if (showUi()) {
            setStreamingText(null)
            setStreamResearch(null)
            markEnter(payload.assistant_message.id)
          }
          const msg = payload.assistant_message
          if (payload.research && !msg.meta?.research) {
            msg.meta = { ...(msg.meta || {}), research: payload.research }
          }
          if (payload.tool && !msg.meta?.tool) {
            msg.meta = { ...(msg.meta || {}), tool: payload.tool }
          }
          lastTool = (payload.tool as ToolMeta | undefined) || (msg.meta?.tool as ToolMeta | undefined)
          if (showUi()) setMessages((prev) => [...prev, msg])
          lastReply = msg.content
          setConversations((prev) => {
            const rest = prev.filter((c) => c.id !== payload.conversation.id)
            return [payload.conversation, ...rest]
          })
          if (showUi()) {
            setStatusNote(null)
            playUiSound('receive', {
              enabled: Boolean(settings?.ui_sounds),
              volume: (settings?.ui_sound_volume as 'low' | 'medium' | 'high') || 'low',
            })
          }
          const delight = (payload as { delight?: { moment?: string } }).delight
          if (delight?.moment && showUi()) {
            setMomentGlint(true)
            window.setTimeout(() => setMomentGlint(false), 1200)
            playUiSound('moment', {
              enabled: Boolean(settings?.ui_sounds),
              volume: (settings?.ui_sound_volume as 'low' | 'medium' | 'high') || 'low',
            })
          }
          if (payload.research) void refreshAudits()
          if (payload.tool?.tool === 'reminder' || payload.tool?.tool === 'timer' || payload.tool?.tool === 'alarm') void refreshReminders()
          if (payload.tool?.tool === 'calendar') {
            if (payload.tool.action === 'open') {
              setCalendarOpen(true)
              setWatchlistOpen(false)
              setSettingsPanelOpen(false)
              setSidebarOpen(false)
              closeVoice()
              openSheet('calendar')
            }
          }
          if (payload.tool?.tool === 'watchlist') {
            const focusRaw = String(payload.tool.result?.focus || '')
            const focus = focusRaw === 'favorite' || focusRaw === 'watch' ? focusRaw : payload.tool.action === 'open' ? 'watch' : ''
            if (focus) openWatchlistSheet(focus)
          }
          applyAppTool(payload.tool)
          applyHudTool(payload.tool)
          if (driveCloseGenRef.current === closeGen) {
            if (opensChessOverlay(payload.tool)) {
              setChessOpen(true)
              setDriveOpen(false)
              closeSheet('drive')
            } else if (payload.tool?.action === 'close' || hidesDriveOverlay(payload.tool)) {
              setDriveOpen(false)
              closeSheet('drive')
            } else if (opensDriveOverlay(payload.tool)) {
              setDriveOpen(true)
              setCalendarOpen(false)
              setWatchlistOpen(false)
              setSidebarOpen(false)
              setChessOpen(false)
              patchOverlay({ type: 'drop', id: 'calendar' }, { type: 'drop', id: 'watchlist' }, { type: 'ensure', id: 'drive' })
            }
          }
          maybeOpenSettingsFromReply(payload.assistant_message.content)
        },
        onError: (detail) => {
          lastError = detail
          if (showUi()) setError(detail)
        },
      }, opts?.blocks?.length ? { blocks: opts.blocks } : undefined)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Senden fehlgeschlagen'
      lastError = msg
      if (showUi()) {
        setError(msg)
        playUiSound('error', {
          enabled: Boolean(settings?.ui_sounds),
          volume: (settings?.ui_sound_volume as 'low' | 'medium' | 'high') || 'low',
        })
        setLastFailed(content)
        setStreamingText(null)
        setMessages((prev) => prev.filter((m) => !m.id.startsWith('tmp-')))
      }
    } finally {
      endTurn({ source, conversationId })
      if (source !== 'debug') {
        setBusy(false)
        busyRef.current = false
        textareaRef.current?.focus()
      }
      void refreshHealth()
      void refreshMemory()
      void refreshSettings()
    }
    return { reply: lastReply, tool: lastTool, error: lastError }
  }

  sendRef.current = sendMessage

  async function startDebugChat(title: string) {
    const created = await createConversation(title)
    activeIdRef.current = created.id
    setConversations((prev) => [created, ...prev])
    setActiveId(created.id)
    setMessages([])
    return created.id
  }

  async function onDocFile(file: File) {
    if (!file || busy) return
    setBusy(true)
    setError(null)
    setStatusNote('Datei…')
    try {
      let conversationId = activeId
      if (!conversationId) {
        const created = await createConversation()
        conversationId = created.id
        setConversations((prev) => [created, ...prev])
        setActiveId(created.id)
      }
      const { reply } = await ingestDocFile(conversationId, file)
      const conv = await getConversation(conversationId)
      setMessages(conv.messages)
      setConversations((prev) => {
        const rest = prev.filter((c) => c.id !== conv.id)
        return [conv, ...rest]
      })
      setStatusNote(null)
      if (!reply) setStatusNote('Nichts Lesbares in der Datei.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Datei fehlgeschlagen')
      setStatusNote(null)
    } finally {
      setBusy(false)
      if (eyeFileRef.current) eyeFileRef.current.value = ''
    }
  }

  function pastedBlock(image: { src: string; alt: string }): ChatBlock {
    return { kind: 'image', src: image.src, alt: image.alt, source: 'Zwischenablage' }
  }

  async function attachClipboardImage(file: File) {
    const got = await fileToJpegDataUrl(file)
    if ('error' in got) {
      setError(got.error)
      return
    }
    setError(null)
    setPasteImage({ src: got.dataUrl, alt: 'Eingefügtes Bild' })
  }

  function onPasteImage(e: ClipboardEvent<HTMLTextAreaElement>) {
    const file = clipboardImageFile(e.clipboardData)
    if (!file || busy) return
    e.preventDefault()
    void attachClipboardImage(file)
  }

  async function commitPastedImage(image: { src: string; alt: string }) {
    setBusy(true)
    busyRef.current = true
    setError(null)
    try {
      const conversationId = await ensureConversation()
      saveLastEyeImage(image.src)
      await addMessage(conversationId, 'user', 'Bild', { blocks: [pastedBlock(image)] })
      await addMessage(conversationId, 'assistant', 'Bild liegt an der Nachricht.')
      const conv = await getConversation(conversationId)
      setMessages(conv.messages)
      setConversations((prev) => {
        const rest = prev.filter((c) => c.id !== conv.id)
        return [conv, ...rest]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bild nicht angehängt')
    } finally {
      setBusy(false)
      busyRef.current = false
      textareaRef.current?.focus()
    }
  }

  async function onSend() {
    const content = draft.trim()
    const image = pasteImage
    if (busy || (!content && !image)) return
    setDraft('')
    setPasteImage(null)
    if (image && !content) {
      await commitPastedImage(image)
      return
    }
    if (image) saveLastEyeImage(image.src)
    await sendMessage(content, { blocks: image ? [pastedBlock(image)] : undefined })
  }

  async function sendVoiceTurn(
    content: string,
    onToken?: (piece: string, full: string) => void,
    opts?: { preempt?: boolean },
  ): Promise<string> {
    if (!content) return ''
    let conversationId = await ensureConversation()
    const ticket = beginTurn({
      source: 'voice',
      content,
      conversationId,
      preempt: opts?.preempt,
    })
    if (!ticket.ok) return ''
    voiceReqRef.current = ticket.requestId
    const closeGen = driveCloseGenRef.current
    const optimistic: Message = {
      id: `tmp-voice-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    markEnter(optimistic.id)
    const showUi = () => conversationId === activeIdRef.current
    if (showUi()) setMessages((prev) => [...prev, optimistic])
    let answer = ''
    let acc = ''
    try {
      await streamChat(
        conversationId,
        content,
        {
          onMeta: (meta) => {
            markEnter(meta.user_message.id)
            if (meta.conversation) {
              setConversations((prev) => {
                const rest = prev.filter((c) => c.id !== meta.conversation!.id)
                return [meta.conversation!, ...rest]
              })
            }
            if (!showUi()) return
            setMessages((prev) => {
              const withoutTmp = prev.filter((m) => m.id !== optimistic.id)
              return [...withoutTmp, meta.user_message]
            })
          },
          onToken: (piece) => {
            acc += piece
            onToken?.(piece, acc)
          },
          onReplace: (text) => {
            acc = text
            onToken?.('', text)
          },
          onDone: (payload) => {
            markEnter(payload.assistant_message.id)
            let contentOut = payload.assistant_message.content
            const cut = voiceCutsRef.current.has(ticket.requestId)
              ? voiceCutsRef.current.get(ticket.requestId) || ''
              : undefined
            if (cut !== undefined) {
              voiceCutsRef.current.delete(ticket.requestId)
              contentOut = truncateSpoken(contentOut, cut)
              if (contentOut) {
                void patchMessage(payload.assistant_message.id, contentOut)
              } else {
                void deleteMessage(payload.assistant_message.id)
              }
            }
            answer = contentOut
            if (showUi() && contentOut) {
              setMessages((prev) => [
                ...prev,
                { ...payload.assistant_message, content: contentOut },
              ])
            }
            setConversations((prev) => {
              const rest = prev.filter((c) => c.id !== payload.conversation.id)
              return [payload.conversation, ...rest]
            })
            if (payload.tool?.tool === 'reminder' || payload.tool?.tool === 'timer' || payload.tool?.tool === 'alarm') void refreshReminders()
            if (driveCloseGenRef.current === closeGen) {
              if (opensChessOverlay(payload.tool)) {
                setChessOpen(true)
                setDriveOpen(false)
                closeSheet('drive')
              } else if (payload.tool?.action === 'close' || hidesDriveOverlay(payload.tool)) {
                setDriveOpen(false)
                closeSheet('drive')
              } else if (opensDriveOverlay(payload.tool)) {
                setDriveOpen(true)
                setChessOpen(false)
                patchOverlay({ type: 'ensure', id: 'drive' })
              }
            }
            maybeOpenSettingsFromReply(contentOut)
            if (payload.tool?.tool === 'watchlist') {
              const focusRaw = String(payload.tool.result?.focus || '')
              const focus = focusRaw === 'favorite' || focusRaw === 'watch' ? focusRaw : payload.tool.action === 'open' ? 'watch' : ''
              if (focus) openWatchlistSheet(focus)
            }
            applyAppTool(payload.tool)
            applyHudTool(payload.tool)
          },
          onError: (detail) => {
            if (showUi()) setError(detail)
          },
        },
        { voice: true },
      )
    } finally {
      endTurn({ source: 'voice', conversationId, requestId: ticket.requestId })
      void refreshSettings()
    }
    return answer
  }

  async function onRetry() {
    if (!lastFailed || busy) return
    await sendMessage(lastFailed)
  }

  function openSettings(topic: SettingsTopic = 'keys') {
    setSettingsTopic(topic)
    setCalendarOpen(false)
    setSettingsPanelOpen(true)
    setSidebarOpen(false)
    closeVoice()
    openSheet('settings')
    void refreshReminders()
    void refreshMemory(memoryFilter)
    if (topic === 'forschung') void refreshAudits()
  }

  function maybeOpenSettingsFromReply(reply: string) {
    if (debugRunningRef.current) return
    const t = reply || ''
    // „X ist aus (Einstellungen → …)“ ist der Default-Schalter, kein Setup-Sprung.
    // Sonst verschwindet der Composer nach Fernseher/Ventilator/Steckdose.
    const switchOff = /ist aus\s*\(/i.test(t)
    if (/Einstellungen\s*→\s*Fernseher/i.test(t) && !switchOff) openSettings('tv')
    else if (/Einstellungen\s*→\s*(?:Haus|Ventilator|Steckdose)/i.test(t) && !switchOff) openSettings('haus')
    else if (/Gemini-Key liegt, aber Gemini ist aus/i.test(t)) openSettings('hirn')
    else if (/Gemini(?: ist)? an, aber kein/i.test(t)) openSettings('keys')
    else if (/Einstellungen\s*→\s*Musik|Spotify anmelden/i.test(t)) openSettings('musik')
    else if (/Einstellungen\s*→\s*(?:PC|Geräte)/i.test(t)) {
      try {
        sessionStorage.setItem('jarvis_pc_qr_scan', '1')
        window.dispatchEvent(new Event('jarvis-pc-qr-scan'))
      } catch {
        /* */
      }
      openSettings('pc')
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void onSend()
    }
  }

  const activeTitle =
    conversations.find((c) => c.id === activeId)?.title ?? 'Ultron'

  const healthOk = Boolean(health?.ok)
  const geminiOn = Boolean(settings?.gemini_enabled && settings.gemini_api_key?.trim())
  const settingsLayer = useOverlay(settingsPanelOpen)
  const calendarLayer = useOverlay(calendarOpen)
  const watchlistLayer = useOverlay(watchlistOpen)
  const voiceLayer = useOverlay(voiceOpen)
  const liveHud = settings || loadSettings()
  const lageOn = !homeOpen && (lageWide
    ? !liveHud.hud_hidden
    : Boolean(liveHud.hud_force) && lageSessionActive())
  const lageSideChatOn = lageOn && lageWide && lageSideChat
  const lageChat = lageOn && liveHud.hud_view === 'body' && liveHud.body_with_chat !== false
  const lageAmber = liveHud.hud_accent === 'amber'
  const leisteOff = liveHud.leiste_on === false
  const leisteZu = Boolean(liveHud.leiste_zu)
  const dockId = settingsPanelOpen
    ? 'settings'
    : watchlistOpen
      ? 'watchlist'
      : calendarOpen
        ? 'calendar'
        : voiceOpen && !voiceCompact
          ? 'voice'
            : homeOpen
              ? liveHud.tischplatte_on
                ? 'tisch'
                : 'home'
              : lageOn
              ? 'lage'
              : 'chat'
  const dockItems = [
    { id: 'tisch', label: 'Tisch', icon: <IconTisch /> },
    { id: 'home', label: 'Start', icon: <IconHome /> },
    { id: 'chat', label: 'Chat', icon: <IconChat /> },
    { id: 'lage', label: 'Lage', icon: <IconGlobe /> },
    { id: 'voice', label: 'Hören', icon: <IconMic /> },
    { id: 'calendar', label: 'Kalender', icon: <IconCal /> },
    { id: 'watchlist', label: 'Filme', icon: <IconFilm /> },
    { id: 'settings', label: 'Mehr', icon: <IconGearMini /> },
  ]
  function openWatchlistSheet(focus?: 'watch' | 'favorite') {
    if (focus) setWatchlistFocus(focus)
    setWatchlistOpen(true)
    setCalendarOpen(false)
    setSettingsPanelOpen(false)
    setSidebarOpen(false)
    closeVoice()
    openSheet('watchlist')
  }
  function showTischplatte() {
    setHomeOpen(true)
    setMiniChatOpen(false)
    setSettingsPanelOpen(false)
    setCalendarOpen(false)
    setWatchlistOpen(false)
    closeSheet('settings')
    closeSheet('calendar')
    closeSheet('watchlist')
    closeVoice()
    dropOverlayHistory()
    setLageSession(false)
    setDriveOpen(false)
    setChessOpen(false)
    closeSheet('drive')
  }

  function goDock(id: string) {
    setSidebarOpen(false)
    if (id === 'home') {
      setHomeOpen(true)
      setMiniChatOpen(false)
      setSettingsPanelOpen(false)
      setCalendarOpen(false)
      setWatchlistOpen(false)
      closeSheet('settings')
      closeSheet('calendar')
      closeSheet('watchlist')
      closeVoice()
      dropOverlayHistory()
      setLageSession(false)
      setDriveOpen(false)
      setChessOpen(false)
      closeSheet('drive')
      void patchSettings({ hud_force: false, hud_hidden: true, tischplatte_on: false }).then((s) => setSettings(s))
      return
    }
    if (id === 'tisch') {
      showTischplatte()
      void patchSettings({ tischplatte_on: true, hud_force: false, hud_hidden: true }).then((s) => setSettings(s))
      return
    }
    if (id === 'chat') {
      setHomeOpen(false)
      setMiniChatOpen(false)
      setSettingsPanelOpen(false)
      setCalendarOpen(false)
      setWatchlistOpen(false)
      closeSheet('settings')
      closeSheet('calendar')
      closeSheet('watchlist')
      closeVoice()
      dropOverlayHistory()
      setLageSession(false)
      void patchSettings({ hud_force: false, hud_hidden: true }).then((s) => setSettings(s))
      return
    }
    if (id === 'lage') {
      setHomeOpen(false)
      setSettingsPanelOpen(false)
      setCalendarOpen(false)
      setWatchlistOpen(false)
      closeSheet('settings')
      closeSheet('calendar')
      closeSheet('watchlist')
      closeVoice()
      dropOverlayHistory()
      setLageSession(true)
      const cur = loadSettings().hud_view
      const hud_view = cur === 'body' || cur === 'globe' || cur === 'serie' ? cur : 'globe'
      void patchSettings({ hud_force: true, hud_hidden: false, hud_view }).then((s) => setSettings(s))
      return
    }
    if (id === 'voice') {
      openVoiceMode()
      return
    }
    if (id === 'calendar') {
      setCalendarOpen(true)
      setWatchlistOpen(false)
      setSettingsPanelOpen(false)
      closeVoice()
      openSheet('calendar')
      return
    }
    if (id === 'watchlist') {
      if (watchlistOpen) {
        closeWatchlist()
        return
      }
      openWatchlistSheet()
      return
    }
    openSettings('keys')
  }

  function launchHomeApp(id: HomeAppId) {
    if (id === 'chat') {
      goDock('chat')
      return
    }
    if (id === 'voice') {
      openVoiceMode()
      return
    }
    if (id === 'calendar') {
      goDock('calendar')
      return
    }
    if (id === 'globe') {
      setHomeOpen(false)
      setSettingsPanelOpen(false)
      setCalendarOpen(false)
      setWatchlistOpen(false)
      closeSheet('settings')
      closeSheet('calendar')
      closeSheet('watchlist')
      closeVoice()
      dropOverlayHistory()
      setLageSession(true)
      void patchSettings({ hud_force: true, hud_hidden: false, hud_view: 'globe' }).then((s) => setSettings(s))
      return
    }
    if (id === 'lage') {
      goDock('lage')
      return
    }
    if (id === 'overlay') {
      openDrive()
      return
    }
    if (id === 'hirn') {
      openSettings('hirn')
      return
    }
    if (id === 'watchlist') {
      openWatchlistSheet()
      return
    }
    openSettings('keys')
  }

  useEffect(() => {
    const on = Boolean(liveHud.tischplatte_on)
    const prev = tischWasRef.current
    tischWasRef.current = on
    if (prev === null || prev === on || !on) return
    showTischplatte()
    if (loadSettings().plan_phase === 'live') setMiniChatOpen(true)
  }, [liveHud.tischplatte_on])

  useEffect(() => {
    let phase = ''
    try {
      const raw = liveHud.scan_json || ''
      if (raw) phase = String((JSON.parse(raw) as { phase?: string }).phase || '')
    } catch {
      phase = ''
    }
    if (phase !== 'live' && phase !== 'model') return
    showTischplatte()
  }, [liveHud.scan_json])

  return (
    <div className={`app${homeOpen ? ' is-home' : ''}${lageOn ? ' is-lage' : ''}${lageChat ? ' is-lage-chat' : ''}${lageAmber ? ' hud-amber' : ''}${overlayHidesDrive(overlay) && driveOpen ? ' is-sheet-on-drive' : ''}${debugRunning ? ' is-debug-run' : ''}${driveOpen || chessOpen ? '' : ' has-nav-dock'}${leisteOff ? ' is-leiste-off' : ''}${!leisteOff && leisteZu ? ' is-leiste-collapsed' : ''}`} ref={appRef}>
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
            <h2 id="setup-title">Gemini zuerst</h2>
            <p>
              Hirn ist Gemini sobald ein Key da ist. Groq nur Backup. Das kleine lokale 0,5B
              zuletzt — nicht ChatGPT. Timer, Kugel und Wetter laufen auch ohne Modell.
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
                Vor Neuinstall: Einstellungen → Hausstand → Exportieren. Sonst sind Keys weg.
              </p>
            )}
            {error ? <p className="settings-hint setup-error">{error}</p> : null}
            <button
              type="button"
              className="retry-btn"
              disabled={downloadBusy}
              onClick={() => {
                void patchSettings({ setup_dismissed: true })
                setSetupOpen(false)
                openSettings('keys')
              }}
            >
              Gemini-Key eintragen
            </button>
            <button
              type="button"
              className="ghost-btn"
              disabled={downloadBusy}
              onClick={() => {
                void patchSettings({ setup_dismissed: true })
                setSetupOpen(false)
              }}
            >
              Fertig — Tools ohne Modell
            </button>
            <button
              type="button"
              className={`dl-btn${downloadBusy && downloadPhase !== 'load' && !hasLocalModel ? ' is-work' : ''}${downloadBusy && (downloadPhase === 'load' || hasLocalModel) ? ' is-done' : ''}`}
              style={{ ['--p' as string]: String(Math.max(0, Math.min(1, downloadPct / 100)) ) }}
              disabled={downloadBusy}
              aria-busy={downloadBusy}
              onClick={() => void downloadModel()}
            >
              <span className="dl-stream" aria-hidden />
              <span className="dl-liquid" aria-hidden>
                <span className="dl-wave" />
              </span>
              <span className="dl-face">
                <span className="dl-lab">
                  {downloadBusy
                    ? downloadPhase === 'load' || hasLocalModel
                      ? 'Modell starten…'
                      : `Laden ${downloadPct}%`
                    : hasLocalModel
                      ? 'Modell starten (Backup)'
                      : 'Lokales 0,5B laden (nur Backup)'}
                </span>
              </span>
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
          <div className="brand-copy">
            <h1>Ultron</h1>
            <p>Handy · v{APP_VERSION}</p>
          </div>
          <button
            type="button"
            className="leiste-fold"
            aria-expanded={!leisteZu}
            aria-label={leisteZu ? 'Leiste aufklappen' : 'Leiste einklappen'}
            onClick={() => {
              void patchSettings({ leiste_zu: !leisteZu }).then((s) => setSettings(s))
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <path
                d={leisteZu ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <button className="new-chat" type="button" onClick={() => void onNewChat()}>
          <span className="new-chat-plus" aria-hidden>
            +
          </span>
          <span className="new-chat-lab"> Neues Gespräch</span>
        </button>
        <NavIsland
          className="nav-island-side"
          ariaLabel="Bereiche"
          items={dockItems}
          value={dockId}
          onChange={goDock}
        />

        <div className="chat-list">
          {FOLDER_IDS.map((fid) => {
            const rows = conversations.filter((c) => (c.folder_id || 'sonstiges') === fid)
            if (!rows.length) return null
            return (
              <div key={fid}>
                <p className="chat-folder-label">{displayFolder(fid)}</p>
                {rows.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chat-item ${c.id === activeId ? 'active' : ''}`}
                    style={{ ['--i' as string]: i }}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return
                      pressFired.current = ''
                      const id = c.id
                      const x = e.clientX
                      const y = e.clientY
                      const ox = x
                      const oy = y
                      window.clearTimeout(pressTimer.current)
                      pressTimer.current = window.setTimeout(() => {
                        pressFired.current = id
                        setChatMenu({ id, x, y })
                      }, 480)
                      const move = (ev: PointerEvent) => {
                        if (Math.hypot(ev.clientX - ox, ev.clientY - oy) > 14) {
                          window.clearTimeout(pressTimer.current)
                        }
                      }
                      const up = () => {
                        window.clearTimeout(pressTimer.current)
                        window.removeEventListener('pointermove', move)
                        window.removeEventListener('pointerup', up)
                        window.removeEventListener('pointercancel', up)
                      }
                      window.addEventListener('pointermove', move)
                      window.addEventListener('pointerup', up)
                      window.addEventListener('pointercancel', up)
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      pressFired.current = c.id
                      setChatMenu({ id: c.id, x: e.clientX, y: e.clientY })
                    }}
                    onClick={() => {
                      if (pressFired.current === c.id) {
                        pressFired.current = ''
                        return
                      }
                      setChatMenu(null)
                      setHomeOpen(false)
                      void openConversation(c.id)
                    }}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )
          })}
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
          ) : (
            <>
              Gerät <strong>nicht bereit</strong>
            </>
          )}
        </div>
      </aside>
      {chatMenu
        ? createPortal(
            <div
              className="hold-menu"
              role="menu"
              style={{
                left: Math.max(8, Math.min(chatMenu.x, window.innerWidth - 168)),
                top: Math.max(8, Math.min(chatMenu.y, window.innerHeight - 108)),
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  const id = chatMenu.id
                  setChatMenu(null)
                  void downloadChat(id)
                }}
              >
                Download
              </button>
              <button
                type="button"
                className="is-danger"
                role="menuitem"
                onClick={() => {
                  const id = chatMenu.id
                  setChatMenu(null)
                  void deleteChatById(id)
                }}
              >
                Löschen
              </button>
            </div>,
            document.body,
          )
        : null}

      <main className={`main${homeOpen ? ' is-home' : ''}${driveOpen || chessOpen ? ' is-drive' : ''}${lageOn ? ' is-lage' : ''}${lageChat ? ' is-lage-chat' : ''}${lageSideChatOn ? ' is-lage-sidechat' : ''}${overlayHidesDrive(overlay) && driveOpen ? ' is-sheet-on-drive' : ''}`}>
        {voiceLayer.shown ? (
          <VoiceMode
            leaving={voiceLayer.leaving}
            compact={voiceCompact}
            onClose={() => closeVoice(true)}
            onTurn={(text, onTok, opts) => sendVoiceTurn(text, onTok, opts)}
            onTruncate={(spoken) => {
              const id = voiceReqRef.current
              if (id) voiceCutsRef.current.set(id, spoken)
            }}
            onMicDenied={() => {
              if (micDeniedRef.current) return
              micDeniedRef.current = true
              closeVoice(true)
              void (async () => {
                const id = await ensureConversation()
                const { addMessage } = await import('./engine/store.ts')
                const msg = await addMessage(
                  id,
                  'assistant',
                  'Mikrofon abgelehnt — ohne Mikrofon kein Sprachmodus.',
                )
                if (id === activeIdRef.current) setMessages((prev) => [...prev, msg])
              })()
            }}
            initialUtterance={voiceSeed}
          />
        ) : null}
        {homeOpen && !driveOpen && !chessOpen ? (
          <HomeScreen
            face="ultron"
            onOpen={launchHomeApp}
            tischplatteOn={Boolean(liveHud.tischplatte_on)}
            view={liveHud.tischplatte_view || 'sprints'}
            focus={liveHud.tischplatte_focus || ''}
            hint={liveHud.tischplatte_hint || ''}
            seed={liveHud.tischplatte_seed || 0}
            planPhase={liveHud.plan_phase || ''}
          />
        ) : null}
        {calendarLayer.shown ? (
          <CalendarView
            leaving={calendarLayer.leaving}
            onClose={() => {
              setCalendarOpen(false)
              closeSheet('calendar')
              dropOverlayHistory()
            }}
          />
        ) : null}
        {watchlistLayer.shown ? (
          <WatchlistOverlay
            leaving={watchlistLayer.leaving}
            focus={watchlistFocus}
            onFocus={setWatchlistFocus}
            onClose={closeWatchlist}
          />
        ) : null}
        {driveOpen ? (
          <DriveMode
            onClose={() => {
              driveCloseGenRef.current += 1
              closeDrive()
              setDriveOpen(false)
              closeSheet('drive')
              dropOverlayHistory()
            }}
            onCommand={(text) => sendVoiceTurn(text)}
          />
        ) : null}
        {chessOpen ? (
          <ChessMode
            onClose={() => {
              setChessOpen(false)
              dropOverlayHistory()
            }}
            onCommand={(text) => sendVoiceTurn(text)}
          />
        ) : null}
        {homeOpen ? null : (
        <>
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
              onClick={() => openSettings('keys')}
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

        {geminiOn && healthOk && !(settings?.gemini_banner_dismissed || liveHud.gemini_banner_dismissed) ? (
          <div className="fallback-banner">
            <span>Gemini (Google) — Nachrichten gehen ins Netz.</span>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => void patchSetting({ gemini_banner_dismissed: true })}
            >
              Verstanden
            </button>
          </div>
        ) : null}
        {debugRunning ? (
          <div className="fallback-banner">
            Debug-Lauf im Hintergrund. Settings → Debug: Stop oder Download. Chat bleibt nutzbar.
          </div>
        ) : null}

        {lageOn && !voiceOpen && !calendarOpen && !watchlistOpen && !driveOpen && !chessOpen && !settingsLayer.shown ? (
          <Lage
            onSend={(text) => void sendMessage(text)}
            draft={draft}
            setDraft={setDraft}
            busy={busy}
            recent={messages.slice(-4)}
            streaming={streamingText}
            conversationId={activeId}
            onHudChange={onHudChange}
            compact={!lageWide}
            hideChatTile
            onOpenChess={() => setChessOpen(true)}
            sideChatOpen={lageSideChatOn}
            onToggleSideChat={lageWide ? () => setLageSideChat((v) => !v) : undefined}
          />
        ) : null}
        <div className="messages" ref={messagesRef} onScroll={onMessagesScroll}>
          <div className="messages-inner thread-slide" key={threadKey}>
            {messages.length === 0 && !busy && streamingText === null ? (
              <div className="empty">
                <div className="empty-halo" aria-hidden>
                  <i />
                  <i />
                  <i />
                </div>
                <h3>Ultron</h3>
                <p>Ein Feld antippen — oder selbst schreiben. {geminiOn && !(settings?.gemini_banner_dismissed || liveHud.gemini_banner_dismissed) ? 'Gemini (Google), nicht privat.' : geminiOn ? 'Gemini ist an.' : 'Lokal, ohne Cloud-Hirn.'}</p>
              </div>
            ) : null}

            {messages.slice(-80).map((m, i, list) => {
              const enter =
                enterIds[m.id] &&
                (m.role === 'user' ? 'enter-user' : 'enter-assistant')
              const tool = m.role === 'assistant' ? (m.meta?.tool as ToolMeta | undefined) : undefined
              const blocks = parseChatBlocks(m.meta?.blocks)
              return (
                <div key={m.id} className={`row ${m.role}${enter ? ` ${enter}` : ''}`}>
                  {m.role === 'assistant' ? (
                    <div className="avatar jarvis">
                      U
                    </div>
                  ) : null}
                  <div className="bubble">
                    <div className="bubble-text">{m.content}</div>
                    {blocks.length ? <ChatBlocks blocks={blocks} onChessClick={() => setChessOpen(true)} /> : null}
                    {tool && !hideToolChip(list[i - 1], tool) ? (
                      <ToolChip
                        tool={tool}
                        onConfirm={(text) => void sendMessage(text)}
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
                <div className="avatar jarvis">
                  U
                </div>
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
                    <ReplyOrb state={streamResearch ? 'searching' : 'composing'} />
                  )}
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
        </div>

        {!calendarOpen && !watchlistOpen && !settingsLayer.shown && !voiceOpen ? (
        <div className="composer-wrap">
          <TimerChip />
          <PcDashboard busy={busy} />
          <PcLiveDock />
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
          <div className={`composer ${composerFocused ? 'is-focused' : ''} ${busy ? 'is-busy' : ''}`}>
            {pasteImage ? (
              <div className="paste-preview">
                <img src={pasteImage.src} alt={pasteImage.alt} />
                <button type="button" onClick={() => setPasteImage(null)} aria-label="Bild von der Nachricht nehmen">
                  Weg
                </button>
              </div>
            ) : null}
            <input
              ref={eyeFileRef}
              type="file"
              accept="image/*,.pdf,.txt,.md,.csv,.json,application/pdf,text/plain,text/markdown,text/csv,application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onDocFile(file)
              }}
            />
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPasteImage}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              placeholder="Nachricht an Ultron…"
              rows={1}
              disabled={busy}
              lang="de"
              spellCheck
              autoCorrect="on"
              autoCapitalize="sentences"
            />
            <div className="composer-actions">
              <button
                type="button"
                className="icon-btn"
                disabled={busy}
                onClick={() => eyeFileRef.current?.click()}
                aria-label="Datei (Foto, PDF, Text)"
                title="Datei (Foto, PDF, Text)"
              >
                <IconCamera />
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
                disabled={busy || (!draft.trim() && !pasteImage)}
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
        </div>
        ) : null}
        </>
        )}
      </main>

      {settingsLayer.shown ? (
        <SettingsScreen
          leaving={settingsLayer.leaving}
          topic={settingsTopic}
          onTopic={(t) => {
            setSettingsTopic(t)
            if (t === 'forschung' || t === 'hirn') void refreshAudits()
            if (t === 'gedaechtnis' || t === 'daten') void refreshMemory(memoryFilter)
            if (t === 'wecker' || t === 'alltag') void refreshReminders()
          }}
          onClose={() => {
            setSettingsPanelOpen(false)
            closeSheet('settings')
            dropOverlayHistory()
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
          onDebugSend={(text, conversationId) => sendMessage(text, { conversationId, source: 'debug' })}
          onDebugStart={(title) => startDebugChat(title)}
          onDebugBegin={() => {
            setSettingsPanelOpen(false)
            setSidebarOpen(false)
            closeSheet('settings')
          }}
          onProbeSend={(text) => {
            setSettingsPanelOpen(false)
            setSidebarOpen(false)
            closeSheet('settings')
            void sendMessage(text)
          }}
          debugBusy={busy}
        />
      ) : null}

      <DebugChatDock
        overlayOpen={driveOpen || chessOpen || voiceOpen || calendarOpen || watchlistOpen || settingsPanelOpen}
        messages={messages}
        streaming={streamingText}
        activeConversationId={activeId}
        onOpen={() => openSettings('debug')}
      />
      {!driveOpen && !chessOpen ? (
        <>
          <GlanceRail
            open={railOpen}
            onToggle={() => setRailOpen((v) => !v)}
            tischplatteOn={Boolean(liveHud.tischplatte_on)}
            onTischplatte={(on) => {
              if (on) showTischplatte()
              void patchSettings({
                tischplatte_on: on,
                ...(on ? { hud_force: false, hud_hidden: true } : {}),
              }).then((s) => setSettings(s))
            }}
            leisteOn={!leisteOff}
            onLeiste={(on) => {
              if (!on) setSidebarOpen(false)
              void patchSettings({ leiste_on: on }).then((s) => setSettings(s))
            }}
          />
          {homeOpen ? (
            <MiniChat
              open={miniChatOpen}
              onToggle={() => setMiniChatOpen((v) => !v)}
              onExpand={() => {
                setMiniChatOpen(false)
                goDock('chat')
              }}
              messages={messages}
              streaming={streamingText}
              busy={busy}
              draft={draft}
              setDraft={setDraft}
              onSend={() => void onSend()}
              onPasteImage={onPasteImage}
              pasteImage={pasteImage}
              onClearPaste={() => setPasteImage(null)}
              face="ultron"
            />
          ) : null}
          {homeOpen && !voiceOpen ? (
            <div className="voice-shortcut">
              <VoiceSphere
                phase="idle"
                size={72}
                label="Sprache"
                onClick={() => openVoiceMode('', true)}
              />
            </div>
          ) : null}
        </>
      ) : null}
      <HausScan
        open={hausScan}
        onClose={() => setHausScan(false)}
        onDone={(line) => setStatusNote(line)}
      />
      {!driveOpen && !chessOpen ? (
        <NavIsland
          className="nav-dock"
          ariaLabel="Hauptnavigation"
          items={dockItems}
          value={dockId}
          onChange={goDock}
        />
      ) : null}
    </div>
  )
}

export default App
