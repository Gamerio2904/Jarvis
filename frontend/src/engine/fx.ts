import { getJson } from './http-json.ts'
import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'
import { saveSettings } from './store.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/3.19.0 (local.jarvis.app)' }

const NAMES: Record<string, string> = {
  dollar: 'USD',
  usd: 'USD',
  'us-dollar': 'USD',
  euro: 'EUR',
  eur: 'EUR',
  pfund: 'GBP',
  gbp: 'GBP',
  franken: 'CHF',
  chf: 'CHF',
  yen: 'JPY',
  jpy: 'JPY',
  zloty: 'PLN',
  pln: 'PLN',
}

export type FxIntent = { from: string; to: string }

export function parseFxIntent(text: string): FxIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 140) return null
  if (!/\b(dollar|euro|wechselkurs|kurs|pfund|franken|yen|zloty|usd|eur|gbp|chf)\b/i.test(t)) return null
  if (/\b(banking|überweis|ueberweis|iban|online[- ]?banking)\b/i.test(t)) return null
  if (/\b(wetter|tanke|e10|nachrichten|bundesliga)\b/i.test(t)) return null
  if (/\b(fällt|steigt|ausblick|prognose|teurer|billiger|wird)\b/i.test(t)) return null
  if (!/\b(was\s+ist|kurs|wechsel|wie\s+viel(?:e)?\s+(?:ist|sind)|euro|dollar)\b/i.test(t)) return null
  const from = codeOf(t, 'USD')
  const to = /\beuro|eur\b/i.test(t) && from !== 'EUR' ? 'EUR' : from === 'EUR' ? 'USD' : 'EUR'
  return { from, to }
}

export async function handleFx(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseFxIntent(text)
  if (!intent) return { handled: false }
  try {
    const url = `https://api.frankfurter.app/latest?from=${intent.from}&to=${intent.to}`
    const { status, json } = await getJson(url, UA)
    const rates = json.rates && typeof json.rates === 'object' ? (json.rates as Record<string, unknown>) : {}
    const rate = Number(rates[intent.to])
    if (status < 200 || status >= 300 || !Number.isFinite(rate)) {
      return {
        handled: true,
        reply: 'Den Kurs liefert Frankfurter.app gerade nicht. Ich rate nicht.',
        tool: { tool_status: 'error', tool: 'fx', action: 'fetch', label: 'Kurs fehlt' },
        lastTool: 'fx',
      }
    }
    const date = String(json.date || '').trim()
    const reply = `Ein ${intent.from} sind ${rate.toFixed(4)} ${intent.to}${date ? `, Stand ${date}` : ''}. EZB über Frankfurter.app.`
    saveSettings({ last_fx_line: reply.slice(0, 220) })
    return {
      handled: true,
      reply,
      tool: { tool_status: 'executed', tool: 'fx', action: 'rate', label: 'Kurs' },
      lastTool: 'fx',
    }
  } catch {
    return {
      handled: true,
      reply: 'Den Kurs liefert Frankfurter.app gerade nicht. Ich rate nicht.',
      tool: { tool_status: 'error', tool: 'fx', action: 'fetch', label: 'Kurs fehlt' },
      lastTool: 'fx',
    }
  }
}

function codeOf(text: string, fallback: string): string {
  const t = text.toLowerCase()
  for (const [k, v] of Object.entries(NAMES)) {
    if (t.includes(k)) return v
  }
  return fallback
}
