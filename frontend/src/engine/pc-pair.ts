import { isAllowedPcHost, PC_HOST_HINT, sanitizePcHost } from './pc-host.ts'

export type PcPair = { host: string; port: number; token: string }

export function formatPcPairPayload(host: string, port: number, token: string): string {
  const h = sanitizePcHost(host)
  const p = port > 0 ? port : 18790
  return `jarvis-pc:v1|${h}|${p}|${String(token || '').trim()}`
}

function finish(host: string, port: number | string | undefined, token: string): PcPair | null {
  const h = sanitizePcHost(host)
  const p = Number(port)
  const tok = String(token || '').trim()
  if (!h || !tok || tok.length < 4) return null
  if (!Number.isFinite(p) || p < 1 || p > 65535) return null
  if (!isAllowedPcHost(h)) return null
  return { host: h, port: p, token: tok }
}

/** Lesen aus QR, Zwischenablage oder Chat. */
export function parsePcPairPayload(raw: string): PcPair | null {
  const t = String(raw || '').trim()
  if (!t || t.length > 240) return null

  const pipe = /^jarvis-pc:v1\|([^|\s]+)\|(\d{2,5})\|([^\s|]+)$/i.exec(t)
  if (pipe) return finish(pipe[1], pipe[2], pipe[3])

  if (t.startsWith('{')) {
    try {
      const o = JSON.parse(t) as { app?: string; host?: string; port?: number; token?: string; t?: string }
      if (o && (o.app === 'JarvisPC' || o.host) && (o.token || o.t)) {
        return finish(String(o.host || ''), o.port || 18790, String(o.token || o.t || ''))
      }
    } catch {
      /* */
    }
  }

  const asUrl = t
    .replace(/^jarvis-pc:\/\//i, 'http://')
    .replace(/^jarvispc:\/\//i, 'http://')
  try {
    if (/^https?:\/\//i.test(asUrl) || asUrl.startsWith('http://')) {
      const u = new URL(asUrl)
      const tok = u.searchParams.get('t') || u.searchParams.get('token') || ''
      if (tok) return finish(u.hostname, u.port || '18790', tok)
    }
  } catch {
    /* */
  }

  return null
}

export function pcPairRejectReason(raw: string): string {
  const t = String(raw || '').trim()
  if (!t) return 'Kein Code. Den QR aus dem Jarvis-PC-Fenster scannen.'
  const pipeHost = /^jarvis-pc:v1\|([^|\s]+)\|/i.exec(t)?.[1]
  if (pipeHost && !isAllowedPcHost(pipeHost)) return PC_HOST_HINT
  try {
    const asUrl = t.replace(/^jarvis-pc:\/\//i, 'http://').replace(/^jarvispc:\/\//i, 'http://')
    if (/^https?:\/\//i.test(asUrl)) {
      const host = new URL(asUrl).hostname
      if (host && !isAllowedPcHost(host)) return PC_HOST_HINT
    }
  } catch {
    /* */
  }
  if (t.startsWith('{')) {
    try {
      const o = JSON.parse(t) as { host?: string }
      if (o.host && !isAllowedPcHost(o.host)) return PC_HOST_HINT
    } catch {
      /* */
    }
  }
  return 'QR ist kein Jarvis-PC-Code. Nur den Code aus dem grauen PC-Fenster scannen.'
}
