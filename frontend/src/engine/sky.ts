import { getJson } from './http-json.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/3.18.1 (local.jarvis.app)' }

export type SkyIntent = { kind: 'iss' | 'moon' }

export function parseSkyIntent(text: string): SkyIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 140) return null
  if (/\b(iss|internationale\s+raumstation)\b/i.test(t)) return { kind: 'iss' }
  if (/\b(mondphase|mond\s+heute|vollmond|neumond|wie\s+ist\s+der\s+mond)\b/i.test(t)) return { kind: 'moon' }
  return null
}

export async function handleSky(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseSkyIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'moon') {
    return {
      handled: true,
      reply: moonLine(new Date()),
      tool: { tool_status: 'executed', tool: 'sky', action: 'moon', label: 'Mond' },
      lastTool: 'sky',
    }
  }
  const iss = await loadIss()
  if (!iss) {
    return {
      handled: true,
      reply: 'Die ISS-Position ist gerade nicht da. Ich rate nicht.',
      tool: { tool_status: 'error', tool: 'sky', action: 'iss', label: 'ISS fehlt' },
      lastTool: 'sky',
    }
  }
  return {
    handled: true,
    reply: `Die ISS steht bei ${iss.lat.toFixed(1)}° Nord, ${iss.lon.toFixed(1)}° Ost. Where The ISS At, kein Überflug erfunden.`,
    tool: { tool_status: 'executed', tool: 'sky', action: 'iss', label: 'ISS' },
    lastTool: 'sky',
  }
}

async function loadIss(): Promise<{ lat: number; lon: number } | null> {
  try {
    const { status, json } = await getJson('https://api.wheretheiss.at/v1/satellites/25544', UA)
    if (status < 200 || status >= 300) return null
    const lat = Number(json.latitude)
    const lon = Number(json.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    return { lat, lon }
  } catch {
    return null
  }
}

function moonLine(now: Date): string {
  const synodic = 29.53058867
  const known = Date.UTC(2000, 0, 6, 18, 14, 0)
  const age = ((now.getTime() - known) / 86400000) % synodic
  const a = age < 0 ? age + synodic : age
  let name = 'zunehmender Mond'
  if (a < 1.85) name = 'Neumond'
  else if (a < 5.5) name = 'zunehmende Sichel'
  else if (a < 9.1) name = 'zunehmender Halbmond'
  else if (a < 12.8) name = 'zunehmender Mond'
  else if (a < 16.6) name = 'Vollmond'
  else if (a < 20.3) name = 'abnehmender Mond'
  else if (a < 23.9) name = 'abnehmender Halbmond'
  else if (a < 27.7) name = 'abnehmende Sichel'
  else name = 'Neumond'
  return `Mondphase lokal gerechnet: ${name}. Kein Horoskop.`
}
