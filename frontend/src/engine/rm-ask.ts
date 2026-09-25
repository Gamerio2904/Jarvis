import { parseRmAskIntent, type RmAskIntent } from './rm-ask-parse.ts'
import { matchSceneCharacter } from './rm-scene.ts'
import {
  characterById,
  dossierFor,
  loadRmSnapshot,
  rmCoverageLine,
  searchCharacters,
  staffelFolge,
} from './rm-graph.ts'
import { RM_SKILLS } from './rm-dossier.ts'
import { loadSettings, saveSettings } from './store.ts'
import type { ToolMeta } from './tools.ts'
import type { RmDossier, RmSkill } from './rm-types.ts'

export { parseRmAskIntent } from './rm-ask-parse.ts'

type Hit = { handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }

function tool(action: string): ToolMeta {
  return { tool_status: 'executed', tool: 'hud', action, label: 'Serie-Netz' }
}

function persistChar(name: string): void {
  try {
    saveSettings({ last_step_tool: 'hud', last_step_title: name })
  } catch {
    /* */
  }
}

function lastCharacterName(): string {
  try {
    const s = loadSettings()
    if (s.last_step_tool === 'hud' && s.last_step_title) return s.last_step_title
  } catch {
    /* */
  }
  return ''
}

function resolveCharacter(name: string | null): { id: number; name: string } | null {
  if (name) {
    const hit = matchSceneCharacter(name)
    if (hit) return hit
    const loose = searchCharacters(name)
    if (loose[0]) return { id: loose[0].id, name: loose[0].name }
  }
  const last = lastCharacterName()
  if (!last) return null
  return matchSceneCharacter(last) || (searchCharacters(last)[0] ? { id: searchCharacters(last)[0].id, name: searchCharacters(last)[0].name } : null)
}

function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

function skillHits(card: RmDossier, q: string | null): RmSkill[] {
  if (!q) return card.skills
  const n = fold(q)
  const keys = n.split(/[^a-z0-9]+/).filter((w) => w.length >= 4)
  if (!keys.length) return card.skills
  const hit = card.skills.filter((s) => {
    const hay = fold(`${s.name} ${s.evidence.note} ${s.evidence.code}`)
    return keys.some((k) => hay.includes(k))
  })
  return hit.length ? hit : []
}

function findSkillAcross(q: string | null): { id: number; name: string } | null {
  if (!q) return null
  const n = fold(q)
  const keys = n.split(/[^a-z0-9]+/).filter((w) => w.length >= 4)
  if (!keys.length) return null
  for (const [idRaw, rows] of Object.entries(RM_SKILLS)) {
    const id = Number(idRaw)
    for (const s of rows) {
      const hay = fold(`${s.name} ${s.note}`)
      if (keys.some((k) => hay.includes(k))) {
        const card = dossierFor(id)
        if (card) return { id, name: card.name }
        const c = characterById(id)
        if (c) return { id: c.id, name: c.name }
        return { id, name: String(id) }
      }
    }
  }
  return null
}

function formatWho(card: RmDossier): string {
  const traits = card.traits.map((t) => `${t.label} ${t.value}`).join(', ')
  const skills = card.skills.length
    ? card.skills
        .slice(0, 8)
        .map((s) => `${s.name} — ${staffelFolge(s.evidence.code)}${s.evidence.title ? ` (${s.evidence.title})` : ''}: ${s.evidence.note}`)
        .join('; ')
    : 'keine kuratierte Fähigkeit'
  const near = card.neighbors
    .slice(0, 6)
    .map((n) => n.name)
    .join(', ')
  return `${card.name}. ${traits}. Auftritte ${card.appearanceCount} (S01–S05). Fähigkeiten: ${skills}.${near ? ` Verbindung: ${near}.` : ''} ${rmCoverageLine()}`
}

function formatSkill(card: RmDossier, skills: RmSkill[]): string {
  if (!skills.length) {
    return `${card.name}: dazu steht im Graph nichts Belegtes. Keine Erfindung.`
  }
  const line = skills
    .slice(0, 6)
    .map((s) => `${s.name} — ${staffelFolge(s.evidence.code)}${s.evidence.title ? ` (${s.evidence.title})` : ''}: ${s.evidence.note}`)
    .join('; ')
  return `${card.name}: ${line}`
}

export function answerRmAsk(intent: RmAskIntent): string {
  if (intent.kind === 'graph') {
    const snap = loadRmSnapshot()
    return rmCoverageLine() + ` Im Chat gilt nur, was der Graph oder die Kamera belegt — ${snap.characters.length} Knoten.`
  }
  let who = resolveCharacter(intent.name)
  if (!who && intent.kind === 'skill') who = findSkillAcross(intent.skillQ)
  if (!who) {
    return intent.name
      ? `«${intent.name}» ist kein Knoten im Serie-Netz. Keine Erfindung.`
      : 'Welcher Charakter? Name oder Knoten antippen.'
  }
  const card = dossierFor(who.id)
  if (!card) return `Kein Steckbrief für ${who.name}.`
  persistChar(card.name)
  if (intent.kind === 'skill') return formatSkill(card, skillHits(card, intent.skillQ))
  return formatWho(card)
}

export async function handleRmAsk(text: string): Promise<Hit> {
  const intent = parseRmAskIntent(text)
  if (!intent) return { handled: false }
  return {
    handled: true,
    reply: answerRmAsk(intent),
    tool: tool(intent.kind),
    lastTool: 'hud',
  }
}
