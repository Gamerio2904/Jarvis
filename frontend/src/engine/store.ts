import { shouldRefreshTitle, titleFromUser } from './chat-title.ts'

export const APP_VERSION = '9.10.0'

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

export type MemoryCategory = 'pref' | 'fact' | 'open_loop' | 'boundary' | 'joke' | 'place' | 'contact' | 'birthday'

export type MemoryItem = {
  id: string
  key: string
  value: string
  category: string
  confidence: number
  source_conversation_id?: string | null
  updated_at: string
  expires_at?: string | null
  origin?: 'user' | 'sleep' | 'tool'
}

export type Note = {
  id: string
  body: string
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
}

export type Todo = {
  id: string
  title: string
  status: 'open' | 'done' | string
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
}

export type CalendarEvent = {
  id: string
  title: string
  start_at: string
  place?: string
  source_conversation_id?: string | null
  created_at: string
  updated_at: string
}

export type ShoppingItem = {
  id: string
  title: string
  status: 'open' | 'got' | string
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
  carto_api_key: string
  shop_discount: boolean
  last_fuel_json: string
  last_poi_json: string
  last_comm_json: string
  last_pc_json: string
  last_rtc_json: string
  last_drive_json: string
  pc_enabled: boolean
  pc_host: string
  pc_port: number
  pc_token: string
  gemini_model: string
  gemini_skip_until: string
  groq_api_key: string
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
  hud_force: boolean
  hud_hidden: boolean
  hud_accent: 'green' | 'amber'
  hud_modules_json: string
  hud_view: 'tiles' | 'body' | 'globe'
  last_body_organ: string
  last_globe_focus: string
  last_globe_look: string
  last_globe_tour_json: string
  last_globe_brief: string
  globe_tour_on: boolean
  last_eye_line: string
  last_ground_json: string
  last_hops_json: string
  last_trace_host: string
  last_news_line: string
  last_warn_line: string
  last_fx_line: string
  last_sport_line: string
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
  routing_mode: string
  setup_dismissed: boolean
  version: string
  last_blitzer_json: string
  drive_speak: 'after' | 'only'
  price_watch_on: boolean
  last_price_watch_at: string
  working_memory_json: string
  last_debug_json: string
  last_research_json: string
  last_doc_json: string
  vad_onnx: boolean
  piper_offline: boolean
  kokoro_tts: boolean
  e5_rerank: boolean
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
  carto_api_key: '',
  shop_discount: false,
  last_fuel_json: '',
  last_poi_json: '',
  last_comm_json: '',
  last_pc_json: '',
  last_rtc_json: '',
  last_drive_json: '',
  pc_enabled: false,
  pc_host: '',
  pc_port: 18790,
  pc_token: '',
  gemini_model: '',
  gemini_skip_until: '',
  groq_api_key: '',
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
  hud_force: false,
  hud_hidden: false,
  hud_accent: 'green',
  hud_modules_json: '',
  hud_view: 'tiles',
  last_body_organ: 'brain',
  last_globe_focus: '',
  last_globe_look: '',
  last_globe_tour_json: '',
  last_globe_brief: '',
  globe_tour_on: false,
  last_eye_line: '',
  last_ground_json: '',
  last_hops_json: '',
  last_trace_host: '',
  last_news_line: '',
  last_warn_line: '',
  last_fx_line: '',
  last_sport_line: '',
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
  face: 'jarvis',
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
  routing_mode: 'on-device',
  setup_dismissed: false,
  version: APP_VERSION,
  last_blitzer_json: '',
  drive_speak: 'after',
  price_watch_on: false,
  last_price_watch_at: '',
  working_memory_json: '',
  last_debug_json: '',
  last_research_json: '',
  last_doc_json: '',
  vad_onnx: false,
  piper_offline: false,
  kokoro_tts: false,
  e5_rerank: false,
}

function nowIso(): string {
  return new Date().toISOString()
}

export function newId(): string {
  return crypto.randomUUID()
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw), version: APP_VERSION }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function isGeminiConfigured(s = loadSettings()): boolean {
  return Boolean(s.gemini_enabled && s.gemini_api_key.trim())
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...loadSettings(), ...patch, version: APP_VERSION }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}

export function persistLastList(tool: string, titles: string[]): void {
  saveSettings({
    last_step_tool: tool,
    last_step_title: titles[0] || loadSettings().last_step_title,
    last_list_json: JSON.stringify(titles.slice(0, 12)),
  })
}

