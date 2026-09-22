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
import { expandFilmTitle, fromOmdb, sameFilmTitle, splitFilmTitle, watchScoreLine, watchScoreParts } from '../src/engine/omdb.ts'
import { overlayHidesDrive } from '../src/engine/overlay-fsm.ts'
import { applyWatched, WATCHED_PACK_TOPIC } from '../src/engine/film-taste.ts'
import { rewriteOrdinal } from '../src/engine/ordinal.ts'
import { scrubReply } from '../src/engine/guards.ts'
import { rewriteFollowUp } from '../src/engine/last-step.ts'
import { repairSpeech } from '../src/engine/utterance.ts'

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
assert.equal(parseWatchlistIntent('Nee auf die lieblingsliste')?.kind, 'move')
assert.equal(parseWatchlistIntent('Nee auf die lieblingsliste')?.list, 'favorite')
assert.equal(parseWatchlistIntent('verschieb das zu den Lieblingen')?.kind, 'move')
assert.equal(parseWatchlistIntent('Star Wars 3 auf die Lieblingsliste')?.kind, 'add')
assert.equal(parseWatchlistIntent('Star Wars 3 auf die Lieblingsliste')?.list, 'favorite')
assert.equal(parseWatchlistIntent('Inglorious Basterds zu Lieblingsfilmen hinzufügen')?.kind, 'add')
assert.equal(parseWatchlistIntent('Inglorious Basterds zu Lieblingsfilmen hinzufügen')?.list, 'favorite')
assert.equal(parseWatchlistIntent('IngloriousbastarddszuLieblingsfilmenhinzufügen')?.kind, 'add')
assert.equal(parseWatchlistIntent('Ja entfernen es')?.kind, 'remove')
assert.equal(parseWatchlistIntent('Jaentfernenes')?.kind, 'remove')
assert.equal(parseWatchlistIntent('Star Wars 3 ist doppelt auf der Liste fixe das')?.kind, 'dedupe')
assert.equal(parseWatchlistIntent('Starwars3istdoppeltaufderlistefixedas')?.kind, 'dedupe')
assert.equal(pickRoute('Inglorious Basterds zu Lieblingsfilmen hinzufügen'), 'watchlist')
assert.equal(pickRoute('Ja entfernen es'), 'watchlist')
assert.equal(pickRoute('Star Wars 3 ist doppelt auf der Liste fixe das'), 'watchlist')
assert.ok(expandFilmTitle('Inglorious Basterds').some((t) => /Inglourious Basterds/i.test(t)))
assert.equal(pickRoute('Nee auf die lieblingsliste'), 'watchlist')
assert.equal(splitFilmTitle('StarWars3'), 'Star Wars 3')
assert.ok(expandFilmTitle('Star Wars 3').some((t) => /Episode III/i.test(t)))
assert.match(
  scrubReply('Star Wars 3 wurde von der Watchliste in die Lieblingsliste verschoben.'),
  /nicht ausgeführt/,
)
assert.match(scrubReply('Der Film befindet sich aktuell auf der Watchliste.'), /nicht ausgeführt/)
assert.match(scrubReply('Ich habe keinen Zugriff auf Ihre Filmliste, um Einträge zu entfernen.'), /nicht ausgeführt/)
assert.match(scrubReply('Ich habe den Film nicht in Ihrer Liste gespeichert.'), /nicht ausgeführt/)
assert.match(scrubReply('Ich habe keine Bestätigung, dass der Duplikat entfernt wurde.'), /nicht ausgeführt/)
assert.ok(sameFilmTitle('Star Wars 3', 'Star Wars: Episode III - Revenge of the Sith'))
assert.ok(sameFilmTitle('Inglorious bastardds', 'Inglourious Basterds'))
assert.match(repairSpeech('Jaentfernenes'), /^ja entfernen es$/i)
assert.match(repairSpeech('IngloriousbastarddszuLieblingsfilmenhinzufügen'), /Basterds zu lieblingsfilmen hinzufügen/i)
assert.equal(
  rewriteFollowUp('ja entfernen es', { last_step_tool: 'watchlist', last_step_title: 'Heat' }),
  'von der watchliste Heat',
)
assert.equal(parseWatchlistIntent('Lieblingsliste: Arrival')?.kind, 'add')
assert.equal(parseWatchlistIntent('Lieblingsliste: Arrival')?.list, 'favorite')
assert.equal(parseWatchlistIntent('Öffne Lieblingsfilme')?.kind, 'show')
assert.equal(parseWatchlistIntent('Öffne Lieblingsfilme')?.list, 'favorite')
assert.equal(parseWatchlistIntent('Öffne Watchliste')?.kind, 'show')
assert.equal(parseWatchlistIntent('Öffne das watchlist overlay')?.kind, 'show')
assert.equal(parseWatchlistIntent('Öffne das watchlist overlay')?.list, 'watch')
assert.equal(parseWatchlistIntent('Öffne das Watchliste overlay')?.kind, 'show')
assert.equal(parseWatchlistIntent('Mach das Overlay für die Filme auf'), null)
assert.equal(parseWatchlistIntent('Öffne das overlay'), null)
assert.equal(pickRoute('Öffne das watchlist overlay'), 'watchlist')
assert.equal(pickRoute('Öffne Lieblinge'), 'watchlist')
assert.notEqual(pickRoute('Öffne das watchlist overlay'), 'drive')
assert.notEqual(pickRoute('Mach das Overlay für die Filme auf'), 'drive')
assert.notEqual(pickRoute('Mach das Film-Overlay auf'), 'drive')
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
  const live = fromOmdb({
    Title: 'Dune',
    Year: '1984',
    Response: 'True',
    tomatoMeter: 'N/A',
    tomatoUserMeter: 'N/A',
    imdbRating: '6.3',
    Ratings: [
      { Source: 'Internet Movie Database', Value: '6.3/10' },
      { Source: 'Rotten Tomatoes', Value: '36%' },
      { Source: 'Metacritic', Value: '41/100' },
    ],
    Poster: 'https://example.com/dune84.jpg',
  })
  assert.equal(live?.tomatoes, '36%')
  assert.equal(live?.audience, undefined)
  assert.equal(live?.imdb, '6.3')
  const line = watchScoreLine({ critic: live?.tomatoes, audience: live?.audience, imdbScore: live?.imdb })
  assert.match(line.scores, /Kritiker 36%/)
  assert.match(line.scores, /Publikum —/)
  assert.match(line.scores, /IMDb 6,3/)
  assert.doesNotMatch(line.scores, /Publikum 6/)
  assert.match(line.source, /IMDb/)
  const both = watchScoreLine({ critic: '83%', audience: '90%', imdbScore: '8.0' })
  assert.match(both.scores, /Publikum 90%/)
  assert.match(both.scores, /IMDb 8,0/)
  const parts = watchScoreParts({ critic: '36%', audience: null, imdbScore: '6.3' })
  assert.equal(parts.critic, '36%')
  assert.equal(parts.audience, '—')
  assert.equal(parts.imdb, '6,3')
  const fromRatings = fromOmdb({
    Title: 'Heat',
    Response: 'True',
    Ratings: [
      { Source: 'Rotten Tomatoes', Value: '83%' },
      { Source: 'Rotten Tomatoes Audience', Value: '94%' },
    ],
  })
  assert.equal(fromRatings?.tomatoes, '83%')
  assert.equal(fromRatings?.audience, '94%')
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

