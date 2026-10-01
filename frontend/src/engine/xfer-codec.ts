/** QR-Nutzlast. Ein Foto = ein Code. Höchstens sechs. Nichts wird still gekürzt. */

import QRCode from 'qrcode'

export const XFER_PREFIX = 'jarvis-xfer:v1'
export const PC_PREFIX = 'jarvis-pc:v1'
export const MAX_CODES = 6
export const MAX_VERSION = 15

export type XferFile = { name: string; mime: string; b64: string }
export type XferPayload = { c: string[]; f: XferFile[] }
export type XferChunk = { id: string; i: number; n: number; slice: string }

export function chunkFits(text: string): boolean {
  try {
    const qr = QRCode.create(text, { errorCorrectionLevel: 'Q' })
    return qr.version <= MAX_VERSION
  } catch {
    return false
  }
}

let sliceCap = 0

/** Zeichen hinter dem Kopf, die bei Fehlerkorrektur Q in Version 15 passen. */
export function maxSliceChars(): number {
  if (sliceCap > 0) return sliceCap
  const head = `${XFER_PREFIX}|abcdefgh|6|6|`
  let lo = 32
  let hi = 900
  let best = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (chunkFits(head + 'A'.repeat(mid))) {
      best = mid
      lo = mid + 1
    } else hi = mid - 1
  }
  sliceCap = best
  return best
}

function toB64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(s)
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function jsonB64(payload: XferPayload): string {
  return toB64(new TextEncoder().encode(JSON.stringify(payload)))
}

export function payloadFromB64(b64: string): XferPayload | null {
  try {
    const text = new TextDecoder().decode(fromB64(b64))
    const o = JSON.parse(text) as XferPayload
    if (!o || !Array.isArray(o.c) || !Array.isArray(o.f)) return null
    return o
  } catch {
    return null
  }
}

function codesFor(id: string, payload: XferPayload): string[] | null {
  const body = jsonB64(payload)
  const cap = maxSliceChars()
  if (!cap) return null
  const n = Math.max(1, Math.ceil(body.length / cap))
  if (n > MAX_CODES) return null
  const codes: string[] = []
  for (let i = 1; i <= n; i++) {
    const slice = body.slice((i - 1) * cap, i * cap)
    const text = `${XFER_PREFIX}|${id}|${i}|${n}|${slice}`
    if (!chunkFits(text)) return null
    codes.push(text)
  }
  return codes
}

export function planTransfer(
  id: string,
  copies: string[],
  files: XferFile[],
): { codes: string[]; inside: string[]; outside: string[] } {
  const sorted = [...files].sort((a, b) => a.b64.length - b.b64.length)
  const picked: XferFile[] = []
  const outside: string[] = []
  for (const file of sorted) {
    const trial = codesFor(id, { c: copies, f: [...picked, file] })
    if (trial) picked.push(file)
    else outside.push(file.name)
  }
  const codes = codesFor(id, { c: copies, f: picked }) || []
  if (!codes.length && (copies.length || picked.length)) {
    return { codes: [], inside: [], outside: files.map((f) => f.name) }
  }
  return { codes, inside: picked.map((f) => f.name), outside }
}

export function parseXferChunk(raw: string): XferChunk | null {
  const t = (raw || '').trim()
  if (!t.startsWith(`${XFER_PREFIX}|`)) return null
  if (t.startsWith(PC_PREFIX)) return null
  const parts = t.split('|')
  if (parts.length < 5) return null
  const id = parts[1] || ''
  const i = Number(parts[2])
  const n = Number(parts[3])
  const slice = parts.slice(4).join('|')
  if (!/^[a-z0-9]{4,16}$/i.test(id)) return null
  if (!Number.isInteger(i) || !Number.isInteger(n) || i < 1 || n < 1 || i > n || n > MAX_CODES) return null
  if (!slice) return null
  return { id, i, n, slice }
}

export function assembleChunks(chunks: XferChunk[]): XferPayload | null {
  if (!chunks.length) return null
  const n = chunks[0].n
  const id = chunks[0].id
  if (chunks.some((c) => c.n !== n || c.id !== id)) return null
  if (chunks.length !== n) return null
  const ordered = [...chunks].sort((a, b) => a.i - b.i)
  for (let k = 0; k < n; k++) if (ordered[k].i !== k + 1) return null
  return payloadFromB64(ordered.map((c) => c.slice).join(''))
}

