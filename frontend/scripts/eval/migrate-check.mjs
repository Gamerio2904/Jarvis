// @ts-nocheck — Sprint 279: Altbestand (Mocks). Neue Skripte ohne diese Zeile.
/**
 * Migrationsprüfung: der alte Korpus muss vollständig im neuen stecken.
 *
 * Abbruchkriterium aus Sprint 249: findet dieses Skript einen Prompt, der
 * vorher geprüft wurde und jetzt fehlt, ist die Zusammenführung unvollständig.
 */
import assert from 'node:assert/strict'
import { GOLD_EXPECT, LOCK_EXPECT, LOCK_HUD, evalCases } from '../../src/engine/eval/corpus.ts'
import { PRE_ROUTER } from '../../src/engine/eval/route-eval.ts'
import { TEST_PROMPTS } from '../../src/engine/test-prompts.ts'
import { agentCatalog } from '../../src/engine/agents/catalog.ts'

const cases = evalCases()
const texts = new Set(cases.map((c) => c.text))

/** Jeder Chip der Test-Oberfläche hat eine Erwartung. */
const missing = TEST_PROMPTS.filter((p) => !(p in GOLD_EXPECT))
assert.equal(missing.length, 0, `Chips ohne Erwartung: ${missing.join(' | ')}`)

/** Und keine Erwartung ohne Chip — tote Einträge driften unbemerkt ab. */
const dead = Object.keys(GOLD_EXPECT).filter((p) => !TEST_PROMPTS.includes(p))
assert.equal(dead.length, 0, `tote Erwartungen: ${dead.join(' | ')}`)

/** Die Lock-Matrix ist vollständig übernommen. */
for (const p of Object.keys(LOCK_EXPECT)) {
  assert.ok(texts.has(p), `Lock-Prompt fehlt im Korpus: ${JSON.stringify(p)}`)
}
for (const p of Object.keys(LOCK_HUD)) {
  assert.ok(LOCK_EXPECT[p], `Lock-HUD ohne Routing-Erwartung: ${JSON.stringify(p)}`)
}

/**
 * Jede Erwartung zeigt auf einen Agenten, den es gibt. Ein Tippfehler im
 * Korpus wäre sonst ein Fall, der nie zutreffen kann.
 */
const known = new Set([...agentCatalog().map((a) => a.id), ...PRE_ROUTER, 'tools'])
const unknown = [...new Set(cases.map((c) => c.expect))].filter((id) => !known.has(id))
assert.equal(unknown.length, 0, `Erwartung ohne Agent im Katalog: ${unknown.join(', ')}`)

const byTag = {}
for (const c of cases) for (const t of c.tags) byTag[t] = (byTag[t] || 0) + 1

console.log(`ok Korpus: ${cases.length} Fälle`)
for (const [tag, n] of Object.entries(byTag).sort()) console.log(`   ${tag.padEnd(8)} ${n}`)
