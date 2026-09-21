import { setTorch } from '../native/device.ts'
import { readTorchOn, saveTorchOn } from './agent-session.ts'
import { cancelEventNotifies, eventNotifyId, eventNotifyMinutes, scheduleEventNotifies } from './calendar.ts'
import { notifyIdOf, syncReminderAlarms } from './reminders.ts'
import { cancelNotify } from '../native/notify.ts'
import {
  getAll,
  loadSettings,
  replaceStore,
  saveSettings,
  type CalendarEvent,
  type Reminder,
  type Settings,
} from './store.ts'

const STORES = [
  'reminders',
  'events',
  'shopping',
  'todos',
  'notes',
  'memory',
  'ideas',
  'watch_movies',
  'watched_movies',
  'pending',
  'price_watches',
  'docs',
  'knowledge_packs',
] as const

const FLAG_KEYS: Array<keyof Settings> = [
  'tv_enabled',
  'research_opt_in',
  'tool_propose',
  'hud_accent',
  'drive_speak',
  'globe_webgl',
  'gemini_enabled',
  'pc_enabled',
]

export type HouseSnap = {
  lists: Record<(typeof STORES)[number], unknown[]>
  flags: Partial<Settings>
  torch: boolean
  notifyIds: number[]
}

function notifyIdsFromLists(lists: HouseSnap['lists']): number[] {
  const ids = new Set<number>()
  for (const r of (lists.reminders as Reminder[]) || []) ids.add(notifyIdOf(r))
  for (const e of (lists.events as CalendarEvent[]) || []) {
    for (const m of new Set([0, ...eventNotifyMinutes(e)])) ids.add(eventNotifyId(e.id, m))
  }
  return [...ids]
}

export async function captureHouse(): Promise<HouseSnap> {
  const lists = {} as HouseSnap['lists']
  for (const name of STORES) lists[name] = await getAll(name)
  const s = loadSettings()
  const flags: Partial<Settings> = {}
  for (const k of FLAG_KEYS) (flags as Record<string, unknown>)[k] = s[k]
  return { lists, flags, torch: readTorchOn(), notifyIds: notifyIdsFromLists(lists) }
}

export async function restoreHouse(snap: HouseSnap): Promise<void> {
  const current = {} as HouseSnap['lists']
  for (const name of STORES) current[name] = await getAll(name)
  const extra = notifyIdsFromLists(current).filter((id) => !snap.notifyIds.includes(id))
  for (const id of extra) await cancelNotify(id)
  for (const e of (current.events as CalendarEvent[]) || []) await cancelEventNotifies(e)
  for (const name of STORES) await replaceStore(name, snap.lists[name] || [])
  const patch: Partial<Settings> = {}
  for (const k of FLAG_KEYS) {
    if (k in snap.flags) (patch as Record<string, unknown>)[k] = snap.flags[k]
  }
  if (Object.keys(patch).length) saveSettings(patch)
  await syncReminderAlarms()
  for (const e of (snap.lists.events as CalendarEvent[]) || []) await scheduleEventNotifies(e)
  saveTorchOn(snap.torch)
  await setTorch(snap.torch).catch(() => null)
}
