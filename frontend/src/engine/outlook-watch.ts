import { loadSettings, saveSettings } from './store.ts'
import { notifyIdFromKey, requestNotifyPermission, scheduleNotify } from '../native/notify.ts'
import { loadOutlookSnap, outlookFingerprint, outlookNotifyLine } from './outlook.ts'

/** Weltlage-Watch: Banner, nie Wecker-GUI, nie raiseInterrupt, Kugel nur auf Befehl. */
export const OUTLOOK_WATCH_ALARM = false

let lastTick = 0
const MIN_GAP_MS = 20 * 60_000

export async function tickOutlookWatch(force = false): Promise<void> {
  const s = loadSettings()
  if (!s.outlook_watch) return
  const now = Date.now()
  if (!force && now - lastTick < MIN_GAP_MS) return
  lastTick = now
  const snap = await loadOutlookSnap('watch')
  const fp = outlookFingerprint(snap)
  if (!fp) return
  const prev = (s.last_outlook_notified || '').trim()
  if (!prev) {
    saveSettings({ last_outlook_notified: fp })
    return
  }
  if (fp === prev) return
  const prevUrls = urlsFromNotified(prev)
  const nextUrls = snap.news.map((n) => n.url).filter(Boolean)
  const added = nextUrls.filter((u) => u && !prevUrls.has(u))
  saveSettings({ last_outlook_notified: fp })
  if (!s.outlook_interrupt) return
  if (!added.length) return
  const ok = await requestNotifyPermission()
  if (!ok) return
  await scheduleNotify({
    id: notifyIdFromKey('outlook-watch'),
    title: 'Weltlage',
    body: outlookNotifyLine(snap).slice(0, 180),
    at: new Date(Date.now() + 400),
    alarm: OUTLOOK_WATCH_ALARM,
  })
}

function urlsFromNotified(fp: string): Set<string> {
  const left = (fp || '').split('#')[0] || ''
  return new Set(left.split('|').filter(Boolean))
}
