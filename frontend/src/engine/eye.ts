import { completeGeminiVision, geminiReady } from './gemini'
import { addMessage, loadSettings, saveSettings } from './store'
import { scrubReply } from './guards'
import { getJson } from './http-json'
import type { ToolMeta } from './tools'

export { parseEyeIntent } from './eye-parse'

const EYE_PROMPT =
  'Foto lesen. Deutsch, Siezen. Nur was sichtbar ist: Text (wörtlich), Marke, Produkt, Barcode/EAN falls lesbar, Pflanze/Tier nur wenn klar. 2–6 Sätze. Nichts erfinden. Unleserlich = das sagen. Keine medizinischen oder giftigen Ratschläge.'

const TV_PROMPT =
  'Fernseher-Foto: Nur was auf dem Schirm steht (Login, Suche, Liste). Keine erfundenen Tasten. 2–4 Sätze, Siezen. Jarvis sieht den TV nicht live — nur dieses Foto.'

export async function fileToJpegDataUrl(file: File): Promise<{ dataUrl: string } | { error: string }> {
  const type = (file.type || '').toLowerCase()
  if (type && !type.startsWith('image/')) {
    return { error: 'Das ist kein Bild.' }
  }
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.84)
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
  const last = loadSettings().last_eye_json.trim()
  if (last) {
    try {
      const parsed = JSON.parse(last) as { reply?: string }
      if (parsed.reply?.trim()) {
        return {
          handled: true,
          reply: `Letztes Foto: ${parsed.reply} Neues Bild: Kamera-Knopf unten.`,
          tool: { tool_status: 'executed', tool: 'eye', action: 'ask', label: 'Auge' },
          lastTool: 'eye',
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (!geminiReady()) {
    return {
      handled: true,
      reply: 'Foto braucht Gemini. Dann Kamera-Knopf — das Bild geht zu Google, nicht lokal.',
      lastTool: 'eye',
    }
  }
  return {
    handled: true,
    reply: 'Kamera-Knopf unten (Foto) oder Galerie. Das Bild geht zu Google.',
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
    const reply = 'Foto braucht Gemini. Das Bild ginge zu Google — nicht lokal. Unter Cloud einschalten, Key unter APIs.'
    await addMessage(conversationId, 'assistant', reply, {
      tool: { tool_status: 'error', tool: 'eye', action: 'read', label: 'Auge' },
    })
    return { reply }
  }
  const m = /^data:(image\/[a-zA-Z0+.-]+);base64,(.+)$/.exec(dataUrl)
  if (!m) {
    const reply = 'Kein Bild erkannt. JPEG oder PNG, oder die Handy-Kamera.'
    await addMessage(conversationId, 'assistant', reply, {
      tool: { tool_status: 'error', tool: 'eye', action: 'read', label: 'Auge' },
    })
    return { reply }
  }
  try {
    const tv = loadSettings().last_step_tool === 'tv'
    const text = await completeGeminiVision(tv ? TV_PROMPT : EYE_PROMPT, m[2], m[1])
    let reply = scrubReply(text || 'Nichts Lesbares auf dem Bild.')
    const extra = await enrichFromVision(reply)
    if (extra) reply = `${reply} ${extra}`.trim()
    saveSettings({
      last_eye_json: JSON.stringify({ reply, at: new Date().toISOString() }),
    })
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

async function enrichFromVision(text: string): Promise<string> {
  const ean = /\b(\d{8}|\d{13})\b/.exec(text.replace(/[\s-]/g, ''))
  const code = ean?.[1]
  if (!code || code.length < 8) return ''
  try {
    const { status, json } = await getJson(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json`,
      { Accept: 'application/json', 'User-Agent': 'Jarvis/2.37.0 (local.jarvis.app)' },
    )
    if (status < 200 || status >= 300) return ''
    const product = json.product as { product_name?: string; brands?: string } | undefined
    const name = String(product?.product_name || '').trim()
    const brand = String(product?.brands || '').trim()
    if (!name) return ''
    return `Open Food Facts: ${[brand, name].filter(Boolean).join(' — ')}.`
  } catch {
    return ''
  }
}
