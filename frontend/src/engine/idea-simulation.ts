import type { Idea, } from './store.ts'
import type { IdeaPlan, IdeaSimulation, IdeaSimulationElement } from './idea-plan.ts'

export type WbsNode = {
  id: string
  label: string
  kind: 'project' | 'group' | 'requirement' | 'decision' | 'gap' | 'task'
  children: WbsNode[]
}

export function wbsFor(idea: Idea, plan: IdeaPlan): WbsNode {
  const children: WbsNode[] = []
  if (plan.anforderungen.length) {
    children.push({
      id: `${idea.id}:requirements`,
      label: 'Anforderungen',
      kind: 'group',
      children: plan.anforderungen.map((item) => ({
        id: item.id,
        label: item.satz,
        kind: 'requirement',
        children: item.abnahme ? [{ id: `${item.id}:acceptance`, label: `Abnahme: ${item.abnahme}`, kind: 'task', children: [] }] : [],
      })),
    })
  }
  if (plan.entscheidungen.length) {
    children.push({
      id: `${idea.id}:decisions`,
      label: 'Entscheidungen',
      kind: 'group',
      children: plan.entscheidungen.map((item) => ({
        id: item.id,
        label: `${item.schnitt}: ${item.grund}`,
        kind: 'decision',
        children: [],
      })),
    })
  }
  const tasks = plan.sprints.flatMap((sprint) => sprint.lieferumfang)
  if (tasks.length) {
    children.push({
      id: `${idea.id}:work`,
      label: 'Arbeitspakete',
      kind: 'group',
      children: tasks.map((item) => ({ id: item.id, label: item.task, kind: 'task', children: [] })),
    })
  }
  if (plan.luecken.length) {
    children.push({
      id: `${idea.id}:gaps`,
      label: 'Noch zu klären',
      kind: 'group',
      children: plan.luecken.map((item) => ({
        id: item.id,
        label: `${item.name}: ${item.satz || 'Noch keine Beschreibung.'}`,
        kind: 'gap',
        children: [],
      })),
    })
  }
  return { id: idea.id, label: idea.title, kind: 'project', children }
}

export function guiSimulation(title: string, elements: IdeaSimulationElement[], assumptions: string[] = []): IdeaSimulation {
  return {
    version: 1,
    kind: 'gui',
    title: title.slice(0, 120),
    elements: elements.slice(0, 32),
    assumptions: assumptions.slice(0, 12),
    createdAt: new Date().toISOString(),
  }
}

export function workflowDryRun(plan: IdeaPlan, title: string): IdeaSimulation {
  const steps = plan.sprints.flatMap((sprint) =>
    sprint.lieferumfang.map((task) => `Sprint ${sprint.n}: ${task.task}`),
  )
  const warnings = plan.sprints
    .filter((sprint) => sprint.gateway !== 'go')
    .map((sprint) => `Sprint ${sprint.n} ist ${sprint.gateway}; er wird hier nicht als freigegeben behandelt.`)
  const elements: IdeaSimulationElement[] = [
    { type: 'heading', text: 'Gedanklicher Probelauf' },
    {
      type: 'text',
      text: steps.length ? `${steps.length} geplante Arbeitsschritte – nur als Vorschau, nichts wird ausgeführt.` : 'Keine Arbeitsschritte vorhanden.',
    },
    { type: 'list', title: 'Geplante Schritte', items: steps.slice(0, 12) },
  ]
  if (warnings.length) elements.push({ type: 'list', title: 'Noch nicht freigegeben', items: warnings.slice(0, 12) })
  return {
    version: 1,
    kind: 'workflow',
    title: `${title}: Ablauf-Simulation`,
    elements,
    assumptions: ['Dies ist ein gedanklicher Probelauf; es wurden keine echten Tests, Dateien, Netzaufrufe oder Änderungen ausgeführt.'],
    createdAt: new Date().toISOString(),
  }
}
