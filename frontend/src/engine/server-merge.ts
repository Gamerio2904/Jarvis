/** Vereinigt zwei Hausstände. Fehlendes kommt dazu, Vorhandenes bleibt, bis es neuer ist. */

import type { HausBackup } from './backup.ts'
import type { Settings } from './store.ts'

type Row = { id: string; updated_at?: string }

function stamp(row: Row): number {
  const at = Date.parse(row.updated_at || '')
  return Number.isFinite(at) ? at : 0
}

export function mergeRows<T extends Row>(local: T[] | undefined, remote: T[] | undefined): T[] {
  const map = new Map<string, T>()
  for (const row of local || []) {
    if (row?.id) map.set(row.id, row)
  }
  for (const row of remote || []) {
    if (!row?.id) continue
    const have = map.get(row.id)
    if (!have || stamp(row) > stamp(have)) map.set(row.id, row)
  }
  return [...map.values()]
}

function fillSettings(
  local: Partial<Settings>,
  remote: Partial<Settings>,
  localStand = '',
  remoteStand = '',
): Partial<Settings> {
  const out: Partial<Settings> = { ...local }
  const bag = out as Record<string, unknown>
  const remoteNewer = Date.parse(remoteStand || '') > Math.max(Date.parse(localStand || ''), 0)
  for (const [key, value] of Object.entries(remote)) {
    if (key === 'sync_token' || key === 'sync_url' || key === 'sync_fingerprint') continue
    if (typeof value !== 'string' || !value.trim()) continue
    const current = bag[key]
    // Startbildschirm mit Ordner-Layout reist mit dem Abgleich: der Stand mit
    // dem neueren Hausstand bestimmt das Layout, nicht die Zufallslage.
    if (key === 'home_layout_json') {
      const localEmpty = !(typeof current === 'string' && current.trim())
      if (localEmpty || remoteNewer) bag[key] = value
      continue
    }
    if (typeof current === 'string' && !current.trim()) bag[key] = value
  }
  return out
}

export type MergeReport = { backup: HausBackup; added: number }

export function mergeHaus(local: HausBackup, remote: HausBackup): MergeReport {
  const before = new Set<string>()
  const lists = [
    local.memory, local.reminders, local.events, local.notes, local.todos, local.todo_lists,
    local.ideas, local.plans, local.portfolio, local.drafts, local.watch_movies, local.watched_movies,
    local.shopping, local.shopping_lists, local.price_watches, local.knowledge_packs,
    local.memory_proposals, local.conversations, local.messages,
  ]
  for (const list of lists) {
    for (const row of list || []) if (row?.id) before.add(row.id)
  }
  if (local.library) for (const row of local.library) if (row?.id) before.add(row.id)
  const backup: HausBackup = {
    ...local,
    settings: fillSettings(local.settings || {}, remote.settings || {}, local.stand_at || '', remote.stand_at || ''),
    memory: mergeRows(local.memory, remote.memory),
    reminders: mergeRows(local.reminders, remote.reminders),
    events: mergeRows(local.events, remote.events),
    notes: mergeRows(local.notes, remote.notes),
    todos: mergeRows(local.todos, remote.todos),
    todo_lists: mergeRows(local.todo_lists, remote.todo_lists),
    ideas: mergeRows(local.ideas, remote.ideas),
    plans: mergeRows(local.plans, remote.plans),
    portfolio: mergeRows(local.portfolio, remote.portfolio),
    drafts: mergeRows(local.drafts, remote.drafts),
    watch_movies: mergeRows(local.watch_movies, remote.watch_movies),
    watched_movies: mergeRows(local.watched_movies, remote.watched_movies),
    shopping: mergeRows(local.shopping, remote.shopping),
    shopping_lists: mergeRows(local.shopping_lists, remote.shopping_lists),
    price_watches: mergeRows(local.price_watches, remote.price_watches),
    knowledge_packs: mergeRows(local.knowledge_packs, remote.knowledge_packs),
    memory_proposals: mergeRows(local.memory_proposals, remote.memory_proposals),
    conversations: mergeRows(local.conversations, remote.conversations),
    messages: mergeRows(local.messages, remote.messages),
    library: mergeRows(local.library, remote.library),
  }
  let added = 0
  const after = [
    backup.memory, backup.reminders, backup.events, backup.notes, backup.todos, backup.todo_lists,
    backup.ideas, backup.plans, backup.portfolio, backup.drafts, backup.watch_movies, backup.watched_movies,
    backup.shopping, backup.shopping_lists, backup.price_watches, backup.knowledge_packs,
    backup.memory_proposals, backup.conversations, backup.messages,
    backup.library,
  ]
  for (const list of after) {
    for (const row of list || []) if (row?.id && !before.has(row.id)) added += 1
  }
  return { backup, added }
}
