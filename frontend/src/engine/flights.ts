import { saveSettings } from './store.ts'
import type { ToolMeta } from './tools.ts'
import { normalizeUtterance } from './utterance.ts'
import { fetchOverhead, replyFor } from './globe-layers.ts'
import { patchForHudView } from './hud-parse.ts'
import { setLageSession } from './lage-session.ts'

export function parseFlightsIntent(text: string): boolean {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 140) return false
  return /\b(was\s+fliegt\s+(?:da\s+)?über(?:m)?\s+(?:uns|deutschland|dem\s+haus)|was\s+ist\s+über(?:m)?\s+(?:uns|deutschland)|flugzeuge?\s+über(?:m)?\s+(?:uns|dem\s+haus)|opensky|überflug)\b/i.test(
    t,
  )
}

export async function handleFlights(): Promise<{
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}> {
  const got = await fetchOverhead()
  const patch = patchForHudView('globe')
  saveSettings({ ...patch, globe_layer: 'overhead' })
  setLageSession(true)
  return {
    handled: true,
    reply: replyFor(got),
    tool: {
      tool_status: got.error ? 'error' : 'executed',
      tool: 'flights',
      action: got.pins.length ? 'list' : 'empty',
      label: 'Flug',
    },
    lastTool: 'flights',
  }
}
