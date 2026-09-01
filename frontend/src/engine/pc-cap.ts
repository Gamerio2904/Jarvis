/** PC Capability-Levels + Action-Verify. JPEG ist kein Klick-Beweis. Kein WebRTC. */

export type PcLevel = 'offline' | 'status' | 'screen' | 'input' | 'files' | 'ground'

export type PcCap = 'status' | 'screen' | 'launch' | 'click' | 'move' | 'type' | 'key' | 'files' | 'ground'

export type PcCaps = {
  level: PcLevel
  reached: boolean
  caps: PcCap[]
  vision: 'ready' | 'off' | 'missing' | 'loading' | 'error'
}

export type PcActionObs = {
  action?: string
  reached?: boolean
  level?: string
  can?: boolean
  ok?: boolean
  started?: boolean
  name?: string
  path?: string
  pid?: number | string
  sent?: boolean
  proved?: boolean
  image?: unknown
  vision?: string
  entries?: unknown
}

const ALL_CAPS: PcCap[] = ['status', 'screen', 'launch', 'click', 'move', 'type', 'key', 'files', 'ground']

const INPUT_CAPS: PcCap[] = ['launch', 'click', 'move', 'type', 'key']

const KNOWN_LAUNCH =
  /^(?:fifa|ea\s*sports\s*fc|ea\s*fc|notepad|editor|explorer(?:\.exe)?|calc(?:ulator)?|rechner)$/i

export function isKnownLaunch(query: string): boolean {
  return KNOWN_LAUNCH.test(String(query || '').trim())
}

export function needsLaunchConfirm(query: string): boolean {
  const q = String(query || '').trim()
  return Boolean(q) && !isKnownLaunch(q)
}

export const CLICK_SENT =
  'Klick gesendet. Ob der Zug gilt, sehe ich erst auf dem nächsten Bild.'

export const LAUNCH_ARRIVED =
  'Startbefehl angekommen. Ob das Fenster vorn ist, sehe ich nur auf dem Bildschirm.'

function uniqCaps(list: PcCap[]): PcCap[] {
  const seen = new Set<PcCap>()
  const out: PcCap[] = []
  for (const c of list) {
    if (seen.has(c)) continue
    seen.add(c)
    out.push(c)
  }
  return out
}

function normalizeCapList(raw: unknown): PcCap[] {
  if (!Array.isArray(raw)) return []
  const out: PcCap[] = []
  for (const item of raw) {
    const s = String(item || '')
      .toLowerCase()
      .trim()
    if (s === 'input') {
      out.push(...INPUT_CAPS)
      continue
    }
    if ((ALL_CAPS as string[]).includes(s)) out.push(s as PcCap)
  }
  return uniqCaps(out)
}

export function levelFromCaps(caps: PcCap[], reached: boolean): PcLevel {
  if (!reached) return 'offline'
  if (caps.includes('ground')) return 'ground'
  if (caps.includes('files')) return 'files'
  if (caps.some((c) => INPUT_CAPS.includes(c))) return 'input'
  if (caps.includes('screen')) return 'screen'
  if (caps.includes('status')) return 'status'
  return 'status'
}

function asVision(raw: unknown): PcCaps['vision'] | undefined {
  const v = String(raw || '')
  if (v === 'ready' || v === 'off' || v === 'missing' || v === 'loading' || v === 'error') return v
  return undefined
}

export function parsePcCaps(statusJson: Record<string, unknown> | null | undefined): PcCaps {
  if (!statusJson || statusJson.ok === false) {
    return { level: 'offline', reached: false, caps: [], vision: 'missing' }
  }
  const vision = asVision(statusJson.vision)
  const listed = normalizeCapList(statusJson.capabilities ?? statusJson.caps)
  if (listed.length) {
    const caps = listed.includes('status') ? listed : uniqCaps(['status', ...listed])
    if (vision === 'ready' && !caps.includes('ground')) caps.push('ground')
    return { level: levelFromCaps(caps, true), reached: true, caps, vision: vision || 'off' }
  }

  const screen = statusJson.screen as { width?: number } | undefined
  const hasScreen = Boolean(screen && (screen.width || Object.keys(screen).length))
  const inferred: PcCap[] = ['status']
  if (hasScreen) inferred.push('screen')
  const app = String(statusJson.app || '')
  if (/jarvispc/i.test(app) || hasScreen) inferred.push(...INPUT_CAPS, 'files')
  if (vision === 'ready') inferred.push('ground')
  const caps = uniqCaps(inferred)
  return { level: levelFromCaps(caps, true), reached: true, caps, vision: vision || 'off' }
}

