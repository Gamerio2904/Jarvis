/** Datei-QR. Nur die Sätze aus 93-next. PC-QR und „Lies das PDF“ bleiben draußen. */

export type XferIntent = {
  kind: 'send'
  copies: string[]
}

const TRANSFER =
  /(?:übertrage|uebertrage)\s+das\s+fürs\s+(?:tablet|handy)|mach\s+den\s+qr[\s-]*code/i

const COPY_MARK =
  /(?:das\s+hier\s+zum\s+kopieren\s+als\s+anhang\s+in\s+der\s+nachricht|zum\s+kopieren|als\s+anhang\s+in\s+der\s+nachricht)\s*:/i

export function xferCopies(text: string): string[] {
  const m = COPY_MARK.exec(text)
  if (!m) return []
  const rest = text.slice(m.index + m[0].length)
  const lines = rest.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (!lines.length) {
    const one = rest.trim()
    if (one) lines.push(one)
  }
  return lines.slice(0, 8).map((l) => l.slice(0, 200))
}

export function parseXferIntent(text: string): XferIntent | null {
  const t = text.trim()
  if (!t || t.length > 2000) return null
  if (/\bpc\s+qr\b/i.test(t) || /\bqr(?:[\s-]*code)?\s*(?:scannen|scan)\b/i.test(t) && /\b(?:pc|rechner)\b/i.test(t)) {
    return null
  }
  const copies = xferCopies(t)
  if (!TRANSFER.test(t) && !copies.length) return null
  return { kind: 'send', copies }
}
