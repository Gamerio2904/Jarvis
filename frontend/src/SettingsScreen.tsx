import { useEffect, useState } from 'react'
import type { Health, MemoryCategory, MemoryItem, Reminder, ResearchAudit, Settings } from './api'
import {
  spotifyLoggedIn,
  spotifyLogout,
  spotifyRedirect,
  startSpotifyLogin,
} from './engine/spotify'

export type SettingsTopic =
  | 'allgemein'
  | 'modell'
  | 'cloud'
  | 'sprache'
  | 'wecker'
  | 'ort'
  | 'tv'
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
  { id: 'tv', label: 'Fernseher', hint: 'Tizen' },
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
  tvFound: Array<{ host?: string; name?: string; mac?: string; port?: number }>
  onTvDiscover: () => void
  onTvPair: () => void
  onTvTest: () => void
  onTvPick: (item: { host?: string; name?: string; mac?: string; port?: number }) => void
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
            </>
          ) : null}

          {p.topic === 'sprache' ? (
            <section className="settings-card">
              <h3>Hören & sprechen</h3>
              <p className="settings-hint">
                Mit Gemini-Key: natürliche Stimme (geht ins Netz). Sonst Android-Stimme, oft hart.
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
              <p className="settings-hint">Handy an, Screen darf aus. Gerät komplett aus: nein.</p>
              {p.shortcutMsg ? <p className="settings-hint">{p.shortcutMsg}</p> : null}
            </section>
          ) : null}

          {p.topic === 'wecker' ? (
            <section className="settings-card">
              <h3>Wecker, Timer, Erinnerungen</h3>
              <p className="settings-hint">Klingelt bei Bildschirm aus. OnePlus: Akku nicht optimieren.</p>
              {p.reminders.length === 0 ? (
                <p className="memory-empty">Nichts offen.</p>
              ) : (
                <ul className="memory-list">
                  {p.reminders.map((r) => (
                    <li key={r.id} className="memory-item">
                      <div className="memory-value">
                        {r.kind === 'timer'
                          ? 'Timer · '
                          : r.kind === 'alarm'
                            ? r.recur
                              ? 'Wecker täglich · '
                              : 'Wecker · '
                            : r.recur === 'daily'
                              ? 'täglich · '
                              : r.recur === 'weekly'
                                ? 'wöchentlich · '
                                : ''}
                        {r.title}
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
                  : 'Noch kein Standort. Im Chat „Wetter heute“ sagen.'}
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
                  disabled={busy}
                  onClick={() =>
                    void p.patchSetting({ last_lat: '', last_lon: '', last_place: '', last_fix_at: '' })
                  }
                >
                  Ort vergessen
                </button>
              </div>
            </section>
          ) : null}

          {p.topic === 'tv' ? (
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
                  : 'Suchen, am TV erlauben, dann testen. Gleiches WLAN, kein Gastnetz.'}
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
                        {item.name || 'Samsung TV'} · {item.host}
                        {item.mac ? ` · ${item.mac}` : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {p.tvMsg ? <p className="settings-hint">{p.tvMsg}</p> : null}
            </section>
          ) : null}

          {p.topic === 'musik' ? (
            <section className="settings-card">
              <h3>Spotify im Fahrmodus</h3>
              <p className="settings-lead">
                Eigene Steuerung in Jarvis, kein Google. Client-ID von Ihnen — kein Key in der App.
              </p>
              <p className="settings-hint">
                developer.spotify.com → App → Redirect URI exakt:{' '}
                <code>{typeof window !== 'undefined' ? spotifyRedirect() : 'https://localhost/'}</code>
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
                  ? 'Angemeldet. Im Fahrmodus: „Spiel …“, Pause, weiter.'
                  : 'Noch nicht angemeldet. Premium für volle Titel auf dem Handy.'}
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
              <p className="settings-hint">Aus = keine erfundene Suche. Wetter kommt von Open-Meteo.</p>
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
