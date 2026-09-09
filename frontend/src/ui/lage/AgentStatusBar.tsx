import { useEffect, useState } from 'react'
import { activeAgentId, activeTracePath, departmentLabel } from '../../engine/agent-map.ts'
import { AGENT_META } from '../../engine/agents/meta.ts'
import { getBrainSlots, getTurnTraces } from '../../engine/agents/trace-store.ts'

function statusLine(busy: boolean): { main: string; path: string } {
  const agentId = activeAgentId()
  const meta = agentId ? AGENT_META[agentId] : undefined
  const traces = getTurnTraces()
  const last = traces[traces.length - 1]
  const brain = getBrainSlots().at(-1)
  const path = activeTracePath()

  if (busy && !last && !brain) return { main: 'Jarvis denkt…', path: '' }
  if (last?.agentId === 'curator') return { main: 'Curator · Gedächtnis-Gate', path: path.join(' → ') }
  if (last?.agentId === 'router') return { main: 'Router · Agent wählen', path: path.join(' → ') }
  if (last?.phase === 'execute' && agentId && meta) {
    return {
      main: `${meta.label} · ${departmentLabel(meta.department)}`,
      path: path.join(' → '),
    }
  }
  if (brain?.ok) return { main: `Hirn · ${brain.slot} (${brain.model})`, path: path.join(' → ') }
  if (agentId && meta) {
    return { main: `${meta.label} · zuletzt aktiv`, path: path.join(' → ') }
  }
  return { main: 'Haus-Gehirn · bereit', path: '' }
}

export function AgentStatusBar({ busy }: { busy?: boolean }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const ms = busy ? 350 : 1800
    const id = window.setInterval(() => tick((n) => n + 1), ms)
    return () => window.clearInterval(id)
  }, [busy])

  const { main, path } = statusLine(Boolean(busy))
  const live = busy || Boolean(activeAgentId()) || getTurnTraces().length > 0

  return (
    <div className="agent-status-bar" aria-live="polite">
      <span className={`agent-status-dot${live ? ' is-live' : ''}`} />
      <div className="agent-status-copy">
        <strong>{main}</strong>
        {path ? <span>{path}</span> : null}
      </div>
    </div>
  )
}
