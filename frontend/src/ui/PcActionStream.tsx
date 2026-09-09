import { useEffect, useState } from 'react'
import { AGENT_META } from '../engine/agents/meta.ts'
import { getTurnTraces } from '../engine/agents/trace-store.ts'
import { departmentLabel } from '../engine/agent-map.ts'
import { getPcEvents, type PcEvent } from '../engine/pc-events.ts'

function labelFor(ev: PcEvent): string {
  const meta = AGENT_META[ev.agentId]
  const who = meta ? `${meta.label} · ${departmentLabel(meta.department)}` : ev.agentId
  return `${who} · ${ev.action}`
}

function fromTraces(): PcEvent[] {
  return getTurnTraces()
    .filter((t) => t.phase === 'execute' || t.phase === 'plan')
    .slice(-5)
    .reverse()
    .map((t) => ({
      at: Date.now(),
      phase: t.phase === 'execute' ? ('execute' as const) : ('verify' as const),
      agentId: t.agentId,
      action: t.agentId,
      detail: t.detail || t.agentId,
    }))
}

export function PcActionStream() {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 900)
    return () => window.clearInterval(id)
  }, [])

  const pc = getPcEvents().slice(0, 5)
  const traces = fromTraces()
  const merged = [...pc, ...traces.filter((t) => !pc.some((p) => p.action === t.action && p.at === t.at))].slice(0, 5)

  if (!merged.length) {
    return (
      <div className="pc-action-stream is-empty">
        <h4>PC-Aktionen</h4>
        <p>Pairing aktiv — Sprache oder Chat startet hier den Stream.</p>
      </div>
    )
  }

  return (
    <div className="pc-action-stream" aria-live="polite">
      <h4>PC-Aktionen</h4>
      <ul>
        {merged.map((ev, i) => (
          <li key={`${ev.at}-${ev.action}-${i}`} className={`pc-action-row is-${ev.phase}`}>
            <span className="pc-action-phase">{ev.phase}</span>
            <div className="pc-action-copy">
              <strong>{labelFor(ev)}</strong>
              <span>{ev.detail}</span>
              {typeof ev.pct === 'number' ? <em>{ev.pct} %</em> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
