import { decisionForEval, routeForEval } from '../../src/engine/eval/route-eval.ts'
import { evalCases } from '../../src/engine/eval/corpus.ts'
import { routeCounts, validateReviewedCases } from './dataset-governance.mjs'

const cases = evalCases()
const results = cases.map((row) => {
  const decision = decisionForEval(row.text)
  return {
    expect: row.expect,
    actual: decision.kind === 'ask' ? 'ask' : decision.kind === 'none' ? 'none' : routeForEval(row.text),
  }
})
const privacyIssues = validateReviewedCases(cases)
console.log(
  JSON.stringify(
    {
      dataset_schema: 'jarvis-routing-gold-v1',
      reviewed_case_count: cases.length,
      by_expected_route: routeCounts(results),
      privacy_or_integrity_findings: privacyIssues.length,
      training_export: privacyIssues.length ? 'blocked' : 'eligible for explicit opt-in export',
    },
    null,
    2,
  ),
)
