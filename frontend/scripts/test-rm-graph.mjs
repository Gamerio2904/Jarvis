import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RM_NAMED_EDGES, RM_SKILLS } from '../src/engine/rm-dossier.ts'
import {
  buildRmGraph,
  characterById,
  dossierFor,
  episodeByCode,
  parseEpisodeCode,
  searchCharacters,
  sharedCount,
  staffelFolge,
} from '../src/engine/rm-graph.ts'

const here = dirname(fileURLToPath(import.meta.url))
const snap = JSON.parse(readFileSync(join(here, '../src/data/rm-snapshot.json'), 'utf8'))
const lage = readFileSync(join(here, '../src/ui/lage/Lage.tsx'), 'utf8')
const app = readFileSync(join(here, '../src/App.tsx'), 'utf8')
const hudParse = readFileSync(join(here, '../src/engine/hud-parse.ts'), 'utf8')

const graph = buildRmGraph()
assert.equal(graph.characters.length, 826, 'jeder API-Charakter ist ein Knoten')
assert.equal(graph.episodes.length, 51)
assert.equal(graph.dots.length, 826)
assert.equal(new Set(graph.dots.map((d) => d.id)).size, 826, 'keine doppelten Knoten')
assert.equal(graph.empty, false)

for (const [id, skills] of Object.entries(RM_SKILLS)) {
  assert.ok(characterById(Number(id)), `Skill-ID fehlt in der API: ${id}`)
  for (const s of skills) {
    assert.ok(episodeByCode(s.code), `Skill-Folge nicht in der API: ${s.code} (${s.name})`)
  }
}

for (const e of RM_NAMED_EDGES) {
  assert.ok(characterById(e.a), `Kante von unbekannter ID ${e.a}`)
  assert.ok(characterById(e.b), `Kante zu unbekannter ID ${e.b}`)
  assert.notEqual(e.a, e.b)
  for (const code of e.codes) assert.ok(episodeByCode(code), `Kanten-Folge fehlt: ${code}`)
}

const rick = dossierFor(1)
assert.ok(rick)
assert.equal(rick.name, 'Rick Sanchez')
assert.equal(rick.traits.find((t) => t.label === 'Rasse')?.value, 'Human')
assert.ok(rick.skills.some((s) => s.name === 'Persönlicher Schild' && s.evidence.code === 'S03E05'))
assert.equal(
  rick.skills.some((s) => s.name.includes('Schild') && s.evidence.code === 'S05E05'),
  false,
  'S05E05 ist Amortycan Grickfitti, kein Schild',
)
assert.equal(staffelFolge('S03E05'), 'Staffel 3 Folge 5')
assert.deepEqual(parseEpisodeCode('S05E05'), { season: 5, episode: 5 })
assert.equal(episodeByCode('S05E05')?.name, 'Amortycan Grickfitti')
assert.ok(rick.neighbors.some((n) => n.id === 2 && n.kind === 'family'))
assert.ok(sharedCount(1, 2) >= 40)
assert.equal(rick.appearanceCount, 51)

const extra = dossierFor(12)
assert.ok(extra)
assert.equal(extra.skills.length, 0, 'Nebenfigur ohne kuratierte Fähigkeit bleibt leer')
assert.ok(extra.appearanceCount >= 1)

assert.ok(searchCharacters('evil morty').some((c) => c.id === 118))
assert.deepEqual(searchCharacters(''), [])

assert.match(hudParse, /view: 'serie'/)
assert.match(hudParse, /rick\\s\*\(\?:and\|&\|und\)\\s\*morty/)
assert.match(hudParse, /charakter\[- \]\?netz/)

assert.match(lage, /\['serie', 'Serie'\]/)
assert.match(lage, /SerieMapCanvas/)
assert.match(lage, /SerieDossier/)
assert.match(app, /cur === 'body' \|\| cur === 'globe' \|\| cur === 'serie'/)

assert.match(snap.meta.source, /rickandmortyapi/)
assert.equal(snap.meta.coverage, 'S01–S05')

console.log('test-rm-graph ok — 826 Knoten, belegte Skills, Parser Serie')
