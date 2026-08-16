import { useEffect, useMemo, useState } from 'react'
import { getDriveRoute, subscribeDrive, type DriveRoute } from './engine/drive'
import { readDeviceLocation } from './native/geo'
import {
  activateSpotifyElement,
  ensureInternalPlayer,
  getSpotifyNow,
  getSpotifyPlayerStatus,
  pauseSpotify,
  playQuery,
  playTrack,
  nextSpotify,
  prevSpotify,
  refreshNow,
  resumeSpotify,
  searchTracks,
  spotifyConfigured,
  spotifyLoggedIn,
  spotifySourceLabel,
  startSpotifyLogin,
  subscribeSpotify,
  type SpotifyNow,
  type SpotifyPlayerStatus,
  type SpotifyTrack,
} from './engine/spotify'

function world(lat: number, lon: number, z: number) {
  const n = 2 ** z
  const x = ((lon + 180) / 360) * n
  const rad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
  return { x, y }
}

function TileMap({
  lat,
  lon,
  coords,
  you,
}: {
  lat: number
  lon: number
  coords: Array<[number, number]>
  you?: { lat: number; lon: number }
}) {
  const z = 14
  const size = 256
  const cols = 5
  const rows = 5
  const center = world(lat, lon, z)
  const originX = Math.floor(center.x) - Math.floor(cols / 2)
  const originY = Math.floor(center.y) - Math.floor(rows / 2)
  const w = cols * size
  const h = rows * size
  const toPx = (la: number, lo: number) => {
    const p = world(la, lo, z)
    return { x: (p.x - originX) * size, y: (p.y - originY) * size }
  }
  const path = coords
    .map(([lo, la]) => {
      const p = toPx(la, lo)
      return `${p.x},${p.y}`
    })
    .join(' ')
  const tiles: Array<{ key: string; src: string; left: number; top: number }> = []
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const tx = originX + x
      const ty = originY + y
      tiles.push({
        key: `${z}-${tx}-${ty}`,
        src: `https://basemaps.cartocdn.com/dark_all/${z}/${tx}/${ty}@2x.png`,
        left: x * size,
        top: y * size,
      })
    }
  }
  const pin = toPx(lat, lon)
  const me = you ? toPx(you.lat, you.lon) : pin
  return (
    <div className="drive-map" style={{ width: w, height: h }}>
      {tiles.map((t) => (
        <img key={t.key} alt="" src={t.src} style={{ left: t.left, top: t.top }} />
      ))}
      <svg className="drive-svg" viewBox={`0 0 ${w} ${h}`}>
        {path ? (
          <polyline points={path} fill="none" stroke="#1ed760" strokeWidth="5" strokeLinejoin="round" />
        ) : null}
        <circle cx={me.x} cy={me.y} r="8" fill="#e4c36a" stroke="#070908" strokeWidth="3" />
        <circle cx={pin.x} cy={pin.y} r="7" fill="#f15e6c" stroke="#070908" strokeWidth="3" />
      </svg>
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

export function DriveMode({ onClose }: { onClose: () => void }) {
  const [route, setRoute] = useState<DriveRoute | null>(() => getDriveRoute())
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null)
  const [now, setNow] = useState<SpotifyNow | null>(() => getSpotifyNow())
  const [player, setPlayer] = useState<SpotifyPlayerStatus>(() => getSpotifyPlayerStatus())
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<SpotifyTrack[]>([])
  const [musicMsg, setMusicMsg] = useState<string | null>(null)
  const [musicBusy, setMusicBusy] = useState(false)
  const loggedIn = spotifyLoggedIn()
  const configured = spotifyConfigured()

  useEffect(() => subscribeDrive(() => setRoute(getDriveRoute())), [])
  useEffect(
    () =>
      subscribeSpotify(() => {
        setNow(getSpotifyNow())
        setPlayer(getSpotifyPlayerStatus())
      }),
    [],
  )

  useEffect(() => {
    if (!loggedIn) return
    void ensureInternalPlayer()
    const id = window.setInterval(() => void refreshNow(), 8000)
    return () => window.clearInterval(id)
  }, [loggedIn])

  useEffect(() => {
    let live = true
    async function tick() {
      const fix = await readDeviceLocation()
      if (!live) return
      if (fix.ok && fix.lat != null && fix.lon != null) setHere({ lat: fix.lat, lon: fix.lon })
    }
    void tick()
    const id = window.setInterval(() => void tick(), 5000)
    return () => {
      live = false
      window.clearInterval(id)
    }
  }, [])

  const center = useMemo(() => {
    if (here) return here
    if (route) return { lat: route.fromLat, lon: route.fromLon }
    return { lat: 48.78, lon: 9.18 }
  }, [here, route])

  const km = route && route.meters ? (route.meters >= 1000 ? `${(route.meters / 1000).toFixed(1)} km` : `${route.meters} m`) : ''

  return (
    <div className="drive-view" role="dialog" aria-labelledby="drive-title">
      <header className="drive-bar">
        <div>
          <p className="settings-kicker">Fahrmodus</p>
          <h2 id="drive-title">{route?.dest || 'Wohin?'}</h2>
        </div>
        <button type="button" className="settings-close" onClick={onClose}>
          Fertig
        </button>
      </header>
      <div className="drive-map-wrap">
        <TileMap lat={center.lat} lon={center.lon} coords={route?.coords || []} you={here || undefined} />
      </div>
      <footer className="drive-dock">
        <div>
          <strong>{route ? `${route.minutes || '—'} Min` : 'Kein Ziel'}</strong>
          <span>{km}{route?.hint ? ` · ${route.hint}` : ' · intern, nicht Google Maps'}</span>
        </div>
        <div className="drive-music" onPointerDown={() => void activateSpotifyElement()}>
          <div className="drive-now-row">
            {now?.art ? <img className="drive-art" src={now.art} alt="" /> : <div className="drive-art drive-art-empty" />}
            <div>
              <p className="drive-now">
                {now ? `${now.playing ? '▶' : '❚❚'} ${now.name}` : 'Spotify in Jarvis'}
              </p>
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
                      setHits([])
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
                <button
                  type="button"
                  disabled={musicBusy || !q.trim()}
                  onClick={() => {
                    setMusicBusy(true)
                    void searchTracks(q).then((res) => {
                      setMusicBusy(false)
                      if (!res.ok) setMusicMsg(res.message)
                      else setHits(res.tracks)
                    })
                  }}
                >
                  Suchen
                </button>
              </div>
              {hits.length ? (
                <ul className="drive-hits">
                  {hits.map((t) => (
                    <li key={t.uri}>
                      <button
                        type="button"
                        onClick={() => {
                          setMusicBusy(true)
                          void activateSpotifyElement()
                            .then(() => playTrack(t))
                            .then((msg) => {
                              setMusicMsg(msg)
                              setNow(getSpotifyNow())
                              setMusicBusy(false)
                              setHits([])
                            })
                        }}
                      >
                        {t.name} — {t.artist}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
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
        <p>© OpenStreetMap · CARTO · Spotify</p>
      </footer>
    </div>
  )
}
