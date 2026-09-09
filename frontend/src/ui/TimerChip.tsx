import { useEffect, useState } from 'react'
import { openTimers } from '../engine/timers.ts'
import { timerListLabel } from '../engine/timer-announce.ts'
import type { Reminder } from '../engine/store.ts'

function left(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'gleich'
  if (ms < 90_000) return `${Math.max(1, Math.round(ms / 1000))} s`
  return `${Math.max(1, Math.round(ms / 60_000))} min`
}

export function TimerChip() {
  const [rows, setRows] = useState<Reminder[]>([])
  useEffect(() => {
    let live = true
    async function tick() {
      const next = await openTimers()
      if (live) setRows(next)
    }
    void tick()
    const id = window.setInterval(() => void tick(), 1000)
    return () => {
      live = false
      window.clearInterval(id)
    }
  }, [])
  if (!rows.length) return null
  return (
    <div className="timer-chip" role="status">
      {rows.slice(0, 2).map((r) => (
        <span key={r.id}>
          Timer {timerListLabel(r.title)} · {left(r.due_at)}
        </span>
      ))}
    </div>
  )
}
