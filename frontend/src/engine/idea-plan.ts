/** Eine Sprint-Hülle. Die Zahl der Sprints setzt er. Kern, Härten und Probe sind keine Vorlage. */

export const PLAN_BEDINGUNG = `Du planst selbständig. Der Mensch gibt die Bedingung in einem Satz und die Rahmenpunkte. Danach entscheidest du, was das Projekt braucht, wie viele Sprints es sind, in welcher Reihenfolge sie stehen, wann ein Gateway Go sagt und wann No-Go. Du fragst nur, wenn ohne die Antwort ein Go falsch wäre. Du erfindest keine Quelle, keinen Gewinner, keinen Code und keine Version. Eine Lücke benennst du. Du stopfst sie nicht. Die Bedingung bleibt wörtlich. Du schneidest sie nicht auf drei Kapitel. Titel wie Kern, Härten und Probe verwendest du nicht.`

export const PLAN_RAHMEN = [
  'Eine Sprint-Hülle, so oft wie die Arbeit Tore braucht.',
  'Jeder Sprint trägt Ziel, Anforderungen, Lieferumfang, Gateway, Go-wenn, No-Go-wenn, Abbruch und Abhängigkeit.',
  'Gateway ist offen, go oder nogo. go nur, wenn Anforderungen, Abnahme und Abbruch je einen Satz haben.',
  'nogo stoppt diesen Sprint. Der Plan bleibt.',
  'Eine Quelle bleibt leer, bis jemand Such sagt.',
  'Lizenz, Gerät und Paket bleiben Rahmen. Kein fremder Quelltext.',
  'Das Projekt-Gateway ist go, wenn jeder Sprint go ist oder ein benanntes nogo trägt, und die Lücken benannt sind.',
  'Umsetzen baut nur Sprints mit Gateway go.',
] as const

export type Gate = 'offen' | 'go' | 'nogo'

export type IdeaTask = {
  id: string
  task: string
  anleitung: string
}

function parseEvidence(raw: unknown): PlanEvidence[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 80).flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    if (!['local', 'research', 'test', 'hypothesis'].includes(String(row.kind))) return []
    const title = asText(row.title)
    const text = asText(row.text)
    const url = asText(row.url)
    if (!title || !text) return []
    if (url && !/^https?:\/\//i.test(url)) return []
    return [{
      id: asText(row.id) || `EVID-${index + 1}`,
      kind: row.kind as PlanEvidence['kind'],
      title: title.slice(0, 200),
      text: text.slice(0, 1000),
      ...(url ? { url: url.slice(0, 1000) } : {}),
      ...(asText(row.requirementId) ? { requirementId: asText(row.requirementId) } : {}),
    }]
  })
}

export type IdeaSprint = {
  n: string
  title: string
  ziel: string
  anforderungen: string[]
  lieferumfang: IdeaTask[]
  wont: string[]
  gateway: Gate
  go_wenn: string
  nogo_wenn: string
  abbruch: string
  haengt_an: string[]
  /** Eine Anleitung für einen Programmier-Agenten. Schreibt das Modell, sonst leer. */
  prompt: string
  manuell?: string
}

export type PlanNeed = {
  id: string
  satz: string
  abnahme: string
  gateway: Gate
}

export type PlanCut = {
  id: string
  schnitt: string
  grund: string
  gateway: Gate
}

export type PlanGap = {
  id: string
  name: string
  satz: string
}

export type IdeaPlan = {
  schemaVersion?: number
  ideaId: string
  bedingung: string
  rahmen: string[]
  anforderungen: PlanNeed[]
  entscheidungen: PlanCut[]
  luecken: PlanGap[]
  gateway: Gate
  go_wenn: string
  nogo_wenn: string
  sprints: IdeaSprint[]
  simulation?: IdeaSimulation
  revisions?: IdeaPlanRevision[]
  evidence?: PlanEvidence[]
}

export type IdeaSimulationElement =
  | { type: 'heading'; text: string }
  | { type: 'text'; text: string }
  | { type: 'list'; title: string; items: string[] }
  | { type: 'card'; title: string; body: string }
  | { type: 'button'; label: string }
  | { type: 'tabs'; labels: string[]; selected: number }

export type IdeaSimulation = {
  version: 1
  kind: 'gui' | 'workflow'
  title: string
  elements: IdeaSimulationElement[]
  assumptions: string[]
  createdAt: string
}

