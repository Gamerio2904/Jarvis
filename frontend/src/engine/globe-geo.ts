import type { OutlookTag } from './outlook-tags.ts'

export type GeoPinKind = 'here' | 'iss' | 'flight' | 'warn' | 'news' | 'outlook'

export type GeoFix = { name: string; lat: number; lon: number; kind: GeoPinKind; line?: string }

const TAG_FIX: Record<OutlookTag, GeoFix | null> = {
  hormus: { name: 'Straße von Hormus', lat: 26.57, lon: 56.25, kind: 'outlook' },
  ukraine: { name: 'Kiew', lat: 50.45, lon: 30.52, kind: 'outlook' },
  opec: { name: 'Wien (OPEC)', lat: 48.21, lon: 16.37, kind: 'outlook' },
  ezb: { name: 'Frankfurt (EZB)', lat: 50.11, lon: 8.68, kind: 'outlook' },
  asien: null,
  oil: null,
}

const PLACES: Array<{ re: RegExp; name: string; lat: number; lon: number }> = [
  { re: /\bberlin\b/i, name: 'Berlin', lat: 52.52, lon: 13.41 },
  { re: /\bwashington\b|\bweiße[sn]?\s+haus\b/i, name: 'Washington', lat: 38.9, lon: -77.04 },
  { re: /\bpeking\b|\bbeijing\b/i, name: 'Peking', lat: 39.9, lon: 116.4 },
  { re: /\bmoskau\b/i, name: 'Moskau', lat: 55.76, lon: 37.62 },
  { re: /\bteheran\b/i, name: 'Teheran', lat: 35.69, lon: 51.39 },
  { re: /\bparis\b/i, name: 'Paris', lat: 48.86, lon: 2.35 },
  { re: /\blondon\b/i, name: 'London', lat: 51.51, lon: -0.13 },
  { re: /\bbrüssel\b|\bbbruessel\b/i, name: 'Brüssel', lat: 50.85, lon: 4.35 },
  { re: /\bingersheim\b/i, name: 'Ingersheim', lat: 49.08, lon: 9.18 },
  { re: /\bheilbronn\b/i, name: 'Heilbronn', lat: 49.14, lon: 9.22 },
  { re: /\bstuttgart\b/i, name: 'Stuttgart', lat: 48.78, lon: 9.18 },
  { re: /\bmuenchen\b|\bmünchen\b/i, name: 'München', lat: 48.14, lon: 11.58 },
  { re: /\bkiew\b|\bkyjiw\b|\bkyiv\b/i, name: 'Kiew', lat: 50.45, lon: 30.52 },
  { re: /\bhormus\b|\bhormuz\b/i, name: 'Straße von Hormus', lat: 26.57, lon: 56.25 },
]

export function pinForTag(tag: OutlookTag): GeoFix | null {
  return TAG_FIX[tag] || null
}

export function pinForText(blob: string): GeoFix | null {
  const t = blob || ''
  for (const p of PLACES) {
    if (p.re.test(t)) return { name: p.name, lat: p.lat, lon: p.lon, kind: 'news', line: t.slice(0, 140) }
  }
  return null
}
