import { shouldRefreshTitle, titleFromUser } from './chat-title.ts'
import type { MemoryEdge, MemoryKind, MemoryOrigin, MemoryTense } from './memory-layer.ts'
import { kindFromCategory, pruneMemoryItems, confidenceFor } from './memory-layer.ts'
import { migrateSettings, SETTINGS_REV } from './settings-migrate.ts'
import { coerceSettings } from './settings-schema.ts'
import { isTurnAborted } from './turn-abort.ts'
import type { IdeaPlan } from './idea-plan.ts'
import type { GlobeLayer } from './globe-layer-ids.ts'

export const APP_VERSION = '18.25.15'

/** Offene Folien (Kalender, Filme, Einkauf) hören mit, ohne den Store zu pollen. */
export function emitHouse(
  name: 'jarvis-events' | 'jarvis-watchlist' | 'jarvis-settings' | 'jarvis-shopping',
): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(name))
}

function emitShopping(): void {
  emitHouse('jarvis-shopping')
}

export const DEFAULT_MODEL = {
  repo: 'Qwen/Qwen2.5-0.5B-Instruct-GGUF',
  file: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
  label: 'Qwen2.5 0.5B Instruct Q4',
  sizeLabel: '~470 MB',
}

export type Conversation = {
  id: string
  title: string
  created_at: string
  updated_at: string
  folder_id?: string
}

export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | string
  content: string
  created_at: string
  meta?: Record<string, unknown> | null
}

export type MemoryCategory =
  | 'pref'
  | 'fact'
  | 'open_loop'
  | 'boundary'
  | 'joke'
  | 'place'
  | 'contact'
  | 'email'
  | 'birthday'
  | 'research'
  | 'work'
  | 'life'

export type MemoryItem = {
  id: string
  key: string
  value: string
  category: string
  confidence: number
  source_conversation_id?: string | null
  updated_at: string
  expires_at?: string | null
  origin?: MemoryOrigin
  kind?: MemoryKind
  entities?: string[]
  event_time?: string | null
  tense?: MemoryTense
  related_ids?: string[]
  related_edge?: MemoryEdge[]
  importance?: number
  parent_key?: string | null
  not_useful?: number
}

export type Note = {
  id: string
  body: string
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
}

export type TodoList = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type Todo = {
  id: string
  title: string
  status: 'open' | 'done' | string
  list_id?: string
  deadline_date?: string | null
  deadline_time?: string | null
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
}

export type IdeaStatus = 'open' | 'parked' | 'done'

export type Idea = {
  id: string
  title: string
  body: string
  status: IdeaStatus
  plan: IdeaPlan | null
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
}

