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

export type BacklogItem = {
  id: string
  description: string
  requirementIds: string[]
  status: 'backlog' | 'planned' | 'done'
  sprintId?: string
}

export type SprintRelation = {
  type: 'depends_on' | 'blocks' | 'related'
  targetId: string
}

export type PlanRisk = {
  id: string
  description: string
  impact: string
  mitigation: string
  status: 'open' | 'resolved'
}

export type PlanStatus = 'planned' | 'at_risk' | 'blocked' | 'completed'

export type PlanStatusUpdate = {
  status: PlanStatus
  at: string
  reason: string
  sprintId?: string
  requirementId?: string
  nextAction?: string
}

export type PlanProvenance = {
  kind: 'manual' | 'local' | 'research' | 'hypothesis'
  confirmation: 'confirmed' | 'unconfirmed'
  evidenceIds: string[]
}

function parseEvidence(raw: unknown): PlanEvidence[] | null {
  if (raw === undefined) return []
  if (!Array.isArray(raw) || raw.length > 80) return null
  const parsed = raw.map((item, index): PlanEvidence | null => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const row = item as Record<string, unknown>
    if (!['local', 'research', 'test', 'hypothesis'].includes(String(row.kind))) return null
    const title = asText(row.title)
    const text = asText(row.text)
    const url = asText(row.url)
    const fetchedAt = asText(row.fetchedAt)
    if (!title || !text) return null
    if (url && !/^https?:\/\//i.test(url)) return null
    if (fetchedAt && !validZonedDate(fetchedAt)) return null
    return {
      id: asText(row.id) || `EVID-${index + 1}`,
      kind: row.kind as PlanEvidence['kind'],
      title: title.slice(0, 200),
      text: text.slice(0, 1000),
      ...(url ? { url: url.slice(0, 1000) } : {}),
      ...(asText(row.requirementId) ? { requirementId: asText(row.requirementId) } : {}),
      ...(fetchedAt ? { fetchedAt } : {}),
    }
  })
  return parsed.every((item): item is PlanEvidence => item !== null) ? parsed : null
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
  relations?: SprintRelation[]
  startAt?: string
  endAt?: string
  /** Eine Anleitung für einen Programmier-Agenten. Schreibt das Modell, sonst leer. */
  prompt: string
  manuell?: string
}

export type PlanNeed = {
  id: string
  satz: string
  abnahme: string
  gateway: Gate
  provenance?: PlanProvenance
}

export type PlanCut = {
  id: string
  schnitt: string
  grund: string
  gateway: Gate
  provenance?: PlanProvenance
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
  backlog?: BacklogItem[]
  risks?: PlanRisk[]
  statusUpdates?: PlanStatusUpdate[]
  extensions?: Record<string, unknown>
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
  fetchedAt?: string
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

function asTasks(v: unknown, sprintId: string): IdeaTask[] | null {
  if (v === undefined) return []
  if (!Array.isArray(v)) return null
  const out: IdeaTask[] = []
  for (const row of v) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null
    const o = row as Record<string, unknown>
    const task = asText(o.task) || asText(o.arbeit) || asText(o.title)
    if (!task) return null
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
    schemaVersion: 3,
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

function needsOf(v: unknown): PlanNeed[] | null {
  if (v === undefined) return []
  if (!Array.isArray(v)) return null
  const out: PlanNeed[] = []
  for (const row of v) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null
    const o = row as Record<string, unknown>
    const satz = asText(o.satz)
    if (!satz) return null
    const abnahme = asText(o.abnahme)
    const id = asText(o.id) || `A${out.length + 1}`
    const provenance = provenanceOf(o.provenance)
    if (provenance === null) return null
    out.push({
      id,
      satz,
      abnahme,
      gateway: sprintGate(asText(o.gateway), { anforderungen: ['x'], go_wenn: abnahme, abbruch: abnahme }),
      ...(provenance ? { provenance } : {}),
    })
  }
  return out
}

function cutsOf(v: unknown): PlanCut[] | null {
  if (v === undefined) return []
  if (!Array.isArray(v)) return null
  const out: PlanCut[] = []
  for (const row of v) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null
    const o = row as Record<string, unknown>
    const schnitt = asText(o.schnitt)
    const grund = asText(o.grund)
    if (!schnitt || !spoken(grund)) return null
    const provenance = provenanceOf(o.provenance)
    if (provenance === null) return null
    out.push({
      id: asText(o.id) || `E${out.length + 1}`,
      schnitt,
      grund,
      gateway: asText(o.gateway) === 'nogo' ? 'nogo' : asText(o.gateway) === 'go' ? 'go' : 'offen',
      ...(provenance ? { provenance } : {}),
    })
  }
  return out
}

