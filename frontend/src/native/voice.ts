import { Capacitor, registerPlugin } from '@capacitor/core'
import { synthesizeGemini, ttsNativeRaceMs, wantGeminiVoice } from '../engine/tts'
import { pickHeard } from '../engine/heard.ts'
import { loadFace } from '../engine/face.ts'

export { createSentenceTap } from '../engine/speak-tap'

type NativeVoice = {
  requestPermission(): Promise<{ granted: boolean }>
  listen(): Promise<{ ok: boolean; text?: string; alts?: string[]; message?: string }>
  stopListen(): Promise<{ ok: boolean }>
  speak(opts: { text: string; gender?: string }): Promise<{ ok: boolean; message?: string }>
  stopSpeak(): Promise<{ ok: boolean }>
  consumeLaunch(): Promise<{ voice: boolean; utterance?: string }>
  pinShortcut(): Promise<{ ok: boolean; message?: string }>
  startWake(): Promise<{ ok: boolean; message?: string }>
  stopWake(): Promise<{ ok: boolean }>
  wakeStatus(): Promise<{ running: boolean; wanted?: boolean }>
  requestBatteryUnrestricted(): Promise<{ ok: boolean; message?: string }>
  setKeepScreenOn(opts: { on: boolean }): Promise<{ ok: boolean }>
  setVoiceUi(opts: { open: boolean }): Promise<{ ok: boolean; open?: boolean }>
  streamSse(opts: {
    url: string
    body: string
    apiKey: string
    timeoutMs?: number
  }): Promise<{ ok: boolean; status?: number; message?: string }>
  addListener(
    event: 'partial' | 'sse' | 'wake',
    cb: (ev: { text?: string; data?: string; hit?: boolean; utterance?: string }) => void,
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
      const alts = Array.isArray(res.alts) ? res.alts.map(String) : []
      const text = pickHeard(res.text || '', alts)
      return { ok: Boolean(res.ok), text, message: res.message }
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
    audio.playbackRate = 1.02
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
  opts: { url: string; body: unknown; apiKey: string; timeoutMs?: number },
  onData: (json: Record<string, unknown>) => void,
): Promise<{ ok: boolean; message?: string }> {
  const timeoutMs = opts.timeoutMs && opts.timeoutMs > 0 ? opts.timeoutMs : 8_000
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
        timeoutMs,
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
      signal: AbortSignal.timeout(timeoutMs),
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

type SpeakJob = { text: string; ready: Promise<Blob | 'native'> }

export function createSpeakPipeline() {
  const q: SpeakJob[] = []
  let running = false
  let stopped = false

  function prepare(text: string): Promise<Blob | 'native'> {
    return (async () => {
      if (!wantGeminiVoice()) return 'native'
      const race = ttsNativeRaceMs()
      if (race <= 0) {
        const blob = await synthesizeGemini(text)
        return blob || 'native'
      }
      const gemini = synthesizeGemini(text)
      const raced = await Promise.race([
        gemini,
        new Promise<null>((resolve) => {
          globalThis.setTimeout(() => resolve(null), race)
        }),
      ])
      if (raced) return raced
      return 'native'
    })()
  }

  async function pump() {
    if (running) return
    running = true
    while (!stopped && q.length) {
      const job = q.shift()
      if (!job) continue
      const audio = await job.ready
      if (stopped) break
      if (audio instanceof Blob) await playBlob(audio)
      else await speakNative(job.text)
    }
    running = false
  }

  return {
    push(text: string) {
      const clean = text.replace(/\s+/g, ' ').trim()
      if (stopped || !clean) return
      q.push({ text: clean, ready: prepare(clean) })
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

function speakNative(text: string): Promise<void> {
  const clean = text.replace(/[#*_`]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return Promise.resolve()
  const gender = loadFace() === 'friday' ? 'female' : 'male'
  if (native) return native.speak({ text: clean, gender }).then(() => undefined)
  return webSpeak(clean)
}

/** Fast system TTS — for turn-by-turn, never wait on Gemini. */
export function speakCueFast(text: string): Promise<void> {
  return speakNative(text)
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

export async function consumeVoiceLaunch(): Promise<{ voice: boolean; utterance: string }> {
  if (!native) {
    return { voice: window.location.hash === '#voice', utterance: '' }
  }
  try {
    const res = await native.consumeLaunch()
    return { voice: Boolean(res.voice), utterance: (res.utterance || '').trim() }
  } catch {
    return { voice: false, utterance: '' }
  }
}

export function onWakeHit(cb: (utterance?: string) => void): () => void {
  if (!native) return () => undefined
  let handle: { remove: () => void } | undefined
  void native.addListener('wake', (ev) => cb((ev as { utterance?: string }).utterance || '')).then((h) => {
    handle = h
  })
  return () => {
    handle?.remove()
  }
}

export async function requestBatteryUnrestricted(): Promise<{ ok: boolean; message?: string }> {
  if (!native) return { ok: false, message: 'Nur in der Android-App.' }
  try {
    return await native.requestBatteryUnrestricted()
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Akku-Ausnahme fehlgeschlagen' }
  }
}

export async function setKeepScreenOn(on: boolean): Promise<void> {
  if (!native) return
  try {
    await native.setKeepScreenOn({ on })
  } catch {
    /* ignore */
  }
}

export async function setVoiceUi(open: boolean): Promise<void> {
  if (!native) return
  try {
    await native.setVoiceUi({ open })
  } catch {
    /* ignore */
  }
}

export async function startWakeWord(): Promise<{ ok: boolean; message?: string }> {
  if (!native) return { ok: false, message: 'Wake-Word nur in der Android-App.' }
  try {
    return await native.startWake()
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Wake-Word fehlgeschlagen' }
  }
}

export async function stopWakeWord(): Promise<void> {
  if (!native) return
  try {
    await native.stopWake()
  } catch {
    /* ignore */
  }
}

export async function wakeWordWanted(): Promise<boolean> {
  if (!native) return false
  try {
    const st = await native.wakeStatus()
    return Boolean(st.wanted ?? st.running)
  } catch {
    return false
  }
}

export async function wakeWordRunning(): Promise<boolean> {
  if (!native) return false
  try {
    return Boolean((await native.wakeStatus()).running)
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
  maxAlternatives: number
  onresult: ((ev: {
    results: ArrayLike<{ length: number; isFinal?: boolean; [i: number]: { transcript: string } }>
  }) => void) | null
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
    rec.maxAlternatives = 5
    rec.onresult = (ev) => {
      const last = ev.results[ev.results.length - 1]
      const alts: string[] = []
      if (last) {
        for (let i = 0; i < last.length; i += 1) {
          const t = last[i]?.transcript || ''
          if (t) alts.push(t)
        }
      }
      const text = pickHeard(alts[0] || '', alts.slice(1))
      if (last && !last.isFinal) onPartial?.(text)
      if (last?.isFinal) {
        webRec = null
        resolve({ ok: true, text })
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
    u.rate = 1.12
    u.pitch = 1.0
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  })
}
