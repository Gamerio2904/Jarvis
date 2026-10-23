import { HOME_APPS, type HomeAppId } from '../engine/home-apps.ts'
import {
  applyHomeDrop,
  ejectHomeApp,
  folderPageCount,
  folderPageSlots,
  parseHomeLayout,
  renameHomeFolder,
  serializeHomeLayout,
  type HomeLayout,
} from '../engine/home-layout.ts'
import { loadSettings, saveSettings, setStandAt } from '../engine/store.ts'
import { clockLabel, weekdayLabel } from '../engine/glance-snap.ts'
import { parseThemeHint, DEFAULT_THEME, type BoardTheme } from '../engine/board-theme.ts'
import { draftFramesOpen } from '../engine/entwurf-parse.ts'
import { PortfolioStage } from './PortfolioStage.tsx'
import { scanPhase, ScanStage } from './ScanStage.tsx'
import { EntwurfStage } from './EntwurfStage.tsx'
import { Workbench } from './Workbench.tsx'
import { memo, useEffect, useRef, useState, type PointerEvent } from 'react'

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
  if (id === 'lage') {
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
  if (id === 'server') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <rect x="4" y="3.5" width="16" height="5.2" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="10.4" width="16" height="5.2" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M7.2 6.1h.1M7.2 13h.1M16.2 6.1h2M16.2 13h2" />
      </svg>
    )
  }
  if (id === 'overlay') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          d="M5 15.2 6.8 9.4A2 2 0 0 1 8.7 8h6.6a2 2 0 0 1 1.9 1.4l1.8 5.8"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          d="M3.8 15.2h16.4v2.6a1.3 1.3 0 0 1-1.3 1.3H16a1.3 1.3 0 0 1-1.3-1.3v-.4H9.3v.4A1.3 1.3 0 0 1 8 19.1H5.1a1.3 1.3 0 0 1-1.3-1.3v-2.6Z"
        />
        <circle cx="7.6" cy="16.6" r="0.85" fill="currentColor" />
        <circle cx="16.4" cy="16.6" r="0.85" fill="currentColor" />
      </svg>
    )
  }
  if (id === 'tisch') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          d="M3.5 8.2h17l-1.5 3.4H5L3.5 8.2Z"
        />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M7.2 11.6v7.2M16.8 11.6v7.2" />
      </svg>
    )
  }
  if (id === 'chess') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path fill="currentColor" d="M4.6 4.6h7.4v7.4H4.6zM12 12h7.4v7.4H12z" />
      </svg>
    )
  }
  if (id === 'yugioh') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <rect x="6.2" y="3.2" width="11.6" height="17.6" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <rect x="8" y="5.4" width="8" height="6.2" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M8.2 14.2h7.6M8.2 16.8h5" />
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
  if (id === 'shopping') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          d="M6 7h15l-1.4 8H7.4L6 7Z"
        />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" d="M6 7 5 3H2" />
        <circle cx="9" cy="19.5" r="1.2" fill="currentColor" />
        <circle cx="17" cy="19.5" r="1.2" fill="currentColor" />
      </svg>
    )
  }
  if (id === 'notes') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M5 3.8h10l4 4v12.4H5V3.8Z" />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M8.5 11h7M8.5 14.5h7M15 4v4h4" />
      </svg>
    )
  }
  if (id === 'library') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M4 4.5h6.5v15H4V4.5Z" />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M13.5 4.5H20v15h-6.5v-15Z" />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M6.5 8h1.5M6.5 11h1.5M15.5 8H17M15.5 11H17M15.5 14h1.5" />
      </svg>
    )
  }
  if (id === 'core') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <circle cx="12" cy="12" r="2.1" fill="currentColor" />
        <circle cx="12" cy="4.6" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="18.4" cy="15.7" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="5.6" cy="15.7" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
      </svg>
    )
  }
  if (id === 'welt') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M12 4.2 19 8.2v7.6L12 19.8 5 15.8V8.2L12 4.2Z" />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" d="M12 4.2v15.6M5 8.2l7 4 7-4" />
      </svg>
    )
  }
  if (id === 'todos') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="m4 7 1.5 1.5L8 6M11 7h9M4 15l1.5 1.5L8 14M11 15h9" />
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

