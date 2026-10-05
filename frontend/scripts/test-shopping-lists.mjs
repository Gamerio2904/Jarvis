import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

if (!globalThis.localStorage) {
  const mem = new Map()
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => {
      mem.set(String(k), String(v))
    },
    removeItem: (k) => {
      mem.delete(String(k))
    },
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size
    },
  }
}

const { parseShopIntent } = await import('../src/engine/shopping-parse.ts')
const {
  addShopping,
  createShoppingList,
  deleteShoppingItem,
  getDefaultShoppingList,
  listShopping,
  listShoppingLists,
  markShoppingGotById,
  replaceStore,
  slugShoppingList,
} = await import('../src/engine/store.ts')

assert.equal(slugShoppingList('Amazon-Liste'), 'amazon')
assert.equal(slugShoppingList('Hauptliste'), 'haupt')

const named = parseShopIntent('Airpods zur Amazon-Liste')
assert.equal(named?.kind, 'add')
assert.equal(named?.listHint, 'Amazon')

await replaceStore('shopping', [])
await replaceStore('shopping_lists', [])

const def = await getDefaultShoppingList()
assert.ok(def.is_default)
assert.equal(def.name, 'Hauptliste')

await addShopping('Milch')
await addShopping('Brot')
const open = (await listShopping(def.id)).filter((s) => s.status === 'open')
assert.equal(open.length, 2)

const amazon = await createShoppingList('Amazon')
assert.ok(amazon)
await addShopping('Airpods', { listHint: 'Amazon' })
const amItems = await listShopping(amazon.id)
assert.equal(amItems.filter((s) => s.status === 'open').length, 1)

const dup = await addShopping('Milch')
assert.equal(dup.id, open[0].id)

const id = open[0].id
await markShoppingGotById(id)
assert.equal((await listShopping(def.id)).filter((s) => s.status === 'open').length, 1)

await deleteShoppingItem(amItems[0].id)
assert.equal((await listShopping(amazon.id)).length, 0)

const lists = await listShoppingLists()
assert.ok(lists.length >= 2)

console.log('test-shopping-lists.mjs ok')