export type IdeaPlanRevision = {
  id: string
  at: string
  summary: string
  snapshot: string
}

export type PlanEvidence = {
  id: string
  kind: 'local' | 'research' | 'test' | 'hypothesis'
  title: string
  text: string
  url?: string
  requirementId?: string
}

export type PlanValidation = { ok: boolean; errors: string[] }

function asText(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function asList(v: unknown): string[] {
  if (!Array.isArray(v)) {
    const one = asText(v)
    return one ? [one] : []
  }
  return v.map((x) => asText(x)).filter(Boolean)
}

function asTasks(v: unknown, sprintId: string): IdeaTask[] {
  if (!Array.isArray(v)) return []
  const out: IdeaTask[] = []
  for (const row of v) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const task = asText(o.task) || asText(o.arbeit) || asText(o.title)
    if (!task) continue
    const anleitung = asText(o.anleitung) || asText(o.fertig_wenn) || asText(o.hint)
    out.push({
      id: asText(o.id) || `S${sprintId}-${out.length + 1}`,
      task,
      anleitung: anleitung && anleitung !== task ? anleitung : 'Der Satz ist die Quelle.',
    })
  }
  return out
}

function asWont(v: unknown): string[] {
  const rows = asList(v)
  return rows.length ? rows : ['—']
}

function spoken(s: string): boolean {
  return s.replace(/[—–-]/g, '').replace(/\s+/g, ' ').trim().length >= 3
}

const PROMPT_MAX = 480

/** Ein Absatz vom Modell. Kürzer als eine Anleitung fällt weg. Länger wird am Wort geschnitten. */
export function sprintPrompt(raw: unknown): string {
  const text = asText(raw).replace(/\s+/g, ' ').trim()
  if (text.length < 40) return ''
  if (text.length <= PROMPT_MAX) return text
  const cut = text.slice(0, PROMPT_MAX)
  const space = cut.lastIndexOf(' ')
  return (space > 200 ? cut.slice(0, space) : cut).trim()
}

export function blankSprint(n: string, title = '', ziel = ''): IdeaSprint {
  return {
    n,
    title,
    ziel,
    anforderungen: [],
    lieferumfang: [],
    wont: ['—'],
    gateway: 'offen',
    go_wenn: '',
    nogo_wenn: '',
    abbruch: '—',
    haengt_an: [],
    prompt: '',
  }
}

function sprintGate(raw: string, sprint: Pick<IdeaSprint, 'anforderungen' | 'go_wenn' | 'abbruch'>): Gate {
  if (raw === 'nogo') return 'nogo'
  if (raw === 'go' && sprint.anforderungen.length > 0 && spoken(sprint.go_wenn) && spoken(sprint.abbruch)) return 'go'
  return 'offen'
}

export function emptyPlan(ideaId: string, bedingung = ''): IdeaPlan {
  return {
    schemaVersion: 2,
    ideaId,
    bedingung,
    rahmen: [...PLAN_RAHMEN],
    anforderungen: [],
    entscheidungen: [],
    luecken: [],
    gateway: 'offen',
    go_wenn: '',
    nogo_wenn: '',
    sprints: [],
  }
}

function needsOf(v: unknown): PlanNeed[] {
  if (!Array.isArray(v)) return []
  const out: PlanNeed[] = []
  for (const row of v) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const satz = asText(o.satz)
    if (!satz) continue
    const abnahme = asText(o.abnahme)
    const id = asText(o.id) || `A${out.length + 1}`
    out.push({ id, satz, abnahme, gateway: sprintGate(asText(o.gateway), { anforderungen: ['x'], go_wenn: abnahme, abbruch: abnahme }) })
  }
  return out
}

function cutsOf(v: unknown): PlanCut[] {
  if (!Array.isArray(v)) return []
  const out: PlanCut[] = []
  for (const row of v) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const schnitt = asText(o.schnitt)
    const grund = asText(o.grund)
    if (!schnitt || !spoken(grund)) continue
    out.push({
      id: asText(o.id) || `E${out.length + 1}`,
      schnitt,
      grund,
      gateway: asText(o.gateway) === 'nogo' ? 'nogo' : asText(o.gateway) === 'go' ? 'go' : 'offen',
    })
  }
  return out
}

function gapsOf(v: unknown): PlanGap[] {
  if (!Array.isArray(v)) return []
  const out: PlanGap[] = []
  for (const row of v) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const name = asText(o.name)
    const satz = asText(o.satz)
    if (!name && !satz) continue
    out.push({ id: asText(o.id) || `L${out.length + 1}`, name: name || 'Lücke', satz })
  }
  return out
}

