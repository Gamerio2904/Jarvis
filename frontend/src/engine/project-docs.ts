/** Projektdateien der Tischplatte. Sprints und PSP als JSON, ohne Agentenfenster. */

import type { Idea } from './store.ts'
import { emptyPlan, type IdeaPlan, type IdeaSprint } from './idea-plan.ts'

export type ProjectFileKind = 'psp' | 'sprints' | 'all'

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

function pspRow(s: IdeaSprint) {
  return {
    n: s.n,
    title: s.title,
    ziel: s.ziel || '',
    pakete: s.lieferumfang.map((t) => ({ id: t.id, arbeit: t.task })),
    offen: s.lieferumfang.length ? 'Der Satz ist die Quelle.' : 'Noch leer',
  }
}

export function projectPlan(idea: Idea): IdeaPlan {
  return idea.plan && idea.plan.sprints?.length ? idea.plan : emptyPlan(idea.id)
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
    projekt: idea.title,
    art: 'psp',
    psp: plan.sprints.map(pspRow),
  }
}

export function sprintsDocument(idea: Idea) {
  const plan = projectPlan(idea)
  return {
    projekt: idea.title,
    art: 'sprints',
    sprints: plan.sprints.map(sprintRow),
  }
}

export function projectDocument(idea: Idea) {
  const plan = projectPlan(idea)
  return {
    projekt: idea.title,
    art: 'projekt',
    notiz: idea.body || '',
    ziel: plan.sprints[0]?.ziel || '',
    wege: wegeDocument(idea).wege,
    fehlt: lueckenDocument(idea).fehlt,
    sprints: sprintsDocument(idea).sprints,
    psp: pspDocument(idea).psp,
  }
}

export function fileFor(idea: Idea, kind: ProjectFileKind): { name: string; data: unknown } {
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
