/** Vereinigt zwei Hausstände. Fehlendes kommt dazu, Vorhandenes bleibt, bis es neuer ist.
 *  Grabsteine (sync_tombstones_json) reisen mit: Gelöschtes bleibt gelöscht (B6),
 *  Settings mit Zeitstempel gewinnen nach jüngster Änderung (B11). */

import type { HausBackup } from './backup.ts'
import type { Settings } from './store.ts'

type Row = { id: string; updated_at?: string; deleted_at?: string }

function stamp(row: Row): number {
  const at = Date.parse(row.updated_at || '')
  return Number.isFinite(at) ? at : 0
}

export function mergeRows<T extends Row>(local: T[] | undefined, remote: T[] | undefined, tombstones?: Map<string, number>): T[] {
  const map = new Map<string, T>()
  for (const row of local || []) {
    if (!row?.id) continue
    // Lokal gelöscht und der Grabstein jünger als der Remote-Stand → weg bleibt weg.
    if (tombstones && tombstones.get(row.id)! > stamp(row)) continue
    map.set(row.id, row)
  }
  for (const row of remote || []) {
    if (!row?.id) continue
    // Vom anderen Gerät gelöscht (Grabstein-Zeile oder lokal gegrabsteinter Id).
    if (row.deleted_at) continue
    if (tombstones && tombstones.get(row.id)! > stamp(row)) continue
    const have = map.get(row.id)
    if (!have || stamp(row) > stamp(have)) map.set(row.id, row)
  }
  return [...map.values()]
}

const SKIP_SETTING_KEYS = new Set(['sync_token', 'sync_url', 'sync_fingerprint'])

function fillSettings(
  local: Partial<Settings>,
  remote: Partial<Settings>,
  localStand = '',
  remoteStand = '',
): Partial<Settings> {
  const out: Partial<Settings> = { ...local }
  const bag = out as Record<string, unknown>
  const remoteNewer = Date.parse(remoteStand || '') > Math.max(Date.parse(localStand || ''), 0)
  let localStamps: Record<string, string> = {}
  let remoteStamps: Record<string, string> = {}
  try {
    localStamps = JSON.parse((local.settings_stamps_json as string) || '{}') as Record<string, string>
    remoteStamps = JSON.parse((remote.settings_stamps_json as string) || '{}') as Record<string, string>
  } catch {
    /* keine Stempel — altes Verhalten */
  }
  const stampOf = (map: Record<string, string>, key: string): number => {
    const at = Date.parse(map[key] || '')
    return Number.isFinite(at) ? at : 0
  }
  for (const [key, value] of Object.entries(remote)) {
    if (SKIP_SETTING_KEYS.has(key)) continue
    if (key === 'settings_stamps_json' || key === 'sync_tombstones_json') continue
    if (typeof value !== 'string' || !value.trim()) continue
    const current = bag[key]
    // Startbildschirm mit Ordner-Layout reist mit dem Abgleich: der Stand mit
    // dem neueren Hausstand bestimmt das Layout, nicht die Zufallslage.
    if (key === 'home_layout_json') {
      const localEmpty = !(typeof current === 'string' && current.trim())
      if (localEmpty || remoteNewer) bag[key] = value
      continue
    }
    const localEmpty = !(typeof current === 'string' && current.trim())
    if (localEmpty) {
      bag[key] = value
      continue
    }
    // B11: Beide haben etwas — der jüngere „geändert am“-Stempel gewinnt.
    const rStamp = stampOf(remoteStamps, key)
    const lStamp = stampOf(localStamps, key)
    if (rStamp > lStamp) bag[key] = value
  }
  return out
}