function HomeLauncher({ onOpen }: { onOpen: (id: HomeAppId) => void }) {
  const [layout, setLayout] = useState<HomeLayout>(() => parseHomeLayout(loadSettings().home_layout_json))
  const [openFolder, setOpenFolder] = useState<string | null>(null)
  const [folderPage, setFolderPage] = useState(0)
  const folderSwipe = useRef<{ x: number; y: number; id: number } | null>(null)
  const folderMoved = useRef(false)
  /** Schützt den Ordner vor dem Phantom-Klick: Der Browser feuert nach dem
   * pointerup, der den Ordner öffnet, einen click auf den jetzt obenliegenden
   * Backdrop — ohne Sperre schließt der den Ordner nach ~100 ms wieder. */
  const folderOpenedAt = useRef(0)
  /** Schon per pointerup geöffnet: der nachfolgende click darf nicht doppelt öffnen. */
  const tapHandledAt = useRef(0)
  const [ghost, setGhost] = useState<{ x: number; y: number; label: string } | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const drag = useRef<{
    pointerId: number
    from: number
    x: number
    y: number
    dragging: boolean
    hover: number | null
    hoverAt: number
    hold: number
  } | null>(null)

  useEffect(() => {
    const sync = () => setLayout(parseHomeLayout(loadSettings().home_layout_json))
    window.addEventListener('jarvis-settings', sync)
    return () => window.removeEventListener('jarvis-settings', sync)
  }, [])

  function commit(next: HomeLayout) {
    setLayout(next)
    saveSettings({ home_layout_json: serializeHomeLayout(next) })
    // Der Hausstand-Zeitstempel folgt: Layout-Änderungen sind ein neuer Stand
    // und gewinnen damit beim Abgleich zwischen den Geräten.
    setStandAt(new Date().toISOString())
  }

  function labelOf(index: number): string {
    const cell = layout.cells[index]
    if (!cell) return ''
    if (cell.kind === 'folder') return cell.folder.name
    return HOME_APPS.find((app) => app.id === cell.id)?.label || cell.id
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (event.button !== 0 || !layout.cells[index]) return
    event.preventDefault()
    const hold = window.setTimeout(() => {
      const current = drag.current
      if (!current || current.from !== index || current.dragging) return
      current.dragging = true
      setGhost({ x: event.clientX, y: event.clientY, label: labelOf(index) })
    }, 280)
    drag.current = {
      pointerId: event.pointerId,
      from: index,
      x: event.clientX,
      y: event.clientY,
      dragging: false,
      hover: null,
      hoverAt: 0,
      hold,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current
    if (!current || event.pointerId !== current.pointerId) return
    const distance = Math.hypot(event.clientX - current.x, event.clientY - current.y)
    // Zitternde Finger bis 12px bleiben ein Tap; erst danach beginnt ein Drag.
    if (!current.dragging && distance > 12) {
      current.dragging = true
      window.clearTimeout(current.hold)
    }
    if (!current.dragging) return
    setGhost({ x: event.clientX, y: event.clientY, label: labelOf(current.from) })
    const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-home-cell]')
    const index = hit ? Number(hit.getAttribute('data-home-cell')) : null
    const next = Number.isInteger(index) ? index : null
    if (next !== current.hover) {
      current.hover = next
      current.hoverAt = Date.now()
      setHover(next)
    }
  }

  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current
    if (!current || event.pointerId !== current.pointerId) return
    window.clearTimeout(current.hold)
    drag.current = null
    setGhost(null)
    setHover(null)
    const moved = Math.hypot(event.clientX - current.x, event.clientY - current.y) > 12
    const cell = layout.cells[current.from]
    // Langsamer Tap: Der Halte-Timer machte ihn zum Drag und der Klick starb.
    // Ohne echte Bewegung zählt jeder Druck als Antippen.
    if (!moved) {
      tapHandledAt.current = Date.now()
      openCell(cell)
      return
    }
    if (!current.dragging) return
    if (current.hover === null || current.hover === current.from) return
    const hoverMs = Date.now() - current.hoverAt
    commit(applyHomeDrop(layout, current.from, current.hover, hoverMs))
  }

  const folder = layout.cells.find((cell) => cell?.kind === 'folder' && cell.folder.id === openFolder)
  const open = folder?.kind === 'folder' ? folder.folder : null
  const folderPages = open ? folderPageCount(open.apps.length) : 1
  const folderSlots = open ? folderPageSlots(open.apps, folderPage) : []
  const folderDot = ((folderPage % folderPages) + folderPages) % folderPages

  /** Öffnen aus dem Pointer-Pfad heraus; der Klick-Fallback greift nur, wenn
   * der pointerup auf dem Handy verloren ging. */
  function openCell(cell: (typeof layout.cells)[number]) {
    if (!cell) return
    if (cell.kind === 'app') onOpen(cell.id)
    else {
      setFolderPage(0)
      folderOpenedAt.current = Date.now()
      setOpenFolder(cell.folder.id)
    }
  }

  function onFolderPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    folderMoved.current = false
    folderSwipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
  }

  function onFolderPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = folderSwipe.current
    folderSwipe.current = null
    if (!start || start.id !== event.pointerId || folderPages < 2) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return
    folderMoved.current = true
    setFolderPage((page) => page + (dx < 0 ? 1 : -1))
  }

  return (
    <div className={`home-grid${ghost ? ' is-dragging' : ''}`} aria-label="Apps">
      {layout.cells.map((cell, index) => cell ? (
        <button
          key={cell.kind === 'app' ? cell.id : cell.folder.id}
          type="button"
          className={`home-app${hover === index ? ' is-hover' : ''}`}
          data-home-app={cell.kind === 'app' ? cell.id : cell.folder.id}
          data-home-cell={index}
          onPointerDown={(event) => onPointerDown(event, index)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => {
            if (Date.now() - tapHandledAt.current < 700) return
            openCell(layout.cells[index])
          }}
          onPointerCancel={(event) => {
            const current = drag.current
            if (!current || event.pointerId !== current.pointerId) return
            window.clearTimeout(current.hold)
            drag.current = null
            setGhost(null)
            setHover(null)
          }}
        >
          <span className={`home-app-ico${cell.kind === 'folder' ? ' is-folder' : ''}`}>
            {cell.kind === 'app' ? <AppGlyph id={cell.id} /> : (
              <span className="home-folder-stack" aria-hidden>
                {cell.folder.apps.slice(0, 4).map((id) => <AppGlyph key={id} id={id} />)}
              </span>
            )}
          </span>
          <span className="home-app-label">{cell.kind === 'app' ? (HOME_APPS.find((app) => app.id === cell.id)?.label || cell.id) : cell.folder.name}</span>
        </button>
      ) : (
        <div key={`leer-${index}`} className="home-cell" data-home-cell={index} />
      ))}
      {ghost ? <div className="home-app-ghost" style={{ left: ghost.x, top: ghost.y }}>{ghost.label}</div> : null}
      {open ? (
        <div
          className="home-folder-back"
          onClick={() => {
            if (Date.now() - folderOpenedAt.current < 450) return
            setOpenFolder(null)
          }}
        >
          <div
            className="home-folder"
            role="dialog"
            aria-label={open.name}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={onFolderPointerDown}
            onPointerUp={onFolderPointerUp}
          >
            <label className="home-folder-name">
              <input
                value={open.name}
                maxLength={24}
                aria-label="Ordnername"
                onChange={(event) => commit(renameHomeFolder(layout, open.id, event.target.value))}
              />
            </label>
            <div className="home-folder-grid">
              {folderSlots.map((id, index) => id ? (
                <button
                  key={id}
                  type="button"
                  className="home-app home-folder-app"
                  onClick={() => {
                    if (folderMoved.current) {
                      folderMoved.current = false
                      return
                    }
                    setOpenFolder(null)
                    onOpen(id)
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    commit(ejectHomeApp(layout, open.id, id))
                  }}
                >
                  <span className="home-app-ico"><AppGlyph id={id} /></span>
                  <span className="home-app-label">{HOME_APPS.find((app) => app.id === id)?.label || id}</span>
                </button>
              ) : (
                <div key={`leer-${folderDot}-${index}`} className="home-folder-slot" />
              ))}
            </div>
            {folderPages > 1 ? (
              <div className="home-folder-dots" aria-label="Seiten">
                {Array.from({ length: folderPages }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={index === folderDot ? 'is-on' : ''}
                    aria-label={`Seite ${index + 1}`}
                    onClick={() => setFolderPage(index)}
                  />
                ))}
              </div>
            ) : null}
            <button type="button" className="home-folder-close" onClick={() => setOpenFolder(null)}>Schließen</button>
          </div>
        </div>
      ) : null}
    </div>
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
  workbenchOpen,
}: {
  face: 'ultron'
  onOpen: (id: HomeAppId) => void
  tischplatteOn: boolean
  view: string
  focus: string
  hint: string
  seed: number
  planPhase: '' | 'live' | 'go'
  workbenchOpen: boolean
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
          {planPhase === 'live' || planPhase === 'go' || workbenchOpen || view === 'sim' || view === 'workflow' ? (
            <Workbench view={view} focus={focus} />
          ) : (
            <PortfolioStage />
          )}
        </div>
      ) : null}
      {tischplatteOn && scan !== 'off' ? <ScanStage phase={scan} /> : null}
      {tischplatteOn && scan === 'off' ? <EntwurfStage /> : null}
      <div hidden={tischplatteOn} inert={tischplatteOn} aria-hidden={tischplatteOn}>
        <HomeLauncher onOpen={onOpen} />
      </div>
    </section>
  )
})
