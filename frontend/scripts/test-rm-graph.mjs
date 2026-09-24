import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { RM_NAMED_EDGES, RM_SKILLS } from '../src/engine/rm-dossier.ts'
import {
  appearanceBand,
  buildRmGraph,
  characterById,
  dossierFor,
  episodeByCode,
  layoutRmDots,
  parseEpisodeCode,
  searchCharacters,
  searchHitLabel,
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

assert.equal(appearanceBand(12), 0)
assert.equal(appearanceBand(8), 0)
assert.equal(appearanceBand(5), 1)
assert.equal(appearanceBand(3), 2)
assert.equal(appearanceBand(2), 3)
assert.equal(appearanceBand(1), 4)
const dots = layoutRmDots()
const dist = (id) => {
  const p = dots.find((d) => d.id === id)
  assert.ok(p, `Punkt fehlt: ${id}`)
  return Math.hypot(p.x, p.y)
}
const familyR = [1, 2, 3, 4, 5].map(dist)
assert.ok(Math.max(...familyR) < 0.16, 'Familie sitzt im inneren Kreis')
const jessica = snap.characters.find((c) => c.name === 'Jessica' && c.eps.length >= 10)
assert.ok(jessica)
const oneShot = snap.characters.find((c) => c.eps.length === 1 && ![1, 2, 3, 4, 5].includes(c.id))
assert.ok(oneShot)
assert.ok(Math.max(...familyR) < dist(jessica.id), 'Familie innen vor Regulars')
assert.ok(dist(jessica.id) < dist(oneShot.id), 'mehr Auftritte näher am Zentrum')
const far = dots.filter((d) => ![1, 2, 3, 4, 5].includes(d.id) && (characterById(d.id)?.eps.length || 0) === 1)
assert.ok(far.length > 100)
assert.ok(
  Math.max(...familyR) < Math.min(...far.map((d) => Math.hypot(d.x, d.y))),
  'Einmal-Auftritte liegen außen',
)

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
const rickHits = searchCharacters('Rick Sanchez')
assert.ok(rickHits.length >= 4)
assert.equal(rickHits[0].id, 1)
assert.equal(searchHitLabel(rickHits[0], rickHits), 'Rick Sanchez · Earth (C-137)')
assert.ok(searchHitLabel(rickHits[1], rickHits).startsWith('Rick Sanchez · '))
assert.equal(searchHitLabel(characterById(2), searchCharacters('Morty Smith')).includes('·'), true)

assert.match(readFileSync(join(here, '../src/engine/settings-schema.ts'), 'utf8'), /hud_view: \['tiles', 'body', 'globe', 'serie'\]/)
assert.match(hudParse, /view: 'serie'/)
assert.match(hudParse, /rick\\s\*\(\?:and\|&\|und\)\\s\*morty/)
assert.match(hudParse, /charakter\[- \]\?netz/)

assert.match(lage, /\['serie', 'Serie'\]/)
assert.match(lage, /SerieMapCanvas/)
assert.match(lage, /SerieDossier/)
assert.match(lage, /searchCharacters\(serieQuery\)/)
assert.match(lage, /searchHitLabel/)
assert.match(lage, /serie-hit-ava/)
assert.match(app, /cur === 'body' \|\| cur === 'globe' \|\| cur === 'serie'/)

const canvas = readFileSync(join(here, '../src/ui/lage/SerieMapCanvas.tsx'), 'utf8')
const dossierUi = readFileSync(join(here, '../src/ui/lage/SerieDossier.tsx'), 'utf8')
const css = readFileSync(join(here, '../src/index.css'), 'utf8')
assert.match(canvas, /serie-face/)
assert.match(canvas, /serie-faces/)
assert.match(canvas, /rmAvatar/)
assert.match(canvas, /dataset.faces/)
assert.match(canvas, /dataset.nodes/)
assert.match(canvas, /img.src = rmAvatar/)
assert.doesNotMatch(canvas, /enqueueFace/)
assert.doesNotMatch(canvas, /rickandmortyapi.com\/api\/character\/avatar/)
assert.match(css, /\.serie-face \{[\s\S]*border-radius: 50%/)
assert.match(css, /\.serie-dossier-photo img/)
assert.match(dossierUi, /serie-dossier-photo/)
assert.match(dossierUi, /width=\{300\}/)
assert.equal(rick.image, '/rm-avatars/1.jpeg')
const avaDir = join(here, '../public/rm-avatars')
const avas = readdirSync(avaDir).filter((n) => /^\d+\.jpeg$/.test(n))
assert.equal(avas.length, 826, 'alle Avatare liegen lokal')
assert.ok(existsSync(join(avaDir, '1.jpeg')))
assert.ok(existsSync(join(avaDir, '826.jpeg')))

assert.match(snap.meta.source, /rickandmortyapi/)
assert.equal(snap.meta.coverage, 'S01–S05')

console.log('test-rm-graph ok — 826 Knoten, belegte Skills, Parser Serie')
