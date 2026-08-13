/** Minimal UI sounds via Web Audio (no asset files). */
export type SoundKind = 'send' | 'receive' | 'error' | 'moment'
export type SoundVolume = 'low' | 'medium' | 'high'

export function playUiSound(
  kind: SoundKind,
  opts: { enabled: boolean; volume?: SoundVolume },
): void {
  const enabled = opts.enabled
  const volume = opts.volume || 'low'
  if (!enabled) return
  if (typeof window === 'undefined') return
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const vol = volume === 'high' ? 0.08 : volume === 'medium' ? 0.045 : 0.025
    const freq = kind === 'error' ? 220 : kind === 'send' ? 520 : kind === 'moment' ? 660 : 440
    const dur = kind === 'error' ? 0.12 : 0.07
    osc.type = kind === 'error' ? 'triangle' : 'sine'
    osc.frequency.value = freq
    gain.gain.value = vol
    osc.connect(gain)
    gain.connect(ctx.destination)
    const t0 = ctx.currentTime
    osc.start(t0)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.stop(t0 + dur + 0.02)
    window.setTimeout(() => {
      void ctx.close()
    }, 200)
  } catch {
    /* ignore autoplay / unsupported */
  }
}
