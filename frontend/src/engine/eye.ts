import { completeGeminiVision, geminiReady } from './gemini'
import { addMessage, loadSettings, saveSettings } from './store'
import { scrubReply } from './guards'
import { parseGroundIntent } from './ground-parse'
import type { ToolMeta } from './tools'

export { parseEyeIntent } from './eye-parse'

export async function fileToJpegDataUrl(file: File): Promise<{ dataUrl: string } | { error: string }> {
  const type = (file.type || '').toLowerCase()
  if (type && !type.startsWith('image/')) {
    return { error: 'Das ist kein Bild.' }
  }
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bmp.close()
      return { error: 'Bild nicht lesbar.' }
    }
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    const dataUrl = canvas.toDataURL('image/jpeg', 0.72)
    if (!dataUrl.startsWith('data:image/')) return { error: 'Bild nicht lesbar.' }
    return { dataUrl }
  } catch {
    return { error: 'Bildformat nicht lesbar. JPEG oder PNG wählen, kein HEIC.' }
  }
}

export async function handleEyeAsk(text = ''): Promise<{
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}> {
  const slip = parseGroundIntent(text)
  const topic = slip?.kind === 'slip' ? slip.topic : null
  const lines: Record<string, string> = {
    receipt: 'Foto-Knopf: den Beleg fotografieren. Betrag und Datum lese ich nur vom Bild, nichts erfinden.',
    paper: 'Foto vom Zettel. Einen Termin lege ich erst an, wenn Sie danach Ja sagen.',
    wash: 'Foto vom Waschlabel. Ohne Bild nenne ich nur ISO-Zeichen, die Sie sagen.',
    ean: 'Foto vom Strichcode. Die Zahl geht dann an Open Food Facts, nicht geraten.',
    desk: `Foto vom Schreibtisch${slip?.kind === 'slip' && slip.query ? ` — wo „${slip.query}“ liegt` : ''}. Keine Überwachung, nur dieses Bild.`,
  }
  const extra = topic ? lines[topic] : ''
  if (!geminiReady() && topic !== 'desk') {
    const reply = extra
      ? `${extra} Dafür Gemini an — das Bild geht zu Google, nicht lokal. LocateAnything liegt auf dem PC, nicht im Handy.`
      : 'Dafür Gemini an. Dann Foto-Knopf — das Bild geht zu Google, nicht lokal.'
    saveSettings({ last_eye_line: reply })
    return { handled: true, reply, lastTool: 'eye' }
  }
  const reply = extra || (geminiReady() ? 'Foto-Knopf unten. Das Bild geht zu Google.' : 'Dafür Gemini an. Dann Foto-Knopf — das Bild geht zu Google, nicht lokal.')
  saveSettings({ last_eye_line: reply })
  return {
    handled: true,
    reply,
    tool: { tool_status: 'executed', tool: 'eye', action: topic || 'ask', label: 'Auge' },
    lastTool: 'eye',
  }
}

export async function readEyeImage(
  conversationId: string,
  dataUrl: string,
): Promise<{ reply: string }> {
  await addMessage(conversationId, 'user', 'Foto', dataUrl.startsWith('data:image/') ? { image: dataUrl } : null)
  if (dataUrl.startsWith('data:image/')) saveLastEye(dataUrl)
  if (dataUrl.startsWith('error:')) {
    const reply = dataUrl.slice(6) || 'Bild nicht lesbar.'
    await addMessage(conversationId, 'assistant', reply, {
      tool: { tool_status: 'error', tool: 'eye', action: 'read', label: 'Auge' },
    })
    return { reply }
  }
  if (!geminiReady()) {
    const reply = 'Dafür Gemini an. Das Bild geht dann zu Google — nicht lokal.'
    saveSettings({ last_eye_line: reply })
    await addMessage(conversationId, 'assistant', reply, {
      tool: { tool_status: 'error', tool: 'eye', action: 'read', label: 'Auge' },
    })
    return { reply }
  }
  const m = /^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/.exec(dataUrl)
  if (!m) {
    const reply = 'Kein Bild erkannt. JPEG oder PNG wählen.'
    await addMessage(conversationId, 'assistant', reply, {
      tool: { tool_status: 'error', tool: 'eye', action: 'read', label: 'Auge' },
    })
    return { reply }
  }
  try {
    const tv = loadSettings().last_step_tool === 'tv'
    const prompt = tv
      ? 'Fernseher-Foto: Sagen Sie nur, was auf dem Schirm steht (Login, Suche, Liste). Keine erfundenen Tasten. 1–3 Sätze, Siezen. Jarvis sieht den TV nicht live — nur dieses Foto.'
      : 'Lesen Sie nur, was auf dem Bild steht. Deutsch, Siezen, 1–3 Sätze. Nichts erfinden, was nicht zu sehen ist.'
    const text = await completeGeminiVision(prompt, m[2], m[1])
    const reply = scrubReply(text || 'Nichts Lesbares auf dem Bild.')
    saveSettings({ last_eye_line: reply, last_step_tool: 'eye' })
    await addMessage(conversationId, 'assistant', reply, {
      tool: { tool_status: 'executed', tool: 'eye', action: 'read', label: 'Auge', result: { image: dataUrl } },
    })
    return { reply }
  } catch (err) {
    const reply =
      err instanceof Error ? err.message : 'Foto nicht gelesen. Netz oder Gemini prüfen, dann nochmal.'
    await addMessage(conversationId, 'assistant', reply, {
      tool: { tool_status: 'error', tool: 'eye', action: 'read', label: 'Auge' },
    })
    return { reply }
  }
}
