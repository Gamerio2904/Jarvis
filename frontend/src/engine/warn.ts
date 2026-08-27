import { getJson } from './http-json.ts'
import { loadSettings, saveSettings } from './store.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/3.19.0 (local.jarvis.app)' }
const WARN_URL = 'https://www.dwd.de/DWD/warnungen/opendata/Warnungen_Gemeinden_V2.json'

export type WarnIntent = { kind: 'ask'; place?: string }

export function parseWarnIntent(text: string): WarnIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 140) return null
  if (!/\b(unwetter|dwd|unwetterwarnung|wetterwarnung|warnung\s+(?:vor\s+)?(?:sturm|gewitter|hochwasser))\b/i.test(t)) {
    return null
  }
  if (/\b(wecker|timer|steckdose|fernseh)\b/i.test(t)) return null
  const place = /(?:in|für|aus|bei)\s+([A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß.\-\s]{1,32})/i.exec(t)
  return { kind: 'ask', place: place?.[1]?.replace(/[?.!]+$/, '').trim() }
}

export async function handleWarn(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseWarnIntent(text)
  if (!intent) return { handled: false }
  const rows = await loadWarnings()
  if (!rows.length) {
    return {
      handled: true,
      reply: 'Die DWD-Warnungen sind gerade nicht da. Eine Lage würde ich nicht raten.',
      tool: { tool_status: 'error', tool: 'warn', action: 'fetch', label: 'Warnung fehlt' },
      lastTool: 'warn',
    }
  }
  const needle = (intent.place || loadSettings().last_place || '').toLowerCase()
  const hits = needle
    ? rows.filter((w) => w.region.toLowerCase().includes(needle) || needle.includes(w.region.toLowerCase().slice(0, 8)))
    : rows
  const use = (hits.length ? hits : rows).slice(0, 3)
  if (!use.length) {
    return {
      handled: true,
      reply: needle
        ? `Für ${intent.place || needle} steht in der DWD-Liste gerade keine Warnung.`
        : 'In der DWD-Liste steht gerade keine Warnung.',
      tool: { tool_status: 'executed', tool: 'warn', action: 'empty', label: 'Keine Warnung' },
      lastTool: 'warn',
    }
  }
  const line = use.map((w) => `${w.headline}${w.region ? ` (${w.region})` : ''}`).join(' ')
  saveSettings({ last_warn_line: `DWD: ${line}`.slice(0, 220) })
  return {
    handled: true,
    reply: `DWD: ${line}`,
    tool: { tool_status: 'executed', tool: 'warn', action: 'list', label: 'Unwetter' },
    lastTool: 'warn',
  }
}

type WarnRow = { headline: string; region: string }

async function loadWarnings(): Promise<WarnRow[]> {
  try {
    const { status, json } = await getJson(WARN_URL, UA)
    if (status < 200 || status >= 300) return []
    const out: WarnRow[] = []
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) {
        for (const n of node) walk(n)
        return
      }
      const o = node as Record<string, unknown>
      const head = String(o.headline || o.event || o.info || '').trim()
      const region = String(o.regionName || o.name || o.area || '').trim()
      if (head) out.push({ headline: head.slice(0, 160), region: region.slice(0, 80) })
      for (const v of Object.values(o)) {
        if (v && typeof v === 'object') walk(v)
      }
    }
    walk(json)
    return out.slice(0, 40)
  } catch {
    return []
  }
}
