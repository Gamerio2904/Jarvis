import assert from 'node:assert/strict'
import {
  ASK_WEIGHT,
  FAV_WEIGHT,
  SEEN_WEIGHT,
  WATCHLIST_NIGHT,
  WATCHED_PACK_TOPIC,
  applyWatched,
  buildProfile,
  buildWatchedPack,
  formatRecommendReply,
  movieKey,
  recommend,
  scoreMovie,
} from '../src/engine/film-taste.ts'
import { genresFromOmdb, parseTasteIntent } from '../src/engine/film-taste-parse.ts'

/** @typedef {import('../src/engine/film-taste.ts').MovieSeed} MovieSeed */

/** @type {MovieSeed} */
const dune = { title: 'Dune', year: '2021', genres: ['sci-fi'], pool: 'favorite' }
/** @type {MovieSeed} */
const arrival = { title: 'Arrival', year: '2016', genres: ['sci-fi'], pool: 'favorite' }
/** @type {MovieSeed} */
const hereditary = { title: 'Hereditary', year: '2018', genres: ['horror'], pool: 'watchlist' }
/** @type {MovieSeed} */
const heat = { title: 'Heat', year: '1995', genres: ['crime', 'action'], pool: 'watchlist' }
/** @type {MovieSeed} */
const alien = { title: 'Alien', year: '1979', genres: ['horror', 'sci-fi'], pool: 'watchlist' }
/** @type {MovieSeed} */
const seenHereditary = { title: 'Hereditary', year: '2018', genres: ['horror'], pool: 'watched' }

{
  assert.deepEqual(genresFromOmdb('Horror, Mystery'), ['horror', 'mystery'])
  assert.deepEqual(genresFromOmdb('N/A'), [])
  assert.deepEqual(genresFromOmdb('Sci-Fi'), ['sci-fi'])
}

{
  const rec = parseTasteIntent('Nenn mir Horrorfilme für Filmabend')
  assert.ok(rec && rec.kind === 'recommend')
  assert.equal(rec.ask.genre, 'horror')
  assert.equal(rec.ask.occasion, 'night')
}

{
  const rec = parseTasteIntent('Empfehl mir einen Film')
  assert.ok(rec && rec.kind === 'recommend')
  assert.equal(rec.ask.genre, undefined)
}

{
  const seen = parseTasteIntent('Ich habe Dune geschaut')
  assert.ok(seen && seen.kind === 'seen')
  assert.equal(seen.title, 'Dune')
}

{
  const seen = parseTasteIntent('Watchliste 1 gesehen')
  assert.ok(seen && seen.kind === 'seen')
  assert.equal(seen.index, 1)
}

{
  assert.equal(parseTasteIntent('Spiel Dune Film'), null)
  assert.equal(parseTasteIntent('Wie gut ist Dune'), null)
  assert.equal(parseTasteIntent('Watchliste: Dune'), null)
  assert.equal(parseTasteIntent('Notiz Milch'), null)
}

{
  const profile = buildProfile([dune, arrival], [seenHereditary])
  assert.equal(profile.genreWeight['sci-fi'], FAV_WEIGHT * 2)
  assert.equal(profile.genreWeight['horror'], SEEN_WEIGHT)
  assert.equal(profile.topGenres[0], 'sci-fi')
  assert.ok(profile.watchedKeys.has(movieKey(seenHereditary)))
}

{
  const profile = buildProfile([dune, arrival], [seenHereditary])
  assert.equal(scoreMovie(hereditary, profile, { genre: 'horror', occasion: 'night', limit: 3 }), null)
  const alienScore = scoreMovie(alien, profile, { genre: 'horror', occasion: 'night', limit: 3 })
  assert.ok(alienScore != null)
  assert.ok(alienScore >= FAV_WEIGHT + ASK_WEIGHT + WATCHLIST_NIGHT)
  assert.equal(scoreMovie(heat, profile, { genre: 'horror', occasion: 'night', limit: 3 }), null)
}

{
  const result = recommend({
    ask: { genre: 'horror', occasion: 'night', limit: 3 },
    favorites: [dune, arrival],
    watched: [seenHereditary],
    candidates: [hereditary, heat, alien],
  })
  assert.equal(result.picks.length, 1)
  assert.equal(result.picks[0].movie.title, 'Alien')
  const reply = formatRecommendReply(result, { genre: 'horror', occasion: 'night', limit: 3 })
  assert.match(reply, /Filmabend/)
  assert.match(reply, /Alien/)
  assert.doesNotMatch(reply, /Hereditary/)
}

{
  const result = recommend({
    ask: { genre: 'horror', occasion: 'night', limit: 3 },
    favorites: [dune],
    watched: [],
    candidates: [heat],
  })
  assert.equal(result.picks.length, 0)
  assert.match(result.emptyReason || '', /kein Horror/)
  assert.match(result.emptyReason || '', /erfinde keine/)
}

{
  const hit = applyWatched({ title: 'Dune', watchlist: [dune, hereditary], watched: [] })
  assert.ok(!('missing' in hit))
  assert.equal(hit.movie.title, 'Dune')
  assert.equal(hit.already, false)
}

{
  const miss = applyWatched({ title: 'Arrival', watchlist: [hereditary], watched: [] })
  assert.ok('missing' in miss)
}

{
  const pack = buildWatchedPack([dune, seenHereditary])
  assert.equal(pack.topic, WATCHED_PACK_TOPIC)
  assert.ok(pack.claims.some((c) => /Dune/.test(c.text)))
  assert.ok(pack.claims.some((c) => /Hereditary/.test(c.text)))
  assert.match(pack.summary, /intern/)
}

console.log('test-film-taste ok')
