/**
 * Wegwerf-Sonde: welchen Agenten trifft eine Kandidaten-Äußerung wirklich?
 *
 * Neue Korpus-Fälle werden nicht geraten. Ohne diese Sonde landet ein Prompt
 * mit falscher Erwartung im Korpus und der nächste Lauf ist rot.
 */
import { routeForEval, decisionForEval } from '../src/engine/eval/route-eval.ts'
import { agentCatalog } from '../src/engine/agents/catalog.ts'
import { evalCases } from '../src/engine/eval/corpus.ts'

const arg = process.argv[2] || ''

if (arg === '--ids') {
  console.log(
    agentCatalog()
      .map((a) => a.id)
      .sort()
      .join('\n'),
  )
  process.exit(0)
}

if (arg === '--census') {
  const per = new Map()
  for (const c of evalCases()) per.set(c.expect, (per.get(c.expect) || 0) + 1)
  const ids = agentCatalog().map((a) => a.id)
  const rows = [...new Set([...ids, ...per.keys()])].sort()
  for (const id of rows) {
    console.log(`${String(per.get(id) || 0).padStart(4)}  ${id}${ids.includes(id) ? '' : '  (kein Agent)'}`)
  }
  process.exit(0)
}

const lines = (await import('node:fs')).readFileSync(arg, 'utf8').split('\n')
let bad = 0
for (const raw of lines) {
  const line = raw.trim()
  if (!line || line.startsWith('#')) continue
  const tab = line.lastIndexOf('|')
  const text = line.slice(0, tab).trim()
  const want = line.slice(tab + 1).trim()
  const got = routeForEval(text)
  const pick = decisionForEval(text)
  const ask = pick.kind === 'ask' ? ` ASK(${pick.a}/${pick.b})` : ''
  const ok = got === want && !ask
  if (!ok) bad += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'} want=${want.padEnd(12)} got=${String(got).padEnd(12)}${ask} ← ${text}`)
}
console.log(`\n${bad} von ${lines.filter((l) => l.trim() && !l.startsWith('#')).length} falsch`)
