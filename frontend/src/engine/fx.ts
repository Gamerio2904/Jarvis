import { parseFxIntent } from './fx-parse'
import { getJson } from './http-json'
import type { ToolMeta } from './tools'

export { parseFxIntent } from './fx-parse'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/2.28.1 (local.jarvis.app)' }

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'fx', action, label }
}

export async function handleFx(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseFxIntent(text)
  if (!intent) return { handled: false }
  try {
    const url = `https://api.frankfurter.app/latest?from=${intent.from}&to=${intent.to}`
    const { status, json } = await getJson(url, UA)
    const rates = json?.rates && typeof json.rates === 'object' ? (json.rates as Record<string, number>) : {}
    const rate = Number(rates[intent.to])
    const date = String(json.date || '').trim()
    if (status < 200 || status >= 300 || !Number.isFinite(rate)) {
      return {
        handled: true,
        reply: 'Den EZB-Kurs habe ich gerade nicht. Ich schätze keinen Wechselkurs.',
        tool: tool('error', 'Kurs fehlt'),
        lastTool: 'fx',
      }
    }
    const when = date ? ` Stand ${fmt(date)}.` : ''
    return {
      handled: true,
      reply: `Ein ${name(intent.from)} sind ${fmtNum(rate)} ${name(intent.to)}.${when} Quelle: EZB über Frankfurter.app.`,
      tool: tool('rate', intent.label),
      lastTool: 'fx',
    }
  } catch {
    return {
      handled: true,
      reply: 'Den EZB-Kurs habe ich gerade nicht. Ich schätze keinen Wechselkurs.',
      tool: tool('error', 'Kurs fehlt'),
      lastTool: 'fx',
    }
  }
}

function name(code: string): string {
  const map: Record<string, string> = {
    USD: 'US-Dollar',
    EUR: 'Euro',
    GBP: 'Pfund',
    CHF: 'Franken',
    JPY: 'Yen',
    CNY: 'Yuan',
    PLN: 'Złoty',
    SEK: 'schwedische Kronen',
  }
  return map[code] || code
}

function fmtNum(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: n >= 10 ? 2 : 4 })
}

function fmt(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}
