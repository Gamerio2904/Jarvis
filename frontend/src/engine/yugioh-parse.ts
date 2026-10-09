export function isYugiohDuelTrigger(text: string): boolean {
  const normalized = (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de-DE')
    .replace(/[.!?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = normalized.replace(/[^a-z0-9 ]/g, ' ')
  if (/\b(?:yu ?gi ?oh|yugioh)\b/.test(words) && /\b(?:duell?|spiel\w*|starte\w*)\b/.test(words)) return true
  return /\b(?:fordere|forder|herausfordern|herausforderung)\b/.test(words) && /\bdue+l+\b/.test(words)
}
