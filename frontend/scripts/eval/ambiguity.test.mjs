import assert from 'node:assert/strict'
import { decisionForEval, routeForEval } from '../../src/engine/eval/route-eval.ts'

const alternatives = [
  'Notiz oder Todo: Milch',
  'Erinnerung oder Kalendereintrag morgen acht',
  'Plane das vielleicht oder beantworte nur die Frage',
]

for (const text of alternatives) {
  const decision = decisionForEval(text)
  assert.notEqual(decision.kind, 'run', `Ambiguous alternative must not execute: ${text}`)
  assert.equal(routeForEval(text), 'llm', `Ambiguous alternative must stay in chat: ${text}`)
}

console.log('eval:ambiguity safe alternatives ok')