/** Unbekannte Felder (RICE, Version) fallen weg. Nummern mit Lücke → null. */
export function parsePlan(raw: unknown, ideaId = ''): IdeaPlan | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const rows = Array.isArray(o.sprints) ? o.sprints : null
  if (!rows) return null
  const sprints: IdeaSprint[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') return null
    const s = row as Record<string, unknown>
    const n = asText(s.n) || asText(s.id)
    if (!/^(\d+|C\d+)$/i.test(n)) return null
    const ziel = asText(s.ziel)
    const title = asText(s.title) || asText(s.titel)
    if (/^C\d+$/i.test(n) && !spoken(ziel)) return null
    const draft: IdeaSprint = {
      n: /^\d+$/.test(n) ? String(Number(n)) : n.toUpperCase(),
      title,
      ziel,
      anforderungen: asList(s.anforderungen),
      lieferumfang: asTasks(s.lieferumfang, n),
      wont: asWont(s.wont),
      gateway: 'offen',
      go_wenn: asText(s.go_wenn),
      nogo_wenn: asText(s.nogo_wenn),
      abbruch: asText(s.abbruch) || '—',
      haengt_an: asList(s.haengt_an || s['hängt_an']),
      prompt: sprintPrompt(s.prompt),
      manuell: asText(s.manuell) || undefined,
    }
    draft.gateway = sprintGate(asText(s.gateway), draft)
    sprints.push(draft)
  }
  const nums = sprints.map((s) => s.n).filter((n) => /^\d+$/.test(n)).map(Number).sort((a, b) => a - b)
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i + 1) return null
  }
  const gateway = sprintGate(asText(o.gateway), {
    anforderungen: needsOf(o.anforderungen).length ? ['x'] : [],
    go_wenn: asText(o.go_wenn),
    abbruch: asText(o.nogo_wenn) || asText(o.go_wenn),
  })
  const parsed: IdeaPlan = {
    schemaVersion: 2,
    ideaId: asText(o.ideaId) || ideaId,
    bedingung: asText(o.bedingung),
    rahmen: asList(o.rahmen).length ? asList(o.rahmen) : [...PLAN_RAHMEN],
    anforderungen: needsOf(o.anforderungen),
    entscheidungen: cutsOf(o.entscheidungen),
    luecken: gapsOf(o.luecken),
    gateway,
    go_wenn: asText(o.go_wenn),
    nogo_wenn: asText(o.nogo_wenn),
    sprints: sprints.sort((a, b) => a.n.localeCompare(b.n, undefined, { numeric: true })),
    simulation: parseSimulation(o.simulation) || undefined,
    revisions: parseRevisions(o.revisions),
    evidence: parseEvidence(o.evidence),
  }
  if (o.simulation !== undefined && !parsed.simulation) return null
  return validatePlan(parsed).ok ? parsed : null
}

function parseSimulation(raw: unknown): IdeaSimulation | null | undefined {
  if (raw === undefined) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const row = raw as Record<string, unknown>
  if (row.version !== 1 || (row.kind !== 'gui' && row.kind !== 'workflow')) return null
  if (!Array.isArray(row.elements) || !Array.isArray(row.assumptions)) return null
  const elements: IdeaSimulationElement[] = []
  for (const item of row.elements.slice(0, 32)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const el = item as Record<string, unknown>
    const text = asText(el.text)
    if (el.type === 'heading' && text) elements.push({ type: 'heading', text: text.slice(0, 160) })
    else if (el.type === 'text' && text) elements.push({ type: 'text', text: text.slice(0, 400) })
    else if (el.type === 'list' && Array.isArray(el.items)) {
      elements.push({
        type: 'list',
        title: asText(el.title).slice(0, 120),
        items: el.items.map(asText).filter(Boolean).slice(0, 12).map((v) => v.slice(0, 160)),
      })
    } else if (el.type === 'card' && asText(el.title)) {
      elements.push({ type: 'card', title: asText(el.title).slice(0, 120), body: asText(el.body).slice(0, 300) })
    } else if (el.type === 'button' && asText(el.label)) {
      elements.push({ type: 'button', label: asText(el.label).slice(0, 80) })
    } else if (el.type === 'tabs' && Array.isArray(el.labels)) {
      const labels = el.labels.map(asText).filter(Boolean).slice(0, 8).map((v) => v.slice(0, 80))
      if (labels.length) {
        const selected = Number.isInteger(el.selected) ? Number(el.selected) : 0
        elements.push({ type: 'tabs', labels, selected: Math.max(0, Math.min(selected, labels.length - 1)) })
      }
    }
  }
  if (!elements.length || elements.length !== row.elements.length) return null
  return {
    version: 1,
    kind: row.kind,
    title: asText(row.title).slice(0, 120) || 'Vorschau',
    elements,
    assumptions: row.assumptions.map(asText).filter(Boolean).slice(0, 12).map((v) => v.slice(0, 200)),
    createdAt: asText(row.createdAt) || new Date(0).toISOString(),
  }
}

