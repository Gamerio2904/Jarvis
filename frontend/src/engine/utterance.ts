/** Strip vocative “Jarvis/Service …” so spoken commands still hit the router. */

const VOCATIVE =
  /^(?:(?:hey|hallo|hi|ok(?:ay)?|so)\s+)?(?:jarvis|service)\s*[,:\-–]?\s+/i
const COMMAND_START =
  /^(?:ruf|anruf|fahr|bring|navigier|route|spiel|pause|weiter|wecker|timer|termin|kalender|wetter|merk|zeig|such|lies|aktivier|deaktivier|laut|fernseh|\btv\b|einkauf|erinner|todo|notiz|wo\s+|lauf|geh)/i

export function normalizeUtterance(text: string): string {
  const raw = text.replace(/\s+/g, ' ').trim()
  if (!raw) return raw
  const m = VOCATIVE.exec(raw)
  if (!m) return raw
  const rest = raw.slice(m[0].length).trim()
  if (!rest || !COMMAND_START.test(rest)) return raw
  return rest
}
