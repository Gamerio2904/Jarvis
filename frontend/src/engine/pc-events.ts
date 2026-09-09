import { loadSettings, type Settings } from './store.ts'

export type PcEventPhase = 'execute' | 'confirm' | 'verify' | 'done' | 'fail'

export type PcEvent = {
  at: number
  phase: PcEventPhase
  agentId: string
  action: string
  detail: string
  pct?: number
}

const MAX = 20
let events: PcEvent[] = []

export function pushPcEvent(e: Omit<PcEvent, 'at'>): void {
  events.unshift({ ...e, at: Date.now() })
  if (events.length > MAX) events.length = MAX
}

export function getPcEvents(): PcEvent[] {
  return events
}

export function clearPcEvents(): void {
  events = []
}

/** null = auto (desktop on); true = force on; false = force off */
export function pcDashboardEnabled(s: Settings = loadSettings()): boolean {
  if (!s.pc_enabled || !s.pc_host.trim()) return false
  if (s.pc_dashboard_v2 === false) return false
  if (s.pc_dashboard_v2 === true) return true
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches
}
