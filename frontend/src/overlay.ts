import { useEffect, useState } from 'react'
import { prefersReducedMotion } from './fx'

export const LEAVE_MS = 320

/** Keep an overlay mounted through its leave animation. */
export function useOverlay(open: boolean, ms = LEAVE_MS): { shown: boolean; leaving: boolean } {
  const [shown, setShown] = useState(open)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (open) {
      setShown(true)
      setLeaving(false)
      return
    }
    if (!shown) return
    const wait = prefersReducedMotion() ? 1 : ms
    setLeaving(true)
    const id = window.setTimeout(() => {
      setShown(false)
      setLeaving(false)
    }, wait)
    return () => window.clearTimeout(id)
  }, [open, shown, ms])

  return { shown, leaving }
}

export function overlayClass(base: string, leaving: boolean): string {
  return leaving ? `${base} is-leaving` : base
}
