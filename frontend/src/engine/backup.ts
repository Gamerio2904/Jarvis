import { listPlans, type Ablauf } from './ablauf.ts'
import type { Draft } from './entwurf-muster.ts'
import { listPortfolio, mirrorPortfolio, type PortfolioRow } from './portfolio.ts'
import type { ChatBlock } from './chat-blocks.ts'
import { offerHausQr, openHausScan, parseHausLink } from './haus-link.ts'
import {
  DEFAULT_SETTINGS,
  getAll,
  listConversations,
  listEvents,
  listMemory,
  listMessages,
  listNotes,
  listPriceWatches,
  listReminders,
  listShopping,
  listShoppingLists,
  listTodos,
  listIdeas,
  listWatchMovies,
  listWatchedMovies,
  loadSettings,
  normalizeIdeaRow,
  replaceStore,
  saveSettings,
  standAt,
  type CalendarEvent,
  type Conversation,
  type MemoryItem,
  type Message,
  type Note,
  type PriceWatch,
  type Reminder,
  type Settings,
  type ShoppingItem,
  type ShoppingList,
  type Todo,
  type Idea,
  type MemoryProposal,
  type WatchMovie,
  type WatchedMovie,
} from './store.ts'
import { isPrefValue } from './memory-parse.ts'
import type { ToolMeta } from './tools.ts'
import { Capacitor } from '@capacitor/core'
import { listKnowledgePacks, normalizePack, type KnowledgePack } from './knowledge-store.ts'
import { eventsToIcs, icsToEvents, looksLikeIcs } from './calendar-ics.ts'
import { parseSyncRevision, revisionFor, type SyncRevision } from './sync-revisions.ts'

export const BACKUP_VERSION = 1

/** Alte Exporte speichern Befehle als Getränk/Notiz. Nicht wieder einspielen. */
export function isImportJunkMemory(row: { key?: string; value?: string }): boolean {
  const v = String(row.value || '').trim()
  if (!v) return true
  if (row.key === 'getränk' && !isPrefValue(v)) return true
  if (/\b(fass(?:e)?\s+das|in\s+einem\s+satz\s+zusammen)\b/i.test(v)) return true
  return false
}

/** Nur Lauf-Cache, keine dauerhaften Einstellungen. Keys, Hosts, HUD, Stecker bleiben. */
const EPHEMERAL: Array<keyof Settings> = [
  'tablet_mode',
  'sync_url',
  'sync_token',
  'sync_fingerprint',
  'last_fuel_json',
  'last_poi_json',
  'last_comm_json',
  'last_pc_json',
  'last_clip_json',
  'last_rtc_json',
  'last_drive_json',
  'last_debug_json',
  'last_recall_json',
  'last_research_json',
  'last_knowledge_json',
  'expert_topics_json',
  'last_doc_json',
  'last_taxi_json',
  'last_interrupt_json',
  'bot_ask_json',
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
  'last_sport_json',
  'chain_json',
  'last_watchdog_fp',
  'last_blitzer_json',
  'last_price_watch_at',
  'working_memory_json',
  'habits_json',
  'fenster_pair_json',
  'fenster_grant_json',
  'fenster_request_json',
  'board_jobs_json',
  'tischplatte_motion_json',
  'last_step_tool',
  'last_step_title',
  'last_step_when',
  'last_step_utterance',
  'last_medium',
  'last_eye_line',
  'portfolio_focus',
  'portfolio_file',
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
  'github_token',
  'tankerkoenig_api_key',
  'omdb_api_key',
  'carto_api_key',
  'pc_token',
  'spotify_access',
  'spotify_refresh',
  'spotify_client_id',
  'opensky_client_id',
  'opensky_client_secret',
  'opensky_access',
  'outlook_fred_key',
  'tv_token',
  'mail_user',
  'mail_pass',
]

export type HausBackup = {
  backup_version: number
  exported_at: string
  stand_at?: string
  sync_revision?: SyncRevision
  settings: Partial<Settings>
  memory: MemoryItem[]
  reminders: Reminder[]
  events: CalendarEvent[]
  notes: Note[]
  todos: Todo[]
  ideas?: Idea[]
  plans?: Ablauf[]
  portfolio?: PortfolioRow[]
  drafts?: Draft[]
  watch_movies?: WatchMovie[]
  watched_movies?: WatchedMovie[]
  shopping: ShoppingItem[]
  shopping_lists?: ShoppingList[]
  price_watches?: PriceWatch[]
  knowledge_packs?: KnowledgePack[]
  memory_proposals?: MemoryProposal[]
  conversations?: Conversation[]
  messages?: Message[]
  calendar_ics?: string
}

