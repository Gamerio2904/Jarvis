/** UI sounds via a shared AudioContext (Android WebView stays muted until resumed). */

export type SoundKind = 'send' | 'receive' | 'error' | 'moment'
export type SoundVolume = 'low' | 'medium' | 'high'

let ctx: AudioContext | null = null

function audioCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  )
}

function getCtx(): AudioContext | null {
  const Ctor = audioCtor()
  if (!Ctor) return null
  if (!ctx || ctx.state === 'closed') ctx = new Ctor()
  return ctx
}

export async function unlockUiAudio(): Promise<void> {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') {
    try {
      await c.resume()
    } catch {
      /* autoplay lock */
    }
  }
}

export function playUiSound(
  kind: SoundKind,
  opts: { enabled: boolean; volume?: SoundVolume },
): void {
  if (!opts.enabled) return
  const c = getCtx()
  if (!c) return
  const run = () => {
    try {
      const osc = c.createOscillator()
      const gain = c.createGain()
      const volume = opts.volume || 'low'
      const vol = volume === 'high' ? 0.12 : volume === 'medium' ? 0.07 : 0.04
      const freq = kind === 'error' ? 220 : kind === 'send' ? 520 : kind === 'moment' ? 660 : 440
      const dur = kind === 'error' ? 0.14 : 0.09
      osc.type = kind === 'error' ? 'triangle' : 'sine'
      osc.frequency.value = freq
      gain.gain.value = vol
      osc.connect(gain)
      gain.connect(c.destination)
      const t0 = c.currentTime
      osc.start(t0)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      osc.stop(t0 + dur + 0.02)
    } catch {
      /* ignore */
    }
  }
  if (c.state === 'suspended') {
    void c.resume().then(run)
    return
  }
  run()
}
