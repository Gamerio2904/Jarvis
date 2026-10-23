import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

/**
 * Bibliothek: Hochladen, einmalige Ablage im Cache (keine Redundanz in der DB),
 * Verknüpfungen mit Lesetext, Suche, Tags, Löschen und Recall-Integration.
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
if (typeof globalThis.caches === 'undefined') {
  const storeMap = new Map()
  globalThis.caches = /** @type {any} */ ({
    async open(name) {
      if (!storeMap.has(name)) storeMap.set(name, new Map())
      const inner = storeMap.get(name)
      return {
        async put(request, response) {
          inner.set(String(new URL(request.url, 'http://x').pathname), new Uint8Array(await response.arrayBuffer()))
        },
        async match(request) {
          const bytes = inner.get(String(new URL(request.url, 'http://x').pathname))
          return bytes ? new Response(bytes.slice().buffer) : undefined
        },
        async delete(request) {
          return inner.delete(String(new URL(request.url, 'http://x').pathname))
        },
      }
    },
  })
}

const library = await import('../src/engine/files.ts')
const store = await import('../src/engine/store.ts')
const retrieveMod = await import('../src/engine/retrieve.ts')

// 1. Textdatei: Inhalt wird gelesen, Verknüpfung in der DB, Bytes im Cache
const text = `Projekt-Themen für den Shop:
1. Marktplatz für gebrauchte Kartenspiele
2. Preis-Wecker mit Preishistorie
3. Sammler-Börse mit Tausranking`
const [{ entry: textEntry }] = await library.addLibraryFiles([
  { name: 'projekt-themen.md', mime: 'text/markdown', bytes: new TextEncoder().encode(text) },
])
assert.equal(textEntry.kind, 'text')
assert.ok((textEntry.text ?? '').includes('Marktplatz'), 'Lesetext liegt an der Verknüpfung')
assert.ok((textEntry.summary ?? '').includes('Projekt-Themen'), 'Zusammenfassung gezogen')
assert.equal(textEntry.where, 'geraet')
assert.ok(await library.libraryPreviewUrl(textEntry.id), 'Bytes liegen im Cache')

// 2. Bild ohne Gemini-Key: bleibt verknüpft, kein Crash
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 1, 2, 3, 4])
const [{ entry: imgEntry }] = await library.addLibraryFiles([{ name: 'board.png', mime: 'image/png', bytes: png }])
assert.equal(imgEntry.kind, 'image')
assert.ok(!imgEntry.summary, 'ohne Key keine erfundene Zusammenfassung')

// 3. Tags setzen und suchen
await library.updateLibraryTags(textEntry.id, ['projekt', 'ideen'])
const hits = await library.searchLibrary('ideen projekt shop')
assert.equal(hits[0]?.id, textEntry.id, 'Treffer nach Inhalt und Tags')
const miss = await library.searchLibrary('wetterbericht')
assert.equal(miss.length, 0)

// 4. Liste + Art-Erkennung
const all = await library.listLibrary()
assert.equal(all.length, 2)
assert.equal(library.kindOf('application/pdf', 'vertrag.pdf'), 'pdf')
assert.equal(library.kindOf('image/jpeg', 'foto.jpg'), 'image')
assert.equal(library.kindOf('application/octet-stream', 'daten.bin'), 'file')

// 5. Recall: „was hatte ich für Ideen?" findet die Bibliothek
const recalled = await retrieveMod.retrieve('was hatte ich für ideen projekt shop')
assert.ok(recalled.some((hit) => hit.store === 'library'), 'Bibliothek ist im Recall vertreten')

// 6. Löschen räumt Verknüpfung UND Bytes ab
await library.deleteLibraryEntry(imgEntry.id)
assert.equal((await library.listLibrary()).length, 1)
assert.equal(await library.libraryPreviewUrl(imgEntry.id), null)

// 7. Hausstand-Backup trägt die Verknüpfungen
const backup = await (await import('../src/engine/backup.ts')).buildBackup(true)
assert.ok(Array.isArray(backup.library), 'library-Feld im HausBackup')
assert.equal(backup.library.length, 1)
assert.equal(backup.library[0].id, textEntry.id)

console.log('OK test-library — Upload, einmalige Ablage, Lesetext, Suche, Recall, Backup-Verknüpfung, Löschen')
