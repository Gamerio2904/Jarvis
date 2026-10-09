export function isYugiohDuelTrigger(text: string): boolean {
  const normalized = (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de-DE')
    .replace(/[.!?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return /^(?:jarvis[, ]+)?ich fordere dich zu einem duell heraus$/.test(normalized)
}