function gapsOf(v: unknown): PlanGap[] {
  if (v === undefined) return []
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

function provenanceOf(raw: unknown): PlanProvenance | undefined | null {
  if (raw === undefined) return undefined
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const row = raw as Record<string, unknown>
  if (!['manual', 'local', 'research', 'hypothesis'].includes(String(row.kind))) return null
  if (row.confirmation !== 'confirmed' && row.confirmation !== 'unconfirmed') return null
  if (row.evidenceIds !== undefined && !Array.isArray(row.evidenceIds)) return null
  return {
    kind: row.kind as PlanProvenance['kind'],
    confirmation: row.confirmation,
    evidenceIds: asList(row.evidenceIds),
  }
}

function relationsOf(raw: unknown, legacy: unknown): SprintRelation[] | null {
  if (raw === undefined) {
    if (legacy === undefined) return []
    if (typeof legacy === 'string') return asList(legacy).map((targetId) => ({ type: 'depends_on', targetId }))
    if (!Array.isArray(legacy) || legacy.some((target) => typeof target !== 'string' || !target.trim())) return null
    return legacy.map((targetId) => ({ type: 'depends_on', targetId: targetId.trim() }))
  }
  if (!Array.isArray(raw)) return null
  const out: SprintRelation[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const row = item as Record<string, unknown>
    const type = row.type
    const targetId = asText(row.targetId)
    if (!['depends_on', 'blocks', 'related'].includes(String(type)) || !targetId) return null
    out.push({ type: type as SprintRelation['type'], targetId })
  }
  return out
}

function validZonedDate(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-](\d{2}):(\d{2}))$/)
  if (!match || !Number.isFinite(Date.parse(value))) return false
  const [, year, month, day, hour, minute, second = '0', , offsetHour = '0', offsetMinute = '0'] = match
  const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate()
  return Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= daysInMonth
    && Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59
    && Number(offsetHour) <= 23 && Number(offsetMinute) <= 59
}

function backlogOf(raw: unknown): BacklogItem[] | null {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) return null
  const rows: BacklogItem[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const row = item as Record<string, unknown>
    const id = asText(row.id)
    const description = asText(row.description)
    const status = row.status
    const sprintId = asText(row.sprintId)
    if (!id || !description || !['backlog', 'planned', 'done'].includes(String(status))) return null
    if ((status === 'planned') !== Boolean(sprintId)) return null
    rows.push({ id, description, requirementIds: asList(row.requirementIds), status: status as BacklogItem['status'], ...(sprintId ? { sprintId } : {}) })
  }
  return rows
}

function risksOf(raw: unknown): PlanRisk[] | null {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) return null
  const rows: PlanRisk[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const row = item as Record<string, unknown>
    if (!asText(row.id) || !asText(row.description) || !asText(row.impact) || !asText(row.mitigation)) return null
    if (row.status !== 'open' && row.status !== 'resolved') return null
    rows.push({
      id: asText(row.id),
      description: asText(row.description),
      impact: asText(row.impact),
      mitigation: asText(row.mitigation),
      status: row.status,
    })
  }
  return rows
}

function statusUpdatesOf(raw: unknown): PlanStatusUpdate[] | null {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) return null
  const rows: PlanStatusUpdate[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null
    const row = item as Record<string, unknown>
    const status = row.status
    const at = asText(row.at)
    const reason = asText(row.reason)
    if (!['planned', 'at_risk', 'blocked', 'completed'].includes(String(status)) || !validZonedDate(at) || !reason) return null
    rows.push({
      status: status as PlanStatus,
      at,
      reason,
      ...(asText(row.sprintId) ? { sprintId: asText(row.sprintId) } : {}),
      ...(asText(row.requirementId) ? { requirementId: asText(row.requirementId) } : {}),
      ...(asText(row.nextAction) ? { nextAction: asText(row.nextAction) } : {}),
    })
  }
  return rows
}