export type BackupPreview = {
  ok: boolean
  message: string
  keys: number
  contacts: number
  reminders: number
  events: number
    notes: number
  ideas: number
  watch: number
  favorite: number
  watched: number
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
      message: 'Keine Hausstand-Datei.',
      keys: 0,
      contacts: 0,
      reminders: 0,
      events: 0,
      notes: 0,
      ideas: 0,
      watch: 0,
      favorite: 0,
      watched: 0,
      chats: 0,
      hasKeys: false,
    }
  }
  const keys = countSetKeys(data.settings || {})
  const contacts = (data.memory || []).filter((m) => m.category === 'contact' || m.category === 'email').length
  return {
    ok: true,
    message: `${keys} Keys, ${contacts} Nummern, ${(data.reminders || []).length} Erinnerungen, ${(data.events || []).length} Termine, ${(data.ideas || []).length} Ideen${Array.isArray(data.plans) ? `, ${data.plans.length} Abläufe` : ''}${Array.isArray(data.portfolio) ? `, ${data.portfolio.length} Projekte${data.portfolio.filter((row) => row.archived).length ? `, ${data.portfolio.filter((row) => row.archived).length} im Archiv` : ''}` : ''}${Array.isArray(data.drafts) ? `, ${data.drafts.length} Entwürfe` : ''}, Watchliste ${(data.watch_movies || []).filter((m) => (m.lists || []).includes('watch')).length}, Lieblinge ${(data.watch_movies || []).filter((m) => (m.lists || []).includes('favorite')).length}, Gesehen ${(data.watched_movies || []).length}. Datei enthält Geheimnisse — nicht in den Chat, nicht nach Git.`,
    keys,
    contacts,
    reminders: (data.reminders || []).length,
    events: (data.events || []).length,
    notes: (data.notes || []).length,
    ideas: (data.ideas || []).length,
    watch: (data.watch_movies || []).filter((m) => (m.lists || []).includes('watch')).length,
    favorite: (data.watch_movies || []).filter((m) => (m.lists || []).includes('favorite')).length,
    watched: (data.watched_movies || []).length,
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
  const sync_revision = o.sync_revision === undefined ? undefined : parseSyncRevision(o.sync_revision)
  if (o.sync_revision !== undefined && !sync_revision) return null
  const calendar_ics = typeof o.calendar_ics === 'string' ? o.calendar_ics : undefined
  let events = normalizeBackupEvents(o.events)
  if (!events.length && calendar_ics) events = icsToEvents(calendar_ics)
  return {
    backup_version: 1,
    exported_at: String(o.exported_at || ''),
    stand_at: String(o.stand_at || ''),
    sync_revision: sync_revision || undefined,
    settings: o.settings as Partial<Settings>,
    memory: arr(o.memory),
    reminders: arr(o.reminders),
    events,
    notes: arr(o.notes),
    todos: arr(o.todos),
    ideas: normalizeBackupIdeas(o.ideas),
    plans: Object.prototype.hasOwnProperty.call(o, 'plans') ? arr(o.plans) : undefined,
    portfolio: Object.prototype.hasOwnProperty.call(o, 'portfolio') ? arr(o.portfolio) : undefined,
    drafts: Object.prototype.hasOwnProperty.call(o, 'drafts') ? arr(o.drafts) : undefined,
    watch_movies: normalizeBackupWatchMovies(o.watch_movies),
    watched_movies: normalizeBackupWatchedMovies(o.watched_movies),
    shopping: arr(o.shopping),
    shopping_lists: Object.prototype.hasOwnProperty.call(o, 'shopping_lists')
      ? arr(o.shopping_lists)
      : undefined,
    price_watches: o.price_watches ? arr(o.price_watches) : undefined,
    knowledge_packs: normalizeBackupPacks(o.knowledge_packs),
    conversations: o.conversations ? arr(o.conversations) : undefined,
    messages: o.messages ? arr(o.messages) : undefined,
    calendar_ics,
  }
}

function normalizeBackupIdeas(value: unknown): Idea[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((row) => {
    const idea = normalizeIdeaRow(row)
    return idea ? [idea] : []
  })
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeBackupEvents(value: unknown): CalendarEvent[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRecord).map((row) => ({
    ...row,
    id: typeof row.id === 'string' ? row.id : '',
    title: typeof row.title === 'string' ? row.title : '',
    start_at: typeof row.start_at === 'string' ? row.start_at : '',
    created_at: typeof row.created_at === 'string' ? row.created_at : '',
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : '',
    remind_offsets_min: Array.isArray(row.remind_offsets_min)
      ? row.remind_offsets_min.filter((minute): minute is number => typeof minute === 'number' && Number.isFinite(minute))
      : undefined,
  }))
}

