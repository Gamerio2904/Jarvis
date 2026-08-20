import { useEffect, useState } from 'react'
import { compassWord, watchCompass } from './native/device'

export function CompassView({ onClose }: { onClose: () => void }) {
  const [heading, setHeading] = useState<number | null>(null)
  const [label, setLabel] = useState('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const stop = watchCompass((hit) => {
      if (!hit.ok || hit.heading == null) {
        setErr(hit.message || 'Kompass nicht lesbar.')
        return
      }
      setErr(null)
      setHeading(hit.heading)
      setLabel(hit.label || compassWord(hit.heading))
    })
    return () => stop()
  }, [])

  const deg = heading == null ? 0 : heading
  const word = label || (heading == null ? '…' : compassWord(heading))

  return (
    <div className="compass-view" role="dialog" aria-modal="true" aria-labelledby="compass-title">
      <header className="cal-head">
        <div>
          <button type="button" className="settings-back" onClick={onClose}>
            Zurück
          </button>
          <h2 id="compass-title">Kompass</h2>
          <p>Live, magnetisch. Halten Sie das Handy flach.</p>
        </div>
      </header>
      <div className="compass-face-wrap">
        <div className="compass-fixed-pointer" aria-hidden />
        <div className="compass-face" style={{ transform: `rotate(${-deg}deg)` }} aria-hidden>
          <span className="compass-n">N</span>
          <span className="compass-e">O</span>
          <span className="compass-s">S</span>
          <span className="compass-w">W</span>
        </div>
        <p className="compass-readout">
          {heading == null ? 'Suche Sensor…' : `Sie schauen nach ${word}, ${Math.round(deg)} Grad.`}
        </p>
        {err ? <p className="settings-hint">{err}</p> : null}
      </div>
    </div>
  )
}
