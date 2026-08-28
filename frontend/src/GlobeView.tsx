import { useEffect, useRef, useState } from 'react'
import type { GeoFix } from './engine/globe-geo'
import { lookLatLon, yawPitchFor } from './engine/globe-geo'
import {
  blueMarbleUrls,
  GIBS_ZOOM_IN,
  gibsStamp,
  gibsTileUrl,
  gibsTimeCandidates,
  globeZoomToTileZ,
  lat2tile,
  loadTile,
  lon2tile,
  tile2lat,
  tile2lon,
} from './engine/globe-gibs'
import { isDocumentHidden, MOTION_FRAME_MS, onVisibility } from './engine/motion'

function xyz(lat: number, lon: number, r = 1) {
  const la = (lat * Math.PI) / 180
  const lo = (lon * Math.PI) / 180
  return {
    x: r * Math.cos(la) * Math.sin(lo),
    y: r * Math.sin(la),
    z: r * Math.cos(la) * Math.cos(lo),
  }
}

function sunDir(at: Date) {
  const utcHours = at.getUTCHours() + at.getUTCMinutes() / 60
  const lon = 15 * (12 - utcHours)
  return xyz(0, lon)
}

function shortest(from: number, to: number) {
  let d = to - from
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return d
}

export type GlobeFocus = { name: string; lat: number; lon: number; zoom?: number }

