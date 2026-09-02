import { Capacitor, registerPlugin } from '@capacitor/core'
import { getBinary } from './http-json.ts'
import { loadSettings } from './store.ts'
import { spokenForGemini } from './tts.ts'

/** Microsoft Edge read-aloud. Same token as rany2/edge-tts. No extra API key. German neural. */
export const EDGE_TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
export const EDGE_CHROMIUM = '143.0.3650.75'
export const EDGE_GEC_VERSION = `1-${EDGE_CHROMIUM}`
export const EDGE_VOICE_JARVIS = 'de-DE-ConradNeural'
export const EDGE_VOICE_FRIDAY = 'de-DE-KatjaNeural'
export const EDGE_FIRST_MS_STANDING = 1600
export const EDGE_FIRST_MS_DRIVE = 900

const WIN_EPOCH = 11_644_473_600
const EDGE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0'
const GTTS_UA =
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36'

type NativeEdge = {
  synthEdge(opts: { text: string; voice: string; timeoutMs?: number }): Promise<{
    ok: boolean
    audio?: string
    message?: string
  }>
}

const nativeEdge = Capacitor.isNativePlatform() ? registerPlugin<NativeEdge>('JarvisVoice') : null

/** Groq speech is English/Arabic PlayAI — not wired as German mouth. */

export function edgeVoiceName(face?: string): string {
  const who = (face || loadSettings().face || 'jarvis').toLowerCase()
  return who === 'friday' ? EDGE_VOICE_FRIDAY : EDGE_VOICE_JARVIS
}

export function edgeFirstTimeoutMs(inDrive = loadSettings().drive_mode): number {
  return inDrive ? EDGE_FIRST_MS_DRIVE : EDGE_FIRST_MS_STANDING
}

export function spokenForEdge(text: string): string {
  return spokenForGemini(text)
}

export function ssmlEscape(text: string): string {
  let out = ''
  for (const ch of text) {
    const c = ch.codePointAt(0) || 0
    if ((c >= 0 && c <= 8) || c === 11 || c === 12 || (c >= 14 && c <= 31)) {
      out += ' '
      continue
    }
    if (ch === '&') out += '&amp;'
    else if (ch === '<') out += '&lt;'
    else if (ch === '>') out += '&gt;'
    else if (ch === '"') out += '&quot;'
    else out += ch
  }
  return out
}

/** Windows filetime ticks as decimal string — same float path as rany2/edge-tts. */
export function windowsFileTimeTicks(unixSec: number): string {
  let ticks = unixSec + WIN_EPOCH
  ticks -= ticks % 300
  ticks *= 10_000_000
  return Math.round(ticks).toString()
}

