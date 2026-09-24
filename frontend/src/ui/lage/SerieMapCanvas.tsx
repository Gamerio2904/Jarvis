import { useEffect, useRef } from 'react'
import { nearestHit, type HitCandidate } from '../../engine/agent-zoom.ts'
import { isDocumentHidden, onVisibility } from '../../engine/motion.ts'
import { avatarImage, avatarStats, onAvatarReady, requestAvatar } from '../../engine/rm-avatars.ts'
import { RM_CORE_IDS, RM_SKILLS } from '../../engine/rm-dossier.ts'
import {
  buildRmGraph,
  characterById,
  coappearEdges,
  RM_COAPPEAR_MIN,
} from '../../engine/rm-graph.ts'
import type { RmDot, RmEdge } from '../../engine/rm-types.ts'

export const RM_ZOOM_MIN = 0.65
export const RM_ZOOM_MAX = 7

const CORE = new Set<number>(RM_CORE_IDS)

const SPECIES_COLOR: Record<string, string> = {
  Human: '#7dffb0',
  Humanoid: '#9ad4ff',
  Alien: '#d2a4ff',
  Animal: '#ffd27a',
  Robot: '#c8d0d8',
  'Mythological Creature': '#ff9ad2',
  Poopybutthole: '#f0c090',
  Cronenberg: '#7cff7c',
  Disease: '#ff8a8a',
  unknown: '#9aa8a0',
}

type Screen = { x: number; y: number }

function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return 1
  return Math.max(RM_ZOOM_MIN, Math.min(RM_ZOOM_MAX, z))
}

