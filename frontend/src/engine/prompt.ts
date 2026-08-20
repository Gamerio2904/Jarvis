export type ChatTurn = { role: string; content: string }

export function toChatRole(role: string): 'system' | 'user' | 'assistant' {
  if (role === 'assistant') return 'assistant'
  if (role === 'system') return 'system'
  return 'user'
}

/** n_ctx 512 minus generation. Pack only when the prompt would overflow. */
export function packChat(messages: ChatTurn[], maxChars = 1400): ChatTurn[] {
  const total = messages.reduce((n, m) => n + m.content.length + 24, 0)
  if (total <= maxChars) return messages
  const sys = messages[0]?.role === 'system' ? messages[0] : null
  const rest = sys ? messages.slice(1) : [...messages]
  const last = rest.pop()
  const kept: ChatTurn[] = []
  let used = (sys?.content.length || 0) + (last?.content.length || 0) + 48
  for (let i = rest.length - 1; i >= 0; i -= 1) {
    const m = rest[i]
    const cost = m.content.length + 24
    if (used + cost > maxChars) break
    used += cost
    kept.unshift(m)
  }
  return [...(sys ? [sys] : []), ...kept, ...(last ? [last] : [])]
}

/** Qwen2.5 Instruct chat template — more reliable than the OAI wrapper on WASM. */
export function formatQwenChat(messages: ChatTurn[]): string {
  let out = ''
  for (const m of messages) {
    out += `<|im_start|>${toChatRole(m.role)}\n${m.content}<|im_end|>\n`
  }
  out += '<|im_start|>assistant\n'
  return out
}

export const QWEN_STOP = ['<|im_end|>', '<|endoftext|>', '<|im_start|>']
