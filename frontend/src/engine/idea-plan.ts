/** Feste Sprint-Vorlage. Das Modell füllt Felder, erfindet keine Gliederung. */

export const CORE_TITLES = ['Kern', 'Härten', 'Probe'] as const

export type IdeaTask = {
  id: string
  task: string
  anleitung: string
}

export type IdeaSprint = {
  n: string
  kind: 'core' | 'custom'
  title: string
  ziel: string
  lieferumfang: IdeaTask[]
  wont: string[]
  abbruch: string
  manuell?: string
}

export type IdeaPlan = {
  ideaId: string
  sprints: IdeaSprint[]
}

function asText(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function asTasks(v: unknown): IdeaTask[] {
  if (!Array.isArray(v)) return []
  const out: IdeaTask[] = []
  for (const row of v) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const task = asText(o.task) || asText(o.title)
    if (!task) continue
    out.push({
      id: asText(o.id) || `S${out.length + 1}`,
      task,
      anleitung: asText(o.anleitung) || asText(o.hint) || task,
    })
  }
  return out
}

function asWont(v: unknown): string[] {
  if (Array.isArray(v)) {
    const rows = v.map((x) => asText(x)).filter(Boolean)
    return rows.length ? rows : ['—']
  }
  const one = asText(v)
  return one ? [one] : ['—']
}

function hasGrund(ziel: string): boolean {
  const t = ziel.replace(/[—–-]/g, '').replace(/\s+/g, ' ').trim()
  return t.length >= 3
}

export function emptyPlan(ideaId: string): IdeaPlan {
  return {
    ideaId,
    sprints: CORE_TITLES.map((title, i) => ({
      n: String(i + 1),
      kind: 'core' as const,
      title,
      ziel: '',
      lieferumfang: [],
      wont: ['—'],
      abbruch: '—',
    })),
  }
}

/** Unbekannte Felder (RICE, Version) fallen weg. Vorlage kaputt → null. */
export function parsePlan(raw: unknown, ideaId = ''): IdeaPlan | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const rows = Array.isArray(o.sprints) ? o.sprints : Array.isArray(raw) ? (raw as unknown[]) : null
  if (!rows) return null
  const sprints: IdeaSprint[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const s = row as Record<string, unknown>
    const n = asText(s.n) || asText(s.id)
    const title = asText(s.title)
    const ziel = asText(s.ziel)
    const kind = asText(s.kind) === 'custom' ? 'custom' : asText(s.kind) === 'core' || /^[123]$/.test(n) ? 'core' : ''
    if (!kind) return null
    if (kind === 'core') {
      if (!/^[123]$/.test(n)) return null
      const want = CORE_TITLES[Number(n) - 1]
      sprints.push({
        n,
        kind: 'core',
        title: want,
        ziel,
        lieferumfang: asTasks(s.lieferumfang),
        wont: asWont(s.wont),
        abbruch: asText(s.abbruch) || '—',
        manuell: asText(s.manuell) || undefined,
      })
    } else {
      if (!/^C\d+$/i.test(n)) return null
      if (!hasGrund(ziel)) return null
      sprints.push({
        n: n.toUpperCase(),
        kind: 'custom',
        title: title || n.toUpperCase(),
        ziel,
        lieferumfang: asTasks(s.lieferumfang),
        wont: asWont(s.wont),
        abbruch: asText(s.abbruch) || '—',
        manuell: asText(s.manuell) || undefined,
      })
    }
  }
  const cores = sprints.filter((s) => s.kind === 'core').sort((a, b) => Number(a.n) - Number(b.n))
  if (cores.length !== 3) return null
  if (cores[0].n !== '1' || cores[1].n !== '2' || cores[2].n !== '3') return null
  if (cores[0].title !== 'Kern' || cores[1].title !== 'Härten' || cores[2].title !== 'Probe') return null
  const custom = sprints.filter((s) => s.kind === 'custom')
  return { ideaId: asText(o.ideaId) || ideaId, sprints: [...cores, ...custom] }
}

/** Sprint 2 oder 3 hat ein Ziel. Leere Vorlage zählt nicht als Plan. */
export function planHasBody(plan: IdeaPlan): boolean {
  return plan.sprints.some(
    (s) => s.kind === 'core' && s.n !== '1' && s.ziel.replace(/[—–-]/g, '').trim().length >= 3,
  )
}

/** Sichtbare Ziele aus echten Treffertiteln. Keine erfundenen Repos. */
export function planFromSources(ideaId: string, title: string, lines: string[]): IdeaPlan | null {
  const tasks = [...new Set(lines.map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length >= 3))].slice(0, 3)
  if (!tasks.length) return null
  const plan = emptyPlan(ideaId)
  plan.sprints[0].ziel = title.slice(0, 120)
  plan.sprints[0].lieferumfang = tasks.map((task, i) => ({
    id: `S1-${i + 1}`,
    task: task.slice(0, 80),
    anleitung: task.slice(0, 120),
  }))
  plan.sprints[1].ziel = `Prüfen: ${tasks[0].slice(0, 72)}`
  plan.sprints[2].ziel = tasks[1] ? `Ansehen: ${tasks[1].slice(0, 72)}` : 'Einen Treffer lokal ansehen'
  return plan
}

export function formatPlan(plan: IdeaPlan, ideaTitle = ''): string {
  const head = ideaTitle ? `${ideaTitle} — PLAN` : 'Sprintplan'
  const parts = [head]
  for (const s of plan.sprints) {
    const label = s.kind === 'core' ? `Sprint ${s.n} — ${s.title}` : `Custom ${s.n} — ${s.title}`
    parts.push('')
    parts.push(label)
    parts.push(`Ziel: ${s.ziel || '—'}`)
    if (s.lieferumfang.length) {
      for (const t of s.lieferumfang) parts.push(`- ${t.id}: ${t.task}`)
    } else {
      parts.push('- (noch leer)')
    }
    parts.push(`Won't: ${s.wont.join('; ')}`)
    parts.push(`Abbruch: ${s.abbruch}`)
  }
  return parts.join('\n')
}

export function nextCustomN(plan: IdeaPlan): string {
  let max = 0
  for (const s of plan.sprints) {
    const m = /^C(\d+)$/i.exec(s.n)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `C${max + 1}`
}

export function findSprint(plan: IdeaPlan, n: string): IdeaSprint | undefined {
  const want = n.trim().toUpperCase()
  return plan.sprints.find((s) => s.n.toUpperCase() === want)
}
