/** One motion budget: 30 fps default, pause when hidden, reduced-motion wins. */

export const MOTION_FPS = 30
export const MOTION_FRAME_MS = 1000 / MOTION_FPS

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isDocumentHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

export function onVisibility(fn: () => void): () => void {
  if (typeof document === 'undefined') return () => {}
  const h = () => fn()
  document.addEventListener('visibilitychange', h)
  return () => document.removeEventListener('visibilitychange', h)
}

export function dispatchVoiceAmp(level: number): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('jarvis-voice-amp', { detail: Math.max(0, Math.min(1, level)) }))
}

export function onVoiceAmp(fn: (level: number) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const h = (e: Event) => {
    const n = Number((e as CustomEvent).detail)
    if (Number.isFinite(n)) fn(n)
  }
  window.addEventListener('jarvis-voice-amp', h)
  return () => window.removeEventListener('jarvis-voice-amp', h)
}
