export type LeaveIntent = { kind: 'leave'; query: string }

const LEAVE =
  /^\s*(?:wann\s+muss\s+ich\s+(?:zum|zur|zu|nach)\s+(.+?)\s+los|wann\s+los\s+(?:zum|zur|zu|nach)?\s*(.+)|losgehen\s+(?:zum|zur|zu)?\s*(.+))\s*[.?!]?\s*$/i

export function parseLeaveIntent(text: string): LeaveIntent | null {
  const m = LEAVE.exec(text.trim())
  if (!m) return null
  const query = (m[1] || m[2] || m[3] || '').replace(/[.!?]+$/g, '').trim()
  if (!query || query.length > 60) return null
  return { kind: 'leave', query }
}
