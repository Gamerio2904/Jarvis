import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import {
  getDriveRoute,
  getDriveTab,
  refreshDriveRoute,
  setDriveTab,
  subscribeDrive,
  type DriveRoute,
  type DriveTab,
} from './engine/drive'
import {
  TILE_SIZE,
  dayTiles,
  prefetchTile,
  projectToView,
  readLastMapFix,
  settleZoom,
  tilesPending,
  tileUrl,
  webMercator,
  zoomForSpeedMps,
  type MapFix,
} from './engine/drive-map'
import { formatNavBanner, nextManeuver } from './engine/nav-speak'
import { watchDeviceLocation } from './native/geo'
import { listenOnce, requestMicPermission, setKeepScreenOn, speakCueFast, stopSpeak } from './native/voice'
import { isChatSpeaking } from './engine/speak-lock'
import { parseFuelIntent } from './engine/fuel-parse'
import { parsePoiIntent } from './engine/poi-parse'
import {
  activateSpotifyElement,
  ensureInternalPlayer,
  getSpotifyNow,
  getSpotifyPlayerStatus,
  pauseSpotify,
  playQuery,
  nextSpotify,
  prevSpotify,
  refreshNow,
  resumeSpotify,
  spotifyConfigured,
  spotifyLoggedIn,
  spotifySourceLabel,
  startSpotifyLogin,
  subscribeSpotify,
  type SpotifyNow,
  type SpotifyPlayerStatus,
} from './engine/spotify'

