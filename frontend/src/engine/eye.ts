import { completeGeminiVision, geminiReady } from './gemini'
import { addMessage, loadSettings } from './store'
import { scrubReply } from './guards'
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

export async function handleEyeAsk(): Promise<{
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}> {
  if (!geminiReady()) {
    return {
      handled: true,
      reply: 'Dafür Gemini an. Dann Foto-Knopf — das Bild geht zu Google, nicht lokal.',
      lastTool: 'eye',
    }
  }
  return {
    handled: true,
    reply: 'Foto-Knopf unten. Das Bild geht zu Google.',
    tool: { tool_status: 'executed', tool: 'eye', action: 'ask', label: 'Auge' },
    lastTool: 'eye',
  }
}

export async function readEyeImage(
  conversationId: string,
  dataUrl: string,
): Promise<{ reply: string }> {
  await addMessage(conversationId, 'user', 'Foto')
  if (dataUrl.startsWith('error:')) {
    const reply = dataUrl.slice(6) || 'Bild nicht lesbar.'
    await addMessage(conversationId, 'assistant', reply, {
      tool: { tool_status: 'error', tool: 'eye', action: 'read', label: 'Auge' },
    })
    return { reply }
  }
  if (!geminiReady()) {
    const reply = 'Dafür Gemini an. Das Bild geht dann zu Google — nicht lokal.'
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
    await addMessage(conversationId, 'assistant', reply, {
      tool: { tool_status: 'executed', tool: 'eye', action: 'read', label: 'Auge' },
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
