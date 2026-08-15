import { Capacitor, registerPlugin } from '@capacitor/core'
import { synthesizeGemini, wantGeminiVoice } from '../engine/tts'

type NativeVoice = {
  requestPermission(): Promise<{ granted: boolean }>
  listen(): Promise<{ ok: boolean; text?: string; message?: string }>
  stopListen(): Promise<{ ok: boolean }>
  speak(opts: { text: string }): Promise<{ ok: boolean; message?: string }>
  stopSpeak(): Promise<{ ok: boolean }>
  consumeLaunch(): Promise<{ voice: boolean }>
  pinShortcut(): Promise<{ ok: boolean; message?: string }>
  streamSse(opts: { url: string; body: string; apiKey: string }): Promise<{ ok: boolean; status?: number; message?: string }>
  addListener(
    event: 'partial' | 'sse',
    cb: (ev: { text?: string; data?: string }) => void,
  ): Promise<{ remove: () => void }>
}

const native = Capacitor.isNativePlatform() ? registerPlugin<NativeVoice>('JarvisVoice') : null

export function isNativeVoice(): boolean {
  return Boolean(native)
}

export async function requestMicPermission(): Promise<boolean> {
  if (native) {
    try {
      return Boolean((await native.requestPermission()).granted)
    } catch {
      return false
    }
  }
  const w = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
}

export async function listenOnce(onPartial?: (text: string) => void): Promise<{ ok: boolean; text: string; message?: string }> {
  if (native) {
    let handle: { remove: () => void } | undefined
    if (onPartial) {
      handle = await native.addListener('partial', (ev) => onPartial(ev.text || ''))
    }
    try {
      const res = await native.listen()
      return { ok: Boolean(res.ok), text: (res.text || '').trim(), message: res.message }
    } finally {
      handle?.remove()
    }
  }
  return webListen(onPartial)
}

export async function stopListen(): Promise<void> {
  if (native) {
    try {
      await native.stopListen()
    } catch {
      /* ignore */
    }
    return
  }
  webStopListen()
}

let currentAudio: HTMLAudioElement | null = null
let currentUrl: string | null = null

function stopHtmlAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.src = ''
    } catch {
      /* ignore */
    }
    currentAudio = null
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl)
    currentUrl = null
  }
}

function playBlob(blob: Blob): Promise<void> {
  stopHtmlAudio()
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    currentUrl = url
    const audio = new Audio(url)
    currentAudio = audio
    audio.onended = () => {
      stopHtmlAudio()
      resolve()
    }
    audio.onerror = () => {
      stopHtmlAudio()
      resolve()
    }
    void audio.play().catch(() => {
      stopHtmlAudio()
      resolve()
    })
  })
}

export async function streamSseLines(
  opts: { url: string; body: unknown; apiKey: string },
  onData: (json: Record<string, unknown>) => void,
): Promise<{ ok: boolean; message?: string }> {
  if (native) {
    const handle = await native.addListener('sse', (ev) => {
      if (!ev.data) return
      try {
        onData(JSON.parse(ev.data) as Record<string, unknown>)
      } catch {
        /* ignore partial json */
      }
    })
    try {
      const res = await native.streamSse({
        url: opts.url,
        body: JSON.stringify(opts.body),
        apiKey: opts.apiKey,
      })
      return { ok: Boolean(res.ok), message: res.message }
    } finally {
      handle.remove()
    }
  }
  try {
    const res = await fetch(opts.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'x-goog-api-key': opts.apiKey,
      },
      body: JSON.stringify(opts.body),
    })
    if (!res.ok || !res.body) {
      return { ok: false, message: `HTTP ${res.status}` }
    }
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const blocks = buf.split('\n')
      buf = blocks.pop() || ''
      for (const line of blocks) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          onData(JSON.parse(data) as Record<string, unknown>)
        } catch {
          /* ignore */
        }
      }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Stream fehlgeschlagen' }
  }
}

export function createSentenceTap() {
  let emitted = 0
  let hold = ''
  let first = true
  return {
    feed(full: string): string[] {
      const add = full.slice(emitted)
      emitted = full.length
      hold += add
      const { parts, rest } = pullReady(hold, first)
      if (parts.length) first = false
      hold = rest
      return parts
    },
    flush(): string[] {
      const t = hold.replace(/\s+/g, ' ').trim()
      hold = ''
      return t ? [t] : []
    },
  }
}

