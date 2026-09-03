/** Körper-Baum: Eingang → Skill → Wissen. Token-Cluster, kein Qdrant, e5 nie pickRoute. */

import type { BodyOrgan } from './hud-parse.ts'
import type { BodySnap } from './body-snap.ts'
import type { KnowledgePack } from './knowledge-types.ts'
import { retrievePacks } from './knowledge-retrieve.ts'

export const BODY_TREE_SKILL_CAP = 5
export const BODY_TREE_KNOWLEDGE_CAP = 6
export const BODY_TREE_CLAIM_CAP = 8
export const BODY_TREE_DEPTH_MAX = 3

export type BodyNodeKind = 'organ' | 'skill' | 'cluster' | 'knowledge' | 'claim'

export type BodyTreeNode = {
  id: string
  kind: BodyNodeKind
  label: string
  line: string
  live: boolean
  parent: string | null
  depth: number
  skill?: string
  prompt?: string
}

export type BodyGraph = {
  organ: BodyOrgan
  query: string
  nodes: BodyTreeNode[]
  empty: boolean
}

export type SkillSpec = {
  id: string
  label: string
  organs: readonly BodyOrgan[]
  prompt: string
}

/** Fähigkeits-Knoten. Kein zweites Register — ids = route-pick. */
export const SKILL_CATALOG: SkillSpec[] = [
  { id: 'calendar', label: 'Kalender', organs: ['memory', 'brain', 'hand'], prompt: 'Was steht heute an?' },
  { id: 'research', label: 'Internet', organs: ['brain', 'eye'], prompt: 'Suche im Internet nach ' },
  { id: 'teach', label: 'Deep Research', organs: ['brain'], prompt: 'Lern das als Fachwissen ' },
  { id: 'memory', label: 'Gedächtnis', organs: ['memory', 'brain'], prompt: 'Was trinke ich?' },
  { id: 'recall', label: 'Recall', organs: ['memory'], prompt: 'Was weißt du über den Zahnarzt' },
  { id: 'eye', label: 'Auge', organs: ['eye'], prompt: 'Lies das Foto' },
  { id: 'desk', label: 'Tisch', organs: ['eye', 'pc_eye'], prompt: 'Schau auf den Tisch' },
  { id: 'pc', label: 'PC', organs: ['pc_eye', 'pc_hand'], prompt: 'PC testen' },
  { id: 'doc', label: 'Datei', organs: ['eye', 'hand'], prompt: 'Was steht in der Datei' },
]

export type BodyGraphInput = {
  organ: BodyOrgan
  snap: BodySnap
  packs: KnowledgePack[]
  memory: Array<{ id: string; key: string; value: string; category?: string }>
  events: Array<{ id: string; title: string; start_at: string; place?: string }>
  lastUtterance?: string
  lastStepTool?: string
  lastEyeLine?: string
}

function tokens(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2)
}

function overlap(a: string, b: string): number {
  const ta = new Set(tokens(a))
  if (!ta.size) return 0
  const tb = tokens(b)
  return tb.filter((w) => ta.has(w)).length / Math.max(ta.size, 1)
}

export function organQuery(input: BodyGraphInput): string {
  const o = input.organ
  if (o === 'eye') return (input.lastEyeLine || '').trim() || 'auge foto'
  if (o === 'memory') return (input.lastUtterance || '').trim() || 'gemerkt pin'
  if (o === 'hand') return (input.lastStepTool || '').trim() || 'hand aktion'
  if (o === 'brain') return (input.lastUtterance || '').trim() || 'hirn'
  if (o === 'ear') return 'wake ohr'
  if (o === 'mouth') return 'stimme mund'
  if (o === 'pc_eye') return 'pc screenshot'
  if (o === 'pc_hand') return 'pc klick'
  return o
}

export function skillsForOrgan(organ: BodyOrgan, lastStepTool = ''): SkillSpec[] {
  const hits = SKILL_CATALOG.filter((s) => s.organs.includes(organ))
  const extra = SKILL_CATALOG.find((s) => s.id === lastStepTool)
  const out = extra && !hits.some((s) => s.id === extra.id) ? [extra, ...hits] : hits
  return out.slice(0, BODY_TREE_SKILL_CAP)
}

export function clusterKey(pack: KnowledgePack): string {
  const raw = (pack.topic || pack.title || 'wissen').toLowerCase()
  const head = raw.split(/[-_\s]/).filter(Boolean)[0] || 'wissen'
  return head
}

