import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { geminiReady } from '../engine/gemini.ts'
import { groqReady } from '../engine/groq.ts'
import { isModelReady } from '../engine/llm.ts'
import {
  CORE_SPHERES,
  frontIndex,
  isCoreId,
  yawForIndex,
  type CoreId,
} from '../engine/core-brains.ts'
import { loadSettings, saveSettings } from '../engine/store.ts'
import './core-overlay.css'

const COLORS: Record<CoreId, { light: string; mid: string; dark: string; rim: string }> = {
  gemini: { light: '#d7e6ff', mid: '#6d93ff', dark: '#1a2d72', rim: '#b9f6ff' },
  groq: { light: '#e8fff4', mid: '#3dcc9a', dark: '#0c3d32', rim: '#f6e7a2' },
  local: { light: '#fff6df', mid: '#f0b45a', dark: '#5a3412', rim: '#fff' },
}

function readyOf(id: CoreId): boolean {
  if (id === 'gemini') return geminiReady()
  if (id === 'groq') return groqReady()
  return isModelReady()
}

function readPrimary(): CoreId {
  const id = loadSettings().brain_primary
  return isCoreId(id) ? id : 'gemini'
}

export function CoreOverlay({
  onClose,
  flash = false,
  from,
  target,
}: {
  onClose: () => void
  flash?: boolean
  from?: CoreId
  target?: CoreId
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const yawRef = useRef(0)
  const velRef = useRef(0)
  const dragRef = useRef<{ x: number; moved: boolean } | null>(null)
  const savedRef = useRef<CoreId>(target && isCoreId(target) ? target : readPrimary())
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const [front, setFront] = useState<CoreId>(savedRef.current)
  const [ready, setReady] = useState(() => readyOf(savedRef.current))

  useEffect(() => {
    if (!flash) {
      const index = CORE_SPHERES.findIndex((sphere) => sphere.id === savedRef.current)
      yawRef.current = yawForIndex(Math.max(0, index), CORE_SPHERES.length, 0)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      const current = frontIndex(yawRef.current, CORE_SPHERES.length)
      const next = (current + (event.key === 'ArrowRight' ? 1 : CORE_SPHERES.length - 1)) % CORE_SPHERES.length
      yawRef.current = yawForIndex(next, CORE_SPHERES.length, yawRef.current)
      velRef.current = 0
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, flash])

  useEffect(() => {
    if (!flash) return
    const timer = window.setTimeout(() => closeRef.current(), 1000)
    return () => window.clearTimeout(timer)
  }, [flash])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let last = performance.now()
    const flashStart = performance.now()
    const count = CORE_SPHERES.length
    const endIndex = Math.max(0, CORE_SPHERES.findIndex((sphere) => sphere.id === savedRef.current))
    let startIndex = from ? CORE_SPHERES.findIndex((sphere) => sphere.id === from) : -1
    if (startIndex < 0 || startIndex === endIndex) startIndex = (endIndex + count - 1) % count
    const fromYaw = yawForIndex(startIndex, count, 0)
    const toYaw = yawForIndex(endIndex, count, fromYaw)

    const commit = (index: number) => {
      const id = CORE_SPHERES[index].id
      if (savedRef.current === id) return
      savedRef.current = id
      saveSettings({ brain_primary: id })
      setFront(id)
      setReady(readyOf(id))
    }

    const draw = (now: number) => {
      const dt = Math.min(32, now - last)
      last = now
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const width = Math.max(1, Math.floor(rect.width * dpr))
      const height = Math.max(1, Math.floor(rect.height * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      const dragging = Boolean(dragRef.current)
      let flashGlow = 1
      if (flash) {
        const elapsed = now - flashStart
        const spin = Math.min(1, elapsed / 680)
        const ease = reduced ? 1 : 1 - Math.pow(1 - spin, 3)
        yawRef.current = fromYaw + (toYaw - fromYaw) * ease
        velRef.current = 0
        flashGlow = 1 + Math.sin(Math.min(1, elapsed / 1000) * Math.PI) * 1.7
      } else if (!dragging) {
        yawRef.current += velRef.current * (dt / 16)
        velRef.current *= Math.pow(0.88, dt / 16)
        const snap = yawForIndex(frontIndex(yawRef.current, count), count, yawRef.current)
        const delta = snap - yawRef.current
        if (reduced || Math.abs(velRef.current) < 0.012) {
          yawRef.current += delta * (reduced ? 1 : 0.16)
          velRef.current *= 0.6
          if (Math.abs(delta) < 0.012) {
            yawRef.current = snap
            velRef.current = 0
            commit(frontIndex(yawRef.current, count))
          }
        }
      }
      const yaw = yawRef.current
      const cx = width / 2
      const cy = height * 0.46
      const radius = Math.min(width, height) * 0.28
      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.strokeStyle = 'rgba(150, 210, 255, 0.18)'
      ctx.lineWidth = dpr
      const floorY = cy + height * 0.16
      for (let ring = 1; ring <= 4; ring += 1) {
        ctx.globalAlpha = 0.18 + ring * 0.04
        ctx.beginPath()
        ctx.ellipse(cx, floorY, radius * (0.55 + ring * 0.22), radius * (0.12 + ring * 0.05), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 0.2
      for (let spoke = 0; spoke < 12; spoke += 1) {
        const angle = (spoke / 12) * Math.PI + yaw * 0.15
        ctx.beginPath()
        ctx.moveTo(cx, floorY)
        ctx.lineTo(cx + Math.cos(angle) * radius * 1.35, floorY + Math.sin(angle) * radius * 0.32)
        ctx.stroke()
      }
      ctx.restore()
      const bob = reduced ? 0 : Math.sin(now / 700) * 10 * dpr
      const points = CORE_SPHERES.map((sphere, index) => {
        const angle = (index * Math.PI * 2) / count + yaw
        const x = Math.sin(angle) * radius
        const z = Math.cos(angle) * radius
        const depth = z / Math.max(1, radius)
        const perspective = 1.18 / (1.42 - depth * 0.58)
        const float = bob * Math.sin(now / 900 + index)
        const base = Math.min(radius * 0.26, 72 * dpr)
        const pop = flash && depth > 0.35 ? 1 + 0.08 * Math.sin(Math.min(1, (now - flashStart) / 1000) * Math.PI) : 1
        return {
          sphere,
          index,
          z,
          depth,
          x: cx + x * perspective,
          y: cy + radius * 0.22 * depth + float,
          r: base * perspective * pop,
        }
      }).sort((a, b) => a.z - b.z)
      for (const point of points) {
        const color = COLORS[point.sphere.id]
        const gradient = ctx.createRadialGradient(
          point.x - point.r * 0.32,
          point.y - point.r * 0.38,
          point.r * 0.08,
          point.x,
          point.y,
          point.r,
        )
        gradient.addColorStop(0, '#ffffff')
        gradient.addColorStop(0.16, color.light)
        gradient.addColorStop(0.58, color.mid)
        gradient.addColorStop(1, color.dark)
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.shadowColor = color.rim
        const lit = flash && point.depth > 0.2
        ctx.shadowBlur = (point.z > 0 ? 28 * dpr : 8 * dpr) * (lit ? flashGlow : 1)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.save()
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.r * 0.92, 0, Math.PI * 2)
        ctx.clip()
        ctx.globalAlpha = 0.45
        ctx.strokeStyle = color.rim
        ctx.lineWidth = Math.max(1, point.r * 0.035)
        for (let band = -3; band <= 3; band += 1) {
          ctx.beginPath()
          ctx.ellipse(point.x, point.y + band * point.r * 0.22 + Math.sin(now / 500) * 2, point.r * 0.78, point.r * 0.07, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.restore()
        ctx.beginPath()
        ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2)
        ctx.strokeStyle = color.rim
        ctx.globalAlpha = point.z > 0 ? 0.9 : 0.35
        ctx.lineWidth = Math.max(1.5, point.r * 0.045)
        ctx.stroke()
        ctx.globalAlpha = 1
        if (point.depth > 0.15) {
          ctx.globalAlpha = 1
          ctx.fillStyle = 'rgba(244, 248, 255, 0.92)'
          ctx.font = `${Math.max(12 * dpr, point.r * 0.28)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(point.sphere.label, point.x, point.y + point.r + 18 * dpr)
          ctx.globalAlpha = 1
        }
      }
      frame = window.requestAnimationFrame(draw)
    }
    frame = window.requestAnimationFrame(draw)
    return () => window.cancelAnimationFrame(frame)
  }, [flash, from])

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, moved: false }
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.x
    if (Math.abs(dx) > 2) drag.moved = true
    const delta = dx * 0.008
    yawRef.current += delta
    velRef.current = delta
    drag.x = event.clientX
    const snap = yawForIndex(frontIndex(yawRef.current, CORE_SPHERES.length), CORE_SPHERES.length, yawRef.current)
    const pull = snap - yawRef.current
    if (Math.abs(pull) < 0.42 && Math.abs(delta) < 0.03) yawRef.current += pull * 0.22
  }

  function onPointerUp() {
    dragRef.current = null
  }

  const sphere = CORE_SPHERES.find((item) => item.id === front) || CORE_SPHERES[0]
  const status = ready ? `${sphere.label} ist bereit und antwortet zuerst.` : `${sphere.label} ist Priorität. Sobald es bereit ist, antwortet es zuerst.`

  return createPortal(
    <section
      className={flash ? 'core-overlay is-flash' : 'core-overlay'}
      role="dialog"
      aria-modal={flash ? undefined : true}
      aria-labelledby="core-title"
      data-core-primary={front}
      data-core-flash={flash ? front : undefined}
    >
      <header>
        <div>
          <p>CORE</p>
          <h1 id="core-title">Hirn-Priorität</h1>
        </div>
        <button type="button" onClick={onClose}>Schließen</button>
      </header>
      <div className="core-stage">
        <canvas
          ref={canvasRef}
          aria-label="Kugelring der Hirne. Ziehen dreht um die Hochachse."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      </div>
      <div className="core-caption">
        <div>
          <strong>{sphere.label}</strong>
          <p>{sphere.line}</p>
          <p role="status">{status}</p>
        </div>
        <div className="core-picks" role="group" aria-label="Hirn wählen">
          {CORE_SPHERES.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={item.id === front ? 'is-on' : ''}
              aria-pressed={item.id === front}
              onClick={() => {
                yawRef.current = yawForIndex(index, CORE_SPHERES.length, yawRef.current)
                velRef.current = 0
                savedRef.current = item.id
                saveSettings({ brain_primary: item.id })
                setFront(item.id)
                setReady(readyOf(item.id))
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </section>,
    document.body,
  )
}
