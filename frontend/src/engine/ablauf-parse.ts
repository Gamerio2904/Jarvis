import { normalizeUtterance } from './utterance.ts'
import { loadSettings } from './store.ts'
import { ablaufWaiting } from './ablauf-state.ts'

export type AblaufIntent =
  | { kind: 'open'; work?: string }
  | { kind: 'close' }
  | { kind: 'accept' }
  | { kind: 'revise'; via: 'name' | 'rest' | 'plan'; name: string; text: string }

const END = String.raw`\s*[.!?]?$`

function otherWish(): boolean {
  const s = loadSettings()
  return Boolean(
    s.proposal_pending ||
      s.last_clip_json ||
      s.last_comm_json ||
      s.last_pc_json ||
      s.last_taxi_json ||
      s.last_interrupt_json ||
      s.bot_ask_json,
  )
}

/** Parser für den Ablauf. `So` und `Ja` nur, solange eine Zeile wartet. */
export function parseAblaufIntent(text: string): AblaufIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t) return null

  const named = new RegExp(String.raw`^\s*plan(?:e)?\s+das\s*:\s*([\s\S]+)$`, 'i').exec(t)
  if (named) {
    const work = named[1].trim().slice(0, 2000)
    return work ? { kind: 'open', work } : { kind: 'open' }
  }
  if (new RegExp(String.raw`^\s*plan(?:e)?\s+das${END}`, 'i').test(t)) return { kind: 'open' }

  if (new RegExp(String.raw`^\s*(?:plan|fenster)\s+zu${END}`, 'i').test(t)) return { kind: 'close' }

  const change = new RegExp(String.raw`^\s*änder(?:e)?\s+(?:den|die|das)?\s*(.+?)\s*:\s*(.+)$`, 'i').exec(t)
  if (change) return { kind: 'revise', via: 'name', name: change[1].trim(), text: change[2].trim() }

  const rest = new RegExp(String.raw`^\s*(.+?)\s*,\s*rest\s+so${END}`, 'i').exec(t)
  if (rest) return { kind: 'revise', via: 'rest', name: rest[1].trim(), text: rest[1].trim() }

  const over = new RegExp(String.raw`^\s*(?:überarbeite|ueberarbeite)\s+den\s+plan\s*:\s*(.+)$`, 'i').exec(t)
  if (over) return { kind: 'revise', via: 'plan', name: '', text: over[1].trim() }

  if (new RegExp(String.raw`^\s*übernehmen${END}`, 'i').test(t)) return { kind: 'accept' }

  if (ablaufWaiting()) {
    if (new RegExp(String.raw`^\s*so${END}`, 'i').test(t)) return { kind: 'accept' }
    if (new RegExp(String.raw`^\s*ja${END}`, 'i').test(t) && !otherWish()) return { kind: 'accept' }
    return null
  }
  if (planScriptOpen() && new RegExp(String.raw`^\s*(?:so|go|umsetzen|leg\s+los)${END}`, 'i').test(t)) {
    return { kind: 'accept' }
  }
  return null
}

function planScriptOpen(): boolean {
  const phase = loadSettings().plan_phase
  return phase === 'live' || phase === 'go'
}
