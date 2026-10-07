import { useEffect, useState } from 'react'

type Props = {
  listening: boolean
  serverLine: string
  onTalk: () => void
}

function clock(now: Date) {
  return now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

/** Alexa-artige Tablet-Ansicht: großes Licht, Uhr, „Ultron“ als Weckwort. */
export function TabletShell(p: Props) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className="tablet-shell" aria-live="polite">
      <div className="tablet-clock">
        <strong>{clock(now)}</strong>
        <span>{now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>
      <button type="button" className={`tablet-orb${p.listening ? ' is-listening' : ''}`} onClick={p.onTalk} aria-label="Mit Ultron sprechen">
        <span className="tablet-orb-core" />
      </button>
      <div className="tablet-hint">
        <span>{p.listening ? 'Sag „Ultron“' : 'Tippe auf den Ring'}</span>
        <small>{p.serverLine}</small>
      </div>
    </div>
  )
}
