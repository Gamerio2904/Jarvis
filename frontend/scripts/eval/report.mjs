/**
 * Kennzahlen eines Eval-Laufs als Markdown-Tabelle, gegen die Grundlinie.
 *
 * Nach einer Router-Änderung steht hier: vorher, nachher, Differenz. Vorher
 * stand dort „grün".
 *
 *   node scripts/eval/report.mjs            # messen und vergleichen
 *   node scripts/eval/report.mjs --write    # Grundlinie neu setzen
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { evalCases } from '../../src/engine/eval/corpus.ts'
import { measure, measureByTag } from '../../src/engine/eval/metrics.ts'
import { promptBudget } from '../../src/engine/eval/tokens.ts'
import { splitCloudPrompt } from '../../src/engine/prompt-split.ts'
import { PERSONA } from '../../src/engine/persona.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const BASELINE = join(HERE, 'baseline.json')

const cases = evalCases()
const all = measure(cases)
const tags = measureByTag(cases, ['gold', 'lock', 'regress', 'stt'])

/** Der Prompt-Schnitt für einen typischen Sprachzug mit Gedächtnis. */
const split = splitCloudPrompt({
  persona: PERSONA,
  voice: true,
  memory: 'Der Nutzer heißt Max und wohnt in Ingersheim.',
})
const budget = promptBudget(split.system, split.variable)

const now = {
  hitRate: all.hitRate,
  askRate: all.askRate,
  noneRate: all.noneRate,
  byTag: Object.fromEntries(Object.entries(tags).map(([k, m]) => [k, m.hitRate])),
  promptSystemTokens: budget.systemTokens,
  promptVariableTokens: budget.variableTokens,
  cacheableRatio: budget.cacheableRatio,
}

if (process.argv.includes('--write')) {
  writeFileSync(BASELINE, `${JSON.stringify(now, null, 2)}\n`)
  console.log(`Grundlinie geschrieben: ${BASELINE}`)
  process.exit(0)
}

let base = null
try {
  base = JSON.parse(readFileSync(BASELINE, 'utf8'))
} catch {
  console.log('Keine Grundlinie. Einmal mit --write setzen.\n')
}

const pct = (n) => `${(n * 100).toFixed(1)} %`
const diff = (a, b) => (b == null ? '–' : `${a - b >= 0 ? '+' : ''}${((a - b) * 100).toFixed(1)} pp`)

console.log(`## Routing-Kennzahlen (${all.total} Fälle)\n`)
console.log('| Zahl | Grundlinie | Jetzt | Differenz |')
console.log('|------|-----------:|------:|----------:|')
console.log(`| Trefferquote | ${base ? pct(base.hitRate) : '–'} | ${pct(all.hitRate)} | ${diff(all.hitRate, base?.hitRate)} |`)
console.log(`| Rückfrage-Quote | ${base ? pct(base.askRate) : '–'} | ${pct(all.askRate)} | ${diff(all.askRate, base?.askRate)} |`)
console.log(`| Ohne Kandidat | ${base ? pct(base.noneRate) : '–'} | ${pct(all.noneRate)} | ${diff(all.noneRate, base?.noneRate)} |`)

console.log('\n### Je Gruppe\n')
console.log('| Gruppe | Fälle | Grundlinie | Jetzt | Differenz |')
console.log('|--------|------:|-----------:|------:|----------:|')
for (const [tag, m] of Object.entries(tags)) {
  const b = base?.byTag?.[tag]
  console.log(`| ${tag} | ${m.total} | ${b == null ? '–' : pct(b)} | ${pct(m.hitRate)} | ${diff(m.hitRate, b)} |`)
}

console.log('\n### Entscheidungszeit (offline, nicht der Zug auf dem Gerät)\n')
console.log(`p50 ${all.p50.toFixed(3)} ms · p95 ${all.p95.toFixed(3)} ms`)

console.log('\n### Prompt-Kosten je Zug\n')
console.log('| Zahl | Grundlinie | Jetzt |')
console.log('|------|-----------:|------:|')
console.log(`| Fester Vorspann (Tokens) | ${base?.promptSystemTokens ?? '–'} | ${budget.systemTokens} |`)
console.log(`| Wechselnder Teil (Tokens) | ${base?.promptVariableTokens ?? '–'} | ${budget.variableTokens} |`)
console.log(`| Cachebar | ${base ? pct(base.cacheableRatio) : '–'} | ${pct(budget.cacheableRatio)} |`)

if (all.confusions.length) {
  console.log('\n### Verwechslungen (Top 10)\n')
  console.log('| erwartet | gewählt | Fälle |')
  console.log('|----------|---------|------:|')
  for (const c of all.confusions.slice(0, 10)) console.log(`| ${c.want} | ${c.got} | ${c.n} |`)
}

/** Harte Grenzen: eine Verschlechterung beendet den Lauf mit Fehlercode. */
const broken = []
if (base) {
  const EPS = 1e-9
  if (all.hitRate < base.hitRate - EPS) broken.push(`Trefferquote gefallen: ${pct(base.hitRate)} → ${pct(all.hitRate)}`)
  if (all.askRate > base.askRate + EPS) broken.push(`Rückfrage-Quote gestiegen: ${pct(base.askRate)} → ${pct(all.askRate)}`)
  if (all.noneRate > base.noneRate + EPS) broken.push(`Ohne Kandidat gestiegen: ${pct(base.noneRate)} → ${pct(all.noneRate)}`)
  if (budget.systemTokens + budget.variableTokens > base.promptSystemTokens + base.promptVariableTokens)
    broken.push('Prompt ist länger geworden — das kostet Kontingent.')
  for (const [tag, m] of Object.entries(tags)) {
    const b = base.byTag?.[tag]
    if (b != null && m.hitRate < b - EPS) broken.push(`Gruppe ${tag} gefallen: ${pct(b)} → ${pct(m.hitRate)}`)
  }
}

if (broken.length) {
  console.log(`\nRückschritt:\n  ${broken.join('\n  ')}`)
  process.exitCode = 1
} else {
  console.log('\nkein Rückschritt gegen die Grundlinie')
}