export type MemoryProposal = {
  id: string
  text: string
  key?: string
  category: string
  origin: 'research' | 'board' | 'catalog'
  url?: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export type WatchListKind = 'watch' | 'favorite'

export type WatchMovie = {
  id: string
  title: string
  year?: string
  imdbId?: string
  lists: WatchListKind[]
  genres?: string[]
  poster?: string | null
  critic?: string | null
  audience?: string | null
  /** IMDb-Note aus OMDb, z. B. "6.3" — nicht die RT-Publikumsnote. */
  imdbScore?: string | null
  scoresAt?: string | null
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
}

export type WatchedMovie = {
  id: string
  title: string
  year?: string
  imdbId?: string
  genres?: string[]
  watched_at: string
  from_watchlist: true
  source_conversation_id?: string | null
}

export type CalendarEvent = {
  id: string
  title: string
  start_at: string
  /** Ende. Fehlt = 60 Minuten, ganztags = +1 Tag. */
  end_at?: string
  all_day?: boolean
  /** Serie. Eine Zeile im Store, Vorkommen beim Lesen. */
  recur?: 'weekly' | 'monthly' | 'yearly' | null
  place?: string
  /**
   * Minuten vor `start_at`. `undefined` = eine Notify zum Start (18.7).
   * `[]` = keine Erinnerung. `0` in der Liste = am Termin.
   */
  remind_offsets_min?: number[]
  /** Arbeit, Uni, Geburtstag … — Parser oder Nutzer. Fehlt = beim Lesen klassifizieren. */
  theme?: string
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
}

export type ShoppingList = {
  id: string
  name: string
  slug: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export type ShoppingItem = {
  id: string
  list_id?: string
  title: string
  status: 'open' | 'got' | string
  image_url?: string
  price_text?: string
  price_source?: string
  product_ref?: string
  sort_open?: number
  sort_done?: number
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
}

export type Reminder = {
  id: string
  title: string
  due_at: string
  status: 'open' | 'fired' | 'missed' | string
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
  kind?: 'once' | 'timer' | 'recur' | 'alarm' | 'home' | 'birthday'
  recur?: 'daily' | 'weekly' | null
  weekday?: number | null
  /**
   * Die Nummer, unter der Android diese Erinnerung kennt. Vorher wurde sie
   * aus der Id gehasht und beim Klingeln zurückgerechnet — eine stille
   * Kollision hätte die **falsche** Erinnerung geschlossen.
   */
  notify_id?: number
}

export type ToolPending = {
  conversation_id: string
  tool: string
  action: string
  args: Record<string, unknown>
  preview: string
  created_at: string
}

export type Settings = {
  research_opt_in: boolean
  delight_moments: boolean
  delight_jokes: boolean
  delight_joke_frequency: string
  easter_eggs_enabled: boolean
  ui_sounds: boolean
  ui_sound_volume: string
  tv_enabled: boolean
  tv_name: string
  tv_host: string
  tv_mac: string
  /** Ethernet-MAC, oft ≠ WLAN-MAC. WoL braucht oft diese. */
  tv_mac_eth: string
  tv_port: number
  tv_token: string
  tv_paired: boolean
  tv_volume: string
  tv_fire_host: string
  tv_fire_port: number
  tv_fire_hdmi: number
  tv_devices_json: string
  gemini_enabled: boolean
  gemini_api_key: string
  tankerkoenig_api_key: string
  omdb_api_key: string
  themealdb_api_key: string
  carto_api_key: string
  shop_discount: boolean
  last_fuel_json: string
  last_poi_json: string
  last_comm_json: string
  mail_user: string
  mail_pass: string
  mail_host: string
  last_pc_json: string
  last_clip_json: string
  last_rtc_json: string
  last_drive_json: string
  pc_enabled: boolean
  pc_host: string
  pc_port: number
  pc_token: string
  gemini_model: string
  gemini_skip_until: string
  /** Welches Groq-Modell gerade nicht geht, bis wann. Wie bei Gemini. */
  groq_skip_until: string
  groq_api_key: string
  opensky_client_id: string
  opensky_client_secret: string
  opensky_access: string
  opensky_expires_at: string
  last_lat: string
  last_lon: string
  last_place: string
  last_fix_at: string
  last_weather_place: string
  last_weather_when: string
  last_weather_focus: string
  last_weather_kind: string
  last_weather_line: string
  last_step_tool: string
  last_step_title: string
  last_step_when: string
  last_step_utterance: string
  last_medium: string
  last_list_json: string
  shopping_list_id: string
  hud_force: boolean
  hud_hidden: boolean
  hud_accent: 'green' | 'amber'
  ui_theme: 'dark' | 'light' | 'system'
  hud_modules_json: string
  hud_view: 'tiles' | 'body' | 'globe' | 'serie'
  /** Körper teilt sich den Schirm mit dem Chat. Aus = Vollbild wie die Kugel. */
  body_with_chat: boolean
  last_body_organ: string
  last_globe_focus: string
  last_globe_look: string
  last_globe_tour_json: string
  last_globe_brief: string
  globe_tour_on: boolean
  /** Schicht auf der Kugel. Leer = nur ISS/GPS wie 17.0. */
  globe_layer: '' | GlobeLayer
  last_eye_line: string
  last_ground_json: string
  last_hops_json: string
  last_trace_host: string
  last_news_line: string
  last_warn_line: string
  last_fx_line: string
  last_sport_line: string
  last_sport_json: string
  last_outlook_line: string
  last_outlook_json: string
  last_outlook_notified: string
  outlook_watch: boolean
  outlook_interrupt: boolean
  outlook_fred_key: string
  taxi_app: string
  chain_json: string
  last_taxi_json: string
  drive_interrupt: string
  drive_second_tel: string
  own_tel: string
  watchdog: boolean
  last_interrupt_json: string
  last_watchdog_fp: string
  gemini_tts_voice: string
  tts_voice_jarvis: string
  tts_voice_friday: string
  face: string
  last_backup_at: string
  home_lat: string
  home_lon: string
  home_radius_m: string
  wake_word: boolean
  fan_enabled: boolean
  fan_name: string
  fan_host: string
  fan_mac: string
  fan_codes_json: string
  plugs_enabled: boolean
  plugs_json: string
  drive_mode: boolean
  spotify_client_id: string
  spotify_access: string
  spotify_refresh: string
  spotify_expires_at: string
  alarm_tone_uri: string
  alarm_tone_name: string
  voice_tts: string
  gemini_tts_model: string
  gemini_tts_skip_until: string
  gemini_banner_dismissed: boolean
  model_default: string
  fallback_model: string
  setup_dismissed: boolean
  version: string
  /** Wie weit dieser Hausstand durch `MIGRATIONS` gewandert ist. */
  settings_rev: number
  last_blitzer_json: string
  drive_speak: 'after' | 'only'
  price_watch_on: boolean
  last_price_watch_at: string
  working_memory_json: string
  /** Gelernte Abläufe. Zweimal dasselbe bleibt. */
  habits_json: string
  /** Hauptgerät: Schlüssel zum zweiten Fenster. */
  fenster_pair_json: string
  /** Zweites Fenster: nur der Hash des Schlüssels. */
  fenster_grant_json: string
  /** Offene Kopplungsanfrage auf dem zweiten Gerät. */
  fenster_request_json: string
  last_debug_json: string
  last_recall_json: string
  last_research_json: string
  last_knowledge_json: string
  expert_topics_json: string
  last_doc_json: string
  vad_onnx: boolean
  piper_offline: boolean
  kokoro_tts: boolean
  e5_rerank: boolean
  presence_enabled: boolean
  presence_token: string
  presence_port: number
  presence_role: 'brain' | 'window'
  presence_peer_host: string
  last_eye_frame: boolean
  last_pc_frame: boolean
  last_desk_on: boolean
  tischplatte_on: boolean
  tischplatte_view: string
  tischplatte_focus: string
  tischplatte_seed: number
  tischplatte_hint: string
  tischplatte_pieces_json: string
  tischplatte_motion_json: string
  /** Raum- oder Objekt-Scan auf der Tischplatte. Kein Video. */
  scan_json: string
  /** Linke Leiste. `false` blendet sie aus, auch die Schublade am Telefon. */
  leiste_on: boolean
  /** Eingeklappt zur Icon-Leiste. Das rechte Menü schaltet sie ganz aus. */
  leiste_zu: boolean
  /** `live` = Skript läuft. `go` = fest, Export bereit. */
  plan_phase: '' | 'live' | 'go'
  /** Sprintliste im Skriptfenster. */
  script_sprint_side: 'left' | 'right'
  /** Start der Laufschrift auf der Tafel. */
  plan_script_at: number
  /** Idee, die gerade auf der Tischplatte liegt. `Go` nimmt diese, nicht die neueste. */
  plan_idea_id: string
  /** Offenes Projekt auf dem Portfolio. Leer heißt die Kartenliste. */
  portfolio_focus: string
  /** Geöffnete Datei in der Liste. */
  portfolio_file: string
  board_jobs_json: string
  /** Id der Ablauf-Zeile im Fenster. Kein zweites Vollstück. */
  ablauf_id: string
  /** Spiegel des offenen Status, damit der Parser ohne IndexedDB sieht, ob gewartet wird. */
  ablauf_status: string
  /** Nach dem Lauf zeigt die Sprintliste diese Zeile, bis „Zeig Sprints“. */
  ablauf_list_id: string
  /** Gezeigte Entwurfszeile. Kein zweites Vollstück. */
  entwurf_id: string
  /** Baustein und Musterindex, bis „Entwurf zu“. */
  entwurf_muster: string
  /** Spiegel, damit ein Tipp bei gleicher Id die Fläche neu zeichnet. */
  entwurf_status: '' | 'offen' | 'gewählt' | 'zu'
  /** Eine offene Bitte, einen anderen Bot dazuzuholen. Kein Lauf ohne Ja. */
  bot_ask_json: string
  proposal_pending: boolean
  github_token: string
  agent_network_v2: boolean
  body_view: 'classic' | 'agents'
  show_agent_network: boolean
  brain_v2: boolean
  brain_primary: 'groq' | 'gemini' | 'local'
  brain_gemini_roles_vision: boolean
  brain_gemini_roles_grounding: boolean
  brain_micro_llm_clarify: boolean
  brain_micro_llm_merge: boolean
  brain_shadow_mode: boolean
  last_agent_id: string
  /** Darf das Modell ein Werkzeug **vorschlagen**, wenn kein Parser greift? */
  tool_propose: boolean
  pc_dashboard_v2: boolean | null
  /** Name historisch. `true` = Lite-Canvas (weniger Ringe), **kein** WebGL. */
  globe_webgl: boolean
}

const SETTINGS_KEY = 'jarvis_settings_v13'

export const DEFAULT_SETTINGS: Settings = {
  research_opt_in: false,
  delight_moments: true,
  delight_jokes: true,
  delight_joke_frequency: 'selten',
  easter_eggs_enabled: true,
  ui_sounds: false,
  ui_sound_volume: 'low',
  tv_enabled: false,
  tv_name: 'Wohnzimmer',
  tv_host: '',
  tv_mac: '',
  tv_mac_eth: '',
  tv_port: 8002,
  tv_token: '',
  tv_paired: false,
  tv_volume: '',
  tv_fire_host: '',
  tv_fire_port: 5555,
  tv_fire_hdmi: 3,
  tv_devices_json: '',
  gemini_enabled: false,
  gemini_api_key: '',
  tankerkoenig_api_key: '',
  omdb_api_key: '',
  themealdb_api_key: '',
  carto_api_key: '',
  shop_discount: false,
  last_fuel_json: '',
  last_poi_json: '',
  last_comm_json: '',
  mail_user: '',
  mail_pass: '',
  mail_host: '',
  last_pc_json: '',
  last_clip_json: '',
  last_rtc_json: '',
  last_drive_json: '',
  pc_enabled: false,
  pc_host: '',
  pc_port: 18790,
  pc_token: '',
  gemini_model: '',
  gemini_skip_until: '',
  groq_skip_until: '',
  groq_api_key: '',
  opensky_client_id: '',
  opensky_client_secret: '',
  opensky_access: '',
  opensky_expires_at: '',
  last_lat: '',
  last_lon: '',
  last_place: '',
  last_fix_at: '',
  last_weather_place: '',
  last_weather_when: 'now',
  last_weather_focus: 'general',
  last_weather_kind: '',
  last_weather_line: '',
  last_step_tool: '',
  last_step_title: '',
  last_step_when: '',
  last_step_utterance: '',
  last_medium: '',
  last_list_json: '',
  shopping_list_id: '',
  hud_force: false,
  hud_hidden: false,
  hud_accent: 'green',
  ui_theme: 'dark',
  hud_modules_json: '',
  hud_view: 'tiles',
  body_with_chat: true,
  last_body_organ: 'brain',
  last_globe_focus: '',
  last_globe_look: '',
  last_globe_tour_json: '',
  last_globe_brief: '',
  globe_tour_on: false,
  globe_layer: '',
  last_eye_line: '',
  last_ground_json: '',
  last_hops_json: '',
  last_trace_host: '',
  last_news_line: '',
  last_warn_line: '',
  last_fx_line: '',
  last_sport_line: '',
  last_sport_json: '',
  last_outlook_line: '',
  last_outlook_json: '',
  last_outlook_notified: '',
  outlook_watch: false,
  outlook_interrupt: false,
  outlook_fred_key: '',
  taxi_app: 'call',
  chain_json: '',
  last_taxi_json: '',
  drive_interrupt: 'hud',
  drive_second_tel: '',
  own_tel: '',
  watchdog: false,
  last_interrupt_json: '',
  last_watchdog_fp: '',
  gemini_tts_voice: '',
  tts_voice_jarvis: '',
  tts_voice_friday: '',
  face: 'ultron',
  last_backup_at: '',
  home_lat: '',
  home_lon: '',
  home_radius_m: '250',
  wake_word: false,
  fan_enabled: false,
  fan_name: 'Wohnzimmer',
  fan_host: '',
  fan_mac: '',
  fan_codes_json: '',
  plugs_enabled: true,
  plugs_json: '',
  drive_mode: false,
  spotify_client_id: '',
  spotify_access: '',
  spotify_refresh: '',
  spotify_expires_at: '',
  alarm_tone_uri: '',
  alarm_tone_name: '',
  voice_tts: 'auto',
  gemini_tts_model: '',
  gemini_tts_skip_until: '',
  gemini_banner_dismissed: false,
  model_default: DEFAULT_MODEL.label,
  fallback_model: DEFAULT_MODEL.label,
  setup_dismissed: false,
  version: APP_VERSION,
  settings_rev: SETTINGS_REV,
  last_blitzer_json: '',
  drive_speak: 'after',
  price_watch_on: false,
  last_price_watch_at: '',
  working_memory_json: '',
  habits_json: '',
  fenster_pair_json: '',
  fenster_grant_json: '',
  fenster_request_json: '',
  last_debug_json: '',
  last_recall_json: '',
  last_research_json: '',
  last_knowledge_json: '',
  expert_topics_json: '',
  last_doc_json: '',
  vad_onnx: false,
  piper_offline: false,
  kokoro_tts: false,
  e5_rerank: false,
  presence_enabled: false,
  presence_token: '',
  presence_port: 18791,
  presence_role: 'brain',
  presence_peer_host: '',
  last_eye_frame: false,
  last_pc_frame: false,
  last_desk_on: false,
  tischplatte_on: false,
  tischplatte_view: 'sprints',
  tischplatte_focus: '',
  tischplatte_seed: 0,
  tischplatte_hint: '',
  tischplatte_pieces_json: '',
  tischplatte_motion_json: '',
  scan_json: '',
  leiste_on: true,
  leiste_zu: false,
  plan_phase: '',
  script_sprint_side: 'left',
  plan_script_at: 0,
  plan_idea_id: '',
  portfolio_focus: '',
  portfolio_file: '',
  board_jobs_json: '',
  ablauf_id: '',
  ablauf_status: '',
  ablauf_list_id: '',
  entwurf_id: '',
  entwurf_muster: '',
  entwurf_status: '',
  bot_ask_json: '',
  proposal_pending: false,
  github_token: '',
  agent_network_v2: true,
  body_view: 'agents',
  show_agent_network: false,
  brain_v2: true,
  brain_primary: 'gemini',
  brain_gemini_roles_vision: true,
  brain_gemini_roles_grounding: true,
  brain_micro_llm_clarify: true,
  brain_micro_llm_merge: true,
  brain_shadow_mode: false,
  last_agent_id: '',
  tool_propose: true,
  pc_dashboard_v2: null,
  globe_webgl: false,
}

function nowIso(): string {
  return new Date().toISOString()
}

export function newId(): string {
  return crypto.randomUUID()
}

/**
 * Ein kaputter Eintrag darf nicht still alles auf Werkseinstellung setzen. Der
 * nächste `saveSettings` würde ihn sonst überschreiben — samt Gemini-Key und
 * allem, was der Nutzer eingestellt hat. Die Rohdaten wandern zur Seite,
 * damit sie von Hand zu retten sind.
 */
function parkBrokenSettings(raw: string): void {
  try {
    localStorage.setItem(`${SETTINGS_KEY}.broken`, raw)
  } catch {
    /* Speicher voll oder gesperrt — dann ist auch nichts zu retten */
  }
}

/**
 * Zwei Ebenen, beide billig: der Feldschutz greift bei einem kaputten Feld,
 * das Parken bei einem kaputten Eintrag.
 */
export function loadSettings(): Settings {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(SETTINGS_KEY)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
  if (!raw) return { ...DEFAULT_SETTINGS }
  let stored: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('kein Objekt')
    stored = parsed as Record<string, unknown>
  } catch {
    parkBrokenSettings(raw)
    return { ...DEFAULT_SETTINGS }
  }
  const migrated = migrateSettings(stored)
  const prev = coerceSettings(migrated.value, DEFAULT_SETTINGS).value
  // Die Lage-Falle aus 15.3.1 löst jetzt der Migrationsschritt
  // `002-lage-falle-einmalig-loesen` — einmal, statt bei jedem Versionswechsel.
  return { ...prev, version: APP_VERSION }
}

export function isGeminiConfigured(s = loadSettings()): boolean {
  return Boolean(s.gemini_enabled && s.gemini_api_key.trim())
}

/**
 * Felder, die nur ein laufender Zug schreibt. Sie sind der Grund, warum ein
 * abgebrochener Zug gefährlich war: sein Handler lief weiter und schrieb dem
 * **neuen** Zug seinen Nachlauf-Zustand unter.
 *
 * Die Sperre gilt bewusst nur für diese Felder. Ein pauschales Verbot würde
 * die Einstellungen aussperren, sobald zuletzt ein Zug abgebrochen wurde.
 */
const TURN_SCOPED_KEYS = [
  'last_step_tool',
  'last_step_utterance',
  'last_medium',
  'last_place',
  'last_agent_id',
] as const satisfies ReadonlyArray<keyof Settings>

export function saveSettings(patch: Partial<Settings>): Settings {
  let effective = patch
  if (isTurnAborted()) {
    const kept: Partial<Settings> = { ...patch }
    let dropped = false
    for (const key of TURN_SCOPED_KEYS) {
      if (key in kept) {
        delete kept[key]
        dropped = true
      }
    }
    if (dropped) effective = kept
  }
  const next = { ...loadSettings(), ...effective, version: APP_VERSION }
  // Key eintragen = Opt-in. Explizites gemini_enabled: false bleibt aus.
  if (effective.gemini_api_key !== undefined && effective.gemini_enabled === undefined && next.gemini_api_key.trim()) {
    next.gemini_enabled = true
  }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    /* node tests */
  }
  emitHouse('jarvis-settings')
  return next
}

