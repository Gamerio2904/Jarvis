export const APP_VERSION = '0.16.0'

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
}

export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | string
  content: string
  created_at: string
  meta?: Record<string, unknown> | null
}

export type MemoryItem = {
  id: string
  key: string
  value: string
  category: string
  confidence: number
  source_conversation_id?: string | null
  updated_at: string
  expires_at?: string | null
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
  gemini_enabled: boolean
  gemini_api_key: string
  gemini_model: string
  model_default: string
  fallback_model: string
  routing_mode: string
  version: string
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
  gemini_enabled: false,
  gemini_api_key: '',
  gemini_model: '',
  model_default: DEFAULT_MODEL.label,
  fallback_model: DEFAULT_MODEL.label,
  routing_mode: 'on-device',
  version: APP_VERSION,
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

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('jarvis-ondevice', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      for (const name of [
        'conversations',
        'messages',
        'memory',
        'notes',
        'todos',
        'pending',
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
      conv.title === 'Neues Gespräch' && role === 'user'
        ? content.slice(0, 42)
        : conv.title
    await touchConversation(conversationId, title)
  }
  return row
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
): Promise<MemoryItem> {
  const existing = (await getAll<MemoryItem>('memory')).find((m) => m.key === key)
  const row: MemoryItem = {
    id: existing?.id || newId(),
    key,
    value,
    category,
    confidence: 0.9,
    source_conversation_id: conversationId || null,
    updated_at: nowIso(),
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
