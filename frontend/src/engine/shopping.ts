import { parseShopIntent } from './shopping-parse'
import { isProductLookup } from './research-parse'
import {
  addShopping,
  clearGotShopping,
  listShopping,
  loadSettings,
  markShoppingGot,
  persistLastList,
} from './store'
import { syncGlance } from './glance'
import type { ToolMeta } from './tools'

export { parseShopIntent } from './shopping-parse'

function rememberList(titles: string[]): void {
  persistLastList('shopping', titles)
}

export async function handleShopping(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  let intent = parseShopIntent(text)
  if (!intent && isProductLookup(text, Boolean(loadSettings().shop_discount))) return { handled: false }
  if (!intent && loadSettings().last_step_tool === 'shopping') {
    const bare = text.trim().replace(/[.!]+$/g, '')
    if (
      bare.length >= 2 &&
      bare.length <= 40 &&
      !/[?]/.test(bare) &&
      !/^\s*(wo|was|wann|wie|welche|warum|kann|soll|ne|nein|und)\b/i.test(bare) &&
      !/\b(termin|wecker|timer|todo|wetter|fahr|ruf|erinner|kalender|kaufen|rabatt)\b/i.test(bare)
    ) {
      intent = { kind: 'add', item: bare }
    }
  }
  if (!intent) return { handled: false }

  if (intent.kind === 'add') {
    const row = await addShopping(intent.item, conversationId)
    const open = (await listShopping()).filter((s) => s.status === 'open')
    rememberList(open.map((s) => s.title))
    await syncGlance()
    return {
      handled: true,
      reply: `Ich habe „${row.title}“ auf die Einkaufsliste gesetzt.`,
      tool: { tool_status: 'executed', tool: 'shopping', action: 'add', label: 'Einkauf', preview: row.title },
      lastTool: 'shopping',
    }
  }

  if (intent.kind === 'list') {
    const open = (await listShopping()).filter((s) => s.status === 'open')
    if (!open.length) return { handled: true, reply: 'Einkaufsliste ist leer.' }
    rememberList(open.map((s) => s.title))
    const lines = open.map((s, i) => `${i + 1}. ${s.title}`).join('\n')
    return {
      handled: true,
      reply: open.length === 1 ? `Es fehlt noch ${open[0].title}.` : `Das fehlt noch:\n${lines}`,
      tool: { tool_status: 'executed', tool: 'shopping', action: 'list', label: 'Einkauf' },
      lastTool: 'shopping',
    }
  }

  if (intent.kind === 'got') {
    const hit = await markShoppingGot(intent.item)
    await syncGlance()
    if (!hit) return { handled: true, reply: `„${intent.item}“ stand nicht auf der Liste.` }
    return {
      handled: true,
      reply: `Gut, ${hit.title} ist erledigt.`,
      tool: { tool_status: 'executed', tool: 'shopping', action: 'got', label: 'Einkauf', preview: hit.title },
      lastTool: 'shopping',
    }
  }

  const n = await clearGotShopping()
  await syncGlance()
  return { handled: true, reply: n ? `Liste geleert (${n}).` : 'Nichts zu leeren.' }
}