function asTitleList(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : []
}

function readListMap(raw: string, fallbackTool: string): Record<string, string[]> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return fallbackTool ? { [fallbackTool]: asTitleList(parsed) } : {}
    }
    if (parsed && typeof parsed === 'object') {
      const out: Record<string, string[]> = {}
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        out[k] = asTitleList(v)
      }
      return out
    }
  } catch {
    /* */
  }
  return {}
}

export function persistLastList(tool: string, titles: string[]): void {
  const s = loadSettings()
  const map = readListMap(s.last_list_json, s.last_step_tool)
  const clipped = titles.slice(0, 12)
  map[tool] = clipped
  const stepTool = tool.startsWith('watch-') ? 'watchlist' : tool
  if (stepTool !== tool) map[stepTool] = clipped
  saveSettings({
    last_step_tool: stepTool,
    last_step_title: titles[0] || s.last_step_title,
    last_list_json: JSON.stringify(map),
  })
}

export function readLastList(tool?: string): string[] {
  const s = loadSettings()
  const map = readListMap(s.last_list_json, s.last_step_tool)
  const key = tool || s.last_step_tool
  return (key && map[key]) || []
}

export type ResearchAudit = {
  id: string
  query: string
  status: string
  sources: Array<{ title: string; url: string; snippet?: string; provider?: string }>
  created_at: string
}

