import {
  DEFAULT_SETTINGS,
  listConversations,
  listEvents,
  listMemory,
  listMessages,
  listNotes,
  listPriceWatches,
  listReminders,
  listShopping,
  listTodos,
  loadSettings,
  replaceStore,
  saveSettings,
  type CalendarEvent,
  type Conversation,
  type MemoryItem,
  type Message,
  type Note,
  type PriceWatch,
  type Reminder,
  type Settings,
  type ShoppingItem,
  type Todo,
} from './store.ts'
import type { ToolMeta } from './tools.ts'
import { Capacitor } from '@capacitor/core'

export const BACKUP_VERSION = 1

/** Nur Lauf-Cache, keine dauerhaften Einstellungen. Keys, Hosts, HUD, Stecker bleiben. */
const EPHEMERAL: Array<keyof Settings> = [
  'last_fuel_json',
  'last_poi_json',
  'last_comm_json',
  'last_pc_json',
  'last_rtc_json',
  'last_drive_json',
  'last_debug_json',
  'last_recall_json',
  'last_research_json',
  'last_doc_json',
  'last_taxi_json',
  'last_interrupt_json',
  'last_outlook_json',
  'last_outlook_notified',
  'last_outlook_line',
  'last_list_json',
  'last_globe_tour_json',
  'last_globe_brief',
  'last_hops_json',
  'last_news_line',
  'last_warn_line',
  'last_fx_line',
  'last_sport_line',
  'chain_json',
  'last_watchdog_fp',
  'last_blitzer_json',
  'last_price_watch_at',
  'working_memory_json',
  'last_step_tool',
  'last_step_title',
  'last_step_when',
  'last_step_utterance',
  'last_medium',
  'last_eye_line',
  'last_ground_json',
  'last_weather_place',
  'last_weather_when',
  'last_weather_focus',
  'last_weather_kind',
  'last_weather_line',
  'last_body_organ',
  'last_globe_focus',
  'last_globe_look',
  'last_trace_host',
  'gemini_skip_until',
  'gemini_tts_skip_until',
]

const KEY_FIELDS: Array<keyof Settings> = [
  'gemini_api_key',
  'groq_api_key',
  'tankerkoenig_api_key',
  'omdb_api_key',
  'carto_api_key',
  'pc_token',
  'spotify_access',
  'spotify_refresh',
  'spotify_client_id',
  'outlook_fred_key',
  'tv_token',
]

export type HausBackup = {
  backup_version: number
  exported_at: string
  settings: Partial<Settings>
  memory: MemoryItem[]
  reminders: Reminder[]
  events: CalendarEvent[]
  notes: Note[]
  todos: Todo[]
  shopping: ShoppingItem[]
  price_watches?: PriceWatch[]
  conversations?: Conversation[]
  messages?: Message[]
}

export type BackupPreview = {
  ok: boolean
  message: string
  keys: number
  contacts: number
  reminders: number
  events: number
  notes: number
  chats: number
  hasKeys: boolean
}

export function backupFilename(at = new Date()): string {
  const y = at.getFullYear()
  const m = String(at.getMonth() + 1).padStart(2, '0')
  const d = String(at.getDate()).padStart(2, '0')
  return `jarvis-haus-${y}${m}${d}.json`
}

export function stripSettings(s: Partial<Settings>): Partial<Settings> {
  const out: Partial<Settings> = { ...s }
  for (const k of EPHEMERAL) delete out[k]
  return out
}

export function countSetKeys(s: Partial<Settings>): number {
  let n = 0
  for (const k of KEY_FIELDS) {
    if (String(s[k] || '').trim()) n += 1
  }
  return n
}

export function previewBackup(raw: unknown): BackupPreview {
  const data = asBackup(raw)
  if (!data) {
    return {
      ok: false,
      message: 'Keine Jarvis-Hausstand-Datei.',
      keys: 0,
      contacts: 0,
      reminders: 0,
      events: 0,
      notes: 0,
      chats: 0,
      hasKeys: false,
    }
  }
  const keys = countSetKeys(data.settings || {})
  const contacts = (data.memory || []).filter((m) => m.category === 'contact').length
  return {
    ok: true,
    message: `${keys} Keys, ${contacts} Nummern, ${(data.reminders || []).length} Erinnerungen. Datei enthält Geheimnisse — nicht in den Chat, nicht nach Git.`,
    keys,
    contacts,
    reminders: (data.reminders || []).length,
    events: (data.events || []).length,
    notes: (data.notes || []).length,
    chats: (data.conversations || []).length,
    hasKeys: keys > 0,
  }
}

