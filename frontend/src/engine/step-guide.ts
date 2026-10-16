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

function stripMarker(line: string): string {
  return line
    .replace(/^(?:step|schritt)\s*\d+\s*[:.\-—–]\s*/i, '')
    .replace(/^\d+\s*[:.)\-—–]\s*/, '')
    .trim()
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
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 1)
  if (steps.length < 2) return raw
  return steps
    .map((part, index) => {
      const body = /[.!?]$/.test(part) ? part : `${part}.`
      return `Step ${index + 1} — ${body}`
    })
    .join('\n')
}