function parseRevisions(raw: unknown): IdeaPlanRevision[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(-10).flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const id = asText(row.id)
    const snapshot = asText(row.snapshot)
    if (!id || !snapshot || snapshot.length > 100_000) return []
    return [{
      id,
      at: asText(row.at) || new Date(0).toISOString(),
      summary: asText(row.summary).slice(0, 160),
      snapshot,
    }]
  })
}

export function validatePlan(plan: IdeaPlan): PlanValidation {
  const errors: string[] = []
  const ids = new Set<string>()
  const addId = (id: string, where: string) => {
    if (!id.trim()) errors.push(`${where}: Kennung fehlt.`)
    else if (ids.has(id)) errors.push(`Kennung „${id}“ kommt mehrfach vor.`)
    else ids.add(id)
  }
  const sprintById = new Map<string, IdeaSprint>()
  for (const need of plan.anforderungen) addId(need.id, `Anforderung ${need.satz}`)
  for (const cut of plan.entscheidungen) addId(cut.id, `Entscheidung ${cut.schnitt}`)
  for (const gap of plan.luecken) addId(gap.id, `Lücke ${gap.name}`)
  for (const sprint of plan.sprints) {
    addId(sprint.n, `Sprint ${sprint.n}`)
    sprintById.set(sprint.n.toUpperCase(), sprint)
    if (!sprint.title.trim() && !sprint.ziel.trim()) errors.push(`Sprint ${sprint.n}: Titel oder Ziel fehlt.`)
    if (sprint.gateway === 'go' && (!sprint.anforderungen.length || !spoken(sprint.go_wenn) || !spoken(sprint.abbruch))) {
      errors.push(`Sprint ${sprint.n}: Go braucht Anforderungen, eine Go-Bedingung und einen Abbruchpunkt.`)
    }
    const needIds = new Set(plan.anforderungen.map((need) => need.id))
    for (const evidence of plan.evidence || []) {
      addId(evidence.id, `Beleg ${evidence.title}`)
      if (evidence.requirementId && !needIds.has(evidence.requirementId)) {
        errors.push(`Beleg „${evidence.title}“ verweist auf eine unbekannte Anforderung.`)
      }
    }
    if (sprint.gateway === 'nogo' && !spoken(sprint.nogo_wenn)) {
      errors.push(`Sprint ${sprint.n}: No-Go braucht eine Begründung.`)
    }
    for (const task of sprint.lieferumfang) addId(task.id, `Aufgabe in Sprint ${sprint.n}`)
  }
  const edges = new Map<string, string[]>()
  for (const sprint of plan.sprints) {
    const source = sprint.n.toUpperCase()
    const deps = sprint.haengt_an.map((dependency) => dependency.toUpperCase())
    edges.set(source, deps)
    for (const dependency of deps) {
      if (!sprintById.has(dependency)) errors.push(`Sprint ${sprint.n}: Abhängigkeit „${dependency}“ existiert nicht.`)
      if (dependency === source) errors.push(`Sprint ${sprint.n}: darf nicht von sich selbst abhängen.`)
    }
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (node: string, trail: string[]) => {
    if (visiting.has(node)) {
      errors.push(`Abhängigkeitsschleife: ${[...trail, node].join(' → ')}.`)
      return
    }
    if (visited.has(node)) return
    visiting.add(node)
    for (const next of edges.get(node) || []) if (sprintById.has(next)) visit(next, [...trail, node])
    visiting.delete(node)
    visited.add(node)
  }
  for (const sprint of plan.sprints) visit(sprint.n.toUpperCase(), [])
  if (plan.gateway === 'go' && (!plan.sprints.length || plan.sprints.some((sprint) => sprint.gateway !== 'go'))) {
    errors.push('Projekt-Gateway kann nur Go sein, wenn alle Sprints Go haben.')
  }
  return { ok: errors.length === 0, errors: [...new Set(errors)] }
}

export function savePlanRevision(plan: IdeaPlan, summary: string, id: string, at = new Date()): IdeaPlan {
  const snapshot = JSON.stringify({ ...plan, revisions: [] })
  const revision: IdeaPlanRevision = {
    id,
    at: at.toISOString(),
    summary: summary.slice(0, 160),
    snapshot,
  }
  return { ...plan, revisions: [...(plan.revisions || []), revision].slice(-10) }
}

export function restorePlanRevision(plan: IdeaPlan, id: string): IdeaPlan | null {
  const revision = plan.revisions?.find((item) => item.id === id)
  if (!revision) return null
  try {
    const parsed = parsePlan(JSON.parse(revision.snapshot), plan.ideaId)
    return parsed ? { ...parsed, revisions: plan.revisions } : null
  } catch {
    return null
  }
}

/** Irgendein Sprint trägt ein Ziel. Eine leere Hülle zählt nicht. */
export function planHasBody(plan: IdeaPlan): boolean {
  return plan.sprints.some((s) => spoken(s.ziel) || s.lieferumfang.length > 0)
}

/** Ein Sprint je Treffer. Keine zweiten und dritten Titel dazu erfinden. */
export function planFromSources(ideaId: string, title: string, lines: string[]): IdeaPlan | null {
  const tasks = [...new Set(lines.map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length >= 3))].slice(0, 12)
  if (!tasks.length) return null
  const plan = emptyPlan(ideaId, title)
  plan.sprints = tasks.map((task, i) => {
    const sprint = blankSprint(String(i + 1), task.slice(0, 48), task.slice(0, 160))
    sprint.lieferumfang = [{ id: `S${i + 1}-1`, task: task.slice(0, 80), anleitung: 'Der Satz ist die Quelle.' }]
    return sprint
  })
  plan.luecken = [{ id: 'L1', name: 'Gateway', satz: 'Go ist offen. Die Treffer sind noch keine Abnahme.' }]
  return plan
}

