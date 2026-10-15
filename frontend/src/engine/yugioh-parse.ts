export function isYugiohDuelTrigger(text: string): boolean {
  const normalized = (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de-DE')
    .replace(/[.!?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = normalized.replace(/[^a-z0-9 ]/g, ' ')
  const question = /\b(?:wie|was|warum|wieso|weshalb|welche|welcher|wo|wann|wer)\b/.test(words)
  const play = /\b(?:due+l+|spielen|starte|starten)\b/.test(words) || (/\bspiel\b/.test(words) && !/\bspiel(?:karten|er|regeln)\b/.test(words))
  if (!question && /\b(?:yu ?gi ?oh|yugioh)\b/.test(words) && play) return true
  if (!question && /^(?:(?:spiel(?:e|en|t)?|starte|starten)\s+)?(?:yu ?gi ?oh|yugioh)$/.test(words)) return true
  if (/\bzeit\s+f(?:u|ue)r\s+ein\s+due+l+\b/.test(words)) return true
  if (/^(?:ein\s+)?due+l+$/.test(words)) return true
  return /\b(?:fordere|forder|herausfordern|herausforderung)\b/.test(words) && /\bdue+l+\b/.test(words)
}
