export type OutlookTag = 'hormus' | 'ukraine' | 'opec' | 'ezb' | 'asien' | 'oil'

const RULES: Array<{ tag: OutlookTag; re: RegExp }> = [
  { tag: 'hormus', re: /hormus|hormuz|straße von hormus|strait of hormuz|golf von oman|tankerangriff/i },
  { tag: 'ukraine', re: /ukraine|kiew|kyiv|kyjiw|donbass|selenskyj/i },
  { tag: 'opec', re: /opec\+?|förderkürzung|förderquote/i },
  { tag: 'ezb', re: /(^|[^a-zäöüß])ezb([^a-zäöüß]|$)|leitzins|ezb-zins|inflation/i },
  { tag: 'asien', re: /china|asien|indien|nachfrage\s+in\s+asien/i },
  { tag: 'oil', re: /rohöL|ölpreis|brent|\bwti\b|crude|erdöl|tanker/i },
]

const LABEL: Record<OutlookTag, string> = {
  hormus: 'Straße von Hormus',
  ukraine: 'Ukraine',
  opec: 'OPEC',
  ezb: 'EZB',
  asien: 'Asien',
  oil: 'Rohöl',
}

export function tagNewsText(blob: string): OutlookTag[] {
  const t = blob || ''
  const out: OutlookTag[] = []
  for (const r of RULES) {
    if (r.re.test(t) && !out.includes(r.tag)) out.push(r.tag)
  }
  return out
}

export function tagLabel(tag: OutlookTag): string {
  return LABEL[tag]
}

export function chainSentences(tags: OutlookTag[]): string[] {
  const lines: string[] = []
  if (tags.includes('hormus')) {
    lines.push('Die Straße von Hormus ist eine Tanker-Enge: bleibt sie angespannt, liegt oft ein Risikoaufschlag auf Rohöl.')
  }
  if (tags.includes('ukraine')) {
    lines.push('Der Krieg in der Ukraine kann den Risikoaufschlag stützen, das ist keine automatische Preisgarantie.')
  }
  if (tags.includes('opec')) {
    lines.push('OPEC-Förderung wirkt auf das Angebot, sobald eine Meldung das belegt.')
  }
  if (tags.includes('asien')) {
    lines.push('Höhere Nachfrage in Asien stützt den Verbrauch, wenn die Meldungen das hergeben.')
  }
  if (tags.includes('ezb') && !tags.includes('oil') && !tags.includes('hormus')) {
    lines.push('EZB-Zinsen wirken vor allem auf den Euro, nicht eins zu eins auf die Tankstelle.')
  }
  return lines
}
