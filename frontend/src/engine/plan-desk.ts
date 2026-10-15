import type { IdeaPlan } from './idea-plan.ts'
import { loadSettings } from './store.ts'

const CANNED = new Set([
  'die wege gegeneinander halten.',
  'einen weg einmal durchspielen.',
  'wege vergleichen',
  'einen weg durchspielen',
  'wege',
  'durchspielen',
])

const ROSTER = new Set([
  'anforderungen, sprints und planungsdateien aus dem satz.',
  'stumme oberfläche, sobald der satz einen baustein nennt.',
  'idee: anforderungen, sprints und planungsdateien aus dem satz.',
  'tischplatte: stumme oberfläche, sobald der satz einen baustein nennt.',
])

function norm(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Erfundene Folge-Sprints. Die stehen nicht noch einmal auf der Fläche. */
export function cannedPlanLine(text: string): boolean {
  return CANNED.has(norm(text))
}

/** Feste Prozess-Sätze. Das sind keine Personen. */
export function cannedRosterLine(text: string): boolean {
  return ROSTER.has(norm(text))
}

/** Eine Frage je Schritt. Der Plan wächst aus der Antwort, nicht aus dem Titel. */
export function sparQuestion(step: string): string {
  if (step === 'goal') return 'Was soll die App konkret können? Ein Satz reicht.'
  if (step === 'audience') return 'Für wen ist sie gedacht?'
  if (step === 'slice') return 'Was ist die erste nutzbare Scheibe, die in einem Sprint fertig wird?'
  if (step === 'done') return 'Woran erkennst du, dass dieser Sprint fertig ist?'
  return 'Sag den nächsten Schritt für diesen Sprint, oder „nächster Sprint“, wenn ein neuer Sprint beginnt.'
}

export function planDeskLines(
  idea: { title?: string; plan?: IdeaPlan | null } | undefined,
  phase: string,
  cardName = '',
): Array<{ key: string; text: string }> {
  if (!idea) return [{ key: 'BEREIT', text: 'Sagen Sie: Plane das: …' }]
  const seen = new Set<string>()
  const out: Array<{ key: string; text: string }> = []
  const add = (key: string, text: string) => {
    const clean = text.replace(/\s+/g, ' ').trim()
    const keyNorm = norm(clean)
    if (keyNorm.length < 2 || seen.has(keyNorm) || CANNED.has(keyNorm)) return
    seen.add(keyNorm)
    out.push({ key, text: clean })
  }
  if (idea.title) seen.add(norm(idea.title))
  for (const cut of idea.plan?.entscheidungen || []) {
    const line = `${cut.schnitt}: ${cut.grund}`.trim()
    if (!cut.grund || cannedRosterLine(cut.grund) || cannedRosterLine(line)) continue
    const key = (cut.schnitt || 'Schnitt').replace(/\s+/g, ' ').trim().slice(0, 18).toUpperCase()
    add(key === 'WER' ? 'SCHNITT' : key, cut.grund)
  }
  for (const need of idea.plan?.anforderungen || []) {
    add(need.id.startsWith('O') ? 'FLÄCHE' : 'ANFORDERUNG', need.satz)
  }
  const sprints = [...(idea.plan?.sprints || [])].sort((a, b) => Number(a.n) - Number(b.n))
  for (const sprint of sprints) add(`SPRINT ${sprint.n}`, sprint.ziel?.trim() || sprint.title)
  const spar = loadSettings().plan_spar_step
  const status = spar
    ? sparQuestion(spar)
    : phase === 'go'
      ? 'Umgesetzt. Export ist bereit.'
      : cardName
        ? 'Die Karte liegt. Sag Fertig, dann geht der Bildschirm zu.'
        : 'Die Karte fehlt. Sag Go.'
  out.push({ key: 'STATUS', text: status })
  return out
}
