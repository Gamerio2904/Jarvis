import { Capacitor, registerPlugin } from '@capacitor/core'
import { withTimeout } from './with-timeout'

type NativeDevice = {
  battery(): Promise<{ ok: boolean; percent?: number; charging?: boolean; message?: string }>
  network(): Promise<{
    ok: boolean
    online?: boolean
    wifi?: boolean
    cellular?: boolean
    message?: string
  }>
  torch(opts: { on: boolean }): Promise<{ ok: boolean; on?: boolean; message?: string }>
  openPage(opts: { page: string }): Promise<{ ok: boolean; message?: string }>
  openApp(opts: { pkg?: string; uri?: string }): Promise<{ ok: boolean; message?: string }>
  dial(opts: { number: string }): Promise<{ ok: boolean; message?: string }>
  sms(opts: { number: string; body?: string }): Promise<{ ok: boolean; message?: string }>
  callNow(opts: { number: string }): Promise<{ ok: boolean; needPerm?: boolean; message?: string }>
  sendSms(opts: { number: string; body: string }): Promise<{ ok: boolean; needPerm?: boolean; message?: string }>
  saveDownload(opts: { name: string; text: string }): Promise<{ ok: boolean; path?: string; message?: string }>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeDevice>('JarvisDevice') : null

export async function readBattery(): Promise<{
  ok: boolean
  percent?: number
  charging?: boolean
  message?: string
}> {
  if (native) {
    try {
      return await withTimeout(native.battery(), 4_000, {
        ok: false,
        message: 'Akku-Stand nicht lesbar.',
      })
    } catch {
      return { ok: false, message: 'Akku-Stand nicht lesbar.' }
    }
  }
  try {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number; charging: boolean }>
    }
    if (!nav.getBattery) return { ok: false, message: 'Akku nur auf dem Handy.' }
    const b = await withTimeout(nav.getBattery(), 3_000, null)
    if (!b) return { ok: false, message: 'Akku-Stand nicht lesbar.' }
    return { ok: true, percent: Math.round(b.level * 100), charging: Boolean(b.charging) }
  } catch {
    return { ok: false, message: 'Akku-Stand nicht lesbar.' }
  }
}

export async function readNetwork(): Promise<{
  ok: boolean
  online?: boolean
  wifi?: boolean
  cellular?: boolean
  message?: string
}> {
  if (native) {
    try {
      return await withTimeout(native.network(), 4_000, {
        ok: false,
        message: 'Verbindung nicht lesbar.',
      })
    } catch {
      return { ok: false, message: 'Verbindung nicht lesbar.' }
    }
  }
  return {
    ok: true,
    online: navigator.onLine,
    wifi: false,
    cellular: false,
  }
}

export async function setTorch(on: boolean): Promise<{ ok: boolean; message?: string }> {
  if (native) {
    try {
      return await withTimeout(native.torch({ on }), 12_000, {
        ok: false,
        message: 'Taschenlampe nicht geschaltet.',
      })
    } catch {
      return { ok: false, message: 'Taschenlampe nicht geschaltet.' }
    }
  }
  return { ok: false, message: 'Taschenlampe nur auf dem Handy.' }
}

export async function openAmazonMusic(): Promise<{ ok: boolean; message?: string }> {
  if (native) {
    try {
      return await withTimeout(native.openApp({ pkg: 'com.amazon.mp3', uri: 'amzn://apps/android?p=com.amazon.mp3' }), 8_000, {
        ok: false,
        message: 'Amazon-Music-App fehlt. Spotify bleibt der Weg in Jarvis.',
      })
    } catch {
      return { ok: false, message: 'Amazon-Music-App fehlt. Spotify bleibt der Weg in Jarvis.' }
    }
  }
  try {
    window.open('https://music.amazon.de', '_blank')
    return { ok: true }
  } catch {
    return { ok: false, message: 'Amazon Music nur auf dem Handy zuverlässig.' }
  }
}

