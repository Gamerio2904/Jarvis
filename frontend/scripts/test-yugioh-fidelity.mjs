import assert from 'node:assert/strict'
import test from 'node:test'
import { deckEffectCoverage, effectFromDescription, EFFECT_SCHEMA_VERSION } from '../src/engine/yugioh-duel.ts'
import { cardFidelityMatch, goldFidelityCases, parsePsctAtoms } from '../src/engine/yugioh-psct.ts'
import { resolveEffectSchema } from '../src/engine/yugioh-effects.ts'

test('PSCT erkennt OPT/HOPT', () => {
  const atoms = parsePsctAtoms('Once per turn: You can draw 1 card. You can only use this effect of "X" once per turn.')
  assert.equal(atoms.oncePerTurn, true)
  assert.equal(atoms.hardOncePerTurn, true)
})

test('Gold-Kartenfälle stimmen mit Parser überein', () => {
  for (const sample of goldFidelityCases()) {
    const parsed = effectFromDescription(sample.description)
    assert.equal(cardFidelityMatch(parsed, sample.expectedKind), true, sample.description)
  }
})

test('Fail-closed für nicht unterstützte OPT-Effekte', () => {
  const schema = resolveEffectSchema('Once per turn, you can shuffle your hand.', { kind: 'spell', subtype: 'Normal', type: 'Spell Card' })
  assert.equal(schema?.failClosed, true)
  assert.equal(effectFromDescription('Once per turn, you can shuffle your hand.'), null)
})

test('Deck-Coverage-Metrik Schema v2', () => {
  const deck = [
    { id: 1, name: 'A', type: 'Effect Monster', kind: 'monster', effect: { kind: 'draw', amount: 1 } },
    { id: 2, name: 'B', type: 'Normal Monster', kind: 'monster' },
    { id: 3, name: 'C', type: 'Spell Card', kind: 'spell', effect: { kind: 'damage', amount: 500 } },
  ]
  const report = deckEffectCoverage(deck)
  assert.equal(report.schemaVersion, EFFECT_SCHEMA_VERSION)
  assert.ok(report.ratio >= 0.5)
})
