import { Capacitor, registerPlugin } from '@capacitor/core'

type NativeNotify = {
  requestPermission(): Promise<{ granted: boolean }>
  schedule(opts: {
    id: number
    title: string
    body: string
    atMs: number
    alarm?: boolean
    recur?: string
    tone?: string
    mode?: string
    say?: string
  }): Promise<{ ok: boolean; message?: string }>
  cancel(opts: { id: number }): Promise<{ ok: boolean }>
  publishGlance(opts: { next: string; weather: string }): Promise<{ ok: boolean }>
  pickTone(): Promise<{ ok: boolean; uri?: string; name?: string; message?: string }>
  listTones(): Promise<{ ok: boolean; tones?: Array<{ uri: string; name: string }> }>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeNotify>('JarvisNotify') : null

const browserTimers = new Map<number, ReturnType<typeof setTimeout>>()
const firedIds = new Set<number>()

/** setTimeout kippt jenseits von ~24 Tagen in einen sofortigen Lauf. */
const MAX_TIMEOUT_MS = 2_147_000_000

/**
 * Auf Android ist der native Alarm die Wahrheit; der In-App-Timer deckt nur die
 * Minuten ab, in denen die App vorne steht. Im Browser gibt es nichts anderes,
 * dort trägt er die ganze Frist.
 */
function inAppWindowMs(): number {
  return native ? 15 * 60_000 : MAX_TIMEOUT_MS
}

/**
 * Android hält Alarme im System, auch wenn die App tot ist. Der Browser kann das
 * nicht — dort stirbt jede Frist mit dem Tab. Wer eine verpasste Frist nachholen
 * will, muss diesen Unterschied kennen, sonst klingelt der Alarm zweimal.
 */
export function hasNativeAlarms(): boolean {
  return native !== null
}

function clearInApp(id: number): void {
  const handle = browserTimers.get(id)
  if (handle !== undefined) clearTimeout(handle)
  browserTimers.delete(id)
}

/**
 * Ein Timer im laufenden Fenster. Er weckt `jarvis-timer-fire`, damit der Chip
 * im Composer reagiert — vorher überschrieb der Web-Zweig diesen Timer sofort
 * mit einem stillen zweiten, und das Ereignis kam dort nie an.
 */
function armInAppTimer(id: number, atMs: number, title: string, body: string): void {
  const wait = atMs - Date.now()
  if (wait < 800 || wait > inAppWindowMs()) return
  clearInApp(id)
  const handle = setTimeout(() => {
    browserTimers.delete(id)
    if (firedIds.has(id)) return
    firedIds.add(id)
    void fireNow(title, body)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jarvis-timer-fire', { detail: { id, title, body } }))
    }
  }, wait)
  browserTimers.set(id, handle)
}

export function notifyIdFromKey(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i += 1) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0
  return (Math.abs(h) % 1_999_999_999) + 1
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (native) {
    try {
      const res = await native.requestPermission()
      return Boolean(res.granted)
    } catch {
      return false
    }
  }
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const perm = await Notification.requestPermission()
    return perm === 'granted'
  } catch {
    return false
  }
}

export async function scheduleNotify(opts: {
  id: number
  title: string
  body: string
  at: Date
  alarm?: boolean
  recur?: string
  tone?: string
  mode?: 'ring' | 'speak'
  say?: string
}): Promise<{ ok: boolean; message?: string }> {
  const atMs = opts.at.getTime()
  if (!Number.isFinite(atMs)) return { ok: false, message: 'Ungültige Zeit.' }
  firedIds.delete(opts.id)
  armInAppTimer(opts.id, atMs, opts.title, opts.body)
  if (native) {
    try {
      return await native.schedule({
        id: opts.id,
        title: opts.title,
        body: opts.body,
        atMs,
        alarm: opts.alarm === true,
        recur: opts.recur || '',
        tone: opts.tone || '',
        mode: opts.mode || '',
        say: opts.say || '',
      })
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : 'Notification fehlgeschlagen' }
    }
  }
  if (atMs <= Date.now() + 5_000) {
    firedIds.add(opts.id)
    return fireNow(opts.title, opts.body)
  }
  // `armInAppTimer` hat die Frist schon übernommen.
  return { ok: browserTimers.has(opts.id), message: browserTimers.has(opts.id) ? undefined : 'Frist zu lang für die App.' }
}

export async function cancelNotify(id: number): Promise<void> {
  // Immer aufräumen: auf Android laufen nativer Alarm und In-App-Timer parallel.
  clearInApp(id)
  firedIds.delete(id)
  if (!native) return
  try {
    await native.cancel({ id })
  } catch {
    /* ignore */
  }
}

export async function pickAlarmTone(): Promise<{ ok: boolean; uri?: string; name?: string; message?: string }> {
  if (!native) return { ok: false, message: 'Tonwahl nur in der Android-App.' }
  try {
    return await native.pickTone()
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Tonwahl fehlgeschlagen' }
  }
}

export async function listAlarmTones(): Promise<Array<{ uri: string; name: string }>> {
  if (!native) return []
  try {
    const res = await native.listTones()
    return res.tones || []
  } catch {
    return []
  }
}

export async function publishGlance(opts: { next: string; weather: string }): Promise<void> {
  if (!native) return
  try {
    await native.publishGlance(opts)
  } catch {
    /* ignore */
  }
}

async function fireNow(title: string, body: string): Promise<{ ok: boolean; message?: string }> {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body })
      return { ok: true }
    }
  } catch {
    /* ignore */
  }
  return { ok: true, message: 'Zeit erreicht, Anzeige nur mit Notification-Recht.' }
}
