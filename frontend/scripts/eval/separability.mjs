/**
 * S257-9 — der Test, der vor der Arbeit kommt.
 *
 * Sprint 257 will die Reihenfolge bei mehreren gleich starken Kandidaten über
 * Ähnlichkeit zu Intent-Zentroiden entscheiden. Bevor dafür ein Modell in den
 * Build kommt, beantwortet dieses Skript zwei Fragen mit Zahlen:
 *
 *   1. Wie oft tritt der Fall überhaupt ein? (Zensus)
 *   2. Liegen Äußerungen desselben Agenten näher beieinander als Äußerungen
 *      verschiedener Agenten? (Trennschärfe)
 *
 * Die Trennschärfe wird hier mit einem **lexikalischen** Vektor gemessen:
 * Zeichen-Trigramme und Wörter, TF-IDF, Kosinus. Das ist absichtlich die
 * billigste denkbare Einbettung und damit eine **Untergrenze** — ein echtes
 * `multilingual-e5-small` liegt darüber, aber nicht beliebig weit, weil beide
 * dieselbe Information sehen: 30 bis 60 Zeichen deutscher Alltagssprache.
 * Für die Entscheidung „lohnt sich 120 MB Modell" reicht die Untergrenze,
 * sobald der Zensus zeigt, wie selten der Fall ist.
 *
 *   node scripts/eval/separability.mjs
 */
import { evalCases } from '../../src/engine/eval/corpus.ts'
import { AMBIG_PROBES } from '../../src/engine/eval/ambig-probes.ts'
import { PRE_ROUTER, routeCtx, routeForEval } from '../../src/engine/eval/route-eval.ts'
import { decideTurn } from '../../src/engine/route-pick.ts'
import { SCORE_MARGIN, SCORE_MIN, tieRank } from '../../src/engine/policy.ts'

const TIE_EPS = 1e-6

function ranked(candidates) {
  return candidates
    .filter((c) => (c.base ?? c.score) >= SCORE_MIN)
    .sort((a, b) => b.score - a.score || tieRank(a.id) - tieRank(b.id) || a.id.localeCompare(b.id))
}

/**
 * Zensus: wie oft wird der ambige Pfad erreicht, den 257 verbessern will.
 *
 * Gezählt wird auf der Entscheidung, die der Director trifft (`decideTurn`),
 * und „ohne Agenten" auf der **ganzen** Kette — Hilfe, Rabatt und Ordinal
 * werden vor dem Router entschieden und wären hier sonst falsche Löcher.
 */
function census(texts) {
  const out = { total: texts.length, ask: 0, none: 0, run: 0, nearTie: 0, exactTie: 0, examples: [] }
  for (const text of texts) {
    const { pick, candidates } = decideTurn(routeCtx(text))
    out[pick.kind] += 1
    // Vor dem Router entschieden (Hilfe, Rabatt, Ordinal) ist kein Loch.
    if (pick.kind === 'none' && routeForEval(text) !== 'llm') out.none -= 1
    const list = ranked(candidates)
    if (list.length < 2) continue
    const margin = (list[0].base ?? list[0].score) - (list[1].base ?? list[1].score)
    if (Math.abs(list[0].score - list[1].score) <= TIE_EPS) out.exactTie += 1
    if (margin < SCORE_MARGIN) {
      out.nearTie += 1
      out.examples.push({ text, a: list[0].id, b: list[1].id, margin, kind: pick.kind })
    }
  }
  return out
}

// ------------------------------------------------------------ Einbettung

