import { useEffect, useRef } from 'react'
import type { GeoFix } from './engine/globe-geo'
import { lookLatLon, viewXYZ, yawPitchFor } from './engine/globe-geo'
import { WORLD_RINGS } from './engine/world-rings'
import { isDocumentHidden, MOTION_FRAME_MS, onVisibility } from './engine/motion'

const HOME = { lat: 50.1, lon: 10.4 }
const ZOOM_MIN = 1
const ZOOM_MAX = 3.35
const FRONT = 0.04

function clampZoom(z: number): number {
  if (!Number.isFinite(z) || z <= 0) return 1.12
  if (z >= 3.8) return 2.55
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z))
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
  onEmpty,
  reduced,
  focus,
  onLook,
}: {
  pins: GeoFix[]
  onPin: (pin: GeoFix) => void
  onEmpty?: () => void
  reduced: boolean
  focus?: GlobeFocus | null
  onLook?: (look: { lat: number; lon: number; zoom: number; date: string }) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const home = yawPitchFor(HOME.lat, HOME.lon)
  const yaw = useRef(home.yaw)
  const pitch = useRef(home.pitch)
  const zoom = useRef(1.12)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const pinch = useRef<{ dist: number; zoom: number } | null>(null)
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const inertia = useRef({ yaw: 0, pitch: 0 })
  const pinsRef = useRef(pins)
  pinsRef.current = pins
  const onPinRef = useRef(onPin)
  onPinRef.current = onPin
  const onEmptyRef = useRef(onEmpty)
  onEmptyRef.current = onEmpty
  const onLookRef = useRef(onLook)
  onLookRef.current = onLook
  const fly = useRef<{ yaw: number; pitch: number; zoom: number; t: number } | null>(null)
  const lastFocus = useRef('')
  const homedHere = useRef(false)
  const pulse = useRef(0)
  const kickRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!focus || !Number.isFinite(focus.lat) || !Number.isFinite(focus.lon)) return
    const key = `${focus.name}:${focus.lat}:${focus.lon}:${focus.zoom || ''}`
    if (key === lastFocus.current) return
    lastFocus.current = key
    const aim = yawPitchFor(focus.lat, focus.lon)
    const z = clampZoom(Number(focus.zoom) || zoom.current)
    onLookRef.current?.({ lat: focus.lat, lon: focus.lon, zoom: z, date: '' })
    if (reduced) {
      yaw.current = aim.yaw
      pitch.current = Math.max(-1.35, Math.min(1.35, aim.pitch))
      zoom.current = z
      fly.current = null
      return
    }
    fly.current = { yaw: aim.yaw, pitch: aim.pitch, zoom: z, t: 0 }
    kickRef.current()
  }, [focus, reduced])

  useEffect(() => {
    if (homedHere.current || focus) return
    const here = pins.find((p) => p.kind === 'here')
    if (!here || !Number.isFinite(here.lat) || !Number.isFinite(here.lon)) return
    homedHere.current = true
    const aim = yawPitchFor(here.lat, here.lon)
    lastFocus.current = `here:${here.lat}:${here.lon}`
    if (reduced) {
      yaw.current = aim.yaw
      pitch.current = Math.max(-1.35, Math.min(1.35, aim.pitch))
      zoom.current = 2.15
      return
    }
    fly.current = { yaw: aim.yaw, pitch: aim.pitch, zoom: 2.15, t: 0 }
    kickRef.current()
  }, [pins, focus, reduced])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const surface = canvas
    const pen = ctx
    let raf = 0
    let last = 0

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
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
      if (isDocumentHidden()) {
        cancelAnimationFrame(raf)
        raf = 0
        return
      }
      kick()
    })

    function sphereR() {
      const w = surface.clientWidth
      const h = surface.clientHeight
      return Math.min(w, h) * 0.4 * zoom.current
    }

    function project(lat: number, lon: number) {
      const v = viewXYZ(lat, lon, yaw.current, pitch.current)
      const w = surface.clientWidth
      const h = surface.clientHeight
      const s = sphereR()
      return { x: w / 2 + v.x * s, y: h / 2 - v.y * s, z: v.z }
    }

    function emitLook() {
      const look = lookLatLon(yaw.current, pitch.current)
      onLookRef.current?.({ lat: look.lat, lon: look.lon, zoom: zoom.current, date: '' })
    }

    function drawSphere(cx: number, cy: number, R: number) {
      const fill = pen.createRadialGradient(cx - R * 0.28, cy - R * 0.34, R * 0.06, cx, cy, R)
      fill.addColorStop(0, '#1a3a58')
      fill.addColorStop(0.38, '#0d2238')
      fill.addColorStop(0.78, '#081422')
      fill.addColorStop(1, '#040910')
      pen.beginPath()
      pen.arc(cx, cy, R, 0, Math.PI * 2)
      pen.fillStyle = fill
      pen.fill()

      const rim = pen.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.04)
      rim.addColorStop(0, 'rgba(30, 215, 96, 0)')
      rim.addColorStop(0.72, 'rgba(40, 120, 140, 0.06)')
      rim.addColorStop(1, 'rgba(80, 200, 170, 0.22)')
      pen.beginPath()
      pen.arc(cx, cy, R, 0, Math.PI * 2)
      pen.fillStyle = rim
      pen.fill()

      const sheen = pen.createRadialGradient(cx - R * 0.32, cy - R * 0.4, 0, cx - R * 0.18, cy - R * 0.28, R * 0.62)
      sheen.addColorStop(0, 'rgba(186, 214, 236, 0.16)')
      sheen.addColorStop(0.45, 'rgba(120, 170, 210, 0.05)')
      sheen.addColorStop(1, 'rgba(10, 20, 32, 0)')
      pen.beginPath()
      pen.arc(cx, cy, R, 0, Math.PI * 2)
      pen.fillStyle = sheen
      pen.fill()

      pen.beginPath()
      pen.arc(cx, cy, R, 0, Math.PI * 2)
      pen.strokeStyle = 'rgba(90, 210, 170, 0.28)'
      pen.lineWidth = Math.max(1, R / 220)
      pen.stroke()
    }

    function drawOutlines(cx: number, cy: number, R: number) {
      pen.save()
      pen.beginPath()
      pen.arc(cx, cy, R, 0, Math.PI * 2)
      pen.clip()
      pen.lineJoin = 'round'
      pen.lineCap = 'round'
      const hair = Math.max(0.65, Math.min(1.45, R / 210))
      pen.strokeStyle = 'rgba(46, 214, 130, 0.18)'
      pen.lineWidth = hair * 2.4
      strokeRings()
      pen.strokeStyle = 'rgba(168, 242, 196, 0.92)'
      pen.lineWidth = hair
      strokeRings()
      pen.restore()
    }

    function strokeRings() {
      for (const ring of WORLD_RINGS) {
        let drawing = false
        pen.beginPath()
        for (let i = 0; i < ring.length - 1; i += 2) {
          const q = project(ring[i + 1], ring[i])
          if (q.z < FRONT) {
            if (drawing) {
              pen.stroke()
              pen.beginPath()
              drawing = false
            }
            continue
          }
          if (!drawing) {
            pen.moveTo(q.x, q.y)
            drawing = true
          } else pen.lineTo(q.x, q.y)
        }
        if (drawing) pen.stroke()
      }
    }

    function drawPins() {
      const shown = pinsRef.current
        .map((pin) => ({ pin, q: project(pin.lat, pin.lon) }))
        .filter((x) => x.q.z > -0.02)
      shown.sort((a, b) => a.q.z - b.q.z)
      for (const { pin, q } of shown) {
        if (pin.kind === 'glow') {
          pen.beginPath()
          pen.fillStyle = pin.hot ? 'rgba(125, 211, 160, 0.28)' : 'rgba(125, 211, 160, 0.12)'
          pen.arc(q.x, q.y, pin.hot ? 16 : 12, 0, Math.PI * 2)
          pen.fill()
        }
        if (pin.kind === 'here') {
          const wave = 10 + Math.sin(pulse.current) * 3
          pen.beginPath()
          pen.strokeStyle = 'rgba(30, 215, 96, 0.45)'
          pen.lineWidth = 1.2
          pen.arc(q.x, q.y, wave, 0, Math.PI * 2)
          pen.stroke()
        }
        pen.beginPath()
        pen.fillStyle =
          pin.kind === 'iss'
            ? '#f4f7fb'
            : pin.kind === 'here'
              ? '#1ed760'
              : pin.kind === 'warn'
                ? '#e8b84a'
                : pin.kind === 'glow'
                  ? pin.hot
                    ? '#e8f8ee'
                    : '#9be0b5'
                  : '#7dd3a0'
        pen.arc(q.x, q.y, pin.kind === 'iss' ? 3.5 : pin.kind === 'here' ? 5 : pin.kind === 'glow' && pin.hot ? 5 : 4, 0, Math.PI * 2)
        pen.fill()
        if (pin.kind === 'here') {
          pen.beginPath()
          pen.fillStyle = '#04120a'
          pen.arc(q.x, q.y, 2, 0, Math.PI * 2)
          pen.fill()
        }
        pen.fillStyle = 'rgba(230, 240, 236, 0.82)'
        pen.font = '10px Inter, system-ui, sans-serif'
        pen.textAlign = 'left'
        pen.fillText(pin.name, q.x + 8, q.y + 3)
      }
    }

    function draw() {
      if (isDocumentHidden()) return
      const w = surface.clientWidth
      const h = surface.clientHeight
      pen.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      const R = sphereR()
      drawSphere(cx, cy, R)
      drawOutlines(cx, cy, R)
      drawPins()
    }

    function kick() {
      if (raf || isDocumentHidden()) return
      raf = requestAnimationFrame(loop)
    }
    kickRef.current = kick

    function loop(ts: number) {
      raf = 0
      if (isDocumentHidden()) return
      if (ts - last < MOTION_FRAME_MS) {
        kick()
        return
      }
      const dt = Math.min(0.05, (ts - last) / 1000 || 1 / 30)
      last = ts
      pulse.current += dt * 2.4
      const f = fly.current
      if (f && !reduced) {
        f.t += dt * 1.35
        const k = Math.min(1, f.t)
        const e = k * k * (3 - 2 * k)
        yaw.current += shortest(yaw.current, f.yaw) * (0.16 + e * 0.28)
        pitch.current += (f.pitch - pitch.current) * (0.16 + e * 0.28)
        zoom.current += (f.zoom - zoom.current) * (0.18 + e * 0.24)
        if (k >= 1 && Math.abs(shortest(yaw.current, f.yaw)) < 0.008) {
          yaw.current = f.yaw
          pitch.current = f.pitch
          zoom.current = f.zoom
          fly.current = null
          inertia.current.yaw = 0
          inertia.current.pitch = 0
        }
      } else if (!drag.current && !pinch.current && !reduced) {
        yaw.current += inertia.current.yaw
        pitch.current = Math.max(-1.35, Math.min(1.35, pitch.current + inertia.current.pitch))
        inertia.current.yaw *= 0.92
        inertia.current.pitch *= 0.92
        if (Math.abs(inertia.current.yaw) < 0.00015) inertia.current.yaw = 0
        if (Math.abs(inertia.current.pitch) < 0.00015) inertia.current.pitch = 0
        if (!inertia.current.yaw && !homedHere.current && !lastFocus.current) {
          yaw.current += dt * 0.045
        }
      }
      draw()
      kick()
    }
    draw()
    kick()

    function pos(ev: PointerEvent) {
      const r = surface.getBoundingClientRect()
      return { x: ev.clientX - r.left, y: ev.clientY - r.top }
    }
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

    const down = (ev: PointerEvent) => {
      surface.setPointerCapture(ev.pointerId)
      const p = pos(ev)
      pts.current.set(ev.pointerId, p)
      inertia.current.yaw = 0
      inertia.current.pitch = 0
      fly.current = null
      if (pts.current.size === 1) {
        drag.current = p
        pinch.current = null
      } else if (pts.current.size >= 2) {
        const [a, b] = [...pts.current.values()]
        pinch.current = { dist: Math.max(24, dist(a, b)), zoom: zoom.current }
        drag.current = null
      }
      kick()
    }
    const move = (ev: PointerEvent) => {
      if (!pts.current.has(ev.pointerId)) return
      const p = pos(ev)
      pts.current.set(ev.pointerId, p)
      if (pts.current.size >= 2 && pinch.current && !reduced) {
        const [a, b] = [...pts.current.values()]
        const d = Math.max(24, dist(a, b))
        zoom.current = clampZoom(pinch.current.zoom * (d / pinch.current.dist))
        return
      }
      if (!drag.current || reduced) return
      const dyaw = (p.x - drag.current.x) * 0.0085
      const dpitch = (p.y - drag.current.y) * 0.0065
      yaw.current += dyaw
      pitch.current = Math.max(-1.35, Math.min(1.35, pitch.current + dpitch))
      inertia.current.yaw = dyaw
      inertia.current.pitch = dpitch
      drag.current = p
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
        const q = project(pin.lat, pin.lon)
        if (q.z < -0.02) continue
        const d = Math.hypot(q.x - p.x, q.y - p.y)
        const hit = pin.kind === 'glow' ? 26 : pin.kind === 'here' ? 22 : 16
        if (d < bestD && d < hit) {
          bestD = d
          best = pin
        }
      }
      if (best) onPinRef.current(best)
      else onEmptyRef.current?.()
    }
    const wheel = (ev: WheelEvent) => {
      ev.preventDefault()
      if (reduced) return
      zoom.current = clampZoom(zoom.current * (ev.deltaY > 0 ? 0.94 : 1.06))
      if (!fly.current) emitLook()
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
    </div>
  )
}