export function readLastList(): string[] {
  try {
    const raw = loadSettings().last_list_json
    if (!raw) return []
    const arr = JSON.parse(raw) as unknown
    return Array.isArray(arr)
      ? arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
      : []
  } catch {
    return []
  }
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

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('jarvis-ondevice', 7)
    req.onupgradeneeded = () => {
      const db = req.result
      for (const name of [
        'conversations',
        'messages',
        'memory',
        'notes',
        'todos',
        'pending',
        'research_audits',
        'reminders',
        'events',
        'shopping',
        'price_watches',
        'docs',
      ]) {
        if (!db.objectStoreNames.contains(name)) {
          const key = name === 'pending' ? 'conversation_id' : 'id'
          db.createObjectStore(name, { keyPath: key })
        }
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
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

export async function upsertMemory(
  key: string,
  value: string,
  category: string,
  conversationId?: string,
  opts?: { confidence?: number; origin?: MemoryItem['origin']; expires_at?: string | null },
): Promise<MemoryItem> {
  const existing = (await getAll<MemoryItem>('memory')).find(
    (m) => m.key === key && m.category === category,
  )
  const origin = opts?.origin || 'user'
  const row: MemoryItem = {
    id: existing?.id || newId(),
    key,
    value,
    category,
    confidence: opts?.confidence ?? (origin === 'sleep' ? 0.4 : origin === 'tool' ? 0.8 : category === 'pref' ? 0.9 : 0.95),
    source_conversation_id: conversationId || existing?.source_conversation_id || null,
    updated_at: nowIso(),
    expires_at: opts?.expires_at === undefined ? existing?.expires_at || null : opts.expires_at,
    origin,
  }
  await put('memory', row)
  return row
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
    .filter((t) => !conversationId || t.source_conversation_id === conversationId)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
}

export async function addTodo(title: string, conversationId?: string): Promise<Todo> {
  const row: Todo = {
    id: newId(),
    title,
    status: 'open',
    source_conversation_id: conversationId || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('todos', row)
  return row
}

export async function setTodoStatus(id: string, status: string): Promise<void> {
  const row = await get<Todo>('todos', id)
  if (!row) return
  await put('todos', { ...row, status, updated_at: nowIso() })
}

export async function deleteTodo(id: string): Promise<void> {
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
  const row: Note = {
    id: newId(),
    body,
    source_conversation_id: conversationId || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('notes', row)
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
}): Promise<Reminder> {
  const row: Reminder = {
    id: newId(),
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
}): Promise<CalendarEvent> {
  const row: CalendarEvent = {
    id: newId(),
    title: opts.title,
    start_at: opts.start_at,
    place: opts.place || '',
    source_conversation_id: opts.conversationId || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('events', row)
  return row
}

export async function listShopping(): Promise<ShoppingItem[]> {
  const rows = await getAll<ShoppingItem>('shopping')
  return rows.sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
}

export async function addShopping(title: string, conversationId?: string): Promise<ShoppingItem> {
  const open = (await listShopping()).filter((s) => s.status === 'open')
  const dup = open.find((s) => s.title.toLowerCase() === title.toLowerCase())
  if (dup) return dup
  const row: ShoppingItem = {
    id: newId(),
    title,
    status: 'open',
    source_conversation_id: conversationId || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }
  await put('shopping', row)
  return row
}

export async function markShoppingGot(query: string): Promise<ShoppingItem | undefined> {
  const q = query.toLowerCase()
  const rows = (await listShopping()).filter((s) => s.status === 'open')
  const hit = rows.find((s) => s.title.toLowerCase().includes(q) || q.includes(s.title.toLowerCase()))
  if (!hit) return undefined
  const next = { ...hit, status: 'got', updated_at: nowIso() }
  await put('shopping', next)
  return next
}

export async function clearGotShopping(): Promise<number> {
  const rows = await listShopping()
  const got = rows.filter((s) => s.status === 'got')
  for (const s of got) await del('shopping', s.id)
  return got.length
}

export async function deleteEvent(id: string): Promise<void> {
  await del('events', id)
}

export async function addResearchAudit(row: ResearchAudit): Promise<ResearchAudit> {
  await put('research_audits', row)
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