/** Grabsteine beider Seiten vereinigen (Feld in den Settings, capped). */
function mergedTombstones(localJson: string | undefined, remoteJson: string | undefined): { rows: Array<{ id: string; at: string }>; json: string } {
  const parse = (raw: string | undefined): Array<{ id: string; at: string }> => {
    try {
      const rows = JSON.parse(raw || '[]') as Array<{ id: string; at: string }>
      return Array.isArray(rows) ? rows.filter((r) => r && typeof r.id === 'string' && typeof r.at === 'string') : []
    } catch {
      return []
    }
  }
  const map = new Map(parse(localJson).map((r) => [r.id, r]))
  for (const row of parse(remoteJson)) {
    const have = map.get(row.id)
    if (!have || Date.parse(row.at) > Date.parse(have.at)) map.set(row.id, row)
  }
  const rows = [...map.values()].sort((a, b) => a.at.localeCompare(b.at)).slice(-400)
  return { rows, json: JSON.stringify(rows) }
}

export type MergeReport = { backup: HausBackup; added: number }

const MERGE_LISTS = [
  'memory', 'reminders', 'events', 'notes', 'todos', 'todo_lists',
  'ideas', 'plans', 'portfolio', 'drafts', 'watch_movies', 'watched_movies',
  'shopping', 'shopping_lists', 'price_watches', 'knowledge_packs',
  'memory_proposals', 'conversations', 'messages',
] as const

export function mergeHaus(local: HausBackup, remote: HausBackup): MergeReport {
  const tomb = mergedTombstones(
    (local.settings as Partial<Settings> | undefined)?.sync_tombstones_json,
    (remote.settings as Partial<Settings> | undefined)?.sync_tombstones_json,
  )
  const tombMap = new Map(tomb.rows.map((r) => [r.id as string, Date.parse(r.at) || 0]))
  const before = new Set<string>()
  const lists = MERGE_LISTS.map((key) => local[key] as unknown[] | undefined)
  for (const list of lists) {
    for (const row of list || []) if (row?.id) before.add((row as { id: string }).id)
  }
  if (local.library) for (const row of local.library) if (row?.id) before.add(row.id)
  const mergedSettings = fillSettings(local.settings || {}, remote.settings || {}, local.stand_at || '', remote.stand_at || '')
  ;(mergedSettings as Record<string, unknown>).sync_tombstones_json = tomb.json
  const settings = { ...mergedSettings } as HausBackup['settings']
  delete (settings as Record<string, unknown>).settings_stamps_json
  const backup: HausBackup = {
    ...local,
    settings,
    memory: mergeRows(local.memory, remote.memory, tombMap),
    reminders: mergeRows(local.reminders, remote.reminders, tombMap),
    events: mergeRows(local.events, remote.events, tombMap),
    notes: mergeRows(local.notes, remote.notes, tombMap),
    todos: mergeRows(local.todos, remote.todos, tombMap),
    todo_lists: mergeRows(local.todo_lists, remote.todo_lists, tombMap),
    ideas: mergeRows(local.ideas, remote.ideas, tombMap),
    plans: mergeRows(local.plans, remote.plans, tombMap),
    portfolio: mergeRows(local.portfolio, remote.portfolio, tombMap),
    drafts: mergeRows(local.drafts, remote.drafts, tombMap),
    watch_movies: mergeRows(local.watch_movies, remote.watch_movies, tombMap),
    watched_movies: mergeRows(local.watched_movies, remote.watched_movies, tombMap),
    shopping: mergeRows(local.shopping, remote.shopping, tombMap),
    shopping_lists: mergeRows(local.shopping_lists, remote.shopping_lists, tombMap),
    price_watches: mergeRows(local.price_watches, remote.price_watches, tombMap),
    knowledge_packs: mergeRows(local.knowledge_packs, remote.knowledge_packs, tombMap),
    memory_proposals: mergeRows(local.memory_proposals, remote.memory_proposals, tombMap),
    conversations: mergeRows(local.conversations, remote.conversations, tombMap),
    messages: mergeRows(local.messages, remote.messages, tombMap),
    library: mergeRows(local.library, remote.library, tombMap),
  }
  let added = 0
  const after = MERGE_LISTS.map((key) => backup[key] as unknown[] | undefined)
  for (const list of after) {
    for (const row of list || []) if (row?.id && !before.has((row as { id: string }).id)) added += 1
  }
  return { backup, added }
}
