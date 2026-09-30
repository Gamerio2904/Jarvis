import { useEffect, useState } from 'react'
import { readGlanceSnap, type GlanceSnap } from '../engine/glance-snap.ts'

const EMPTY: GlanceSnap = {
  clock: '--:--',
  weekday: '',
  next: 'Nichts geplant',
  weather: 'Wetter im Chat fragen',
  shop: 0,
  timer: '',
  groq: false,
  gemini: false,
  version: '',
}

export function GlanceRail({
  open,
  onToggle,
  tischplatteOn,
  onTischplatte,
  leisteOn,
  onLeiste,
}: {
  open: boolean
  onToggle: () => void
  tischplatteOn: boolean
  onTischplatte: (on: boolean) => void
  leisteOn: boolean
  onLeiste: (on: boolean) => void
}) {
  const [snap, setSnap] = useState<GlanceSnap>(EMPTY)
  useEffect(() => {
    let dead = false
    const load = () => {
      void readGlanceSnap()
        .then((row) => {
          if (!dead) setSnap(row)
        })
        .catch(() => {
          /* Store kann beim Start noch zu sein */
        })
    }
    load()
    const id = window.setInterval(load, 20_000)
    return () => {
      dead = true
      window.clearInterval(id)
    }
  }, [open])
  const hirn = snap.gemini ? 'Gemini-Key da' : snap.groq ? 'Groq-Key da' : 'Kein Cloud-Key'
  return (
    <aside className={`glance-rail${open ? ' is-open' : ''}`} aria-label="Werte">
      <button
        type="button"
        className="glance-rail-tab"
        aria-expanded={open}
        aria-controls="glance-rail-panel"
        onClick={onToggle}
      >
        <span className="glance-rail-tab-mark" aria-hidden />
        <span className="glance-rail-tab-lab">{open ? 'Zu' : 'Werte'}</span>
      </button>
      <div id="glance-rail-panel" className="glance-rail-panel" hidden={!open}>
        <p className="glance-rail-clock">{snap.clock}</p>
        <p className="glance-rail-day">{snap.weekday}</p>
        <dl>
          <div>
            <dt>Als Nächstes</dt>
            <dd>{snap.next}</dd>
          </div>
          {snap.timer ? (
            <div>
              <dt>Timer</dt>
              <dd>{snap.timer}</dd>
            </div>
          ) : null}
          <div>
            <dt>Wetter</dt>
            <dd>{snap.weather}</dd>
          </div>
          <div>
            <dt>Einkauf</dt>
            <dd>{snap.shop ? `${snap.shop} offen` : 'Liste leer'}</dd>
          </div>
          <div>
            <dt>Hirn</dt>
            <dd>{hirn}</dd>
          </div>
          <div>
            <dt>App</dt>
            <dd>{snap.version}</dd>
          </div>
        </dl>
        <div className="glance-tisch">
          <span>Tischplatte</span>
          <div className="glance-tisch-btns" role="group" aria-label="Tischplatte">
            <button
              type="button"
              className={tischplatteOn ? 'is-on' : ''}
              data-tischplatte="on"
              aria-pressed={tischplatteOn}
              onClick={() => onTischplatte(true)}
            >
              an
            </button>
            <button
              type="button"
              className={!tischplatteOn ? 'is-on' : ''}
              data-tischplatte="off"
              aria-pressed={!tischplatteOn}
              onClick={() => onTischplatte(false)}
            >
              aus
            </button>
          </div>
        </div>
        <div className="glance-tisch">
          <span>Leiste</span>
          <div className="glance-tisch-btns" role="group" aria-label="Leiste">
            <button
              type="button"
              className={leisteOn ? 'is-on' : ''}
              data-leiste="on"
              aria-pressed={leisteOn}
              onClick={() => onLeiste(true)}
            >
              an
            </button>
            <button
              type="button"
              className={!leisteOn ? 'is-on' : ''}
              data-leiste="off"
              aria-pressed={!leisteOn}
              onClick={() => onLeiste(false)}
            >
              aus
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
