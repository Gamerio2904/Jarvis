import { Capacitor, registerPlugin } from '@capacitor/core'

type NativeVoice = {
  requestPermission(): Promise<{ granted: boolean }>
  listen(): Promise<{ ok: boolean; text?: string; message?: string }>
  stopListen(): Promise<{ ok: boolean }>
  speak(opts: { text: string }): Promise<{ ok: boolean; message?: string }>
  stopSpeak(): Promise<{ ok: boolean }>
  consumeLaunch(): Promise<{ voice: boolean }>
  pinShortcut(): Promise<{ ok: boolean; message?: string }>
  addListener(event: 'partial', cb: (ev: { text: string }) => void): Promise<{ remove: () => void }>
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

export async function speakText(text: string): Promise<void> {
  const clean = text.replace(/[#*_`]+/g, '').replace(/\s+/g, ' ').trim()
  if (!clean) return
  if (native) {
    await native.speak({ text: clean })
    return
  }
  await webSpeak(clean)
}

export async function stopSpeak(): Promise<void> {
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
