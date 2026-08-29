export type ChatTurn = { role: string; content: string }

export function toChatRole(role: string): 'system' | 'user' | 'assistant' {
  if (role === 'assistant') return 'assistant'
  if (role === 'system') return 'system'
  return 'user'
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
