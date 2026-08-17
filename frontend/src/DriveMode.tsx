import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getDriveRoute,
  getDriveTab,
  refreshDriveRoute,
  setDriveTab,
  subscribeDrive,
  type DriveRoute,
  type DriveTab,
} from './engine/drive'
import { formatNavBanner, nextManeuver } from './engine/nav-speak'
import { watchDeviceLocation } from './native/geo'
import { listenOnce, requestMicPermission, setKeepScreenOn, speakCueFast, stopSpeak } from './native/voice'
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

function world(lat: number, lon: number, z: number) {
  const n = 2 ** z
  const x = ((lon + 180) / 360) * n
  const rad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  return { x, y }
}

function FollowMap({
  destLat,
  destLon,
  z,
  coords,
  you,
  bearing,
}: {
  destLat: number
  destLon: number
  z: number
  coords: Array<[number, number]>
  you?: { lat: number; lon: number }
  bearing?: number
}) {
  const size = 256
  const cols = 7
  const rows = 7
  const wrapRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const target = useRef({ lat: you?.lat ?? destLat, lon: you?.lon ?? destLon })
  target.current = { lat: you?.lat ?? destLat, lon: you?.lon ?? destLon }
  const display = useRef({ ...target.current })
  const [origin, setOrigin] = useState(() => {
    const c = world(target.current.lat, target.current.lon, z)
    return { x: Math.floor(c.x) - 3, y: Math.floor(c.y) - 3 }
  })

  useEffect(() => {
    let live = true
    const tick = () => {
      if (!live) return
      const t = target.current
      const d = display.current
      const jump = Math.abs(t.lat - d.lat) + Math.abs(t.lon - d.lon) > 0.08
      d.lat = jump ? t.lat : d.lat + (t.lat - d.lat) * 0.16
      d.lon = jump ? t.lon : d.lon + (t.lon - d.lon) * 0.16
      const c = world(d.lat, d.lon, z)
      const ox = Math.floor(c.x) - 3
      const oy = Math.floor(c.y) - 3
      setOrigin((prev) => (prev.x === ox && prev.y === oy ? prev : { x: ox, y: oy }))
      const wrap = wrapRef.current
      const layer = layerRef.current
      if (wrap && layer) {
        const fracX = (c.x - ox) * size
        const fracY = (c.y - oy) * size
        const tx = wrap.clientWidth * 0.5 - fracX
        const ty = wrap.clientHeight * 0.62 - fracY
        layer.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`
      }
      requestAnimationFrame(tick)
    }
    const id = requestAnimationFrame(tick)
    return () => {
      live = false
      cancelAnimationFrame(id)
    }
  }, [z])

  const w = cols * size
  const h = rows * size
  const toPx = (la: number, lo: number) => {
    const p = world(la, lo, z)
    return { x: (p.x - origin.x) * size, y: (p.y - origin.y) * size }
  }
  const path = coords
    .map(([lo, la]) => {
      const p = toPx(la, lo)
      return `${p.x},${p.y}`
    })
    .join(' ')
  const tiles = useMemo(() => {
    const list: Array<{ key: string; src: string; left: number; top: number }> = []
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const tx = origin.x + x
        const ty = origin.y + y
        list.push({
          key: `${z}-${tx}-${ty}`,
          src: `https://basemaps.cartocdn.com/dark_all/${z}/${tx}/${ty}@2x.png`,
          left: x * size,
          top: y * size,
        })
      }
    }
    return list
  }, [origin.x, origin.y, z])
  const pin = toPx(destLat, destLon)
  const rot = bearing != null && Number.isFinite(bearing) ? bearing : 0

  return (
    <div className="drive-map-wrap" ref={wrapRef}>
      <div className="drive-map-layer" ref={layerRef} style={{ width: w, height: h }}>
        {tiles.map((t) => (
          <img key={t.key} alt="" src={t.src} style={{ left: t.left, top: t.top }} />
        ))}
        <svg className="drive-svg" viewBox={`0 0 ${w} ${h}`}>
          {path ? (
            <polyline points={path} fill="none" stroke="#1ed760" strokeWidth="6" strokeLinejoin="round" />
          ) : null}
          <circle cx={pin.x} cy={pin.y} r="7" fill="#f15e6c" stroke="#070908" strokeWidth="3" />
        </svg>
      </div>
      <div className="drive-you" aria-hidden>
        <svg viewBox="-12 -14 24 28">
          <polygon
            points="0,-12 8,12 -8,12"
            fill="#e4c36a"
            stroke="#070908"
            strokeWidth="2"
            transform={`rotate(${rot})`}
          />
        </svg>
      </div>
    </div>
  )
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
  const [bearing, setBearing] = useState<number | undefined>(undefined)
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
      setHere(pos)
      if (fix.bearing != null) setBearing(fix.bearing)
      void refreshDriveRoute({ ...pos, bearing: fix.bearing, speed: fix.speed }).then((guide) => {
        if (!guide?.cue) return
        const nowCue = guide.cue.startsWith('Jetzt') || guide.cue.startsWith('Ziel')
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
    const line = /^(nach|zu(?:r|m)?)\s+/i.test(dest) ? dest : `nach ${dest}`
    onCommand(line)
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

  const follow = here || (route ? { lat: route.fromLat, lon: route.fromLon } : { lat: 48.78, lon: 9.18 })

  return (
    <div className="drive-view" role="dialog" aria-labelledby="drive-title">
      <FollowMap
        destLat={route?.destLat ?? follow.lat}
        destLon={route?.destLon ?? follow.lon}
        z={15}
        coords={route?.coords || []}
        you={follow}
        bearing={bearing}
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
        <div className="drive-hud" aria-live="polite">
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
