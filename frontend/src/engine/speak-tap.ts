/** Split streamed reply text into speakable chunks. Never cut mid-sentence. */

const SENTENCE = /([\s\S]+?[.!?…])(\s+|$)/

function normalize(text: string): string {
  return text.replace(/([.!?…])(\S)/g, '$1 $2').replace(/\s+/g, ' ')
}

export function pullReady(hold: string, eager = false): { parts: string[]; rest: string } {
  const sentences: string[] = []
  let rest = normalize(hold)
  while (true) {
    const m = SENTENCE.exec(rest)
    if (!m) break
    const s = m[1].replace(/\s+/g, ' ').trim()
    if (s) sentences.push(s)
    rest = rest.slice(m[0].length)
  }

  const parts: string[] = []
  let bundle: string[] = []

  const textOf = () => bundle.join(' ')
  const emit = () => {
    const t = textOf().trim()
    if (t) parts.push(t)
    bundle = []
  }

  for (const s of sentences) {
    bundle.push(s)
    const text = textOf()
    const words = text.split(/\s+/).filter(Boolean).length
    const minWords = eager ? 2 : 4
    const minChars = eager ? 12 : 28
    if (bundle.length >= 2 || words >= minWords || text.length >= minChars) emit()
  }

  const leftover = textOf()
  rest = [leftover, rest].filter(Boolean).join(' ')
  if (eager) {
    const words = rest.split(/\s+/).filter(Boolean).length
    if (words >= 8) {
      parts.push(rest.trim())
      rest = ''
    }
  }
  return { parts, rest }
}

export function createSentenceTap(eager = false) {
  let emitted = 0
  let hold = ''
  return {
    feed(full: string): string[] {
      const add = full.slice(emitted)
      emitted = full.length
      hold += add
      const { parts, rest } = pullReady(hold, eager)
      hold = rest
      return parts
    },
    flush(): string[] {
      const t = hold.replace(/\s+/g, ' ').trim()
      hold = ''
      return t ? [t] : []
    },
  }
}
