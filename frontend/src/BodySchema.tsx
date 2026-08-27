import { useEffect, useRef } from 'react'
import { organLabel, type BodyOrgan } from './engine/hud-parse'
import type { BodySnap } from './engine/body-snap'

const NODES: Array<{ id: BodyOrgan; x: number; y: number; z: number }> = [
  { id: 'brain', x: 0, y: 1.1, z: 0.2 },
  { id: 'eye', x: 0.55, y: 0.55, z: 0.45 },
  { id: 'ear', x: -0.7, y: 0.45, z: 0.1 },
  { id: 'mouth', x: 0, y: 0.15, z: 0.7 },
  { id: 'hand', x: 0.85, y: -0.35, z: 0.2 },
  { id: 'memory', x: -0.15, y: -0.85, z: 0.15 },
  { id: 'pc_eye', x: 0.95, y: 0.85, z: -0.4 },
  { id: 'pc_hand', x: 1.05, y: -0.7, z: -0.35 },
]

const EDGES: Array<[BodyOrgan, BodyOrgan]> = [
  ['brain', 'eye'],
  ['brain', 'ear'],
  ['brain', 'mouth'],
  ['brain', 'hand'],
  ['brain', 'memory'],
  ['eye', 'pc_eye'],
  ['hand', 'pc_hand'],
]

export function BodySchema({
  snap,
  selected,
  onSelect,
  reduced,
}: {
  snap: BodySnap
  selected: BodyOrgan
  onSelect: (id: BodyOrgan) => void
  reduced: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const yaw = useRef(0.4)
  const pitch = useRef(0.15)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const snapRef = useRef(snap)
  snapRef.current = snap
  const selRef = useRef(selected)
  selRef.current = selected

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const surface = canvas
    const g = ctx
    let raf = 0
    let last = 0

    function resize() {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      const w = surface.clientWidth
      const h = surface.clientHeight
      surface.width = Math.max(1, Math.round(w * dpr))
      surface.height = Math.max(1, Math.round(h * dpr))
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
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
      const s = Math.min(w, h) * 0.32
      return { x: w / 2 + x1 * s, y: h / 2 - y1 * s, z: z2, r: 11 + Math.max(0, z2) * 4 }
    }

    function draw() {
      const w = surface.clientWidth
      const h = surface.clientHeight
      g.clearRect(0, 0, w, h)
      const pts = NODES.map((n) => ({ ...n, p: project(n.x, n.y, n.z) }))
      g.strokeStyle = 'rgba(29,185,84,0.28)'
      g.lineWidth = 1.4
      for (const [a, b] of EDGES) {
        const pa = pts.find((p) => p.id === a)?.p
        const pb = pts.find((p) => p.id === b)?.p
        if (!pa || !pb) continue
        g.beginPath()
        g.moveTo(pa.x, pa.y)
        g.lineTo(pb.x, pb.y)
        g.stroke()
      }
      const ordered = [...pts].sort((a, b) => a.p.z - b.p.z)
      for (const n of ordered) {
        const live = snapRef.current[n.id]?.live
        const hot = selRef.current === n.id
        g.beginPath()
        g.fillStyle = live ? '#1db954' : 'rgba(180,180,180,0.35)'
        g.strokeStyle = hot ? '#fff' : 'rgba(255,255,255,0.2)'
        g.lineWidth = hot ? 2 : 1
        g.arc(n.p.x, n.p.y, n.p.r, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        g.fillStyle = 'rgba(255,255,255,0.82)'
        g.font = '11px Inter, system-ui, sans-serif'
        g.textAlign = 'center'
        g.fillText(organLabel(n.id), n.p.x, n.p.y + n.p.r + 14)
      }
    }

    function loop(ts: number) {
      const busy = snapRef.current.brain.live
      if (!reduced && busy && ts - last > 80) {
        yaw.current += 0.008
        last = ts
        draw()
      }
      raf = requestAnimationFrame(loop)
    }
    draw()
    if (!reduced) raf = requestAnimationFrame(loop)

    function pos(ev: PointerEvent) {
      const r = surface.getBoundingClientRect()
      return { x: ev.clientX - r.left, y: ev.clientY - r.top }
    }
    function hit(x: number, y: number) {
      let best: BodyOrgan | null = null
      let bestD = 28
      for (const n of NODES) {
        const p = project(n.x, n.y, n.z)
        const d = Math.hypot(p.x - x, p.y - y)
        if (d < bestD) {
          bestD = d
          best = n.id
        }
      }
      return best
    }

    const down = (ev: PointerEvent) => {
      surface.setPointerCapture(ev.pointerId)
      drag.current = pos(ev)
    }
    const move = (ev: PointerEvent) => {
      if (!drag.current || reduced) return
      const p = pos(ev)
      yaw.current += (p.x - drag.current.x) * 0.01
      pitch.current = Math.max(-0.8, Math.min(0.8, pitch.current + (p.y - drag.current.y) * 0.008))
      drag.current = p
      draw()
    }
    const up = (ev: PointerEvent) => {
      const start = drag.current
      drag.current = null
      if (!start) return
      const p = pos(ev)
      if (Math.hypot(p.x - start.x, p.y - start.y) < 8) {
        const id = hit(p.x, p.y)
        if (id) onSelect(id)
      }
    }
    surface.addEventListener('pointerdown', down)
    surface.addEventListener('pointermove', move)
    surface.addEventListener('pointerup', up)
    surface.addEventListener('pointercancel', () => {
      drag.current = null
    })
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      surface.removeEventListener('pointerdown', down)
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerup', up)
    }
  }, [onSelect, reduced, selected, snap])

  return <canvas ref={canvasRef} className="body-schema" aria-label="Körper-Schema" />
}
