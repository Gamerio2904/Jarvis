import { decideTurn } from './route-pick.ts'
import type { RouteCtx } from './route-types.ts'

/** Sätze, die die Parser von heute wirklich können. Keine Embeddings. */
export const COMMAND_NEIGHBORS = [
  'Öffne Watchliste',
  'Öffne Lieblinge',
  'Öffne Einstellungen',
  'Overlay zu',
  'Zeig Chat',
  'stell einen Timer für 10 Minuten',
  'stell den Wecker auf 7:00 Uhr',
  'Research an',
  'Gemini aus',
]

function tokensOf(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-zäöüß0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3),
  )
}

function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0
  for (const w of a) if (b.has(w)) n += 1
  return n
}

export function neighborUtterances(
  text: string,
  route: (utterance: string) => string | null,
  cap = 3,
): string[] {
  const have = tokensOf(text)
  const ranked = COMMAND_NEIGHBORS.map((s) => ({ s, n: overlap(have, tokensOf(s)) }))
    .filter((row) => row.n > 0)
    .sort((a, b) => b.n - a.n || a.s.localeCompare(b.s))
  const out: string[] = []
  for (const row of ranked) {
    if (!route(row.s)) continue
    if (out.includes(row.s)) continue
    out.push(row.s)
    if (out.length >= cap) break
  }
  return out
}

export function unknownReply(text: string, route: (utterance: string) => string | null): string {
  const neighbors = neighborUtterances(text, route)
  if (!neighbors.length) return 'Das ist so nicht eingebaut.'
  return `Das ist so nicht eingebaut. Geht zum Beispiel: ${neighbors.join(' / ')}.`
}

export function unknownReplyForCtx(ctx: RouteCtx): string {
  return unknownReply(ctx.text, (utterance) => {
    const decision = decideTurn({ ...ctx, text: utterance })
    return decision.pick.kind === 'run' ? decision.pick.id : null
  })
}