function normalizeBackupWatchMovies(value: unknown): WatchMovie[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRecord).map((row) => ({
    ...row,
    id: typeof row.id === 'string' ? row.id : '',
    title: typeof row.title === 'string' ? row.title : '',
    lists: Array.isArray(row.lists)
      ? row.lists.filter((list): list is 'watch' | 'favorite' => list === 'watch' || list === 'favorite')
      : [],
    genres: Array.isArray(row.genres) ? row.genres.filter((genre): genre is string => typeof genre === 'string') : [],
    created_at: typeof row.created_at === 'string' ? row.created_at : '',
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : '',
  }))
}

function normalizeBackupWatchedMovies(value: unknown): WatchedMovie[] {
  if (!Array.isArray(value)) return []
  return value.filter(isRecord).map((row) => ({
    ...row,
    id: typeof row.id === 'string' ? row.id : '',
    title: typeof row.title === 'string' ? row.title : '',
    watched_at: typeof row.watched_at === 'string' ? row.watched_at : '',
    from_watchlist: true,
    genres: Array.isArray(row.genres) ? row.genres.filter((genre): genre is string => typeof genre === 'string') : [],
  }))
}

function normalizeBackupPacks(value: unknown): KnowledgePack[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value
    .filter(isRecord)
    .map((row) => {
      const pack = normalizePack({
        ...row,
        topic: typeof row.topic === 'string' ? row.topic : '',
        title: typeof row.title === 'string' ? row.title : undefined,
        summary: typeof row.summary === 'string' ? row.summary : '',
        aliases: Array.isArray(row.aliases)
          ? row.aliases.filter((alias): alias is string => typeof alias === 'string')
          : [],
        claims: Array.isArray(row.claims)
          ? row.claims
              .filter(isRecord)
              .map((claim) => ({
                ...claim,
                id: typeof claim.id === 'string' ? claim.id : '',
                text: typeof claim.text === 'string' ? claim.text : '',
                source_urls: Array.isArray(claim.source_urls)
                  ? claim.source_urls.filter((url): url is string => typeof url === 'string')
                  : [],
                user_ok: claim.user_ok !== false,
              }))
          : [],
        sources: Array.isArray(row.sources)
          ? row.sources.filter(isRecord).map((source) => ({
              title: typeof source.title === 'string' ? source.title : '',
              url: typeof source.url === 'string' ? source.url : '',
              snippet: typeof source.snippet === 'string' ? source.snippet : '',
              provider: typeof source.provider === 'string' ? source.provider : '',
              retrieved_at: typeof source.retrieved_at === 'string' ? source.retrieved_at : '',
            }))
          : [],
        links: Array.isArray(row.links) ? row.links.filter((link): link is string => typeof link === 'string') : [],
      })
      return {
        ...pack,
        id: typeof row.id === 'string' && row.id ? row.id : pack.id,
        taught_at: typeof row.taught_at === 'string' ? row.taught_at : pack.taught_at,
        updated_at: typeof row.updated_at === 'string' ? row.updated_at : pack.updated_at,
      }
    })
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
  const events = await listEvents()
  const backup: HausBackup = {
    backup_version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    stand_at: standAt(),
    settings,
    memory: await listMemory(),
    reminders: await listReminders(),
    events,
    notes: await listNotes(),
    todos: await listTodos(),
    ideas: await listIdeas(),
    plans: await listPlans(),
    portfolio: await listPortfolio(),
    drafts: await getAll<Draft>('drafts'),
    watch_movies: await listWatchMovies(),
    watched_movies: await listWatchedMovies(),
    shopping: await listShopping(),
    shopping_lists: await listShoppingLists(),
    price_watches: await listPriceWatches(),
    knowledge_packs: await listKnowledgePacks(),
    memory_proposals: await getAll<MemoryProposal>('memory_proposals').catch(() => []),
    conversations,
    messages,
    calendar_ics: eventsToIcs(events),
  }
  backup.sync_revision = await revisionFor(backup)
  return backup
}

