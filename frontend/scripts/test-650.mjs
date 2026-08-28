import assert from 'node:assert/strict'
import { parseHudIntent } from '../src/engine/hud-parse.ts'
import { cityLine, gazetteerHit, nearestPlace, noCityInViewLine, resolveLookTarget, unknownPlaceLine } from '../src/engine/globe-geo.ts'
import { pickBrain } from '../src/engine/brain-pick.ts'
import { guardPolish } from '../src/engine/polish-guard.ts'
import { gibsStamp, gibsTimeCandidates, globeZoomToTileZ, GIBS_ZOOM_IN } from '../src/engine/globe-gibs.ts'
import { parseGroundIntent } from '../src/engine/ground-parse.ts'
import { memoryBlock } from '../src/engine/memory-block.ts'

assert.equal(parseHudIntent('Zeig mir London')?.kind, 'pin')
assert.equal(parseHudIntent('Zeig mir London')?.name, 'London')
assert.equal(parseHudIntent('Zeig Paris')?.name, 'Paris')
assert.equal(parseHudIntent('flieg nach Berlin')?.name, 'Berlin')
assert.equal(parseHudIntent('zoom auf Tokio')?.name, 'Tokio')
assert.equal(parseHudIntent('Was ist das für eine Stadt?')?.kind, 'look')
assert.equal(parseHudIntent('Was sehe ich?')?.kind, 'look')
assert.equal(parseHudIntent('Zeig mir Atlantis')?.kind, 'unknown_place')
assert.equal(parseHudIntent('Wo liegt der Schlüssel'), null)
assert.equal(parseGroundIntent('Wo liegt der Schlüssel')?.topic, 'desk')
assert.equal(parseHudIntent('zeig mal den körper')?.view, 'body')
assert.equal(parseHudIntent('Wo liegt Berlin')?.kind, 'pin')

const paris = gazetteerHit('Paris')
assert.ok(paris)
assert.ok(paris.blurb.toLowerCase().includes('liebe'))
assert.equal(nearestPlace(48.86, 2.35)?.name, 'Paris')
assert.equal(nearestPlace(0, -30), null)
assert.equal(nearestPlace(51.51, -0.13)?.name, 'London')
assert.ok(cityLine(paris).includes('Paris'))
assert.ok(unknownPlaceLine('Atlantis').includes('Atlantis'))
assert.ok(noCityInViewLine().includes('Meer'))
assert.equal(resolveLookTarget(JSON.stringify({ lat: 0, lon: -30 }), JSON.stringify({ lat: 51.51, lon: -0.13 }))?.lat, 51.51)
assert.equal(resolveLookTarget(JSON.stringify({ lat: 48.86, lon: 2.35 }), JSON.stringify({ lat: 51.51, lon: -0.13 }))?.lat, 48.86)

assert.equal(pickBrain({ gemini: true, groq: true, local: true }), 'gemini')
assert.equal(pickBrain({ gemini: false, groq: true, local: true }), 'groq')
assert.equal(pickBrain({ gemini: false, groq: false, local: true }), 'local')
assert.equal(pickBrain({ gemini: false, groq: false, local: false }), 'none')

assert.equal(
  guardPolish('Das ist Paris, die Stadt der Liebe an der Seine.', 'Das ist Paris, 12 Millionen Einwohner.'),
  'Das ist Paris, die Stadt der Liebe an der Seine.',
)
assert.equal(
  guardPolish('Das ist Paris, die Stadt der Liebe an der Seine.', 'Das ist Paris, die Stadt der Liebe an der Seine.'),
  'Das ist Paris, die Stadt der Liebe an der Seine.',
)
assert.equal(
  guardPolish('Das ist London an der Themse.', 'Das ist Paris, die Stadt der Liebe.'),
  'Das ist London an der Themse.',
)

const dates = gibsTimeCandidates(new Date('2026-08-28T12:00:00Z'))
assert.equal(dates[0], '2026-08-27')
assert.ok(dates.includes('2026-08-28'))
assert.ok(gibsStamp(dates[0]).includes('2026-08-27'))
assert.ok(gibsStamp(dates[0]).includes('Stunden'))
assert.ok(globeZoomToTileZ(GIBS_ZOOM_IN) >= 3)

const mem = memoryBlock(
  [
    { key: 'name', value: 'Alex' },
    { key: 'drink', value: 'Espresso' },
    { key: 'car', value: 'Golf' },
  ],
  'Welchen Drink mag ich?',
)
assert.ok(mem.includes('Espresso'))
assert.equal(mem.includes('Golf'), false)

console.log('ok 6.50 globe brain polish')
