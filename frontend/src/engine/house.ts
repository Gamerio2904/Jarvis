import { parseHouseIntent } from './house-parse'
import type { ToolMeta } from './tools'

export { parseHouseIntent } from './house-parse'

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'house', action, label }
}

const WASH: Record<string, string> = {
  '30': 'Waschschüssel mit 30: Schonwäsche bis 30 °C.',
  '40': 'Waschschüssel mit 40: Normal- oder Buntwäsche bis 40 °C.',
  '60': 'Waschschüssel mit 60: kochfest bis 60 °C, oft Baumwolle.',
  '95': 'Waschschüssel mit 95: Kochwäsche.',
}

const STAINS: Record<string, string> = {
  wein: 'Rotweinfleck: sofort kalt ausspülen, dann Gallseife — kein heißes Wasser zuerst. Quelle: festes Haushaltwissen, kein Labor.',
  fett: 'Fettfleck: absorbieren (Küchenpapier), dann Spülmittel auf der Stelle, danach waschen. Hitze erst nach der Vorbehandlung.',
  gras: 'Grasfleck: Gallseife oder Einweichen, dann die Temperatur laut Pflegezeichen.',
  blut: 'Blutfleck: kalt ausspülen. Hitze setzt das Eiweiß.',
  kaffee: 'Kaffeefleck: kalt, dann Gallseife. Kein Salz-Mythos als Garantie.',
  fleck: 'Welcher Fleck — Wein, Fett, Gras, Blut, Kaffee? Ohne Art rate ich kein Mittel.',
}

export async function handleHouse(
  _conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseHouseIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'stain') {
    return {
      handled: true,
      reply: STAINS[intent.stain] || STAINS.fleck,
      tool: tool('stain', intent.stain),
      lastTool: 'house',
    }
  }
  if (intent.token && WASH[intent.token]) {
    return {
      handled: true,
      reply: `${WASH[intent.token]} Dreieck durchgestrichen: nicht bleichen. Bügeleisen: Punkte = Temperatur. Kreis im Quadrat: Trockner.`,
      tool: tool('wash', intent.token),
      lastTool: 'house',
    }
  }
  return {
    handled: true,
    reply:
      'Die Waschschüssel ist das Waschsymbol. Zahl = Höchsttemperatur. Ein Strich darunter = Schonwaschgang. Durchgestrichenes Dreieck: nicht bleichen. Das ist festes Pflegezeichen-Wissen, kein Live-Labor.',
    tool: tool('wash', 'Zeichen'),
    lastTool: 'house',
  }
}
