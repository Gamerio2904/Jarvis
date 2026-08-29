import { completeGemini, geminiReady } from './gemini.ts'
import { listMessages, addNote } from './store.ts'
import type { ToolMeta } from './tools.ts'
import { parseDigestIntent } from './digest-parse.ts'

export { parseDigestIntent }
export type { DigestIntent } from './digest-parse.ts'

export async function handleDigest(
  conversationId: string,
  text: string,
): Promise<{ handled: boolean; reply?: string; tool?: ToolMeta; lastTool?: string }> {
  const intent = parseDigestIntent(text)
  if (!intent) return { handled: false }
  if (intent.kind === 'note') {
    const body = intent.body || (await lastUserLine(conversationId))
    if (!body) {
      return {
        handled: true,
        reply: 'Den Text der Sprachnotiz sagen. Eine Kundenrechnung mache ich nicht.',
        tool: { tool_status: 'executed', tool: 'digest', action: 'ask', label: 'Notiz' },
        lastTool: 'digest',
      }
    }
    await addNote(body, conversationId)
    return {
      handled: true,
      reply: 'Als Notiz gespeichert. PDF-Rechnung an Kunden mache ich nicht.',
      tool: { tool_status: 'executed', tool: 'digest', action: 'note', label: 'Notiz', preview: body.slice(0, 80) },
      lastTool: 'digest',
    }
  }

  const history = await listMessages(conversationId)
  const slice = history.slice(-24)
  if (slice.length < 2) {
    return {
      handled: true,
      reply: 'Zu wenig Gespräch für eine Nachbereitung.',
      tool: { tool_status: 'executed', tool: 'digest', action: 'empty', label: 'Gespräch' },
      lastTool: 'digest',
    }
  }
  const blob = slice.map((m) => `${m.role === 'assistant' ? 'Jarvis' : 'Sie'}: ${m.content}`).join('\n')
  let line = ''
  if (geminiReady()) {
    try {
      const out = await completeGemini(
        [
          {
            role: 'system',
            content:
              'Siezen. Kurz. Drei Sätze: worum ging es, was merken, was offen. Kein Umsatz-Coach, kein Sales. Deutsch.',
          },
          { role: 'user', content: blob.slice(0, 6000) },
        ],
        undefined,
        { maxOutputTokens: 280, timeoutMs: 8_000 },
      )
      line = (out.text || '').trim()
    } catch {
      line = ''
    }
  }
  if (!line) line = localDigest(slice.map((m) => m.content))
  await addNote(line, conversationId)
  return {
    handled: true,
    reply: `${line} Als Notiz gelegt. Kein Sales-Coach.`,
    tool: { tool_status: 'executed', tool: 'digest', action: 'summary', label: 'Gespräch', preview: line.slice(0, 80) },
    lastTool: 'digest',
  }
}

async function lastUserLine(conversationId: string): Promise<string> {
  const rows = await listMessages(conversationId)
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].role === 'user' && !parseDigestIntent(rows[i].content)) return rows[i].content.trim()
  }
  return ''
}

function localDigest(parts: string[]): string {
  const text = parts.join(' ').replace(/\s+/g, ' ').trim()
  const cut = text.slice(0, 280)
  return cut ? `${cut}${text.length > 280 ? '…' : ''}` : 'Nichts Greifbares.'
}
