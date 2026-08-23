import { useEffect, useState } from 'react'
import type { Health, MemoryCategory, MemoryItem, Reminder, ResearchAudit, Settings } from './api'
import { fanDiscover, fanLearn, fanPick, fanTest, plugDiscover, plugProbe, plugTest, loadPlugs, upsertPlug, removePlug, emptyPlug, testPc } from './api'
import type { Plug } from './api'
import { copyText } from './copy-text'
import { ensureDeviceLocation } from './native/geo'
import {
  spotifyLoggedIn,
  spotifyLogout,
  spotifyRedirect,
  startSpotifyLogin,
} from './engine/spotify'
import { APP_VERSION } from './engine/store'

export type SettingsTopic =
  | 'allgemein'
  | 'modell'
  | 'cloud'
  | 'sprache'
  | 'wecker'
  | 'ort'
  | 'tv'
  | 'pc'
  | 'haus'
  | 'musik'
  | 'ton'
  | 'forschung'
  | 'gedaechtnis'
  | 'gefahr'

const TOPICS: Array<{ id: SettingsTopic; label: string; hint: string }> = [
  { id: 'allgemein', label: 'Allgemein', hint: 'Version' },
  { id: 'modell', label: 'Modell', hint: 'Lokal' },
  { id: 'cloud', label: 'Cloud', hint: 'Gemini' },
  { id: 'sprache', label: 'Sprache', hint: 'Hören' },
  { id: 'wecker', label: 'Wecker', hint: 'Timer' },
  { id: 'ort', label: 'Ort', hint: 'Wetter' },
  { id: 'tv', label: 'Fernseher', hint: 'Tizen + Fire' },
  { id: 'pc', label: 'PC', hint: 'Bildschirm' },
  { id: 'haus', label: 'Haus', hint: 'Steckdose' },
  { id: 'musik', label: 'Musik', hint: 'Spotify' },
  { id: 'ton', label: 'Ton', hint: 'Delight' },
  { id: 'forschung', label: 'Netz', hint: 'Suche' },
  { id: 'gedaechtnis', label: 'Gedächtnis', hint: 'Memory' },
  { id: 'gefahr', label: 'Gefahr', hint: 'Löschen' },
]

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
}

