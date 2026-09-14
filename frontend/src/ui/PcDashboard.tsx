import { useState } from 'react'
import { readRtcLive } from '../api.ts'
import { pcDashboardEnabled } from '../engine/pc-events.ts'
import { prefersReducedMotion } from '../engine/motion.ts'
import { loadSettings } from '../engine/store.ts'
import { AgentMapCanvas } from './lage/AgentMapCanvas.tsx'
import { AgentStatusBar } from './lage/AgentStatusBar.tsx'
import { PcActionStream } from './PcActionStream.tsx'

export function PcDashboard({ busy }: { busy?: boolean }) {
  const s = loadSettings()
  const [dept, setDept] = useState('werkstatt')
  if (!pcDashboardEnabled(s)) return null
  const face = s.face === 'friday' ? 'FRIDAY' : 'JARVIS'
  const live = readRtcLive()

  return (
    <section className="pc-dashboard" aria-label="PC-Dashboard">
      <header className="pc-dashboard-head">
        <span className="pc-dashboard-brand">{face}</span>
        <span className="lage-sep">&gt;</span>
        <span>PC · {live ? 'Live' : 'Bereit'}</span>
        <span className="lage-spacer" />
        <span className="pc-dashboard-host">{s.pc_host}</span>
      </header>
      <div className="pc-dashboard-split">
        <div className="pc-dashboard-map">
          <AgentStatusBar busy={busy} />
          <AgentMapCanvas reduced={prefersReducedMotion()} selectedDept={dept} onSelectDept={setDept} />
        </div>
        <PcActionStream />
      </div>
    </section>
  )
}
