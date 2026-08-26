import { getText } from './http-json.ts'
import { loadSettings } from './store.ts'
import type { ToolMeta } from './tools.ts'
import { normalizeUtterance } from './utterance.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/3.18.1 (local.jarvis.app)' }

export function parseFlightsIntent(text: string): boolean {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 140) return false
  return /\b(was\s+fliegt\s+da|flugzeuge?\s+über(?:m)?\s+(?:uns|dem\s+haus)|opensky|überflug)\b/i.test(t)
}

export async function handleFlights(): Promise<{
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}> {
  const lat = Number(loadSettings().last_lat)
  const lon = Number(loadSettings().last_lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      handled: true,
      reply: 'Dafür brauche ich den Standort. „Wo bin ich“ zuerst. Passagiere nenne ich nicht.',
      tool: { tool_status: 'executed', tool: 'flights', action: 'locate', label: 'Flug' },
      lastTool: 'flights',
    }
  }
  const box = 0.35
  const url = `https://opensky-network.org/api/states/all?lamin=${lat - box}&lomin=${lon - box}&lamax=${lat + box}&lomax=${lon + box}`
  try {
    const { status, text } = await getText(url, UA)
    if (status < 200 || status >= 300 || !text) {
      return empty()
    }
    const data = JSON.parse(text) as { states?: unknown[] }
    const states = Array.isArray(data.states) ? data.states : []
    if (!states.length) {
      return {
        handled: true,
        reply: 'OpenSky sieht in dem Ausschnitt gerade kein Flugzeug. Ich erfinde keines.',
        tool: { tool_status: 'executed', tool: 'flights', action: 'empty', label: 'Kein Flug' },
        lastTool: 'flights',
      }
    }
    const row = states[0] as unknown[]
    const call = String(row[1] || '').trim() || 'ohne Rufzeichen'
    const alt = Number(row[7])
    const altLine = Number.isFinite(alt) ? `, etwa ${Math.round(alt)} Meter` : ''
    return {
      handled: true,
      reply: `OpenSky: ${call}${altLine}. Keine Passagiere, kein Ziel erfunden.`,
      tool: { tool_status: 'executed', tool: 'flights', action: 'list', label: 'Flug' },
      lastTool: 'flights',
    }
  } catch {
    return empty()
  }
}

function empty() {
  return {
    handled: true,
    reply: 'OpenSky ist gerade nicht da. Ich rate nicht, wer da fliegt.',
    tool: { tool_status: 'error', tool: 'flights', action: 'fetch', label: 'Flug fehlt' } as ToolMeta,
    lastTool: 'flights',
  }
}
