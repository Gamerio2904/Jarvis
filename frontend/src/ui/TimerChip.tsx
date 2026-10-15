import { useEffect, useState } from 'react'
import { openTimers } from '../engine/timers.ts'
import { timerListLabel } from '../engine/timer-announce.ts'
import type { Reminder } from '../engine/store.ts'

type Tick = {
  id: string
  label: string
  left: string
  remain: string
  progress: number
  second: number
  minute: number
}

function clockOf(row: Reminder, now: number): Tick {
  const due = new Date(row.due_at).getTime()
  const start = new Date(row.created_at).getTime()
  const ms = Math.max(0, due - now)
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const left = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
  const span = Math.max(1, due - start)
  const progress = Math.min(1, Math.max(0, 1 - ms / span))
  const label = timerListLabel(row.title)
  return {
    id: row.id,
    label,
    left,
    remain: h > 0 ? `noch ${h} Stunden ${m} Minuten` : m > 0 ? `noch ${m} Minuten ${s} Sekunden` : `noch ${s} Sekunden`,
    progress,
    second: (ms / 1000) * 6,
    minute: (ms / 60_000) * 6,
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function TimerChip() {
  const [rows, setRows] = useState<Tick[]>([])
  const [more, setMore] = useState(0)
  useEffect(() => {
    let live = true
    async function tick() {
      const next = await openTimers()
      if (!live) return
      const now = Date.now()
      setRows(next.slice(0, 3).map((row) => clockOf(row, now)))
      setMore(Math.max(0, next.length - 3))
    }
    void tick()
    const id = window.setInterval(() => void tick(), 200)
    return () => {
      live = false
      window.clearInterval(id)
    }
  }, [])
  if (!rows.length) return null
  return (
    <div className="timer-rail" role="status" aria-live="polite">
      {rows.map((row) => (
        <div className="timer-bar" key={row.id}>
          <div className="timer-clock" aria-hidden>
            <div className="timer-clock-scene">
              <div
                className="timer-clock-face"
                style={{ ['--timer-p' as string]: `${Math.round(row.progress * 100)}%` }}
              >
                <span className="timer-hand timer-hand-m" style={{ transform: `rotate(${row.minute}deg)` }} />
                <span className="timer-hand timer-hand-s" style={{ transform: `rotate(${row.second}deg)` }} />
                <i className="timer-clock-cap" />
              </div>
            </div>
          </div>
          <div className="timer-bar-copy">
            <strong>{row.label}</strong>
            <span className="timer-progress" aria-hidden>
              <i style={{ width: `${Math.round(row.progress * 100)}%` }} />
            </span>
          </div>
          <time className="timer-bar-time" dateTime={row.left} aria-label={`${row.label}, ${row.remain}`}>
            {row.left}
          </time>
        </div>
      ))}
      {more > 0 ? <p className="timer-rail-more">und {more} weitere</p> : null}
    </div>
  )
}
