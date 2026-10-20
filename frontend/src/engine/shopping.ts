import { parseShopIntent, splitShopItems } from './shopping-parse.ts'
import { moveToShopping, titlesFromLastStep } from './list-move.ts'
import {
  addShopping,
  clearGotShopping,
  getDefaultShoppingList,
  listShopping,
  listShoppingLists,
  loadSettings,
  markShoppingGot,
  persistLastList,
  saveSettings,
  slugShoppingList,
} from './store.ts'
import { syncGlance } from './glance.ts'
import type { ToolMeta } from './tools.ts'

export { parseShopIntent } from './shopping-parse.ts'

function rememberList(titles: string[]): void {
  persistLastList('shopping', titles)
}

function findList(
  lists: Awaited<ReturnType<typeof listShoppingLists>>,
  hint: string,
): Awaited<ReturnType<typeof listShoppingLists>>[number] | undefined {
  const slug = slugShoppingList(hint)
  const name = hint.trim().toLowerCase()
  return lists.find((list) => list.slug === slug || list.name.toLowerCase() === name)
}

async function listLabel(hint: string): Promise<string> {
  const hit = findList(await listShoppingLists(), hint)
  const name = (hit?.name || hint).replace(/(?:-|\s)?liste$/i, '').trim() || hint
  return `der ${name}-Liste`
}

export async function handleShopping(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  let intent = parseShopIntent(text)
  if (!intent && loadSettings().last_step_tool === 'shopping') {
    const bare = text.trim().replace(/[.!]+$/g, '')
    const items = splitShopItems(bare)
    if (
      items.length &&
      bare.length >= 2 &&
      bare.length <= 80 &&
      !/[?]/.test(bare) &&
      !/\b(termin|wecker|timer|todo|to-do|aufgaben|wetter|fahr|ruf|erinner|kalender)\b/i.test(bare) &&
      !/^(?:nein|nee+|nicht|doch|lieber|stattdessen)\b/i.test(bare)
    ) {
      intent = { kind: 'add', item: items[0], items }
    }
  }
  if (!intent) return { handled: false }

  if (intent.kind === 'create-list') {
    const row = await getDefaultShoppingList()
    saveSettings({ shopping_list_id: row.id })
    return {
      handled: true,
      reply: 'Es gibt eine Einkaufsliste.',
      tool: { tool_status: 'executed', tool: 'shopping', action: 'create-list', label: 'Einkauf', preview: row.name },
      lastTool: 'shopping',
    }
  }

  if (intent.kind === 'adopt-last') {
    const titles = titlesFromLastStep()
    if (loadSettings().last_step_tool === 'todo' && titles.length) {
      const moved = await moveToShopping(titles, conversationId)
      if (moved.length) {
        const open = (await listShopping()).filter((s) => s.status === 'open')
        rememberList(open.map((s) => s.title))
        await syncGlance()
        return {
          handled: true,
          reply: `Von der To-Do-Liste auf die Einkaufsliste: ${moved.join(', ')}.`,
          tool: { tool_status: 'executed', tool: 'shopping', action: 'move', label: 'Einkauf', preview: moved.join(', ') },
          lastTool: 'shopping',
        }
      }
    }
    if (loadSettings().last_step_tool === 'shopping' && titles.length) {
      return { handled: true, reply: `Steht schon auf der Einkaufsliste: ${titles.join(', ')}.`, lastTool: 'shopping' }
    }
    return { handled: true, reply: 'Was soll auf die Einkaufsliste?' }
  }

  if (intent.kind === 'add') {
    const lists = await listShoppingLists()
    const active = lists.find((list) => list.id === loadSettings().shopping_list_id)
    const titles: string[] = []
    const fromTodo: string[] = []
    for (const item of intent.items) {
      const moved = await moveToShopping([item], conversationId, intent.listHint)
      if (moved.length) fromTodo.push(moved[0])
      const row = moved.length
        ? { title: moved[0] }
        : await addShopping(item, {
            conversationId,
            ...(intent.listHint ? { listHint: intent.listHint } : active ? { listId: active.id } : {}),
          })
      if (!titles.some((title) => title.toLowerCase() === row.title.toLowerCase())) titles.push(row.title)
    }
    const open = (await listShopping()).filter((s) => s.status === 'open')
    rememberList(open.map((s) => s.title))
    await syncGlance()
    const where = intent.listHint ? await listLabel(intent.listHint) : 'der Liste'
    const preview = titles.join(', ')
    const reply =
      fromTodo.length && fromTodo.length === titles.length
        ? `Von der To-Do-Liste auf die Einkaufsliste: ${preview}.`
        : `Auf ${where}: ${preview}.`
    return {
      handled: true,
      reply,
      tool: { tool_status: 'executed', tool: 'shopping', action: 'add', label: 'Einkauf', preview },
      lastTool: 'shopping',
    }
  }

  if (intent.kind === 'list') {
    const lists = await listShoppingLists()
    const hinted = intent.listHint ? findList(lists, intent.listHint) : undefined
    if (intent.listHint && !hinted) {
      return { handled: true, reply: `Die Liste ${intent.listHint} gibt es noch nicht.` }
    }
    const activeId = hinted?.id || loadSettings().shopping_list_id || (await getDefaultShoppingList()).id
    const open = (await listShopping(activeId)).filter((s) => s.status === 'open')
    if (!open.length) {
      return { handled: true, reply: hinted ? `${hinted.name} ist leer.` : 'Einkaufsliste ist leer.' }
    }
    rememberList(open.map((s) => s.title))
    const lines = open.map((s, i) => `${i + 1}. ${s.title}`).join('\n')
    const head = hinted ? `Auf ${hinted.name}` : 'Fehlt'
    return {
      handled: true,
      reply: `${head}:\n${lines}`,
      tool: { tool_status: 'executed', tool: 'shopping', action: 'list', label: 'Einkauf' },
      lastTool: 'shopping',
    }
  }

  if (intent.kind === 'got') {
    const found: string[] = []
    const missing: string[] = []
    for (const item of intent.items) {
      const hit = await markShoppingGot(item)
      if (hit) found.push(hit.title)
      else missing.push(item)
    }
    await syncGlance()
    if (!found.length) return { handled: true, reply: `„${intent.item}“ stand nicht auf der Liste.` }
    const verb = found.length > 1 ? 'sind' : 'ist'
    const reply = missing.length
      ? `${found.join(', ')} ${verb} da. ${missing.join(', ')} stand nicht auf der Liste.`
      : `${found.join(', ')} ${verb} da.`
    return {
      handled: true,
      reply,
      tool: { tool_status: 'executed', tool: 'shopping', action: 'got', label: 'Einkauf', preview: found.join(', ') },
      lastTool: 'shopping',
    }
  }

  const n = await clearGotShopping()
  await syncGlance()
  return { handled: true, reply: n ? `Liste geleert (${n}).` : 'Nichts zu leeren.' }
}
