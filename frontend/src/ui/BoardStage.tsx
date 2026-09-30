import { useEffect, useRef, useState } from 'react'
import {
  hapticTick,
  pieceLabel,
  type MotionCue,
  type PieceId,
  type PiecePos,
} from '../engine/board-pieces.ts'
import type { MemoryProposal } from '../engine/store.ts'

export type SprintLine = { n: string; line: string }
export type PspSprint = { n: string; title: string; ziel: string }

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const min = now.getMinutes()
  const label = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const dash = (min / 60) * 100
  return (
    <div className="board-clock" aria-label={`Uhr ${label}`}>
      <svg viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.4" />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray={`${dash} 100`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          pathLength="100"
        />
        <text x="20" y="22" textAnchor="middle">
          {label}
        </text>
      </svg>
    </div>
  )
}

export function BoardStage({
  pieces,
  focus,
  wide,
  rows,
  pspTitle,
  psp,
  sources,
  termin,
  jobs,
  modules,
  wire,
  proposals,
  motion,
  onChange,
  onYes,
  onNo,
  onStop,
}: {
  pieces: PiecePos[]
  focus: PieceId
  wide: boolean
  rows: SprintLine[]
  pspTitle: string
  psp: PspSprint[]
  sources: string[]
  termin: string
  jobs: string[]
  modules: string[]
  wire: string[]
  proposals: MemoryProposal[]
  motion: MotionCue | null
  onChange: (next: PiecePos[]) => void
  onYes: (id: string) => void
  onNo: (id: string) => void
  onStop: () => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [grab, setGrab] = useState<PieceId | null>(null)
  const [touch, setTouch] = useState<PieceId | null>(null)
  const [fling, setFling] = useState<Array<{ id: PieceId; x: number; y: number }>>([])
  const drag = useRef<{ id: PieceId; ox: number; oy: number; left: number; top: number } | null>(null)

  useEffect(() => {
    if (!motion || motion.kind === 'move' && motion.ids.length === 0) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (motion.kind === 'focus' || motion.kind === 'move' || motion.kind === 'recall') {
      setTouch(motion.ids[0] || null)
      const t = window.setTimeout(() => setTouch(null), reduce ? 80 : 160)
      return () => window.clearTimeout(t)
    }
    if (!reduce && motion.from.length) {
      setFling(motion.from)
      const t = window.setTimeout(() => setFling([]), 480 + Math.max(0, motion.steps - 1) * 140)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [motion?.seq])

  function body(id: PieceId) {
    if (id === 'uhr') return <Clock />
    if (id === 'sprintliste') {
      if (!rows.length) return <p>Noch kein Sprint.</p>
      return (
        <ul>
          {rows.map((r) => (
            <li key={r.n}>
              {r.n} {r.line}
            </li>
          ))}
        </ul>
      )
    }
    if (id === 'psp') {
      if (!pspTitle) return <p>Noch kein Auftrag.</p>
      return (
        <ul>
          <li>
            {pspTitle}
            <ul>
              {psp.map((s) => (
                <li key={s.n}>
                  {s.n} {s.title}
                  <ul>
                    <li>{s.ziel || 'Noch leer.'}</li>
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      )
    }
    if (id === 'auftrag') return <p>{pspTitle || 'Sagen Sie Idee: …'}</p>
    if (id === 'quellen') {
      if (!sources.length) return <p>Keine Quellen.</p>
      return (
        <ul>
          {sources.slice(0, 6).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )
    }
    if (id === 'termin') return <p>{termin}</p>
    if (id === 'module') {
      return (
        <ul>
          {modules.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )
    }
    if (id === 'draht') {
      return (
        <div>
          {(wire.length ? wire : ['Kein Draht.']).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )
    }
    return (
      <div>
        {jobs.length ? jobs.slice(0, 3).map((j) => <p key={j}>{j}</p>) : <p>Keine Jobs.</p>}
        {proposals.slice(0, 3).map((p) => (
          <p key={p.id}>
            {p.text.slice(0, 80)}
            <button type="button" onClick={() => onYes(p.id)}>
              Ja
            </button>
            <button type="button" onClick={() => onNo(p.id)}>
              Nein
            </button>
          </p>
        ))}
        {jobs.length ? (
          <button type="button" onClick={onStop}>
            Jobs stopp
          </button>
        ) : null}
      </div>
    )
  }

  function onDown(e: React.PointerEvent, id: PieceId) {
    if (!wide) return
    if ((e.target as HTMLElement).closest('button')) return
    const stage = stageRef.current
    const el = e.currentTarget as HTMLElement
    if (!stage) return
    el.setPointerCapture(e.pointerId)
    const rect = stage.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    drag.current = {
      id,
      ox: e.clientX - box.left,
      oy: e.clientY - box.top,
      left: box.left - rect.left,
      top: box.top - rect.top,
    }
    setGrab(id)
    hapticTick()
  }

  function onMove(e: React.PointerEvent) {
    const d = drag.current
    const stage = stageRef.current
    if (!d || !stage) return
    const rect = stage.getBoundingClientRect()
    const el = e.currentTarget as HTMLElement
    d.left = Math.max(0, e.clientX - rect.left - d.ox)
    d.top = Math.max(0, e.clientY - rect.top - d.oy)
    el.style.left = `${d.left}px`
    el.style.top = `${d.top}px`
  }

  function onUp(e: React.PointerEvent) {
    const d = drag.current
    drag.current = null
    setGrab(null)
    hapticTick()
    if (!d || !wide) return
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const x = rect.width ? d.left / rect.width : 0.5
    const y = rect.height ? d.top / rect.height : 0.5
    onChange(pieces.map((p) => (p.id === d.id ? { ...p, x, y, off: false } : p)))
    const el = e.currentTarget as HTMLElement
    el.style.left = ''
    el.style.top = ''
  }

  const tray = pieces.filter((p) => p.off)
  const on = pieces.filter((p) => !p.off)

  return (
    <div className="board-stage" ref={stageRef}>
      <div className="board-hud" aria-hidden>
        <svg viewBox="0 0 400 400">
          <g className="ring-spin">
            <circle cx="200" cy="200" r="168" />
            {Array.from({ length: 36 }, (_, i) => {
              const a = (i / 36) * Math.PI * 2
              const inner = i % 3 === 0 ? 156 : 162
              return (
                <line
                  key={i}
                  x1={200 + Math.cos(a) * inner}
                  y1={200 + Math.sin(a) * inner}
                  x2={200 + Math.cos(a) * 174}
                  y2={200 + Math.sin(a) * 174}
                />
              )
            })}
          </g>
          <circle cx="200" cy="200" r="128" />
          <circle cx="200" cy="200" r="86" />
          <circle className="board-hud-core" cx="200" cy="200" r="34" />
        </svg>
      </div>
      {tray.length ? (
        <ul className="board-tray" aria-label="Ablage">
          {tray.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onChange(pieces.map((row) => (row.id === p.id ? { ...row, off: false } : row)))}>
                {pieceLabel(p.id)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {on.map((p) => (
        <article
          key={p.id}
          className={`board-piece${focus === p.id ? ' is-focus' : ''}${grab === p.id ? ' is-grab is-drag' : ''}${touch === p.id ? ' is-touch' : ''}`}
          data-piece={p.id}
          style={
            wide
              ? {
                  left: `min(${p.x * 100}%, calc(100% - 268px))`,
                  top: `min(${p.y * 100}%, calc(100% - 88px))`,
                }
              : undefined
          }
          onPointerDown={(e) => onDown(e, p.id)}
          onPointerMove={onMove}
          onPointerUp={onUp}
        >
          <h3>{pieceLabel(p.id)}</h3>
          {body(p.id)}
        </article>
      ))}
      {fling.map((g, i) => (
        <article
          key={`${g.id}-fling`}
          className="board-piece is-fling"
          style={{ left: `${g.x * 100}%`, top: `${g.y * 100}%`, animationDelay: `${i * 140}ms` }}
        >
          <h3>{pieceLabel(g.id)}</h3>
        </article>
      ))}
    </div>
  )
}