function extensionsOf(raw: Record<string, unknown>, known: Set<string>): Record<string, unknown> | undefined | null {
  const extras = Object.fromEntries(Object.entries(raw).filter(([key]) => !known.has(key)))
  if (!Object.keys(extras).length) return undefined
  try {
    const json = JSON.stringify(extras)
    if (json.length > 500_000) return null
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Unbekannte Felder (RICE, Version) fallen weg. Nummern mit Lücke → null. */
export function parsePlan(raw: unknown, ideaId = ''): IdeaPlan | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  if (o.schemaVersion !== undefined && (!Number.isInteger(o.schemaVersion) || Number(o.schemaVersion) > 3 || Number(o.schemaVersion) < 1)) return null
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
      lieferumfang: asTasks(s.lieferumfang, n) || [],
      wont: asWont(s.wont),
      gateway: 'offen',
      go_wenn: asText(s.go_wenn),
      nogo_wenn: asText(s.nogo_wenn),
      abbruch: asText(s.abbruch) || '—',
      haengt_an: [],
      relations: [],
      ...(s.startAt === undefined ? {} : { startAt: asText(s.startAt) }),
      ...(s.endAt === undefined ? {} : { endAt: asText(s.endAt) }),
      prompt: sprintPrompt(s.prompt),
      manuell: asText(s.manuell) || undefined,
    }
    if (s.lieferumfang !== undefined && !Array.isArray(s.lieferumfang)) return null
    if (Array.isArray(s.lieferumfang) && draft.lieferumfang.length !== s.lieferumfang.length) return null
    const relations = relationsOf(s.relations, s.haengt_an || s['hängt_an'])
    if (!relations) return null
    draft.relations = relations
    draft.haengt_an = relations.filter((relation) => relation.type === 'depends_on').map((relation) => relation.targetId)
    draft.gateway = sprintGate(asText(s.gateway), draft)
    sprints.push(draft)
  }
  const nums = sprints.map((s) => s.n).filter((n) => /^\d+$/.test(n)).map(Number).sort((a, b) => a - b)
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i + 1) return null
  }
  const anforderungen = needsOf(o.anforderungen)
  if (!anforderungen) return null
  const gateway = sprintGate(asText(o.gateway), {
    anforderungen: anforderungen.length ? ['x'] : [],
    go_wenn: asText(o.go_wenn),
    abbruch: asText(o.nogo_wenn) || asText(o.go_wenn),
  })
  const evidence = parseEvidence(o.evidence)
  const entscheidungen = cutsOf(o.entscheidungen)
  const backlog = backlogOf(o.backlog)
  const risks = risksOf(o.risks)
  const statusUpdates = statusUpdatesOf(o.statusUpdates)
  const extensions = extensionsOf(o, new Set([
    'schemaVersion', 'ideaId', 'bedingung', 'rahmen', 'anforderungen', 'entscheidungen', 'luecken',
    'gateway', 'go_wenn', 'nogo_wenn', 'sprints', 'simulation', 'revisions', 'evidence', 'backlog',
    'risks', 'statusUpdates', 'extensions',
  ]))
  if (!evidence || !anforderungen || !entscheidungen || !backlog || !risks || !statusUpdates || extensions === null) return null
  const explicitExtensions = o.extensions === undefined ? undefined : extensionsOf(
    typeof o.extensions === 'object' && o.extensions !== null && !Array.isArray(o.extensions) ? o.extensions as Record<string, unknown> : {},
    new Set(),
  )
  if (o.extensions !== undefined && (!o.extensions || typeof o.extensions !== 'object' || Array.isArray(o.extensions) || explicitExtensions === null)) return null
  const revisionRows = parseRevisions(o.revisions)
  if (Array.isArray(o.revisions) && revisionRows.length !== o.revisions.length) return null
  if (o.revisions !== undefined && !Array.isArray(o.revisions)) return null
  const parsed: IdeaPlan = {
    schemaVersion: 3,
    ideaId: asText(o.ideaId) || ideaId,
    bedingung: asText(o.bedingung),
    rahmen: asList(o.rahmen).length ? asList(o.rahmen) : [...PLAN_RAHMEN],
    anforderungen,
    entscheidungen,
    luecken: gapsOf(o.luecken),
    gateway,
    go_wenn: asText(o.go_wenn),
    nogo_wenn: asText(o.nogo_wenn),
    sprints: sprints.sort((a, b) => a.n.localeCompare(b.n, undefined, { numeric: true })),
    simulation: parseSimulation(o.simulation) || undefined,
    revisions: revisionRows,
    evidence,
    backlog,
    risks,
    statusUpdates,
    extensions: { ...(extensions || {}), ...(explicitExtensions || {}) },
  }
  if (sprints.some((sprint) => (sprint.startAt && !validZonedDate(sprint.startAt)) || (sprint.endAt && !validZonedDate(sprint.endAt)))) return null
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
  if (!Array.isArray(raw) || raw.length > 10) return []
  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const id = asText(row.id)
    const snapshot = asText(row.snapshot)
    const at = asText(row.at)
    if (!id || !snapshot || snapshot.length > 100_000 || (at && !validZonedDate(at))) return []
    return [{
      id,
      at: at || new Date(0).toISOString(),
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
  for (const backlog of plan.backlog || []) {
    addId(backlog.id, `Backlog ${backlog.description}`)
    for (const requirementId of backlog.requirementIds) {
      if (!plan.anforderungen.some((need) => need.id === requirementId)) {
        errors.push(`Backlog „${backlog.id}“ verweist auf eine unbekannte Anforderung „${requirementId}“.`)
      }
    }
    if (backlog.sprintId && !plan.sprints.some((sprint) => sprint.n.toUpperCase() === backlog.sprintId?.toUpperCase())) {
      errors.push(`Backlog „${backlog.id}“ verweist auf Sprint „${backlog.sprintId}“, der nicht existiert.`)
    }
  }
  for (const risk of plan.risks || []) addId(risk.id, `Risiko ${risk.description}`)
  for (const sprint of plan.sprints) {
    addId(sprint.n, `Sprint ${sprint.n}`)
    sprintById.set(sprint.n.toUpperCase(), sprint)
    if (!sprint.title.trim() && !sprint.ziel.trim()) errors.push(`Sprint ${sprint.n}: Titel oder Ziel fehlt.`)
    if (sprint.gateway === 'go' && (!sprint.anforderungen.length || !spoken(sprint.go_wenn) || !spoken(sprint.abbruch))) {
      errors.push(`Sprint ${sprint.n}: Go braucht Anforderungen, eine Go-Bedingung und einen Abbruchpunkt.`)
    }
    if (sprint.gateway === 'nogo' && !spoken(sprint.nogo_wenn)) {
      errors.push(`Sprint ${sprint.n}: No-Go braucht eine Begründung.`)
    }
    for (const task of sprint.lieferumfang) addId(task.id, `Aufgabe in Sprint ${sprint.n}`)
    if (sprint.startAt && !validZonedDate(sprint.startAt)) errors.push(`Sprint ${sprint.n}: Startdatum braucht ein gültiges Datum mit Zeitzone.`)
    if (sprint.endAt && !validZonedDate(sprint.endAt)) errors.push(`Sprint ${sprint.n}: Enddatum braucht ein gültiges Datum mit Zeitzone.`)
    if (sprint.startAt && sprint.endAt && Date.parse(sprint.startAt) > Date.parse(sprint.endAt)) {
      errors.push(`Sprint ${sprint.n}: Enddatum liegt vor dem Startdatum.`)
    }
  }
  const edges = new Map<string, string[]>()
  const requirementIds = new Set(plan.anforderungen.map((need) => need.id))
  for (const sprint of plan.sprints) {
    const source = sprint.n.toUpperCase()
    const relations = sprint.relations || sprint.haengt_an.map((targetId) => ({ type: 'depends_on' as const, targetId }))
    const deps: string[] = []
    const seenRelations = new Set<string>()
    for (const relation of relations) {
      const target = relation.targetId.toUpperCase()
      const key = `${relation.type}:${target}`
      if (seenRelations.has(key)) errors.push(`Sprint ${sprint.n}: Beziehung „${relation.type} ${relation.targetId}“ ist doppelt.`)
      seenRelations.add(key)
      if (!sprintById.has(target)) errors.push(`Sprint ${sprint.n}: Beziehung „${relation.type} ${relation.targetId}“ hat kein Ziel.`)
      if (target === source) errors.push(`Sprint ${sprint.n}: darf keine Beziehung zu sich selbst haben.`)
      if (relation.type === 'depends_on') {
        deps.push(target)
      }
    }
    edges.set(source, deps)
    for (const requirementId of sprint.anforderungen) {
      if (!requirementIds.has(requirementId)) {
        errors.push(`Sprint ${sprint.n}: Anforderung „${requirementId}“ existiert nicht.`)
      }
    }
    for (const dependency of deps) {
      const predecessor = sprintById.get(dependency)
      if (predecessor?.endAt && sprint.startAt && Date.parse(predecessor.endAt) > Date.parse(sprint.startAt)) {
        errors.push(`Sprint ${sprint.n}: beginnt vor dem Ende des abhängigen Sprints ${predecessor.n}.`)
      }
    }
  }
  for (const sprint of plan.sprints) {
    const id = sprint.n.toUpperCase()
    const prerequisites = [
      ...(sprint.relations || sprint.haengt_an.map((targetId) => ({ type: 'depends_on' as const, targetId }))).filter((relation) => relation.type === 'depends_on').map((relation) => relation.targetId.toUpperCase()),
      ...plan.sprints.filter((candidate) => (candidate.relations || candidate.haengt_an.map((targetId) => ({ type: 'depends_on' as const, targetId }))).some((relation) => relation.type === 'blocks' && relation.targetId.toUpperCase() === id))
        .map((candidate) => candidate.n.toUpperCase()),
    ]
    for (const prerequisiteId of prerequisites) {
      const predecessor = sprintById.get(prerequisiteId)
      if (predecessor?.endAt && sprint.startAt && Date.parse(predecessor.endAt) > Date.parse(sprint.startAt)) {
        errors.push(`Sprint ${sprint.n}: beginnt vor dem Ende des abhängigen Sprints ${predecessor.n}.`)
      }
      if (sprint.gateway === 'go' && predecessor?.gateway !== 'go') {
        errors.push(`Sprint ${sprint.n}: kann nicht Go sein; blockierender Vorgänger ${predecessor?.n || prerequisiteId} ist nicht freigegeben.`)
      }
    }
  }
  for (const evidence of plan.evidence || []) {
    addId(evidence.id, `Beleg ${evidence.title}`)
    if (evidence.requirementId && !requirementIds.has(evidence.requirementId)) {
      errors.push(`Beleg „${evidence.title}“ verweist auf eine unbekannte Anforderung.`)
    }
    if (evidence.fetchedAt && !validZonedDate(evidence.fetchedAt)) errors.push(`Beleg „${evidence.title}“ hat einen ungültigen Abrufzeitpunkt.`)
  }
  const evidenceIds = new Set((plan.evidence || []).map((item) => item.id))
  for (const need of plan.anforderungen) {
    for (const evidenceId of need.provenance?.evidenceIds || []) {
      if (!evidenceIds.has(evidenceId)) errors.push(`Anforderung „${need.id}“ verweist auf einen unbekannten Beleg „${evidenceId}“.`)
    }
  }
  for (const cut of plan.entscheidungen) {
    for (const evidenceId of cut.provenance?.evidenceIds || []) {
      if (!evidenceIds.has(evidenceId)) errors.push(`Entscheidung „${cut.id}“ verweist auf einen unbekannten Beleg „${evidenceId}“.`)
    }
  }
  for (const update of plan.statusUpdates || []) {
    if (!validZonedDate(update.at)) errors.push('Statusverlauf enthält einen ungültigen Zeitpunkt mit Zeitzone.')
    if (update.sprintId && !sprintById.has(update.sprintId.toUpperCase())) errors.push(`Statusverlauf verweist auf unbekannten Sprint „${update.sprintId}“.`)
    if (update.requirementId && !requirementIds.has(update.requirementId)) errors.push(`Statusverlauf verweist auf unbekannte Anforderung „${update.requirementId}“.`)
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
    const relationNext = [
      ...(edges.get(node) || []),
      ...plan.sprints.filter((candidate) => (candidate.relations || candidate.haengt_an.map((targetId) => ({ type: 'depends_on' as const, targetId }))).some((relation) => relation.type === 'blocks' && relation.targetId.toUpperCase() === node))
        .map((candidate) => candidate.n.toUpperCase()),
    ]
    for (const next of relationNext) if (sprintById.has(next)) visit(next, [...trail, node])
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

export function restorePlanRevision(plan: IdeaPlan, id: string, restoredById?: string, at = new Date()): IdeaPlan | null {
  const revision = plan.revisions?.find((item) => item.id === id)
  if (!revision) return null
  try {
    const parsed = parsePlan(JSON.parse(revision.snapshot), plan.ideaId)
    if (!parsed) return null
    if (!restoredById) return { ...parsed, revisions: plan.revisions }
    const history = savePlanRevision(plan, `Wiederherstellung von Revision ${id}`, restoredById, at).revisions
    return { ...parsed, revisions: history }
  } catch {
    return null
  }
}

export function moveBacklogItem(plan: IdeaPlan, id: string, sprintId?: string): IdeaPlan | null {
  const item = (plan.backlog || []).find((row) => row.id === id)
  if (!item || item.status === 'done') return null
  if (sprintId && !plan.sprints.some((sprint) => sprint.n === sprintId)) return null
  const next = {
    ...plan,
    backlog: (plan.backlog || []).map((row) => row.id === id
      ? { ...row, status: sprintId ? 'planned' as const : 'backlog' as const, ...(sprintId ? { sprintId } : { sprintId: undefined }) }
      : row),
  }
  return validatePlan(next).ok ? next : null
}

export type PlanRevisionDiff = { section: string; before: string; after: string }

export function diffPlanRevisions(before: IdeaPlan, after: IdeaPlan): PlanRevisionDiff[] {
  const fields: Array<[string, unknown, unknown]> = [
    ['Anforderungen', before.anforderungen, after.anforderungen],
    ['Sprints und Lieferumfang', before.sprints.map(({ n, title, ziel, anforderungen, lieferumfang, wont, haengt_an, relations, startAt, endAt }) => ({ n, title, ziel, anforderungen, lieferumfang, wont, haengt_an, relations, startAt, endAt })),
      after.sprints.map(({ n, title, ziel, anforderungen, lieferumfang, wont, haengt_an, relations, startAt, endAt }) => ({ n, title, ziel, anforderungen, lieferumfang, wont, haengt_an, relations, startAt, endAt }))],
    ['Gateways', { gateway: before.gateway, go_wenn: before.go_wenn, nogo_wenn: before.nogo_wenn, sprints: before.sprints.map(({ n, gateway, go_wenn, nogo_wenn, abbruch }) => ({ n, gateway, go_wenn, nogo_wenn, abbruch })) },
      { gateway: after.gateway, go_wenn: after.go_wenn, nogo_wenn: after.nogo_wenn, sprints: after.sprints.map(({ n, gateway, go_wenn, nogo_wenn, abbruch }) => ({ n, gateway, go_wenn, nogo_wenn, abbruch })) }],
    ['Backlog', before.backlog || [], after.backlog || []],
    ['Risiken und Status', { risks: before.risks || [], updates: before.statusUpdates || [] }, { risks: after.risks || [], updates: after.statusUpdates || [] }],
    ['Belege und Herkunft', { evidence: before.evidence || [], decisions: before.entscheidungen }, { evidence: after.evidence || [], decisions: after.entscheidungen }],
    ['Simulationen', before.simulation || null, after.simulation || null],
  ]
  return fields.flatMap(([section, left, right]) => {
    const leftJson = JSON.stringify(left)
    const rightJson = JSON.stringify(right)
    return leftJson === rightJson ? [] : [{ section, before: leftJson, after: rightJson }]
  })
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
