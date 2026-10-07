import { parseShopIntent } from './shopping-parse.ts'
import {
  addShopping,
  clearGotShopping,
  createShoppingList,
  getDefaultShoppingList,
  listShopping,
  listShoppingLists,
  loadSettings,
  markShoppingGot,
  persistLastList,
  saveSettings,
} from './store.ts'
import { syncGlance } from './glance.ts'
import type { ToolMeta } from './tools.ts'

export { parseShopIntent } from './shopping-parse.ts'

function rememberList(titles: string[]): void {
  persistLastList('shopping', titles)
}

export async function handleShopping(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  let intent = parseShopIntent(text)
  if (!intent && loadSettings().last_step_tool === 'shopping') {
    const bare = text.trim().replace(/[.!]+$/g, '')
    if (
      bare.length >= 2 &&
      bare.length <= 40 &&
      !/[?]/.test(bare) &&
      !/\b(termin|wecker|timer|todo|wetter|fahr|ruf|erinner|kalender)\b/i.test(bare)
    ) {
      intent = { kind: 'add', item: bare }
    }
  }
  if (!intent) return { handled: false }

  if (intent.kind === 'create-list') {
    const row = intent.name
      ? await createShoppingList(intent.name)
      : await getDefaultShoppingList()
    if (!row) {
      return { handled: true, reply: 'Der Listenname ist ungültig. Bitte verwende höchstens 64 Zeichen.' }
    }
    saveSettings({ shopping_list_id: row.id })
    return {
      handled: true,
      reply: intent.name ? `Die Liste ${row.name} ist bereit.` : `Die Einkaufsliste ${row.name} ist bereit.`,
      tool: { tool_status: 'executed', tool: 'shopping', action: 'create-list', label: 'Einkauf', preview: row.name },
      lastTool: 'shopping',
    }
  }

  if (intent.kind === 'add') {
    const lists = await listShoppingLists()
    const active = lists.find((list) => list.id === loadSettings().shopping_list_id)
    const row = await addShopping(intent.item, {
      conversationId,
      ...(intent.listHint ? { listHint: intent.listHint } : active ? { listId: active.id } : {}),
    })
    const open = (await listShopping()).filter((s) => s.status === 'open')
    rememberList(open.map((s) => s.title))
    await syncGlance()
    return {
      handled: true,
      reply: `Auf der Liste: ${row.title}.`,
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
      reply: `Fehlt:\n${lines}`,
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
      reply: `${hit.title} ist da.`,
      tool: { tool_status: 'executed', tool: 'shopping', action: 'got', label: 'Einkauf', preview: hit.title },
      lastTool: 'shopping',
    }
  }

  const n = await clearGotShopping()
  await syncGlance()
  return { handled: true, reply: n ? `Liste geleert (${n}).` : 'Nichts zu leeren.' }
}
