import { addShopping, addTodo, deleteShoppingItem, deleteTodo, listShopping, listTodos, loadSettings } from './store.ts'

/** Vorschau des letzten Zugs, „Milch, Eier“ wird zwei Titel. */
export function titlesFromLastStep(): string[] {
  return (loadSettings().last_step_title || '')
    .split(/\s*,\s*/)
    .map((title) => title.trim())
    .filter((title) => title.length >= 2 && !/^(?:nein|nee+|nicht|doch|lieber)$/i.test(title))
}

function same(a: string, b: string): boolean {
  return a.toLocaleLowerCase('de-DE') === b.toLocaleLowerCase('de-DE')
}

export async function takeOpenShopping(title: string): Promise<string | null> {
  const hit = (await listShopping()).find((row) => row.status === 'open' && same(row.title, title))
  if (!hit) return null
  await deleteShoppingItem(hit.id)
  return hit.title
}

export async function takeOpenTodo(title: string): Promise<string | null> {
  const hit = (await listTodos()).find((row) => row.status !== 'done' && same(row.title, title))
  if (!hit) return null
  await deleteTodo(hit.id)
  return hit.title
}

/** Nimmt den Posten von der Einkaufsliste, wenn er dort liegt, und legt ihn als Aufgabe an. */
export async function moveToTodo(
  titles: string[],
  conversationId?: string,
  requireSource = false,
): Promise<{ titles: string[]; fromShopping: string[] }> {
  const kept: string[] = []
  const fromShopping: string[] = []
  for (const title of titles) {
    const taken = await takeOpenShopping(title)
    if (!taken && requireSource) continue
    const name = taken || title
    if (taken) fromShopping.push(name)
    const exists = (await listTodos()).some((row) => row.status !== 'done' && same(row.title, name))
    if (!exists) await addTodo(name, conversationId)
    kept.push(name)
  }
  return { titles: kept, fromShopping }
}

/** Nimmt die Aufgabe von der To-Do-Liste und legt sie auf die Einkaufsliste. */
export async function moveToShopping(titles: string[], conversationId?: string, listHint?: string): Promise<string[]> {
  const moved: string[] = []
  for (const title of titles) {
    const taken = await takeOpenTodo(title)
    if (!taken) continue
    const row = await addShopping(taken, { conversationId, ...(listHint ? { listHint } : {}) })
    moved.push(row.title)
  }
  return moved
}
