import { useEffect, useRef } from 'react'
import {
  activeAgentId,
  activeTracePath,
  BRAIN_CENTER,
  DEPARTMENT_NODES,
  departmentLive,
} from '../../engine/agent-map'
import { isDocumentHidden, MOTION_FRAME_MS, onVisibility } from '../../engine/motion'

export function AgentMapCanvas({
  reduced,
  onSelectDept,
  selectedDept,
}: {
  reduced: boolean
  onSelectDept: (id: string) => void
  selectedDept: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(activeAgentId())
  const traceRef = useRef(activeTracePath())
  const selRef = useRef(selectedDept)
  selRef.current = selectedDept
  activeRef.current = activeAgentId()
  traceRef.current = activeTracePath()

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
    const offVis = onVisibility(() => {
      if (!isDocumentHidden()) draw()
    })

    function project(x: number, y: number) {
      const w = surface.clientWidth
      const h = surface.clientHeight
      const s = Math.min(w, h) * 0.34
      return { x: w / 2 + x * s, y: h / 2 - y * s, r: 12 }
    }

    function draw() {
      if (isDocumentHidden()) return
      const w = surface.clientWidth
      const h = surface.clientHeight
      g.clearRect(0, 0, w, h)
      const center = project(BRAIN_CENTER.x, BRAIN_CENTER.y)
      const nodes = DEPARTMENT_NODES.map((d) => ({ ...d, p: project(d.x, d.y) }))
      const active = activeRef.current
      const trace = traceRef.current

      g.strokeStyle = 'rgba(29,185,84,0.22)'
      g.lineWidth = 1.2
      for (const n of nodes) {
        g.beginPath()
        g.moveTo(center.x, center.y)
        g.lineTo(n.p.x, n.p.y)
        g.stroke()
      }

      if (!reduced && active && trace.length) {
        const dept = DEPARTMENT_NODES.find((d) => departmentLive(d.id))
        if (dept) {
          const target = nodes.find((n) => n.id === dept.id)?.p
          if (target) {
            const t = pulseT * 0.004
            const px = center.x + (target.x - center.x) * (0.35 + 0.25 * Math.sin(t))
            const py = center.y + (target.y - center.y) * (0.35 + 0.25 * Math.sin(t))
            g.beginPath()
            g.fillStyle = 'rgba(29,185,84,0.85)'
            g.arc(px, py, 5, 0, Math.PI * 2)
            g.fill()
          }
        }
      }

      for (const n of nodes) {
        const live = departmentLive(n.id) || selRef.current === n.id
        const hot = selRef.current === n.id
        let extra = 0
        if (!reduced && live) extra += 0.08 * (0.5 + 0.5 * Math.sin(pulseT * 0.006))
        g.beginPath()
        g.fillStyle = live ? '#1db954' : 'rgba(180,180,180,0.35)'
        g.strokeStyle = hot ? '#fff' : 'rgba(255,255,255,0.2)'
        g.lineWidth = hot ? 2.2 : 1
        g.arc(n.p.x, n.p.y, n.p.r * (1 + extra), 0, Math.PI * 2)
        g.fill()
        g.stroke()
        g.fillStyle = 'rgba(255,255,255,0.82)'
        g.font = '11px Inter, system-ui, sans-serif'
        g.textAlign = 'center'
        g.fillText(n.label, n.p.x, n.p.y + n.p.r + 14)
      }

      const brainLive = Boolean(active)
      g.beginPath()
      g.fillStyle = brainLive ? '#1db954' : 'rgba(120,120,120,0.5)'
      g.strokeStyle = 'rgba(255,255,255,0.35)'
      g.lineWidth = 2
      g.arc(center.x, center.y, center.r * 1.35, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      g.fillStyle = 'rgba(255,255,255,0.9)'
      g.font = '12px Inter, system-ui, sans-serif'
      g.fillText(BRAIN_CENTER.label, center.x, center.y + center.r + 18)
    }

    function loop(ts: number) {
      if (ts - last < MOTION_FRAME_MS) {
        raf = requestAnimationFrame(loop)
        return
      }
      last = ts
      pulseT = ts
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    function hitTest(clientX: number, clientY: number): string | null {
      const rect = surface.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      for (const n of DEPARTMENT_NODES) {
        const p = project(n.x, n.y)
        const dx = x - p.x
        const dy = y - p.y
        if (dx * dx + dy * dy <= (p.r + 8) ** 2) return n.id
      }
      const c = project(BRAIN_CENTER.x, BRAIN_CENTER.y)
      const dx = x - c.x
      const dy = y - c.y
      if (dx * dx + dy * dy <= (c.r + 10) ** 2) return 'brain'
      return null
    }

    function onClick(ev: MouseEvent) {
      const id = hitTest(ev.clientX, ev.clientY)
      if (id) onSelectDept(id)
    }
    surface.addEventListener('click', onClick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      offVis()
      surface.removeEventListener('click', onClick)
    }
  }, [onSelectDept, reduced])

  return <canvas ref={canvasRef} className="agent-map-canvas" aria-label="Agenten-Karte" />
}
