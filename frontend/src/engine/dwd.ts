import { parseDwdIntent } from './dwd-parse'
import { geocodePlace } from './geo-lookup'
import { resolveFix } from './here-fix'
import { getJson, getText } from './http-json'
import { loadSettings, persistLastList, saveSettings } from './store'
import type { ToolMeta } from './tools'

export { parseDwdIntent } from './dwd-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.28.1 (local.jarvis.app)' }
const WFS =
  'https://maps.dwd.de/geoserver/dwd/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=dwd:Warnungen_Gemeinden&outputFormat=application/json&srsName=EPSG:4326'

type Alert = { headline: string; event: string; area: string; source: string }

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'dwd', action, label }
}

export async function handleDwd(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseDwdIntent(text)
  if (!intent) return { handled: false }
  let lat = 0
  let lon = 0
  const here = await resolveFix()
  if (here.ok) {
    lat = here.lat
    lon = here.lon
  } else {
    const place = (loadSettings().last_place || '').trim()
    if (place) {
      const geo = await geocodePlace(place)
      if (geo.ok) {
        lat = geo.fix.lat
        lon = geo.fix.lon
      }
    }
  }
  if (!lat && !lon) {
    return {
      handled: true,
      reply: here.ok === false ? here.message : 'Ohne Ort keine DWD-Warnung. Standort oder Stadt sagen.',
      tool: tool('ask', 'Kein Ort'),
      lastTool: 'dwd',
    }
  }
  const alerts = await loadAlerts(lat, lon)
  persistLastList(
    'dwd',
    alerts.map((a) => a.headline),
  )
  saveSettings({ last_alert_json: JSON.stringify({ at: new Date().toISOString(), alerts: alerts.slice(0, 8) }) })
  if (!alerts.length) {
    return {
      handled: true,
      reply:
        'Keine aktuelle DWD-Warnung für diese Lage in der Warnkarte. Das heißt nicht, dass das Wetter freundlich ist — nur: keine amtliche Warnung geladen.',
      tool: tool('empty', 'Keine Warnung'),
      lastTool: 'dwd',
    }
  }
  const lines = alerts.slice(0, 3).map((a) => {
    const where = a.area ? ` (${a.area})` : ''
    return `${a.headline || a.event}${where}.`
  })
  return {
    handled: true,
    reply: `${lines.join(' ')} Quelle: DWD.`,
    tool: tool('warn', 'DWD'),
    lastTool: 'dwd',
  }
}

async function loadAlerts(lat: number, lon: number): Promise<Alert[]> {
  const pad = 0.35
  const bbox = `${lon - pad},${lat - pad},${lon + pad},${lat + pad},EPSG:4326`
  try {
    const { status, json } = await getJson(`${WFS}&bbox=${encodeURIComponent(bbox)}`, UA)
    if (status >= 200 && status < 300) {
      const feats = Array.isArray((json as { features?: unknown }).features)
        ? ((json as { features: Array<{ properties?: Record<string, unknown> }> }).features)
        : []
      const out = feats
        .map((f) => {
          const p = f.properties || {}
          return {
            headline: String(p.HEADLINE || p.headline || p.EVENT || p.event || '').trim(),
            event: String(p.EVENT || p.event || '').trim(),
            area: String(p.AREADESC || p.areaDesc || p.NAME || '').trim(),
            source: 'dwd-wfs',
          }
        })
        .filter((a) => a.headline || a.event)
      if (out.length) return out
    }
  } catch {
    /* Fallback */
  }
  return loadBrightSky(lat, lon)
}

async function loadBrightSky(lat: number, lon: number): Promise<Alert[]> {
  try {
    const { status, json } = await getJson(
      `https://api.brightsky.dev/alerts?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}`,
      UA,
    )
    if (status < 200 || status >= 300) return []
    const rows = Array.isArray((json as { alerts?: unknown }).alerts)
      ? ((json as { alerts: Array<Record<string, unknown>> }).alerts)
      : []
    return rows
      .map((p) => ({
        headline: String(p.headline || p.event || '').trim(),
        event: String(p.event || '').trim(),
        area: String(p.area_desc || p.regionName || '').trim(),
        source: 'dwd-cap',
      }))
      .filter((a) => a.headline || a.event)
  } catch {
    return loadWarnapp()
  }
}

async function loadWarnapp(): Promise<Alert[]> {
  try {
    const { status, text } = await getText(
      'https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json',
      { Accept: 'application/javascript', 'User-Agent': UA['User-Agent'] },
    )
    if (status < 200 || status >= 300 || !text) return []
    const m = /warnWetter\.loadWarnings\(([\s\S]+)\)\s*;?\s*$/.exec(text.trim())
    if (!m) return []
    const data = JSON.parse(m[1]) as { warnings?: Record<string, Array<Record<string, unknown>>> }
    const out: Alert[] = []
    const place = (loadSettings().last_place || '').toLowerCase()
    for (const rows of Object.values(data.warnings || {})) {
      if (!Array.isArray(rows)) continue
      for (const p of rows) {
        const area = String(p.regionName || p.region || '').trim()
        if (place && area && !area.toLowerCase().includes(place) && !place.includes(area.toLowerCase().slice(0, 5))) {
          continue
        }
        out.push({
          headline: String(p.headline || p.description || '').trim(),
          event: String(p.event || '').trim(),
          area,
          source: 'dwd-warnapp',
        })
      }
    }
    return out.slice(0, 8)
  } catch {
    return []
  }
}