export async function applyBackup(data: HausBackup): Promise<string> {
  const next = {
    ...DEFAULT_SETTINGS,
    ...stripSettings({ ...data.settings }),
  }
  const geminiWasOff = Boolean(next.gemini_api_key.trim()) && !next.gemini_enabled
  if (next.gemini_api_key.trim()) next.gemini_enabled = true
  saveSettings(next)
  const memory = (data.memory || []).filter((row) => !isImportJunkMemory(row))
  await replaceStore('memory', memory)
  await replaceStore('reminders', data.reminders || [])
  await replaceStore('events', data.events || [])
  await replaceStore('notes', data.notes || [])
  await replaceStore('todos', data.todos || [])
  await replaceStore('ideas', data.ideas || [])
  if (data.plans) {
    await replaceStore('plans', data.plans)
    const id = String(next.ablauf_id || '')
    if (id && !data.plans.some((row) => row.id === id)) {
      next.ablauf_id = ''
      next.ablauf_status = ''
      saveSettings({ ablauf_id: '', ablauf_status: '' })
    }
  }
  if (data.portfolio) {
    await replaceStore('portfolio', data.portfolio)
    await mirrorPortfolio(data.portfolio)
  }
  if (data.drafts) {
    const rows = data.drafts.filter((row) => row && typeof row.id === 'string' && row.id)
    await replaceStore('drafts', rows)
    const shown = String(loadSettings().entwurf_id || '')
    if (shown && !rows.some((row) => row.id === shown)) {
      saveSettings({ entwurf_id: '', entwurf_status: '' })
    }
  }
  await replaceStore('watch_movies', data.watch_movies || [])
  await replaceStore('watched_movies', data.watched_movies || [])
  await replaceStore('shopping', data.shopping || [])
  if (data.shopping_lists?.length) {
    await replaceStore('shopping_lists', data.shopping_lists)
  } else {
    await replaceStore('shopping_lists', [])
  }
  await listShoppingLists()
  if (data.price_watches) await replaceStore('price_watches', data.price_watches)
  if (data.knowledge_packs) await replaceStore('knowledge_packs', data.knowledge_packs)
  await replaceStore('memory_proposals', data.memory_proposals || [])
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
    const { cancelEventNotifies, scheduleEventNotifies } = await import('./calendar.ts')
    for (const ev of data.events || []) {
      await cancelEventNotifies(ev)
      await scheduleEventNotifies(ev)
    }
  } catch {
    /* */
  }
  saveSettings({ last_backup_at: new Date().toISOString() })
  return geminiWasOff
    ? 'Hausstand liegt. Gemini-Key war aus — jetzt an. Erinnerungen und Termine neu gesetzt. Keys sind in der Datei — nicht teilen.'
    : 'Hausstand liegt. Erinnerungen und Termine neu gesetzt. Keys sind in der Datei — nicht teilen.'
}

export type ImportChoice = { kind: 'haus'; data: HausBackup } | { kind: 'ics'; events: CalendarEvent[] }

export function parseImportPayload(raw: string, filename = ''): ImportChoice | null {
  const text = String(raw || '').trim()
  if (!text) return null
  const namedJson = /\.json$/i.test(filename) || text.startsWith('{')
  if (namedJson) {
    try {
      const data = asBackup(JSON.parse(text) as unknown)
      if (data) return { kind: 'haus', data }
    } catch {
      /* keine JSON-Datei, dann ICS */
    }
  }
  if (looksLikeIcs(text) || /\.ics$/i.test(filename)) {
    return { kind: 'ics', events: icsToEvents(text) }
  }
  try {
    const data = asBackup(JSON.parse(text) as unknown)
    return data ? { kind: 'haus', data } : null
  } catch {
    return null
  }
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

export function parseBackupIntent(text: string): 'export' | 'import' | 'offer' | 'scan' | 'sync_unavailable' | null {
  const link = parseHausLink(text)
  if (link) return link
  const t = text.trim()
  if (/\b(hausstand|einstellungen)\s+export(?:ieren)?\b/i.test(t) || /^\s*backup\s+export/i.test(t)) return 'export'
  if (/\b(hausstand|einstellungen)\s+import(?:ieren)?\b/i.test(t)) return 'import'
  return null
}

export async function handleBackup(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; blocks?: ChatBlock[] }> {
  const intent = parseBackupIntent(text)
  if (!intent) return { handled: false }
  if (intent === 'sync_unavailable') {
    return {
      handled: true,
      reply:
        'Auf dem Tablet „Tabletmodus an“, dann „Handy koppeln“ und den Code mit „Scanne QR Code“ auf dem Handy scannen. Danach sucht das Handy beim Öffnen den Tablet-Server im WLAN und gleicht den Hausstand ab; der neuere Stand gewinnt. Ohne Kopplung geht es manuell: Einstellungen → Hausstand.',
      tool: { tool_status: 'executed', tool: 'backup', action: 'sync_unavailable', label: 'Hausstand' },
    }
  }
  if (intent === 'scan') {
    openHausScan()
    return {
      handled: true,
      reply: 'Scanner ist offen. Den Code auf dem anderen Gerät vor die Kamera.',
      tool: { tool_status: 'executed', tool: 'backup', action: 'scan', label: 'Hausstand' },
    }
  }
  if (intent === 'offer') {
    const data = await buildBackup(false)
    const made = await offerHausQr(JSON.stringify(data))
    return {
      handled: true,
      reply: made.reply,
      blocks: made.blocks,
      tool: { tool_status: 'executed', tool: 'backup', action: 'offer', label: 'Hausstand' },
    }
  }
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