export function pcCan(caps: PcCaps, action: PcCap): boolean {
  return Boolean(caps.reached && caps.caps.includes(action))
}

function hasImage(obs: PcActionObs): boolean {
  const img = obs.image
  if (typeof img === 'string') return img.length >= 32
  return Boolean(img)
}

function launchProof(obs: PcActionObs): boolean {
  if (obs.started === true) return true
  const pid = Number(obs.pid)
  if (Number.isFinite(pid) && pid > 0) return true
  return Boolean(String(obs.name || '').trim())
}

export function pcActionVerified(obs: PcActionObs): { ok: boolean; error?: string } {
  if (!obs || obs.reached === false) return { ok: false, error: 'PC nicht erreicht.' }
  if (obs.can === false) return { ok: false, error: 'Diese Fähigkeit hat der Agent nicht.' }
  const action = String(obs.action || '')
  if (!action) return { ok: false, error: 'Keine PC-Aktion.' }

  if (action === 'status') {
    return obs.ok === true ? { ok: true } : { ok: false, error: 'PC nicht erreicht.' }
  }

  if (action === 'screen') {
    if (!hasImage(obs)) return { ok: false, error: 'Kein JPEG.' }
    return { ok: true }
  }

  if (action === 'launch') {
    if (obs.ok !== true) return { ok: false, error: 'Start nicht angekommen.' }
    if (!launchProof(obs)) return { ok: false, error: 'Kein Start-Beweis.' }
    return { ok: true }
  }

  if (action === 'click') {
    if (obs.sent !== true && obs.ok !== true) return { ok: false, error: 'Klick nicht gesendet.' }
    return { ok: true }
  }

  if (action === 'move' || action === 'type' || action === 'key') {
    if (obs.ok !== true && obs.sent !== true) return { ok: false, error: 'Eingabe nicht angekommen.' }
    return { ok: true }
  }

  if (action === 'files') {
    if (obs.ok !== true) return { ok: false, error: 'Datei-Befehl nicht angekommen.' }
    return { ok: true }
  }

  if (action === 'ground') {
    if (obs.vision !== 'ready') return { ok: false, error: 'Sehen am PC ist aus.' }
    return { ok: true }
  }

  if (action === 'ask') return { ok: false, error: 'Wartet auf Bestätigung.' }

  return { ok: false, error: 'Unbekannte PC-Aktion.' }
}

export function launchArrivedReply(name?: string): string {
  const n = String(name || '').trim()
  if (!n) return LAUNCH_ARRIVED
  return `Startbefehl angekommen (${n}). Ob das Fenster vorn ist, sehe ich nur auf dem Bildschirm.`
}

export const CAP_OFFLINE = 'PC nicht erreicht. JarvisPC.bat muss laufen.'

export function capMissingReply(action: PcCap): string {
  if (action === 'ground') {
    return 'Sehen am PC ist aus. LocateAnything (JarvisSee auf der RTX) läuft nicht. Nichts eingezeichnet, nichts angeklickt.'
  }
  if (action === 'screen') return 'Kein JPEG. JarvisPC.bat muss laufen.'
  if (action === 'launch') return 'Der Agent startet hier keine Programme. JarvisPC.bat muss laufen.'
  if (action === 'files') return 'Ordner nur, wenn der Agent Dateien kann.'
  if (action === 'click' || action === 'move' || action === 'type' || action === 'key') {
    return 'Eingabe nur, wenn der Agent Maus und Tastatur kann.'
  }
  return CAP_OFFLINE
}