export function GlobeView({
  pins,
  onPin,
  reduced,
  focus,
  onLook,
}: {
  pins: GeoFix[]
  onPin: (pin: GeoFix) => void
  reduced: boolean
  focus?: GlobeFocus | null
  onLook?: (look: { lat: number; lon: number; zoom: number; date: string }) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const yaw = useRef(0.8)
  const pitch = useRef(0.25)
  const zoom = useRef(1)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const pinch = useRef<{ dist: number; zoom: number } | null>(null)
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const pinsRef = useRef(pins)
  pinsRef.current = pins
  const onPinRef = useRef(onPin)
  onPinRef.current = onPin
  const onLookRef = useRef(onLook)
  onLookRef.current = onLook
  const marble = useRef<HTMLCanvasElement | null>(null)
  const dateRef = useRef(gibsTimeCandidates()[0])
  const stampRef = useRef('')
  const [stamp, setStamp] = useState('Blue Marble · Terminator aus der Uhr')
  const fly = useRef<{ yaw: number; pitch: number; zoom: number; t: number } | null>(null)
  const lastFocus = useRef('')

  useEffect(() => {
    if (!focus || !Number.isFinite(focus.lat)) return
    const key = `${focus.name}:${focus.lat}:${focus.lon}:${focus.zoom || ''}`
    if (key === lastFocus.current) return
    lastFocus.current = key
    const aim = yawPitchFor(focus.lat, focus.lon)
    const z = Math.max(zoom.current, focus.zoom || 2.15)
    onLookRef.current?.({ lat: focus.lat, lon: focus.lon, zoom: z, date: dateRef.current })
    if (reduced) {
      yaw.current = aim.yaw
      pitch.current = Math.max(-1.35, Math.min(1.35, aim.pitch))
      zoom.current = z
      fly.current = null
      return
    }
    fly.current = { yaw: aim.yaw, pitch: aim.pitch, zoom: z, t: 0 }
  }, [focus, reduced])

  useEffect(() => {
    const urls = blueMarbleUrls()
    const imgs: HTMLImageElement[] = []
    let left = 2
    const done = () => {
      left -= 1
      if (left > 0) return
      if (imgs.some((i) => !i.naturalWidth)) return
      const c = document.createElement('canvas')
      c.width = imgs[0].naturalWidth * 2
      c.height = imgs[0].naturalHeight
      const g = c.getContext('2d')
      if (!g) return
      g.drawImage(imgs[0], 0, 0)
      g.drawImage(imgs[1], imgs[0].naturalWidth, 0)
      marble.current = c
    }
    for (const url of urls) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = done
      img.onerror = done
      img.src = url
      imgs.push(img)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const surface = canvas
    const pen = ctx
    let raf = 0
    let last = 0
    const dates = gibsTimeCandidates()
    dateRef.current = dates[0]

    function resize() {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      surface.width = Math.max(1, Math.round(surface.clientWidth * dpr))
      surface.height = Math.max(1, Math.round(surface.clientHeight * dpr))
      pen.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(() => {
      resize()
      draw()
    })
    ro.observe(canvas)
    const offVis = onVisibility(() => {
      if (!isDocumentHidden()) draw()
    })

    function project(x: number, y: number, z: number) {
      const cy = Math.cos(yaw.current)
      const sy = Math.sin(yaw.current)
      const cp = Math.cos(pitch.current)
      const sp = Math.sin(pitch.current)
      const x1 = x * cy - z * sy
      const z1 = x * sy + z * cy
      const y1 = y * cp - z1 * sp
      const z2 = y * sp + z1 * cp
      const w = surface.clientWidth
      const h = surface.clientHeight
      const s = Math.min(w, h) * 0.42 * Math.min(zoom.current, 2.4)
      return { x: w / 2 + x1 * s, y: h / 2 - y1 * s, z: z2 }
    }

    function emitLook() {
      const look = lookLatLon(yaw.current, pitch.current)
      const date = dateRef.current
      onLookRef.current?.({ lat: look.lat, lon: look.lon, zoom: zoom.current, date })
    }

    function drawGibsDisk(cx: number, cy: number, R: number) {
      const look = lookLatLon(yaw.current, pitch.current)
      const zTile = globeZoomToTileZ(zoom.current)
      const n = 2 ** zTile
      const span = 1.6
      const lat0 = look.lat + span
      const lat1 = look.lat - span
      const lon0 = look.lon - span * 1.4
      const lon1 = look.lon + span * 1.4
      const xA = lon2tile(lon0, zTile)
      const xB = lon2tile(lon1, zTile)
      const yA = lat2tile(lat0, zTile)
      const yB = lat2tile(lat1, zTile)
      pen.save()
      pen.beginPath()
      pen.arc(cx, cy, R, 0, Math.PI * 2)
      pen.clip()
      for (let y = Math.min(yA, yB); y <= Math.max(yA, yB); y++) {
        for (let x = Math.min(xA, xB); x <= Math.max(xA, xB); x++) {
          const xx = ((x % n) + n) % n
          const yy = Math.max(0, Math.min(n - 1, y))
          const url = gibsTileUrl(dateRef.current, zTile, xx, yy)
          const img = loadTile(url)
          const west = tile2lon(xx, zTile)
          const east = tile2lon(xx + 1, zTile)
          const north = tile2lat(yy, zTile)
          const south = tile2lat(yy + 1, zTile)
          const px = cx + ((west - look.lon) / (lon1 - lon0)) * R * 2
          const py = cy + ((look.lat - north) / (lat0 - lat1)) * R * 2
          const pw = ((east - west) / (lon1 - lon0)) * R * 2
          const ph = ((north - south) / (lat0 - lat1)) * R * 2
          if (img) pen.drawImage(img, px, py, pw, ph)
          else {
            pen.fillStyle = '#123'
            pen.fillRect(px, py, pw, ph)
          }
        }
      }
      pen.restore()
      const label = gibsStamp(dateRef.current)
      if (stampRef.current !== label) {
        stampRef.current = label
        setStamp(label)
      }
    }

    function drawMarble(cx: number, cy: number, R: number) {
      const tex = marble.current
      if (!tex) return false
      const step = Math.max(3, Math.round(R / 48))
      const tw = tex.width
      const th = tex.height
      const cyw = Math.cos(yaw.current)
      const syw = Math.sin(yaw.current)
      const cp = Math.cos(pitch.current)
      const sp = Math.sin(pitch.current)
      for (let sy = -R; sy <= R; sy += step) {
        const half = Math.sqrt(Math.max(0, R * R - sy * sy))
        for (let sx = -half; sx <= half; sx += step) {
          const x1 = sx / R
          const y1 = -sy / R
          const z2 = Math.sqrt(Math.max(0, 1 - x1 * x1 - y1 * y1))
          const y = y1 * cp + z2 * sp
          const z1 = -y1 * sp + z2 * cp
          const x = x1 * cyw + z1 * syw
          const z = -x1 * syw + z1 * cyw
          const lat = Math.asin(Math.max(-1, Math.min(1, y)))
          const lon = Math.atan2(x, z)
          const u = ((lon / Math.PI + 1) / 2) * tw
          const v = (0.5 - lat / Math.PI) * th
          pen.drawImage(tex, u, v, step, step, cx + sx, cy + sy, step + 0.6, step + 0.6)
        }
      }
      return true
    }

    function draw2d() {
      const w = surface.clientWidth
      const h = surface.clientHeight
      pen.clearRect(0, 0, w, h)
      const look = lookLatLon(yaw.current, pitch.current)
      const z = globeZoomToTileZ(Math.max(zoom.current, 2.6))
      const n = 2 ** z
      const span = 40 / Math.max(1, zoom.current)
      const lon0 = look.lon - span
      const lat0 = look.lat + span * 0.6
      const lon1 = look.lon + span
      const lat1 = look.lat - span * 0.6
      for (let y = lat2tile(lat0, z); y <= lat2tile(lat1, z); y++) {
        for (let x = lon2tile(lon0, z); x <= lon2tile(lon1, z); x++) {
          const xx = ((x % n) + n) % n
          const yy = Math.max(0, Math.min(n - 1, y))
          const img = loadTile(gibsTileUrl(dateRef.current, z, xx, yy))
          const west = tile2lon(xx, z)
          const east = tile2lon(xx + 1, z)
          const north = tile2lat(yy, z)
          const south = tile2lat(yy + 1, z)
          const px = ((west - lon0) / (lon1 - lon0)) * w
          const py = ((lat0 - north) / (lat0 - lat1)) * h
          const pw = ((east - west) / (lon1 - lon0)) * w
          const ph = ((north - south) / (lat0 - lat1)) * h
          if (img) pen.drawImage(img, px, py, pw, ph)
        }
      }
      const label = gibsStamp(dateRef.current)
      if (stampRef.current !== label) {
        stampRef.current = label
        setStamp(label)
      }
      for (const pin of pinsRef.current) {
        const px = ((pin.lon - lon0) / (lon1 - lon0)) * w
        const py = ((lat0 - pin.lat) / (lat0 - lat1)) * h
        if (px < 0 || py < 0 || px > w || py > h) continue
        pen.beginPath()
        pen.fillStyle = pin.kind === 'iss' ? '#fff' : pin.kind === 'here' ? '#1db954' : '#7dd3a0'
        pen.arc(px, py, 5, 0, Math.PI * 2)
        pen.fill()
        pen.fillStyle = 'rgba(255,255,255,0.85)'
        pen.font = '11px Inter, system-ui, sans-serif'
        pen.fillText(pin.name, px + 7, py + 3)
      }
    }

    function draw() {
      if (isDocumentHidden()) return
      if (reduced || zoom.current >= 5.2) {
        draw2d()
        return
      }
      const w = surface.clientWidth
      const h = surface.clientHeight
      pen.clearRect(0, 0, w, h)
      const sun = sunDir(new Date())
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.42 * Math.min(zoom.current, 2.45)
      if (zoom.current >= GIBS_ZOOM_IN) {
        drawGibsDisk(cx, cy, R)
      } else {
        const textured = drawMarble(cx, cy, R)
        if (!textured) {
          const shade = pen.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R)
          shade.addColorStop(0, '#3d8f6e')
          shade.addColorStop(0.45, '#1a4d3a')
          shade.addColorStop(1, '#0b1c28')
          pen.beginPath()
          pen.arc(cx, cy, R, 0, Math.PI * 2)
          pen.fillStyle = shade
          pen.fill()
        }
        pen.beginPath()
        pen.arc(cx, cy, R, 0, Math.PI * 2)
        pen.strokeStyle = 'rgba(29,185,84,0.35)'
        pen.stroke()
        const svec = project(sun.x, sun.y, sun.z)
        pen.save()
        pen.beginPath()
        pen.arc(cx, cy, R, 0, Math.PI * 2)
        pen.clip()
        pen.fillStyle = 'rgba(0,0,0,0.32)'
        pen.fillRect(0, 0, w, h)
        pen.globalCompositeOperation = 'destination-out'
        pen.beginPath()
        pen.arc(svec.z > 0 ? svec.x : cx + (cx - svec.x) * 0.2, cy, R * 1.05, 0, Math.PI * 2)
        pen.fill()
        pen.restore()
        if (stampRef.current) {
          stampRef.current = ''
          setStamp('Blue Marble · Terminator aus der Uhr')
        }
      }

      const shown = pinsRef.current
        .map((pin) => {
          const p = xyz(pin.lat, pin.lon)
          const q = project(p.x, p.y, p.z)
          return { pin, q }
        })
        .filter((x) => x.q.z > -0.05)
      for (const { pin, q } of shown) {
        pen.beginPath()
        pen.fillStyle =
          pin.kind === 'iss' ? '#ffffff' : pin.kind === 'here' ? '#1db954' : pin.kind === 'warn' ? '#e8b84a' : '#7dd3a0'
        pen.arc(q.x, q.y, pin.kind === 'iss' ? 4 : 5, 0, Math.PI * 2)
        pen.fill()
        pen.fillStyle = 'rgba(255,255,255,0.8)'
        pen.font = '10px Inter, system-ui, sans-serif'
        pen.textAlign = 'left'
        pen.fillText(pin.name, q.x + 7, q.y + 3)
      }
    }

    function loop(ts: number) {
      if (ts - last < MOTION_FRAME_MS) {
        raf = requestAnimationFrame(loop)
        return
      }
      last = ts
      const f = fly.current
      if (f && !reduced) {
        f.t += 0.045
        const k = Math.min(1, f.t)
        const e = 1 - (1 - k) * (1 - k)
        yaw.current += shortest(yaw.current, f.yaw) * (0.12 + e * 0.2)
        pitch.current += (f.pitch - pitch.current) * (0.12 + e * 0.2)
        zoom.current += (f.zoom - zoom.current) * (0.08 + e * 0.12)
        if (k >= 1 && Math.abs(shortest(yaw.current, f.yaw)) < 0.01) {
          yaw.current = f.yaw
          pitch.current = f.pitch
          zoom.current = f.zoom
          fly.current = null
          emitLook()
        }
        draw()
      }
      raf = requestAnimationFrame(loop)
    }
    draw()
    raf = requestAnimationFrame(loop)

    function pos(ev: PointerEvent) {
      const r = surface.getBoundingClientRect()
      return { x: ev.clientX - r.left, y: ev.clientY - r.top }
    }
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

    const down = (ev: PointerEvent) => {
      surface.setPointerCapture(ev.pointerId)
      const p = pos(ev)
      pts.current.set(ev.pointerId, p)
      if (pts.current.size === 1) {
        drag.current = p
        pinch.current = null
      } else if (pts.current.size >= 2) {
        const [a, b] = [...pts.current.values()]
        pinch.current = { dist: Math.max(24, dist(a, b)), zoom: zoom.current }
        drag.current = null
      }
    }
    const move = (ev: PointerEvent) => {
      if (!pts.current.has(ev.pointerId)) return
      const p = pos(ev)
      pts.current.set(ev.pointerId, p)
      if (pts.current.size >= 2 && pinch.current && !reduced) {
        const [a, b] = [...pts.current.values()]
        const d = Math.max(24, dist(a, b))
        zoom.current = Math.max(1, Math.min(8, pinch.current.zoom * (d / pinch.current.dist)))
        draw()
        return
      }
      if (!drag.current || reduced) return
      yaw.current += (p.x - drag.current.x) * 0.01
      pitch.current = Math.max(-1.35, Math.min(1.35, pitch.current + (p.y - drag.current.y) * 0.008))
      drag.current = p
      draw()
    }
    const up = (ev: PointerEvent) => {
      const start = drag.current
      pts.current.delete(ev.pointerId)
      if (pts.current.size < 2) pinch.current = null
      if (pts.current.size === 1) drag.current = [...pts.current.values()][0]
      else drag.current = null
      if (!fly.current) emitLook()
      if (!start || pts.current.size > 0) return
      const p = pos(ev)
      if (Math.hypot(p.x - start.x, p.y - start.y) > 10) return
      let best: GeoFix | null = null
      let bestD = 18
      for (const pin of pinsRef.current) {
        const q = project(xyz(pin.lat, pin.lon).x, xyz(pin.lat, pin.lon).y, xyz(pin.lat, pin.lon).z)
        if (q.z < -0.05) continue
        const d = Math.hypot(q.x - p.x, q.y - p.y)
        if (d < bestD) {
          bestD = d
          best = pin
        }
      }
      if (best) onPinRef.current(best)
    }
    const wheel = (ev: WheelEvent) => {
      ev.preventDefault()
      if (reduced) return
      zoom.current = Math.max(1, Math.min(8, zoom.current * (ev.deltaY > 0 ? 0.92 : 1.08)))
      if (!fly.current) emitLook()
      draw()
    }
    surface.addEventListener('pointerdown', down)
    surface.addEventListener('pointermove', move)
    surface.addEventListener('pointerup', up)
    surface.addEventListener('pointercancel', up)
    surface.addEventListener('wheel', wheel, { passive: false })
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      offVis()
      surface.removeEventListener('pointerdown', down)
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerup', up)
      surface.removeEventListener('pointercancel', up)
      surface.removeEventListener('wheel', wheel)
    }
  }, [reduced])

  return (
    <div className="globe-wrap">
      <canvas ref={canvasRef} className="globe-view" aria-label="Weltkugel" />
      {stamp ? <p className="globe-stamp">{stamp}</p> : <p className="globe-stamp">Blue Marble · Terminator aus der Uhr</p>}
    </div>
  )
}