export function buildBodyGraph(input: BodyGraphInput): BodyGraph {
  const query = organQuery(input)
  const organId = `organ:${input.organ}`
  const snapLine = input.snap[input.organ]?.line || ''
  const nodes: BodyTreeNode[] = [
    {
      id: organId,
      kind: 'organ',
      label: input.organ,
      line: snapLine,
      live: Boolean(input.snap[input.organ]?.live),
      parent: null,
      depth: 0,
    },
  ]

  const skills = skillsForOrgan(input.organ, input.lastStepTool)
  const packs = retrievePacks(query, input.packs)
  const clusters = new Map<string, KnowledgePack[]>()
  for (const p of packs) {
    const k = clusterKey(p)
    const row = clusters.get(k) || []
    row.push(p)
    clusters.set(k, row)
  }

  for (const skill of skills) {
    const sid = `skill:${skill.id}`
    nodes.push({
      id: sid,
      kind: 'skill',
      label: skill.label,
      line: `Skill · ${skill.id}`,
      live: true,
      parent: organId,
      depth: 1,
      skill: skill.id,
      prompt: skill.prompt,
    })

    if (skill.id === 'calendar') {
      for (const ev of input.events.slice(0, 4)) {
        nodes.push({
          id: `event:${ev.id}`,
          kind: 'knowledge',
          label: ev.title,
          line: ev.place ? `${ev.start_at} · ${ev.place}` : ev.start_at,
          live: true,
          parent: sid,
          depth: 2,
          skill: 'calendar',
          prompt: `Was steht am ${ev.title} an?`,
        })
      }
    }

    if (skill.id === 'memory' || skill.id === 'recall') {
      const mem = input.memory
        .map((m) => ({ m, s: Math.max(overlap(query, `${m.key} ${m.value}`), overlap(skill.id, m.key)) }))
        .filter((x) => x.s > 0 || input.organ === 'memory')
        .sort((a, b) => b.s - a.s)
        .slice(0, 4)
      for (const { m } of mem) {
        nodes.push({
          id: `mem:${m.id}`,
          kind: 'knowledge',
          label: m.key,
          line: m.value,
          live: true,
          parent: sid,
          depth: 2,
          skill: skill.id,
          prompt: `Was weißt du über ${m.key}`,
        })
      }
    }

    if (skill.id === 'research' || skill.id === 'teach') {
      let claimN = 0
      for (const [ck, group] of clusters) {
        if (nodes.filter((n) => n.kind === 'knowledge').length >= BODY_TREE_KNOWLEDGE_CAP) break
        const cid = `cluster:${skill.id}:${ck}`
        nodes.push({
          id: cid,
          kind: 'cluster',
          label: ck,
          line: `${group.length} Pack${group.length === 1 ? '' : 's'} · Token-Cluster, kein Vektorindex`,
          live: true,
          parent: sid,
          depth: 2,
          skill: skill.id,
        })
        for (const p of group.slice(0, 2)) {
          const pid = `pack:${p.id}`
          nodes.push({
            id: pid,
            kind: 'knowledge',
            label: p.title || p.topic,
            line: p.summary.slice(0, 160) || p.topic,
            live: Boolean(p.user_ok),
            parent: cid,
            depth: 3,
            skill: skill.id,
            prompt: `Fachwissen ${p.topic}`,
          })
          for (const c of p.claims.filter((x) => x.user_ok).slice(0, 2)) {
            if (claimN >= BODY_TREE_CLAIM_CAP) break
            claimN += 1
            nodes.push({
              id: `claim:${c.id}`,
              kind: 'claim',
              label: 'Claim',
              line: c.text.slice(0, 180),
              live: true,
              parent: pid,
              depth: 3,
              skill: skill.id,
            })
          }
        }
      }
    }
  }

  const leafKinds = new Set(['knowledge', 'claim', 'cluster'])
  const empty = !nodes.some((n) => leafKinds.has(n.kind))
  if (empty) {
    nodes.push({
      id: 'empty',
      kind: 'knowledge',
      label: 'Leer',
      line: 'Kein Knoten. Foto, Teach oder Termin zuerst — ich erfinde keinen Baum.',
      live: false,
      parent: organId,
      depth: 1,
    })
  }

  return { organ: input.organ, query, nodes, empty }
}

export function childrenOf(graph: BodyGraph, parentId: string): BodyTreeNode[] {
  return graph.nodes.filter((n) => n.parent === parentId)
}

export async function loadBodyGraph(
  organ: BodyOrgan,
  snap: BodySnap,
  lastUtterance = '',
): Promise<BodyGraph> {
  const { listKnowledgePacks } = await import('./knowledge-store.ts')
  const { listMemory, listEvents, loadSettings } = await import('./store.ts')
  let packs: KnowledgePack[] = []
  let memory: BodyGraphInput['memory'] = []
  let events: BodyGraphInput['events'] = []
  let lastStepTool = ''
  let lastEyeLine = ''
  try {
    const s = loadSettings()
    lastStepTool = s.last_step_tool || ''
    lastEyeLine = s.last_eye_line || ''
    packs = await listKnowledgePacks()
    memory = (await listMemory()).map((m) => ({
      id: m.id,
      key: m.key,
      value: m.value,
      category: m.category,
    }))
    events = (await listEvents()).slice(0, 8)
  } catch {
    /* Node / leerer Store */
  }
  return buildBodyGraph({
    organ,
    snap,
    packs,
    memory,
    events,
    lastUtterance,
    lastStepTool,
    lastEyeLine,
  })
}
