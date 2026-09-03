import { isAllowedPcHost, sanitizePcHost } from './pc-host.ts'

export const PRESENCE_PORT = 18791
export const PRESENCE_HEADER = 'X-Jarvis-Token'

/** Presence-LAN: 192.168 / 10 / Loopback. Nicht 172, nicht WAN. */
export function isPresenceLan(raw: string): boolean {
  return isAllowedPcHost(raw)
}

export function sanitizePresenceHost(raw: string): string {
  return sanitizePcHost(raw)
}

export function newPresenceToken(): string {
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes)
  else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function tokensMatch(expected: string, given: string): boolean {
  const a = (expected || '').trim()
  const b = (given || '').trim()
  if (!a || !b || a.length < 8 || a.length !== b.length) return false
  let x = 0
  for (let i = 0; i < a.length; i += 1) x |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return x === 0
}

export function readPresenceToken(headers: Record<string, string | undefined>): string {
  const raw =
    headers['x-jarvis-token'] ||
    headers['X-Jarvis-Token'] ||
    headers[PRESENCE_HEADER] ||
    ''
  const auth = headers.authorization || headers.Authorization || ''
  const bearer = /^bearer\s+(.+)$/i.exec(auth)
  return (raw || bearer?.[1] || '').trim()
}

export function presenceWriteAllowed(opts: {
  enabled: boolean
  expectedToken: string
  givenToken: string
  remoteHost: string
}): { ok: true } | { ok: false; error: string; status: number } {
  if (!opts.enabled) {
    return { ok: false, error: 'Presence aus. Zweites Gerät schreibt nicht ins Handy-Gedächtnis.', status: 403 }
  }
  if (!isPresenceLan(opts.remoteHost || '127.0.0.1')) {
    return { ok: false, error: 'Nur LAN (192.168 oder 10). Kein WAN.', status: 403 }
  }
  if (!tokensMatch(opts.expectedToken, opts.givenToken)) {
    return { ok: false, error: 'Token falsch oder fehlt.', status: 401 }
  }
  return { ok: true }
}

export function presenceUrl(host: string, port = PRESENCE_PORT, token = ''): string {
  const h = sanitizePresenceHost(host)
  const q = token ? `?t=${encodeURIComponent(token)}` : ''
  return `http://${h || '192.168.0.1'}:${port || PRESENCE_PORT}/${q}`
}
