import { useEffect, useState, type InputHTMLAttributes } from 'react'
import type { Health, MemoryCategory, MemoryItem, Reminder, ResearchAudit, Settings } from '../api'
import { fanDiscover, fanLearn, fanPick, fanTest, plugDiscover, plugProbe, plugTest, loadPlugs, upsertPlug, removePlug, emptyPlug, testPc } from '../api'
import type { Plug } from '../api'
import { copyText } from '../copy-text'
import { ensureDeviceLocation } from '../native/geo'
import { DebugPanel } from './DebugPanel'
import { HUD_CATALOG, HUD_DEFAULT_ON, type HudId } from '../engine/hud-parse'
import { TTS_VOICES } from '../engine/tts'
import { isAllowedPcHost, PC_HOST_HINT, sanitizePcHost } from '../engine/pc-host'
import {
  spotifyLoggedIn,
  spotifyLogout,
  spotifyRedirect,
  startSpotifyLogin,
} from '../engine/spotify'
import {
  applyBackup,
  asBackup,
  previewBackup,
  shareOrDownloadBackup,
  type BackupPreview,
} from '../engine/backup'
import {
  filterTopics,
  resolveTopic,
  settingsTabForQuery,
  TOPIC_FACE,
  visibleSettingsTabs,
  type SettingsTab,
  type SettingsTopic,
} from '../engine/settings-ia'
import { loadSettings } from '../engine/store'
import { PROBE_COPY_GROUPS } from '../engine/test-copy'

export type { SettingsTopic }

const MEM_FILTERS = [
  'all',
  'place',
  'contact',
  'birthday',
  'pref',
  'fact',
  'joke',
  'boundary',
  'open_loop',
] as const

function memLabel(f: (typeof MEM_FILTERS)[number]): string {
  if (f === 'all') return 'Alle'
  if (f === 'place') return 'Orte'
  if (f === 'contact') return 'Nummern'
  if (f === 'birthday') return 'Geburtstage'
  if (f === 'pref') return 'Vorlieben'
  if (f === 'fact') return 'Fakten'
  if (f === 'joke') return 'Witze'
  if (f === 'boundary') return 'Grenzen'
  if (f === 'open_loop') return 'Offen'
  return f
}

function KeyMark({ on }: { on: boolean }) {
  return <em className={`key-mark ${on ? 'is-on' : ''}`}>{on ? 'liegt' : 'fehlt'}</em>
}

/** Text-Feld mit Punkten — normale Tastatur, Einfügen erlaubt. type=password sperrt das auf Android. */
function SecretField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={['secret-field', props.className].filter(Boolean).join(' ')}
      type="text"
      inputMode="text"
      autoComplete="off"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      data-1p-ignore="true"
      data-lpignore="true"
      data-form-type="other"
    />
  )
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false)
  return (
    <label className="settings-field copy-field">
      <span>{label}</span>
      <div className="copy-field-row">
        <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} />
        <button
          type="button"
          className="copy-btn"
          disabled={!value.trim()}
          onClick={() => {
            void copyText(value).then((ok) => {
              if (!ok) return
              setDone(true)
              window.setTimeout(() => setDone(false), 1400)
            })
          }}
        >
          {done ? 'Kopiert' : 'Kopieren'}
        </button>
      </div>
    </label>
  )
}

export type SettingsScreenProps = {
  topic: SettingsTopic
  onTopic: (t: SettingsTopic) => void
  onClose: () => void
  leaving?: boolean
  settings: Settings | null
  settingsBusy: boolean
  patchSetting: (patch: Partial<Settings>) => Promise<void>
  health: Health | null
  geminiOn: boolean
  downloadBusy: boolean
  downloadPhase: 'download' | 'load'
  downloadPct: number
  hasLocalModel: boolean
  downloadModel: () => void
  geminiBusy: boolean
  geminiMsg: string | null
  onGeminiTest: () => void
  groqBusy: boolean
  groqMsg: string | null
  onGroqTest: () => void
  reminders: Reminder[]
  remindBusy: boolean
  onDeleteReminder: (id: string) => void
  onPickTone: () => void
  onOpenVoice: () => void
  onPinShortcut: () => void
  shortcutMsg: string | null
  onWakeWord: (on: boolean) => void
  tvBusy: boolean
  tvMsg: string | null
  tvMsgOk: boolean | null
  tvFound: Array<{ host?: string; name?: string; mac?: string; port?: number; kind?: string }>
  onTvDiscover: () => void
  onTvPair: () => void
  onTvTest: () => void
  onTvFireTest: (host?: string, port?: number) => void
  onTvPick: (item: { host?: string; name?: string; mac?: string; port?: number; kind?: string }) => void
  auditOpen: boolean
  onToggleAudit: () => void
  audits: ResearchAudit[]
  memoryItems: MemoryItem[]
  memoryBusy: boolean
  memoryFilter: MemoryCategory | 'all'
  onMemoryFilter: (f: MemoryCategory | 'all') => void
  onDeleteMemory: (id: string) => void
  onClearMemory: () => void
  onDebugSend: (text: string, conversationId: string) => Promise<import('./DebugPanel').DebugSendResult | string | void>
  onDebugStart: (title: string) => Promise<string>
  onDebugBegin: () => void
  debugBusy: boolean
}

