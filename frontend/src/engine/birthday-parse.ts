const MONTHS: Record<string, number> = {
  januar: 1,
  februar: 2,
  märz: 3,
  maerz: 3,
  april: 4,
  mai: 5,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12,
}

export type BirthdayIntent =
  | { kind: 'create'; name: string; month: number; day: number }
  | { kind: 'list' }

const LIST = /^\s*(?:geburtstage|wer\s+hat\s+geburtstag)\s*\??\s*$/i
const WRITE =
  /^\s*(?:geburtstag\s+)?(.+?)\s+hat\s+am\s+(\d{1,2})\.?\s*(\d{1,2}|januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)\.?(?:\s+geburtstag)?\s*$/i
const WRITE2 =
  /^\s*geburtstag\s+(.+?)\s+(\d{1,2})\.(\d{1,2})\.?\s*$/i

export function parseBirthdayIntent(text: string): BirthdayIntent | null {
  const t = text.trim()
  if (!t || t.length > 140) return null
  if (LIST.test(t)) return { kind: 'list' }
  const a = WRITE.exec(t)
  if (a) {
    const day = Number(a[2])
    const month = MONTHS[a[3].toLowerCase()] || Number(a[3])
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { kind: 'create', name: a[1].replace(/^geburtstag\s+/i, '').trim(), month, day }
    }
  }
  const b = WRITE2.exec(t)
  if (b) {
    const day = Number(b[2])
    const month = Number(b[3])
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { kind: 'create', name: b[1].trim(), month, day }
    }
  }
  return null
}

export function nextBirthday(month: number, day: number, now = new Date()): Date {
  const d = new Date(now)
  d.setMonth(month - 1, day)
  d.setHours(9, 0, 0, 0)
  if (d.getTime() <= now.getTime()) d.setFullYear(d.getFullYear() + 1)
  return d
}
