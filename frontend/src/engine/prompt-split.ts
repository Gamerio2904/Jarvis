import { DEEP_SEARCH_HINT, SEARCH_ON_HINT, VOICE_HINT } from './persona.ts'

/** Static prefix for Gemini/Groq prompt cache. Variable memory goes on the last user turn. */

export type ChatTurn = { role: string; content: string }

export function splitCloudPrompt(opts: {
  persona: string
  voice?: boolean
  search?: boolean
  deep?: boolean
  memory?: string
  working?: string
  lastStep?: string
}): { system: string; variable: string } {
  const searchHint = opts.deep ? DEEP_SEARCH_HINT : opts.search ? SEARCH_ON_HINT : ''
  const system = [opts.persona.trim(), opts.voice ? VOICE_HINT : ''].filter(Boolean).join('\n\n')
  const variable = [
    searchHint,
    (opts.memory || '').trim(),
    (opts.working || '').trim(),
    (opts.lastStep || '').trim(),
  ]
    .filter(Boolean)
    .join('\n\n')
  return { system, variable }
}

export function attachVariable(messages: ChatTurn[], variable: string): ChatTurn[] {
  const extra = (variable || '').trim()
  if (!extra) return messages
  const out = messages.map((m) => ({ ...m }))
  for (let i = out.length - 1; i >= 0; i -= 1) {
    if (out[i].role === 'user') {
      out[i] = { ...out[i], content: `${out[i].content}\n\n${extra}` }
      return out
    }
  }
  out.push({ role: 'user', content: extra })
  return out
}
