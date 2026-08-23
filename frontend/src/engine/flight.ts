import { parseFlightIntent } from './flight-parse'
import { resolveFix } from './here-fix'
import { getJson } from './http-json'
import { persistLastList } from './store'
import type { ToolMeta } from './tools'

export { parseFlightIntent } from './flight-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.28.0 (local.jarvis.app)' }

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'flight', action, label }
}

export async function handleFlight(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseFlightIntent(text)
  if (!intent) return { handled: false }
  const here = await resolveFix()
  if (!here.ok) {
    return { handled: true, reply: here.message, tool: tool('ask', 'Kein Ort'), lastTool: 'flight' }
  }
  const pad = 0.35
  const url = `https://opensky-network.org/api/states/all?lamin=${(here.lat - pad).toFixed(3)}&lomin=${(here.lon - pad).toFixed(3)}&lamax=${(here.lat + pad).toFixed(3)}&lomax=${(here.lon + pad).toFixed(3)}`
  try {
    const { status, json } = await getJson(url, UA)
    const states = Array.isArray((json as { states?: unknown }).states)
      ? ((json as { states: unknown[][] }).states)
      : []
    if (status < 200 || status >= 300) {
      return {
        handled: true,
        reply: 'OpenSky antwortet gerade nicht. Ich erfinde kein Flugzeug.',
        tool: tool('error', 'OpenSky fehlt'),
        lastTool: 'flight',
      }
    }
    const air = states
      .map((row) => ({
        call: String(row[1] || '').trim(),
        country: String(row[2] || '').trim(),
        lon: Number(row[5]),
        lat: Number(row[6]),
        alt: Number(row[7]),
        ground: Boolean(row[8]),
      }))
      .filter((r) => !r.ground && Number.isFinite(r.lat) && Number.isFinite(r.lon))
    persistLastList(
      'flight',
      air.map((a) => a.call || a.country),
    )
    if (!air.length) {
      return {
        handled: true,
        reply: 'OpenSky sieht gerade kein Flugzeug in etwa 40 km. Passagiere nenne ich nicht.',
        tool: tool('empty', 'Kein Flug'),
        lastTool: 'flight',
      }
    }
    const top = air.slice(0, 3)
    const lines = top.map((a) => {
      const call = a.call || 'ohne Rufzeichen'
      const alt = Number.isFinite(a.alt) ? ` in ${Math.round(a.alt)} m` : ''
      const land = a.country ? `, ${a.country}` : ''
      return `${call}${land}${alt}`
    })
    return {
      handled: true,
      reply: `Über der Lage: ${lines.join('; ')}. Quelle: OpenSky. Keine Personen.`,
      tool: tool('overhead', top[0].call || 'Flug'),
      lastTool: 'flight',
    }
  } catch {
    return {
      handled: true,
      reply: 'OpenSky ist nicht erreichbar. Ich rate den Flieger nicht.',
      tool: tool('error', 'OpenSky fehlt'),
      lastTool: 'flight',
    }
  }
}