export const WEG_ANLEITUNG = 'Der Satz ist die Quelle. Prüfen, was er verlangt.'

export function formatPlan(plan: IdeaPlan, ideaTitle = ''): string {
  const head = ideaTitle ? `${ideaTitle} — PLAN` : 'Sprintplan'
  const parts = [head]
  if (plan.bedingung) parts.push(`Bedingung: ${plan.bedingung}`)
  parts.push(`Gateway: ${plan.gateway}`)
  if (!plan.sprints.length) parts.push('Sprints: noch keine. Die Hülle wartet.')
  const wege = plan.sprints[0]?.lieferumfang || []
  if (wege.length) {
    parts.push('')
    parts.push('Aus dem Satz')
    for (let i = 0; i < wege.length; i += 1) parts.push(`- W${i + 1}: ${wege[i].task}`)
    parts.push('Der Satz ist die Quelle.')
  }
  for (const s of plan.sprints) {
    parts.push('')
    parts.push(`Sprint ${s.n}${s.title ? ` — ${s.title}` : ''}`)
    parts.push(`Ziel: ${s.ziel || '—'}`)
    parts.push(`Gateway: ${s.gateway}`)
    if (s.lieferumfang.length) {
      for (const t of s.lieferumfang) parts.push(`- ${t.id}: ${t.task}`)
    } else {
      parts.push('- (noch leer)')
    }
    parts.push(`Abbruch: ${s.abbruch}`)
    if (s.prompt) {
      parts.push('Prompt:')
      parts.push(s.prompt)
    }
  }
  if (plan.luecken.length) {
    parts.push('')
    parts.push(`Lücken: ${plan.luecken.map((g) => g.name).join(', ')}`)
  }
  return parts.join('\n')
}

export function nextSprintN(plan: IdeaPlan): string {
  let max = 0
  for (const s of plan.sprints) {
    if (/^\d+$/.test(s.n)) max = Math.max(max, Number(s.n))
  }
  return String(max + 1)
}

export function nextCustomN(plan: IdeaPlan): string {
  return nextSprintN(plan)
}

export function findSprint(plan: IdeaPlan, n: string): IdeaSprint | undefined {
  const want = n.trim().toUpperCase()
  return plan.sprints.find((s) => s.n.toUpperCase() === want)
}
