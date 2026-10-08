import { decisionForEval, routeForEval } from '../../src/engine/eval/route-eval.ts'
import { evalCases } from '../../src/engine/eval/corpus.ts'
import { partitionTrainingCases, routeReport, splitByFamily, trainingJsonl, validateReviewedCases } from './dataset-governance.mjs'

const cases = evalCases()
const results = cases.map((row) => {
  const decision = decisionForEval(row.text)
  return {
    expect: row.expect,
    actual: decision.kind === 'ask' ? 'ask' : routeForEval(row.text, {}, decision),
  }
})
const { eligible, excluded } = partitionTrainingCases(cases)
const integrityIssues = validateReviewedCases(eligible)
const split = integrityIssues.length ? null : splitByFamily(eligible)
if (split) {
  trainingJsonl(split.train)
  trainingJsonl(split.test)
}
console.log(
  JSON.stringify(
    {
      dataset_schema: 'jarvis-routing-gold-v1',
      reviewed_case_count: cases.length,
      routing_metrics: routeReport(results),
      privacy_excluded_count: excluded.length,
      excluded_sources: [...new Set(excluded.map((row) => row.source))].sort(),
      integrity_findings: integrityIssues.length,
      train_case_count: split?.train.length ?? 0,
      test_case_count: split?.test.length ?? 0,
      training_export: integrityIssues.length ? 'blocked' : 'eligible; no file written by this report',
    },
    null,
    2,
  ),
)