function FollowMap({
  destLat,
  destLon,
  coords,
  live,
}: {
  destLat: number
  destLon: number
  coords: Array<[number, number]>
  live: MutableRefObject<MapFix>
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const youRef = useRef<HTMLDivElement>(null)
  const destRef = useRef({ lat: destLat, lon: destLon, coords })
  destRef.current = { lat: destLat, lon: destLon, coords }
  const cam = useRef({ lat: live.current.lat, lon: live.current.lon })
  const zoomRef = useRef(zoomForSpeedMps(live.current.speed))
  const zoomWantedAt = useRef(0)
  const headingRef = useRef(live.current.bearing || 0)

  useEffect(() => {
    let liveLoop = true
    let lastDraw = 0
    let frame = 0

    const paint = (now: number) => {
      const box = wrapRef.current
      const canvas = canvasRef.current
      const pin = youRef.current
      if (!box || !canvas) return
      const cssW = box.clientWidth
      const cssH = box.clientHeight
      if (cssW < 8 || cssH < 8) return

      const here = live.current
      const jump = Math.abs(here.lat - cam.current.lat) + Math.abs(here.lon - cam.current.lon) > 0.05
      if (jump) {
        cam.current = { lat: here.lat, lon: here.lon }
      } else {
        cam.current.lat += (here.lat - cam.current.lat) * 0.18
        cam.current.lon += (here.lon - cam.current.lon) * 0.18
      }

      const wanted = zoomForSpeedMps(here.speed)
      if (wanted !== zoomRef.current) {
        if (!zoomWantedAt.current) zoomWantedAt.current = now
        zoomRef.current = settleZoom(zoomRef.current, wanted, zoomWantedAt.current, now)
        if (zoomRef.current === wanted) zoomWantedAt.current = 0
      } else {
        zoomWantedAt.current = 0
      }

      const still =
        Math.abs(here.lat - cam.current.lat) + Math.abs(here.lon - cam.current.lon) < 4e-7 &&
        tilesPending() === 0
      if (still && now - lastDraw < 200) return
      lastDraw = now

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const pw = Math.round(cssW * dpr)
      const ph = Math.round(cssH * dpr)
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw
        canvas.height = ph
      }
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return

      const z = zoomRef.current
      const day = dayTiles()
      const cx = cssW * 0.5
      const cy = cssH * 0.58
      const camM = webMercator(cam.current.lat, cam.current.lon, z)
      const x0 = Math.floor(camM.x - cx / TILE_SIZE) - 1
      const y0 = Math.floor(camM.y - cy / TILE_SIZE) - 1
      const x1 = Math.ceil(camM.x + (cssW - cx) / TILE_SIZE) + 1
      const y1 = Math.ceil(camM.y + (cssH - cy) / TILE_SIZE) + 1

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.fillStyle = day ? '#e4e0d4' : '#0b100e'
      ctx.fillRect(0, 0, cssW, cssH)

      const ready = () => {
        lastDraw = 0
      }
      for (let ty = y0; ty <= y1; ty += 1) {
        for (let tx = x0; tx <= x1; tx += 1) {
          const img = prefetchTile(tileUrl(z, tx, ty, day), ready)
          const sx = (tx - camM.x) * TILE_SIZE + cx
          const sy = (ty - camM.y) * TILE_SIZE + cy
          if (img) ctx.drawImage(img, sx, sy, TILE_SIZE, TILE_SIZE)
        }
      }

      const dest = destRef.current
      if (dest.coords.length >= 2) {
        ctx.beginPath()
        let started = false
        let lastX = Infinity
        let lastY = Infinity
        for (const pair of dest.coords) {
          const lon = Number(pair?.[0])
          const lat = Number(pair?.[1])
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
          const p = projectToView(lat, lon, cam.current.lat, cam.current.lon, z, cx, cy)
          if (Math.abs(p.x - lastX) < 1.2 && Math.abs(p.y - lastY) < 1.2) continue
          lastX = p.x
          lastY = p.y
          if (!started) {
            ctx.moveTo(p.x, p.y)
            started = true
          } else {
            ctx.lineTo(p.x, p.y)
          }
        }
        if (started) {
          ctx.lineJoin = 'round'
          ctx.lineCap = 'round'
          ctx.strokeStyle = '#070908'
          ctx.lineWidth = 8
          ctx.stroke()
          ctx.strokeStyle = '#1ed760'
          ctx.lineWidth = 4
          ctx.stroke()
        }
      }

      const pinPt = projectToView(dest.lat, dest.lon, cam.current.lat, cam.current.lon, z, cx, cy)
      if (Number.isFinite(pinPt.x) && Number.isFinite(pinPt.y)) {
        ctx.beginPath()
        ctx.arc(pinPt.x, pinPt.y, 7, 0, Math.PI * 2)
        ctx.fillStyle = '#f15e6c'
        ctx.fill()
        ctx.lineWidth = 3
        ctx.strokeStyle = '#070908'
        ctx.stroke()
      }

      const heading = here.bearing != null && Number.isFinite(here.bearing) ? here.bearing : headingRef.current
      const delta = ((heading - headingRef.current + 540) % 360) - 180
      headingRef.current += delta * 0.22
      if (pin) pin.style.transform = `rotate(${headingRef.current}deg)`
    }

    const tick = (now: number) => {
      if (!liveLoop) return
      paint(now)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      liveLoop = false
      cancelAnimationFrame(frame)
    }
  }, [live])

  return (
    <div
      className="drive-map-wrap"
      ref={wrapRef}
      onClick={() => {
        cam.current = { lat: live.current.lat, lon: live.current.lon }
      }}
    >
      <canvas className="drive-map-canvas" ref={canvasRef} />
      <div className="drive-you" ref={youRef} aria-hidden>
        <svg viewBox="-12 -14 24 28">
          <polygon points="0,-12 8,12 -8,12" fill="#e4c36a" stroke="#070908" strokeWidth="2" />
        </svg>
      </div>
    </div>
  )
}

function seedLiveFix(): MapFix {
  const route = getDriveRoute()
  if (route && Number.isFinite(route.fromLat) && Number.isFinite(route.fromLon)) {
    return { lat: route.fromLat, lon: route.fromLon }
  }
  return readLastMapFix() || { lat: 48.78, lon: 9.18 }
}

function sourceHint(now: SpotifyNow | null, status: SpotifyPlayerStatus): string {
  const fromTrack = spotifySourceLabel(now?.source)
  if (fromTrack) return fromTrack
  if (status === 'loading') return 'Player startet…'
  if (status === 'ready') return 'bereit in Jarvis'
  if (status === 'unavailable') return 'Vorschau oder anderes Gerät'
  return 'Spotify in Jarvis'
}

