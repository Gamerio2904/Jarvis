import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { parseWatchlistIntent } from '../src/engine/watchlist-parse.ts'
import { handleWatchlist } from '../src/engine/watchlist.ts'
import { addWatchMovie, listWatchMovies, listWatchedMovies, loadSettings, persistLastList, readLastList } from '../src/engine/store.ts'
import { parseTvWatch } from '../src/engine/tv-parse.ts'
import { parseFilmIntent } from '../src/engine/film-parse.ts'
import { parseIdeaIntent } from '../src/engine/idea-parse.ts'
import { parseTasteIntent } from '../src/engine/film-taste-parse.ts'
import { isMemoryWrite } from '../src/engine/memory-parse.ts'
import { pickRoute } from '../src/engine/route-pick.ts'
import { fromOmdb } from '../src/engine/omdb.ts'
import { overlayHidesDrive } from '../src/engine/overlay-fsm.ts'
import { applyWatched, WATCHED_PACK_TOPIC } from '../src/engine/film-taste.ts'
import { rewriteOrdinal } from '../src/engine/ordinal.ts'

if (!globalThis.localStorage) {
  const mem = new Map()
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(String(k), String(v)) },
    removeItem: (k) => { mem.delete(String(k)) },
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() { return mem.size },
  }
}

assert.equal(parseWatchlistIntent('Watchliste: Dune')?.kind, 'add')
assert.equal(parseWatchlistIntent('Watchliste: Dune')?.list, 'watch')
assert.equal(parseWatchlistIntent('Lieblingsliste: Arrival')?.kind, 'add')
assert.equal(parseWatchlistIntent('Lieblingsliste: Arrival')?.list, 'favorite')
assert.equal(parseWatchlistIntent('Öffne Lieblingsfilme')?.kind, 'show')
assert.equal(parseWatchlistIntent('Öffne Lieblingsfilme')?.list, 'favorite')
assert.equal(parseWatchlistIntent('Öffne Watchliste')?.kind, 'show')
assert.equal(parseWatchlistIntent('Öffne das watchlist overlay')?.kind, 'show')
assert.equal(parseWatchlistIntent('Öffne das watchlist overlay')?.list, 'watch')
assert.equal(parseWatchlistIntent('Öffne das Watchliste overlay')?.kind, 'show')
assert.equal(pickRoute('Öffne das watchlist overlay'), 'watchlist')
assert.equal(parseWatchlistIntent('Lieblingsliste 1 weg')?.kind, 'remove')
assert.equal(parseWatchlistIntent('Spiel Dune Film'), null)
assert.ok(parseTvWatch('Spiel Dune Film'))
assert.equal(parseWatchlistIntent('Wie gut ist Dune'), null)
assert.ok(parseFilmIntent('Wie gut ist Dune'))
assert.equal(parseWatchlistIntent('IMDb Dune'), null)
assert.equal(parseWatchlistIntent('Notiz Dune'), null)
assert.equal(parseWatchlistIntent('Todo Dune'), null)
assert.equal(parseWatchlistIntent('Idee: Dune'), null)
assert.ok(parseIdeaIntent('Idee: Dune'))
assert.equal(parseWatchlistIntent('merk dir ich mag Dune'), null)
assert.ok(isMemoryWrite('merk dir ich mag Dune'))

assert.equal(pickRoute('Spiel Dune Film'), 'tv')
assert.equal(pickRoute('Watchliste: Dune'), 'watchlist')
assert.equal(pickRoute('Lieblingsliste: Dune'), 'watchlist')
assert.equal(pickRoute('Öffne Lieblingsfilme'), 'watchlist')
assert.equal(pickRoute('Wie gut ist Dune'), 'film')
assert.equal(pickRoute('Nenn mir Horrorfilme für Filmabend'), 'watchlist')
assert.equal(pickRoute('Was steht an'), 'brief')

