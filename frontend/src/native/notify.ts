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

const browserTimers = new Map<number, number>()

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
  if (native) {
    try {
      return await native.schedule({
        id: opts.id,
        title: opts.title,
        body: opts.body,
        atMs,
        alarm: opts.alarm !== false,
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
    return fireNow(opts.title, opts.body)
  }
  if (browserTimers.has(opts.id)) window.clearTimeout(browserTimers.get(opts.id))
  const wait = Math.min(atMs - Date.now(), 2_147_000_000)
  const handle = window.setTimeout(() => {
    browserTimers.delete(opts.id)
    void fireNow(opts.title, opts.body)
  }, wait)
  browserTimers.set(opts.id, handle)
  return { ok: true }
}

export async function cancelNotify(id: number): Promise<void> {
  if (native) {
    try {
      await native.cancel({ id })
    } catch {
      /* ignore */
    }
    return
  }
  const handle = browserTimers.get(id)
  if (handle) {
    window.clearTimeout(handle)
    browserTimers.delete(id)
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
