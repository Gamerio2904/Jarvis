import { completeGeminiVision, geminiReady } from './gemini.ts'
import {
  addMessage,
  loadSettings,
  newId,
  put,
  saveSettings,
  getAll,
  type DocRecord,
} from './store.ts'
import { packVerified } from './action-fsm.ts'
import {
  classifyDoc,
  clipDocText,
  docUploadVerified,
  extractPdfText,
  MAX_DOC_BYTES,
  otherDocLine,
  type DocKind,
} from './doc-kind.ts'
import { parseDocIntent } from './doc-parse.ts'
import { fileToJpegDataUrl } from './eye.ts'
import { scrubReply } from './guards.ts'
import type { ToolMeta } from './tools.ts'

export { parseDocIntent } from './doc-parse.ts'
export { classifyDoc, extractPdfText, docUploadVerified } from './doc-kind.ts'
export type { DocKind }

const ASK =
  'Datei-Knopf unten. PDF, Text oder Foto. Word und Excel lese ich nicht.'

function persistLast(rec: Pick<DocRecord, 'id' | 'name' | 'kind' | 'bytes' | 'text'>): void {
  saveSettings({
    last_doc_json: JSON.stringify({
      id: rec.id,
      name: rec.name,
      kind: rec.kind,
      bytes: rec.bytes,
      chars: rec.text.length,
    }),
    last_step_tool: 'doc',
    last_step_title: rec.name,
  })
}

function readLastMeta(): { id?: string; name?: string; kind?: string; bytes?: number; chars?: number } | null {
  try {
    const raw = loadSettings().last_doc_json
    if (!raw) return null
    return JSON.parse(raw) as { id?: string; name?: string; kind?: string; bytes?: number; chars?: number }
  } catch {
    return null
  }
}