export type DocRecord = {
  id: string
  conversation_id: string
  name: string
  mime: string
  kind: string
  bytes: number
  text: string
  created_at: string
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open('jarvis-ondevice', 17)
    req.onupgradeneeded = (evt) => {
      const db = req.result
      const oldVersion = (evt.oldVersion as number) || 0
      for (const name of [
        'conversations',
        'messages',
        'memory',
        'notes',
        'todos',
        'ideas',
        'watch_movies',
        'watched_movies',
        'pending',
        'research_audits',
        'reminders',
        'events',
        'shopping',
        'shopping_lists',
        'price_watches',
        'docs',
        'xfer',
        'plans',
        'portfolio',
        'drafts',
        'knowledge_packs',
        'rm_scene_skills',
        'memory_proposals',
        'todo_lists',
      ]) {
        if (!db.objectStoreNames.contains(name)) {
          const key = name === 'pending' ? 'conversation_id' : 'id'
          db.createObjectStore(name, { keyPath: key })
        }
      }
      if (oldVersion < 17) {
        const tx = req.transaction
        if (tx) {
          const now = nowIso()
          const lists = tx.objectStore('todo_lists')
          lists.put({ id: 'todo-list-general', name: 'Allgemein', created_at: now, updated_at: now })
          const cursorRequest = tx.objectStore('todos').openCursor()
          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result
            if (!cursor) return
            const todo = cursor.value as Todo
            if (!todo.list_id) cursor.update({ ...todo, list_id: 'todo-list-general' })
            cursor.continue()
          }
        }
      }
    }
    req.onblocked = () => {
      console.warn('[jarvis] IndexedDB upgrade blocked — andere Tabs schließen')
    }
    req.onsuccess = () => {
      const db = req.result
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }
    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function put<T>(store: string, value: T): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).put(value)
  await txDone(tx)
}

export async function get<T>(store: string, id: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(id)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function del(store: string, id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).delete(id)
  await txDone(tx)
}

export async function clearStore(name: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(name, 'readwrite')
  tx.objectStore(name).clear()
  await txDone(tx)
}

export async function replaceStore<T>(name: string, rows: T[]): Promise<void> {
  await clearStore(name)
  for (const row of rows) await put(name, row)
}

export async function getAll<T>(store: string): Promise<T[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve((req.result as T[]) || [])
    req.onerror = () => reject(req.error)
  })
}

export async function listConversations(): Promise<Conversation[]> {
  const rows = await getAll<Conversation>('conversations')
  return rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
}