export function SerieMapCanvas({
  selectedId,
  query,
  onlySkills,
  onSelect,
}: {
  selectedId: number | null
  query: string
  onlySkills: boolean
  onSelect: (id: number | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selectedRef = useRef(selectedId)
  const queryRef = useRef(query)
  const skillsRef = useRef(onlySkills)
  const selectRef = useRef(onSelect)
  const kickRef = useRef<() => void>(() => {})
  selectedRef.current = selectedId
  queryRef.current = query
  skillsRef.current = onlySkills
  selectRef.current = onSelect

  useEffect(() => {
    kickRef.current()
  }, [selectedId, query, onlySkills])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const g: CanvasRenderingContext2D = ctx
    const surface = canvas
    const graph = buildRmGraph()
    const strong = coappearEdges(Math.max(RM_COAPPEAR_MIN, 4))
    const cam = { zoom: 1, panX: 0, panY: 0 }
    let raf = 0
    let live = true
    const touches = new Map<number, Screen>()
    let dragging = false
    let lastPtr = { x: 0, y: 0 }
    let moved = 0
    let pinchSpan = 0

    function resize() {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      const w = Math.max(1, surface.clientWidth)
      const h = Math.max(1, surface.clientHeight)
      surface.width = Math.round(w * dpr)
      surface.height = Math.round(h * dpr)
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function worldScale() {
      return (Math.min(surface.clientWidth, surface.clientHeight) * 0.46) * cam.zoom
    }

    function project(dot: RmDot): Screen {
      const s = worldScale()
      return {
        x: surface.clientWidth / 2 + (dot.x + cam.panX) * s,
        y: surface.clientHeight / 2 + (dot.y + cam.panY) * s,
      }
    }

    function visibleDots(): RmDot[] {
      const q = queryRef.current.trim().toLowerCase()
      return graph.dots.filter((d) => {
        const c = characterById(d.id)
        if (!c) return false
        if (skillsRef.current && !cHasSkill(d.id)) return false
        if (q && !c.name.toLowerCase().includes(q) && String(c.id) !== q) return false
        return true
      })
    }

    function cHasSkill(id: number): boolean {
      return Boolean(RM_SKILLS[id]?.length)
    }

    function draw() {
      if (!live || isDocumentHidden()) return
      const w = surface.clientWidth
      const h = surface.clientHeight
      if (!(w > 4 && h > 4)) return
      g.clearRect(0, 0, w, h)
      const sel = selectedRef.current
      const dots = visibleDots()
      const shown = new Set(dots.map((d) => d.id))
      const at = new Map<number, Screen>()
      for (const d of dots) at.set(d.id, project(d))
      const scale = worldScale()

      function strokeEdge(e: RmEdge, color: string, width: number) {
        if (!shown.has(e.from) || !shown.has(e.to)) return
        const a = at.get(e.from)
        const b = at.get(e.to)
        if (!a || !b) return
        g.beginPath()
        g.strokeStyle = color
        g.lineWidth = width
        g.moveTo(a.x, a.y)
        g.lineTo(b.x, b.y)
        g.stroke()
      }

      g.lineCap = 'round'
      if (!sel) {
        for (const e of strong) strokeEdge(e, 'rgba(120, 170, 140, 0.1)', 0.7)
      }
      for (const e of graph.curated) {
        const hot = sel === e.from || sel === e.to
        const color =
          e.kind === 'family'
            ? hot
              ? 'rgba(255, 210, 120, 0.9)'
              : 'rgba(255, 210, 120, 0.35)'
            : e.kind === 'enemy'
              ? hot
                ? 'rgba(255, 110, 110, 0.85)'
                : 'rgba(255, 110, 110, 0.28)'
              : e.kind === 'partner'
                ? hot
                  ? 'rgba(255, 150, 210, 0.85)'
                  : 'rgba(255, 150, 210, 0.28)'
                : hot
                  ? 'rgba(30, 215, 96, 0.85)'
                  : 'rgba(30, 215, 96, 0.28)'
        strokeEdge(e, color, hot ? 2 : 1.15)
      }
      if (sel) {
        const me = characterById(sel)
        if (me) {
          for (const other of graph.characters) {
            if (other.id === sel || !shown.has(other.id)) continue
            const share = me.eps.filter((ep) => other.eps.includes(ep)).length
            if (share <= 0) continue
            const named = graph.curated.some(
              (e) => (e.from === sel && e.to === other.id) || (e.to === sel && e.from === other.id),
            )
            if (named) continue
            strokeEdge(
              {
                from: sel,
                to: other.id,
                kind: 'coappear',
                label: '',
                shared: share,
                evidence: [],
              },
              share >= 3 ? 'rgba(160, 210, 255, 0.45)' : 'rgba(160, 210, 255, 0.18)',
              share >= 3 ? 1.2 : 0.7,
            )
          }
        }
      }

      if (sel) {
        requestAvatar(sel, true)
        for (const e of graph.curated) {
          if (e.from === sel) requestAvatar(e.to, true)
          if (e.to === sel) requestAvatar(e.from, true)
        }
      }
      const q = queryRef.current.trim().toLowerCase()
      for (const d of dots) {
        const p = at.get(d.id)
        const c = characterById(d.id)
        if (!p || !c) continue
        const isSel = sel === d.id
        const few = dots.length <= 48
        const r = Math.max(isSel ? 26 : few ? 18 : 11, d.r * scale * (few ? 1.35 : 1))
        const match = q && c.name.toLowerCase().includes(q)
        const urgent = isSel || Boolean(match) || CORE.has(d.id)
        if (r >= 7 || urgent) requestAvatar(d.id, urgent)
        const face = avatarImage(d.id)
        g.globalAlpha = sel && !isSel ? 0.48 : 1
        g.beginPath()
        g.fillStyle = match ? '#fff3b0' : SPECIES_COLOR[c.species] || '#9aa8a0'
        g.arc(p.x, p.y, r, 0, Math.PI * 2)
        g.fill()
        if (face) {
          g.save()
          g.beginPath()
          g.arc(p.x, p.y, r, 0, Math.PI * 2)
          g.clip()
          g.drawImage(face, p.x - r, p.y - r, r * 2, r * 2)
          g.restore()
        }
        g.beginPath()
        g.strokeStyle = isSel ? '#1ed760' : 'rgba(8, 12, 10, 0.55)'
        g.lineWidth = isSel ? 2.4 : 1
        g.arc(p.x, p.y, r, 0, Math.PI * 2)
        g.stroke()
        g.globalAlpha = 1
      }
      const st = avatarStats()
      surface.dataset.faces = `${st.ready}/${st.waiting}/${st.queued}/${st.failed}`

      const labelIds = new Set<number>()
      if (sel) labelIds.add(sel)
      for (const e of graph.curated) {
        if (sel === e.from) labelIds.add(e.to)
        if (sel === e.to) labelIds.add(e.from)
      }
      if (cam.zoom >= 2.1) {
        for (const d of dots) {
          if ((characterById(d.id)?.eps.length || 0) >= 8) labelIds.add(d.id)
        }
      }
      if (q) {
        for (const d of dots) labelIds.add(d.id)
      }
      g.font = '11px Inter, system-ui, sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'top'
      const taken: { x: number; y: number; w: number; h: number }[] = []
      for (const id of labelIds) {
        const d = dots.find((x) => x.id === id)
        const p = d ? at.get(id) : null
        const c = characterById(id)
        if (!d || !p || !c) continue
        const text = c.name
        const tw = g.measureText(text).width + 6
        const x = Math.max(tw / 2, Math.min(w - tw / 2, p.x))
        const y = Math.max(12, Math.min(h - 4, p.y + Math.max(6, d.r * scale) + 2))
        const box = { x: x - tw / 2, y, w: tw, h: 13 }
        if (taken.some((t) => box.x < t.x + t.w && t.x < box.x + box.w && box.y < t.y + t.h && t.y < box.y + box.h)) {
          continue
        }
        taken.push(box)
        g.fillStyle = sel === id ? '#f4fff8' : 'rgba(220, 240, 228, 0.86)'
        g.fillText(text, x, y)
      }
    }

    function kick() {
      if (!live) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(draw)
    }
    kickRef.current = kick
    const offAvatars = onAvatarReady(kick)
    for (const id of RM_CORE_IDS) requestAvatar(id, true)
    for (const c of [...graph.characters].sort((a, b) => b.eps.length - a.eps.length).slice(0, 36)) {
      requestAvatar(c.id, c.eps.length >= 20)
    }

    function hits(): HitCandidate[] {
      const scale = worldScale()
      return visibleDots().map((d) => {
        const p = project(d)
        return { id: String(d.id), x: p.x, y: p.y, r: Math.max(16, d.r * scale + 6) }
      })
    }

    function onPtrDown(ev: PointerEvent) {
      surface.setPointerCapture(ev.pointerId)
      touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
      if (touches.size === 2) {
        const pts = [...touches.values()]
        pinchSpan = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        dragging = false
        return
      }
      dragging = true
      lastPtr = { x: ev.clientX, y: ev.clientY }
      moved = 0
    }

    function onPtrMove(ev: PointerEvent) {
      if (!touches.has(ev.pointerId)) return
      touches.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
      if (touches.size === 2 && pinchSpan > 0) {
        const pts = [...touches.values()]
        const span = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
        const next = clampZoom(cam.zoom * (span / pinchSpan))
        cam.zoom = next
        pinchSpan = span
        kick()
        return
      }
      if (!dragging) return
      const dx = ev.clientX - lastPtr.x
      const dy = ev.clientY - lastPtr.y
      lastPtr = { x: ev.clientX, y: ev.clientY }
      moved += Math.hypot(dx, dy)
      const s = worldScale() || 1
      cam.panX += dx / s
      cam.panY += dy / s
      kick()
    }

    function onPtrUp(ev: PointerEvent) {
      const start = touches.get(ev.pointerId)
      touches.delete(ev.pointerId)
      if (touches.size < 2) {
        pinchSpan = 0
      }
      if (!dragging) return
      dragging = false
      if (moved > 8 || !start) return
      const rect = surface.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      const id = nearestHit(x, y, hits())
      selectRef.current(id ? Number(id) : null)
    }

    function onWheel(ev: WheelEvent) {
      ev.preventDefault()
      const dir = ev.deltaY > 0 ? 0.92 : 1.08
      cam.zoom = clampZoom(cam.zoom * dir)
      kick()
    }

    resize()
    const ro = new ResizeObserver(() => {
      resize()
      kick()
    })
    ro.observe(surface)
    surface.addEventListener('pointerdown', onPtrDown)
    surface.addEventListener('pointermove', onPtrMove)
    surface.addEventListener('pointerup', onPtrUp)
    surface.addEventListener('pointercancel', onPtrUp)
    surface.addEventListener('wheel', onWheel, { passive: false })
    const offVis = onVisibility(() => {
      if (!isDocumentHidden()) kick()
    })
    kick()
    return () => {
      live = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      offVis()
      offAvatars()
      surface.removeEventListener('pointerdown', onPtrDown)
      surface.removeEventListener('pointermove', onPtrMove)
      surface.removeEventListener('pointerup', onPtrUp)
      surface.removeEventListener('pointercancel', onPtrUp)
      surface.removeEventListener('wheel', onWheel)
    }
  }, [])

  return <canvas ref={canvasRef} className="serie-map-canvas agent-map-canvas" aria-label="Rick-and-Morty-Charakter-Netz" />
}
