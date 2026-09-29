import { del, getAll, newId, put } from './store.ts'
import { applySceneSkills } from './rm-graph.ts'

export type RmSceneSkill = {
  id: string
  characterId: number | null
  characterName: string
  name: string
  code: string
  note: string
  created_at: string
}

const STORE = 'rm_scene_skills'
const EVENT = 'jarvis-rm-scene'

export function emitRmScene(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENT))
}

export function onRmScene(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT, fn)
  return () => window.removeEventListener(EVENT, fn)
}

export async function listRmSceneSkills(code?: string): Promise<RmSceneSkill[]> {
  const rows = await getAll<RmSceneSkill>(STORE)
  const filtered = code ? rows.filter((r) => r.code.toUpperCase() === code.toUpperCase()) : rows
  return filtered.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export async function addRmSceneSkill(
  row: Omit<RmSceneSkill, 'id' | 'created_at'> & { id?: string; created_at?: string },
): Promise<RmSceneSkill> {
  const next: RmSceneSkill = {
    id: row.id || newId(),
    characterId: row.characterId,
    characterName: row.characterName.trim(),
    name: row.name.trim(),
    code: row.code.toUpperCase(),
    note: row.note.trim(),
    created_at: row.created_at || new Date().toISOString(),
  }
  await put(STORE, next)
  applySceneSkills(await listRmSceneSkills())
  emitRmScene()
  return next
}

export async function forgetRmSceneSkills(code?: string): Promise<number> {
  const rows = await listRmSceneSkills(code)
  for (const r of rows) await del(STORE, r.id)
  applySceneSkills(await listRmSceneSkills())
  emitRmScene()
  return rows.length
}

export async function refreshSceneSkillCache(): Promise<RmSceneSkill[]> {
  const rows = await listRmSceneSkills()
  applySceneSkills(rows)
  return rows
}
