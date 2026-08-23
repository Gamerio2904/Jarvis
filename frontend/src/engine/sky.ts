import { moonLine, parseSkyIntent } from './sky-parse'
import { resolveFix } from './here-fix'
import { getJson } from './http-json'
import type { ToolMeta } from './tools'

export { parseSkyIntent } from './sky-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.28.0 (local.jarvis.app)' }

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'sky', action, label }
}

export async function handleSky(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseSkyIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'moon') {
    return {
      handled: true,
      reply: moonLine(),
      tool: tool('moon', 'Mond'),
      lastTool: 'sky',
    }
  }
  const pos = await issNow()
  if (!pos) {
    return {
      handled: true,
      reply: 'Die ISS-Position ist gerade nicht da. Ich schätze den Überflug nicht.',
      tool: tool('error', 'ISS fehlt'),
      lastTool: 'sky',
    }
  }
  const here = await resolveFix()
  let pass = ''
  if (here.ok) {
    const next = await issPass(here.lat, here.lon)
    if (next) pass = ` ${next}`
    else pass = ' Eine freie Überflug-Zeit habe ich dazu nicht.'
  } else {
    pass = ' Für die nächste Sichtbarkeit brauche ich den Standort.'
  }
  return {
    handled: true,
    reply: `Die ISS steht jetzt bei ${pos.lat.toFixed(1)}° / ${pos.lon.toFixed(1)}°.${pass} Quelle: Open Notify / Where The ISS At.`,
    tool: tool('iss', 'ISS'),
    lastTool: 'sky',
  }
}

async function issNow(): Promise<{ lat: number; lon: number } | null> {
  try {
    const { status, json } = await getJson('https://api.wheretheiss.at/v1/satellites/25544', UA)
    const lat = Number(json.latitude)
    const lon = Number(json.longitude)
    if (status >= 200 && status < 300 && Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon }
  } catch {
    /* Fallback */
  }
  try {
    const { status, json } = await getJson('http://api.open-notify.org/iss-now.json', UA)
    const pos = json.iss_position && typeof json.iss_position === 'object' ? (json.iss_position as Record<string, unknown>) : {}
    const lat = Number(pos.latitude)
    const lon = Number(pos.longitude)
    if (status >= 200 && status < 300 && Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon }
  } catch {
    return null
  }
  return null
}

async function issPass(lat: number, lon: number): Promise<string | null> {
  try {
    const { status, json } = await getJson(
      `https://sat.terrestre.ar/passes/25544?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}&limit=1`,
      UA,
    )
    const rows = Array.isArray(json) ? json : Array.isArray((json as { passes?: unknown }).passes) ? (json as { passes: unknown[] }).passes : []
    const first = rows[0] && typeof rows[0] === 'object' ? (rows[0] as Record<string, unknown>) : null
    if (status < 200 || status >= 300 || !first) return null
    const rise = first.rise || first.start || first.aos
    const when = typeof rise === 'number' ? new Date(rise * (rise < 1e12 ? 1000 : 1)) : rise ? new Date(String(rise)) : null
    if (!when || Number.isNaN(when.getTime())) return null
    const clock = when.toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    return `Nächster berechneter Überflug: ${clock}.`
  } catch {
    return null
  }
}
