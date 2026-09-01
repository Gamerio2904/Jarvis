/** Datei-Art und PDF-Text lokal — kein Fake-Word, keine Halluzination. */

export const MAX_DOC_BYTES = 8 * 1024 * 1024
export const MAX_DOC_CHARS = 80_000

export type DocKind = 'image' | 'pdf' | 'text' | 'other'

export function classifyDoc(name: string, mime = ''): DocKind {
  const n = (name || '').trim().toLowerCase()
  const m = (mime || '').trim().toLowerCase()
  if (/\.heic$/i.test(n) || m.includes('heic') || m.includes('heif')) return 'other'
  if (m.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(n)) return 'image'
  if (m.includes('pdf') || n.endsWith('.pdf')) return 'pdf'
  if (
    m.startsWith('text/') ||
    m.includes('json') ||
    m.includes('markdown') ||
    /\.(txt|md|csv|json|log|text)$/i.test(n)
  ) {
    return 'text'
  }
  return 'other'
}

export function otherDocLine(name: string): string {
  const n = name.toLowerCase()
  if (/\.(docx?|odt)$/i.test(n)) return 'Word-Datei lese ich nicht. PDF, Text oder Foto.'
  if (/\.(xlsx?|ods|xls)$/i.test(n)) return 'Tabellen-Datei lese ich nicht. CSV, PDF, Text oder Foto.'
  if (/\.(pptx?|odp)$/i.test(n)) return 'Folien lese ich nicht. PDF, Text oder Foto.'
  if (/\.heic$/i.test(n)) return 'HEIC lese ich nicht. JPEG oder PNG.'
  return 'Diesen Dateityp lese ich nicht. PDF, Text oder Foto.'
}

function decodeLatin1(bytes: Uint8Array): string {
  let out = ''
  const n = Math.min(bytes.length, 4_000_000)
  for (let i = 0; i < n; i += 1) out += String.fromCharCode(bytes[i])
  return out
}

function unescapePdf(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\([0-7]{1,3})/g, (_, n) => String.fromCharCode(parseInt(n, 8)))
}

/** Unkomprimierte PDF-Literale. Gescannte PDFs bleiben leer — dann ehrlich OCR-Hinweis. */
export function extractPdfText(bytes: Uint8Array): string {
  const raw = decodeLatin1(bytes)
  if (!/%PDF/i.test(raw.slice(0, 16))) return ''
  const parts: string[] = []
  const tj = /\((?:\\.|[^\\)])*\)\s*Tj/g
  let m: RegExpExecArray | null
  while ((m = tj.exec(raw))) {
    const inner = m[0].slice(1, m[0].lastIndexOf(')'))
    const t = unescapePdf(inner).trim()
    if (t) parts.push(t)
  }
  const arr = /\[((?:\\.|[^\]])*)\]\s*TJ/g
  while ((m = arr.exec(raw))) {
    const inner = m[1]
    const bits = inner.match(/\((?:\\.|[^\\)])*\)/g) || []
    for (const b of bits) {
      const t = unescapePdf(b.slice(1, -1)).trim()
      if (t) parts.push(t)
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, MAX_DOC_CHARS)
}

export function clipDocText(text: string): string {
  return (text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_DOC_CHARS)
}

export type DocUploadObs = {
  stored?: boolean
  bytes?: number
  kind?: string
  chars?: number
  ocrOk?: boolean
}

export function docUploadVerified(obs: DocUploadObs): { ok: boolean; error?: string } {
  if (!obs.stored) return { ok: false, error: 'Datei nicht gespeichert.' }
  if (!Number(obs.bytes)) return { ok: false, error: 'Datei leer.' }
  if (obs.kind === 'other') return { ok: false, error: 'Dateityp nicht lesbar.' }
  if (obs.kind === 'image') {
    if (obs.ocrOk) return { ok: true }
    return { ok: false, error: 'Nichts Lesbares auf dem Bild.' }
  }
  if ((obs.kind === 'pdf' || obs.kind === 'text') && Number(obs.chars) > 0) return { ok: true }
  if (obs.kind === 'pdf') return { ok: false, error: 'Kein Text im PDF.' }
  return { ok: false, error: 'Kein Text in der Datei.' }
}
