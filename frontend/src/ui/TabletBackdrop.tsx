import { useEffect, useRef } from 'react'

type Props = { active: boolean }

type Spark = { x: number; y: number; vx: number; vy: number; r: number; h: number }

/** Animierter Ultron-Hintergrund: Hex-Gitter, glühendes Auge, Scan-Ringe, Funken. */
export function TabletBackdrop({ active }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    let glow = 0
    let sparks: Spark[] = []
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(90, (w * h) / 14000))
      sparks = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.1 - Math.random() * 0.35,
        r: 0.6 + Math.random() * 1.8,
        h: Math.random() < 0.8 ? 355 : 190,
      }))
    }
    resize()
    window.addEventListener('resize', resize)

    const hex = (cx: number, cy: number, r: number) => {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6
        const px = cx + r * Math.cos(a)
        const py = cy + r * Math.sin(a)
        if (i) ctx.lineTo(px, py)
        else ctx.moveTo(px, py)
      }
      ctx.closePath()
    }

    const draw = (ms: number) => {
      const t = ms / 1000
      glow += ((activeRef.current ? 1 : 0) - glow) * 0.06
      const cx = w / 2
      const cy = h * 0.5
      const m = Math.min(w, h)

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75)
      bg.addColorStop(0, '#2a0508')
      bg.addColorStop(0.45, '#0c0206')
      bg.addColorStop(1, '#010103')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Hex-Gitter, das um das Auge herum pulsiert
      const size = Math.max(26, m / 16)
      const dx = size * Math.sqrt(3)
      const dy = size * 1.5
      ctx.lineWidth = 1
      for (let row = -1, y = 0; y < h + dy; row++, y += dy) {
        for (let x = (row & 1 ? dx / 2 : 0) - dx; x < w + dx; x += dx) {
          const d = Math.hypot(x - cx, y - cy) / m
          const wave = 0.5 + 0.5 * Math.sin(t * 1.3 - d * 7)
          const a = Math.max(0, 0.16 - d * 0.14) * (0.35 + wave * 0.9 + glow * 0.5)
          if (a < 0.01) continue
          ctx.strokeStyle = `rgba(255, 52, 58, ${a})`
          hex(x, y, size * 0.94)
          ctx.stroke()
        }
      }

      // Scan-Ringe
      const eye = m * 0.2
      for (let i = 0; i < 3; i++) {
        const p = (t * 0.12 + i / 3) % 1
        ctx.strokeStyle = `rgba(255, 70, 70, ${(1 - p) * 0.28 * (1 + glow)})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(cx, cy, eye * (1 + p * 3), 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(t * 0.25)
      ctx.strokeStyle = 'rgba(255, 90, 90, 0.45)'
      ctx.lineWidth = 2
      ctx.setLineDash([eye * 0.35, eye * 0.18])
      ctx.beginPath()
      ctx.arc(0, 0, eye * 1.45, 0, Math.PI * 2)
      ctx.stroke()
      ctx.rotate(-t * 0.55)
      ctx.setLineDash([6, 14])
      ctx.beginPath()
      ctx.arc(0, 0, eye * 1.75, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
      ctx.setLineDash([])

      // Auge
      const pulse = 0.85 + 0.15 * Math.sin(t * 2.1) + glow * 0.35
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, eye * 3.2)
      halo.addColorStop(0, `rgba(255, 40, 40, ${0.5 * pulse})`)
      halo.addColorStop(0.35, `rgba(200, 10, 20, ${0.18 * pulse})`)
      halo.addColorStop(1, 'rgba(120, 0, 10, 0)')
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, w, h)
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, eye)
      core.addColorStop(0, `rgba(255, 245, 230, ${Math.min(1, pulse)})`)
      core.addColorStop(0.18, `rgba(255, 90, 70, ${Math.min(1, pulse)})`)
      core.addColorStop(0.6, 'rgba(160, 6, 18, 0.9)')
      core.addColorStop(1, 'rgba(40, 0, 6, 0.95)')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(cx, cy, eye, 0, Math.PI * 2)
      ctx.fill()
      // Schlitz-Pupille
      ctx.fillStyle = 'rgba(20, 0, 4, 0.85)'
      ctx.beginPath()
      ctx.ellipse(cx, cy, eye * 0.09, eye * 0.62, 0, 0, Math.PI * 2)
      ctx.fill()

      // Scanlinie
      const sy = ((t * 0.09) % 1) * h
      const scan = ctx.createLinearGradient(0, sy - 60, 0, sy + 60)
      scan.addColorStop(0, 'rgba(255, 40, 50, 0)')
      scan.addColorStop(0.5, 'rgba(255, 60, 70, 0.07)')
      scan.addColorStop(1, 'rgba(255, 40, 50, 0)')
      ctx.fillStyle = scan
      ctx.fillRect(0, sy - 60, w, 120)

      // Funken
      for (const s of sparks) {
        s.x += s.vx
        s.y += s.vy
        if (s.y < -4) {
          s.y = h + 4
          s.x = Math.random() * w
        }
        if (s.x < -4) s.x = w + 4
        if (s.x > w + 4) s.x = -4
        ctx.fillStyle = `hsla(${s.h}, 100%, 62%, ${0.25 + 0.35 * Math.sin(t * 2 + s.x)})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Vignette
      const vg = ctx.createRadialGradient(cx, cy, m * 0.4, cx, cy, Math.max(w, h) * 0.8)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(0,0,0,0.7)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)

      if (!reduced) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="tablet-backdrop" aria-hidden="true" />
}