export function SettingsScreen(p: SettingsScreenProps) {
  const s = p.settings
  const busy = p.settingsBusy
  const topic = TOPICS.find((t) => t.id === p.topic) || TOPICS[0]
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

  return (
    <div className="settings-screen" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <aside className="settings-rail" aria-label="Themen">
        <div className="settings-rail-head">
          <span>Themen</span>
        </div>
        <nav className="settings-rail-nav">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`settings-rail-item ${p.topic === t.id ? 'active' : ''}`}
              onClick={() => p.onTopic(t.id)}
            >
              <strong>{t.label}</strong>
              <span>{t.hint}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="settings-pane">
        <header className="settings-pane-bar">
          <div>
            <p className="settings-kicker">Einstellungen</p>
            <h2 id="settings-title">{topic.label}</h2>
          </div>
          <button type="button" className="settings-close" onClick={p.onClose}>
            Fertig
          </button>
        </header>

        <div className="settings-pane-body">
          {p.topic === 'allgemein' ? (
            <section className="settings-card">
              <h3>Dieses Handy</h3>
              <p className="settings-lead">
                Version {s?.version || APP_VERSION} · on-device, kein Server.
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

          {p.topic === 'modell' ? (
            <section className="settings-card">
              <h3>Lokales Modell</h3>
              <p className="settings-lead">
                {s?.model_default || 'Qwen2.5 0.5B'} auf diesem Handy (~470 MB). Kleiner als ChatGPT —
                dafür ohne Cloud.
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

          {p.topic === 'cloud' ? (
            <>
              <section className="settings-card">
                <h3>Gemini (Google)</h3>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(s?.gemini_enabled)}
                    disabled={busy}
                    onChange={(e) => void p.patchSetting({ gemini_enabled: e.target.checked })}
                  />
                  <span>Gemini statt lokalem 0.5B</span>
                </label>
                <p className="settings-hint warn">
                  An = Chat und Fotos gehen zu Google. Nicht privat.
                </p>
                <label className="settings-field">
                  <span>API-Key</span>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
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
                <p className="settings-hint">Key: aistudio.google.com/apikey — nicht teilen.</p>
              </section>
              <section className="settings-card">
                <h3>Groq (optional)</h3>
                <p className="settings-hint">Nur wenn Gemini leer oder überlastet ist. Free-Tier ohne Karte.</p>
                <label className="settings-field">
                  <span>API-Key</span>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
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
                <p className="settings-hint">Key: console.groq.com/keys</p>
              </section>
              <section className="settings-card">
                <h3>Tankerkönig (E10)</h3>
                <p className="settings-hint">
                  Für „fahr mich zu einer Tanke“: nächste und günstigste Station, immer E10. Key kostenlos.
                  Standort geht an Tankerkönig, nicht an uns. Ohne Key keine Preise — Jarvis erfindet keine.
                </p>
                <label className="settings-field">
                  <span>API-Key</span>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    key={`tanker-key-${s?.tankerkoenig_api_key ? 'set' : 'empty'}`}
                    defaultValue={s?.tankerkoenig_api_key || ''}
                    disabled={busy}
                    placeholder="UUID von tankerkoenig.de"
                    onBlur={(e) => void p.patchSetting({ tankerkoenig_api_key: e.target.value.trim() })}
                  />
                </label>
                <p className="settings-hint">creativecommons.tankerkoenig.de — nicht teilen.</p>
              </section>
              <section className="settings-card">
                <h3>OMDb (IMDb + Rotten Tomatoes)</h3>
                <p className="settings-hint">
                  Für Filmnoten. Rotten Tomatoes hat keine öffentliche API — die Prozentzahl kommt nur,
                  wenn OMDb sie mitliefert. Ohne Key keine erfundenen Bewertungen. Wo ein Film gratis
                  läuft, geht auch ohne Key (JustWatch DE).
                </p>
                <label className="settings-field">
                  <span>API-Key</span>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    key={`omdb-key-${s?.omdb_api_key ? 'set' : 'empty'}`}
                    defaultValue={s?.omdb_api_key || ''}
                    disabled={busy}
                    placeholder="Key von omdbapi.com"
                    onBlur={(e) => void p.patchSetting({ omdb_api_key: e.target.value.trim() })}
                  />
                </label>
                <p className="settings-hint">omdbapi.com/apikey.aspx — kostenloser Key, nicht teilen.</p>
              </section>
            </>
          ) : null}

          {p.topic === 'sprache' ? (
            <section className="settings-card">
              <h3>Hören & sprechen</h3>
              <p className="settings-hint">
                Mit Gemini-Key: Antwort sofort (Android). Charon nur wenn er in unter einer halben Sekunde da ist — sonst keine Stille.
              </p>
              <label className="settings-field">
                <span>Stimme</span>
                <select
                  value={s?.voice_tts || 'auto'}
                  disabled={busy}
                  onChange={(e) => void p.patchSetting({ voice_tts: e.target.value })}
                >
                  <option value="auto">Auto (Gemini wenn an)</option>
                  <option value="gemini">Gemini — Netz</option>
                  <option value="system">System — offline</option>
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
                <span>Auf „Jarvis“ hören</span>
              </label>
              <p className="settings-hint">
                Sagen Sie laut „Jarvis“. Es muss eine Meldung „Jarvis hört auf den Namen“ oben
                stehen. Bildschirm aus und andere Apps: nur der Name. Beenden: Schalter oder die
                Meldung. Akku: nicht optimieren.
              </p>
              {p.shortcutMsg ? <p className="settings-hint">{p.shortcutMsg}</p> : null}
            </section>
          ) : null}

          {p.topic === 'wecker' ? (
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

          {p.topic === 'ort' ? (
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

          {p.topic === 'tv' ? (
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

          {p.topic === 'pc' ? (
            <section className="settings-card">
              <h3>PC im WLAN</h3>
              <p className="settings-lead">
                Auf dem Windows-Rechner <code>desktop/JarvisPC.bat</code> starten. Jarvis sieht den echten Bildschirm,
                bewegt die Maus, startet FIFA, bearbeitet Ordner — nur wenn die App läuft.
              </p>
              <p className="settings-hint">
                Gleiches WLAN. IP und Token stehen im PC-Fenster. Ohne App: nichts behaupten. Löschen nur nach Ja.
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
                    const v = pcHost.trim()
                    setPcHost(v)
                    void p.patchSetting({ pc_host: v })
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
                <input
                  value={pcToken}
                  disabled={busy || pcBusy}
                  placeholder="aus dem PC-Fenster"
                  autoComplete="off"
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
                    setPcBusy(true)
                    setPcMsg('Prüfe PC…')
                    void p.patchSetting({
                      pc_host: pcHost.trim(),
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

          {p.topic === 'haus' ? (
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

          {p.topic === 'haus' ? (
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

          {p.topic === 'musik' ? (
            <section className="settings-card">
              <h3>Spotify im Fahrmodus</h3>
              <p className="settings-lead">
                Interner Player in Jarvis (Web Playback). Jarvis erscheint als Gerät „Jarvis“. Kein Key in der App.
              </p>
              <p className="settings-hint">
                developer.spotify.com → App anlegen → Redirect URI exakt:{' '}
                <code>{typeof window !== 'undefined' ? spotifyRedirect() : 'https://localhost/'}</code>
                . In der APK ist das <code>https://localhost/</code>.
              </p>
              <label className="settings-field">
                <span>Client-ID</span>
                <input
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  key={`sp-id-${s?.spotify_client_id ? 'set' : 'empty'}`}
                  defaultValue={s?.spotify_client_id || ''}
                  disabled={busy}
                  placeholder="Spotify Client ID"
                  onBlur={(e) => void p.patchSetting({ spotify_client_id: e.target.value.trim() })}
                />
              </label>
              <p className="settings-hint">
                {spotifyLoggedIn(s || undefined)
                  ? 'Angemeldet. Im Fahrmodus spielt Jarvis selbst (Premium). „Spiel …“, Pause, weiter.'
                  : 'Anmelden. Premium = volle Titel in Jarvis. Ohne Premium nur 30s-Vorschau.'}
              </p>
              <div className="settings-actions">
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

          {p.topic === 'ton' ? (
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

          {p.topic === 'forschung' ? (
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

          {p.topic === 'gedaechtnis' ? (
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

          {p.topic === 'gefahr' ? (
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
  )
}
