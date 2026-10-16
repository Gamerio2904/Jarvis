import { loadSettings, saveSettings } from './store.ts'
import { loadOutlookSnap, outlookFingerprint } from './outlook.ts'

/** Weltlage-Watch merkt sich den Stand, schickt aber keine Benachrichtigung. */
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
  saveSettings({ last_outlook_notified: fp })
}