export async function createConversation(
  title = 'Neues Gespräch',
): Promise<Conversation> {
  const row: Conversation = {
    id: newId(),
    title,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('conversations', row)
  return row
}

export async function touchConversation(id: string, title?: string): Promise<Conversation | undefined> {
  const row = await get<Conversation>('conversations', id)
  if (!row) return undefined
  const next = {
    ...row,
    updated_at: nowIso(),
    title: title || row.title,
  }
  await put('conversations', next)
  return next
}

export async function deleteConversation(id: string): Promise<void> {
  const messages = await getAll<Message>('messages')
  for (const m of messages.filter((x) => x.conversation_id === id)) {
    await del('messages', m.id)
  }
  await del('pending', id)
  await del('conversations', id)
}

export async function addMessage(
  conversationId: string,
  role: string,
  content: string,
  meta?: Record<string, unknown> | null,
): Promise<Message> {
  const row: Message = {
    id: newId(),
    conversation_id: conversationId,
    role,
    content,
    created_at: nowIso(),
    meta: meta || null,
  }
  await put('messages', row)
  const conv = await get<Conversation>('conversations', conversationId)
  if (conv) {
    const title =
      role === 'user' && shouldRefreshTitle(content) ? titleFromUser(content) : conv.title
    await touchConversation(conversationId, title)
  }
  return row
}

export async function patchMessage(id: string, content: string): Promise<Message | null> {
  const row = await get<Message>('messages', id)
  if (!row) return null
  const next: Message = { ...row, content }
  await put('messages', next)
  return next
}

export async function deleteMessage(id: string): Promise<void> {
  await del('messages', id)
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const rows = await getAll<Message>('messages')
  return rows
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
}

export async function listMemory(category?: string | null): Promise<MemoryItem[]> {
  const rows = await getAll<MemoryItem>('memory')
  const filtered = category ? rows.filter((r) => r.category === category) : rows
  return filtered.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
}

export type MemoryWriteOpts = {
  confidence?: number
  origin?: MemoryItem['origin']
  expires_at?: string | null
  kind?: MemoryKind
  entities?: string[]
  event_time?: string | null
  tense?: MemoryTense
  related_ids?: string[]
  related_edge?: MemoryEdge[]
  importance?: number
  parent_key?: string | null
  not_useful?: number
}

export async function upsertMemory(
  key: string,
  value: string,
  category: string,
  conversationId?: string,
  opts?: MemoryWriteOpts,
): Promise<MemoryItem> {
  const existing = (await getAll<MemoryItem>('memory')).find(
    (m) => m.key === key && m.category === category,
  )
  const origin = opts?.origin || existing?.origin || 'user'
  const row: MemoryItem = {
    id: existing?.id || newId(),
    key,
    value,
    category,
    confidence: opts?.confidence ?? existing?.confidence ?? confidenceFor(origin, category),
    source_conversation_id: conversationId || existing?.source_conversation_id || null,
    updated_at: nowIso(),
    expires_at: opts?.expires_at === undefined ? existing?.expires_at || null : opts.expires_at,
    origin,
    kind: opts?.kind || existing?.kind || kindFromCategory(category),
    entities: opts?.entities || existing?.entities,
    event_time: opts?.event_time === undefined ? existing?.event_time || null : opts.event_time,
    tense: opts?.tense || existing?.tense,
    related_ids: opts?.related_ids || existing?.related_ids,
    related_edge: opts?.related_edge || existing?.related_edge,
    importance: opts?.importance ?? existing?.importance,
    parent_key: opts?.parent_key === undefined ? existing?.parent_key ?? null : opts.parent_key,
    not_useful: opts?.not_useful ?? existing?.not_useful,
  }
  await put('memory', row)
  return row
}

export async function pruneStaleAfterWrite(now = Date.now()): Promise<number> {
  const items = await getAll<MemoryItem>('memory')
  const { drop } = pruneMemoryItems(items, now)
  for (const row of drop) await del('memory', row.id)
  return drop.length
}

export async function deleteMemory(id: string): Promise<void> {
  await del('memory', id)
}

export async function clearMemory(): Promise<void> {
  const rows = await getAll<MemoryItem>('memory')
  for (const r of rows) await del('memory', r.id)
}

export async function listTodos(conversationId?: string): Promise<Todo[]> {
  const rows = await getAll<Todo>('todos')
  return rows
    .map((t) => ({ ...t, list_id: t.list_id || 'todo-list-general', deadline_date: t.deadline_date || null, deadline_time: t.deadline_time || null }))
    .filter((t) => !conversationId || t.source_conversation_id === conversationId)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
}

export async function listTodoLists(): Promise<TodoList[]> {
  const rows = await getAll<TodoList>('todo_lists')
  if (!rows.some((row) => row.id === 'todo-list-general')) {
    const now = nowIso()
    const general = { id: 'todo-list-general', name: 'Allgemein', created_at: now, updated_at: now }
    await put('todo_lists', general)
    rows.push(general)
  }
  return rows.sort((a, b) =>
    a.id === 'todo-list-general' ? -1 : b.id === 'todo-list-general' ? 1 : a.name.localeCompare(b.name),
  )
}

export async function createTodoList(name: string): Promise<TodoList> {
  const normalized = name.trim()
  if (!normalized) throw new Error('Der Listenname darf nicht leer sein.')
  const lists = await listTodoLists()
  const existing = lists.find((row) => row.name.toLocaleLowerCase() === normalized.toLocaleLowerCase())
  if (existing) return existing
  const now = nowIso()
  const row = { id: newId(), name: normalized, created_at: now, updated_at: now }
  await put('todo_lists', row)
  return row
}

export async function deleteTodoList(id: string): Promise<void> {
  if (id === 'todo-list-general') throw new Error('Die Liste Allgemein kann nicht gelöscht werden.')
  const list = await get<TodoList>('todo_lists', id)
  if (!list) throw new Error('Die Todo-Liste existiert nicht mehr.')
  const todos = (await getAll<Todo>('todos')).filter((todo) => todo.list_id === id)
  for (const todo of todos) await put('todos', { ...todo, list_id: 'todo-list-general', updated_at: nowIso() })
  await del('todo_lists', id)
}

export async function addTodo(
  title: string,
  conversationId?: string,
  opts: { listId?: string; deadlineDate?: string | null; deadlineTime?: string | null } = {},
): Promise<Todo> {
  const cleanTitle = title.trim()
  if (!cleanTitle) throw new Error('Die Todo-Aufgabe darf nicht leer sein.')
  const listId = opts.listId || 'todo-list-general'
  if (!(await get<TodoList>('todo_lists', listId))) throw new Error('Die ausgewählte Todo-Liste existiert nicht.')
  validateTodoDeadline(opts.deadlineDate, opts.deadlineTime)
  const now = nowIso()
  const row: Todo = {
    id: newId(),
    title: cleanTitle,
    status: 'open',
    list_id: listId,
    deadline_date: opts.deadlineDate || null,
    deadline_time: opts.deadlineTime || null,
    source_conversation_id: conversationId || null,
    created_at: now,
    updated_at: now,
  }
  await put('todos', row)
  return row
}

export async function setTodoStatus(id: string, status: string): Promise<void> {
  const row = await get<Todo>('todos', id)
  if (!row) throw new Error('Das Todo existiert nicht mehr.')
  await put('todos', { ...row, status, updated_at: nowIso() })
}

export async function updateTodo(
  id: string,
  patch: { title?: string; listId?: string; deadlineDate?: string | null; deadlineTime?: string | null },
): Promise<Todo> {
  const row = await get<Todo>('todos', id)
  if (!row) throw new Error('Das Todo existiert nicht mehr.')
  const title = patch.title === undefined ? row.title : patch.title.trim()
  if (!title) throw new Error('Die Todo-Aufgabe darf nicht leer sein.')
  const listId = patch.listId || row.list_id || 'todo-list-general'
  if (!(await get<TodoList>('todo_lists', listId))) throw new Error('Die ausgewählte Todo-Liste existiert nicht.')
  const deadlineDate = patch.deadlineDate === undefined ? row.deadline_date || null : patch.deadlineDate
  const deadlineTime = patch.deadlineTime === undefined ? row.deadline_time || null : patch.deadlineTime
  validateTodoDeadline(deadlineDate, deadlineTime)
  const updated = {
    ...row,
    title,
    list_id: listId,
    deadline_date: deadlineDate,
    deadline_time: deadlineTime,
    updated_at: nowIso(),
  }
  await put('todos', updated)
  return updated
}

export async function deleteTodo(id: string): Promise<void> {
  if (!(await get<Todo>('todos', id))) throw new Error('Das Todo existiert nicht mehr.')
  await del('todos', id)
}

export async function deleteDoneTodos(): Promise<number> {
  const rows = await getAll<Todo>('todos')
  const done = rows.filter((t) => t.status === 'done')
  for (const t of done) await del('todos', t.id)
  return done.length
}

export async function listNotes(conversationId?: string): Promise<Note[]> {
  const rows = await getAll<Note>('notes')
  return rows
    .filter((n) => !conversationId || n.source_conversation_id === conversationId)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
}

export async function addNote(body: string, conversationId?: string): Promise<Note> {
  const cleanBody = body.trim()
  if (!cleanBody) throw new Error('Eine Notiz darf nicht leer sein.')
  const row: Note = {
    id: newId(),
    body: cleanBody,
    source_conversation_id: conversationId || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('notes', row)
  return row
}

export async function updateNote(id: string, body: string): Promise<Note> {
  const row = await get<Note>('notes', id)
  if (!row) throw new Error('Die Notiz existiert nicht mehr.')
  const cleanBody = body.trim()
  if (!cleanBody) throw new Error('Eine Notiz darf nicht leer sein.')
  const updated = { ...row, body: cleanBody, updated_at: nowIso() }
  await put('notes', updated)
  return updated
}

export async function deleteNote(id: string): Promise<void> {
  if (!(await get<Note>('notes', id))) throw new Error('Die Notiz existiert nicht mehr.')
  await del('notes', id)
}

function validateTodoDeadline(date?: string | null, time?: string | null): void {
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Das Fälligkeitsdatum ist ungültig.')
  if (date) {
    const [year, month, day] = date.split('-').map(Number)
    const parsed = new Date(year, month - 1, day)
    if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
      throw new Error('Das Fälligkeitsdatum ist ungültig.')
    }
  }
  if (time && (!date || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))) {
    throw new Error('Eine gültige Uhrzeit benötigt ein gültiges Datum.')
  }
}