function pullReady(hold: string, first: boolean): { parts: string[]; rest: string } {
  const parts: string[] = []
  let rest = hold
  const re = /([\s\S]+?[.!?…])(\s+|$)/
  while (true) {
    const m = re.exec(rest)
    if (!m) break
    const s = m[1].replace(/\s+/g, ' ').trim()
    if (s) parts.push(s)
    rest = rest.slice(m[0].length)
  }
  if (!parts.length && first) {
    const words = rest.trim().split(/\s+/).filter(Boolean)
    if (words.length >= 5) {
      const comma = rest.indexOf(', ')
      if (comma >= 8) {
        parts.push(rest.slice(0, comma + 1).replace(/\s+/g, ' ').trim())
        rest = rest.slice(comma + 1)
      } else {
        parts.push(words.slice(0, 7).join(' '))
        rest = words.slice(7).join(' ')
      }
    }
  }
  return { parts, rest }
}

export function createSpeakPipeline() {
  const q: string[] = []
  let running = false
  let stopped = false

  async function pump() {
    if (running) return
    running = true
    while (!stopped && q.length) {
      const text = q.shift()
      if (text) await speakText(text)
    }
    running = false
  }

  return {
    push(text: string) {
      const clean = text.replace(/\s+/g, ' ').trim()
      if (stopped || !clean) return
      q.push(clean)
      void pump()
    },
    async flush() {
      while (!stopped && (running || q.length)) {
        await new Promise((r) => setTimeout(r, 30))
      }
    },
    stop() {
      stopped = true
      q.length = 0
      void stopSpeak()
    },
  }
}

export async function speakText(text: string): Promise<void> {
  const clean = text.replace(/[#*_`]+/g, '').replace(/\s+/g, ' ').trim()
  if (!clean) return
  if (wantGeminiVoice()) {
    const blob = await synthesizeGemini(clean)
    if (blob) {
      await playBlob(blob)
      return
    }
  }
  if (native) {
    await native.speak({ text: clean })
    return
  }
  await webSpeak(clean)
}

export async function stopSpeak(): Promise<void> {
  stopHtmlAudio()
  if (native) {
    try {
      await native.stopSpeak()
    } catch {
      /* ignore */
    }
    return
  }
  window.speechSynthesis?.cancel()
}

export async function consumeVoiceLaunch(): Promise<boolean> {
  if (!native) return window.location.hash === '#voice'
  try {
    return Boolean((await native.consumeLaunch()).voice)
  } catch {
    return false
  }
}

export async function pinVoiceShortcut(): Promise<{ ok: boolean; message?: string }> {
  if (!native) {
    return { ok: false, message: 'Shortcut nur in der Android-App.' }
  }
  try {
    return await native.pinShortcut()
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Shortcut fehlgeschlagen' }
  }
}

type Rec = {
  start: () => void
  stop: () => void
  abort: () => void
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }> }) => void) | null
  onerror: ((ev: { error?: string }) => void) | null
  onend: (() => void) | null
}

let webRec: Rec | null = null

function webListen(onPartial?: (text: string) => void): Promise<{ ok: boolean; text: string; message?: string }> {
  const Ctor =
    (window as Window & { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec })
      .SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition
  if (!Ctor) {
    return Promise.resolve({ ok: false, text: '', message: 'Spracherkennung nur in der Android-App zuverlässig.' })
  }
  return new Promise((resolve) => {
    const rec = new Ctor()
    webRec = rec
    rec.lang = 'de-DE'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (ev) => {
      const last = ev.results[ev.results.length - 1]
      const text = last?.[0]?.transcript || ''
      if (last && !last.isFinal) onPartial?.(text)
      if (last?.isFinal) {
        webRec = null
        resolve({ ok: true, text: text.trim() })
      }
    }
    rec.onerror = () => {
      webRec = null
      resolve({ ok: true, text: '' })
    }
    rec.onend = () => {
      if (webRec === rec) {
        webRec = null
        resolve({ ok: true, text: '' })
      }
    }
    rec.start()
  })
}

function webStopListen() {
  try {
    webRec?.abort()
  } catch {
    /* ignore */
  }
  webRec = null
}

function webSpeak(text: string): Promise<void> {
  if (!window.speechSynthesis) return Promise.resolve()
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'de-DE'
    u.rate = 1.06
    u.pitch = 0.98
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  })
}
