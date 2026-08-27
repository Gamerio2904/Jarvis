import {
  DEFAULT_SETTINGS,
  listConversations,
  listEvents,
  listMemory,
  listMessages,
  listNotes,
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
  type Reminder,
  type Settings,
  type ShoppingItem,
  type Todo,
} from './store.ts'
import type { ToolMeta } from './tools.ts'

export const BACKUP_VERSION = 1

const EPHEMERAL: Array<keyof Settings> = [
  'last_fuel_json',
  'last_poi_json',
  'last_comm_json',
  'last_pc_json',
  'last_drive_json',
  'last_taxi_json',
  'last_interrupt_json',
  'last_outlook_json',
  'last_outlook_notified',
  'last_outlook_line',
  'last_list_json',
  'last_hops_json',
  'last_news_line',
  'last_warn_line',
  'last_fx_line',
  'last_sport_line',
  'chain_json',
  'last_watchdog_fp',
  'last_step_tool',
  'last_step_title',
  'last_step_when',
  'last_step_utterance',
  'last_medium',
]

const KEY_FIELDS: Array<keyof Settings> = [
  'gemini_api_key',
  'groq_api_key',
  'tankerkoenig_api_key',
  'omdb_api_key',
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
  const blob = new Blob([text], { type: 'application/json' })
  saveSettings({ last_backup_at: new Date().toISOString() })
  try {
    const file = new File([blob], name, { type: 'application/json' })
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[]; title?: string }) => Promise<void> }
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: 'Jarvis Hausstand' })
      return 'Hausstand geteilt. Datei enthält API-Keys.'
    }
  } catch {
    /* fall through to download */
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  return `Gespeichert als ${name}. Datei enthält API-Keys — nicht in den Chat.`
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