/** RGBA für jsQR. Ruhezone 4, Zelle 4 px. */
export function renderRgba(text: string): { data: Uint8ClampedArray; width: number; height: number } | null {
  let qr
  try {
    qr = QRCode.create(text, { errorCorrectionLevel: 'Q' })
  } catch {
    return null
  }
  const n = qr.modules.size
  const cell = 4
  const quiet = 4
  const dim = (n + quiet * 2) * cell
  const data = new Uint8ClampedArray(dim * dim * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 232
    data[i + 1] = 255
    data[i + 2] = 248
    data[i + 3] = 255
  }
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!qr.modules.get(row, col)) continue
      const x0 = (col + quiet) * cell
      const y0 = (row + quiet) * cell
      for (let y = y0; y < y0 + cell; y++) {
        for (let x = x0; x < x0 + cell; x++) {
          const p = (y * dim + x) * 4
          data[p] = 4
          data[p + 1] = 20
          data[p + 2] = 28
          data[p + 3] = 255
        }
      }
    }
  }
  return { data, width: dim, height: dim }
}

export function qrSvgDataUrl(text: string): string | null {
  let qr
  try {
    qr = QRCode.create(text, { errorCorrectionLevel: 'Q' })
  } catch {
    return null
  }
  const n = qr.modules.size
  const cell = 8
  const quiet = 4
  const dim = (n + quiet * 2) * cell
  let rects = ''
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!qr.modules.get(row, col)) continue
      rects += `<rect x="${(col + quiet) * cell}" y="${(row + quiet) * cell}" width="${cell}" height="${cell}"/>`
    }
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}">` +
    `<rect width="100%" height="100%" fill="#e8fff8"/>` +
    `<g fill="#04141c">${rects}</g></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  out[4] = type.charCodeAt(0)
  out[5] = type.charCodeAt(1)
  out[6] = type.charCodeAt(2)
  out[7] = type.charCodeAt(3)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

function adler32(data: Uint8Array): number {
  let a = 1
  let b = 0
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521
    b = (b + a) % 65521
  }
  return ((b << 16) | a) >>> 0
}

/** PNG ohne Bibliothek. Stored-Blöcke, damit WebView kein SVG braucht. */
function zlibStore(data: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [new Uint8Array([0x78, 0x01])]
  let off = 0
  do {
    const n = Math.min(65535, data.length - off)
    const last = off + n >= data.length
    const block = new Uint8Array(5 + n)
    block[0] = last ? 1 : 0
    block[1] = n & 255
    block[2] = (n >> 8) & 255
    const nlen = (~n) & 0xffff
    block[3] = nlen & 255
    block[4] = (nlen >> 8) & 255
    if (n) block.set(data.subarray(off, off + n), 5)
    parts.push(block)
    off += n
  } while (off < data.length)
  const sum = adler32(data)
  const tail = new Uint8Array(4)
  tail[0] = (sum >>> 24) & 255
  tail[1] = (sum >>> 16) & 255
  tail[2] = (sum >>> 8) & 255
  tail[3] = sum & 255
  parts.push(tail)
  const total = parts.reduce((n, part) => n + part.length, 0)
  const out = new Uint8Array(total)
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  const step = 0x8000
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode(...bytes.subarray(i, Math.min(i + step, bytes.length)))
  }
  return btoa(bin)
}

function pngFromRgba(rgba: { data: Uint8ClampedArray; width: number; height: number }): string {
  const { data, width, height } = rgba
  const stride = width * 4
  const raw = new Uint8Array((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    const dest = y * (stride + 1)
    raw[dest] = 0
    raw.set(data.subarray(y * stride, y * stride + stride), dest + 1)
  }
  const ihdr = new Uint8Array(13)
  const view = new DataView(ihdr.buffer)
  view.setUint32(0, width)
  view.setUint32(4, height)
  ihdr[8] = 8
  ihdr[9] = 6
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  const parts = [sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', zlibStore(raw)), pngChunk('IEND', new Uint8Array())]
  const total = parts.reduce((n, part) => n + part.length, 0)
  const png = new Uint8Array(total)
  let at = 0
  for (const part of parts) {
    png.set(part, at)
    at += part.length
  }
  return `data:image/png;base64,${bytesToBase64(png)}`
}

/** Sichtbarer Code. PNG, damit die Kachel ihn zeichnet. SVG bleibt der Fallback. */
export function qrImageDataUrl(text: string): string | null {
  const rgba = renderRgba(text)
  if (rgba) return pngFromRgba(rgba)
  return qrSvgDataUrl(text)
}
