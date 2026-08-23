import { normalizeUtterance } from './utterance.ts'

export type LawTopic = {
  key: string
  re: RegExp
  title: string
  cite: string
  url: string
  note: string
}

export const LAW_TOPICS: LawTopic[] = [
  {
    key: 'rent',
    re: /\b(kündigungsfrist\s+wohnung|mietkündigung|wohnung\s+kündigen)\b/i,
    title: 'Kündigungsfrist Wohnung',
    cite: '§ 573c BGB',
    url: 'https://www.gesetze-im-internet.de/bgb/__573c.html',
    note: 'Ordentliche Kündigung der Wohnung: meist zum dritten Werktag eines Kalendermonats auf Ende des übernächsten Monats. Abweichungen im Vertrag möglich.',
  },
  {
    key: 'job',
    re: /\b(kündigungsfrist\s+(?:arbeit|job|stelle)|arbeitsvertrag\s+kündigen)\b/i,
    title: 'Kündigungsfrist Arbeitsvertrag',
    cite: '§ 622 BGB',
    url: 'https://www.gesetze-im-internet.de/bgb/__622.html',
    note: 'Grundfrist oft vier Wochen zum 15. oder zum Monatsende; länger nach Betriebszugehörigkeit. Tarif kann anders liegen.',
  },
  {
    key: 'withdraw',
    re: /\b(widerruf|widerrufsrecht|14\s+tage)\b/i,
    title: 'Widerruf Fernabsatz',
    cite: '§ 355 BGB',
    url: 'https://www.gesetze-im-internet.de/bgb/__355.html',
    note: 'Widerruf bei Fernabsatz meist 14 Tage. Ausnahmen stehen im Gesetz, nicht hier als Rat.',
  },
  {
    key: 'defect',
    re: /\b(gewährleistung|mangel|reklamation|nacherfüllung)\b/i,
    title: 'Rechte bei Mängeln',
    cite: '§ 437 BGB',
    url: 'https://www.gesetze-im-internet.de/bgb/__437.html',
    note: 'Bei einem Mangel: Nacherfüllung, Minderung oder Rücktritt — nach den Voraussetzungen im BGB.',
  },
  {
    key: 'rentcut',
    re: /\b(mietminderung|wohnung\s+mangel)\b/i,
    title: 'Mietminderung',
    cite: '§ 536 BGB',
    url: 'https://www.gesetze-im-internet.de/bgb/__536.html',
    note: 'Bei einem Mangel der Mietsache kann die Miete kraft Gesetzes gemindert sein. Höhe ist Sache des Einzelfalls.',
  },
  {
    key: 'leave',
    re: /\b(urlaubsanspruch|wie\s+viel\s+urlaub)\b/i,
    title: 'Mindesturlaub',
    cite: '§ 3 BUrlG',
    url: 'https://www.gesetze-im-internet.de/burlg/__3.html',
    note: 'Gesetzlicher Mindesturlaub: 24 Werktage bei Sechs-Tage-Woche, entsprechend weniger bei Fünf-Tage-Woche.',
  },
]

export type LawIntent = { kind: 'cite'; topic: LawTopic } | { kind: 'ask' }

export function parseLawIntent(text: string): LawIntent | null {
  const t = normalizeUtterance(text.trim())
  if (!t || t.length > 180) return null
  if (/\bfeiertag/i.test(t)) return null
  const hit = LAW_TOPICS.find((x) => x.re.test(t))
  if (hit) return { kind: 'cite', topic: hit }
  if (/\b(paragraph|kündigungsfrist|gesetze-im-internet|was\s+steht\s+im\s+bgb)\b/i.test(t)) return { kind: 'ask' }
  return null
}
