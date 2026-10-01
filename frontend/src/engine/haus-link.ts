/** Hausstand von Gerät zu Gerät. Der Code ist die Adresse, die Datei bleibt im WLAN. */

import type { ChatBlock } from './chat-blocks.ts'
import { qrImageDataUrl } from './xfer-codec.ts'
import { hausNative, hausOffer } from '../native/haus.ts'

export type HausLinkIntent = 'offer' | 'scan'

const OFFER =
  /^\s*(?:hausstand\s+(?:übertragen|uebertragen)|(?:qr|qe)[\s-]*code\s+für\s+(?:den\s+)?hausstand|hausstand[\s-]*(?:qr|qe)[\s-]*code)\s*[.!]?\s*$/i
const SCAN =
  /^\s*(?:(?:scanne|scannen|scan)\s+(?:den\s+)?(?:qr|qe)[\s-]*code|(?:qr|qe)[\s-]*code\s+(?:scannen|scan))\s*[.!]?\s*$/i

export function parseHausLink(text: string): HausLinkIntent | null {
  const t = text.trim()
  if (!t || t.length > 80) return null
  if (/\b(?:pc|rechner)\b/i.test(t)) return null
  if (OFFER.test(t)) return 'offer'
  if (SCAN.test(t)) return 'scan'
  return null
}

export function hausCode(url: string): string {
  return `jarvis-haus:v1|${url}`
}

/** Adresse aus dem gescannten Code. Fremde Codes bleiben draußen. */
export function parseHausQr(raw: string): string | null {
  const t = raw.trim()
  const m = /^jarvis-haus:v1\|(https?:\/\/\S+)$/i.exec(t)
  if (!m) return null
  try {
    const url = new URL(m[1])
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (!url.pathname.startsWith('/hausstand')) return null
    if (!url.searchParams.get('t')) return null
    return url.toString()
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
      const src = qrImageDataUrl(hausCode('http://192.168.0.2/hausstand?t=vorschau'))
      const blocks: ChatBlock[] = src
        ? [{ kind: 'image', src, alt: 'Hausstand-Code', source: 'Vorschau' }]
        : []
      return {
        reply: 'Vorschau. Auf Tablet und Handy im selben WLAN entsteht der echte Code. Dann: Scanne QR Code.',
        blocks,
      }
    }
    return { reply: live.message || 'Kein WLAN. Beide Geräte ins selbe Netz, dann den Satz nochmal.' }
  }
  const src = qrImageDataUrl(live.code || hausCode(live.url))
  if (!src) return { reply: 'Der Code fehlt.' }
  return {
    reply: 'Hausstand-Code. Gleiches WLAN. Ohne Gespräche. Keys sind drin. Auf dem anderen Gerät: Scanne QR Code.',
    blocks: [{ kind: 'image', src, alt: 'Hausstand-Code', source: 'Hausstand' }],
  }
}
