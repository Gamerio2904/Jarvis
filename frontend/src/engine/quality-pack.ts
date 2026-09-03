import { loadSettings, type Settings } from './store.ts'

/** Could packs. Default off. Files are never in the APK until a measured GO. */
export type QualityPackId = 'smart_turn' | 'piper' | 'kokoro' | 'e5'

export type QualityPackStatus = {
  id: QualityPackId
  wanted: boolean
  ready: boolean
  reason: string
}

const PACK_FILES: Record<QualityPackId, string[]> = {
  smart_turn: ['/onnx/silero_vad.onnx', '/onnx/smart_turn_v3.onnx'],
  piper: ['/onnx/de_DE-thorsten.onnx'],
  kokoro: ['/onnx/kokoro-82m.onnx'],
  e5: ['/onnx/e5-small.onnx'],
}

const SETTING: Record<QualityPackId, keyof Settings> = {
  smart_turn: 'vad_onnx',
  piper: 'piper_offline',
  kokoro: 'kokoro_tts',
  e5: 'e5_rerank',
}

const OFF: Record<QualityPackId, string> = {
  smart_turn: 'ONNX-VAD ist aus. Energie-VAD und Smart-Turn-Loop bleiben (220 ms fertig, 800 ms „und …“).',
  piper: 'Piper ist aus. Lane-1 bleibt Edge Neural gegen Algieba.',
  kokoro: 'Kokoro ist nicht gebündelt. Kein Extra-Studio-TTS.',
  e5: 'e5-Rerank ist aus. Keyword-RRF bleibt. Nie der Tool-Router.',
}

const MISSING: Record<QualityPackId, string> = {
  smart_turn:
    'Silero/Smart-Turn-ONNX fehlt in der APK. Energie-VAD bleibt (220 ms fertig, 800 ms „und …“). Am Steuer bleibt ONNX aus.',
  piper: 'Piper-Gewichte fehlen. Edge Neural gegen Algieba bleibt Lane-1.',
  kokoro: 'Kokoro-82M fehlt in der APK. Nicht gebündelt — Edge/Algieba bleiben.',
  e5: 'e5-small fehlt. Retrieve bleibt Keyword-RRF, nie der Router.',
}

const READY: Record<QualityPackId, string> = {
  smart_turn: 'ONNX-VAD liegt vor. Nur nach Stille, nicht auf jedem Frame.',
  piper: 'Piper-Stimme liegt vor. Offline-Lane, nicht Lane-1.',
  kokoro: 'Kokoro liegt vor. Eine Extra-TTS, nicht parallel zu Piper.',
  e5: 'e5-small liegt vor. Nur Retrieve-Rerank, nie pickRoute.',
}

let existsProbe: (path: string) => boolean = () => false

export function setPackExistsProbe(fn: (path: string) => boolean) {
  existsProbe = fn
}

export function resetPackExistsProbe() {
  existsProbe = () => false
}

export function packFiles(id: QualityPackId): string[] {
  return [...PACK_FILES[id]]
}

export function packFileReady(id: QualityPackId): boolean {
  return PACK_FILES[id].some((p) => existsProbe(p))
}

export function qualityPack(id: QualityPackId, settings: Settings = loadSettings()): QualityPackStatus {
  const wanted = Boolean(settings[SETTING[id]])
  const ready = wanted && packFileReady(id)
  const reason = !wanted ? OFF[id] : ready ? READY[id] : MISSING[id]
  return { id, wanted, ready, reason }
}

export function qualityPacks(settings: Settings = loadSettings()): QualityPackStatus[] {
  return (Object.keys(PACK_FILES) as QualityPackId[]).map((id) => qualityPack(id, settings))
}
