/** Projektdateien der Tischplatte. Sprints und PSP als JSON, ohne Agentenfenster. */

import type { Idea } from './store.ts'
import { emptyPlan, parsePlan, type IdeaPlan, type IdeaSprint, validatePlan } from './idea-plan.ts'
import { wbsFor } from './idea-simulation.ts'

export type ProjectFileKind = 'psp' | 'sprints' | 'all'
export const PROJECT_FILE_VERSION = 2
const MAX_PROJECT_FILE_BYTES = 2_000_000

export function projectSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return slug || 'projekt'
}

export const PLAN_GAPS = [
  { name: 'Recherche', warum: 'Keine Quelle. Sag Such, dann wird sie festgehalten.' },
  { name: 'Abnahme', warum: 'Kein Kriterium im Satz.' },
  { name: 'Risiken', warum: 'Nicht benannt.' },
  { name: 'Schnittstellen', warum: 'Nicht benannt.' },
] as const

function sprintRow(s: IdeaSprint) {
  return {
    n: s.n,
    title: s.title,
    ziel: s.ziel || '',
    lieferumfang: s.lieferumfang.map((t) => ({ id: t.id, task: t.task, anleitung: t.anleitung })),
    wont: s.wont,
    gateway: s.gateway,
    go_wenn: s.go_wenn,
    nogo_wenn: s.nogo_wenn,
    abbruch: s.abbruch,
    haengt_an: s.haengt_an,
    prompt: s.prompt || '',
  }
}

export function projectPlan(idea: Idea): IdeaPlan {
  return idea.plan || emptyPlan(idea.id, idea.body || idea.title)
}

export function wegeDocument(idea: Idea) {
  const plan = projectPlan(idea)
  const tasks = plan.sprints[0]?.lieferumfang || []
  return {
    projekt: idea.title,
    art: 'wege',
    schritt: 1,
    herkunft: 'aus dem Satz',
    wege: tasks.map((t, i) => ({
      id: `W${i + 1}`,
      satz: t.task,
      weg: `Prüfen, ob der Satz „${t.task}“ trägt.`,
      quelle: '',
    })),
    hinweis: 'Der Satz ist die Quelle.',
  }
}

export function lueckenDocument(idea: Idea) {
  return {
    projekt: idea.title,
    art: 'luecken',
    fehlt: PLAN_GAPS.map((gap) => ({ name: gap.name, warum: gap.warum })),
  }
}

export function pspDocument(idea: Idea) {
  const plan = projectPlan(idea)
  return {
    schemaVersion: PROJECT_FILE_VERSION,
    projekt: idea.title,
    art: 'psp',
    bedingung: plan.bedingung,
    struktur: wbsFor(idea, plan),
  }
}

export function sprintsDocument(idea: Idea) {
  const plan = projectPlan(idea)
  return {
    schemaVersion: PROJECT_FILE_VERSION,
    projekt: idea.title,
    art: 'sprints',
    sprints: plan.sprints.map(sprintRow),
  }
}

export function projectDocument(idea: Idea) {
  const rawPlan = projectPlan(idea)
  const plan = parsePlan(rawPlan, idea.id) || rawPlan
  const document = {
    schemaVersion: PROJECT_FILE_VERSION,
    ideaId: idea.id,
    projekt: idea.title,
    art: 'projekt',
    notiz: idea.body || '',
    ziel: plan.sprints[0]?.ziel || '',
    wege: wegeDocument(idea).wege,
    fehlt: lueckenDocument(idea).fehlt,
    sprints: sprintsDocument(idea).sprints,
    psp: pspDocument(idea).struktur,
    plan,
    extensions: plan.extensions?.projectFile || {},
  }
  return { ...document, contentHash: projectContentHash(document) }
}

export type ImportedProject = {
  schemaVersion: number
  ideaId?: string
  projekt: string
  notiz: string
  plan: IdeaPlan
}

