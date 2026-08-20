import { Capacitor, registerPlugin } from '@capacitor/core'
import { withTimeout } from './with-timeout'

type CompassHit = { ok: boolean; heading?: number; label?: string; message?: string }

type NativeDevice = {
  battery(): Promise<{ ok: boolean; percent?: number; charging?: boolean; message?: string }>
  network(): Promise<{
    ok: boolean
    online?: boolean
    wifi?: boolean
    cellular?: boolean
    message?: string
  }>
  steps(): Promise<{ ok: boolean; count?: number; sinceBoot?: boolean; message?: string }>
  pressure(): Promise<{ ok: boolean; hpa?: number; message?: string }>
  compass(): Promise<CompassHit>
  startCompass(): Promise<{ ok: boolean; message?: string }>
  stopCompass(): Promise<{ ok: boolean }>
  addListener(event: 'compassHeading', cb: (hit: CompassHit) => void): Promise<{ remove: () => Promise<void> }>
  torch(opts: { on: boolean }): Promise<{ ok: boolean; on?: boolean; message?: string }>
  openPage(opts: { page: string }): Promise<{ ok: boolean; message?: string }>
  dial(opts: { number: string }): Promise<{ ok: boolean; message?: string }>
  sms(opts: { number: string; body?: string }): Promise<{ ok: boolean; message?: string }>
  callNow(opts: { number: string }): Promise<{ ok: boolean; needPerm?: boolean; message?: string }>
  sendSms(opts: { number: string; body: string }): Promise<{ ok: boolean; needPerm?: boolean; message?: string }>
  saveDownload(opts: { name: string; text: string }): Promise<{ ok: boolean; message?: string }>
  takePhoto(): Promise<{ ok: boolean; dataUrl?: string; message?: string }>
  setDebugHold(opts: { on: boolean }): Promise<{ ok: boolean; on?: boolean }>
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

export async function readSteps(): Promise<{
  ok: boolean
  count?: number
  sinceBoot?: boolean
  message?: string
}> {
  if (native) {
    try {
      return await withTimeout(native.steps(), 6_000, {
        ok: false,
        message: 'Schrittzähler nicht lesbar. Recht fehlt oder kein Sensor. Keine Diagnose.',
      })
    } catch {
      return { ok: false, message: 'Schrittzähler nicht lesbar. Recht fehlt oder kein Sensor. Keine Diagnose.' }
    }
  }
  return { ok: false, message: 'Schrittzähler nur auf dem Handy. Keine Diagnose.' }
}

export async function readPressure(): Promise<{ ok: boolean; hpa?: number; message?: string }> {
  if (native) {
    try {
      return await withTimeout(native.pressure(), 5_000, {
        ok: false,
        message: 'Luftdruck nicht lesbar. Kein Barometer oder kein Zugriff.',
      })
    } catch {
      return { ok: false, message: 'Luftdruck nicht lesbar. Kein Barometer oder kein Zugriff.' }
    }
  }
  return { ok: false, message: 'Luftdruck nur auf dem Handy.' }
}

function compassLabel(deg: number): string {
  const names = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW']
  const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return names[i]
}

export function compassWord(deg: number): string {
  const names = ['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten']
  const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return names[i]
}

export async function readCompass(): Promise<{
  ok: boolean
  heading?: number
  label?: string
  message?: string
}> {
  if (native) {
    try {
      const hit = await withTimeout(native.compass(), 5_000, {
        ok: false,
        message: 'Kompass nicht lesbar. Kein Magnetometer oder Störung.',
      })
      if (hit.ok && hit.heading != null && !hit.label) {
        return { ...hit, label: compassLabel(hit.heading) }
      }
      return hit
    } catch {
      return { ok: false, message: 'Kompass nicht lesbar. Kein Magnetometer oder Störung.' }
    }
  }
  return { ok: false, message: 'Kompass nur auf dem Handy.' }
}

export function watchCompass(onHit: (hit: CompassHit) => void): () => void {
  let dead = false
  const emit = (hit: CompassHit) => {
    if (dead) return
    if (hit.ok && hit.heading != null) {
      onHit({ ...hit, label: compassWord(hit.heading) })
      return
    }
    onHit(hit)
  }
  if (native) {
    let handle: { remove: () => Promise<void> } | null = null
    void native
      .addListener('compassHeading', emit)
      .then((h) => {
        if (dead) {
          void h.remove()
          return
        }
        handle = h
      })
    void native.startCompass().then((r) => {
      if (!r.ok && r.message) emit({ ok: false, message: r.message })
    })
    return () => {
      dead = true
      void handle?.remove()
      void native.stopCompass()
    }
  }
  const onOri = (e: DeviceOrientationEvent) => {
    const web = e as DeviceOrientationEvent & { webkitCompassHeading?: number }
    const raw = web.webkitCompassHeading ?? (typeof e.alpha === 'number' ? 360 - e.alpha : null)
    if (raw == null || !Number.isFinite(raw)) {
      emit({ ok: false, message: 'Kompass nur auf dem Handy.' })
      return
    }
    const heading = ((raw % 360) + 360) % 360
    emit({ ok: true, heading, label: compassWord(heading) })
  }
  window.addEventListener('deviceorientation', onOri)
  return () => {
    dead = true
    window.removeEventListener('deviceorientation', onOri)
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

export async function saveDownloadFile(
  name: string,
  text: string,
): Promise<{ ok: boolean; message?: string }> {
  const file = name.replace(/[/\\]/g, '-').trim()
  if (!file || !text) return { ok: false, message: 'Keine Datei.' }
  if (native) {
    try {
      return await withTimeout(native.saveDownload({ name: file, text }), 20_000, {
        ok: false,
        message: 'Download nicht geschrieben.',
      })
    } catch {
      return { ok: false, message: 'Download nicht geschrieben.' }
    }
  }
  return { ok: false, message: '' }
}

export async function takeNativePhoto(): Promise<{ ok: boolean; dataUrl?: string; message?: string }> {
  if (!native) return { ok: false, message: '' }
  try {
    return await withTimeout(native.takePhoto(), 120_000, {
      ok: false,
      message: 'Kamera zu langsam oder abgebrochen.',
    })
  } catch {
    return { ok: false, message: 'Kamera nicht geöffnet.' }
  }
}

export async function setDebugHold(on: boolean): Promise<void> {
  if (!native) return
  try {
    await native.setDebugHold({ on })
  } catch {
    /* ignore */
  }
}
