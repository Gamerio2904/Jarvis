/** Energy VAD. Silero-loop (frame + hangover) without the ONNX weight. */

export type VadState = 'silence' | 'speech'

export function rmsFromPcm16(samples: ArrayLike<number>): number {
  if (!samples.length) return 0
  let s = 0
  for (let i = 0; i < samples.length; i += 1) {
    const n = samples[i] / 32768
    s += n * n
  }
  return Math.sqrt(s / samples.length)
}

export function rmsFromByteTimeDomain(data: Uint8Array): number {
  if (!data.length) return 0
  let s = 0
  for (const v of data) {
    const n = (v - 128) / 128
    s += n * n
  }
  return Math.sqrt(s / data.length)
}

export function createEnergyVad(opts?: { threshold?: number; hangMs?: number; onsetMs?: number }) {
  const threshold = opts?.threshold ?? 0.045
  const hangMs = opts?.hangMs ?? 220
  const onsetMs = opts?.onsetMs ?? 80
  let state: VadState = 'silence'
  let aboveSince = 0
  let belowSince = 0

  return {
    threshold,
    frame(rms: number, now = Date.now()): { state: VadState; event: 'none' | 'onset' | 'end' } {
      const hot = rms >= threshold
      if (hot) {
        if (!aboveSince) aboveSince = now
        belowSince = 0
        if (state === 'silence' && now - aboveSince >= onsetMs) {
          state = 'speech'
          return { state, event: 'onset' }
        }
        return { state, event: 'none' }
      }
      aboveSince = 0
      if (state === 'silence') return { state, event: 'none' }
      if (!belowSince) belowSince = now
      if (now - belowSince >= hangMs) {
        state = 'silence'
        belowSince = 0
        return { state, event: 'end' }
      }
      return { state, event: 'none' }
    },
    reset() {
      state = 'silence'
      aboveSince = 0
      belowSince = 0
    },
  }
}
