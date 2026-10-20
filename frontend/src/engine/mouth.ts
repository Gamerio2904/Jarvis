import { preferEdgeForReply } from './speak-tap.ts'

/** Eine Spur pro Antwort. Pico darf nicht mitten im Satz einsetzen. */
export type NeuralLane = 'edge' | 'gemini'
export type MouthLane = NeuralLane | 'native'
export type MouthPiece = Blob | 'native' | 'silence'

export type MouthSynth = {
  edge: (text: string, timeoutMs: number) => Promise<Blob | null>
  gemini: (text: string) => Promise<Blob | null>
}

export type MouthOptions = {
  voiceTts: string
  geminiReady: boolean
  edgeTimeoutMs: number
  retryTimeoutMs: number
  preferEdge?: (text: string) => boolean
}

let stuckLane: NeuralLane | null = null
let stuckMode = ''
let mouthGen = 0

export function resetMouthSession(): void {
  stuckLane = null
  stuckMode = ''
}

export function currentMouthLane(): NeuralLane | null {
  return stuckLane
}

function usable(blob: Blob | null): blob is Blob {
  return Boolean(blob && blob.size > 0)
}

/** Reihenfolge für den ersten Satz. Der Rest der Antwort bleibt auf der Spur, die gewinnt. */
export function mouthOpeningLanes(opts: MouthOptions, text: string): NeuralLane[] {
  const mode = opts.voiceTts || 'auto'
  if (mode !== stuckMode) {
    stuckLane = null
    stuckMode = mode
  }
  if (mode === 'system') return []
  const gemini = opts.geminiReady
  const prefer = (opts.preferEdge ?? preferEdgeForReply)(text)
  if (mode === 'gemini') {
    const lanes: NeuralLane[] = []
    if (gemini) lanes.push('gemini')
    lanes.push('edge')
    return lanes
  }
  const stuck = stuckLane
  if (stuck === 'gemini' && gemini) return ['gemini', 'edge']
  if (stuck === 'edge' || prefer || !gemini) return gemini ? ['edge', 'gemini'] : ['edge']
  return ['gemini', 'edge']
}

async function tryLane(
  synth: MouthSynth,
  lane: NeuralLane,
  text: string,
  timeoutMs: number,
  retryTimeoutMs: number,
  attempts: number,
): Promise<Blob | null> {
  for (let i = 0; i < attempts; i += 1) {
    const timeout = i === 0 ? timeoutMs : retryTimeoutMs
    try {
      const blob = lane === 'edge' ? await synth.edge(text, timeout) : await synth.gemini(text)
      if (usable(blob)) return blob
    } catch {
      /* nächster Versuch, nicht die andere Stimme mitten im Satz */
    }
  }
  return null
}

function remember(mode: string, lane: MouthLane): void {
  stuckMode = mode
  if (lane === 'native') return
  stuckLane = lane
}

export function createMouthDirector(opts: MouthOptions, synth: MouthSynth) {
  const gen = ++mouthGen
  let seq = 0
  let opening: Promise<{ lane: MouthLane; audio: MouthPiece }> | null = null

  async function open(text: string): Promise<{ lane: MouthLane; audio: MouthPiece }> {
    const mode = opts.voiceTts || 'auto'
    const lanes = mouthOpeningLanes(opts, text)
    for (let i = 0; i < lanes.length; i += 1) {
      const lane = lanes[i]
      const attempts = i === 0 ? 2 : 1
      const blob = await tryLane(synth, lane, text, opts.edgeTimeoutMs, opts.retryTimeoutMs, attempts)
      if (gen !== mouthGen) return { lane: 'native', audio: 'silence' }
      if (blob) {
        remember(mode, lane)
        return { lane, audio: blob }
      }
    }
    if (gen !== mouthGen) return { lane: 'native', audio: 'silence' }
    remember(mode, 'native')
    return { lane: 'native', audio: 'native' }
  }

  async function follow(text: string, lane: MouthLane): Promise<MouthPiece> {
    if (lane === 'native') return 'native'
    const timeout = opts.retryTimeoutMs > 0 ? opts.retryTimeoutMs : opts.edgeTimeoutMs
    const blob = await tryLane(synth, lane, text, timeout, timeout, 2)
    return blob || 'silence'
  }

  return {
    prepare(text: string): Promise<MouthPiece> {
      const n = seq
      seq += 1
      if (!opening) opening = open(text)
      if (n === 0) return opening.then((row) => row.audio)
      return opening.then((row) => follow(text, row.lane))
    },
  }
}