export function parseProjectFile(raw: unknown): ImportedProject {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Die Projektdatei ist kein JSON-Objekt.')
  const row = raw as Record<string, unknown>
  let encoded: string
  try {
    encoded = JSON.stringify(raw)
  } catch {
    throw new Error('Die Projektdatei kann nicht geprüft werden.')
  }
  if (!encoded || new TextEncoder().encode(encoded).length > MAX_PROJECT_FILE_BYTES) throw new Error('Die Projektdatei ist größer als 2 MB oder nicht lesbar.')
  if (row.schemaVersion !== 1 && row.schemaVersion !== PROJECT_FILE_VERSION) throw new Error('Diese Projektdatei hat eine unbekannte oder fehlende Formatversion.')
  if (Array.isArray(row.requiredFields) && row.requiredFields.some((field) => typeof field !== 'string' || !['plan', 'projekt', 'notiz', 'ideaId'].includes(field))) {
    throw new Error('Die Projektdatei enthält unbekannte Pflichtfelder; sie kann nicht verlustfrei importiert werden.')
  }
  const title = typeof row.projekt === 'string' ? row.projekt : ''
  if (!title.trim() || title.length > 120) throw new Error('In der Projektdatei fehlt ein gültiger Projektname (höchstens 120 Zeichen).')
  const plan = parsePlan(row.plan)
  if (!plan) throw new Error('Der Plan in der Datei ist beschädigt oder unvollständig.')
  if (row.schemaVersion === PROJECT_FILE_VERSION) {
    const rawPlan = row.plan as Record<string, unknown>
    const planFields = new Set([
      'schemaVersion', 'ideaId', 'bedingung', 'rahmen', 'anforderungen', 'entscheidungen', 'luecken',
      'gateway', 'go_wenn', 'nogo_wenn', 'sprints', 'simulation', 'revisions', 'evidence', 'backlog',
      'risks', 'statusUpdates', 'extensions',
    ])
    const unknownPlanFields = Object.fromEntries(Object.entries(rawPlan).filter(([key]) => !planFields.has(key)))
    const expectedPlan = { ...rawPlan, extensions: { ...((rawPlan.extensions || {}) as Record<string, unknown>), ...unknownPlanFields } }
    for (const key of Object.keys(unknownPlanFields)) delete (expectedPlan as Record<string, unknown>)[key]
    if (stableJson(expectedPlan) !== stableJson(plan)) {
      throw new Error('Der Plan enthält Felder, die sich nicht verlustfrei lesen lassen.')
    }
  }
  const validation = validatePlan(plan)
  if (!validation.ok) throw new Error(`Der Plan ist ungültig: ${validation.errors.join(' ')}`)
  if (plan.ideaId && typeof row.ideaId === 'string' && row.ideaId && plan.ideaId !== row.ideaId) {
    throw new Error('Projektkennung und Plankennung passen nicht zusammen.')
  }
  if (row.notiz !== undefined && typeof row.notiz !== 'string') throw new Error('Die Projektnotiz hat ein ungültiges Format.')
  const knownRoot = new Set(['schemaVersion', 'ideaId', 'projekt', 'art', 'notiz', 'ziel', 'wege', 'fehlt', 'sprints', 'psp', 'plan', 'extensions', 'contentHash', 'requiredFields'])
  const rootExtensions = Object.fromEntries(Object.entries(row).filter(([key]) => !knownRoot.has(key)))
  const fileExtensions = row.extensions === undefined ? {} : row.extensions
  if (!fileExtensions || typeof fileExtensions !== 'object' || Array.isArray(fileExtensions)) {
    throw new Error('Die Projekterweiterungen sind beschädigt.')
  }
  const projectExtensions = { ...(fileExtensions as Record<string, unknown>), ...rootExtensions }
  const extensions = {
    ...plan.extensions,
    ...(Object.keys(projectExtensions).length ? { projectFile: projectExtensions } : {}),
  }
  const importedPlan: IdeaPlan = { ...plan, extensions }
  if (row.schemaVersion === PROJECT_FILE_VERSION) {
    const { contentHash, ...content } = row
    if (typeof contentHash !== 'string' || contentHash !== projectContentHash(content)) {
      throw new Error('Die Prüfsumme stimmt nicht. Die Projektdatei wurde möglicherweise verändert oder beschädigt.')
    }
  }
  return {
    schemaVersion: PROJECT_FILE_VERSION,
    ideaId: typeof row.ideaId === 'string' ? row.ideaId : undefined,
    projekt: title,
    notiz: typeof row.notiz === 'string' ? row.notiz : '',
    plan: importedPlan,
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

/** A deterministic corruption check, not a signature or authenticity proof. */
function projectContentHash(value: unknown): string {
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(stableJson(value))) {
    hash ^= BigInt(byte)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return hash.toString(16).padStart(16, '0')
}

function mermaidSafe(text: string): string {
  return text.replace(/["`<>{}|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100)
}

export function prdDocument(idea: Idea): string {
  const plan = projectPlan(idea)
  const lines = [`# ${idea.title}`, '', '## Ursprünglicher Wunsch', '', plan.bedingung || idea.body || 'Nicht angegeben.', '']
  lines.push('## Anforderungen', '')
  lines.push(...(plan.anforderungen.length ? plan.anforderungen.map((item) => `- ${item.satz}${item.abnahme ? ` — Abnahme: ${item.abnahme}` : ''}`) : ['- Noch keine Anforderungen festgelegt.']))
  lines.push('', '## Entscheidungen', '')
  lines.push(...(plan.entscheidungen.length ? plan.entscheidungen.map((item) => `- ${item.schnitt}: ${item.grund} (${item.gateway})`) : ['- Noch keine Entscheidungen festgehalten.']))
  lines.push('', '## Sprints', '')
  lines.push(...(plan.sprints.length ? plan.sprints.map((sprint) => `- Sprint ${sprint.n}: ${sprint.title || sprint.ziel} — ${sprint.gateway}`) : ['- Noch keine Sprints festgelegt.']))
  lines.push('', '## Offene Punkte', '')
  lines.push(...(plan.luecken.length ? plan.luecken.map((gap) => `- ${gap.name}: ${gap.satz || 'Noch offen.'}`) : ['- Keine offenen Punkte dokumentiert.']))
  lines.push('', `## Projekt-Gateway: ${plan.gateway}`, '')
  return lines.join('\n')
}

export function mermaidDocument(idea: Idea): string {
  const plan = projectPlan(idea)
  const lines = ['flowchart TD', `  project["${mermaidSafe(idea.title)}"]`]
  for (const sprint of plan.sprints) {
    const id = `s${sprint.n.replace(/[^a-zA-Z0-9]/g, '_')}`
    lines.push(`  ${id}["Sprint ${mermaidSafe(sprint.n)}: ${mermaidSafe(sprint.title || sprint.ziel)} (${sprint.gateway})"]`)
    lines.push(`  project --> ${id}`)
    for (const dep of sprint.haengt_an) {
      const depId = `s${dep.replace(/[^a-zA-Z0-9]/g, '_')}`
      if (plan.sprints.some((candidate) => candidate.n.toUpperCase() === dep.toUpperCase())) {
        lines.push(`  ${depId} --> ${id}`)
      }
    }
  }
  return lines.join('\n') + '\n'
}

export function implementationGuide(idea: Idea, selectedSprintIds?: string[]): string {
  const plan = projectPlan(idea)
  const selected = new Set(selectedSprintIds || plan.sprints.filter((s) => s.gateway === 'go').map((s) => s.n))
  const sprints = plan.sprints.filter((s) => selected.has(s.n))
  const lines = [`# Arbeitsleitfaden: ${idea.title}`, '', '> Arbeitsunterlage aus dem Plan. Sie ist keine Zusage fehlerfreier Umsetzung.', '']
  lines.push(`Ausgangswunsch: ${plan.bedingung || idea.body || 'Nicht angegeben.'}`, '')
  if (!sprints.length) lines.push('Es gibt keine ausgewählten und freigegebenen Sprints.', '')
  for (const sprint of sprints) {
    if (sprint.gateway !== 'go') {
      lines.push(`## Sprint ${sprint.n} — nicht freigegeben`, '', 'Dieser Sprint wird nicht als ausführbarer Arbeitsauftrag ausgegeben.', '')
      continue
    }
    lines.push(`## Sprint ${sprint.n}: ${sprint.title}`, '', `Ziel: ${sprint.ziel}`, '', 'Arbeit:', '')
    lines.push(...sprint.lieferumfang.map((task) => `- ${task.task}${task.anleitung ? ` — ${task.anleitung}` : ''}`))
    lines.push('', `Abbruch: ${sprint.abbruch}`, '', `Nicht enthalten: ${sprint.wont.join('; ')}`, '')
  }
  return lines.join('\n')
}

export function downloadTextFile(name: string, text: string, mime = 'text/markdown'): void {
  if (typeof document === 'undefined') throw new Error('Dateidownload ist in dieser Umgebung nicht verfügbar.')
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function fileFor(idea: Idea, kind: ProjectFileKind): { name: string; data: unknown } {
  const validation = validatePlan(projectPlan(idea))
  if (!validation.ok) {
    throw new Error(`Projektdatei nicht exportiert: ${validation.errors.join(' ')}`)
  }
  const slug = projectSlug(idea.title)
  if (kind === 'psp') return { name: `${slug}-psp.json`, data: pspDocument(idea) }
  if (kind === 'sprints') return { name: `${slug}-sprints.json`, data: sprintsDocument(idea) }
  return { name: `${slug}-projekt.json`, data: projectDocument(idea) }
}

export async function saveProjectJson(name: string, data: unknown): Promise<string> {
  const text = JSON.stringify(data, null, 2)
  const { saveToDownloads } = await import('../native/device.ts')
  const native = await saveToDownloads(name, text)
  if (native.ok) return `Gespeichert in Downloads/${name}.`
  if (typeof document === 'undefined') return `Datei bereit: ${name}.`
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  return `Gespeichert als ${name}.`
}