export function asBackup(raw: unknown): HausBackup | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const ver = Number(o.backup_version ?? 1)
  if (ver !== 1) return null
  if (!o.settings || typeof o.settings !== 'object') return null
  return {
    backup_version: 1,
    exported_at: String(o.exported_at || ''),
    settings: o.settings as Partial<Settings>,
    memory: arr(o.memory),
    reminders: arr(o.reminders),
    events: arr(o.events),
    notes: arr(o.notes),
    todos: arr(o.todos),
    shopping: arr(o.shopping),
    price_watches: o.price_watches ? arr(o.price_watches) : undefined,
    conversations: o.conversations ? arr(o.conversations) : undefined,
    messages: o.messages ? arr(o.messages) : undefined,
  }
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

export async function buildBackup(includeChats: boolean): Promise<HausBackup> {
  const settings = stripSettings(loadSettings())
  const conversations = includeChats ? await listConversations() : undefined
  let messages: Message[] | undefined
  if (includeChats && conversations) {
    const all: Message[] = []
    for (const c of conversations) {
      all.push(...(await listMessages(c.id)))
    }
    messages = all
  }
  return {
    backup_version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    settings,
    memory: await listMemory(),
    reminders: await listReminders(),
    events: await listEvents(),
    notes: await listNotes(),
    todos: await listTodos(),
    shopping: await listShopping(),
    price_watches: await listPriceWatches(),
    conversations,
    messages,
  }
}

export async function applyBackup(data: HausBackup): Promise<string> {
  const next = {
    ...DEFAULT_SETTINGS,
    ...stripSettings({ ...data.settings }),
  }
  saveSettings(next)
  await replaceStore('memory', data.memory || [])
  await replaceStore('reminders', data.reminders || [])
  await replaceStore('events', data.events || [])
  await replaceStore('notes', data.notes || [])
  await replaceStore('todos', data.todos || [])
  await replaceStore('shopping', data.shopping || [])
  if (data.price_watches) await replaceStore('price_watches', data.price_watches)
  if (data.conversations) {
    await replaceStore('conversations', data.conversations)
    await replaceStore('messages', data.messages || [])
  }
  try {
    const { syncReminderAlarms } = await import('./reminders.ts')
    await syncReminderAlarms()
  } catch {
    /* */
  }
  try {
    const { notifyIdFromKey, scheduleNotify, requestNotifyPermission } = await import('../native/notify.ts')
    await requestNotifyPermission()
    for (const ev of data.events || []) {
      const at = new Date(ev.start_at)
      if (Number.isNaN(at.getTime()) || at.getTime() < Date.now()) continue
      await scheduleNotify({
        id: notifyIdFromKey(`evt-${ev.id}`),
        title: 'Jarvis · Termin',
        body: ev.title,
        at,
      })
    }
  } catch {
    /* */
  }
  saveSettings({ last_backup_at: new Date().toISOString() })
  return 'Hausstand liegt. Erinnerungen neu gesetzt. Keys sind in der Datei — nicht teilen.'
}

export async function shareOrDownloadBackup(includeChats: boolean): Promise<string> {
  const data = await buildBackup(includeChats)
  const name = backupFilename()
  const text = JSON.stringify(data, null, 2)
  saveSettings({ last_backup_at: new Date().toISOString() })

  const { saveToDownloads } = await import('../native/device.ts')
  const native = await saveToDownloads(name, text)
  if (native.ok) {
    return `Gespeichert in Downloads/${name}. Alle Keys und Einstellungen sind in der Datei — nicht in den Chat.`
  }

  if (!Capacitor.isNativePlatform()) {
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    return `Gespeichert als ${name} (Downloads des Browsers). Datei enthält API-Keys.`
  }

  return native.message || 'Datei nicht in Downloads geschrieben. Ordner Downloads prüfen oder nochmal.'
}

export function parseBackupIntent(text: string): 'export' | 'import' | null {
  const t = text.trim()
  if (/\b(hausstand|einstellungen)\s+export(?:ieren)?\b/i.test(t) || /^\s*backup\s+export/i.test(t)) return 'export'
  if (/\b(hausstand|einstellungen)\s+import(?:ieren)?\b/i.test(t)) return 'import'
  return null
}

export async function handleBackup(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta }> {
  const intent = parseBackupIntent(text)
  if (!intent) return { handled: false }
  if (intent === 'import') {
    return {
      handled: true,
      reply: 'Import nur unter Einstellungen → Hausstand, mit Vorschau und Bestätigen.',
      tool: { tool_status: 'executed', tool: 'backup', action: 'ask', label: 'Hausstand' },
    }
  }
  const reply = await shareOrDownloadBackup(false)
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'backup', action: 'export', label: 'Hausstand' },
  }
}
