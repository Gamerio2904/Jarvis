export type ResearchSource = {
  title: string
  url: string
  snippet: string
  provider: string
  retrieved_at: string
}

export type ResearchMeta = {
  used?: boolean
  status?: string
  query?: string
  sources?: ResearchSource[]
  error?: string | null
  diverges?: boolean
  privacy_note?: string | null
  badge?: string | null
  audit_id?: string
  status_label?: string | null
  network_attempted?: boolean
}

export function isLiveLookup(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 240) return false
  if (/\b(suche|recherchier(?:e|en)?|google(?:n)?|im internet|im netz|schau(?:e)? nach)\b/i.test(t)) {
    return true
  }
  if (/\b(wetter|temperatur|nachrichten|news)\b/i.test(t)) return true
  if (/\baktuell(?:e[rs]?)?\b/i.test(t) && /\b(preis|kurs|spielstand|wetter)\b/i.test(t)) return true
  return false
}

export const RESEARCH_OFF_REPLY =
  'Live-Suche ist aus. Unter Einstellungen Internet-Research an — sonst erfinde ich kein Wetter und keine Suche.'

export const RESEARCH_NEEDS_GEMINI =
  'Research braucht Gemini. Unter Einstellungen Gemini an, dann die Suche nochmal.'

export const RESEARCH_EMPTY =
  'Netz hat nicht geantwortet. Ich rate keine Rezepte und keine Fakten aus dem Kopf.'

export function researchHasSources(r?: ResearchMeta | null): boolean {
  return Boolean(r?.used && r.sources?.some((s) => Boolean(s.url)))
}
