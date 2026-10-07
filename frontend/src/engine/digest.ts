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
  const slice = history.slice(-8)
  if (slice.length < 2) {
    return {
      handled: true,
      reply: 'Zu wenig Gespräch für eine Nachbereitung.',
      tool: { tool_status: 'executed', tool: 'digest', action: 'empty', label: 'Gespräch' },
      lastTool: 'digest',
    }
  }
  const line = localDigest(slice)
  await addNote(line, conversationId)
  return {
    handled: true,
    reply: `${line} Als Notiz gespeichert.`,
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

export function localDigest(msgs: { role: string; content: string }[]): string {
  const topics: string[] = []
  for (const m of msgs) {
    if (m.role !== 'user') continue
    if (parseDigestIntent(m.content)) continue
    const q = m.content.replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '')
    if (q.length < 4) continue
    topics.push(q.length > 72 ? `${q.slice(0, 70)}…` : q)
  }
  if (!topics.length) return 'Nichts Greifbares.'
  const uniq = [...new Set(topics)].slice(-5)
  return `Themen: ${uniq.join(' · ')}.`
}
