import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import 'fake-indexeddb/auto'
import { PKG_VERSION, versionCodeOf } from './app-version.mjs'

if (!globalThis.localStorage) {
  const mem = new Map()
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => void mem.set(String(k), String(v)),
    removeItem: (k) => mem.delete(k),
    clear: () => mem.clear(),
    key: (i) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size
    },
  }
}

const { APP_VERSION } = await import('../src/engine/store.ts')
const { parseRmEpisodeStamp, parseRmSceneIntent, formatRmCode } = await import('../src/engine/rm-scene-parse.ts')
const { matchSceneCharacter, handleRmScene } = await import('../src/engine/rm-scene.ts')
const { addRmSceneSkill, forgetRmSceneSkills, listRmSceneSkills } = await import('../src/engine/rm-scene-store.ts')
const { applySceneSkills, dossierFor, evidence, evidenceLoose, hasAnySkill } = await import('../src/engine/rm-graph.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { GOLD_EXPECT } = await import('../src/engine/eval/corpus.ts')
const { TEST_PROMPTS } = await import('../src/engine/test-prompts.ts')
const { allTestCopyTexts, PROBE_COPY_GROUPS } = await import('../src/engine/test-copy.ts')

const here = dirname(fileURLToPath(import.meta.url))
const docSrc = readFileSync(join(here, '../src/engine/doc.ts'), 'utf8')
const dossierUi = readFileSync(join(here, '../src/ui/lage/SerieDossier.tsx'), 'utf8')

assert.equal(APP_VERSION, PKG_VERSION)
assert.notEqual(APP_VERSION, '18.5.0')
assert.ok(versionCodeOf(APP_VERSION) >= 181200)
assert.equal(versionCodeOf('18.12.0'), 181200)
assert.ok(versionCodeOf('18.12.0') > versionCodeOf('18.10.0'))

assert.equal(formatRmCode(6, 3), 'S06E03')
assert.deepEqual(parseRmEpisodeStamp('Staffel 6 Folge 3'), { season: 6, episode: 3, code: 'S06E03' })
assert.deepEqual(parseRmEpisodeStamp('S07E02 Fähigkeiten'), { season: 7, episode: 2, code: 'S07E02' })
assert.equal(parseRmSceneIntent('Staffel 6 Folge 3')?.kind, 'write')
assert.equal(parseRmSceneIntent('S06E04')?.kind, 'write')
assert.equal(parseRmSceneIntent('Welche Kamera-Fähigkeiten habe ich?')?.kind, 'recall')
assert.equal(parseRmSceneIntent('Vergiss die Kamera-Fähigkeiten')?.kind, 'forget')
assert.equal(parseRmSceneIntent('Staffel 3 Folge 5'), null)
assert.equal(parseRmSceneIntent('Staffel 3 Folge 5 Fähigkeiten')?.kind, 'write')
assert.equal(parseRmSceneIntent('Zutaten von Nutella'), null)
assert.equal(parseRmSceneIntent('Suche im Internet nach Carbonara-Rezept'), null)

assert.equal(matchSceneCharacter('Rick')?.id, 1)
assert.equal(matchSceneCharacter('Morty')?.id, 2)
assert.equal(matchSceneCharacter('Evil Morty')?.id, 118)
assert.equal(matchSceneCharacter('Glas ohne Etikett'), null)

assert.equal(evidence('S06E01'), null)
const loose = evidenceLoose('S06E03', 'Sichtbar auf dem Foto.')
assert.ok(loose)
assert.equal(loose.code, 'S06E03')
assert.equal(loose.title, 'laut Nutzer')
assert.equal(loose.season, 6)
assert.doesNotMatch(loose.title, /Solaricks|wiki/i)

applySceneSkills([
  { characterId: 1, characterName: 'Rick Sanchez', name: 'Neue Portal-Variante', code: 'S06E01', note: 'Sichtbar auf dem Foto.' },
])
const rick = dossierFor(1)
assert.ok(rick.skills.some((s) => s.name === 'Neue Portal-Variante' && s.origin === 'camera' && s.evidence.code === 'S06E01'))
assert.ok(hasAnySkill(1))
applySceneSkills([])

const row = await addRmSceneSkill({
  characterId: 2,
  characterName: 'Morty Smith',
  name: 'Test-Fähigkeit',
  code: 'S06E03',
  note: 'Sichtbar auf dem Foto.',
})
assert.equal(row.code, 'S06E03')
const listed = await listRmSceneSkills('S06E03')
assert.ok(listed.some((r) => r.name === 'Test-Fähigkeit'))
assert.equal(await forgetRmSceneSkills('S06E03'), 1)
assert.equal((await listRmSceneSkills('S06E03')).length, 0)

const noPhoto = await handleRmScene('rm-scene-test', 'Staffel 6 Folge 3')
assert.match(noPhoto.reply || '', /Foto-Knopf/)
assert.doesNotMatch(noPhoto.reply || '', /Portalgun|Wiki|erfunden/)
const tooOld = await handleRmScene('rm-scene-test', 'Staffel 3 Folge 5 Fähigkeiten')
assert.match(tooOld.reply || '', /ab Staffel 6/)

assert.equal(pickRoute('Staffel 6 Folge 3'), 'hud')
assert.equal(pickRoute('Welche Kamera-Fähigkeiten habe ich?'), 'hud')
assert.equal(pickRoute('Lies das Foto'), 'eye')
assert.equal(GOLD_EXPECT['Staffel 6 Folge 3'], 'hud')
assert.deepEqual(Object.keys(GOLD_EXPECT).sort(), [...TEST_PROMPTS].sort())
for (const p of TEST_PROMPTS) assert.ok(allTestCopyTexts().includes(p), p)
assert.equal(PROBE_COPY_GROUPS.length, 13)
assert.match(docSrc, /saveLastEyeImage/)
assert.match(dossierUi, /Kamera/)

console.log(`test:rm-scene ok — Kamera-Fähigkeiten S6+ (${APP_VERSION})`)
