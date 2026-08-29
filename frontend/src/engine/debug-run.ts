import { APP_VERSION, loadSettings } from './store.ts'
import { geminiReady } from './gemini.ts'
import type { TestCopyGroup, TestCopyItem, TestExpect } from './test-copy.ts'
import { judgeTurn, type DebugVerdict } from './debug-judge.ts'

export { judgeTurn }
export type { DebugVerdict }

export type DebugTurn = {
  group: string
  label: string
  prompt: string
  reply: string
  ms: number
  tool?: { status?: string; id?: string; action?: string; label?: string }
  expect?: TestExpect
  verdict: DebugVerdict
  error?: string
}

export type DebugReport = {
  app_version: string
  generated_at: string
  brain: 'local' | 'gemini'
  face: string
  gemini: boolean
  categories: string[]
  stopped: boolean
  turns: DebugTurn[]
}

export function buildReport(opts: {
  categories: string[]
  turns: DebugTurn[]
  stopped: boolean
}): DebugReport {
  const s = loadSettings()
  return {
    app_version: APP_VERSION,
    generated_at: new Date().toISOString(),
    brain: geminiReady() ? 'gemini' : 'local',
    face: s.face === 'friday' ? 'friday' : 'jarvis',
    gemini: geminiReady(),
    categories: opts.categories,
    stopped: opts.stopped,
    turns: opts.turns,
  }
}

export function reportToText(rep: DebugReport): string {
  const lines = [
    `Jarvis Debug ${rep.app_version}`,
    `Stand ${rep.generated_at}`,
    `Hirn ${rep.brain} · Face ${rep.face} · Gemini ${rep.gemini ? 'an' : 'aus'}`,
    `Kategorien: ${rep.categories.join(', ') || '—'}`,
    rep.stopped ? 'Abgebrochen.' : 'Durchgelaufen.',
    '',
  ]
  for (const t of rep.turns) {
    lines.push(`## ${t.group} · ${t.label}`)
    lines.push(`Sie: ${t.prompt}`)
    lines.push(`Jarvis: ${t.reply || '—'}`)
    lines.push(
      `tool ${t.tool?.id || '—'} ${t.tool?.status || ''} ${t.tool?.action || ''} · soll ${t.expect?.tool || '—'} · ${t.ms} ms`,
    )
    lines.push(`VERDICT ${t.verdict}`)
    if (t.error) lines.push(`Fehler: ${t.error}`)
    lines.push('')
  }
  return lines.join('\n')
}

export function selectedItems(groups: TestCopyGroup[], titles: string[]): Array<TestCopyItem & { group: string }> {
  const want = new Set(titles)
  const out: Array<TestCopyItem & { group: string }> = []
  for (const g of groups) {
    if (!want.has(g.title)) continue
    for (const item of g.items) out.push({ ...item, group: g.title })
  }
  return out
}

export function stampFilename(at = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `jarvis-debug-${at.getFullYear()}${p(at.getMonth() + 1)}${p(at.getDate())}-${p(at.getHours())}${p(at.getMinutes())}`
}
