import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

/**
 * Tags: #Extraktion, Normalisierung, Farben, Filter und Sortierung für
 * Todos und Notizen — plus die Sprach-Intents tag_add und tag_show.
 */

const mem = Object.create(null)
globalThis.localStorage = /** @type {any} */ ({
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = String(v)
  },
  removeItem: (k) => {
    delete mem[k]
  },
  clear: () => {
    for (const k of Object.keys(mem)) delete mem[k]
  },
})

const { extractTags, normalizeTag, stripTags, mergeTags, tagColor, allTags, filterByTags, sortByTags } = await import('../src/engine/tags.ts')
const store = await import('../src/engine/store.ts')
const { parseToolIntent } = await import('../src/engine/tools-parse.ts')

// 1. Extraktion: #tags aus Freitext, sauber normalisiert
assert.deepEqual(extractTags('Müll rausbringen #haushalt #Einkaufen'), ['haushalt', 'einkaufen'])
assert.deepEqual(extractTags('ohne tag hier'), [])
assert.equal(normalizeTag('  #Projekt-2026! '), 'projekt-2026')

// 2. stripTags: Titel ohne #tags, Rest bleibt
assert.equal(stripTags('Müll rausbringen #haushalt'), 'Müll rausbringen')
assert.equal(stripTags('#einkaufen Milch und Brot'), 'Milch und Brot')

// 3. mergeTags dedupliziert und normalisiert
assert.deepEqual(mergeTags(['Haushalt'], ['haushalt', 'arbeit'], null), ['haushalt', 'arbeit'])

// 4. Farbe: stabil pro Tag, verschiedene Tags meistens verschiedene Farben
assert.equal(tagColor('arbeit'), tagColor('arbeit'))
assert.equal(tagColor('Arbeit'), tagColor('arbeit'))
assert.notEqual(tagColor('arbeit'), tagColor('einkaufen'))

// 5. Todo mit Tags anlegen: #tags fließen aus dem Titel, Titel bleibt sauber
const todo = await store.addTodo('Steuerunterlagen sortieren #finanzen #projekt')
assert.equal(todo.title, 'Steuerunterlagen sortieren')
assert.deepEqual(todo.tags, ['finanzen', 'projekt'])

// 6. Todo mit expliziten Tags + Update
const todo2 = await store.addTodo('Regale aufbauen', undefined, { tags: ['haushalt'] })
assert.deepEqual(todo2.tags, ['haushalt'])
const todo2b = await store.updateTodo(todo2.id, { tags: ['haushalt', 'werkstatt'] })
assert.deepEqual(todo2b.tags, ['haushalt', 'werkstatt'])

// 7. Notiz: #tags aus dem Body, Body bleibt vollständig
const note = await store.addNote('Projekt-Ideen: Shop, App, Blog #projekt')
assert.deepEqual(note.tags, ['projekt'])
assert.ok(note.body.includes('#projekt'), 'Notiztext bleibt unverändert')
const note1b = await store.updateNote(note.id, note.body, ['projekt', 'ideen'])
assert.deepEqual(note1b.tags, ['projekt', 'ideen'])

// 8. Filter + Sortierung
const pool = [
  { title: 'a', tags: ['arbeit'], updated_at: '2026-01-01' },
  { title: 'b', tags: ['haushalt'], updated_at: '2026-01-02' },
  { title: 'c', tags: [], updated_at: '2026-01-03' },
  { title: 'd', tags: ['arbeit', 'projekt'], updated_at: '2026-01-04' },
]
assert.deepEqual(filterByTags(pool, ['arbeit']).map((row) => row.title), ['a', 'd'])
assert.deepEqual(filterByTags(pool, []).map((row) => row.title), ['a', 'b', 'c', 'd'])
assert.deepEqual(sortByTags(pool).map((row) => row.title), ['d', 'a', 'b', 'c'])
assert.deepEqual(allTags(pool), ['arbeit', 'haushalt', 'projekt'])

// 9. Sprach-Intents: taggen, anzeigen, Bibliothek öffnen und fragen
const tagAdd = parseToolIntent('tagge die notiz projekt ideen mit arbeit')
assert.ok(tagAdd, 'tag_add erkannt')
assert.equal(tagAdd.kind, 'tag_add')
assert.equal(tagAdd.target, 'note')
assert.equal(tagAdd.tag, 'arbeit')

const tagAdd2 = parseToolIntent('setze tag werkstatt auf die aufgabe regale aufbauen')
assert.ok(tagAdd2 && tagAdd2.kind === 'tag_add')
assert.equal(tagAdd2.target, 'todo')

const tagShow = parseToolIntent('zeig mir notizen mit tag arbeit')
assert.ok(tagShow && tagShow.kind === 'tag_show')
assert.equal(tagShow.target, 'note')

const libOpen = parseToolIntent('öffne die bibliothek')
assert.ok(libOpen && libOpen.kind === 'library_open')

const libAsk = parseToolIntent('was ist in der bibliothek zu projekt ideen')
assert.ok(libAsk && libAsk.kind === 'library_list')
assert.equal(libAsk.query, 'projekt ideen')

console.log('OK test-tags — Extraktion, Farben, Filter, Sortierung, tag_add/tag_show/Bibliothek-Intents')
