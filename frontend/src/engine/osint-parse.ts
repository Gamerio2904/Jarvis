import { normalizeUtterance } from './utterance.ts'

export type OsintIntent =
  | { kind: 'domain'; host: string }
  | { kind: 'ip'; ip: string }
  | { kind: 'cve'; id: string }
  | { kind: 'sanctions'; query: string }
  | { kind: 'github'; user: string }
  | { kind: 'shodan'; ip: string }
  | { kind: 'refuse_scan' }

const HOST = /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}/i
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/
const CVE = /\bcve-\d{4}-\d{4,7}\b/i

function hostOf(raw: string): string | null {
  const m = HOST.exec(raw)
  if (!m) return null
  return m[0].toLowerCase().replace(/^www\./, '')
}

export function parseOsintIntent(text: string): OsintIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (/\b(?:portscan|port[- ]scan|nmap|osint\/sweep|cidr)\b/i.test(t) || /^\s*scan(?:ne)?\s+/i.test(t)) {
    return { kind: 'refuse_scan' }
  }
  if (/\b(?:leak|leaks|hudson\s*rock|infostealer|telefon[- ]?osint)\b/i.test(t)) {
    return { kind: 'refuse_scan' }
  }
  const cve = CVE.exec(t)
  if (cve && /\b(cve|was\s+ist|lücke|luecke)\b/i.test(t)) {
    return { kind: 'cve', id: cve[0].toUpperCase() }
  }
  if (/\bsanktionsliste\b/i.test(t) || /\bofac\b/i.test(t) || /\bsteht\s+.+\s+auf\s+der\s+sanktionsliste\b/i.test(t)) {
    const q = t
      .replace(/^\s*(?:steht|steht\s+denn)\s+/i, '')
      .replace(/\s+auf\s+der\s+sanktionsliste\s*\??\s*$/i, '')
      .replace(/\b(?:sanktionsliste|ofac|opensanctions)\b/gi, '')
      .trim()
    if (q.length >= 2) return { kind: 'sanctions', query: q.slice(0, 80) }
  }
  if (/\bshodan\b/i.test(t)) {
    const ip = IPV4.exec(t)
    if (ip) return { kind: 'shodan', ip: ip[0] }
  }
  if (/\bgithub\b/i.test(t) && /\b(user|profil|account)\b/i.test(t)) {
    const user = t.replace(/.*\b(?:user|profil|account)\s+/i, '').trim().split(/\s+/)[0]
    if (user && /^[A-Za-z0-9-]{2,39}$/.test(user)) return { kind: 'github', user }
  }
  if (/\bwhois\b/i.test(t) || /\b(?:dns|zertifikat|certs?|who\s+hat)\b/i.test(t)) {
    const host = hostOf(t)
    if (host) return { kind: 'domain', host }
  }
  if (/\b(?:ip|ipv4)\b/i.test(t) && (/\bkugel\b/i.test(t) || /\bwo\s+liegt\b/i.test(t) || /\bzeig\b/i.test(t))) {
    const ip = IPV4.exec(t)
    if (ip) return { kind: 'ip', ip: ip[0] }
  }
  const who = /^\s*(?:wer\s+hat|whois)\s+(\S+)/i.exec(t)
  if (who) {
    const host = hostOf(who[1])
    if (host) return { kind: 'domain', host }
  }
  return null
}
