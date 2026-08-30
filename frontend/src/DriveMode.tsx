import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { getDriveHazards, getDriveRoute, getDriveTab, refreshDriveRoute, setDriveTab, snapDriveFix, subscribeDrive, type DriveRoute, type DriveTab } from './engine/drive'
import { haversineM } from './engine/geo-lookup'
import { loadSettings } from './engine/store'
import { readInterrupt, subscribeInterrupt } from './engine/interrupt'
import {
  TILE_SIZE,
  cartoKey,
  clampMapZoom,
  dayTiles,
  panCam,
  prefetchTile,
  projectOnTiles,
  readLastMapFix,
  settleZoom,
  tilesPending,
  tileUrl,
  webMercator,
  zoomAround,
  zoomForSpeedMps,
  zoomToInclude,
  type MapCam,
  type MapFix,
} from './engine/drive-map'
import { formatNavBanner, nextManeuver } from './engine/nav-speak'
import { isDocumentHidden, onVisibility, prefersReducedMotion } from './engine/motion'
import { watchDeviceLocation } from './native/geo'
import {
  beginVoiceSession,
  endVoiceSession,
  listenOnce,
  requestMicPermission,
  setKeepScreenOn,
  speakCueFast,
  speakText,
  stopListen,
  stopSpeak,
} from './native/voice'
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
  const cam = useRef<MapCam>({
    lat: live.current.lat,
    lon: live.current.lon,
    zoom: zoomForSpeedMps(live.current.speed),
  })
  const followRef = useRef(true)
  const userZoomRef = useRef(false)
  const zoomWantedAt = useRef(0)
  const headingRef = useRef(live.current.bearing || 0)
  const [browsing, setBrowsing] = useState(false)

  useEffect(() => {
    let liveLoop = true
    let lastDraw = 0
    let frame = 0
    const wrap = wrapRef.current
    if (!wrap) return

    const pts = new Map<number, { x: number; y: number }>()
    let lastPan: { x: number; y: number } | null = null
    let pinch: { dist: number; zoom: number } | null = null
    let moved = false
    let lastTap = 0
    let lastTapAt = { x: 0, y: 0 }

    const boxPos = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const pair = () => [...pts.values()]
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y)

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      wrap.setPointerCapture(e.pointerId)
      const p = boxPos(e)
      pts.set(e.pointerId, p)
      moved = false
      if (pts.size === 1) {
        lastPan = p
        pinch = null
      } else if (pts.size >= 2) {
        const [a, b] = pair()
        pinch = { dist: Math.max(24, dist(a, b)), zoom: cam.current.zoom }
        lastPan = null
      }
      e.preventDefault()
    }
    const onMove = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return
      const p = boxPos(e)
      pts.set(e.pointerId, p)
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      const cx = w * 0.5
      const cy = h * 0.58
      if (pts.size >= 2 && pinch) {
        const [a, b] = pair()
        const d = Math.max(24, dist(a, b))
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        userZoomRef.current = true
        if (followRef.current) {
          cam.current = {
            ...cam.current,
            zoom: clampMapZoom(pinch.zoom + Math.log2(d / pinch.dist)),
          }
        } else {
          cam.current = zoomAround(cam.current, pinch.zoom + Math.log2(d / pinch.dist), mid.x, mid.y, cx, cy)
        }
        lastDraw = 0
        e.preventDefault()
        return
      }
      if (pts.size === 1 && lastPan) {
        const dx = p.x - lastPan.x
        const dy = p.y - lastPan.y
        if (Math.abs(dx) + Math.abs(dy) > 7) moved = true
        if (moved) {
          if (followRef.current) {
            followRef.current = false
            setBrowsing(true)
          }
          cam.current = panCam(cam.current, dx, dy)
          lastDraw = 0
        }
        lastPan = p
        e.preventDefault()
      }
    }
    const onUp = (e: PointerEvent) => {
      const p = pts.get(e.pointerId) || boxPos(e)
      pts.delete(e.pointerId)
      if (pts.size < 2) pinch = null
      if (pts.size === 1) lastPan = pair()[0] || null
      else lastPan = null
      if (pts.size === 0 && !moved) {
        const now = Date.now()
        if (now - lastTap < 280 && dist(p, lastTapAt) < 28) {
          const w = wrap.clientWidth
          const h = wrap.clientHeight
          userZoomRef.current = true
          cam.current = zoomAround(cam.current, cam.current.zoom + 1, p.x, p.y, w * 0.5, h * 0.58)
          lastDraw = 0
          lastTap = 0
        } else {
          lastTap = now
          lastTapAt = p
        }
      }
    }

    wrap.addEventListener('pointerdown', onDown)
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerup', onUp)
    wrap.addEventListener('pointercancel', onUp)

    const paint = (now: number) => {
      const box = wrapRef.current
      const canvas = canvasRef.current
      const pin = youRef.current
      if (!box || !canvas) return
      if (isDocumentHidden()) return
      const cssW = box.clientWidth
      const cssH = box.clientHeight
      if (cssW < 8 || cssH < 8) return
      const cx = cssW * 0.5
      const cy = cssH * 0.58
      const here = live.current

      if (followRef.current && pts.size === 0) {
        const jump = Math.abs(here.lat - cam.current.lat) + Math.abs(here.lon - cam.current.lon) > 0.05
        if (jump) {
          cam.current.lat = here.lat
          cam.current.lon = here.lon
        } else {
          cam.current.lat += (here.lat - cam.current.lat) * 0.18
          cam.current.lon += (here.lon - cam.current.lon) * 0.18
        }
        if (!userZoomRef.current) {
          const dest = destRef.current
          const speedZ = zoomForSpeedMps(here.speed)
          const fitZ =
            Number.isFinite(dest.lat) && Number.isFinite(dest.lon)
              ? zoomToInclude(here, dest, cssW, cssH)
              : speedZ
          const wanted = Math.min(speedZ, fitZ)
          if (wanted < cam.current.zoom - 0.12) {
            cam.current.zoom = wanted
            zoomWantedAt.current = 0
          } else if (Math.abs(wanted - cam.current.zoom) > 0.12) {
            if (!zoomWantedAt.current) zoomWantedAt.current = now
            cam.current.zoom = settleZoom(cam.current.zoom, wanted, zoomWantedAt.current, now)
            if (Math.abs(cam.current.zoom - wanted) < 0.12) zoomWantedAt.current = 0
          } else {
            zoomWantedAt.current = 0
          }
        }
      }

      const still =
        pts.size === 0 &&
        tilesPending() === 0 &&
        (followRef.current
          ? Math.abs(here.lat - cam.current.lat) + Math.abs(here.lon - cam.current.lon) < 4e-7
          : true)
      if (still && now - lastDraw < 180) return
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

      const z = cam.current.zoom
      const zInt = Math.max(1, Math.floor(z + 1e-6))
      const size = TILE_SIZE * 2 ** (z - zInt)
      const day = dayTiles()
      const camM = webMercator(cam.current.lat, cam.current.lon, zInt)
      const x0 = Math.floor(camM.x - cx / size) - 1
      const y0 = Math.floor(camM.y - cy / size) - 1
      const x1 = Math.ceil(camM.x + (cssW - cx) / size) + 1
      const y1 = Math.ceil(camM.y + (cssH - cy) / size) + 1

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.fillStyle = day ? '#e4e0d4' : '#0b100e'
      ctx.fillRect(0, 0, cssW, cssH)

      const ready = () => {
        lastDraw = 0
      }
      for (let ty = y0; ty <= y1; ty += 1) {
        for (let tx = x0; tx <= x1; tx += 1) {
          const img = prefetchTile(tileUrl(zInt, tx, ty, day), ready)
          const sx = (tx - camM.x) * size + cx
          const sy = (ty - camM.y) * size + cy
          if (img) ctx.drawImage(img, sx, sy, size, size)
        }
      }

      const dest = destRef.current
      if (dest.coords.length >= 3) {
        ctx.beginPath()
        let started = false
        let lastX = Infinity
        let lastY = Infinity
        for (const row of dest.coords) {
          const lon = Number(row?.[0])
          const lat = Number(row?.[1])
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
          const pt = projectOnTiles(lat, lon, camM, zInt, size, cx, cy)
          if (Math.abs(pt.x - lastX) < 1.2 && Math.abs(pt.y - lastY) < 1.2) continue
          lastX = pt.x
          lastY = pt.y
          if (!started) {
            ctx.moveTo(pt.x, pt.y)
            started = true
          } else {
            ctx.lineTo(pt.x, pt.y)
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

      for (const haz of getDriveHazards()) {
        const hz = projectOnTiles(haz.lat, haz.lon, camM, zInt, size, cx, cy)
        if (!Number.isFinite(hz.x) || !Number.isFinite(hz.y)) continue
        ctx.beginPath()
        ctx.arc(hz.x, hz.y, 6, 0, Math.PI * 2)
        ctx.fillStyle = haz.kind === 'camera' ? '#e4c36a' : '#c97a3a'
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = '#070908'
        ctx.stroke()
      }

      const pinPt = projectOnTiles(dest.lat, dest.lon, camM, zInt, size, cx, cy)
      if (Number.isFinite(pinPt.x) && Number.isFinite(pinPt.y)) {
        ctx.beginPath()
        ctx.arc(pinPt.x, pinPt.y, 7, 0, Math.PI * 2)
        ctx.fillStyle = '#f15e6c'
        ctx.fill()
        ctx.lineWidth = 3
        ctx.strokeStyle = '#070908'
        ctx.stroke()
      }

      const you = projectOnTiles(here.lat, here.lon, camM, zInt, size, cx, cy)
      const heading = here.bearing != null && Number.isFinite(here.bearing) ? here.bearing : headingRef.current
      const delta = ((heading - headingRef.current + 540) % 360) - 180
      headingRef.current += delta * 0.42
      if (pin) {
        const on = you.x > -40 && you.x < cssW + 40 && you.y > -40 && you.y < cssH + 40
        pin.style.opacity = on ? '1' : '0'
        pin.style.transform = `translate(${you.x - 14}px, ${you.y - 16}px) rotate(${headingRef.current}deg)`
      }
    }

    const tick = (now: number) => {
      if (!liveLoop) return
      if (isDocumentHidden()) {
        frame = 0
        return
      }
      paint(now)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    const offVis = onVisibility(() => {
      if (!isDocumentHidden() && liveLoop && !frame) frame = requestAnimationFrame(tick)
    })
    return () => {
      liveLoop = false
      cancelAnimationFrame(frame)
      offVis()
      wrap.removeEventListener('pointerdown', onDown)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerup', onUp)
      wrap.removeEventListener('pointercancel', onUp)
    }
  }, [live])

  return (
    <div className="drive-map-wrap" ref={wrapRef}>
      <canvas className="drive-map-canvas" ref={canvasRef} />
      <div className="drive-you" ref={youRef} aria-hidden>
        <svg viewBox="-12 -14 24 28">
          <polygon points="0,-12 8,12 -8,12" fill="#e4c36a" stroke="#070908" strokeWidth="2" />
        </svg>
      </div>
      {browsing ? (
        <button
          type="button"
          className="drive-recenter"
          aria-label="Standort folgen"
          onClick={() => {
            followRef.current = true
            userZoomRef.current = false
            cam.current = {
              lat: live.current.lat,
              lon: live.current.lon,
              zoom: zoomForSpeedMps(live.current.speed),
            }
            setBrowsing(false)
          }}
        >
          ⌖
        </button>
      ) : null}
    </div>
  )
}

function seedLiveFix(): MapFix {
  const last = readLastMapFix()
  const route = getDriveRoute()
  if (
    route &&
    (route.coords.length || route.minutes > 0) &&
    Number.isFinite(route.fromLat) &&
    Number.isFinite(route.fromLon)
  ) {
    return { lat: route.fromLat, lon: route.fromLon }
  }
  return last || { lat: 48.78, lon: 9.18 }
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
  onOpenKeys,
}: {
  onClose: () => void
  onCommand?: (text: string) => Promise<string> | void
  onOpenKeys?: () => void
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
  const [hearing, setHearing] = useState(false)
  const [ask, setAsk] = useState(() => readInterrupt())
  const navBusy = useRef(false)
  const listenLock = useRef(false)
  const spokenHaz = useRef(new Set<string>())
  const loggedIn = spotifyLoggedIn()
  const configured = spotifyConfigured()

  function maybeSpeakHazard(pos: { lat: number; lon: number }) {
    if (listenLock.current) return
    const speak = loadSettings().drive_speak
    if (speak !== 'after' && speak !== 'only') return
    for (const haz of getDriveHazards()) {
      const key = `${haz.kind}:${haz.lat.toFixed(4)}:${haz.lon.toFixed(4)}`
      if (spokenHaz.current.has(key)) continue
      const dist = haversineM({ lat: pos.lat, lon: pos.lon, place: '' }, haz)
      if (dist > 220) continue
      spokenHaz.current.add(key)
      const line =
        haz.kind === 'camera'
          ? 'Feste Säule voraus, OSM unvollständig.'
          : 'Baustelle voraus, OSM.'
      void speakCueFast(line)
      return
    }
  }

  useEffect(() => subscribeDrive(() => {
    setRoute(getDriveRoute())
    setTab(getDriveTab())
  }), [])
  useEffect(() => subscribeInterrupt(() => setAsk(readInterrupt())), [])
  useEffect(() => {
    if (here) return
    if (!route) return
    if (!route.coords.length && route.minutes <= 0) return
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
      listenLock.current = false
      void stopListen()
      void setKeepScreenOn(false)
    }
  }, [])

  useEffect(() => {
    if (!loggedIn) return
    void ensureInternalPlayer()
    const id = window.setInterval(() => {
      if (isDocumentHidden()) return
      void refreshNow()
    }, 8000)
    return () => window.clearInterval(id)
  }, [loggedIn])

  useEffect(() => {
    return watchDeviceLocation((fix) => {
      if (!fix.ok || fix.lat == null || fix.lon == null) return
      const raw = { lat: fix.lat, lon: fix.lon, bearing: fix.bearing, speed: fix.speed }
      const pos = snapDriveFix(raw)
      liveRef.current = {
        lat: pos.lat,
        lon: pos.lon,
        bearing: pos.bearing ?? liveRef.current.bearing,
        speed: pos.speed ?? liveRef.current.speed,
      }
      const t = Date.now()
      if (t - hudAt.current > 220) {
        hudAt.current = t
        setHere({ lat: pos.lat, lon: pos.lon })
      }
      void refreshDriveRoute(raw).then((guide) => {
        maybeSpeakHazard(pos)
        if (!guide?.cue) return
        if (listenLock.current) return
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
        exit: s.exit,
      })),
      route.coords,
      pos,
    )
    if (!nxt) return { arrow: '↑', line: route.dest || 'Wohin?', sub: route.hint || '', dir: 'straight' as const }
    return { ...formatNavBanner(nxt.dir, nxt.meters, nxt.name, nxt.exit), dir: nxt.dir }
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
    if (hearing || listenLock.current) return
    listenLock.current = true
    setHearing(true)
    setHearMsg('Ich höre…')
    void (async () => {
      try {
        await beginVoiceSession()
        await stopSpeak()
        await stopListen()
        await new Promise((r) => window.setTimeout(r, 180))
        const ok = await requestMicPermission()
        if (!ok) {
          setHearMsg('Mikrofon erlauben — sonst höre ich hier nichts.')
          return
        }
        const res = await listenOnce((partial) => setHearMsg(partial || 'Ich höre…'))
        const text = (res.text || '').trim()
        if (!text) {
          setHearMsg(res.message || 'Nichts gehört. Nochmal Mic.')
          return
        }
        setHearMsg(text)
        const reply = (await onCommand?.(text)) || ''
        const line = reply.trim()
        if (line) {
          setHearMsg(line)
          await speakText(line)
        } else {
          setHearMsg('Verstanden.')
        }
      } catch (err) {
        setHearMsg(err instanceof Error ? err.message : 'Zuhören fehlgeschlagen.')
      } finally {
        await endVoiceSession()
        listenLock.current = false
        setHearing(false)
        window.setTimeout(() => setHearMsg(null), 5_200)
      }
    })()
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
      {!cartoKey() ? (
        <p className="drive-key-hint">
          Carto-Key fehlt — Karte bleibt leer.{' '}
          {onOpenKeys ? (
            <button type="button" className="ghost-btn" onClick={onOpenKeys}>
              Zum API-Key
            </button>
          ) : (
            'Einstellungen → API-Keys.'
          )}
        </p>
      ) : null}
      {hud ? (
        <div className={`drive-hud ${dayTiles() ? 'is-day' : ''}${prefersReducedMotion() ? ' is-still' : ''}`} aria-live="polite">
          <span className={`drive-hud-chevron is-${hud.dir}`} aria-hidden />
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
      {ask ? (
        <div className="drive-ask" role="alertdialog" aria-label="Nachfrage">
          <p>{ask.question}</p>
          <div className="drive-ask-actions">
            <button
              type="button"
              onClick={() => {
                void Promise.resolve(onCommand?.('Ja')).finally(() => setAsk(readInterrupt()))
              }}
            >
              Ja
            </button>
            <button
              type="button"
              onClick={() => {
                void Promise.resolve(onCommand?.('Nein')).finally(() => setAsk(readInterrupt()))
              }}
            >
              Nein
            </button>
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
        <button
          type="button"
          className={`${tab === 'spotify' ? 'is-on' : ''}${now?.playing ? ' is-playing' : ''}`}
          onClick={() => setDriveTab('spotify')}
        >
          Spotify
        </button>
        <button
          type="button"
          className={`drive-mic${hearing ? ' is-hot' : ''}`}
          onClick={hear}
          aria-label="Hören"
          disabled={hearing}
        >
          Mic
        </button>
      </nav>
    </div>
  )
}
