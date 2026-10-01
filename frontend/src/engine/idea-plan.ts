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
}

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

function asTasks(v: unknown): IdeaTask[] {
  if (!Array.isArray(v)) return []
  const out: IdeaTask[] = []
  for (const row of v) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const task = asText(o.task) || asText(o.arbeit) || asText(o.title)
    if (!task) continue
    const anleitung = asText(o.anleitung) || asText(o.fertig_wenn) || asText(o.hint)
    out.push({
      id: asText(o.id) || `S${out.length + 1}`,
      task,
      anleitung: anleitung && anleitung !== task ? anleitung : 'Satz prüfen. Quelle fehlt.',
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
  }
}

function sprintGate(raw: string, sprint: Pick<IdeaSprint, 'anforderungen' | 'go_wenn' | 'abbruch'>): Gate {
  if (raw === 'nogo') return 'nogo'
  if (raw === 'go' && sprint.anforderungen.length > 0 && spoken(sprint.go_wenn) && spoken(sprint.abbruch)) return 'go'
  return 'offen'
}

export function emptyPlan(ideaId: string, bedingung = ''): IdeaPlan {
  return {
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
      lieferumfang: asTasks(s.lieferumfang),
      wont: asWont(s.wont),
      gateway: 'offen',
      go_wenn: asText(s.go_wenn),
      nogo_wenn: asText(s.nogo_wenn),
      abbruch: asText(s.abbruch) || '—',
      haengt_an: asList(s.haengt_an || s['hängt_an']),
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
  return {
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
    sprint.lieferumfang = [{ id: `S${i + 1}-1`, task: task.slice(0, 80), anleitung: 'Satz prüfen. Quelle fehlt.' }]
    return sprint
  })
  plan.luecken = [{ id: 'L1', name: 'Gateway', satz: 'Go ist offen. Die Treffer sind noch keine Abnahme.' }]
  return plan
}

export function formatPlan(plan: IdeaPlan, ideaTitle = ''): string {
  const head = ideaTitle ? `${ideaTitle} — PLAN` : 'Sprintplan'
  const parts = [head]
  if (plan.bedingung) parts.push(`Bedingung: ${plan.bedingung}`)
  parts.push(`Gateway: ${plan.gateway}`)
  if (!plan.sprints.length) parts.push('Sprints: noch keine. Die Hülle wartet.')
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
