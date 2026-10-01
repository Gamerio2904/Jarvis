import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/** Eine Sekunde. Danach ist die Fläche weg, nichts läuft weiter. */
const FULL_MS = 1000
const STILL_MS = 420

/**
 * Kurzes Öffnen: Chromring, rotes Auge, ein Glasglanz.
 * Beim nächsten Sichtbarwerden noch einmal, nicht als Dauerschleife.
 */
export function UltronIntro() {
  const [token, setToken] = useState(0)
  const [live, setLive] = useState(true)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(() => setLive(false), reduce ? STILL_MS : FULL_MS)
    return () => window.clearTimeout(id)
  }, [token])

  useEffect(() => {
    let hidden = false
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        hidden = true
        return
      }
      if (!hidden) return
      hidden = false
      setToken((n) => n + 1)
      setLive(true)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  if (!live) return null

  return createPortal(
    <div key={token} className="ultron-intro" aria-hidden="true">
      <div className="ultron-intro-stage">
        <i className="ultron-intro-ring" />
        <i className="ultron-intro-glass" />
        <i className="ultron-intro-eye" />
      </div>
      <p className="ultron-intro-name">Ultron</p>
    </div>,
    document.body,
  )
}
