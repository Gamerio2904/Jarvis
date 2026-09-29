import { completeGeminiVision, geminiReady } from './gemini.ts'
import { readLastEyeImage } from './agent-session.ts'
import { parseRmSceneIntent, type RmSceneIntent } from './rm-scene-parse.ts'
import { addRmSceneSkill, forgetRmSceneSkills, listRmSceneSkills } from './rm-scene-store.ts'
import { characterById, searchCharacters, staffelFolge } from './rm-graph.ts'
import { RM_CORE_IDS } from './rm-dossier.ts'
import { isCommNo, isCommYes } from './places-parse.ts'
import { loadSettings, saveSettings, clearPending, getPending, setPending } from './store.ts'
import { patchForHudView } from './hud-parse.ts'
import { setLageSession } from './lage-session.ts'
import type { ToolMeta } from './tools.ts'

export { parseRmSceneIntent } from './rm-scene-parse.ts'

const VISION =
  'Nur sichtbare Figuren und sichtbare Fähigkeiten, Geräte oder Aktionen aus Rick and Morty. Nichts aus dem Wiki, keine Handlung erfinden, keine Folge raten. Antwort ausschließlich als JSON: {"items":[{"who":"Rick","skill":"Portal","sure":true}]}. sure=false wenn unsicher. Kurze deutsche Namen.'

const NAME_ID: Record<string, number> = {
  rick: 1,
  'rick sanchez': 1,
  morty: 2,
  'morty smith': 2,
  summer: 3,
  'summer smith': 3,
  beth: 4,
  'beth smith': 4,
  jerry: 5,
  'jerry smith': 5,
  birdperson: 47,
  'evil morty': 118,
}

type VisionItem = { who: string; skill: string; sure: boolean }

function tool(action: string, label: string): ToolMeta {
  return { tool_status: 'executed', tool: 'hud', action, label }
}

export function matchSceneCharacter(raw: string): { id: number; name: string } | null {
  const q = raw.replace(/[.!?,;:]+$/g, '').trim().toLowerCase()
  if (q.length < 2 || q.length > 40) return null
  const alias = NAME_ID[q]
  if (alias) {
    const c = characterById(alias)
    return c ? { id: c.id, name: c.name } : null
  }
  const hits = searchCharacters(q)
  const core = hits.find((c) => (RM_CORE_IDS as readonly number[]).includes(c.id))
  if (core && core.name.toLowerCase().includes(q)) return { id: core.id, name: core.name }
  if (hits.length === 1) return { id: hits[0].id, name: hits[0].name }
  const exact = hits.find((c) => c.name.toLowerCase() === q)
  return exact ? { id: exact.id, name: exact.name } : null
}

function parseVisionJson(raw: string): VisionItem[] {
  const m = /\{[\s\S]*\}/.exec(raw || '')
  if (!m) return []
  try {
    const json = JSON.parse(m[0]) as { items?: unknown }
    const items = Array.isArray(json.items) ? json.items : []
    const out: VisionItem[] = []
    for (const row of items) {
      if (!row || typeof row !== 'object') continue
      const who = String((row as { who?: string }).who || '').trim()
      const skill = String((row as { skill?: string }).skill || '').trim()
      if (who.length < 2 || who.length > 40 || skill.length < 2 || skill.length > 60) continue
      out.push({ who, skill, sure: Boolean((row as { sure?: boolean }).sure) })
    }
    return out
  } catch {
    return []
  }
}

function confirmLine(code: string, sure: VisionItem[], unsure: VisionItem[]): string {
  const seen = sure.length
    ? `Ich sehe: ${sure.map((i) => `${i.who} — ${i.skill}`).join('; ')}.`
    : 'Nichts Sicheres auf dem Bild.'
  const extra = unsure.length ? ` Unsicher: ${unsure.map((i) => i.who).join(', ')} — weggelassen.` : ''
  return `${seen}${extra} ${staffelFolge(code)} (${code}) laut Ihnen, nicht in der offenen API. Aufschreiben?`
}

async function persist(code: string, items: VisionItem[]): Promise<string> {
  const lines: string[] = []
  const unknown: string[] = []
  let firstId: number | null = null
  for (const item of items) {
    const hit = matchSceneCharacter(item.who)
    await addRmSceneSkill({
      characterId: hit?.id ?? null,
      characterName: hit?.name || item.who,
      name: item.skill,
      code,
      note: `Sichtbar auf dem Foto. ${staffelFolge(code)} laut Nutzer.`,
    })
    if (hit) {
      if (firstId == null) firstId = hit.id
      lines.push(`${hit.name}: ${item.skill}`)
    } else {
      unknown.push(`${item.who}: ${item.skill}`)
    }
  }
  if (firstId != null) {
    try {
      sessionStorage.setItem('jarvis_last_serie_id', String(firstId))
    } catch {
      /* quota */
    }
    const lage = patchForHudView('serie')
    saveSettings(lage)
    const s = loadSettings()
    setLageSession(Boolean(s.hud_force) && !s.hud_hidden)
  }
  const bits = [`Aufgeschrieben für ${staffelFolge(code)} (${code}).`]
  if (lines.length) bits.push(lines.join('; '))
  if (unknown.length) {
    bits.push(
      `Nicht in der offenen API (S01–S05): ${unknown.join('; ')}. Kein neuer Knoten — nur diese Kamera-Notiz.`,
    )
  }
  return bits.join(' ')
}

