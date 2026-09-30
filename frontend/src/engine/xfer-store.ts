/** Originalbytes und empfangene Sätze. 30 Minuten. Nicht im Hausstand. */

import { del, getAll, newId, put } from './store.ts'

export const XFER_TTL_MS = 30 * 60 * 1000

export type XferBlob = {
  id: string
  kind: 'blob' | 'copies' | 'inbox'
  conversation_id: string
  name: string
  mime: string
  b64: string
  copies: string[]
  total: number
  parts: Record<string, string>
  files: Array<{ name: string; mime: string; b64: string }>
  until: number
}

function fresh(partial: Partial<XferBlob> & Pick<XferBlob, 'id' | 'kind'>): XferBlob {
  return {
    conversation_id: '',
    name: '',
    mime: '',
    b64: '',
    copies: [],
    total: 0,
    parts: {},
    files: [],
    until: Date.now() + XFER_TTL_MS,
    ...partial,
  }
}

async function liveRows(): Promise<XferBlob[]> {
  const now = Date.now()
  const rows = await getAll<XferBlob>('xfer')
  const dead = rows.filter((r) => !r.until || r.until <= now)
  for (const row of dead) await del('xfer', row.id)
  return rows.filter((r) => r.until > now)
}

export async function saveXferBlob(
  conversationId: string,
  name: string,
  mime: string,
  bytes: Uint8Array,
): Promise<void> {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  await put(
    'xfer',
    fresh({
      id: newId(),
      kind: 'blob',
      conversation_id: conversationId,
      name: name.slice(0, 120),
      mime: mime || 'application/octet-stream',
      b64: btoa(s),
    }),
  )
}

export async function listXferBlobs(conversationId: string): Promise<XferBlob[]> {
  const rows = await liveRows()
  return rows.filter((r) => r.kind === 'blob' && r.conversation_id === conversationId)
}

export async function rememberCopies(conversationId: string, copies: string[]): Promise<void> {
  if (!copies.length) return
  const rows = await liveRows()
  const prev = rows.find((r) => r.kind === 'copies' && r.conversation_id === conversationId)
  const merged = [...(prev?.copies || []), ...copies].slice(0, 8)
  if (prev) await del('xfer', prev.id)
  await put(
    'xfer',
    fresh({
      id: prev?.id || `copies:${conversationId}`,
      kind: 'copies',
      conversation_id: conversationId,
      copies: merged,
    }),
  )
}

export async function copiesFor(conversationId: string): Promise<string[]> {
  const rows = await liveRows()
  return rows.find((r) => r.kind === 'copies' && r.conversation_id === conversationId)?.copies || []
}

export async function readInbox(id: string): Promise<XferBlob | null> {
  const rows = await liveRows()
  return rows.find((r) => r.kind === 'inbox' && r.id === id) || null
}

export async function writeInbox(row: XferBlob): Promise<void> {
  await put('xfer', row)
}

export async function dropInboxFiles(id: string): Promise<void> {
  const row = await readInbox(id)
  if (!row) return
  await put('xfer', { ...row, files: [] })
}