{
  await handleWatchlist('c-move', 'Watchliste: Heat')
  const moved = await handleWatchlist('c-move', 'Nee auf die lieblingsliste')
  assert.match(moved.reply || '', /Lieblingen/)
  assert.equal(moved.tool?.action, 'move')
  const afterWatch = await listWatchMovies('watch')
  const afterFav = await listWatchMovies('favorite')
  assert.ok(!afterWatch.some((m) => /heat/i.test(m.title)))
  assert.ok(afterFav.some((m) => /heat/i.test(m.title) && m.lists.includes('favorite') && !m.lists.includes('watch')))
}

await handleWatchlist('c2', 'Watchliste: Alien')
await handleWatchlist('c2', 'Ich habe Alien geschaut')
const after = await listWatchMovies('watch')
assert.ok(!after.some((m) => /alien/i.test(m.title)))
const watched = await listWatchedMovies()
assert.ok(watched.some((m) => /alien/i.test(m.title)))

{
  const fav = await handleWatchlist('c-ing', 'Inglorious Basterds zu Lieblingsfilmen hinzufügen')
  assert.match(fav.reply || '', /Lieblingen|Inglourious|Basterds/)
  assert.equal(fav.tool?.action, 'add')
  persistLastList('watch-favorite', ['Inglourious Basterds'])
  const rm = await handleWatchlist('c-ing', 'Ja entfernen es')
  assert.match(rm.reply || '', /Weg von/)
  assert.equal(rm.tool?.action, 'remove')
}

{
  await addWatchMovie('Star Wars 3', 'watch')
  await addWatchMovie('Star Wars: Episode III - Revenge of the Sith', 'watch', { imdbId: 'tt0121766' })
  const before = (await listWatchMovies('watch')).filter((m) => /star wars/i.test(m.title))
  assert.ok(before.length >= 2)
  const fix = await handleWatchlist('c-dup', 'Star Wars 3 ist doppelt auf der Liste fixe das')
  assert.equal(fix.tool?.action, 'dedupe')
  assert.match(fix.reply || '', /zusammengelegt/)
  const left = (await listWatchMovies('watch')).filter((m) => /star wars/i.test(m.title) && /3|iii|episode/i.test(m.title))
  assert.equal(left.length, 1)
}

console.log('test-watchlist ok')
