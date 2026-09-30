/** Zeiten aus dem Transkript. Code wirft weg, was zu lang, zu kurz oder hinter dem Ende liegt. */

export type ClipWord = { t: number; d: number; w: string }

export type ClipSentence = { start: number; end: number; text: string }

export type ClipRange = { start: number; end: number; quote: string }

export const CLIP_MIN_S = 20
export const CLIP_MAX_S = 75
export const CLIP_SUM_S = 180

export function wordsToSentences(words: ClipWord[]): ClipSentence[] {
  const out: ClipSentence[] = []
  let cur: ClipWord[] = []
  const flush = () => {
    if (!cur.length) return
    const text = cur
      .map((w) => w.w)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) out.push({ start: cur[0].t, end: cur[cur.length - 1].t + cur[cur.length - 1].d, text })
    cur = []
  }
  for (const word of words) {
    if (cur.length) {
      const prev = cur[cur.length - 1]
      if (word.t - (prev.t + prev.d) > 0.8) flush()
    }
    cur.push(word)
    if (/[.!?]$/.test(word.w)) flush()
  }
  flush()
  return out
}

function snapRange(start: number, end: number, words: ClipWord[], duration: number): { start: number; end: number } | null {
  if (!words.length || end <= start || start > duration) return null
  let si = 0
  let best = Infinity
  for (let i = 0; i < words.length; i += 1) {
    const dist = Math.abs(words[i].t - start)
    if (dist < best) {
      best = dist
      si = i
    }
  }
  let ei = si
  best = Infinity
  for (let i = si; i < words.length; i += 1) {
    const at = words[i].t + words[i].d
    const dist = Math.abs(at - end)
    if (dist < best) {
      best = dist
      ei = i
    }
  }
  const s = words[si].t
  const e = words[ei].t + words[ei].d
  if (!(e > s) || e - s < CLIP_MIN_S || e - s > CLIP_MAX_S) return null
  if (s < -0.05 || e > duration + 0.25) return null
  return { start: s, end: e }
}

/** Ungültige Paare fallen weg. Die Summe bleibt bei 180 Sekunden. */
export function acceptSegments(
  raw: Array<{ start: number; end: number; quote?: string }>,
  words: ClipWord[],
  duration: number,
): ClipRange[] {
  const out: ClipRange[] = []
  let sum = 0
  for (const row of raw) {
    if (out.length >= 3) break
    if (!Number.isFinite(row.start) || !Number.isFinite(row.end) || row.end <= row.start) continue
    if (row.start > duration) continue
    const snapped = snapRange(row.start, row.end, words, duration)
    if (!snapped) continue
    const len = snapped.end - snapped.start
    if (sum + len > CLIP_SUM_S) continue
    sum += len
    out.push({ start: snapped.start, end: snapped.end, quote: String(row.quote || '').slice(0, 80) })
  }
  return out
}

export function parseRankJson(text: string): Array<{ url: number; start: number; end: number; quote: string }> {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const arr: unknown = JSON.parse(match[0])
    if (!Array.isArray(arr)) return []
    return arr.map((row) => {
      const item = row as { url?: number; start?: number; end?: number; quote?: string }
      return {
        url: Number(item.url) || 0,
        start: Number(item.start),
        end: Number(item.end),
        quote: String(item.quote || ''),
      }
    })
  } catch {
    return []
  }
}

export function rankPrompt(blocks: Array<{ title: string; sentences: ClipSentence[] }>): string {
  const body = blocks
    .map((block, i) => {
      const lines = block.sentences
        .slice(0, 80)
        .map((s) => `${s.start.toFixed(1)}-${s.end.toFixed(1)} ${s.text}`)
        .join('\n')
      return `Video ${i} (${block.title}):\n${lines}`
    })
    .join('\n\n')
  return [
    'Wähle 1 bis 3 Stellen. Antworte nur mit einem JSON-Array.',
    'Felder: url (Index), start, end, quote (kurzer Satz aus dem Text).',
    'Jede Stelle 20 bis 75 Sekunden, Summe höchstens 180. Nur Zeiten, die in den Zeilen stehen.',
    body,
  ].join('\n')
}
