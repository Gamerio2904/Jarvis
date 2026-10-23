/** Anleitungen als Step 1, Step 2, … — die Persona verbietet sonst Listen. */

const ASK =
  /\b(?:step[\s-]*by[\s-]*step|schritt\s*für\s*schritt|schrittweise|in\s+schritten|anleitung)\b/i

export function asksForSteps(text: string): boolean {
  const t = text.trim()
  return t.length > 0 && t.length < 400 && ASK.test(t)
}

export const STEP_HINT = `Diese Antwort ist eine Anleitung. Die Regel „keine Listen“ gilt hier nicht.
Genau eine Zeile pro Schritt, ohne Einleitung und ohne Markdown:
Step 1 — …
Step 2 — …
So viele Schritte wie die Sache braucht. Jeder Schritt ein ganzer Satz.`

const MARKER = /^(?:step|schritt)\s*\d+\s*[:.\-—–]\s*/i

function stripMarker(line: string): string {
  let next = line.trim()
  while (MARKER.test(next)) next = next.replace(MARKER, '').trim()
  return next.replace(/^\d+\s*[:.)\-—–]\s*/, '').trim()
}

const RECIPE_ASK = /\b(?:rezept|auflauf|kuchen|backen|kochen|zubereiten|zutaten)\b/i
const SEARCH_ASK = /\b(?:such(?:e|en)?|google|im\s+internet)\b/i

/** Kochen und Backen bekommen das Rezeptgerüst, keine flache Step-Wand. */
export function asksForRecipe(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 400 || SEARCH_ASK.test(t)) return false
  return RECIPE_ASK.test(t)
}

export const RECIPE_HINT = `Diese Antwort ist ein Rezept. Die Regel „keine Listen“ gilt hier nicht. Keine Emojis, keine Sternchen.
Aufbau, in dieser Reihenfolge:

Titel – Schritt für Schritt

Ein Satz, was es ist.

Zubereitungszeit: ca. … Minuten
Backzeit: ca. … Minuten
Für: … Personen

Zutaten
- Menge und Zutat, eine Zeile pro Zutat

Schritt 1: Kurzer Titel
Zwei bis vier Sätze oder nummerierte Unterpunkte.

Schritt 2: Kurzer Titel
…

Dazu passen:
- Beilage

Extra-Tipp
Ein Satz.

Eine Frage noch: eine konkrete Variante, zum Beispiel andere Zutaten oder eine Beilage.`

function stripEmoji(text: string): string {
  return text
    .replace(/\p{Extended_Pictographic}|\uFE0F/gu, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

function dishFromAsk(ask: string): string {
  const t = ask
    .replace(/[?!.,:;]/g, ' ')
    .replace(/\b(?:ich|will|möchte|moechte|gerne|einen|einem|eine|ein|gib|mir|bitte|step|by|anleitung|schritt|für|fuer|machen|backen|kochen|rezept|zum|zur|mal)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!t || t.length > 42) return 'Rezept'
  return t.replace(/^\p{Ll}/u, (c) => c.toLocaleUpperCase('de-DE'))
}

function tidyRecipe(text: string): string {
  return stripEmoji(text)
    .replace(/\r/g, '')
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

function stepChunks(text: string): string[] {
  const marked = text
    .split(/(?=(?:step|schritt)\s*\d+\b)/i)
    .map((part) => stripMarker(part).replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 1)
  if (marked.length >= 2) return marked
  return sentences(text)
}

function stepTitle(body: string): string {
  const head = body.split(/[.!?]/)[0]?.trim() || body
  const words = head.split(/\s+/).slice(0, 4).join(' ')
  return words.replace(/^\p{Ll}/u, (c) => c.toLocaleUpperCase('de-DE'))
}

/** ChatGPT-Aufbau: Titel, Zeiten, Zutaten, Schritt N, Beilage, Tipp. Ohne Emojis. */
export function formatRecipe(text: string, ask = ''): string {
  const raw = tidyRecipe(text)
  if (!raw) return raw
  const dish = dishFromAsk(ask)
  if (/\bZutaten\b/i.test(raw) && /\b(?:Schritt|Step)\s*\d+/i.test(raw)) {
    const kept = raw
      .replace(/\bStep\s+(\d+)\s*[:.\-—–]\s*/gi, 'Schritt $1: ')
      .replace(/((?:Schritt\s*\d+\s*[:.\-—–]\s*)+)/gi, (block) => {
        const n = /Schritt\s*(\d+)/i.exec(block)
        return n ? `Schritt ${n[1]}: ` : ''
      })
    if (/\bEine Frage noch\b/i.test(kept)) return kept
    return `${kept.replace(/\s+$/, '')}\n\nEine Frage noch: Möchten Sie ${dish} in einer anderen Menge oder mit einer anderen Beilage?`
  }
  const steps = stepChunks(raw)
  if (steps.length < 2) return raw
  const body = steps
    .map((part, index) => {
      const sentence = /[.!?]$/.test(part) ? part : `${part}.`
      return `Schritt ${index + 1}: ${stepTitle(sentence)}\n${sentence}`
    })
    .join('\n\n')
  const question = /\bEine Frage noch\b/i.test(raw)
    ? ''
    : `\n\nEine Frage noch: Möchten Sie ${dish} in einer anderen Menge oder mit einer anderen Beilage?`
  return `${dish} – Schritt für Schritt\n\n${body}${question}`
}

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8)
}

export function formatStepGuide(text: string): string {
  const raw = text.replace(/\r/g, '').trim()
  if (!raw) return raw
  const lines = raw.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  const marked = lines.length >= 2 && lines.every((line) => /^(?:step|schritt)\s*\d+|^\d+[.)]/i.test(line))
  const parts = marked ? lines.map(stripMarker) : sentences(raw)
  const steps = (parts.length >= 2 ? parts : raw.split(/\s*;\s*/))
    .map((part) => stripMarker(part).replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 1)
  if (steps.length < 2) return raw
  return steps
    .map((part, index) => {
      const body = /[.!?]$/.test(part) ? part : `${part}.`
      return `Step ${index + 1} — ${body}`
    })
    .join('\n')
}