export function SettingsScreen(p: SettingsScreenProps) {
  const s = (p.settings || loadSettings()) as Settings
  const busy = p.settingsBusy
  const tab = resolveTopic(p.topic)
  const face = TOPIC_FACE[tab]
  const [railQuery, setRailQuery] = useState('')
  const [spotifyMsg, setSpotifyMsg] = useState<string | null>(null)
  const [fireHost, setFireHost] = useState(s?.tv_fire_host || '')
  const [firePort, setFirePort] = useState(String(s?.tv_fire_port || 5555))
  const [fanHost, setFanHost] = useState(s?.fan_host || '')
  const [pcHost, setPcHost] = useState(s?.pc_host || '')
  const [pcPort, setPcPort] = useState(String(s?.pc_port || 18790))
  const [pcToken, setPcToken] = useState(s?.pc_token || '')
  const [pcBusy, setPcBusy] = useState(false)
  const [pcMsg, setPcMsg] = useState<string | null>(null)
  const [pcMsgOk, setPcMsgOk] = useState<boolean | null>(null)
  const [fanBusy, setFanBusy] = useState(false)
  const [fanMsg, setFanMsg] = useState<string | null>(null)
  const [fanMsgOk, setFanMsgOk] = useState<boolean | null>(null)
  const [fanFound, setFanFound] = useState<Array<{ host?: string; mac?: string; name?: string }>>([])
  const [plugBusy, setPlugBusy] = useState(false)
  const [plugMsg, setPlugMsg] = useState<string | null>(null)
  const [plugMsgOk, setPlugMsgOk] = useState<boolean | null>(null)
  const [plugFound, setPlugFound] = useState<
    Array<{ host?: string; mac?: string; name?: string; kind?: string; deviceId?: string }>
  >([])
  const [plugDraft, setPlugDraft] = useState<Plug>(() => emptyPlug())
  const [locBusy, setLocBusy] = useState(false)
  const [locMsg, setLocMsg] = useState<string | null>(null)
  const [backupChats, setBackupChats] = useState(false)
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupMsg, setBackupMsg] = useState<string | null>(null)
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null)
  const [backupPending, setBackupPending] = useState<ReturnType<typeof asBackup>>(null)

  let hudOn: HudId[] = [...HUD_DEFAULT_ON]
  try {
    const raw = s?.hud_modules_json
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      const ids = parsed.filter((id): id is HudId => HUD_CATALOG.some((c) => c.id === id))
      if (ids.length) hudOn = ids
    }
  } catch {
    hudOn = [...HUD_DEFAULT_ON]
  }

  useEffect(() => {
    setFireHost(s?.tv_fire_host || '')
  }, [s?.tv_fire_host])

  useEffect(() => {
    setFirePort(String(s?.tv_fire_port || 5555))
  }, [s?.tv_fire_port])

  useEffect(() => {
    setFanHost(s?.fan_host || '')
  }, [s?.fan_host])

  useEffect(() => {
    setPcHost(s?.pc_host || '')
  }, [s?.pc_host])
  useEffect(() => {
    setPcPort(String(s?.pc_port || 18790))
  }, [s?.pc_port])
  useEffect(() => {
    setPcToken(s?.pc_token || '')
  }, [s?.pc_token])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') p.onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [p.onClose])

  useEffect(() => {
    const current = resolveTopic(p.topic)
    const next = settingsTabForQuery(railQuery, current)
    if (next !== current) p.onTopic(next)
  }, [railQuery, p.topic])

  const tabList: SettingsTab[] = visibleSettingsTabs(railQuery)
  const searchMiss = Boolean(railQuery.trim()) && filterTopics(railQuery).length === 0

  return (
    <div
      className={`settings-screen${p.leaving ? ' is-leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <header className="settings-top">
        <div className="settings-top-row">
          <div>
            <p className="settings-kicker">Einstellungen</p>
            <h2 key={tab} id="settings-title">
              {face.label}
            </h2>
            <p className="settings-top-hint">{face.hint}</p>
          </div>
          <button type="button" className="settings-close" onClick={p.onClose}>
            Fertig
          </button>
        </div>
        <label className="settings-field settings-search">
          <span className="sr-only">Suche</span>
          <input
            value={railQuery}
            onChange={(e) => setRailQuery(e.target.value)}
            placeholder="Suche: Key, Steckdose, löschen…"
            aria-label="Einstellungen suchen"
          />
        </label>
        <nav className="settings-tabs" aria-label="Reiter">
          {tabList.map((id) => {
            const t = TOPIC_FACE[id]
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`settings-tab ${tab === id ? 'active' : ''}${id === 'daten' ? ' is-danger' : ''}`}
                onClick={() => p.onTopic(id)}
              >
                {t.label}
              </button>
            )
          })}
        </nav>
        {searchMiss ? (
          <p className="settings-hint">Nichts zu „{railQuery.trim()}“. Reiter bleiben, Pane unverändert.</p>
        ) : null}
      </header>

      <div className="settings-pane">
        <div className="settings-pane-body">
          <div key={tab} className="settings-topic-slide">
          {tab === 'hirn' ? (
            <section className="settings-card">
              <h3>Dieses Handy</h3>
              <p className="settings-lead">
                Version {s?.version || '1.25.0'} · on-device, kein Server.
              </p>
              <p className="settings-hint">
                {p.health?.ok
                  ? p.geminiOn
                    ? 'Gemini an — Chat geht zu Google.'
                    : `Lokal bereit · ${p.health.model || 'Modell'}`
                  : p.health?.error || 'Modell laden oder Gemini einschalten.'}
              </p>
              {s?.tv_enabled ? (
                <p className="settings-hint">
                  TV: {s.tv_paired ? s.tv_name || 'gekoppelt' : 'nicht gekoppelt'}
                </p>
              ) : null}
            </section>
          ) : null}

          {tab === 'lage' ? (
            <section className="settings-card">
              <h3>Tablet-Lage</h3>
              <p className="settings-lead">
                Am Handy füllen Kugel oder Körper den Bereich über dem Composer. Lage aus holt den Chat zurück.
                Ab 900 px: Kacheln neben dem Chat. Composer und Mic bleiben. Oder hier immer an.
              </p>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(s?.hud_force)}
                  disabled={busy}
                  onChange={(e) =>
                    void p.patchSetting({ hud_force: e.target.checked, hud_hidden: !e.target.checked })
                  }
                />
                <span>Lage immer</span>
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={s?.hud_accent === 'amber'}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ hud_accent: e.target.checked ? 'amber' : 'green' })}
                />
                <span>Akzent orange</span>
              </label>
              <label className="settings-inline">
                <span>Sicht</span>
                <select
                  value={s?.hud_view || 'tiles'}
                  disabled={busy}
                  onChange={(e) => {
                    const hud_view = e.target.value as 'tiles' | 'body' | 'globe'
                    void p.patchSetting({
                      hud_view,
                      hud_force: hud_view === 'tiles' ? Boolean(s?.hud_force) : true,
                      hud_hidden: hud_view === 'tiles' ? Boolean(s?.hud_hidden) : false,
                    })
                  }}
                >
                  <option value="tiles">Kacheln</option>
                  <option value="body">Körper</option>
                  <option value="globe">Kugel</option>
                </select>
              </label>
              <p className="settings-hint">Module. Aus = Kachel weg.</p>
              {HUD_CATALOG.map((m) => (
                <label key={m.id} className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={hudOn.includes(m.id)}
                    disabled={busy}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...hudOn.filter((id) => id !== m.id), m.id]
                        : hudOn.filter((id) => id !== m.id)
                      const ordered = HUD_CATALOG.map((c) => c.id).filter((id) => next.includes(id))
                      void p.patchSetting({ hud_modules_json: JSON.stringify(ordered) })
                    }}
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </section>
          ) : null}

          {tab === 'hirn' ? (
            <section className="settings-card">
              <h3>Lokales Modell</h3>
              <p className="settings-lead">
                {s?.model_default || 'Qwen2.5 0.5B'} auf diesem Handy (~470 MB). Letzter Fallback, wenn Gemini und Groq fehlen — nicht ChatGPT.
              </p>
              {!p.health?.model_ready && !p.geminiOn ? (
                <div className="settings-actions">
                  <button type="button" className="retry-btn" disabled={p.downloadBusy} onClick={p.downloadModel}>
                    {p.downloadBusy
                      ? p.downloadPhase === 'load' || p.hasLocalModel
                        ? 'Modell starten…'
                        : `Laden ${p.downloadPct}%`
                      : p.hasLocalModel
                        ? 'Modell starten'
                        : 'Modell laden'}
                  </button>
                </div>
              ) : p.geminiOn ? (
                <p className="settings-hint">Lokal aus — Gemini übernimmt. Modell wird nicht geladen.</p>
              ) : (
                <p className="settings-hint">Modell bereit.</p>
              )}
            </section>
          ) : null}

          {tab === 'hirn' ? (
            <section className="settings-card">
              <h3>Gemini zuerst</h3>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(s?.gemini_enabled)}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ gemini_enabled: e.target.checked })}
                />
                <span>Gemini zuerst (Key unter API-Keys)</span>
              </label>
              <p className="settings-hint warn">
                An = Plaudern und Fotos gehen zu Google. Groq und das kleine lokale Modell sind nur Backup. Nicht privat.
              </p>
              <div className="settings-actions">
                <button type="button" className="retry-btn" onClick={() => p.onTopic('keys')}>
                  Zum API-Key
                </button>
                <button type="button" className="retry-btn" disabled={p.geminiBusy || busy} onClick={p.onGeminiTest}>
                  Testen
                </button>
              </div>
              {p.geminiMsg ? <p className="settings-hint">{p.geminiMsg}</p> : null}
            </section>
          ) : null}

          {tab === 'keys' ? (
            <>
              <section className="settings-card keys-overview">
                <h3>Alle Schlüssel</h3>
                <p className="settings-lead">
                  Hier liegen alle Keys der App. Einfügen geht — die Zeichen bleiben Punkte. Nichts davon teilen,
                  nicht in den Chat, nicht nach Git.
                </p>
                <ul className="key-index">
                  <li>
                    Gemini <KeyMark on={Boolean(s?.gemini_api_key?.trim())} />
                  </li>
                  <li>
                    Groq <KeyMark on={Boolean(s?.groq_api_key?.trim())} />
                  </li>
                  <li>
                    Tankerkönig <KeyMark on={Boolean(s?.tankerkoenig_api_key?.trim())} />
                  </li>
                  <li>
                    OMDb <KeyMark on={Boolean(s?.omdb_api_key?.trim())} />
                  </li>
                  <li>
                    FRED <KeyMark on={Boolean(s?.outlook_fred_key?.trim())} />
                  </li>
                  <li>
                    Spotify <KeyMark on={Boolean(s?.spotify_client_id?.trim())} />
                  </li>
                  <li>
                    Carto <KeyMark on={Boolean(s?.carto_api_key?.trim())} />
                  </li>
                </ul>
              </section>
              <section className="settings-card">
                <h3>
                  Gemini (Google) <KeyMark on={Boolean(s?.gemini_api_key?.trim())} />
                </h3>
                <p className="settings-hint">Hauptweg. aistudio.google.com/apikey — nicht teilen.</p>
                <label className="settings-field">
                  <span>API-Key</span>
                  <SecretField
                    key={`gemini-key-${s?.gemini_api_key ? 'set' : 'empty'}`}
                    defaultValue={s?.gemini_api_key || ''}
                    disabled={busy}
                    placeholder="AIza… hier einfügen"
                    onBlur={(e) => void p.patchSetting({ gemini_api_key: e.target.value.trim() })}
                  />
                </label>
                <div className="settings-actions">
                  <button type="button" className="retry-btn" disabled={p.geminiBusy || busy} onClick={p.onGeminiTest}>
                    Testen
                  </button>
                </div>
                {p.geminiMsg ? <p className="settings-hint">{p.geminiMsg}</p> : null}
              </section>
              <section className="settings-card">
                <h3>
                  Groq <KeyMark on={Boolean(s?.groq_api_key?.trim())} />
                </h3>
                <p className="settings-hint">Backup wenn Gemini fehlt. console.groq.com/keys</p>
                <label className="settings-field">
                  <span>API-Key</span>
                  <SecretField
                    key={`groq-key-${s?.groq_api_key ? 'set' : 'empty'}`}
                    defaultValue={s?.groq_api_key || ''}
                    disabled={busy}
                    placeholder="gsk_… hier einfügen"
                    onBlur={(e) => void p.patchSetting({ groq_api_key: e.target.value.trim() })}
                  />
                </label>
                <div className="settings-actions">
                  <button type="button" className="retry-btn" disabled={p.groqBusy || busy} onClick={p.onGroqTest}>
                    Testen
                  </button>
                </div>
                {p.groqMsg ? <p className="settings-hint">{p.groqMsg}</p> : null}
              </section>
              <section className="settings-card">
                <h3>
                  Tankerkönig (E10) <KeyMark on={Boolean(s?.tankerkoenig_api_key?.trim())} />
                </h3>
                <p className="settings-hint">
                  Nächste und günstigste Station, immer E10. Ohne Key keine Preise. creativecommons.tankerkoenig.de
                </p>
                <label className="settings-field">
                  <span>API-Key</span>
                  <SecretField
                    key={`tanker-key-${s?.tankerkoenig_api_key ? 'set' : 'empty'}`}
                    defaultValue={s?.tankerkoenig_api_key || ''}
                    disabled={busy}
                    placeholder="UUID von tankerkoenig.de"
                    onBlur={(e) => void p.patchSetting({ tankerkoenig_api_key: e.target.value.trim() })}
                  />
                </label>
              </section>
              <section className="settings-card">
                <h3>
                  OMDb (Filme) <KeyMark on={Boolean(s?.omdb_api_key?.trim())} />
                </h3>
                <p className="settings-hint">IMDb und Rotten Tomatoes nur wenn OMDb sie liefert. omdbapi.com/apikey.aspx</p>
                <label className="settings-field">
                  <span>API-Key</span>
                  <SecretField
                    key={`omdb-key-${s?.omdb_api_key ? 'set' : 'empty'}`}
                    defaultValue={s?.omdb_api_key || ''}
                    disabled={busy}
                    placeholder="Key von omdbapi.com"
                    onBlur={(e) => void p.patchSetting({ omdb_api_key: e.target.value.trim() })}
                  />
                </label>
              </section>
              <section className="settings-card">
                <h3>
                  FRED (Brent) <KeyMark on={Boolean(s?.outlook_fred_key?.trim())} />
                </h3>
                <p className="settings-hint">Optionale Rohöl-Zahl für die Weltlage. Serie DCOILBRENTEU. fred.stlouisfed.org</p>
                <label className="settings-field">
                  <span>API-Key</span>
                  <SecretField
                    key={`fred-key-${s?.outlook_fred_key ? 'set' : 'empty'}`}
                    defaultValue={s?.outlook_fred_key || ''}
                    disabled={busy}
                    placeholder="Key von fred.stlouisfed.org"
                    onBlur={(e) => void p.patchSetting({ outlook_fred_key: e.target.value.trim() })}
                  />
                </label>
              </section>
              <section className="settings-card">
                <h3>
                  Spotify Client-ID <KeyMark on={Boolean(s?.spotify_client_id?.trim())} />
                </h3>
                <p className="settings-hint">
                  developer.spotify.com → App anlegen → Redirect URI exakt:{' '}
                  <code>{typeof window !== 'undefined' ? spotifyRedirect() : 'https://localhost/'}</code>
                  . Anmelden bleibt unter Geräte.
                </p>
                <label className="settings-field">
                  <span>Client-ID</span>
                  <SecretField
                    key={`sp-id-${s?.spotify_client_id ? 'set' : 'empty'}`}
                    defaultValue={s?.spotify_client_id || ''}
                    disabled={busy}
                    placeholder="Spotify Client ID"
                    onBlur={(e) => void p.patchSetting({ spotify_client_id: e.target.value.trim() })}
                  />
                </label>
              </section>
              <section className="settings-card">
                <h3>
                  Carto (CarPlay-Karte) <KeyMark on={Boolean(s?.carto_api_key?.trim())} />
                </h3>
                <p className="settings-hint">
                  Ohne Key zeigt die Karte „API key required“. Kostenlos unter carto.com/basemaps/apikey — dann hier
                  einfügen. Der Key hängt an jeder Kachel.
                </p>
                <label className="settings-field">
                  <span>API-Key</span>
                  <SecretField
                    key={`carto-key-${s?.carto_api_key ? 'set' : 'empty'}`}
                    defaultValue={s?.carto_api_key || ''}
                    disabled={busy}
                    placeholder="Carto Basemap-Key"
                    onBlur={(e) => void p.patchSetting({ carto_api_key: e.target.value.trim() })}
                  />
                </label>
              </section>
            </>
          ) : null}

          {tab === 'stimme' ? (
            <section className="settings-card">
              <h3>Hören & sprechen</h3>
              <p className="settings-hint">
                Auto: Microsoft Edge Neural (Conrad/Katja, frei, kein Extra-Key) rennt gegen Gemini Algieba. Wer zuerst
                fertig ist, bleibt die ganze Antwort — kein Mix. Groq-TTS spricht kein Deutsch, Groq bleibt Hirn-Backup.
                System-TTS nur wenn beide Neural-Wege fehlen. Navi-Ansagen bleiben Native. Kein ElevenLabs, kein Stimmklon.
              </p>
              <label className="settings-field">
                <span>Stimme</span>
                <select
                  value={s?.voice_tts || 'auto'}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ voice_tts: e.target.value })}
                >
                  <option value="auto">Auto (Edge Neural + Gemini)</option>
                  <option value="gemini">Gemini — Netz</option>
                  <option value="system">System — offline</option>
                </select>
              </label>
              <label className="settings-field">
                <span>Jarvis-Stimme</span>
                <select
                  value={s?.gemini_tts_voice || s?.tts_voice_jarvis || 'Algieba'}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ gemini_tts_voice: e.target.value, tts_voice_jarvis: e.target.value })}
                >
                  {TTS_VOICES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="settings-field">
                <span>Friday-Stimme</span>
                <select
                  value={s?.tts_voice_friday || 'Kore'}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ tts_voice_friday: e.target.value })}
                >
                  {TTS_VOICES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <div className="settings-actions">
                <button type="button" className="retry-btn" onClick={p.onOpenVoice}>
                  Jetzt hören
                </button>
                <button type="button" className="retry-btn" onClick={p.onPinShortcut}>
                  Shortcut
                </button>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(s?.wake_word)}
                  disabled={busy}
                  onChange={(e) => p.onWakeWord(e.target.checked)}
                />
                <span>Auf „Jarvis“ oder „Friday“ hören</span>
              </label>
              <p className="settings-hint">
                Sagen Sie laut „Jarvis“. Es muss eine Meldung „Jarvis hört auf den Namen“ oben
                stehen. Bildschirm aus und andere Apps: nur der Name. Beenden: Schalter oder die
                Meldung. Akku: nicht optimieren.
              </p>
              <label className="settings-field">
                <span>Am Steuer stören</span>
                <select
                  value={s?.drive_interrupt || 'hud'}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ drive_interrupt: e.target.value })}
                >
                  <option value="hud">HUD und Notify — kein Fake-Anruf</option>
                  <option value="call">Anruf auf zweite Nummer</option>
                </select>
              </label>
              <label className="settings-field">
                <span>Dieses Handy (nicht anrufen)</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  spellCheck={false}
                  key={`own-tel-${s?.own_tel ? 'set' : 'empty'}`}
                  defaultValue={s?.own_tel || ''}
                  disabled={busy}
                  placeholder="eigene Nummer"
                  onBlur={(e) => void p.patchSetting({ own_tel: e.target.value.trim() })}
                />
              </label>
              <label className="settings-field">
                <span>Zweites Handy (optional)</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  spellCheck={false}
                  key={`second-tel-${s?.drive_second_tel ? 'set' : 'empty'}`}
                  defaultValue={s?.drive_second_tel || ''}
                  disabled={busy}
                  placeholder="anderes Gerät, nicht dieses"
                  onBlur={(e) => void p.patchSetting({ drive_second_tel: e.target.value.trim() })}
                />
              </label>
              <p className="settings-hint">
                Jarvis ruft sich nicht selbst an. Zweite Nummer nur wenn sie sich von diesem Handy unterscheidet.
              </p>
              {p.shortcutMsg ? <p className="settings-hint">{p.shortcutMsg}</p> : null}
              <label className="settings-field">
                <span>Gesicht</span>
                <select
                  value={s?.face || 'jarvis'}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ face: e.target.value })}
                >
                  <option value="jarvis">Jarvis — männlich, Default</option>
                  <option value="friday">Friday — weiblich, auf Zuruf</option>
                </select>
              </label>
              <p className="settings-hint">
                Ein Hirn, zwei Gesichter. Friday übernimmt nur nach Name oder diesem Schalter. Wake „Friday“, nicht
                „Freitag“. Native-Fallback: eine de-DE-Stimme, wenn das Gerät kein Gender hat.
              </p>
              <label className="settings-field">
                <span>Am Steuer vorlesen</span>
                <select
                  value={s?.drive_speak || 'after'}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ drive_speak: e.target.value as 'after' | 'only' })}
                >
                  <option value="after">Erst ausführen, dann kurz vorlesen</option>
                  <option value="only">Nur vorlesen, kein Extra-Essay</option>
                </select>
              </label>
              <p className="settings-hint">
                Blitzer und Abbieger: ein Satz Native. Gespräch am Steuer: Edge Neural zuerst, nicht Pico.
              </p>
            </section>
          ) : null}

          {tab === 'alltag' ? (
            <section className="settings-card">
              <h3>Wecker, Timer, Erinnerungen</h3>
              <p className="settings-hint">
                Klingelt bei Bildschirm aus. Ton über die Wecker-Lautstärke des Handys, nicht über Medien.
                OnePlus: Akku nicht optimieren.
              </p>
              {p.reminders.length === 0 ? (
                <p className="memory-empty">Nichts offen.</p>
              ) : (
                <ul className="memory-list">
                  {p.reminders.map((r) => (
                    <li key={r.id} className="memory-item">
                      <div className="memory-value">
                        {r.kind === 'timer'
                          ? !r.title || /^timer$/i.test(r.title)
                            ? 'Timer'
                            : r.title
                          : `${
                              r.kind === 'alarm'
                                ? r.recur
                                  ? 'Wecker täglich · '
                                  : 'Wecker · '
                                : r.recur === 'daily'
                                  ? 'täglich · '
                                  : r.recur === 'weekly'
                                    ? 'wöchentlich · '
                                    : ''
                            }${r.title}`}
                      </div>
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
                        disabled={p.remindBusy}
                        onClick={() => p.onDeleteReminder(r.id)}
                      >
                        Löschen
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="settings-actions">
                <button type="button" className="retry-btn" disabled={busy} onClick={p.onPickTone}>
                  Wecker-Ton wählen
                </button>
              </div>
              <p className="settings-hint">Aktuell: {s?.alarm_tone_name || 'Standard-Wecker'}</p>
            </section>
          ) : null}

          {tab === 'alltag' ? (
            <section className="settings-card">
              <h3>Ort & Wetter</h3>
              <p className="settings-hint">
                {s?.last_place
                  ? `Letzter Ort: ${s.last_place}`
                  : 'Noch kein Standort. Im Chat „Wo bin ich gerade?“ oder „Wetter heute“ sagen.'}
              </p>
              <p className="settings-hint">
                {s?.home_lat && s?.home_lon
                  ? `Zuhause: ${Number(s.home_lat).toFixed(4)}, ${Number(s.home_lon).toFixed(4)}`
                  : 'Zuhause: noch nicht gesetzt. Im Chat „Ich wohne in …“ sagen.'}
              </p>
              <label className="settings-field">
                <span>Zuhause-Radius (m)</span>
                <input
                  type="number"
                  min={50}
                  max={2000}
                  key={`home-r-${s?.home_radius_m || '250'}`}
                  defaultValue={s?.home_radius_m || '250'}
                  disabled={busy}
                  onBlur={(e) => {
                    const n = Math.max(50, Math.min(2000, Number(e.target.value) || 250))
                    void p.patchSetting({ home_radius_m: String(n) })
                  }}
                />
              </label>
              <p className="settings-hint">
                „Wenn ich zuhause bin …“ braucht gespeichertes Zuhause. Handy muss an sein.
              </p>
              <label className="settings-field">
                <span>Taxi</span>
                <select
                  value={s?.taxi_app || 'call'}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ taxi_app: e.target.value })}
                >
                  <option value="call">Anruf Kontakt Taxi</option>
                  <option value="uber">Uber öffnen</option>
                  <option value="freenow">FreeNow öffnen</option>
                  <option value="ask">Jedes Mal fragen</option>
                </select>
              </label>
              <p className="settings-hint">
                Jarvis bestellt und bezahlt nicht. Default ist Anruf. Deep-Link nur öffnen.
              </p>
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || locBusy}
                  onClick={() => {
                    setLocBusy(true)
                    setLocMsg(null)
                    void ensureDeviceLocation({ openSettingsIfDenied: true })
                      .then((res) => {
                        if (res.ok) {
                          void p.patchSetting({
                            last_lat: String(res.lat),
                            last_lon: String(res.lon),
                            last_fix_at: new Date().toISOString(),
                          })
                          setLocMsg('Standort liegt.')
                          return
                        }
                        setLocMsg(res.message || 'Standort weiter aus.')
                      })
                      .finally(() => setLocBusy(false))
                  }}
                >
                  Standort erlauben
                </button>
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy}
                  onClick={() =>
                    void p.patchSetting({ last_lat: '', last_lon: '', last_place: '', last_fix_at: '' })
                  }
                >
                  Ort vergessen
                </button>
              </div>
              {locMsg ? <p className="settings-hint">{locMsg}</p> : null}
              <p className="settings-hint">
                Jarvis öffnet die Android-Abfrage oder die App-Einstellungen. Den Schalter legt er nicht selbst um.
              </p>
            </section>
          ) : null}

          {tab === 'geraete' ? (
            <>
            <section className="settings-card">
              <h3>Samsung Tizen</h3>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(s?.tv_enabled)}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ tv_enabled: e.target.checked })}
                />
                <span>TV-Steuerung an</span>
              </label>
              <p className="settings-hint">
                {s?.tv_paired
                  ? `Gekoppelt: ${s.tv_name || s.tv_host || 'TV'}`
                  : 'Suchen, am TV erlauben, dann testen. Gleiches WLAN, kein Gastnetz.'}{' '}
                Apps: „Öffne Netflix“, „Spiel YouTube“, „Spiel Dune Film“ (kostenlos zuerst).
              </p>
              <label className="settings-field">
                <span>Name</span>
                <input
                  key={`tv-name-${s?.tv_name || ''}`}
                  defaultValue={s?.tv_name || ''}
                  disabled={busy}
                  onBlur={(e) => void p.patchSetting({ tv_name: e.target.value })}
                />
              </label>
              <label className="settings-field">
                <span>Host</span>
                <input
                  key={`tv-host-${s?.tv_host || ''}`}
                  defaultValue={s?.tv_host || ''}
                  disabled={busy}
                  placeholder="192.168.1.20"
                  onBlur={(e) => void p.patchSetting({ tv_host: e.target.value })}
                />
              </label>
              <label className="settings-field">
                <span>MAC</span>
                <input
                  key={`tv-mac-${s?.tv_mac || ''}`}
                  defaultValue={s?.tv_mac || ''}
                  disabled={busy}
                  placeholder="aa:bb:cc:dd:ee:ff"
                  onBlur={(e) => void p.patchSetting({ tv_mac: e.target.value })}
                />
              </label>
              <label className="settings-field">
                <span>Port</span>
                <input
                  key={`tv-port-${s?.tv_port || 8002}`}
                  defaultValue={String(s?.tv_port || 8002)}
                  disabled={busy}
                  onBlur={(e) => {
                    const n = Number(e.target.value)
                    if (Number.isFinite(n)) void p.patchSetting({ tv_port: n })
                  }}
                />
              </label>
              <div className="settings-actions">
                <button type="button" className="retry-btn" disabled={p.tvBusy} onClick={p.onTvDiscover}>
                  Suchen
                </button>
                <button type="button" className="retry-btn" disabled={p.tvBusy} onClick={p.onTvPair}>
                  Koppeln
                </button>
                <button type="button" className="retry-btn" disabled={p.tvBusy} onClick={p.onTvTest}>
                  Testen
                </button>
              </div>
              {p.tvFound.length ? (
                <ul className="tv-found">
                  {p.tvFound.map((item) => (
                    <li key={`${item.host}-${item.mac || ''}`}>
                      <button type="button" disabled={p.tvBusy} onClick={() => p.onTvPick(item)}>
                        {item.kind === 'fire' ? 'Fire TV' : item.name || 'Samsung TV'} · {item.host}
                        {item.mac ? ` · ${item.mac}` : item.kind === 'fire' ? ' · ADB' : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {p.tvMsg ? (
                <p className={`tv-test-msg${p.tvMsgOk === false ? ' warn' : ''}`}>{p.tvMsg}</p>
              ) : null}
            </section>
            <section className="settings-card">
              <h3>Fire TV auf HDMI</h3>
              <p className="settings-hint">
                Der Erlauben-Dialog am Fire TV kommt nur, wenn ADB per WLAN (Port 5555) wirklich offen ist.
                2. Generation (Box, nicht Stick): oft nur USB hinten — dann erscheint nichts. IP unter Info →
                Netzwerk. Entwickleroptionen: ADB-Debugging, falls vorhanden „ADB über Netzwerk“. Ohne WLAN-ADB
                schaltet Jarvis weiter HDMI am Samsung (Standard 3) und Lautstärke.
              </p>
              <label className="settings-field">
                <span>HDMI des Sticks</span>
                <select
                  value={String(s?.tv_fire_hdmi || 3)}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ tv_fire_hdmi: Number(e.target.value) })}
                >
                  <option value="1">HDMI 1</option>
                  <option value="2">HDMI 2</option>
                  <option value="3">HDMI 3</option>
                  <option value="4">HDMI 4</option>
                </select>
              </label>
              <label className="settings-field">
                <span>Fire-TV-IP</span>
                <input
                  value={fireHost}
                  disabled={busy}
                  placeholder="192.168.1.30"
                  id="tv-fire-ip"
                  inputMode="decimal"
                  autoComplete="off"
                  onChange={(e) => setFireHost(e.target.value)}
                  onBlur={() => {
                    const v = fireHost.trim()
                    setFireHost(v)
                    void p.patchSetting({ tv_fire_host: v })
                  }}
                />
              </label>
              <label className="settings-field">
                <span>ADB-Port</span>
                <input
                  value={firePort}
                  disabled={busy}
                  id="tv-fire-port"
                  inputMode="numeric"
                  autoComplete="off"
                  onChange={(e) => setFirePort(e.target.value)}
                  onBlur={() => {
                    const n = Number(firePort)
                    if (Number.isFinite(n) && n > 0) void p.patchSetting({ tv_fire_port: n })
                  }}
                />
              </label>
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={p.tvBusy}
                  onClick={() => {
                    const n = Number(firePort)
                    p.onTvFireTest(fireHost.trim(), Number.isFinite(n) && n > 0 ? n : 5555)
                  }}
                >
                  {p.tvBusy ? 'Prüfe…' : 'Fire TV testen'}
                </button>
              </div>
              {p.tvMsg ? (
                <p className={`tv-test-msg${p.tvMsgOk === false ? ' warn' : ''}`}>{p.tvMsg}</p>
              ) : null}
            </section>
            </>
          ) : null}

          {tab === 'geraete' ? (
            <section className="settings-card">
              <h3>PC im WLAN</h3>
              <p className="settings-lead">
                Auf dem Windows-Rechner <code>desktop/JarvisPC.bat</code> doppelklicken. Das graue Fenster offen
                lassen. IP mit <strong>192.168</strong> oder <strong>10.</strong> — nicht 172 (WSL). Schalter an, dann
                PC testen.
              </p>
              <p className="settings-hint">
                Gleiches WLAN, kein Gäste-Netz, kein VPN. IP ohne http:// und ohne Port. Firewall im PC-Fenster
                erlauben. Ohne laufende App: nichts behaupten. Löschen nur nach Ja. „PC live“ zeigt
                LAN-Einzelbilder — WebRTC nur wenn ein Peer steht.
              </p>
              <label className="settings-toggle">
                <span>PC-Steuerung an</span>
                <input
                  type="checkbox"
                  checked={Boolean(s?.pc_enabled)}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ pc_enabled: e.target.checked })}
                />
              </label>
              <label className="settings-field">
                <span>PC-IP</span>
                <input
                  value={pcHost}
                  disabled={busy || pcBusy}
                  placeholder="192.168.1.20"
                  inputMode="decimal"
                  autoComplete="off"
                  onChange={(e) => setPcHost(e.target.value)}
                  onBlur={() => {
                    const v = sanitizePcHost(pcHost)
                    setPcHost(v)
                    void p.patchSetting({ pc_host: v })
                    if (v && !isAllowedPcHost(v)) {
                      setPcMsgOk(false)
                      setPcMsg(PC_HOST_HINT)
                    }
                  }}
                />
              </label>
              <label className="settings-field">
                <span>Port</span>
                <input
                  value={pcPort}
                  disabled={busy || pcBusy}
                  inputMode="numeric"
                  onChange={(e) => setPcPort(e.target.value)}
                  onBlur={() => {
                    const n = Number.parseInt(pcPort, 10)
                    const port = Number.isFinite(n) && n > 0 ? n : 18790
                    setPcPort(String(port))
                    void p.patchSetting({ pc_port: port })
                  }}
                />
              </label>
              <label className="settings-field">
                <span>Token</span>
                <SecretField
                  value={pcToken}
                  disabled={busy || pcBusy}
                  placeholder="aus dem PC-Fenster"
                  onChange={(e) => setPcToken(e.target.value)}
                  onBlur={() => {
                    const v = pcToken.trim()
                    setPcToken(v)
                    void p.patchSetting({ pc_token: v })
                  }}
                />
              </label>
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || pcBusy}
                  onClick={() => {
                    const host = sanitizePcHost(pcHost)
                    setPcHost(host)
                    if (host && !isAllowedPcHost(host)) {
                      setPcMsgOk(false)
                      setPcMsg(PC_HOST_HINT)
                      return
                    }
                    setPcBusy(true)
                    setPcMsg('Prüfe PC…')
                    void p.patchSetting({
                      pc_host: host,
                      pc_token: pcToken.trim(),
                      pc_port: Number.parseInt(pcPort, 10) || 18790,
                      pc_enabled: true,
                    }).then(() =>
                      testPc().then((r) => {
                        setPcMsgOk(r.ok)
                        setPcMsg(r.reply)
                        setPcBusy(false)
                      }),
                    )
                  }}
                >
                  {pcBusy ? 'Prüfe…' : 'PC testen'}
                </button>
              </div>
              {pcMsg ? <p className={`tv-test-msg${pcMsgOk === false ? ' warn' : ''}`}>{pcMsg}</p> : null}
              <h3 className="copy-block-title">Ein Klick kopieren</h3>
              <CopyField label="PC-IP" value={pcHost.trim()} />
              <CopyField label="Port" value={pcPort.trim() || '18790'} />
              <CopyField label="Token" value={pcToken.trim()} />
            </section>
          ) : null}

          {tab === 'geraete' ? (
            <section className="settings-card">
              <h3>WLAN-Steckdosen</h3>
              <p className="settings-lead">
                Lokal im Hausnetz. IP wie 192.168.178.40 — nicht die Internet-Adresse 89.… Shelly und Tasmota
                brauchen nur die IP. Smart Life / Tuya: Device-ID und Local Key, dann LAN — keine Tuya-Cloud in
                Jarvis. Tapo (TP-Link) noch nicht.
              </p>
              <label className="settings-toggle">
                <span>Steckdosen an</span>
                <input
                  type="checkbox"
                  checked={s?.plugs_enabled !== false}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ plugs_enabled: e.target.checked })}
                />
              </label>
              <label className="settings-toggle">
                <span>Watchdog Haus</span>
                <input
                  type="checkbox"
                  checked={Boolean(s?.watchdog)}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ watchdog: e.target.checked })}
                />
              </label>
              <p className="settings-hint">
                Aus = Ruhe. An = nur Haus-Signale (Steckdose tot, Termin-Kollision). Timer klingeln schon. Kein Fake-Anruf, kein Firmen-Finden.
              </p>
              {(loadPlugs().length ? loadPlugs() : []).map((plug) => (
                <div key={plug.id} className="settings-hint" style={{ marginTop: 8 }}>
                  <strong>{plug.name}</strong> · {plug.kind} · {plug.host || 'ohne IP'}
                  <div className="settings-actions">
                    <button
                      type="button"
                      className="retry-btn"
                      disabled={busy || plugBusy}
                      onClick={() => setPlugDraft({ ...plug })}
                    >
                      Bearbeiten
                    </button>
                    <button
                      type="button"
                      className="retry-btn"
                      disabled={busy || plugBusy}
                      onClick={() => {
                        const list = removePlug(plug.id)
                        void p.patchSetting({ plugs_json: JSON.stringify(list) })
                        setPlugMsg('Entfernt.')
                        setPlugMsgOk(true)
                      }}
                    >
                      Weg
                    </button>
                  </div>
                </div>
              ))}
              <label className="settings-field">
                <span>Name (z. B. Schreibtisch)</span>
                <input
                  value={plugDraft.name}
                  disabled={busy || plugBusy}
                  placeholder="Schreibtisch"
                  autoComplete="off"
                  onChange={(e) => setPlugDraft({ ...plugDraft, name: e.target.value })}
                />
              </label>
              <label className="settings-field">
                <span>Typ</span>
                <select
                  value={plugDraft.kind}
                  disabled={busy || plugBusy}
                  onChange={(e) => setPlugDraft({ ...plugDraft, kind: e.target.value as Plug['kind'] })}
                >
                  <option value="auto">Auto (Shelly/Tasmota/Tuya)</option>
                  <option value="shelly">Shelly</option>
                  <option value="tasmota">Tasmota</option>
                  <option value="tuya">Tuya / Smart Life (LAN)</option>
                  <option value="broadlink">Broadlink-Steckdose</option>
                  <option value="http">HTTP (eigene URL)</option>
                </select>
              </label>
              <label className="settings-field">
                <span>IP im WLAN</span>
                <input
                  value={plugDraft.host}
                  disabled={busy || plugBusy}
                  placeholder="192.168.178.40"
                  inputMode="decimal"
                  autoComplete="off"
                  onChange={(e) => setPlugDraft({ ...plugDraft, host: e.target.value })}
                />
              </label>
              {plugDraft.kind === 'tuya' || plugDraft.kind === 'auto' ? (
                <>
                  <label className="settings-field">
                    <span>Tuya Device-ID</span>
                    <input
                      value={plugDraft.deviceId || ''}
                      disabled={busy || plugBusy}
                      autoComplete="off"
                      autoCapitalize="none"
                      onChange={(e) => setPlugDraft({ ...plugDraft, deviceId: e.target.value.trim() })}
                    />
                  </label>
                  <label className="settings-field">
                    <span>Tuya Local Key (16 Zeichen)</span>
                    <input
                      value={plugDraft.localKey || ''}
                      disabled={busy || plugBusy}
                      autoComplete="off"
                      autoCapitalize="none"
                      onChange={(e) => setPlugDraft({ ...plugDraft, localKey: e.target.value.trim() })}
                    />
                  </label>
                </>
              ) : null}
              {plugDraft.kind === 'http' ? (
                <>
                  <label className="settings-field">
                    <span>URL An</span>
                    <input
                      value={plugDraft.onUrl || ''}
                      disabled={busy || plugBusy}
                      placeholder="http://192.168.1.50/on"
                      autoComplete="off"
                      onChange={(e) => setPlugDraft({ ...plugDraft, onUrl: e.target.value.trim() })}
                    />
                  </label>
                  <label className="settings-field">
                    <span>URL Aus</span>
                    <input
                      value={plugDraft.offUrl || ''}
                      disabled={busy || plugBusy}
                      placeholder="http://192.168.1.50/off"
                      autoComplete="off"
                      onChange={(e) => setPlugDraft({ ...plugDraft, offUrl: e.target.value.trim() })}
                    />
                  </label>
                </>
              ) : null}
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || plugBusy}
                  onClick={() => {
                    setPlugBusy(true)
                    setPlugMsg('Suche Steckdosen…')
                    void plugDiscover()
                      .then((r) => {
                        setPlugFound(r.items || [])
                        setPlugMsgOk((r.items || []).length > 0)
                        setPlugMsg(r.message || ((r.items || []).length ? 'Gefunden.' : 'Nichts gefunden.'))
                      })
                      .finally(() => setPlugBusy(false))
                  }}
                >
                  Suchen
                </button>
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || plugBusy}
                  onClick={() => {
                    setPlugBusy(true)
                    setPlugMsg('Prüfe…')
                    void plugProbe(plugDraft).then((r) => {
                      setPlugMsgOk(r.ok)
                      setPlugMsg(r.reply)
                      if (r.ok && r.kind) setPlugDraft({ ...plugDraft, kind: r.kind as Plug['kind'] })
                      setPlugBusy(false)
                    })
                  }}
                >
                  {plugBusy ? 'Prüfe…' : 'Prüfen'}
                </button>
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || plugBusy}
                  onClick={() => {
                    setPlugBusy(true)
                    void plugTest(plugDraft, true).then((r) => {
                      setPlugMsgOk(r.ok)
                      setPlugMsg(r.reply)
                      setPlugBusy(false)
                    })
                  }}
                >
                  Test An
                </button>
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || plugBusy}
                  onClick={() => {
                    setPlugBusy(true)
                    void plugTest(plugDraft, false).then((r) => {
                      setPlugMsgOk(r.ok)
                      setPlugMsg(r.reply)
                      setPlugBusy(false)
                    })
                  }}
                >
                  Test Aus
                </button>
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || plugBusy || !plugDraft.name.trim()}
                  onClick={() => {
                    const saved = upsertPlug({
                      ...plugDraft,
                      name: plugDraft.name.trim() || 'Steckdose',
                      host: plugDraft.host.trim(),
                    })
                    void p.patchSetting({ plugs_json: JSON.stringify(saved), plugs_enabled: true })
                    setPlugMsg(`Gespeichert: ${plugDraft.name.trim()}.`)
                    setPlugMsgOk(true)
                    setPlugDraft(emptyPlug())
                  }}
                >
                  Speichern
                </button>
              </div>
              {plugFound.length ? (
                <ul className="tv-found">
                  {plugFound.map((item) => (
                    <li key={`${item.kind || 'x'}-${item.host || 'h'}-${item.deviceId || ''}`}>
                      <button
                        type="button"
                        disabled={plugBusy}
                        onClick={() => {
                          setPlugDraft({
                            ...plugDraft,
                            host: item.host || '',
                            mac: item.mac || plugDraft.mac,
                            name: plugDraft.name || item.name || 'Steckdose',
                            kind: (item.kind as Plug['kind']) || plugDraft.kind,
                            deviceId: item.deviceId || plugDraft.deviceId,
                          })
                          setPlugMsg(`Übernommen: ${item.host}. Name vergeben und speichern.`)
                          setPlugMsgOk(true)
                        }}
                      >
                        {item.name || item.kind || 'Gerät'} · {item.host}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {plugMsg ? <p className={`tv-test-msg${plugMsgOk === false ? ' warn' : ''}`}>{plugMsg}</p> : null}
              <p className="settings-hint">
                Chat: „Steckdose an“, „Schreibtisch aus“, „alle Steckdosen aus“. Handy und Stecker im selben WLAN,
                nicht Gastnetz. Die IP holst Du im Router unter Heimnetz/Geräte (192.168.…), nicht „meine IP“ aus
                dem Internet.
              </p>
            </section>
          ) : null}

          {tab === 'geraete' ? (
            <section className="settings-card">
              <h3>Deckenventilator</h3>
              <p className="settings-lead">
                Über eine Broadlink-Brücke (RM4 Pro) im WLAN. Original-Fernbedienung lernen. Kein Amazon-Konto.
              </p>
              <p className="settings-hint">
                Der Ventilator selbst spricht oft nur Funk. Jarvis sendet die gelernten Tasten lokal. Ohne Brücke
                keine Stufen.
              </p>
              <label className="settings-toggle">
                <span>Ventilator an</span>
                <input
                  type="checkbox"
                  checked={Boolean(s?.fan_enabled)}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ fan_enabled: e.target.checked })}
                />
              </label>
              <label className="settings-field">
                <span>Brücken-IP</span>
                <input
                  value={fanHost}
                  disabled={busy || fanBusy}
                  placeholder="192.168.1.40"
                  inputMode="decimal"
                  autoComplete="off"
                  onChange={(e) => setFanHost(e.target.value)}
                  onBlur={() => {
                    const v = fanHost.trim()
                    setFanHost(v)
                    void p.patchSetting({ fan_host: v })
                  }}
                />
              </label>
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || fanBusy}
                  onClick={() => {
                    setFanBusy(true)
                    setFanMsg('Suche Brücke…')
                    void fanDiscover()
                      .then((r) => {
                        setFanFound(r.items || [])
                        setFanMsgOk((r.items || []).length > 0)
                        setFanMsg(r.message || ((r.items || []).length ? 'Gefunden.' : 'Nichts gefunden.'))
                      })
                      .finally(() => setFanBusy(false))
                  }}
                >
                  Suchen
                </button>
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || fanBusy}
                  onClick={() => {
                    setFanBusy(true)
                    setFanMsg('Teste Brücke…')
                    void p.patchSetting({ fan_host: fanHost.trim() }).then(() =>
                      fanTest({ host: fanHost.trim() }).then((r) => {
                        setFanMsgOk(r.ok)
                        setFanMsg(r.reply)
                        setFanBusy(false)
                      }),
                    )
                  }}
                >
                  {fanBusy ? 'Prüfe…' : 'Testen'}
                </button>
              </div>
              {fanFound.length ? (
                <ul className="tv-found">
                  {fanFound.map((item) => (
                    <li key={item.host || 'x'}>
                      <button
                        type="button"
                        disabled={fanBusy}
                        onClick={() => {
                          void fanPick(item).then((msg) => {
                            setFanHost(item.host || '')
                            setFanMsg(msg)
                            setFanMsgOk(true)
                            void p.patchSetting({ fan_host: item.host || '', fan_mac: item.mac || '' })
                          })
                        }}
                      >
                        {item.name || 'Broadlink'} · {item.host}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="settings-hint">Lernen: Taste an der Fernbedienung, wenn die Brücke blinkt.</p>
              <div className="settings-actions">
                {(
                  [
                    ['on', 'An'],
                    ['off', 'Aus'],
                    ['speed1', 'Stufe 1'],
                    ['speed2', 'Stufe 2'],
                    ['speed3', 'Stufe 3'],
                    ['light', 'Licht'],
                  ] as const
                ).map(([slot, label]) => (
                  <button
                    key={slot}
                    type="button"
                    className="retry-btn"
                    disabled={busy || fanBusy}
                    onClick={() => {
                      setFanBusy(true)
                      setFanMsg(`Lerne ${label}… Fernbedienung drücken.`)
                      void fanLearn(slot).then((r) => {
                        setFanMsgOk(r.ok)
                        setFanMsg(r.reply)
                        setFanBusy(false)
                      })
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {fanMsg ? <p className={`tv-test-msg${fanMsgOk === false ? ' warn' : ''}`}>{fanMsg}</p> : null}
            </section>
          ) : null}

          {tab === 'geraete' ? (
            <section className="settings-card">
              <h3>Spotify im Fahrmodus</h3>
              <p className="settings-lead">
                Interner Player in Jarvis (Web Playback). Client-ID liegt unter API-Keys.
              </p>
              <p className="settings-hint">
                developer.spotify.com → App anlegen → Redirect URI exakt:{' '}
                <code>{typeof window !== 'undefined' ? spotifyRedirect() : 'https://localhost/'}</code>
                . In der APK ist das <code>https://localhost/</code>.
              </p>
              <p className="settings-hint">
                {spotifyLoggedIn(s || undefined)
                  ? 'Angemeldet. Im Fahrmodus spielt Jarvis selbst (Premium). „Spiel …“, Pause, weiter.'
                  : 'Anmelden. Premium = volle Titel in Jarvis. Ohne Premium nur 30s-Vorschau.'}
              </p>
              <div className="settings-actions">
                <button type="button" className="ghost-btn" onClick={() => p.onTopic('keys')}>
                  Zur Client-ID
                </button>
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || !s?.spotify_client_id?.trim()}
                  onClick={() => {
                    void startSpotifyLogin().then((r) => {
                      if (!r.ok) setSpotifyMsg(r.message)
                    })
                  }}
                >
                  Anmelden
                </button>
                <button
                  type="button"
                  className="retry-btn"
                  disabled={!spotifyLoggedIn(s || undefined)}
                  onClick={() => {
                    spotifyLogout()
                    setSpotifyMsg('Abgemeldet.')
                  }}
                >
                  Abmelden
                </button>
              </div>
              {spotifyMsg ? <p className="settings-hint">{spotifyMsg}</p> : null}
            </section>
          ) : null}

          {tab === 'lage' ? (
            <>
              <section className="settings-card">
                <h3>UI-Sounds</h3>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(s?.ui_sounds)}
                    disabled={busy}
                    onChange={(e) => void p.patchSetting({ ui_sounds: e.target.checked })}
                  />
                  <span>Kurzer Ton beim Senden</span>
                </label>
                <label className="settings-field">
                  <span>Lautstärke</span>
                  <select
                    value={s?.ui_sound_volume || 'low'}
                    disabled={busy || !s?.ui_sounds}
                    onChange={(e) => void p.patchSetting({ ui_sound_volume: e.target.value })}
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                </label>
              </section>
              <section className="settings-card">
                <h3>Delight</h3>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(s?.delight_moments)}
                    disabled={busy}
                    onChange={(e) => void p.patchSetting({ delight_moments: e.target.checked })}
                  />
                  <span>Jarvis-Momente</span>
                </label>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(s?.delight_jokes)}
                    disabled={busy}
                    onChange={(e) => void p.patchSetting({ delight_jokes: e.target.checked })}
                  />
                  <span>Inside Jokes</span>
                </label>
                <label className="settings-field">
                  <span>Witz-Frequenz</span>
                  <select
                    value={s?.delight_joke_frequency || 'selten'}
                    disabled={busy}
                    onChange={(e) => void p.patchSetting({ delight_joke_frequency: e.target.value })}
                  >
                    <option value="selten">Selten</option>
                    <option value="normal">Normal</option>
                  </select>
                </label>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={s?.easter_eggs_enabled !== false}
                    disabled={busy}
                    onChange={(e) => void p.patchSetting({ easter_eggs_enabled: e.target.checked })}
                  />
                  <span>Easter Eggs</span>
                </label>
                <ul className="egg-list">
                  {(s?.easter_eggs || []).map((egg) => (
                    <li key={egg.command}>
                      <code>{egg.command}</code>
                      <span>{egg.description}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}

          {tab === 'hirn' ? (
            <section className="settings-card">
              <h3>Internet-Research</h3>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(s?.research_opt_in)}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ research_opt_in: e.target.checked })}
                />
                <span>Websuche (braucht Gemini)</span>
              </label>
              <p className="settings-hint">
                Mit Gemini sucht Jarvis von selbst nach aktuellen Zahlen, auch ohne das Wort suche. Fehlt eine
                Antwort, geht er nochmal ins Netz. Aus zählt vor allem ohne Gemini.
              </p>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(s?.shop_discount)}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ shop_discount: e.target.checked })}
                />
                <span>Rabatt-Suche beim Online-Shopping</span>
              </label>
              <p className="settings-hint">
                An = extra Gutscheine (mydealz, Sparwelt) bei Produktsuche. Research muss an sein.
                Keine erfundenen Codes. Stimme: „Rabatt-Suche an“.
              </p>
              <button type="button" className={`audit-toggle ${p.auditOpen ? 'active' : ''}`} onClick={p.onToggleAudit}>
                Research-Audit
              </button>
              {p.auditOpen ? (
                <div className="audit-panel">
                  {p.audits.length === 0 ? (
                    <p className="memory-empty">Noch keine Research-Turns.</p>
                  ) : (
                    <ul className="audit-list">
                      {p.audits.map((a) => (
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
          ) : null}

          {tab === 'alltag' ? (
            <section className="settings-card">
              <h3>Weltlage</h3>
              <p className="settings-hint">
                Ausblick aus öffentlichen Meldungen und Serien. Kein Insider, kein Orakel, kein Kauf-Rat. Ohne
                FRED-Key keine Rohöl-Zahl — Jarvis erfindet keine.
              </p>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(s?.outlook_watch)}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ outlook_watch: e.target.checked })}
                />
                <span>Watch (holen, wenn die App offen ist)</span>
              </label>
              <p className="settings-hint">
                Zielintervall 20 Minuten. Android Doze hält das oft nicht genauer. Aus = kein stilles Netz im
                Hintergrund.
              </p>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(s?.outlook_interrupt)}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ outlook_interrupt: e.target.checked })}
                />
                <span>Unterbrechen bei neuer Lage</span>
              </label>
              <p className="settings-hint">Nur wenn Watch an. Nur bei neuer Meldung gegenüber dem letzten Stand.</p>
              <p className="settings-hint">Rohöl-Zahl braucht den FRED-Key unter API-Keys. Ohne Key erfindet Jarvis keinen Preis.</p>
              <div className="settings-actions">
                <button type="button" className="ghost-btn" onClick={() => p.onTopic('keys')}>
                  Zum FRED-Key
                </button>
              </div>
            </section>
          ) : null}

          {tab === 'daten' ? (
            <section className="settings-card">
              <h3>Hausstand</h3>
              <p className="settings-lead">
                Vor dem nächsten Sideload exportieren. Deinstall löscht Keys, Nummern und Erinnerungen. Die Datei
                enthält alle Einstellungen und API-Keys — nicht in den Chat, nicht nach Git, nicht per Mail.
              </p>
              <p className="settings-hint">
                Export schreibt nach <strong>Downloads</strong> als <code>jarvis-haus-JJJJMMTT.json</code>. Nicht nur
                teilen — die Datei muss dort liegen, sonst ist nach Neuinstall nichts da.
              </p>
              <p className="settings-hint">
                {s?.last_backup_at
                  ? `Letzter Export: ${new Date(s.last_backup_at).toLocaleString('de-DE')}`
                  : 'Noch kein Export auf diesem Gerät.'}
              </p>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={backupChats}
                  disabled={busy || backupBusy}
                  onChange={(e) => setBackupChats(e.target.checked)}
                />
                <span>Chats mitexportieren (kann groß werden)</span>
              </label>
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={busy || backupBusy}
                  onClick={() => {
                    setBackupBusy(true)
                    setBackupMsg(null)
                    void shareOrDownloadBackup(backupChats)
                      .then((msg) => setBackupMsg(msg))
                      .catch((err) => setBackupMsg(err instanceof Error ? err.message : 'Export fehlgeschlagen'))
                      .finally(() => setBackupBusy(false))
                  }}
                >
                  Exportieren
                </button>
                <label className="retry-btn" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  Datei wählen
                  <input
                    type="file"
                    accept="application/json,.json"
                    hidden
                    disabled={busy || backupBusy}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (!file) return
                      setBackupBusy(true)
                      setBackupMsg(null)
                      setBackupPreview(null)
                      setBackupPending(null)
                      void file
                        .text()
                        .then((text) => {
                          let parsed: unknown
                          try {
                            parsed = JSON.parse(text)
                          } catch {
                            setBackupMsg('Keine JSON-Datei.')
                            return
                          }
                          const data = asBackup(parsed)
                          const prev = previewBackup(parsed)
                          setBackupPreview(prev)
                          setBackupPending(data)
                          setBackupMsg(prev.message)
                        })
                        .finally(() => setBackupBusy(false))
                    }}
                  />
                </label>
              </div>
              {backupPreview?.ok ? (
                <p className="settings-hint">
                  Vorschau: {backupPreview.keys} Keys, {backupPreview.contacts} Nummern, {backupPreview.reminders}{' '}
                  Erinnerungen, {backupPreview.events} Termine
                  {backupPreview.chats ? `, ${backupPreview.chats} Chats` : ''}.
                </p>
              ) : null}
              <button
                type="button"
                className="retry-btn"
                disabled={busy || backupBusy || !backupPending}
                onClick={() => {
                  if (!backupPending) return
                  setBackupBusy(true)
                  void applyBackup(backupPending)
                    .then((msg) => {
                      setBackupMsg(msg)
                      setBackupPending(null)
                      setBackupPreview(null)
                    })
                    .catch((err) => setBackupMsg(err instanceof Error ? err.message : 'Import fehlgeschlagen'))
                    .finally(() => setBackupBusy(false))
                }}
              >
                Überschreiben ja
              </button>
              <p className="settings-hint">Ohne diesen Knopf ändert Import nichts.</p>
              {backupMsg ? <p className="settings-hint">{backupMsg}</p> : null}
            </section>
          ) : null}

          {tab === 'daten' ? (
            <section className="settings-card">
              <h3>Was Jarvis über Sie weiß</h3>
              <div className="memory-filters" role="tablist" aria-label="Memory-Kategorien">
                {MEM_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    aria-selected={p.memoryFilter === f}
                    className={`memory-filter ${p.memoryFilter === f ? 'active' : ''}`}
                    onClick={() => p.onMemoryFilter(f)}
                  >
                    {memLabel(f)}
                  </button>
                ))}
              </div>
              {p.memoryItems.length === 0 ? (
                <p className="memory-empty">Noch nichts gespeichert.</p>
              ) : (
                <ul className="memory-list">
                  {p.memoryItems.map((m) => {
                    const uncertain = m.confidence < 0.7 || Boolean(m.expires_at)
                    return (
                      <li key={m.id} className="memory-item">
                        <div className="memory-meta">
                          <span className="memory-cat">{m.category}</span>
                          {uncertain ? <span className="memory-uncertain">unsicher</span> : null}
                          <span className="memory-key">{m.key}</span>
                        </div>
                        <div className="memory-value">{m.value}</div>
                        <button
                          type="button"
                          className="memory-del"
                          disabled={p.memoryBusy}
                          onClick={() => p.onDeleteMemory(m.id)}
                          aria-label={`Erinnerung ${m.key} löschen`}
                        >
                          Löschen
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
              {p.memoryItems.length > 0 ? (
                <button type="button" className="memory-clear" disabled={p.memoryBusy} onClick={p.onClearMemory}>
                  Alles löschen
                </button>
              ) : null}
            </section>
          ) : null}

          {tab === 'tests' ? (
            <section className="settings-card">
              <h3>Probe V1–V9</h3>
              <p className="settings-lead">
                Jeder Prompt einzeln kopieren, ins Chatfeld einfügen. PC und TV brauchen das Gerät. V4 braucht eine
                Datei oder ein Foto. V9 Inject darf nicht gehorchen.
              </p>
              {PROBE_COPY_GROUPS.map((g) => (
                <div key={g.title} className="probe-group">
                  <h4 className="copy-block-title">{g.title}</h4>
                  {g.items.map((item) => (
                    <CopyField key={`${g.title}·${item.label}`} label={`${g.title} · ${item.label}`} value={item.text} />
                  ))}
                </div>
              ))}
            </section>
          ) : null}

          {tab === 'tests' ? (
            <DebugPanel
              onSend={p.onDebugSend}
              onStartChat={p.onDebugStart}
              onBegin={p.onDebugBegin}
              busy={p.debugBusy}
            />
          ) : null}

          {tab === 'daten' ? (
            <section className="settings-card danger-zone">
              <h3>Danger Zone</h3>
              <p className="settings-hint">Memory löschen braucht Bestätigung.</p>
              <button type="button" className="memory-clear" disabled={p.memoryBusy} onClick={p.onClearMemory}>
                Alles über mich löschen
              </button>
            </section>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