export async function listIdeas(status?: IdeaStatus): Promise<Idea[]> {
  const rows = await getAll<Idea>('ideas')
  return rows
    .filter((r) => !status || r.status === status)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
}

export async function addIdea(title: string, body = '', conversationId?: string): Promise<Idea> {
  const row: Idea = {
    id: newId(),
    title,
    body,
    status: 'open',
    plan: null,
    source_conversation_id: conversationId || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('ideas', row)
  return row
}

export async function putIdea(row: Idea): Promise<void> {
  await put('ideas', { ...row, updated_at: nowIso() })
}

function normFilmTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/^(?:the|der|die|das|ein|eine)\s+/i, '')
    .replace(/[^a-z0-9äöüß]+/gi, '')
    .trim()
}

function movieKeyOf(m: { imdbId?: string; title: string; year?: string }): string {
  const id = (m.imdbId || '').trim().toLowerCase()
  if (id) return `id:${id}`
  const title = (m.title || '').trim().toLowerCase()
  const year = (m.year || '').trim()
  return year ? `t:${title}|${year}` : `t:${title}`
}

export async function listWatchMovies(list?: WatchListKind): Promise<WatchMovie[]> {
  const rows = await getAll<WatchMovie>('watch_movies')
  return rows
    .filter((r) => !list || (r.lists || []).includes(list))
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
}

