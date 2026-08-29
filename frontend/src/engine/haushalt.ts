import { normalizeUtterance } from './utterance.ts'
import type { ToolMeta } from './tools.ts'

const SYMBOLS: Array<{ re: RegExp; line: string }> = [
  { re: /\b30\s*°?\s*(?:c|grad)?\b|\bwäsche\s*30/i, line: 'Waschschüssel 30: schonend bei 30 Grad, laut ISO 3758.' },
  { re: /\b40\s*°?\s*(?:c|grad)?\b|\bwäsche\s*40/i, line: 'Waschschüssel 40: Normalwäsche bei 40 Grad, laut ISO 3758.' },
  { re: /\b60\s*°?\s*(?:c|grad)?\b|\bwäsche\s*60/i, line: 'Waschschüssel 60: kochfest bis 60 Grad, laut ISO 3758.' },
  { re: /\b95\s*°?\s*(?:c|grad)?\b|\bkochen\b/i, line: 'Waschschüssel 95: Kochwäsche, laut ISO 3758.' },
  { re: /\bhandwäsche|hand\s+wäsche/i, line: 'Hand im Becken: Handwäsche, laut ISO 3758.' },
  { re: /\bnicht\s+waschen|durchgestrichenes\s+becken/i, line: 'Durchgestrichenes Becken: nicht waschen.' },
  { re: /\bbügeln|eisen/i, line: 'Bügeleisen: Punkte = Temperatur. Durchgestrichen = nicht bügeln. ISO 3758.' },
  { re: /\btrockner|trommel/i, line: 'Kreis im Quadrat: Trockner. Punkte = Stufe. Durchgestrichen = nicht in den Trockner.' },
  { re: /\bbleiche|dreieck/i, line: 'Dreieck: Bleichen erlaubt. Durchgestrichen: nicht bleichen.' },
  { re: /\bfleck\s+(?:rotwein|wein|öl|fett|blut|kaffee|gras)/i, line: 'Fleck: erst Etikett, dann kalt vobehandeln. Ein Hausmittel ohne Quelle erfinde ich nicht.' },
]

export function parseHaushaltIntent(text: string): boolean {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 160) return false
  return (
    /\b(waschschüssel|wäschezeichen|pflegesymbol|was\s+bedeutet\s+das\s+(?:zeichen|symbol)|nicht\s+bügeln|fleck\s+)/i.test(
      t,
    ) || SYMBOLS.some((s) => s.re.test(t) && /\b(wäsche|waschen|bügeln|trockner|symbol|zeichen|fleck)\b/i.test(t))
  )
}

export async function handleHaushalt(
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  if (!parseHaushaltIntent(text)) return { handled: false }
  const hit = SYMBOLS.find((s) => s.re.test(text))
  const line = hit
    ? hit.line
    : 'Pflegesymbole folgen ISO 3758. Ohne klares Zeichen sage ich das Etikett, kein Hausrezept aus dem Nichts.'
  return {
    handled: true,
    reply: line,
    tool: { tool_status: 'executed', tool: 'haushalt', action: 'symbol', label: 'Haushalt' },
    lastTool: 'haushalt',
  }
}
