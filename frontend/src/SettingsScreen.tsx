import { useEffect, useState } from 'react'
import type { Conversation, Health, MemoryCategory, MemoryItem, Plug, Reminder, ResearchAudit, Settings } from './api'
import { APP_VERSION, fanDiscover, fanLearn, fanPick, fanTest, listConversations, plugDiscover, plugProbe, plugTest, loadPlugs, upsertPlug, removePlug, emptyPlug, testPc } from './api'
import { copyText } from './copy-text'
import {
  TEST_COPY_GROUPS,
  groupSelectedCount,
  testCopyGroupById,
  testPromptKey,
  allTestPromptKeys,
} from './engine/test-copy'
import { ensureDeviceLocation } from './native/geo'
import { buildChatDebugDump, downloadChatDebug } from './engine/chat-debug'
import {
  SETTINGS_GROUPS,
  SETTINGS_TOPICS,
  settingsTopicMeta,
  settingsTopicStatus,
  type SettingsTopic,
} from './settings-topics'
import {
  spotifyLoggedIn,
  spotifyLogout,
  spotifyRedirect,
  startSpotifyLogin,
} from './engine/spotify'

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

function KeyField({
  label,
  value,
  placeholder,
  disabled,
  onSave,
}: {
  label: string
  value: string
  placeholder: string
  disabled?: boolean
  onSave: (v: string) => void
}) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        key={`${label}-${value ? 'set' : 'empty'}`}
        defaultValue={value}
        disabled={disabled}
        placeholder={placeholder}
        onBlur={(e) => onSave(e.target.value.trim())}
      />
    </label>
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

function CheckBox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (on: boolean) => void
  label?: string
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      aria-label={label}
      ref={(el) => {
        if (el) el.indeterminate = Boolean(indeterminate) && !checked
      }}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