export async function addWatchMovie(
  title: string,
  list: WatchListKind,
  extra: Partial<WatchMovie> = {},
): Promise<WatchMovie> {
  const rows = await getAll<WatchMovie>('watch_movies')
  const probe = { title, year: extra.year, imdbId: extra.imdbId }
  const extraId = (extra.imdbId || '').trim().toLowerCase()
  const want = normFilmTitle(extra.title || title)
  const existing = rows.find((r) => {
    if (movieKeyOf(r) === movieKeyOf(probe)) return true
    if (normFilmTitle(r.title) === want || normFilmTitle(r.title) === normFilmTitle(title)) return true
    const haveId = (r.imdbId || '').trim().toLowerCase()
    return Boolean(extraId && haveId && extraId === haveId)
  })
  if (existing) {
    const lists = Array.from(new Set([...(existing.lists || []), list])) as WatchListKind[]
    const next: WatchMovie = {
      ...existing,
      ...extra,
      id: existing.id,
      title: extra.title || existing.title,
      lists,
      created_at: existing.created_at,
      updated_at: nowIso(),
    }
    await put('watch_movies', next)
    emitHouse('jarvis-watchlist')
    return next
  }
  const row: WatchMovie = {
    id: newId(),
    title: title.trim(),
    lists: [list],
    genres: extra.genres || [],
    poster: extra.poster ?? null,
    critic: extra.critic ?? null,
    audience: extra.audience ?? null,
    imdbScore: extra.imdbScore ?? null,
    scoresAt: extra.scoresAt ?? null,
    year: extra.year,
    imdbId: extra.imdbId,
    source_conversation_id: extra.source_conversation_id ?? null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('watch_movies', row)
  emitHouse('jarvis-watchlist')
  return row
}

/** Von einer Liste auf die andere — nicht kopieren. */
export async function moveWatchMovie(id: string, to: WatchListKind): Promise<WatchMovie | null> {
  const row = await get<WatchMovie>('watch_movies', id)
  if (!row) return null
  const from: WatchListKind = to === 'favorite' ? 'watch' : 'favorite'
  const lists = Array.from(new Set([...(row.lists || []).filter((x) => x !== from), to])) as WatchListKind[]
  const next: WatchMovie = { ...row, lists, updated_at: nowIso() }
  await put('watch_movies', next)
  emitHouse('jarvis-watchlist')
  return next
}

export async function deleteWatchMovie(id: string): Promise<void> {
  await del('watch_movies', id)
  emitHouse('jarvis-watchlist')
}

export async function removeWatchMovie(id: string, list: WatchListKind): Promise<void> {
  const row = await get<WatchMovie>('watch_movies', id)
  if (!row) return
  const lists = (row.lists || []).filter((x) => x !== list)
  if (!lists.length) {
    await del('watch_movies', id)
    emitHouse('jarvis-watchlist')
    return
  }
  await put('watch_movies', { ...row, lists, updated_at: nowIso() })
  emitHouse('jarvis-watchlist')
}

export async function listWatchedMovies(): Promise<WatchedMovie[]> {
  const rows = await getAll<WatchedMovie>('watched_movies')
  return rows.sort((a, b) => (a.watched_at < b.watched_at ? 1 : -1))
}

export async function addWatchedMovie(partial: {
  title: string
  year?: string
  imdbId?: string
  genres?: string[]
  from_watchlist: true
  source_conversation_id?: string
}): Promise<WatchedMovie> {
  const rows = await listWatchedMovies()
  const existing = rows.find((r) => movieKeyOf(r) === movieKeyOf(partial))
  if (existing) return existing
  const row: WatchedMovie = {
    id: newId(),
    title: partial.title,
    year: partial.year,
    imdbId: partial.imdbId,
    genres: partial.genres || [],
    watched_at: nowIso(),
    from_watchlist: true,
    source_conversation_id: partial.source_conversation_id || null,
  }
  await put('watched_movies', row)
  return row
}

export async function getPending(conversationId: string): Promise<ToolPending | undefined> {
  return get<ToolPending>('pending', conversationId)
}

export async function setPending(row: ToolPending): Promise<void> {
  await put('pending', row)
}

export async function clearPending(conversationId: string): Promise<void> {
  await del('pending', conversationId)
}

export async function listReminders(): Promise<Reminder[]> {
  const rows = await getAll<Reminder>('reminders')
  return rows.sort((a, b) => (a.due_at < b.due_at ? -1 : 1))
}

export async function addReminder(opts: {
  title: string
  due_at: string
  conversationId?: string
  kind?: Reminder['kind']
  recur?: Reminder['recur']
  weekday?: number | null
  notify_id?: number
}): Promise<Reminder> {
  const row: Reminder = {
    id: newId(),
    notify_id: opts.notify_id ?? allocNotifyId(await listReminders()),
    title: opts.title,
    due_at: opts.due_at,
    status: 'open',
    source_conversation_id: opts.conversationId || null,
    created_at: nowIso(),
    updated_at: nowIso(),
    kind: opts.kind || (opts.recur ? 'recur' : 'once'),
    recur: opts.recur || null,
    weekday: opts.weekday ?? null,
  }
  await put('reminders', row)
  return row
}

/**
 * `notifyIdFromKey` kann nur 1 … 1.999.999.999 liefern. Neue Nummern kommen
 * deshalb aus dem Band darüber: eine Kollision mit einer gehashten Nummer ist
 * dadurch ausgeschlossen, nicht nur unwahrscheinlich. Bestehende Zeilen
 * behalten ihren Hash und damit ihren Alarm.
 */
export const NOTIFY_ID_BASE = 2_000_000_000

export function allocNotifyId(rows: Reminder[]): number {
  const used = new Set<number>()
  for (const r of rows) if (typeof r.notify_id === 'number') used.add(r.notify_id)
  let n = NOTIFY_ID_BASE
  while (used.has(n)) n += 1
  return n
}

export async function putReminder(row: Reminder): Promise<void> {
  await put('reminders', { ...row, updated_at: nowIso() })
}

export async function setReminderStatus(id: string, status: string): Promise<void> {
  const row = await get<Reminder>('reminders', id)
  if (!row) return
  await put('reminders', { ...row, status, updated_at: nowIso() })
}

export async function deleteReminder(id: string): Promise<void> {
  await del('reminders', id)
}

export async function listEvents(): Promise<CalendarEvent[]> {
  const rows = await getAll<CalendarEvent>('events')
  return rows.sort((a, b) => (a.start_at < b.start_at ? -1 : 1))
}

export async function addEvent(opts: {
  title: string
  start_at: string
  place?: string
  conversationId?: string
  remind_offsets_min?: number[]
  theme?: string
  end_at?: string
  all_day?: boolean
  recur?: CalendarEvent['recur']
  id?: string
}): Promise<CalendarEvent> {
  const row: CalendarEvent = {
    id: opts.id || newId(),
    title: opts.title,
    start_at: opts.start_at,
    place: opts.place || '',
    source_conversation_id: opts.conversationId || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  if (opts.end_at) row.end_at = opts.end_at
  if (opts.all_day) row.all_day = true
  if (opts.recur) row.recur = opts.recur
  if (opts.remind_offsets_min !== undefined) {
    row.remind_offsets_min = [...new Set(opts.remind_offsets_min)].slice(0, 5)
  }
  if (opts.theme) row.theme = opts.theme
  await put('events', row)
  emitHouse('jarvis-events')
  return row
}

export async function putEvent(row: CalendarEvent): Promise<void> {
  await put('events', { ...row, updated_at: nowIso() })
  emitHouse('jarvis-events')
}

const DEFAULT_LIST_NAME = 'Hauptliste'
const DEFAULT_LIST_SLUG = 'hauptliste'

export function slugShoppingList(name: string): string {
  const raw = name
    .trim()
    .toLowerCase()
    .replace(/(?:\s|-)*liste$/i, '')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return raw || DEFAULT_LIST_SLUG
}

async function rawListShoppingLists(): Promise<ShoppingList[]> {
  try {
    return await getAll<ShoppingList>('shopping_lists')
  } catch {
    return []
  }
}

let shoppingMigratePromise: Promise<ShoppingList> | null = null

async function ensureDefaultShoppingList(): Promise<ShoppingList> {
  if (shoppingMigratePromise) return shoppingMigratePromise
  shoppingMigratePromise = (async () => {
    let lists = await rawListShoppingLists()
    if (!lists.length) {
      const row: ShoppingList = {
        id: newId(),
        name: DEFAULT_LIST_NAME,
        slug: DEFAULT_LIST_SLUG,
        is_default: true,
        created_at: nowIso(),
        updated_at: nowIso(),
      }
      await put('shopping_lists', row)
      lists = [row]
    }
    let def = lists.find((l) => l.is_default) || lists[0]
    if (!def.is_default) {
      def = { ...def, is_default: true, updated_at: nowIso() }
      await put('shopping_lists', def)
    }
    const items = await getAll<ShoppingItem>('shopping')
    const orphan = items.filter((item) => !item.list_id)
    if (orphan.length) {
      const db = await openDb()
      const tx = db.transaction('shopping', 'readwrite')
      const os = tx.objectStore('shopping')
      for (const item of orphan) {
        os.put({ ...item, list_id: def.id })
      }
      await txDone(tx)
      emitShopping()
    }
    return def
  })().catch((err) => {
    shoppingMigratePromise = null
    throw err
  })
  return shoppingMigratePromise
}

export async function listShoppingLists(): Promise<ShoppingList[]> {
  await ensureDefaultShoppingList()
  const rows = await rawListShoppingLists()
  return rows.sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
    return a.name.localeCompare(b.name, 'de')
  })
}

export async function getDefaultShoppingList(): Promise<ShoppingList> {
  return ensureDefaultShoppingList()
}

