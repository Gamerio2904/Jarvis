import { useEffect, useRef } from 'react'
import type { GeoFix } from './engine/globe-geo'

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

export function GlobeView({
  pins,
  onPin,
  reduced,
}: {
  pins: GeoFix[]
  onPin: (pin: GeoFix) => void
  reduced: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const yaw = useRef(0.8)
  const pitch = useRef(0.25)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const pinsRef = useRef(pins)
  pinsRef.current = pins

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const surface = canvas
    const pen = ctx

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
      const s = Math.min(w, h) * 0.42
      return { x: w / 2 + x1 * s, y: h / 2 - y1 * s, z: z2 }
    }

    function draw() {
      const w = surface.clientWidth
      const h = surface.clientHeight
      pen.clearRect(0, 0, w, h)
      const sun = sunDir(new Date())
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.42
      const shade = pen.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R)
      shade.addColorStop(0, '#3d8f6e')
      shade.addColorStop(0.45, '#1a4d3a')
      shade.addColorStop(1, '#0b1c28')
      pen.beginPath()
      pen.arc(cx, cy, R, 0, Math.PI * 2)
      pen.fillStyle = shade
      pen.fill()
      pen.strokeStyle = 'rgba(29,185,84,0.35)'
      pen.stroke()

      for (let i = 0; i < 14; i++) {
        const lat = -60 + i * 10
        pen.beginPath()
        let started = false
        for (let lon = -180; lon <= 180; lon += 8) {
          const p = xyz(lat, lon)
          const q = project(p.x, p.y, p.z)
          if (q.z < 0) {
            started = false
            continue
          }
          if (!started) {
            pen.moveTo(q.x, q.y)
            started = true
          } else pen.lineTo(q.x, q.y)
        }
        pen.strokeStyle = 'rgba(255,255,255,0.08)'
        pen.stroke()
      }

      const svec = project(sun.x, sun.y, sun.z)
      pen.fillStyle = 'rgba(0,0,0,0.28)'
      pen.beginPath()
      pen.arc(cx, cy, R, 0, Math.PI * 2)
      pen.fill()
      pen.save()
      pen.beginPath()
      pen.arc(cx, cy, R, 0, Math.PI * 2)
      pen.clip()
      pen.globalCompositeOperation = 'destination-out'
      pen.beginPath()
      pen.arc(svec.z > 0 ? svec.x : cx + (cx - svec.x) * 0.2, cy, R * 1.05, 0, Math.PI * 2)
      pen.fill()
      pen.restore()

      const shown = pinsRef.current
        .map((pin) => {
          const p = xyz(pin.lat, pin.lon)
          const q = project(p.x, p.y, p.z)
          return { pin, q }
        })
        .filter((x) => x.q.z > -0.05)
      for (const { pin, q } of shown) {
        pen.beginPath()
        pen.fillStyle = pin.kind === 'iss' ? '#ffffff' : pin.kind === 'here' ? '#1db954' : pin.kind === 'warn' ? '#e8b84a' : '#7dd3a0'
        pen.arc(q.x, q.y, pin.kind === 'iss' ? 4 : 5, 0, Math.PI * 2)
        pen.fill()
        pen.fillStyle = 'rgba(255,255,255,0.8)'
        pen.font = '10px Inter, system-ui, sans-serif'
        pen.textAlign = 'left'
        pen.fillText(pin.name, q.x + 7, q.y + 3)
      }
    }

    draw()

    function pos(ev: PointerEvent) {
      const r = surface.getBoundingClientRect()
      return { x: ev.clientX - r.left, y: ev.clientY - r.top }
    }
    const down = (ev: PointerEvent) => {
      surface.setPointerCapture(ev.pointerId)
      drag.current = pos(ev)
    }
    const move = (ev: PointerEvent) => {
      if (!drag.current || reduced) return
      const p = pos(ev)
      yaw.current += (p.x - drag.current.x) * 0.01
      pitch.current = Math.max(-1.1, Math.min(1.1, pitch.current + (p.y - drag.current.y) * 0.008))
      drag.current = p
      draw()
    }
    const up = (ev: PointerEvent) => {
      const start = drag.current
      drag.current = null
      if (!start) return
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
      if (best) onPin(best)
    }
    surface.addEventListener('pointerdown', down)
    surface.addEventListener('pointermove', move)
    surface.addEventListener('pointerup', up)
    return () => {
      ro.disconnect()
      surface.removeEventListener('pointerdown', down)
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerup', up)
    }
  }, [onPin, pins, reduced])

  return <canvas ref={canvasRef} className="globe-view" aria-label="Weltkugel" />
}
