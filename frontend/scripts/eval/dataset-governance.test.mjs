import assert from 'node:assert/strict'
import {
  ROUTING_DATASET_SCHEMA,
  routeCounts,
  splitByFamily,
  trainingJsonl,
  validateReviewedCases,
  withReviewedVariants,
} from './dataset-governance.mjs'

const base = [
  { text: 'Milch auf die Einkaufsliste', expect: 'shopping', tags: ['gold'], source: 'test-shopping' },
  { text: 'Notiz: WLAN steht am Router', expect: 'tools', tags: ['gold'], source: 'test-notes' },
]
assert.equal(ROUTING_DATASET_SCHEMA, 'jarvis-routing-gold-v1')
assert.deepEqual(validateReviewedCases(base), [])
assert.deepEqual(validateReviewedCases([...base, { ...base[0], source: 'other-provenance' }]), [])
assert.ok(validateReviewedCases([...base, { ...base[0], expect: 'llm' }]).some((line) => /conflicting label/.test(line)))

const dataset = withReviewedVariants(base, [
  { parentText: base[0].text, text: 'Bitte Milch zur Einkaufsliste hinzufügen.' },
])
assert.equal(dataset[2].expect, base[0].expect)
assert.equal(dataset[2].family, dataset[0].family)
const split = splitByFamily(dataset, 0.5)
assert.equal(split.train.some((row) => split.test.some((other) => row.family === other.family)), false)
assert.throws(() => trainingJsonl([{ ...base[0], text: 'Matrikelnummer 12345678' }]), /blocked/)
assert.throws(() => withReviewedVariants(base, [{ parentText: 'unknown', text: 'variant' }]), /no reviewed parent/)

assert.deepEqual(
  routeCounts([
    { expect: 'shopping', actual: 'shopping' },
    { expect: 'shopping', actual: 'tools' },
    { expect: 'tools', actual: 'ask' },
  ]),
  {
    shopping: { total: 2, correct: 1, incorrect: 1, unclear: 0 },
    tools: { total: 1, correct: 0, incorrect: 0, unclear: 1 },
  },
)

console.log('test:dataset-governance ok')
