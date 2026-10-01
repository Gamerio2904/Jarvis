/** Entwurf auf der Tischplatte. Keine Idee, kein Portfolio, kein Agent. */

import { fillEntwurf } from './entwurf-fill.ts'
import {
  ablaufBlocksDraft,
  scanBlocksDraft,
  type EntwurfIntent,
} from './entwurf-parse.ts'
import { applyScan, loadScan, type ScanCommand } from './room-scan.ts'
import {
  artLabel,
  musterVariants,
  unknownArtReply,
  type Draft,
} from './entwurf-muster.ts'
import { get, getAll, listMessages, loadSettings, newId, put, saveSettings } from './store.ts'

export type { Draft } from './entwurf-muster.ts'

const WORDS = ['erste', 'zweite', 'dritte'] as const

export function formatOpenReply(title: string, names: string[]): string {
  const lines = names.map((name, i) => `${i + 1}. ${name}`)
  return [`Entwurf. ${title}.`, ...lines, 'Sag die erste, die zweite oder die dritte.'].join('\n')
}

async function previousUserText(conversationId: string): Promise<string> {
  const rows = await listMessages(conversationId)
  const users = rows.filter((m) => m.role === 'user' && m.content.trim())
  if (!users.length) return ''
  const last = users[users.length - 1]
  if (/^\s*entwirf(?:e)?\s+das\s*[.!?]?$/i.test(last.content.trim())) {
    return users.length >= 2 ? users[users.length - 2].content.trim().slice(0, 2000) : ''
  }
  return last.content.trim().slice(0, 2000)
}

async function retireOpen(): Promise<void> {
  const rows = await getAll<Draft>('drafts')
  for (const row of rows) {
    if (row.status === 'offen' || row.status === 'gewählt') {
      row.status = 'zu'
      await put('drafts', row)
    }
  }
}

async function show(row: Draft): Promise<void> {
  await put('drafts', row)
  saveSettings({
    entwurf_id: row.id,
    entwurf_status: 'offen',
    tischplatte_on: true,
  })
}

export function hideDraftFrames(): void {
  if (!loadSettings().entwurf_id) return
  saveSettings({ entwurf_id: '' })
}

/** Nach einem Scan ohne Modell die offene Zeile wieder zeigen. */
export async function restoreOpenDraft(): Promise<void> {
  if (loadSettings().entwurf_id) return
  if (scanBlocksDraft() || ablaufBlocksDraft()) return
  const rows = await getAll<Draft>('drafts')
  const row = [...rows].reverse().find((r) => r.status === 'offen' || r.status === 'gewählt')
  if (!row) return
  saveSettings({ entwurf_id: row.id, entwurf_status: row.status, tischplatte_on: true })
}

/** Start verdeckt die Rahmen. Ende ohne Modell zeichnet sie wieder. */
export async function finishScan(cmd: ScanCommand): Promise<string> {
  const before = loadScan().phase
  if (cmd.op === 'start') hideDraftFrames()
  const reply = applyScan(cmd)
  if (cmd.op === 'end') {
    if (before === 'live' && loadScan().phase === 'off') await restoreOpenDraft()
    else hideDraftFrames()
  }
  return reply
}

export async function closeDraftRow(): Promise<string> {
  const rows = await getAll<Draft>('drafts')
  const id = loadSettings().entwurf_id
  let row = id ? rows.find((r) => r.id === id) : undefined
  if (!row || row.status === 'zu') {
    row = [...rows].reverse().find((r) => r.status === 'offen' || r.status === 'gewählt')
  }
  if (!row) return 'Es ist kein Entwurf offen.'
  row.status = 'zu'
  await put('drafts', row)
  saveSettings({ entwurf_id: '', entwurf_status: 'zu', entwurf_muster: '' })
  return 'Entwurf zu.'
}

export async function pickDraft(index: 0 | 1 | 2): Promise<string> {
  const id = loadSettings().entwurf_id
  if (!id) return 'Die Zeile gibt es nicht.'
  const row = await get<Draft>('drafts', id)
  if (!row || row.status === 'zu' || index >= row.variants.length) return 'Die Zeile gibt es nicht.'
  row.pick = index
  row.status = 'gewählt'
  await put('drafts', row)
  if (row.kind === 'muster') {
    const art = row.variants[index]?.blocks[0]?.art
    saveSettings({
      entwurf_status: 'gewählt',
      ...(art ? { entwurf_muster: `${art}:${index}` } : {}),
    })
    return `Das ${WORDS[index]} Muster bleibt für den nächsten Entwurf.`
  }
  saveSettings({ entwurf_status: 'gewählt' })
  return `Entwurf ${index + 1}. ${row.title}.`
}

async function openInspiration(art: EntwurfIntent & { kind: 'inspiration' }): Promise<string> {
  if (!art.art) return unknownArtReply()
  await retireOpen()
  const variants = musterVariants(art.art)
  const row: Draft = {
    id: newId(),
    title: artLabel(art.art),
    variants,
    pick: null,
    motion: 'sofort',
    status: 'offen',
    kind: 'muster',
    created_at: new Date().toISOString(),
  }
  await show(row)
  return formatOpenReply(row.title, variants.map((v) => v.name))
}

async function openEntwurf(conversationId: string, work: string | null): Promise<string> {
  const text = work === null ? await previousUserText(conversationId) : work.trim()
  if (!text) return 'Was soll der Entwurf zeigen?'
  const filled = await fillEntwurf(text.slice(0, 2000))
  if (!filled) return 'Kein Entwurf. Der Text nennt keine Fläche.'
  await retireOpen()
  const row: Draft = {
    id: newId(),
    title: filled.title,
    variants: filled.variants,
    pick: null,
    motion: filled.motion,
    status: 'offen',
    kind: 'app',
    created_at: new Date().toISOString(),
  }
  await show(row)
  return formatOpenReply(
    row.title,
    row.variants.map((v) => v.name),
  )
}

export async function handleEntwurf(conversationId: string, intent: EntwurfIntent): Promise<string> {
  if (intent.kind === 'draft_close') return closeDraftRow()
  if (intent.kind === 'draft_pick') return pickDraft(intent.index)
  if (ablaufBlocksDraft()) return 'Erst den Ablauf.'
  if (scanBlocksDraft()) return 'Erst den Scan.'
  if (intent.kind === 'inspiration') return openInspiration(intent)
  return openEntwurf(conversationId, intent.work)
}
