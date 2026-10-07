export const ROUTING_DATASET_SCHEMA = 'jarvis-routing-gold-v1'

const PERSONAL_DATA = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:AIza[0-9A-Za-z_-]{20,}|gsk_[0-9A-Za-z]{16,}|sk-[0-9A-Za-z]{16,})\b/,
  /\b(?:matrikelnummer|kundennummer|kontonummer|telefonnummer)\s*(?:ist|:)?\s*\d{4,}/i,
  /\b\+?\d[\d ()/-]{8,}\d\b/,
  /\bich\s+heiße\s+[A-ZÄÖÜ][a-zäöüß-]{1,}/,
]

function normalized(text) {
  return text.toLocaleLowerCase('de-DE').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function similarity(left, right) {
  const a = new Set(normalized(left).split(/\s+/).filter(Boolean))
  const b = new Set(normalized(right).split(/\s+/).filter(Boolean))
  if (!a.size || !b.size) return 0
  let shared = 0
  for (const token of a) if (b.has(token)) shared += 1
  return shared / (a.size + b.size - shared)
}

export function validateReviewedCases(cases) {
  const errors = []
  const seen = new Map()
  for (const [index, row] of cases.entries()) {
    const where = `case ${index + 1}`
    if (!row || typeof row.text !== 'string' || !row.text.trim()) errors.push(`${where}: empty text`)
    if (!row || typeof row.expect !== 'string' || !row.expect.trim()) errors.push(`${where}: missing target`)
    if (!row || !Array.isArray(row.tags) || row.tags.some((tag) => typeof tag !== 'string')) {
      errors.push(`${where}: invalid tags`)
    }
    if (!row || typeof row.source !== 'string' || !row.source.trim()) errors.push(`${where}: missing provenance`)
    if (typeof row?.text !== 'string') continue
    const key = normalized(row.text)
    const prior = seen.get(key)
    if (prior && prior.expect !== row.expect) errors.push(`${where}: conflicting label with ${prior.source}`)
    else if (!prior) seen.set(key, { expect: row.expect, source: where })
    if (PERSONAL_DATA.some((pattern) => pattern.test(row.text))) errors.push(`${where}: personal data pattern`)
    for (const other of cases.slice(0, index)) {
      if (other.expect !== row.expect && similarity(row.text, other.text) >= 0.85) {
        errors.push(`${where}: near-duplicate crosses route labels`)
        break
      }
    }
  }
  return errors
}

export function withReviewedVariants(cases, variants) {
  const baseByText = new Map(cases.map((row) => [normalized(row.text), row]))
  const additions = variants.map((variant, index) => {
    const parent = baseByText.get(normalized(variant.parentText))
    if (!parent) throw new Error(`Variant ${index + 1} has no reviewed parent case.`)
    if (!variant.text?.trim() || normalized(variant.text) === normalized(parent.text)) {
      throw new Error(`Variant ${index + 1} is empty or duplicates its parent.`)
    }
    return {
      text: variant.text.trim(),
      expect: parent.expect,
      tags: [...parent.tags],
      source: `reviewed-variant:${parent.source}`,
      family: normalized(parent.text),
    }
  })
  return [
    ...cases.map((row) => ({ ...row, family: normalized(row.text) })),
    ...additions,
  ]
}

export function splitByFamily(cases, testRatio = 0.2) {
  if (!(testRatio > 0 && testRatio < 1)) throw new Error('testRatio must be between 0 and 1.')
  const families = [...new Set(cases.map((row) => row.family || normalized(row.text)))]
  const testFamilies = new Set(families.filter((_, index) => index % Math.round(1 / testRatio) === 0))
  return {
    train: cases.filter((row) => !testFamilies.has(row.family || normalized(row.text))),
    test: cases.filter((row) => testFamilies.has(row.family || normalized(row.text))),
  }
}

export function trainingJsonl(cases) {
  const issues = validateReviewedCases(cases)
  if (issues.length) throw new Error(`Dataset blocked: ${issues.join('; ')}`)
  return cases.map(({ text, expect }) => JSON.stringify({ text, label: expect })).join('\n')
}

export function routeCounts(results) {
  const counts = new Map()
  for (const row of results) {
    const stats = counts.get(row.expect) || { total: 0, correct: 0, incorrect: 0, unclear: 0 }
    stats.total += 1
    if (row.actual === 'ask' || row.actual === 'none') stats.unclear += 1
    else if (row.actual === row.expect) stats.correct += 1
    else stats.incorrect += 1
    counts.set(row.expect, stats)
  }
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)))
}
