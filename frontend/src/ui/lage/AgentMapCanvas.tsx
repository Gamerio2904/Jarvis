import { useEffect, useRef } from 'react'
import {
  activeAgentId,
  activeTracePath,
  BRAIN_CENTER,
  DEPARTMENT_NODES,
  departmentLive,
  layoutAgentDots,
  sparkLoop,
  sparkPath,
  synapses,
} from '../../engine/agent-map.ts'
import { isDocumentHidden, MOTION_FRAME_MS, onVisibility } from '../../engine/motion.ts'

type Screen = { x: number; y: number }

export function AgentMapCanvas({
  reduced,
  onSelectDept,
  selectedDept,
  busy = false,
  selectedAgent = '',
  liveAgent = '',
  usedKey = '',
}: {
  reduced: boolean
  onSelectDept: (id: string) => void
  selectedDept: string
  busy?: boolean
  selectedAgent?: string
  liveAgent?: string
  usedKey?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selDeptRef = useRef(selectedDept)
  const selAgentRef = useRef(selectedAgent)
  const busyRef = useRef(busy)
  const liveRef = useRef(liveAgent)
  selDeptRef.current = selectedDept
  selAgentRef.current = selectedAgent
  busyRef.current = busy
  liveRef.current = liveAgent

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const surface = canvas
    const g = ctx
    let raf = 0
    let last = 0
    let pulseT = 0
    const dots = layoutAgentDots()
    const edges = synapses(dots)

    function sync() {
      return {
        active: liveRef.current || activeAgentId(),
        traces: activeTracePath(),
        busy: busyRef.current,
        selDept: selDeptRef.current,
        selAgent: selAgentRef.current,
      }
    }

    function needsMotion() {
      if (reduced) return false
      const s = sync()
      return s.busy || Boolean(s.active) || sparkPath(s.active, s.traces).length > 1
    }

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
      kick()
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

    const rot = { x: 0.18, y: -0.42 }
    let dragging = false
    let lastPtr = { x: 0, y: 0 }
    let moved = 0

    function project(x: number, y: number): Screen {
      const cy = Math.cos(rot.y)
      const sy = Math.sin(rot.y)
      const cx = Math.cos(rot.x)
      const sx = Math.sin(rot.x)
      const x1 = x * cy
      const z1 = x * sy
      const y1 = y * cx - z1 * sx
      const z2 = y * sx + z1 * cx
      const persp = 1 / (1.85 + z2 * 0.42)
      const w = surface.clientWidth
      const h = surface.clientHeight
      const s = Math.min(w, h) * 0.4 * persp
      return { x: w / 2 + x1 * s, y: h / 2 - y1 * s }
    }

    const points = new Map<string, Screen>()
    function locate(): Map<string, Screen> {
      points.clear()
      points.set('brain', project(BRAIN_CENTER.x, BRAIN_CENTER.y))
      for (const d of DEPARTMENT_NODES) points.set(`dept:${d.id}`, project(d.x, d.y))
      for (const a of dots) points.set(a.id, project(a.x, a.y))
      return points
    }

    function drawBrain(c: Screen, live: boolean, t: number) {
      const r = Math.min(surface.clientWidth, surface.clientHeight) * 0.092
      if (!(r > 6)) {
        g.beginPath()
        g.fillStyle = live ? '#d4a090' : '#6a4a48'
        g.arc(c.x, c.y, 10, 0, Math.PI * 2)
        g.fill()
        return
      }
      g.save()
      g.translate(c.x, c.y)
      if (live) {
        g.beginPath()
        g.fillStyle = `rgba(30, 215, 96, ${0.16 + 0.1 * Math.sin(t * 0.005)})`
        g.arc(0, 0, r * 1.62, 0, Math.PI * 2)
        g.fill()
      }
      g.beginPath()
      g.moveTo(0, r * 0.92)
      g.quadraticCurveTo(r * 0.16, r * 0.72, r * 0.12, r * 0.52)
      g.lineTo(-r * 0.12, r * 0.52)
      g.quadraticCurveTo(-r * 0.16, r * 0.72, 0, r * 0.92)
      g.fillStyle = live ? '#8a5a58' : '#5a4040'
      g.fill()
      g.beginPath()
      g.ellipse(-r * 0.4, -r * 0.08, r * 0.56, r * 0.84, -0.28, 0, Math.PI * 2)
      g.ellipse(r * 0.4, -r * 0.08, r * 0.56, r * 0.84, 0.28, 0, Math.PI * 2)
      g.ellipse(0, r * 0.62, r * 0.4, r * 0.26, 0, 0, Math.PI * 2)
      const fill = g.createRadialGradient(-r * 0.22, -r * 0.38, r * 0.08, 0, r * 0.1, r * 1.15)
      fill.addColorStop(0, live ? '#f0c8bc' : '#d2b0a4')
      fill.addColorStop(0.35, live ? '#c98678' : '#a8786c')
      fill.addColorStop(0.75, live ? '#8e4e48' : '#6e4844')
      fill.addColorStop(1, live ? '#4a2a28' : '#3a2828')
      g.fillStyle = fill
      g.fill()
      g.strokeStyle = live ? 'rgba(30, 215, 96, 0.75)' : 'rgba(255,220,210,0.3)'
      g.lineWidth = live ? 2.1 : 1.05
      g.stroke()
      g.strokeStyle = 'rgba(48, 18, 18, 0.72)'
      g.lineWidth = 2.2
      g.beginPath()
      g.moveTo(0, -r * 0.78)
      g.bezierCurveTo(0, -r * 0.12, 0, r * 0.18, 0, r * 0.4)
      g.stroke()
      for (const side of [-1, 1]) {
        for (const fold of [
          [0.1, -0.58, 0.48, -0.46, 0.56, -0.08, 0.24, 0.2],
          [0.14, -0.28, 0.44, -0.04, 0.4, 0.22, 0.12, 0.34],
          [0.08, 0.02, 0.36, 0.18, 0.3, 0.4, 0.06, 0.46],
          [0.18, -0.7, 0.52, -0.62, 0.58, -0.28, 0.32, -0.1],
        ] as const) {
          g.beginPath()
          g.moveTo(side * r * fold[0], r * fold[1])
          g.bezierCurveTo(side * r * fold[2], r * fold[3], side * r * fold[4], r * fold[5], side * r * fold[6], r * fold[7])
          g.stroke()
        }
      }
      g.restore()
    }

    function drawSpark(pathIds: string[], at: Map<string, Screen>, t: number) {
      const loop = sparkLoop(pathIds)
      const pts = loop.map((id) => at.get(id)).filter(Boolean) as Screen[]
      if (pts.length < 2) return
      const segs: { a: Screen; b: Screen; len: number }[] = []
      let total = 0
      for (let i = 0; i < pts.length - 1; i++) {
        const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y)
        segs.push({ a: pts[i], b: pts[i + 1], len })
        total += len
      }
      if (total < 4) return
      let dist = ((t * 0.22) % total + total) % total
      let p = pts[0]
      let dir = { x: 1, y: 0 }
      for (const seg of segs) {
        if (dist <= seg.len) {
          const k = seg.len ? dist / seg.len : 0
          p = { x: seg.a.x + (seg.b.x - seg.a.x) * k, y: seg.a.y + (seg.b.y - seg.a.y) * k }
          dir = { x: seg.b.x - seg.a.x, y: seg.b.y - seg.a.y }
          break
        }
        dist -= seg.len
      }
      const mag = Math.hypot(dir.x, dir.y) || 1
      const nx = -dir.y / mag
      const ny = dir.x / mag
      g.beginPath()
      g.strokeStyle = 'rgba(180, 255, 210, 0.85)'
      g.lineWidth = 1.4
      g.moveTo(p.x - nx * 5, p.y - ny * 5)
      g.lineTo(p.x + nx * 2.2, p.y + ny * 2.2)
      g.lineTo(p.x - nx * 1.2 + dir.x / mag * 6, p.y - ny * 1.2 + dir.y / mag * 6)
      g.stroke()
      g.beginPath()
      g.fillStyle = 'rgba(180, 255, 210, 0.28)'
      g.arc(p.x, p.y, 9, 0, Math.PI * 2)
      g.fill()
      g.beginPath()
      g.fillStyle = '#f4fff8'
      g.shadowColor = '#1ed760'
      g.shadowBlur = 14
      g.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
      g.fill()
      g.shadowBlur = 0
    }

    function draw() {
      if (isDocumentHidden()) return
      const w = surface.clientWidth
      const h = surface.clientHeight
      if (!(w > 4 && h > 4)) return
      g.clearRect(0, 0, w, h)
      const at = locate()
      const s = sync()
      const liveId = s.active
      const path = sparkPath(liveId, s.traces)
      const brain = at.get('brain')
      if (!brain) return

      g.lineCap = 'round'
      g.lineJoin = 'round'
      for (const e of edges) {
        const a = at.get(e.from)
        const b = at.get(e.to)
        if (!a || !b) continue
        const hot = path.includes(e.from) && path.includes(e.to)
        g.beginPath()
        g.strokeStyle = hot ? 'rgba(30, 215, 96, 0.55)' : 'rgba(120, 170, 140, 0.18)'
        g.lineWidth = hot ? 1.8 : 0.85
        g.moveTo(a.x, a.y)
        g.lineTo(b.x, b.y)
        g.stroke()
      }

      drawBrain(brain, Boolean(liveId) || s.busy, pulseT)

      const liveDepts = new Set(dots.map((a) => a.department))
      for (const d of DEPARTMENT_NODES) {
        if (!liveDepts.has(d.id) && s.selDept !== d.id) continue
        const p = at.get(`dept:${d.id}`)
        if (!p) continue
        const live = departmentLive(d.id) || s.selDept === d.id
        const glow = live ? 1 + 0.08 * (0.5 + 0.5 * Math.sin(pulseT * 0.006)) : 1
        g.beginPath()
        g.fillStyle = live ? 'rgba(30, 215, 96, 0.92)' : 'rgba(90, 110, 100, 0.55)'
        g.strokeStyle = s.selDept === d.id ? '#fff' : 'rgba(255,255,255,0.2)'
        g.lineWidth = s.selDept === d.id ? 2 : 1
        g.arc(p.x, p.y, 7.5 * glow, 0, Math.PI * 2)
        g.fill()
        g.stroke()
        g.fillStyle = 'rgba(230, 240, 236, 0.78)'
        g.font = '10px Inter, system-ui, sans-serif'
        g.textAlign = 'center'
        g.fillText(d.label, p.x, p.y + 18)
      }

      for (const a of dots) {
        const p = at.get(a.id)
        if (!p) continue
        const live = a.id === liveId
        const hot = a.id === s.selAgent
        const inDept = s.selDept === a.department
        const r = live ? 5.6 : 3.5
        if (live) {
          g.beginPath()
          g.fillStyle = `rgba(30, 215, 96, ${0.24 + 0.14 * Math.sin(pulseT * 0.008)})`
          g.arc(p.x, p.y, r + 8, 0, Math.PI * 2)
          g.fill()
        }
        g.beginPath()
        g.fillStyle = live ? '#7dffb0' : hot ? '#d8f0e0' : 'rgba(190, 210, 200, 0.58)'
        g.arc(p.x, p.y, r, 0, Math.PI * 2)
        g.fill()
        if (live || hot || inDept) {
          g.fillStyle = live || hot ? 'rgba(245, 250, 246, 0.94)' : 'rgba(220, 230, 224, 0.62)'
          g.font = `${live || hot ? 10 : 8}px Inter, system-ui, sans-serif`
          g.textAlign = 'center'
          g.fillText(a.label, p.x, p.y - (live ? 12 : 9))
        }
      }

      if (path.length > 1) drawSpark(path, at, reduced ? 480 : pulseT)
    }

    function kick() {
      if (raf || isDocumentHidden()) return
      if (!needsMotion()) {
        draw()
        return
      }
      raf = requestAnimationFrame(loop)
    }

    function loop(ts: number) {
      raf = 0
      if (isDocumentHidden()) return
      if (ts - last < MOTION_FRAME_MS) {
        if (needsMotion()) kick()
        return
      }
      last = ts
      pulseT = ts
      draw()
      if (needsMotion()) kick()
    }
    kick()

    function hitTest(clientX: number, clientY: number): string | null {
      const rect = surface.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      const at = locate()
      for (const a of dots) {
        const p = at.get(a.id)
        if (!p) continue
        if ((x - p.x) ** 2 + (y - p.y) ** 2 <= 14 ** 2) return a.id
      }
      for (const d of DEPARTMENT_NODES) {
        const p = at.get(`dept:${d.id}`)
        if (!p) continue
        if ((x - p.x) ** 2 + (y - p.y) ** 2 <= 16 ** 2) return d.id
      }
      const c = at.get('brain')
      if (c && (x - c.x) ** 2 + (y - c.y) ** 2 <= 28 ** 2) return 'brain'
      return null
    }

    function onPointerDown(ev: PointerEvent) {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return
      surface.setPointerCapture(ev.pointerId)
      dragging = true
      moved = 0
      lastPtr = { x: ev.clientX, y: ev.clientY }
    }
    function onPointerMove(ev: PointerEvent) {
      if (!dragging) return
      const dx = ev.clientX - lastPtr.x
      const dy = ev.clientY - lastPtr.y
      lastPtr = { x: ev.clientX, y: ev.clientY }
      moved += Math.hypot(dx, dy)
      rot.y += dx * 0.008
      rot.x = Math.max(-0.9, Math.min(0.9, rot.x + dy * 0.008))
      kick()
    }
    function onPointerUp(ev: PointerEvent) {
      dragging = false
      try {
        surface.releasePointerCapture(ev.pointerId)
      } catch {
        /* already released */
      }
      if (moved > 10) return
      const id = hitTest(ev.clientX, ev.clientY)
      if (id) onSelectDept(id)
    }
    surface.addEventListener('pointerdown', onPointerDown)
    surface.addEventListener('pointermove', onPointerMove)
    surface.addEventListener('pointerup', onPointerUp)
    surface.addEventListener('pointercancel', onPointerUp)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      offVis()
      surface.removeEventListener('pointerdown', onPointerDown)
      surface.removeEventListener('pointermove', onPointerMove)
      surface.removeEventListener('pointerup', onPointerUp)
      surface.removeEventListener('pointercancel', onPointerUp)
    }
  }, [onSelectDept, reduced, busy, selectedAgent, liveAgent, selectedDept, usedKey])

  return <canvas ref={canvasRef} className="agent-map-canvas" aria-label="Agenten-Netz" />
}
