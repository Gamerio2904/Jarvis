import { HOME_APPS, type HomeAppId } from '../engine/home-apps.ts'
import { clockLabel, weekdayLabel } from '../engine/glance-snap.ts'
import { parseThemeHint, DEFAULT_THEME, type BoardTheme } from '../engine/board-theme.ts'
import { draftFramesOpen } from '../engine/entwurf-parse.ts'
import { PortfolioStage } from './PortfolioStage.tsx'
import { scanPhase, ScanStage } from './ScanStage.tsx'
import { EntwurfStage } from './EntwurfStage.tsx'
import { Workbench } from './Workbench.tsx'
import { memo, useEffect, useState } from 'react'

function AppGlyph({ id }: { id: HomeAppId }) {
  if (id === 'chat') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          d="M5 6.2h14v9.2H9.2L5 19.2V6.2Z"
        />
      </svg>
    )
  }
  if (id === 'voice') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <rect x="9" y="3.5" width="6" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M6.8 11.5a5.2 5.2 0 0 0 10.4 0M12 16.7V20.5"
        />
      </svg>
    )
  }
  if (id === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M8 3.5v4M16 3.5v4M3.5 10h17" />
      </svg>
    )
  }
  if (id === 'globe' || id === 'lage') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          d="M3.8 12h16.4M12 3.8c2.4 2.6 3.6 5.4 3.6 8.2S14.4 17.6 12 20.2C9.6 17.6 8.4 14.8 8.4 12S9.6 6.4 12 3.8Z"
        />
      </svg>
    )
  }
  if (id === 'overlay') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <rect x="4" y="5.5" width="16" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M8 12h8M12 8.5v7" />
      </svg>
    )
  }
  if (id === 'hirn') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          d="M12 4.5c2.2 0 4 1.4 4.6 3.4A4.2 4.2 0 0 1 20 12c0 2.4-1.6 3.8-3.4 4.2v3.3h-9.2v-3.3C5.6 15.8 4 14.4 4 12a4.2 4.2 0 0 1 3.4-4.1C8 5.9 9.8 4.5 12 4.5Z"
        />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M12 4.5v15" />
      </svg>
    )
  }
  if (id === 'watchlist') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <rect x="3.5" y="5.2" width="17" height="13.6" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M7 5.2v13.6M17 5.2v13.6M3.5 9.2h3.5M3.5 14.8h3.5M17 9.2h3.5M17 14.8h3.5"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        d="M12 3.4 13.4 6l2.8-.4 1.4 2.5 2.4 1.5L18.6 12l1.4 2.4-2.4 1.5-1.4 2.5-2.8-.4L12 20.6 10.6 18l-2.8.4-1.4-2.5-2.4-1.5L5.4 12 4 9.6l2.4-1.5L7.8 5.6l2.8.4L12 3.4Z"
      />
    </svg>
  )
}

export const HomeScreen = memo(function HomeScreen({
  face,
  onOpen,
  tischplatteOn,
  view,
  focus,
  hint,
  seed,
  planPhase,
}: {
  face: 'ultron'
  onOpen: (id: HomeAppId) => void
  tischplatteOn: boolean
  view: string
  focus: string
  hint: string
  seed: number
  planPhase: '' | 'live' | 'go'
}) {
  const [now, setNow] = useState(() => new Date())
  const [scan, setScan] = useState(() => scanPhase())
  const [frames, setFrames] = useState(() => draftFramesOpen())
  useEffect(() => {
    let timer = 0
    const tick = () => {
      const now = new Date()
      setNow(now)
      const wait = 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds())
      timer = window.setTimeout(tick, Math.max(250, wait))
    }
    const onVis = () => {
      if (document.hidden) return
      window.clearTimeout(timer)
      tick()
    }
    tick()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])
  useEffect(() => {
    const on = () => {
      setScan(scanPhase())
      setFrames(draftFramesOpen())
    }
    on()
    window.addEventListener('jarvis-settings', on)
    return () => window.removeEventListener('jarvis-settings', on)
  }, [])
  const theme: BoardTheme = parseThemeHint(hint) || DEFAULT_THEME
  return (
    <section
      className={`home-screen${tischplatteOn ? ' is-tischplatte' : ''}${scan === 'live' ? ' is-scan-live' : ''}${scan === 'model' ? ' is-scan-model' : ''}${frames ? ' is-entwurf' : ''}`}
      aria-label="Homescreen"
      data-home-wall={tischplatteOn ? 'board' : 'launcher'}
      data-voice={face}
      data-motif={theme.motif}
      style={{
        ['--board-accent' as string]: theme.accent,
        ['--board-glow' as string]: String(theme.glow),
        ['--board-density' as string]: String(theme.density),
        ['--board-seed' as string]: String(seed || 0),
      }}
    >
      <div className="home-wall home-wall--launcher" aria-hidden />
      <div className="home-wall home-wall--board" aria-hidden>
        <span className="home-wall-ring" />
        <span className="home-wall-ring is-2" />
      </div>
      <header className="home-clock">
        <p className="home-clock-time">{clockLabel(now)}</p>
        <p className="home-clock-day">{weekdayLabel(now)}</p>
        <p className="home-clock-face">Ultron</p>
      </header>
      {tischplatteOn && scan === 'off' ? (
        <div className="table-under" inert={frames}>
          {planPhase === 'live' ? <Workbench view={view} focus={focus} /> : <PortfolioStage />}
        </div>
      ) : null}
      {tischplatteOn && scan !== 'off' ? <ScanStage phase={scan} /> : null}
      {tischplatteOn && scan === 'off' ? <EntwurfStage /> : null}
      <div className="home-grid" hidden={tischplatteOn} inert={tischplatteOn} aria-hidden={tischplatteOn}>
        {HOME_APPS.map((app) => (
          <button
            key={app.id}
            type="button"
            className="home-app"
            data-home-app={app.id}
            onClick={() => onOpen(app.id)}
          >
            <span className="home-app-ico">
              <AppGlyph id={app.id} />
            </span>
            <span className="home-app-label">{app.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
})