export type SettingsScreenProps = {
  topic: SettingsTopic
  onTopic: (t: SettingsTopic) => void
  testGroup: string | null
  onTestGroup: (id: string | null) => void
  testKeys: Record<string, true>
  onToggleTestKey: (key: string) => void
  onToggleTestGroup: (groupId: string, on: boolean) => void
  onToggleAllTests: (on: boolean) => void
  onStartTest: () => void
  onBack: () => void
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
  const topic = settingsTopicMeta(p.topic)
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
  const [debugChats, setDebugChats] = useState<Conversation[]>([])
  const [debugPick, setDebugPick] = useState('')
  const [debugBusy, setDebugBusy] = useState(false)
  const [debugMsg, setDebugMsg] = useState<string | null>(null)
  const testCat = p.topic === 'tests' ? testCopyGroupById(p.testGroup) : undefined
  const paneTitle = testCat?.title || topic.label
  const testSel = Object.keys(p.testKeys).length
  const allTestKeys = allTestPromptKeys()
  const allTestsOn = allTestKeys.length > 0 && allTestKeys.every((k) => p.testKeys[k])
  const allTestsInd = testSel > 0 && !allTestsOn

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
    if (p.topic !== 'debug') return
    void listConversations().then((rows) => {
      setDebugChats(rows)
      setDebugPick((prev) => (prev && rows.some((c) => c.id === prev) ? prev : rows[0]?.id || ''))
    })
  }, [p.topic])

  return (
    <div
      className={`settings-screen ${p.topic === 'hub' ? 'is-hub' : 'is-topic'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <aside className="settings-rail" aria-label="Themen">
        <div className="settings-rail-head">
          <span>Themen</span>
        </div>
        <nav className="settings-rail-nav">
          <button
            type="button"
            className={`settings-rail-item ${p.topic === 'hub' ? 'active' : ''}`}
            onClick={() => p.onTopic('hub')}
          >
            <strong>Übersicht</strong>
            <span>durchklicken</span>
          </button>
          {SETTINGS_TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`settings-rail-item ${p.topic === t.id ? 'active' : ''}`}
              onClick={() => p.onTopic(t.id)}
            >
              <strong>{t.label}</strong>
              <span>{settingsTopicStatus(t.id, s, p.health, p.geminiOn) || t.hint}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="settings-pane">
        <header className="settings-pane-bar">
          <div>
            {p.topic !== 'hub' ? (
              <button type="button" className="settings-back" onClick={p.onBack}>
                Zurück
              </button>
            ) : (
              <p className="settings-kicker">Einstellungen</p>
            )}
            <h2 id="settings-title">{paneTitle}</h2>
          </div>
          <button type="button" className="settings-close" onClick={p.onClose}>
            Fertig
          </button>
        </header>

        <div className="settings-pane-body">
          {p.topic === 'hub' ? (
            <>
              <section className="settings-card">
                <h3>Tippen, fertig</h3>
                <p className="settings-lead">APIs ist ein eigener Bereich für alle Keys. Rabatt ist nur die Gutschein-Suche.</p>
              </section>
              {SETTINGS_GROUPS.map((group) => (
                <section
                  className={`settings-card${group.ids[0] === 'apis' ? ' settings-card-apis' : ''}`}
                  key={group.title}
                >
                  {group.ids.length === 1 && SETTINGS_TOPICS.find((t) => t.id === group.ids[0])?.label === group.title ? null : (
                    <h3>{group.title}</h3>
                  )}
                  <div className="settings-hub-list">
                    {group.ids.map((id) => {
                      const meta = SETTINGS_TOPICS.find((t) => t.id === id)
                      if (!meta) return null
                      return (
                        <button
                          key={id}
                          type="button"
                          className="settings-hub-row"
                          onClick={() => p.onTopic(id)}
                        >
                          <span className="settings-hub-copy">
                            <strong>{meta.label}</strong>
                            <span>{meta.hint}</span>
                          </span>
                          <span className="settings-hub-status">
                            {settingsTopicStatus(id, s, p.health, p.geminiOn)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {group.ids[0] === 'apis' ? (
                    <p className="settings-hint">Gemini, Groq, OMDb, Tankerkönig, Spotify — eigener Bereich, nicht unter Rabatt.</p>
                  ) : null}
                </section>
              ))}
            </>
          ) : null}

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
                Default 0.5B (~470 MB) auf diesem Handy. Optional scharf 1.5B (~1,1 GB). Lokal ist llama.cpp als WASM
                (wllama) — natives NDK ist nicht in dieser APK.
              </p>
              <label className="settings-toggle">
                <span>Scharf (1.5B, extra Download)</span>
                <input
                  type="checkbox"
                  checked={s?.model_variant === 'sharp'}
                  disabled={busy || p.geminiOn || p.downloadBusy}
                  onChange={(e) => {
                    const sharp = e.target.checked
                    void p.patchSetting({ model_variant: sharp ? 'sharp' : 'fast' }).then(() => {
                      p.downloadModel()
                    })
                  }}
                />
              </label>
              <p className="settings-hint">
                First-Run bleibt 0.5B. 1.5B extra, persistiert. Passt es nicht in den Speicher, fällt Jarvis auf 0.5B zurück.
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

          {p.topic === 'apis' ? (
            <section className="settings-card">
              <h3>Alle API-Keys</h3>
              <p className="settings-lead">Ein Feld pro Dienst. Leer lassen, wenn Sie den Dienst nicht nutzen.</p>
              <KeyField
                label="Gemini (Google)"
                value={s?.gemini_api_key || ''}
                placeholder="AIza… aistudio.google.com/apikey"
                disabled={busy}
                onSave={(v) => void p.patchSetting({ gemini_api_key: v })}
              />
              <div className="settings-actions">
                <button type="button" className="retry-btn" disabled={p.geminiBusy || busy} onClick={p.onGeminiTest}>
                  Gemini testen
                </button>
              </div>
              {p.geminiMsg ? <p className="settings-hint">{p.geminiMsg}</p> : null}
              <KeyField
                label="Groq (optional)"
                value={s?.groq_api_key || ''}
                placeholder="gsk_… console.groq.com/keys"
                disabled={busy}
                onSave={(v) => void p.patchSetting({ groq_api_key: v })}
              />
              <div className="settings-actions">
                <button type="button" className="retry-btn" disabled={p.groqBusy || busy} onClick={p.onGroqTest}>
                  Groq testen
                </button>
              </div>
              {p.groqMsg ? <p className="settings-hint">{p.groqMsg}</p> : null}
              <KeyField
                label="OMDb (IMDb / Rotten Tomatoes)"
                value={s?.omdb_api_key || ''}
                placeholder="Key von omdbapi.com"
                disabled={busy}
                onSave={(v) => void p.patchSetting({ omdb_api_key: v })}
              />
              <p className="settings-hint">omdbapi.com/apikey.aspx — kostenlos, nicht teilen.</p>
              <KeyField
                label="Tankerkönig (E10)"
                value={s?.tankerkoenig_api_key || ''}
                placeholder="UUID von tankerkoenig.de"
                disabled={busy}
                onSave={(v) => void p.patchSetting({ tankerkoenig_api_key: v })}
              />
              <p className="settings-hint">creativecommons.tankerkoenig.de — Standort geht an Tankerkönig.</p>
              <KeyField
                label="Spotify Client-ID"
                value={s?.spotify_client_id || ''}
                placeholder="developer.spotify.com"
                disabled={busy}
                onSave={(v) => void p.patchSetting({ spotify_client_id: v })}
              />
              <p className="settings-hint">Musik bleibt ehrlich: ohne Login „nicht angebunden“. Anmelden unter Musik.</p>
            </section>
          ) : null}

          {p.topic === 'rabatt' ? (
            <section className="settings-card">
              <h3>Rabatt-Suche</h3>
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
                An = extra Gutscheine (mydealz, Sparwelt) bei „wo kaufen“ / Preis. Research muss an sein.
                Keine erfundenen Codes. Stimme: „Rabatt-Suche an“. API-Keys gehören nicht hierher.
              </p>
            </section>
          ) : null}

          {p.topic === 'cloud' ? (
            <>
              <section className="settings-card">
                <h3>Gemini (Google)</h3>
                <p className="settings-lead">
                  Key unter APIs eintragen. Hier nur an/aus und Test.
                </p>
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
                <div className="settings-actions">
                  <button type="button" className="retry-btn" disabled={p.geminiBusy || busy} onClick={p.onGeminiTest}>
                    Testen
                  </button>
                  <button type="button" className="retry-btn" onClick={() => p.onTopic('apis')}>
                    APIs
                  </button>
                </div>
                {p.geminiMsg ? <p className="settings-hint">{p.geminiMsg}</p> : null}
              </section>
              <section className="settings-card">
                <h3>Groq (optional)</h3>
                <p className="settings-hint">Nur wenn Gemini leer oder überlastet ist. Key unter APIs.</p>
                <div className="settings-actions">
                  <button type="button" className="retry-btn" disabled={p.groqBusy || busy} onClick={p.onGroqTest}>
                    Testen
                  </button>
                </div>
                {p.groqMsg ? <p className="settings-hint">{p.groqMsg}</p> : null}
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
              <p className="settings-hint">Gemini-Key unter APIs, nicht unter Rabatt.</p>
              <div className="settings-actions">
                <button type="button" className="retry-btn" onClick={() => p.onTopic('apis')}>
                  APIs
                </button>
              </div>
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

          {p.topic === 'tests' && !testCat ? (
            <section className="settings-card">
              <h3>Was testen?</h3>
              <p className="settings-lead">
                Themen ankreuzen. Optional reinzoomen und einzelne Prompts wählen. Dann Test starten — Debug schreibt
                nacheinander, ohne Tastatur.
              </p>
              <div className="settings-check-row">
                <CheckBox
                  checked={allTestsOn}
                  indeterminate={allTestsInd}
                  label="Alle Themen"
                  onChange={(on) => p.onToggleAllTests(on)}
                />
                <span className="settings-hub-copy">
                  <strong>Alle Themen</strong>
                  <span>{testSel} Prompts</span>
                </span>
              </div>
              <div className="settings-hub-list">
                {TEST_COPY_GROUPS.map((g) => {
                  const { n, total } = groupSelectedCount(g, Object.keys(p.testKeys))
                  return (
                    <div key={g.id} className="settings-check-row">
                      <CheckBox
                        checked={n === total && total > 0}
                        indeterminate={n > 0 && n < total}
                        label={g.title}
                        onChange={(on) => p.onToggleTestGroup(g.id, on)}
                      />
                      <button type="button" className="settings-hub-copy" onClick={() => p.onTestGroup(g.id)}>
                        <strong>{g.title}</strong>
                        <span>{g.hint}</span>
                      </button>
                      <span className="settings-hub-status">
                        {n}/{total}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="tests-start-bar">
                <span>{testSel ? `${testSel} ausgewählt` : 'Nichts ausgewählt'}</span>
                <button type="button" className="retry-btn" disabled={!testSel} onClick={p.onStartTest}>
                  Test starten
                </button>
              </div>
            </section>
          ) : null}

          {p.topic === 'tests' && testCat ? (
            <section className="settings-card">
              <h3>{testCat.title}</h3>
              <p className="settings-lead">Prompts ankreuzen. Test starten schreibt sie nacheinander in einen Debug-Chat.</p>
              <div className="settings-check-row">
                <CheckBox
                  checked={groupSelectedCount(testCat, Object.keys(p.testKeys)).n === testCat.items.length}
                  indeterminate={
                    groupSelectedCount(testCat, Object.keys(p.testKeys)).n > 0 &&
                    groupSelectedCount(testCat, Object.keys(p.testKeys)).n < testCat.items.length
                  }
                  label={`Alle ${testCat.title}`}
                  onChange={(on) => p.onToggleTestGroup(testCat.id, on)}
                />
                <span className="settings-hub-copy">
                  <strong>Alle in {testCat.title}</strong>
                  <span>
                    {groupSelectedCount(testCat, Object.keys(p.testKeys)).n}/{testCat.items.length}
                  </span>
                </span>
              </div>
              <div className="settings-hub-list">
                {testCat.items.map((item) => {
                  const key = testPromptKey(testCat.id, item)
                  return (
                    <label key={key} className="settings-check-row is-prompt">
                      <CheckBox
                        checked={Boolean(p.testKeys[key])}
                        label={item.label}
                        onChange={() => p.onToggleTestKey(key)}
                      />
                      <span className="settings-hub-copy">
                        <strong>{item.label}</strong>
                        <span>{item.text}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
              <div className="tests-start-bar">
                <span>{testSel ? `${testSel} ausgewählt` : 'Nichts ausgewählt'}</span>
                <button type="button" className="retry-btn" disabled={!testSel} onClick={p.onStartTest}>
                  Test starten
                </button>
              </div>
            </section>
          ) : null}

          {p.topic === 'debug' ? (
            <section className="settings-card">
              <h3>Automatischer Debug-Chat</h3>
              <p className="settings-lead">
                Test läuft unter Tests. Hier nur Export früherer Chats. Ein laufender Test hält das Handy wach, auch wenn die App im Hintergrund ist — solange Android die WebView nicht tötet.
              </p>
              <button type="button" className="retry-btn" onClick={() => p.onTopic('tests')}>
                Zu Tests
              </button>
              <h3>Frühere Chats</h3>
              <p className="settings-lead">
                Gespräch wählen, JSON nach Downloads. Enthält Route, Tools, Quellen — ohne API-Keys.
              </p>
              {debugChats.length === 0 ? (
                <p className="settings-hint">Noch kein Gespräch.</p>
              ) : (
                <label className="settings-field">
                  <span>Gespräch</span>
                  <select value={debugPick} onChange={(e) => setDebugPick(e.target.value)} disabled={debugBusy}>
                    {debugChats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || 'Ohne Titel'}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="settings-actions">
                <button
                  type="button"
                  className="retry-btn"
                  disabled={debugBusy || !debugPick}
                  onClick={() => {
                    if (!debugPick) return
                    setDebugBusy(true)
                    setDebugMsg(null)
                    void downloadChatDebug(debugPick)
                      .then((r) => setDebugMsg(r.message))
                      .catch((err) => setDebugMsg(err instanceof Error ? err.message : 'Export fehlgeschlagen'))
                      .finally(() => setDebugBusy(false))
                  }}
                >
                  {debugBusy ? 'Export…' : 'JSON nach Downloads'}
                </button>
                <button
                  type="button"
                  className="retry-btn"
                  disabled={debugBusy || !debugPick}
                  onClick={() => {
                    if (!debugPick) return
                    setDebugBusy(true)
                    setDebugMsg(null)
                    void buildChatDebugDump(debugPick)
                      .then((dump) => copyText(JSON.stringify(dump, null, 2)))
                      .then((ok) => setDebugMsg(ok ? 'JSON kopiert. Im Chat an den Agenten einfügen.' : 'Kopieren fehlgeschlagen.'))
                      .catch((err) => setDebugMsg(err instanceof Error ? err.message : 'Export fehlgeschlagen'))
                      .finally(() => setDebugBusy(false))
                  }}
                >
                  Kopieren
                </button>
              </div>
              {debugMsg ? <p className="settings-hint">{debugMsg}</p> : null}
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
