import { useState } from 'react'
import { readRtcLive } from '../api'
import { pcDashboardEnabled } from '../engine/pc-events'
import { prefersReducedMotion } from '../engine/motion'
import { loadSettings } from '../engine/store'
import { AgentMapCanvas } from './lage/AgentMapCanvas'
import { AgentStatusBar } from './lage/AgentStatusBar'
import { PcActionStream } from './PcActionStream'

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
