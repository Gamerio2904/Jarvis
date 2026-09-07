import type { ToolMeta } from './tools.ts'
import type { TestCopyItem } from './test-copy.ts'

export type DebugVerdict = 'pass' | 'fail' | 'skip' | 'unknown'

export function judgeTurn(item: TestCopyItem, reply: string, tool?: ToolMeta | null, error?: string): DebugVerdict {
  const expect = item.expect
  if (error && expect?.skipIf) return 'skip'
  if (!expect) return reply.trim() ? 'unknown' : 'fail'
  if (expect.tool === 'smalltalk') {
    if (tool?.tool) return 'fail'
    return reply.trim() ? 'unknown' : 'fail'
  }
  if (expect.tool === 'refuse') {
    if (tool?.tool === 'wont') return 'pass'
    if (/kein hirn/i.test(reply)) return 'unknown'
    return /nicht|kein|ohne|mache ich nicht|kann ich nicht/i.test(reply) ? 'pass' : 'fail'
  }
  if (expect.mustNot?.some((n) => new RegExp(n, 'i').test(reply))) return 'fail'
  if (expect.confirm) {
    const pending = tool?.tool_status === 'executed' && /ja|nachfrage|wirklich/i.test(reply)
    const asked = /\?/.test(reply) || /ja oder nein|nachfrage|bestätigen/i.test(reply)
    if (/ist bestellt|zugestellt|taxi ist unterwegs/i.test(reply)) return 'fail'
    return asked || pending || tool?.action === 'ask' ? 'pass' : tool?.tool === expect.tool ? 'pass' : 'fail'
  }
  if (expect.skipIf === 'no_pc' && /pc nicht|nicht verbunden|aus\.|locateanything|jarvissee|sehen am pc ist aus/i.test(reply))
    return 'skip'
  if (expect.skipIf === 'no_tv' && /tv|fernseh|ungepaart|nicht gekoppelt/i.test(reply)) return 'skip'
  if (expect.skipIf === 'no_gemini' && /gemini/i.test(reply) && /aus|anmachen|opt-in|\ban\b|key|kein hirn|foto-knopf/i.test(reply))
    return 'skip'
  if (expect.skipIf === 'no_gps' && /standort|lage rate/i.test(reply)) return 'skip'
  if (expect.tool) {
    const got = tool?.tool || ''
    if (got === expect.tool) return 'pass'
    if (expect.tool.includes('|') && expect.tool.split('|').map((s) => s.trim()).includes(got)) return 'pass'
    return 'fail'
  }
  return 'unknown'
}