export async function openDevicePage(
  page: 'wifi' | 'bluetooth' | 'dnd' | 'app',
): Promise<{ ok: boolean; message?: string }> {
  if (native) {
    try {
      return await withTimeout(native.openPage({ page }), 8_000, {
        ok: false,
        message: 'Einstellungen nicht geöffnet.',
      })
    } catch {
      return { ok: false, message: 'Einstellungen nicht geöffnet.' }
    }
  }
  return { ok: false, message: 'Einstellungen nur auf dem Handy.' }
}

export async function openExternal(url: string): Promise<{ ok: boolean; message?: string }> {
  const href = url.trim()
  if (!/^https?:\/\//i.test(href)) return { ok: false, message: 'Kein Link.' }
  try {
    window.open(href, Capacitor.isNativePlatform() ? '_system' : '_blank')
    return { ok: true }
  } catch {
    return { ok: false, message: 'Link nicht geöffnet.' }
  }
}

export async function openDialer(number: string): Promise<{ ok: boolean; message?: string }> {
  const n = number.replace(/[^\d+]/g, '')
  if (native) {
    try {
      return await withTimeout(native.dial({ number: n }), 8_000, {
        ok: false,
        message: 'Wählhilfe nicht geöffnet.',
      })
    } catch {
      return { ok: false, message: 'Wählhilfe nicht geöffnet.' }
    }
  }
  try {
    window.open(`tel:${n}`, '_self')
    return { ok: true }
  } catch {
    return { ok: false, message: 'Wählhilfe nicht geöffnet.' }
  }
}

export async function openSms(
  number: string,
  body = '',
): Promise<{ ok: boolean; message?: string }> {
  const n = number.replace(/[^\d+]/g, '')
  if (native) {
    try {
      return await withTimeout(native.sms({ number: n, body }), 8_000, {
        ok: false,
        message: 'SMS-App nicht geöffnet.',
      })
    } catch {
      return { ok: false, message: 'SMS-App nicht geöffnet.' }
    }
  }
  try {
    const q = body ? `?body=${encodeURIComponent(body)}` : ''
    window.open(`sms:${n}${q}`, '_self')
    return { ok: true }
  } catch {
    return { ok: false, message: 'SMS-App nicht geöffnet.' }
  }
}

export async function placeCall(number: string): Promise<{
  ok: boolean
  needPerm?: boolean
  message?: string
}> {
  const n = number.replace(/[^\d+]/g, '')
  if (n.length < 3) return { ok: false, message: 'Keine Nummer.' }
  if (native) {
    try {
      return await withTimeout(native.callNow({ number: n }), 20_000, {
        ok: false,
        message: 'Anruf nicht gestartet.',
      })
    } catch {
      return { ok: false, message: 'Anruf nicht gestartet.' }
    }
  }
  return { ok: false, message: 'Direkt anrufen nur auf dem Handy.' }
}

export async function sendSmsNow(
  number: string,
  body: string,
): Promise<{ ok: boolean; needPerm?: boolean; message?: string }> {
  const n = number.replace(/[^\d+]/g, '')
  const text = body.trim()
  if (n.length < 3) return { ok: false, message: 'Keine Nummer.' }
  if (text.length < 1) return { ok: false, message: 'Kein Text.' }
  if (native) {
    try {
      return await withTimeout(native.sendSms({ number: n, body: text }), 20_000, {
        ok: false,
        message: 'SMS nicht gesendet.',
      })
    } catch {
      return { ok: false, message: 'SMS nicht gesendet.' }
    }
  }
  return { ok: false, message: 'Direkt senden nur auf dem Handy. Ich habe nichts verschickt.' }
}

export async function saveToDownloads(
  name: string,
  text: string,
): Promise<{ ok: boolean; path?: string; message?: string }> {
  const file = name.trim()
  if (!file || !text) return { ok: false, message: 'Kein Dateiname.' }
  if (native) {
    try {
      return await withTimeout(native.saveDownload({ name: file, text }), 45_000, {
        ok: false,
        message: 'Datei nicht in Downloads geschrieben.',
      })
    } catch {
      return { ok: false, message: 'Datei nicht in Downloads geschrieben.' }
    }
  }
  return { ok: false, message: 'Native Downloads nur auf dem Handy.' }
}