export async function resolveShoppingList(hint?: string | null): Promise<ShoppingList> {
  await ensureDefaultShoppingList()
  const lists = await rawListShoppingLists()
  const def = lists.find((l) => l.is_default) || lists[0]
  const h = (hint || '').trim()
  if (!h) return def
  const slug = slugShoppingList(h)
  if (!slug || slug.length > 48) return def
  const hit = lists.find((l) => l.slug === slug || l.name.toLowerCase() === h.toLowerCase())
  if (hit) return hit
  if (slug === DEFAULT_LIST_SLUG) return def
  const row: ShoppingList = {
    id: newId(),
    name: h.replace(/(?:\s|-)*liste$/i, '').trim() || h,
    slug,
    is_default: false,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('shopping_lists', row)
  emitShopping()
  return row
}

export async function createShoppingList(name: string): Promise<ShoppingList | null> {
  const clean = name.trim().replace(/\s+/g, ' ')
  if (!clean || clean.length > 64) return null
  await ensureDefaultShoppingList()
  const slug = slugShoppingList(clean)
  if (!slug) return null
  const lists = await rawListShoppingLists()
  const dup = lists.find((l) => l.slug === slug)
  if (dup) return dup
  const row: ShoppingList = {
    id: newId(),
    name: clean.replace(/(?:\s|-)*liste$/i, '').trim() || clean,
    slug,
    is_default: false,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('shopping_lists', row)
  emitShopping()
  return row
}

export async function renameShoppingList(id: string, name: string): Promise<ShoppingList | null> {
  const clean = name.trim()
  if (!clean || clean.length > 64) return null
  const lists = await listShoppingLists()
  const row = lists.find((l) => l.id === id)
  if (!row) return null
  const next: ShoppingList = {
    ...row,
    name: clean,
    slug: row.is_default ? DEFAULT_LIST_SLUG : slugShoppingList(clean),
    updated_at: nowIso(),
  }
  await put('shopping_lists', next)
  emitShopping()
  return next
}

export async function deleteShoppingList(id: string): Promise<boolean> {
  const lists = await listShoppingLists()
  const row = lists.find((l) => l.id === id)
  if (!row || row.is_default) return false
  const def = lists.find((l) => l.is_default)!
  const items = await getAll<ShoppingItem>('shopping')
  for (const item of items) {
    if (item.list_id === id) await put('shopping', { ...item, list_id: def.id, updated_at: nowIso() })
  }
  await del('shopping_lists', id)
  emitShopping()
  return true
}

function sortShoppingItems(rows: ShoppingItem[]): ShoppingItem[] {
  const open = rows
    .filter((s) => s.status === 'open')
    .sort((a, b) => (a.sort_open ?? 0) - (b.sort_open ?? 0) || (a.created_at < b.created_at ? -1 : 1))
  const got = rows
    .filter((s) => s.status !== 'open')
    .sort((a, b) => (a.sort_done ?? 0) - (b.sort_done ?? 0) || (a.updated_at < b.updated_at ? 1 : -1))
  return [...open, ...got]
}

export async function listShopping(listId?: string): Promise<ShoppingItem[]> {
  await ensureDefaultShoppingList()
  const rows = await getAll<ShoppingItem>('shopping')
  const filtered = listId ? rows.filter((s) => s.list_id === listId) : rows
  return sortShoppingItems(filtered)
}

export async function listShoppingForList(listId: string): Promise<ShoppingItem[]> {
  return listShopping(listId)
}

export type AddShoppingOpts = {
  conversationId?: string
  listId?: string
  listHint?: string
  image_url?: string
  price_text?: string
  price_source?: string
  product_ref?: string
}

export async function addShopping(title: string, opts?: AddShoppingOpts | string): Promise<ShoppingItem> {
  const o: AddShoppingOpts =
    typeof opts === 'string' ? { conversationId: opts } : opts || {}
  const list = o.listId
    ? (await listShoppingLists()).find((l) => l.id === o.listId) || (await getDefaultShoppingList())
    : await resolveShoppingList(o.listHint)
  const open = (await listShopping(list.id)).filter((s) => s.status === 'open')
  const dup = open.find((s) => s.title.toLowerCase() === title.toLowerCase())
  if (dup) return dup
  const sort_open = open.length ? Math.max(...open.map((s) => s.sort_open ?? 0)) + 1 : 0
  const row: ShoppingItem = {
    id: newId(),
    list_id: list.id,
    title,
    status: 'open',
    sort_open,
    sort_done: 0,
    source_conversation_id: o.conversationId || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  if (o.image_url) row.image_url = o.image_url
  if (o.price_text) row.price_text = o.price_text
  if (o.price_source) row.price_source = o.price_source
  if (o.product_ref) row.product_ref = o.product_ref
  await put('shopping', row)
  emitShopping()
  return row
}

export async function markShoppingGotById(id: string): Promise<ShoppingItem | undefined> {
  const rows = await getAll<ShoppingItem>('shopping')
  const hit = rows.find((s) => s.id === id && s.status === 'open')
  if (!hit) return undefined
  const listId = hit.list_id || (await getDefaultShoppingList()).id
  const done = (await listShopping(listId)).filter((s) => s.status !== 'open')
  const sort_done = done.length ? Math.max(...done.map((s) => s.sort_done ?? 0)) + 1 : 0
  const next: ShoppingItem = { ...hit, status: 'got', sort_done, updated_at: nowIso() }
  await put('shopping', next)
  emitShopping()
  return next
}

export async function markShoppingGot(query: string): Promise<ShoppingItem | undefined> {
  const q = query.toLowerCase()
  const rows = (await listShopping()).filter((s) => s.status === 'open')
  const hit = rows.find((s) => s.title.toLowerCase().includes(q) || q.includes(s.title.toLowerCase()))
  if (!hit) return undefined
  return markShoppingGotById(hit.id)
}

export async function deleteShoppingItem(id: string): Promise<boolean> {
  const rows = await getAll<ShoppingItem>('shopping')
  if (!rows.some((s) => s.id === id)) return false
  await del('shopping', id)
  emitShopping()
  return true
}

export async function reopenShoppingItem(id: string): Promise<ShoppingItem | undefined> {
  const rows = await getAll<ShoppingItem>('shopping')
  const hit = rows.find((s) => s.id === id)
  if (!hit || hit.status === 'open') return hit
  const listId = hit.list_id || (await getDefaultShoppingList()).id
  const open = (await listShopping(listId)).filter((s) => s.status === 'open')
  const sort_open = open.length ? Math.max(...open.map((s) => s.sort_open ?? 0)) + 1 : 0
  const next: ShoppingItem = { ...hit, status: 'open', sort_open, updated_at: nowIso() }
  await put('shopping', next)
  emitShopping()
  return next
}

export async function clearGotShopping(): Promise<number> {
  const rows = await listShopping()
  const got = rows.filter((s) => s.status === 'got')
  for (const s of got) await del('shopping', s.id)
  if (got.length) emitShopping()
  return got.length
}

export async function deleteEvent(id: string): Promise<void> {
  await del('events', id)
  emitHouse('jarvis-events')
}

/** Ohne Deckel wächst der Speicher endlos, und jedes Lesen holt alles herauf. */
const AUDIT_KEEP = 200

export async function addResearchAudit(row: ResearchAudit): Promise<ResearchAudit> {
  await put('research_audits', row)
  const rows = await getAll<ResearchAudit>('research_audits')
  if (rows.length > AUDIT_KEEP) {
    const old = rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(AUDIT_KEEP)
    for (const o of old) await del('research_audits', o.id)
  }
  return row
}

export async function listResearchAudits(limit = 30): Promise<ResearchAudit[]> {
  const rows = await getAll<ResearchAudit>('research_audits')
  return rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, limit)
}

export type PriceWatch = {
  id: string
  query: string
  last_price: string
  last_source: string
  last_url: string
  created_at: string
  updated_at: string
}

export async function listPriceWatches(): Promise<PriceWatch[]> {
  try {
    const rows = await getAll<PriceWatch>('price_watches')
    return rows.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
  } catch {
    return []
  }
}

export async function addPriceWatch(query: string): Promise<PriceWatch> {
  const row: PriceWatch = {
    id: newId(),
    query,
    last_price: '',
    last_source: '',
    last_url: '',
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('price_watches', row)
  return row
}

export async function putPriceWatch(row: PriceWatch): Promise<void> {
  await put('price_watches', { ...row, updated_at: nowIso() })
}

export async function deletePriceWatch(id: string): Promise<void> {
  await del('price_watches', id)
}

export async function setConversationFolder(id: string, folder_id: string): Promise<Conversation | undefined> {
  const row = await get<Conversation>('conversations', id)
  if (!row) return undefined
  const next = { ...row, folder_id, updated_at: nowIso() }
  await put('conversations', next)
  return next
}