export async function secMsGec(unixSec = Date.now() / 1000): Promise<string> {
  const payload = `${windowsFileTimeTicks(unixSec)}${EDGE_TRUSTED_TOKEN}`
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

export function connectId(): string {
  const c = globalThis.crypto
  if (c?.randomUUID) return c.randomUUID().replace(/-/g, '').toUpperCase()
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.toUpperCase().padEnd(32, '0').slice(0, 32)
}

function edgeDate(): string {
  const d = new Date()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${days[d.getUTCDay()]} ${months[d.getUTCMonth()]} ${pad(d.getUTCDate())} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} GMT+0000 (Coordinated Universal Time)`
}

function bytesFromBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

function copyBuf(u: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(u.byteLength)
  new Uint8Array(out).set(u)
  return out
}

export async function firstBlobWins(
  jobs: Array<{ lane: 'gemini' | 'edge'; run: Promise<Blob | null> }>,
): Promise<{ lane: 'gemini' | 'edge'; blob: Blob } | null> {
  if (!jobs.length) return null
  return new Promise((resolve) => {
    let left = jobs.length
    let settled = false
    for (const job of jobs) {
      job.run.then(
        (blob) => {
          if (settled) return
          if (blob && blob.size > 0) {
            settled = true
            resolve({ lane: job.lane, blob })
            return
          }
          left -= 1
          if (left <= 0) resolve(null)
        },
        () => {
          if (settled) return
          left -= 1
          if (left <= 0) resolve(null)
        },
      )
    }
  })
}

async function synthesizeEdgeNative(text: string, voice: string, timeoutMs: number): Promise<Blob | null> {
  const plug = nativeEdge
  if (!plug) return null
  try {
    const res = await plug.synthEdge({ text, voice, timeoutMs })
    if (!res.ok || !res.audio) return null
    const raw = bytesFromBase64(res.audio)
    if (!raw.length) return null
    return new Blob([copyBuf(raw)], { type: 'audio/mpeg' })
  } catch {
    return null
  }
}

function parseAudioFrame(buf: ArrayBuffer): Uint8Array | null {
  if (buf.byteLength < 2) return null
  const view = new DataView(buf)
  const headerLen = view.getUint16(0, false)
  if (headerLen + 2 > buf.byteLength) return null
  const header = new TextDecoder().decode(buf.slice(2, 2 + headerLen))
  if (!header.includes('Path:audio')) return null
  if (!/Content-Type:\s*audio\/mpeg/i.test(header) && header.includes('Content-Type:')) return null
  const audio = new Uint8Array(buf.slice(2 + headerLen))
  return audio.byteLength ? audio : null
}

function openEdgeSocket(url: string): WebSocket {
  const headers: Record<string, string> = {
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'User-Agent': EDGE_UA,
    Cookie: `muid=${connectId()};`,
  }
  // Node/undici accepts headers. Browsers treat the 2nd arg as a protocol — native OkHttp is the APK path.
  if (typeof window === 'undefined') return new WebSocket(url, { headers } as unknown as string[])
  return new WebSocket(url)
}

async function synthesizeEdgeWs(text: string, voice: string, timeoutMs: number, signal?: AbortSignal): Promise<Blob> {
  if (typeof WebSocket === 'undefined') throw new Error('kein websocket')
  const gec = await secMsGec()
  const connectionId = connectId()
  const url =
    `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
    `?TrustedClientToken=${EDGE_TRUSTED_TOKEN}` +
    `&Sec-MS-GEC=${gec}` +
    `&Sec-MS-GEC-Version=${EDGE_GEC_VERSION}` +
    `&ConnectionId=${connectionId}`
  return new Promise((resolve, reject) => {
    const ws = openEdgeSocket(url)
    ws.binaryType = 'arraybuffer'
    const chunks: Uint8Array[] = []
    let settled = false
    const finish = (err?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try {
        ws.close()
      } catch {
        /* ignore */
      }
      if (err) reject(err)
      else {
        const total = chunks.reduce((n, c) => n + c.byteLength, 0)
        const out = new Uint8Array(total)
        let off = 0
        for (const c of chunks) {
          out.set(c, off)
          off += c.byteLength
        }
        if (!out.byteLength) reject(new Error('edge_empty'))
        else resolve(new Blob([copyBuf(out)], { type: 'audio/mpeg' }))
      }
    }
    const timer = globalThis.setTimeout(() => finish(new Error('edge_timeout')), timeoutMs)
    signal?.addEventListener('abort', () => finish(new Error('edge_abort')), { once: true })
    ws.onopen = () => {
      const ts = edgeDate()
      ws.send(
        `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
          `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`,
      )
      const ssml =
        `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
        `<voice name='${voice}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${ssmlEscape(text)}</prosody></voice></speak>`
      ws.send(
        `X-RequestId:${connectId()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n${ssml}`,
      )
    }
    ws.onmessage = (ev) => {
      if (typeof ev.data === 'string') {
        if (ev.data.includes('Path:turn.end')) finish()
        return
      }
      const buf = ev.data instanceof ArrayBuffer ? ev.data : null
      if (!buf) return
      const audio = parseAudioFrame(buf)
      if (audio) chunks.push(audio)
    }
    ws.onerror = () => finish(new Error('edge_ws'))
    ws.onclose = () => {
      if (!settled) {
        if (chunks.length) finish()
        else finish(new Error('edge_close'))
      }
    }
  })
}

export async function synthesizeEdge(
  text: string,
  opts?: { timeoutMs?: number; signal?: AbortSignal },
): Promise<Blob | null> {
  const spoken = spokenForEdge(text)
  if (!spoken) return null
  const timeoutMs = opts?.timeoutMs && opts.timeoutMs > 0 ? opts.timeoutMs : 4000
  const voice = edgeVoiceName()
  const native = await synthesizeEdgeNative(spoken, voice, timeoutMs)
  if (native && native.size > 0) return native
  try {
    return await synthesizeEdgeWs(spoken, voice, timeoutMs, opts?.signal)
  } catch {
    return null
  }
}

/** Google Translate TTS — robotic German, no key. Last neural-ish step before Pico. */
export async function synthesizeGtts(text: string, timeoutMs = 2500): Promise<Blob | null> {
  const spoken = spokenForEdge(text).slice(0, 180)
  if (!spoken) return null
  const url =
    'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=de&q=' + encodeURIComponent(spoken)
  try {
    const { status, bytes } = await getBinary(
      url,
      { 'User-Agent': GTTS_UA, Referer: 'https://translate.google.com/' },
      timeoutMs,
    )
    if (status < 200 || status >= 300 || bytes.byteLength < 80) return null
    return new Blob([copyBuf(bytes)], { type: 'audio/mpeg' })
  } catch {
    return null
  }
}