export async function listDocs(conversationId?: string): Promise<DocRecord[]> {
  const rows = await getAll<DocRecord>('docs')
  const filtered = conversationId ? rows.filter((r) => r.conversation_id === conversationId) : rows
  return filtered.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

async function saveDoc(row: DocRecord): Promise<void> {
  await put('docs', row)
}

function excerpt(text: string, n = 420): string {
  const t = clipDocText(text)
  if (t.length <= n) return t
  return `${t.slice(0, n).trim()} …`
}

async function ocrJpeg(dataUrl: string): Promise<{ text: string } | { error: string }> {
  if (!geminiReady()) return { error: 'Dafür Gemini an. Das Bild geht dann zu Google — nicht lokal.' }
  const m = /^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/.exec(dataUrl)
  if (!m) return { error: 'Kein Bild erkannt. JPEG oder PNG wählen.' }
  try {
    const text = await completeGeminiVision(
      'Lesen Sie nur, was auf dem Bild steht. Deutsch, Siezen, 1–3 Sätze oder den Text wörtlich. Nichts erfinden, was nicht zu sehen ist.',
      m[2],
      m[1],
    )
    const line = scrubReply(text || '')
    if (!line || line.length < 2) return { error: 'Nichts Lesbares auf dem Bild.' }
    return { text: line }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Foto nicht gelesen. Netz oder Gemini prüfen, dann nochmal.' }
  }
}

export async function ingestDocFile(
  conversationId: string,
  file: File,
): Promise<{ reply: string; tool: ToolMeta }> {
  const name = (file.name || 'Datei').slice(0, 120)
  const mime = file.type || ''
  const bytes = Number(file.size) || 0
  const kind = classifyDoc(name, mime)

  await addMessage(conversationId, 'user', `Datei: ${name}`)

  if (bytes <= 0) {
    const packed = packVerified({
      domain: 'doc',
      intent: `upload:${name}`,
      plan: 'upload',
      label: 'Datei',
      observation: { stored: false, bytes: 0, kind, chars: 0 },
      verify: (obs) => docUploadVerified(obs),
      successReply: ASK,
      failReply: 'Die Datei ist leer.',
    })
    await addMessage(conversationId, 'assistant', packed.reply, { tool: packed.tool })
    return { reply: packed.reply, tool: packed.tool }
  }
  if (bytes > MAX_DOC_BYTES) {
    const packed = packVerified({
      domain: 'doc',
      intent: `upload:${name}`,
      plan: 'upload',
      label: 'Datei',
      preOk: false,
      preError: 'Zu groß.',
      observation: null,
      successReply: ASK,
      failReply: 'Die Datei ist größer als 8 MB. Kleineres PDF oder Foto.',
    })
    await addMessage(conversationId, 'assistant', packed.reply, { tool: packed.tool })
    return { reply: packed.reply, tool: packed.tool }
  }
  if (kind === 'other') {
    const packed = packVerified({
      domain: 'doc',
      intent: `upload:${name}`,
      plan: 'upload',
      label: 'Datei',
      observation: { stored: false, bytes, kind, chars: 0 },
      verify: (obs) => docUploadVerified(obs),
      successReply: ASK,
      failReply: otherDocLine(name),
    })
    await addMessage(conversationId, 'assistant', packed.reply, { tool: packed.tool })
    return { reply: packed.reply, tool: packed.tool }
  }

  let text = ''
  let ocrOk = false
  let fail = ''

  if (kind === 'text') {
    try {
      text = clipDocText(await file.text())
    } catch {
      fail = 'Text nicht lesbar.'
    }
  } else if (kind === 'pdf') {
    const buf = new Uint8Array(await file.arrayBuffer())
    text = extractPdfText(buf)
    if (!text) fail = 'Kein Text im PDF. Gescannte Seiten: Foto der Seite, nicht behaupten dass ich gelesen habe.'
  } else {
    const prepared = await fileToJpegDataUrl(file)
    if ('error' in prepared) fail = prepared.error
    else {
      const ocr = await ocrJpeg(prepared.dataUrl)
      if ('error' in ocr) fail = ocr.error
      else {
        text = clipDocText(ocr.text)
        ocrOk = text.length > 0
      }
    }
  }

  const row: DocRecord = {
    id: newId(),
    conversation_id: conversationId,
    name,
    mime: mime || (kind === 'pdf' ? 'application/pdf' : kind === 'image' ? 'image/jpeg' : 'text/plain'),
    kind,
    bytes,
    text,
    created_at: new Date().toISOString(),
  }
  if (text) {
    await saveDoc(row)
    persistLast(row)
  }

  const obs = {
    stored: Boolean(text),
    bytes,
    kind,
    chars: text.length,
    ocrOk: kind === 'image' ? ocrOk : false,
  }
  const packed = packVerified({
    domain: 'doc',
    intent: `upload:${name}`,
    plan: kind === 'image' ? 'ocr' : 'parse',
    label: kind === 'image' ? 'OCR' : kind === 'pdf' ? 'PDF' : 'Text',
    observation: obs,
    verify: (o) => docUploadVerified(o),
    successReply:
      kind === 'image'
        ? text
        : `${name}: ${excerpt(text)}`,
    failReply: fail || otherDocLine(name),
    extra: { name, kind, stored: obs.stored },
  })
  await addMessage(conversationId, 'assistant', packed.reply, { tool: packed.tool })
  return { reply: packed.reply, tool: packed.tool }
}

export async function handleDoc(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseDocIntent(text)
  if (!intent) return { handled: false }

  const rows = await listDocs(conversationId)
  const last = rows[0]
  if (last?.text) {
    const packed = packVerified({
      domain: 'doc',
      intent: 'read',
      plan: 'read',
      label: last.kind === 'image' ? 'OCR' : last.kind === 'pdf' ? 'PDF' : 'Text',
      observation: { stored: true, bytes: last.bytes, kind: last.kind, chars: last.text.length, ocrOk: last.kind === 'image' },
      verify: (obs) => docUploadVerified(obs),
      successReply: `${last.name}: ${excerpt(last.text)}`,
      failReply: ASK,
      extra: { name: last.name, kind: last.kind },
    })
    return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'doc' }
  }

  const meta = readLastMeta()
  const packed = packVerified({
    domain: 'doc',
    intent: intent.kind,
    plan: 'ask',
    label: 'Datei',
    waiting: true,
    observation: meta ? { name: meta.name, kind: meta.kind } : { ask: true },
    successReply: ASK,
    failReply: ASK,
  })
  saveSettings({ last_step_tool: 'doc_ask' })
  return { handled: true, reply: packed.reply, tool: packed.tool, lastTool: 'doc' }
}
