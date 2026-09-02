/** Single ingress for chat turns. Prevents double submit without blocking a background debug run. */

export type TurnSource = 'user' | 'voice' | 'debug' | 'drive' | 'lage'

export type TurnTicket =
  | { ok: true; requestId: string }
  | { ok: false; requestId: string; reason: 'busy' | 'duplicate' }

const DEDUPE_MS = 1400

let uiHeld = false
let holdToken = ''
const convHeld = new Set<string>()
let lastKey = ''
let lastAt = 0
let seq = 0

export function newRequestId(source: TurnSource): string {
  seq += 1
  return `${source}-${Date.now().toString(36)}-${seq.toString(36)}`
}

export function beginTurn(opts: {
  source: TurnSource
  content: string
  conversationId?: string
  requestId?: string
  preempt?: boolean
}): TurnTicket {
  const requestId = opts.requestId || newRequestId(opts.source)
  const key = `${opts.source}:${opts.content.trim()}`
  const now = Date.now()
  if (opts.preempt && opts.source === 'voice') {
    uiHeld = false
    holdToken = ''
    const conv = opts.conversationId || ''
    if (conv) convHeld.delete(conv)
  }
  if (key && lastKey === key && now - lastAt < DEDUPE_MS) {
    return { ok: false, requestId, reason: 'duplicate' }
  }
  const conv = opts.conversationId || ''
  if (opts.source === 'debug') {
    if (conv && convHeld.has(conv)) return { ok: false, requestId, reason: 'busy' }
    if (conv) convHeld.add(conv)
    lastKey = key
    lastAt = now
    return { ok: true, requestId }
  }
  if (uiHeld) return { ok: false, requestId, reason: 'busy' }
  if (conv && convHeld.has(conv)) return { ok: false, requestId, reason: 'busy' }
  uiHeld = true
  holdToken = requestId
  if (conv) convHeld.add(conv)
  lastKey = key
  lastAt = now
  return { ok: true, requestId }
}

export function endTurn(opts?: { source?: TurnSource; conversationId?: string; requestId?: string }): void {
  const conv = opts?.conversationId || ''
  if (opts?.source === 'debug') {
    if (conv) convHeld.delete(conv)
    return
  }
  if (opts?.requestId && holdToken && opts.requestId !== holdToken) return
  uiHeld = false
  holdToken = ''
  if (conv) convHeld.delete(conv)
}

export function isTurnHeld(): boolean {
  return uiHeld
}