export async function handleRmScene(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const pending = await getPending(conversationId)
  if (pending?.tool === 'hud' && pending.action === 'rm_scene') {
    const code = String(pending.args.code || '')
    let items = Array.isArray(pending.args.items)
      ? (pending.args.items as VisionItem[]).filter((i) => i?.who && i?.skill)
      : []
    if (isCommNo(text)) {
      await clearPending(conversationId)
      return { handled: true, reply: 'Nichts aufgeschrieben.', tool: tool('cancel', 'Szene'), lastTool: 'hud' }
    }
    if (isCommYes(text)) {
      if (!items.length) {
        await clearPending(conversationId)
        return { handled: true, reply: 'Ohne sichtbare Fähigkeit nichts zu merken.', tool: tool('empty', 'Szene'), lastTool: 'hud' }
      }
      const reply = await persist(code, items)
      await clearPending(conversationId)
      return { handled: true, reply, tool: tool('store', 'Szene'), lastTool: 'hud' }
    }
    const drop = /^\s*(?:ohne|nicht)\s+(.+?)\s*[.!?]*$/i.exec(text.trim())
    if (drop) {
      const name = drop[1].replace(/^(?:die|den|das|eine?)\s+/i, '').trim()
      items = items.filter((i) => !i.who.toLowerCase().includes(name.toLowerCase()) && !i.skill.toLowerCase().includes(name.toLowerCase()))
      await setPending({
        ...pending,
        args: { code, items },
        preview: items.map((i) => i.who).join(', '),
        created_at: new Date().toISOString(),
      })
      return {
        handled: true,
        reply: confirmLine(code, items, []),
        tool: tool('confirm', 'Szene'),
        lastTool: 'hud',
      }
    }
    if (parseRmSceneIntent(text)) await clearPending(conversationId)
  }

  const intent: RmSceneIntent | null = parseRmSceneIntent(text)
  if (!intent) return { handled: false }

  if (intent.kind === 'recall') {
    const rows = await listRmSceneSkills(intent.code)
    if (!rows.length) {
      return {
        handled: true,
        reply: intent.code
          ? `Keine Kamera-Fähigkeit für ${staffelFolge(intent.code)}.`
          : 'Keine Kamera-Fähigkeiten. Foto-Knopf, dann Staffel und Folge ab 6.',
        tool: tool('recall', 'Szene'),
        lastTool: 'hud',
      }
    }
    const line = rows
      .slice(0, 12)
      .map((r) => `${r.characterName}: ${r.name} (${r.code})`)
      .join('; ')
    return { handled: true, reply: `Kamera: ${line}.`, tool: tool('recall', 'Szene'), lastTool: 'hud' }
  }

  if (intent.kind === 'forget') {
    const n = await forgetRmSceneSkills(intent.code)
    return {
      handled: true,
      reply: n ? `Weg: ${n} Kamera-Fähigkeit${n === 1 ? '' : 'en'}.` : 'Keine Kamera-Fähigkeiten.',
      tool: tool('forget', 'Szene'),
      lastTool: 'hud',
    }
  }

  if (intent.season < 6) {
    return {
      handled: true,
      reply: `Staffel ${intent.season} liegt in der offenen API. Kamera-Fähigkeiten gelten ab Staffel 6 — Foto, dann Staffel und Folge.`,
      tool: tool('ask', 'Szene'),
      lastTool: 'hud',
    }
  }

  const src = readLastEyeImage()
  if (!src) {
    return {
      handled: true,
      reply: `Foto-Knopf: die Szene. Danach ${staffelFolge(intent.code)} nochmal, dann schreibe ich nur Sichtbares auf.`,
      tool: tool('ask', 'Szene'),
      lastTool: 'hud',
    }
  }
  if (!geminiReady()) {
    return {
      handled: true,
      reply: 'Dafür Gemini an. Das Bild geht dann zu Google — nicht lokal. Folge erfinde ich nicht.',
      tool: tool('ask', 'Szene'),
      lastTool: 'hud',
    }
  }
  const m = /^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/.exec(src)
  if (!m) {
    return {
      handled: true,
      reply: 'Kein Bild erkannt. JPEG oder PNG, dann Staffel und Folge.',
      tool: tool('ask', 'Szene'),
      lastTool: 'hud',
    }
  }
  try {
    const textOut = await completeGeminiVision(VISION, m[2], m[1])
    const items = parseVisionJson(textOut)
    const sure = items.filter((i) => i.sure)
    const unsure = items.filter((i) => !i.sure)
    if (!sure.length) {
      return {
        handled: true,
        reply: unsure.length
          ? `Unsicher: ${unsure.map((i) => i.who).join(', ')} — nicht aufgeschrieben. Klareres Foto.`
          : 'Nichts Sicheres auf dem Bild. Keine Fähigkeit erfunden.',
        tool: tool('empty', 'Szene'),
        lastTool: 'hud',
      }
    }
    await setPending({
      conversation_id: conversationId,
      tool: 'hud',
      action: 'rm_scene',
      args: { code: intent.code, items: sure },
      preview: sure.map((i) => i.who).join(', '),
      created_at: new Date().toISOString(),
    })
    return {
      handled: true,
      reply: confirmLine(intent.code, sure, unsure),
      tool: tool('confirm', 'Szene'),
      lastTool: 'hud',
    }
  } catch (err) {
    return {
      handled: true,
      reply: err instanceof Error ? err.message : 'Foto nicht gelesen. Netz oder Gemini prüfen.',
      tool: tool('ask', 'Szene'),
      lastTool: 'hud',
    }
  }
}