{
  const a = await addWatchMovie('Dune', 'watch')
  const b = await addWatchMovie('Dune', 'favorite')
  assert.equal(a.id, b.id)
  assert.ok(b.lists.includes('watch') && b.lists.includes('favorite'))
  const one = await listWatchMovies()
  assert.equal(one.filter((m) => m.title === 'Dune').length, 1)
}

{
  await handleWatchlist('c', 'Watchliste: Heat')
  await handleWatchlist('c', 'Lieblingsliste: Arrival')
  const watch = await handleWatchlist('c', 'Zeig meine Watchliste')
  assert.match(watch.reply || '', /Heat/)
  assert.equal(watch.tool?.action, 'open')
  persistLastList('watch-favorite', ['Arrival'])
  const rm = parseWatchlistIntent('Lieblingsliste 1 weg')
  assert.equal(rm?.kind, 'remove')
  assert.equal(rm?.list, 'favorite')
}

{
  const hit = fromOmdb({
    Title: 'Dune',
    Year: '2021',
    Response: 'True',
    tomatoMeter: '83%',
    tomatoUserMeter: '90%',
    Poster: 'https://example.com/dune.jpg',
    Genre: 'Sci-Fi, Adventure',
  })
  assert.equal(hit?.tomatoes, '83%')
  assert.equal(hit?.audience, '90%')
  assert.equal(hit?.poster, 'https://example.com/dune.jpg')
  const empty = fromOmdb({ Title: 'X', Response: 'True', tomatoMeter: 'N/A', tomatoUserMeter: 'N/A', Poster: 'N/A' })
  assert.equal(empty?.audience, undefined)
  assert.equal(empty?.poster, undefined)
}

{
  const miss = applyWatched({ title: 'Missing', watchlist: [], watched: [] })
  assert.ok('missing' in miss)
  const seen = applyWatched({
    title: 'Dune',
    watchlist: [{ title: 'Dune', genres: /** @type {import('../src/engine/film-taste.ts').GenreKey[]} */ (['sci-fi']), pool: 'watchlist' }],
    watched: [],
  })
  assert.ok('movie' in seen)
  assert.equal(WATCHED_PACK_TOPIC, 'filme-gesehen')
}

assert.ok(
  overlayHidesDrive({ id: 'watchlist', phase: 'open', stack: ['watchlist'] }),
)

assert.equal(parseTasteIntent('Ich habe Dune geschaut')?.kind, 'seen')
assert.equal(parseTasteIntent('Spiel Dune Film'), null)

{
  persistLastList('watch-watch', ['Heat', 'Alien'])
  assert.equal(loadSettings().last_step_tool, 'watchlist')
  assert.deepEqual(readLastList(), ['Heat', 'Alien'])
  assert.deepEqual(readLastList('watch-watch'), ['Heat', 'Alien'])
  const del = rewriteOrdinal('lösche das zweite', 'watchlist', readLastList())
  assert.equal(del, 'Watchliste 2 weg')
  assert.equal(parseWatchlistIntent(del)?.kind, 'remove')
  persistLastList('watch-favorite', ['Arrival', 'Dune'])
  const favDel = rewriteOrdinal(
    'lösche das erste',
    'watchlist',
    readLastList(),
    readLastList('watch-favorite'),
  )
  assert.equal(favDel, 'Lieblingsliste 1 weg')
  assert.equal(parseWatchlistIntent(favDel)?.kind, 'remove')
  const ideaDel = rewriteOrdinal('lösche das zweite', 'idea', ['Lidl', 'Schach'])
  assert.equal(ideaDel, 'Idee 2 weg')
  assert.equal(parseIdeaIntent(ideaDel)?.kind, 'done')
}

await handleWatchlist('c2', 'Watchliste: Alien')
await handleWatchlist('c2', 'Ich habe Alien geschaut')
const after = await listWatchMovies('watch')
assert.ok(!after.some((m) => /alien/i.test(m.title)))
const watched = await listWatchedMovies()
assert.ok(watched.some((m) => /alien/i.test(m.title)))

console.log('test-watchlist ok')
