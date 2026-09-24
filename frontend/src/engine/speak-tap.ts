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

export function createSentenceTap(eager = false, opts?: { holdRest?: boolean }) {
  let emitted = 0
  let hold = ''
  let started = false
  const holdRest = Boolean(opts?.holdRest)
  return {
    feed(full: string): string[] {
      const add = full.slice(emitted)
      emitted = full.length
      hold += add
      // First sentence starts audio; the rest waits for flush so TTS is one clip.
      if (started && holdRest) return []
      const { parts, rest } = pullReady(hold, eager)
      hold = rest
      if (!parts.length) return []
      if (holdRest) {
        started = true
        const [first, ...later] = parts
        hold = [later.join(' '), hold].filter(Boolean).join(' ')
        return first ? [first] : []
      }
      started = true
      return parts
    },
    flush(): string[] {
      const t = hold.replace(/\s+/g, ' ').trim()
      hold = ''
      return t ? [t] : []
    },
  }
}

/** Text that TTS has not spoken yet — final reply minus what the pipeline already played. */
export function unspokenTail(full: string, spoken: string): string {
  const f = (full || '').replace(/\s+/g, ' ').trim()
  const s = (spoken || '').replace(/\s+/g, ' ').trim()
  if (!f) return ''
  if (!s) return f
  if (f === s) return ''
  if (f.startsWith(s)) return f.slice(s.length).trim()
  return f
}

const GERMAN_WORD =
  /\b(der|die|das|und|ist|nicht|ein|eine|ich|sie|wir|mit|auf|den|dem|für|von|zu|im|am|sich|auch|noch|nur|wie|was|alles|klar|heute|wetter|fernseher|bitte|danke|guten|morgen|abend)\b/i

export function looksGerman(text: string): boolean {
  const t = (text || '').trim()
  if (!t) return false
  if (/[äöüÄÖÜß]/.test(t)) return true
  const englishOnly =
    /\b(the|and|you|your|this|that|with|from|have|will|just|okay|ok)\b/i.test(t) &&
    !GERMAN_WORD.test(t)
  if (englishOnly) return false
  return GERMAN_WORD.test(t)
}

/** Deutsch oder mindestens zwei Sätze: Edge sofort, nicht Gemini-Warten. */
export function preferEdgeForReply(text: string): boolean {
  if (looksGerman(text)) return true
  const parts = (text || '')
    .split(/[.!?…]+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 8)
  return parts.length >= 2
}
