import { normalizeUtterance } from './utterance.ts'

export type TraceIntent = { kind: 'explain' } | { kind: 'run'; host: string }

const HOST =
  /(?:(?:zu|nach|für|von)\s+)?((?:(?:\d{1,3}\.){3}\d{1,3})|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+))/i

export function parseTraceIntent(text: string): TraceIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return null
  if (/^\s*was\s+ist\s+traceroute\s*\??\s*$/i.test(t) || /^\s*was\s+ist\s+tracert\s*\??\s*$/i.test(t)) {
    return { kind: 'explain' }
  }
  if (!/\b(traceroute|tracert|tracepath|welche\s+route\s+nimmt|welcher\s+weg\s+(?:nimmt|geht)|hops?\s+(?:zu|nach))\b/i.test(t)) {
    return null
  }
  if (/\b(fahr|tanke|carplay|wetter)\b/i.test(t)) return null
  const m = HOST.exec(t)
  const host = (m?.[1] || '').replace(/[?.!]+$/, '').trim()
  if (!host) return { kind: 'explain' }
  return { kind: 'run', host }
}
