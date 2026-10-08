import assert from 'node:assert/strict'
import {
  ROUTING_DATASET_SCHEMA,
  partitionTrainingCases,
  routeCounts,
  routeReport,
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
assert.throws(() => splitByFamily(dataset.slice(0, 1)), /two distinct case families/)
assert.throws(() => withReviewedVariants(base, [{ parentText: base[0].text, text: base[1].text }]), /duplicates/)
assert.throws(() => trainingJsonl([{ ...base[0], text: 'Matrikelnummer 12345678' }]), /blocked/)
const privatePartition = partitionTrainingCases([
  ...base,
  { text: 'Kontakt Telefon 01711234567', expect: 'maps', tags: ['gold'], source: 'synthetic-contact' },
])
assert.equal(privatePartition.eligible.length, 2)
assert.equal(privatePartition.excluded.length, 1)
assert.equal(privatePartition.excluded[0].source, 'synthetic-contact')
assert.doesNotMatch(trainingJsonl(privatePartition.eligible), /01711234567/)
assert.throws(() => withReviewedVariants(base, [{ parentText: 'unknown', text: 'variant' }]), /no reviewed parent/)
assert.ok(validateReviewedCases([{ ...base[0], expect: 'not-a-real-route' }]).some((line) => /unknown or missing target/.test(line)))
assert.ok(validateReviewedCases([{ ...base[0], tags: [] }]).some((line) => /invalid tags/.test(line)))

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
assert.deepEqual(routeReport([
  { expect: 'ask', actual: 'shopping' },
  { expect: 'shopping', actual: 'ask' },
  { expect: 'shopping', actual: 'shopping' },
]).falseActionCount, 1)
assert.equal(routeReport([{ expect: 'ask', actual: 'llm' }]).falseActionCount, 0)
assert.equal(routeReport([{ expect: 'none', actual: 'research' }]).falseActionCount, 1)
assert.match(trainingJsonl(base).split('\n')[0], /"schema":"jarvis-routing-gold-v1"/)

console.log('test:dataset-governance ok')