export function DriveMode({
  onClose,
  onCommand,
}: {
  onClose: () => void
  onCommand?: (text: string) => void
}) {
  const [route, setRoute] = useState<DriveRoute | null>(() => getDriveRoute())
  const [tab, setTab] = useState<DriveTab>(() => getDriveTab())
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null)
  const liveRef = useRef<MapFix>(seedLiveFix())
  const hudAt = useRef(0)
  const [now, setNow] = useState<SpotifyNow | null>(() => getSpotifyNow())
  const [player, setPlayer] = useState<SpotifyPlayerStatus>(() => getSpotifyPlayerStatus())
  const [q, setQ] = useState('')
  const [destQ, setDestQ] = useState('')
  const [musicMsg, setMusicMsg] = useState<string | null>(null)
  const [musicBusy, setMusicBusy] = useState(false)
  const [hearMsg, setHearMsg] = useState<string | null>(null)
  const navBusy = useRef(false)
  const loggedIn = spotifyLoggedIn()
  const configured = spotifyConfigured()

  useEffect(() => subscribeDrive(() => {
    setRoute(getDriveRoute())
    setTab(getDriveTab())
  }), [])
  useEffect(() => {
    if (here) return
    if (!route) return
    liveRef.current = { ...liveRef.current, lat: route.fromLat, lon: route.fromLon }
  }, [route, here])
  useEffect(
    () =>
      subscribeSpotify(() => {
        setNow(getSpotifyNow())
        setPlayer(getSpotifyPlayerStatus())
      }),
    [],
  )

  useEffect(() => {
    void setKeepScreenOn(true)
    return () => {
      void setKeepScreenOn(false)
    }
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    void ensureInternalPlayer()
    const id = window.setInterval(() => void refreshNow(), 8000)
    return () => window.clearInterval(id)
  }, [loggedIn])

  useEffect(() => {
    return watchDeviceLocation((fix) => {
      if (!fix.ok || fix.lat == null || fix.lon == null) return
      const pos = { lat: fix.lat, lon: fix.lon }
      liveRef.current = {
        lat: pos.lat,
        lon: pos.lon,
        bearing: fix.bearing ?? liveRef.current.bearing,
        speed: fix.speed ?? liveRef.current.speed,
      }
      const t = Date.now()
      if (t - hudAt.current > 280) {
        hudAt.current = t
        setHere(pos)
      }
      void refreshDriveRoute({ ...pos, bearing: fix.bearing, speed: fix.speed }).then((guide) => {
        if (!guide?.cue) return
        if (guide.cue.startsWith('Ziel')) {
          setDriveTab('map')
        }
        const nowCue = guide.cue.startsWith('Jetzt') || guide.cue.startsWith('Ziel')
        if (!nowCue && isChatSpeaking()) return
        if (nowCue) {
          void stopSpeak().then(() => speakCueFast(guide.cue as string))
          return
        }
        if (navBusy.current) return
        navBusy.current = true
        void speakCueFast(guide.cue).finally(() => {
          navBusy.current = false
        })
      })
    })
  }, [])

  const hud = useMemo(() => {
    if (!route) return null
    const pos = here || { lat: route.fromLat, lon: route.fromLon }
    const nxt = nextManeuver(
      (route.steps || []).map((s) => ({
        lat: s.lat,
        lon: s.lon,
        type: s.type,
        modifier: s.modifier,
        name: s.name,
      })),
      route.coords,
      pos,
    )
    if (!nxt) return { arrow: '↑', line: route.dest || 'Wohin?', sub: route.hint || '' }
    return formatNavBanner(nxt.dir, nxt.meters, nxt.name)
  }, [here, route])

  const km = route && route.meters ? (route.meters >= 1000 ? `${(route.meters / 1000).toFixed(1)} km` : `${route.meters} m`) : ''

  function goDest(raw: string) {
    const dest = raw.trim()
    if (!dest || !onCommand) return
    if (
      parsePoiIntent(dest) ||
      parseFuelIntent(dest) ||
      /^(nach|zu(?:r|m)?|fahr|bring|navigier)\b/i.test(dest)
    ) {
      onCommand(dest)
      return
    }
    onCommand(`nach ${dest}`)
  }

  function hear() {
    setHearMsg('Ich höre…')
    void requestMicPermission().then((ok) => {
      if (!ok) {
        setHearMsg('Mikrofon erlauben.')
        return
      }
      return listenOnce((partial) => setHearMsg(partial || 'Ich höre…')).then((res) => {
        if (res.text) {
          setHearMsg(null)
          onCommand?.(res.text)
        } else setHearMsg(res.message || 'Nichts gehört.')
      })
    })
  }

  return (
    <div className="drive-view" role="dialog" aria-labelledby="drive-title">
      <FollowMap
        destLat={route?.destLat ?? liveRef.current.lat}
        destLon={route?.destLon ?? liveRef.current.lon}
        coords={route?.coords || []}
        live={liveRef}
      />
      <header className="drive-bar">
        <div>
          <p className="settings-kicker">CarPlay</p>
          <h2 id="drive-title">{route?.dest || 'Wohin?'}</h2>
        </div>
        <div className="drive-bar-actions">
          <button type="button" className="settings-close" onClick={onClose}>
            Fertig
          </button>
        </div>
      </header>
      {hud ? (
        <div className={`drive-hud ${dayTiles() ? 'is-day' : ''}`} aria-live="polite">
          <span className="drive-hud-arrow">{hud.arrow}</span>
          <div>
            <strong>{hud.line}</strong>
            <span>{hud.sub}</span>
          </div>
          <div className="drive-hud-eta">
            <strong>{route ? `${route.minutes || '—'} Min` : '—'}</strong>
            <span>{km}</span>
          </div>
        </div>
      ) : null}
      {tab === 'spotify' ? (
        <div className="drive-spotify-overlay" onPointerDown={() => void activateSpotifyElement()}>
          <div className="drive-now-row">
            {now?.art ? <img className="drive-art" src={now.art} alt="" /> : <div className="drive-art drive-art-empty" />}
            <div>
              <p className="drive-now">{now ? `${now.playing ? '▶' : '❚❚'} ${now.name}` : 'Spotify in Jarvis'}</p>
              <p className="drive-now-sub">
                {now?.artist ? `${now.artist} · ` : ''}
                {sourceHint(now, player)}
              </p>
            </div>
          </div>
          {loggedIn ? (
            <>
              <form
                className="drive-search"
                onSubmit={(e) => {
                  e.preventDefault()
                  const query = q.trim()
                  if (!query || musicBusy) return
                  setMusicBusy(true)
                  void activateSpotifyElement()
                    .then(() => playQuery(query))
                    .then((msg) => {
                      setMusicMsg(msg)
                      setNow(getSpotifyNow())
                      setMusicBusy(false)
                    })
                }}
              >
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Titel oder Interpret"
                  aria-label="Spotify suchen"
                />
                <button type="submit" disabled={musicBusy}>
                  Spiel
                </button>
              </form>
              <div className="drive-transport">
                <button type="button" disabled={musicBusy} onClick={() => void prevSpotify()}>
                  ⏮
                </button>
                <button
                  type="button"
                  className="drive-play"
                  disabled={musicBusy}
                  onClick={() => {
                    setMusicBusy(true)
                    void activateSpotifyElement()
                      .then(() => (now?.playing ? pauseSpotify() : resumeSpotify()))
                      .then(() => {
                        setNow(getSpotifyNow())
                        setMusicBusy(false)
                      })
                  }}
                >
                  {now?.playing ? 'Pause' : 'Play'}
                </button>
                <button type="button" disabled={musicBusy} onClick={() => void nextSpotify()}>
                  ⏭
                </button>
              </div>
            </>
          ) : configured ? (
            <button
              type="button"
              className="drive-login"
              onClick={() => {
                void startSpotifyLogin().then((r) => {
                  if (!r.ok) setMusicMsg(r.message)
                })
              }}
            >
              Spotify anmelden
            </button>
          ) : (
            <p className="settings-hint">Einstellungen → Musik: Spotify-Client-ID, dann anmelden.</p>
          )}
          {musicMsg ? <p className="settings-hint">{musicMsg}</p> : null}
        </div>
      ) : (
        <form
          className="drive-dest-sheet"
          onSubmit={(e) => {
            e.preventDefault()
            goDest(destQ)
            setDestQ('')
          }}
        >
          <input
            value={destQ}
            onChange={(e) => setDestQ(e.target.value)}
            placeholder="Wohin? z. B. Heilbronn"
            aria-label="Ziel"
          />
          <button type="submit">Los</button>
        </form>
      )}
      {hearMsg ? <p className="drive-hear">{hearMsg}</p> : null}
      <nav className="drive-tabs" aria-label="CarPlay">
        <button type="button" className={tab === 'map' ? 'is-on' : ''} onClick={() => setDriveTab('map')}>
          Karte
        </button>
        <button type="button" className={tab === 'spotify' ? 'is-on' : ''} onClick={() => setDriveTab('spotify')}>
          Spotify
        </button>
        <button type="button" className="drive-mic" onClick={hear} aria-label="Hören">
          Mic
        </button>
      </nav>
    </div>
  )
}
