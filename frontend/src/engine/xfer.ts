/** Übertrag: QR in der Antwort, Foto auf der anderen Seite, Knopf und Kopierfelder. */

import type { ChatBlock } from './chat-blocks.ts'
import { newId } from './store.ts'
import type { ToolMeta } from './tools.ts'
import {
  assembleChunks,
  parseXferChunk,
  planTransfer,
  qrImageDataUrl,
  type XferChunk,
  type XferFile,
} from './xfer-codec.ts'
import { parseXferIntent } from './xfer-parse.ts'
import {
  copiesFor,
  dropInboxFiles,
  listXferBlobs,
  readInbox,
  rememberCopies,
  writeInbox,
  type XferBlob,
} from './xfer-store.ts'

const EMPTY = 'Keine Datei im Gespräch. Zuerst den Datei-Knopf.'

function pack(
  reply: string,
  action: string,
  blocks?: ChatBlock[],
): { handled: true; reply: string; tool: ToolMeta; lastTool: string; blocks?: ChatBlock[] } {
  return {
    handled: true,
    reply,
    lastTool: 'xfer',
    blocks,
    tool: { tool_status: 'executed', tool: 'xfer', action, label: 'Übertrag' },
  }
}

function inboxFrom(id: string, total: number, parts: Record<string, string>): XferBlob {
  return {
    id,
    kind: 'inbox',
    conversation_id: '',
    name: '',
    mime: '',
    b64: '',
    copies: [],
    total,
    parts,
    files: [],
    until: Date.now() + 30 * 60 * 1000,
  }
}

export async function acceptXferChunk(
  raw: string,
): Promise<{ reply: string; blocks?: ChatBlock[] } | null> {
  const chunk = parseXferChunk(raw)
  if (!chunk) return null
  const prev = await readInbox(chunk.id)
  const parts = { ...(prev?.parts || {}) }
  parts[String(chunk.i)] = chunk.slice
  const total = chunk.n
  const have = Object.keys(parts).length
  if (have < total) {
    await writeInbox(inboxFrom(chunk.id, total, parts))
    const left = total - have
    return { reply: `Code ${have} von ${total}. Noch ${left} ${left === 1 ? 'Foto' : 'Fotos'} vom selben Satz.` }
  }
  const chunks: XferChunk[] = []
  for (let i = 1; i <= total; i++) {
    const slice = parts[String(i)]
    if (!slice) return { reply: `Code ${have} von ${total}. Noch ${total - have} Fotos vom selben Satz.` }
    chunks.push({ id: chunk.id, i, n: total, slice })
  }
  const payload = assembleChunks(chunks)
  if (!payload) return { reply: 'Der Code ist unvollständig.' }
  const row = inboxFrom(chunk.id, total, parts)
  row.copies = payload.c
  row.files = payload.f
  await writeInbox(row)
  const blocks: ChatBlock[] = [
    { kind: 'xfer', id: chunk.id, files: payload.f.map((f) => f.name), copies: payload.c },
  ]
  const reply = payload.f.length
    ? 'Satz vollständig.'
    : 'Satz vollständig. Keine Datei, nur Felder zum Kopieren.'
  return { reply, blocks }
}

export async function filesForDownload(id: string): Promise<XferFile[]> {
  const row = await readInbox(id)
  if (!row?.files.length) return []
  const files = row.files
  await dropInboxFiles(id)
  return files
}

export async function handleXfer(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string; blocks?: ChatBlock[] }> {
  const intent = parseXferIntent(text)
  if (!intent) return { handled: false }
  if (intent.copies.length) await rememberCopies(conversationId, intent.copies)
  const stored = await copiesFor(conversationId)
  const copies = [...new Set([...stored, ...intent.copies])].slice(0, 8)
  const blobs = await listXferBlobs(conversationId)
  const files: XferFile[] = blobs.map((b) => ({ name: b.name, mime: b.mime, b64: b.b64 }))
  if (!files.length && !copies.length) return pack(EMPTY, 'empty')
  const id = newId().replace(/[^a-z0-9]/gi, '').slice(0, 8).padEnd(4, 'a')
  const plan = planTransfer(id, copies, files)
  if (!plan.codes.length) {
    const names = plan.outside.filter(Boolean)
    const line = names.length
      ? `${names.join(', ')} passt nicht in sechs Codes.`
      : EMPTY
    return pack(line, 'too_big')
  }
  const blocks: ChatBlock[] = []
  plan.codes.forEach((code, i) => {
    const src = qrImageDataUrl(code)
    if (!src) return
    blocks.push({
      kind: 'image',
      src,
      alt: `QR ${i + 1} von ${plan.codes.length}`,
      source: `${i + 1}/${plan.codes.length}`,
    })
  })
  if (!blocks.length) return pack('Der Code fehlt.', 'empty')
  const inn = plan.inside.length ? `Drin: ${plan.inside.join(', ')}.` : 'Keine Datei im Code.'
  const out = plan.outside.length ? ` Fehlt: ${plan.outside.join(', ')}.` : ''
  return pack(`${inn}${out}`, 'qr', blocks)
}
