/** Hausstand von Gerät zu Gerät. Der Code ist die Adresse, die Datei bleibt im WLAN. */

import type { ChatBlock } from './chat-blocks.ts'
import { qrImageDataUrl } from './xfer-codec.ts'
import { hausNative, hausOffer } from '../native/haus.ts'

export type HausLinkIntent = 'offer' | 'scan' | 'sync_unavailable'

const OFFER =
  /^\s*(?:hausstand\s+(?:übertragen|uebertragen)|(?:qr|qe)[\s-]*code\s+für\s+(?:den\s+)?hausstand|hausstand[\s-]*(?:qr|qe)[\s-]*code)\s*[.!]?\s*$/i
const SCAN =
  /^\s*(?:(?:scanne|scannen|scan)\s+(?:den\s+)?(?:qr|qe)[\s-]*code|(?:qr|qe)[\s-]*code\s+(?:scannen|scan))\s*[.!]?\s*$/i

export function parseHausLink(text: string): HausLinkIntent | null {
  const t = text.trim()
  if (!t || t.length > 80) return null
  if (/\b(?:pc|rechner)\b/i.test(t)) return null
  if (
    !/\b(?:qr|qe|code)\b/i.test(t) &&
    /\b(?:synchronisier\w*|verbind\w*|koppel\w*)\b/i.test(t) &&
    /\b(?:handy|telefon|smartphone|tablet)\b/i.test(t)
  ) {
    return 'sync_unavailable'
  }
  if (OFFER.test(t)) return 'offer'
  if (SCAN.test(t)) return 'scan'
  return null
}

export type HausQr = { url: string; token: string; fingerprint: string }

export function hausCode(house: HausQr): string {
  return `jarvis-haus:v3|${house.url}|${house.token}|${house.fingerprint}`
}

/** Ein gescannter Exportcode ist akzeptiert, wenn TLS und QR-verteiltes Pairing-Pin vorhanden sind. */
export function parseHausQr(raw: string): HausQr | null {
  const t = raw.trim()
  const m = /^jarvis-haus:v3\|(https:\/\/[^|\s]+)\|([0-9a-f]{16,64})\|([0-9a-f]{64})$/i.exec(t)
  if (!m) return null
  try {
    const url = new URL(m[1])
    const host = url.hostname
    const privateHost = /^10\.(?:\d{1,3}\.){2}\d{1,3}$/.test(host)
      || /^192\.168\.(?:\d{1,3}\.)\d{1,3}$/.test(host)
    if (url.protocol !== 'https:' || !privateHost || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null
    return { url: `https://${url.host}`, token: m[2], fingerprint: m[3].toLowerCase() }
  } catch {
    return null
  }
}

export function openHausScan(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('jarvis-haus-scan'))
}

export async function offerHausQr(json: string): Promise<{ reply: string; blocks?: ChatBlock[] }> {
  const live = await hausOffer(json)
  if (!live.ok || !live.url) {
    if (!hausNative()) {
      return {
        reply: 'Der geschützte Hausstand-Transfer braucht die native App und ein bestätigtes TLS-Gerät.',
      }
    }
    return { reply: live.message || 'Kein WLAN. Beide Geräte ins selbe Netz, dann den Satz nochmal.' }
  }
  if (!live.code) return { reply: 'Der sichere Kopplungs-Code fehlt.' }
  const src = qrImageDataUrl(live.code)
  if (!src) return { reply: 'Der Code fehlt.' }
  return {
    reply: 'Hausstand-Code. Gleiches WLAN. Ohne Gespräche. Keys sind drin. Auf dem anderen Gerät: Scanne QR Code.',
    blocks: [{ kind: 'image', src, alt: 'Hausstand-Code', source: 'Hausstand' }],
  }
}
