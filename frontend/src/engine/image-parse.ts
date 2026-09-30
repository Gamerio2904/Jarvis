import { normalizeUtterance } from './utterance.ts'

export type ImageKind = 'photo' | 'crest' | 'map'

export type ImageAsk = { q: string; kind: ImageKind }

const CAMERA = /\b(?:mach(?:e)?|nimm|knipps(?:e)?)\s+(?:bitte\s+)?(?:ein\s+)?(?:foto|bild)\b/i

/**
 * Ein Bild nur, wenn der Satz eines verlangt. „Zeig mir London“ bleibt die Kugel.
 * „Mach ein Foto“ bleibt die Kamera.
 */
export function parseImageAsk(text: string): ImageAsk | null {
  const raw = normalizeUtterance((text || '').trim())
  if (!raw || raw.length > 160) return null
  if (CAMERA.test(raw)) return null
  if (/\b(?:wie wird|wetter morgen|wetter heute|das wetter)\b/i.test(raw) && !/\b(?:bild|foto|wappen)\b/i.test(raw)) {
    return null
  }
  const crest = /\bwappen\b/i.test(raw)
  const photo = /\b(?:bild|foto)\b/i.test(raw)
  const map = /\bkarte\b/i.test(raw)
  if (!crest && !photo && !map) return null
  const m = /(?:bild|foto|wappen|karte)\s+((?:von|vom|der|des|die|dem|den|zur|zum)\s+)+(.+)$/i.exec(raw)
  if (!m) return null
  const q = m[2].replace(/\s+aus\s*$/i, '').replace(/[?.!]+$/g, '').trim()
  if (q.length < 2 || q.length > 80) return null
  const kind: ImageKind = crest ? 'crest' : map && !photo ? 'map' : 'photo'
  return { q, kind }
}

/** `http:` und `javascript:` bleiben unsichtbar. Kamera bleibt `data:image`. */
export function safeImageSrc(src: string): string | null {
  const s = (src || '').trim()
  if (/^https:\/\//i.test(s)) return s
  if (/^blob:/i.test(s)) return s
  if (/^data:image\/(?:jpeg|jpg|png|webp|gif);/i.test(s)) return s
  return null
}
