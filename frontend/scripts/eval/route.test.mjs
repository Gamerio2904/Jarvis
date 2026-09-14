/**
 * Bewertungslauf über den Korpus.
 *
 * Anders als die älteren Skripte bricht hier **nicht** der erste Fehler den
 * Lauf ab: jeder Fall ist ein eigener `test()`, am Ende stehen alle Fehler
 * einzeln benannt. Genau der blinde Fleck, der beim Audit für 16.1.0 eine
 * ganze Datei verdeckte.
 */
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { casesWithTag, evalCases } from '../../src/engine/eval/corpus.ts'
import { HARD_TAGS } from '../../src/engine/eval/types.ts'
import { decisionForEval, PRE_ROUTER, routeForEval } from '../../src/engine/eval/route-eval.ts'
import { STT_FLOOR } from '../../src/engine/eval/baseline.ts'

const cases = evalCases()
const hard = cases.filter((c) => c.tags.some((t) => HARD_TAGS.includes(t)))

describe('Korpus', () => {
  test('kein Prompt doppelt', () => {
    const seen = new Set()
    for (const c of cases) {
      assert.equal(seen.has(c.text), false, `doppelt: ${JSON.stringify(c.text)}`)
      seen.add(c.text)
    }
  })

  test('jeder Fall trägt Herkunft und Gruppe', () => {
    for (const c of cases) {
      assert.ok(c.source, `ohne Herkunft: ${JSON.stringify(c.text)}`)
      assert.ok(c.tags.length > 0, `ohne Gruppe: ${JSON.stringify(c.text)}`)
    }
  })
})

describe('Routing (hart)', () => {
  for (const c of hard) {
    test(`${c.expect} ← ${c.text}`, () => {
      assert.equal(routeForEval(c.text), c.expect)
    })
  }
})

describe('Keine Rückfrage auf dokumentierte Prompts', () => {
  for (const c of hard) {
    if (PRE_ROUTER.has(c.expect)) continue
    test(c.text, () => {
      const pick = decisionForEval(c.text)
      assert.notEqual(
        pick.kind,
        'ask',
        pick.kind === 'ask' ? `fragt ${pick.a} oder ${pick.b} statt zu handeln` : '',
      )
    })
  }
})

/**
 * Verhörer werden **gemessen**, nicht erzwungen. Diese Gruppe darf schlechter
 * sein als `gold` — sie darf nur nicht schlechter werden.
 */
describe('Sprachmodus (Quote)', () => {
  const stt = casesWithTag('stt')
  const hits = stt.filter((c) => routeForEval(c.text) === c.expect)
  const rate = stt.length ? hits.length / stt.length : 1

  test(`Trefferquote ${(rate * 100).toFixed(1)} % (Grundlinie ${(STT_FLOOR * 100).toFixed(0)} %)`, () => {
    const misses = stt
      .filter((c) => routeForEval(c.text) !== c.expect)
      .map((c) => `  ${c.expect} erwartet, ${routeForEval(c.text)} bekommen ← ${JSON.stringify(c.text)}`)
    assert.ok(
      rate >= STT_FLOOR,
      `Verhörer-Quote ${(rate * 100).toFixed(1)} % unter Grundlinie ${(STT_FLOOR * 100).toFixed(0)} %:\n${misses.join('\n')}`,
    )
    if (misses.length) console.log(`\n  offen (kein Fehler, nur Stand):\n${misses.join('\n')}\n`)
  })
})
