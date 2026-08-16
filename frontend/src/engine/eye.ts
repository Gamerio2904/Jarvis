import { completeGeminiVision, geminiReady } from './gemini'
import { addMessage, loadSettings } from './store'
import { scrubReply } from './guards'
import type { ToolMeta } from './tools'

export { parseEyeIntent } from './eye-parse'

export async function handleEyeAsk(): Promise<{
  handled: boolean
  reply?: string
  tool?: ToolMeta
  lastTool?: string
}> {
  const s = loadSettings()
  if (!s.gemini_enabled || !geminiReady()) {
    return {
      handled: true,
      reply: 'Dafür Gemini an. Das Bild geht dann zu Google — nicht lokal.',
      lastTool: 'eye',
    }
  }
  return {
    handled: true,
    reply: 'Foto wählen. Das Bild geht zu Google.',
    tool: { tool_status: 'executed', tool: 'eye', action: 'ask', label: 'Auge' },
    lastTool: 'eye',
  }
}

export async function readEyeImage(
  conversationId: string,
  dataUrl: string,
): Promise<{ reply: string }> {
  if (!geminiReady()) {
    return { reply: 'Dafür Gemini an. Das Bild geht zu Google.' }
  }
  const m = /^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/.exec(dataUrl)
  if (!m) return { reply: 'Kein Bild erkannt.' }
  const text = await completeGeminiVision(
    'Lesen Sie nur, was auf dem Bild steht. Deutsch, Siezen, 1–3 Sätze. Nichts erfinden, was nicht zu sehen ist.',
    m[2],
    m[1],
  )
  const reply = scrubReply(text || 'Nichts Lesbares auf dem Bild.')
  await addMessage(conversationId, 'user', 'Foto')
  await addMessage(conversationId, 'assistant', reply, {
    tool: { tool_status: 'executed', tool: 'eye', action: 'read', label: 'Auge' },
  })
  return { reply }
}