function features(text) {
  const t = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `
  const bag = new Map()
  const add = (k) => bag.set(k, (bag.get(k) ?? 0) + 1)
  for (const w of t.split(/\s+/).filter(Boolean)) add(`w:${w}`)
  for (let i = 0; i + 3 <= t.length; i += 1) add(`c:${t.slice(i, i + 3)}`)
  return bag
}

function idfOver(docs) {
  const df = new Map()
  for (const bag of docs) for (const k of bag.keys()) df.set(k, (df.get(k) ?? 0) + 1)
  const idf = new Map()
  for (const [k, n] of df) idf.set(k, Math.log((docs.length + 1) / (n + 0.5)))
  return idf
}

function vectorize(bag, idf) {
  const vec = new Map()
  let norm = 0
  for (const [k, n] of bag) {
    const w = (1 + Math.log(n)) * (idf.get(k) ?? 0)
    if (w === 0) continue
    vec.set(k, w)
    norm += w * w
  }
  norm = Math.sqrt(norm) || 1
  for (const [k, w] of vec) vec.set(k, w / norm)
  return vec
}

function cosine(a, b) {
  const [small, big] = a.size <= b.size ? [a, b] : [b, a]
  let dot = 0
  for (const [k, w] of small) {
    const other = big.get(k)
    if (other) dot += w * other
  }
  return dot
}

/** Zentroid = Summe der Vektoren, wieder auf Länge 1 gebracht. */
function centroid(vectors) {
  const sum = new Map()
  for (const v of vectors) for (const [k, w] of v) sum.set(k, (sum.get(k) ?? 0) + w)
  let norm = 0
  for (const w of sum.values()) norm += w * w
  norm = Math.sqrt(norm) || 1
  for (const [k, w] of sum) sum.set(k, w / norm)
  return sum
}

// --------------------------------------------------------------- Messung

const cases = evalCases().filter((c) => !PRE_ROUTER.has(c.expect))
const byAgent = new Map()
for (const c of cases) {
  if (!byAgent.has(c.expect)) byAgent.set(c.expect, [])
  byAgent.get(c.expect).push(c)
}
/** Unter drei Beispielen ist ein Zentroid kein Zentroid, sondern ein Punkt. */
const classes = [...byAgent.entries()].filter(([, list]) => list.length >= 3)
const used = classes.flatMap(([, list]) => list)

const idf = idfOver(used.map((c) => features(c.text)))
const vecOf = new Map(used.map((c) => [c, vectorize(features(c.text), idf)]))
const centroids = new Map(classes.map(([id, list]) => [id, centroid(list.map((c) => vecOf.get(c)))]))

let hit = 0
let sumOwn = 0
let sumForeign = 0
const confusion = new Map()
for (const [id, list] of classes) {
  for (const c of list) {
    // Ohne den Fall selbst — sonst misst der Zentroid seine eigene Eingabe.
    const own = centroid(list.filter((x) => x !== c).map((x) => vecOf.get(x)))
    let best = null
    let bestSim = -1
    let bestForeign = -1
    for (const [other, vector] of centroids) {
      const sim = cosine(vecOf.get(c), other === id ? own : vector)
      if (other !== id && sim > bestForeign) bestForeign = sim
      if (sim > bestSim) {
        bestSim = sim
        best = other
      }
    }
    sumOwn += cosine(vecOf.get(c), own)
    sumForeign += bestForeign
    if (best === id) hit += 1
    else confusion.set(`${id} → ${best}`, (confusion.get(`${id} → ${best}`) ?? 0) + 1)
  }
}

const pct = (n) => `${(n * 100).toFixed(1)} %`
const zensusKorpus = census(evalCases().map((c) => c.text))
const zensusAmbig = census(AMBIG_PROBES)

console.log('## S257-9 — Trennschärfe vor Einbau\n')
console.log('### 1. Zensus: wie oft wird der ambige Pfad erreicht\n')
console.log('| Satzmenge | Fälle | Rückfrage | knapper Vorsprung | exakter Gleichstand | ohne Kandidat |')
console.log('|-----------|------:|----------:|------------------:|--------------------:|--------------:|')
for (const [name, z] of [
  ['Eval-Korpus', zensusKorpus],
  ['Ambig-Sonden', zensusAmbig],
]) {
  console.log(
    `| ${name} | ${z.total} | ${z.ask} (${pct(z.ask / z.total)}) | ${z.nearTie} | ${z.exactTie} | ${z.none} (${pct(z.none / z.total)}) |`,
  )
}

if (zensusKorpus.examples.length || zensusAmbig.examples.length) {
  console.log('\nKnappe Fälle:')
  for (const e of [...zensusKorpus.examples, ...zensusAmbig.examples].slice(0, 12)) {
    console.log(`  ${e.kind.padEnd(4)} ${e.a} vs ${e.b} (${e.margin.toFixed(3)}) — ${e.text}`)
  }
}

console.log('\n### 2. Trennschärfe: nächster Zentroid, lexikalisch (Untergrenze)\n')
const zufall = 1 / classes.length
console.log(`Klassen mit mindestens drei Beispielen: ${classes.length} von ${byAgent.size}`)
console.log(`Fälle in der Messung: ${used.length} von ${cases.length}`)
console.log('')
console.log('| Verfahren | Trefferquote |')
console.log('|-----------|-------------:|')
console.log(`| Zufall (${classes.length} Klassen) | ${pct(zufall)} |`)
console.log(`| nächster Zentroid, lexikalisch | ${pct(hit / used.length)} |`)
console.log('| Parser von heute (aus eval:report) | 100.0 % |')
console.log('')
console.log(`Kosinus zum eigenen Zentroid: ${(sumOwn / used.length).toFixed(3)}`)
console.log(`Kosinus zum nächsten fremden:  ${(sumForeign / used.length).toFixed(3)}`)
console.log(`Abstand: ${((sumOwn - sumForeign) / used.length).toFixed(3)}`)

const verwechslungen = [...confusion.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
if (verwechslungen.length) {
  console.log('\n| Verwechslung | Fälle |')
  console.log('|--------------|------:|')
  for (const [pair, n] of verwechslungen) console.log(`| ${pair} | ${n} |`)
}

// ---------------------------------------------------------------- Urteil

const ambigTotal = zensusKorpus.ask + zensusAmbig.ask
const reachRate = (zensusKorpus.ask + zensusAmbig.ask) / (zensusKorpus.total + zensusAmbig.total)
console.log('\n### Urteil\n')
if (ambigTotal === 0) {
  console.log(
    `Der Pfad, den 257 verbessern soll, wird in ${zensusKorpus.total + zensusAmbig.total} Sätzen **kein einziges Mal**\n` +
      'erreicht. Eine Ähnlichkeit, die nur bei Gleichstand rechnet, rechnet damit nie.\n' +
      `Die Trennschärfe selbst (${pct(hit / used.length)} gegen ${pct(zufall)} Zufall) ist dafür ohne Belang:\n` +
      'sie liegt unter dem, was die Parser heute deterministisch erreichen.',
  )
} else {
  console.log(`Rückfragen: ${ambigTotal} (${pct(reachRate)}). Trennschärfe ${pct(hit / used.length)} gegen ${pct(zufall)} Zufall.`)
}
console.log(
  '\nDie sichtbare Lücke ist eine andere: **ohne Kandidat** ' +
    `(${pct(zensusKorpus.none / zensusKorpus.total)} im Korpus, ${pct(zensusAmbig.none / zensusAmbig.total)} bei den Sonden).\n` +
    'Dort fehlt kein Rangkriterium, dort fehlt ein Kandidat — und eine Ähnlichkeit,\n' +
    'die laut Sprint-Grenze „keinen Agenten erfinden" darf, kann das nicht heben.',
)
