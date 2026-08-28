import type { OutlookTag } from './outlook-tags.ts'

export type GeoPinKind = 'here' | 'iss' | 'flight' | 'warn' | 'news' | 'outlook'

export type GeoFix = { name: string; lat: number; lon: number; kind: GeoPinKind; line?: string }

export type PlaceFix = { re: RegExp; name: string; lat: number; lon: number; blurb: string }

/** Blickmitte: nächster Lexikon-Ort, sonst Meer/kein Eintrag. ~80 km. */
export const CITY_HIT_KM = 80

const TAG_FIX: Record<OutlookTag, GeoFix | null> = {
  hormus: { name: 'Straße von Hormus', lat: 26.57, lon: 56.25, kind: 'outlook' },
  ukraine: { name: 'Kiew', lat: 50.45, lon: 30.52, kind: 'outlook' },
  opec: { name: 'Wien (OPEC)', lat: 48.21, lon: 16.37, kind: 'outlook' },
  ezb: { name: 'Frankfurt (EZB)', lat: 50.11, lon: 8.68, kind: 'outlook' },
  asien: null,
  oil: null,
}

/** Feste Ortsliste — kein Welt-Geocoder. Klischee-Halbsatz steht im Code. */
export const PLACES: PlaceFix[] = [
  { re: /\bberlin\b/i, name: 'Berlin', lat: 52.52, lon: 13.41, blurb: 'Hauptstadt von Deutschland.' },
  { re: /\bhamburg\b/i, name: 'Hamburg', lat: 53.55, lon: 9.99, blurb: 'Hafenstadt an der Elbe.' },
  { re: /\bk[oö]ln\b|\bkoeln\b/i, name: 'Köln', lat: 50.94, lon: 6.96, blurb: 'Domstadt am Rhein.' },
  { re: /\bmuenchen\b|\bmünchen\b/i, name: 'München', lat: 48.14, lon: 11.58, blurb: 'Hauptstadt von Bayern.' },
  { re: /\bstuttgart\b/i, name: 'Stuttgart', lat: 48.78, lon: 9.18, blurb: 'in Baden-Württemberg, am Neckar.' },
  { re: /\bfrankfurt\b/i, name: 'Frankfurt', lat: 50.11, lon: 8.68, blurb: 'Bankenstadt am Main, Sitz der EZB.' },
  { re: /\bheilbronn\b/i, name: 'Heilbronn', lat: 49.14, lon: 9.22, blurb: 'am Neckar, nahe Ingersheim.' },
  { re: /\bingersheim\b/i, name: 'Ingersheim', lat: 49.08, lon: 9.18, blurb: 'bei Heilbronn.' },
  { re: /\bwashington\b|\bweiße[sn]?\s+haus\b/i, name: 'Washington', lat: 38.9, lon: -77.04, blurb: 'Hauptstadt der USA.' },
  { re: /\bnew\s*york\b|\bnyc\b/i, name: 'New York', lat: 40.71, lon: -74.01, blurb: 'an der US-Ostküste.' },
  { re: /\blos\s+angeles\b/i, name: 'Los Angeles', lat: 34.05, lon: -118.24, blurb: 'an der US-Westküste.' },
  { re: /\bchicago\b/i, name: 'Chicago', lat: 41.88, lon: -87.63, blurb: 'am Michigansee.' },
  { re: /\btoronto\b/i, name: 'Toronto', lat: 43.65, lon: -79.38, blurb: 'größte Stadt Kanadas.' },
  { re: /\bpeking\b|\bbeijing\b/i, name: 'Peking', lat: 39.9, lon: 116.4, blurb: 'Hauptstadt von China.' },
  { re: /\bmoskau\b/i, name: 'Moskau', lat: 55.76, lon: 37.62, blurb: 'Hauptstadt von Russland.' },
  { re: /\bteheran\b/i, name: 'Teheran', lat: 35.69, lon: 51.39, blurb: 'Hauptstadt des Iran.' },
  { re: /\bparis\b/i, name: 'Paris', lat: 48.86, lon: 2.35, blurb: 'die Stadt der Liebe an der Seine.' },
  { re: /\blondon\b/i, name: 'London', lat: 51.51, lon: -0.13, blurb: 'an der Themse, Hauptstadt des Vereinigten Königreichs.' },
  { re: /\bbrüssel\b|\bbruessel\b/i, name: 'Brüssel', lat: 50.85, lon: 4.35, blurb: 'Hauptstadt Belgiens, Sitz der EU.' },
  { re: /\bkiew\b|\bkyjiw\b|\bkyiv\b/i, name: 'Kiew', lat: 50.45, lon: 30.52, blurb: 'Hauptstadt der Ukraine.' },
  { re: /\bhormus\b|\bhormuz\b/i, name: 'Straße von Hormus', lat: 26.57, lon: 56.25, blurb: 'Meeresenge am Persischen Golf.' },
  { re: /\bwien\b/i, name: 'Wien', lat: 48.21, lon: 16.37, blurb: 'Hauptstadt von Österreich.' },
  { re: /\brom\b/i, name: 'Rom', lat: 41.9, lon: 12.5, blurb: 'Hauptstadt von Italien, die ewige Stadt.' },
  { re: /\bmailand\b|\bmilano\b/i, name: 'Mailand', lat: 45.46, lon: 9.19, blurb: 'in Norditalien.' },
  { re: /\bvenedig\b|\bvenice\b/i, name: 'Venedig', lat: 45.44, lon: 12.33, blurb: 'die Stadt in der Lagune.' },
  { re: /\bmadrid\b/i, name: 'Madrid', lat: 40.42, lon: -3.7, blurb: 'Hauptstadt von Spanien.' },
  { re: /\bbarcelona\b/i, name: 'Barcelona', lat: 41.39, lon: 2.17, blurb: 'an der spanischen Mittelmeerküste.' },
  { re: /\blissabon\b|\blisbon\b/i, name: 'Lissabon', lat: 38.72, lon: -9.14, blurb: 'Hauptstadt von Portugal.' },
  { re: /\bamsterdam\b/i, name: 'Amsterdam', lat: 52.37, lon: 4.9, blurb: 'Hauptstadt der Niederlande.' },
  { re: /\bkopenhagen\b/i, name: 'Kopenhagen', lat: 55.68, lon: 12.57, blurb: 'Hauptstadt von Dänemark.' },
  { re: /\bstockholm\b/i, name: 'Stockholm', lat: 59.33, lon: 18.07, blurb: 'Hauptstadt von Schweden.' },
  { re: /\boslo\b/i, name: 'Oslo', lat: 59.91, lon: 10.75, blurb: 'Hauptstadt von Norwegen.' },
  { re: /\bhelsinki\b/i, name: 'Helsinki', lat: 60.17, lon: 24.94, blurb: 'Hauptstadt von Finnland.' },
  { re: /\bwarschau\b/i, name: 'Warschau', lat: 52.23, lon: 21.01, blurb: 'Hauptstadt von Polen.' },
  { re: /\bprag\b/i, name: 'Prag', lat: 50.08, lon: 14.44, blurb: 'Hauptstadt Tschechiens.' },
  { re: /\bbudapest\b/i, name: 'Budapest', lat: 47.5, lon: 19.04, blurb: 'Hauptstadt von Ungarn.' },
  { re: /\bathen\b/i, name: 'Athen', lat: 37.98, lon: 23.73, blurb: 'Hauptstadt von Griechenland.' },
  { re: /\bistanbul\b/i, name: 'Istanbul', lat: 41.01, lon: 28.98, blurb: 'am Bosporus.' },
  { re: /\bankara\b/i, name: 'Ankara', lat: 39.93, lon: 32.86, blurb: 'Hauptstadt der Türkei.' },
  { re: /\bdublin\b/i, name: 'Dublin', lat: 53.35, lon: -6.26, blurb: 'Hauptstadt von Irland.' },
  { re: /\bedinburgh\b/i, name: 'Edinburgh', lat: 55.95, lon: -3.19, blurb: 'Hauptstadt Schottlands.' },
  { re: /\bzürich\b|\bzuerich\b/i, name: 'Zürich', lat: 47.38, lon: 8.54, blurb: 'größte Stadt der Schweiz.' },
  { re: /\bkairo\b/i, name: 'Kairo', lat: 30.04, lon: 31.24, blurb: 'Hauptstadt von Ägypten, am Nil.' },
  { re: /\bdubai\b/i, name: 'Dubai', lat: 25.2, lon: 55.27, blurb: 'an der persischen Golfküste.' },
  { re: /\btokio\b|\btokyo\b/i, name: 'Tokio', lat: 35.68, lon: 139.69, blurb: 'Hauptstadt von Japan.' },
  { re: /\bseoul\b/i, name: 'Seoul', lat: 37.57, lon: 126.98, blurb: 'Hauptstadt Südkoreas.' },
  { re: /\bneu[- ]?delhi\b|\bnew delhi\b/i, name: 'Neu-Delhi', lat: 28.61, lon: 77.21, blurb: 'Hauptstadt von Indien.' },
  { re: /\bbangkok\b/i, name: 'Bangkok', lat: 13.76, lon: 100.5, blurb: 'Hauptstadt von Thailand.' },
  { re: /\bsingapur\b|\bsingapore\b/i, name: 'Singapur', lat: 1.35, lon: 103.82, blurb: 'Stadtstaat in Südostasien.' },
  { re: /\bsydney\b/i, name: 'Sydney', lat: -33.87, lon: 151.21, blurb: 'an der australischen Ostküste.' },
  { re: /\bcanberra\b/i, name: 'Canberra', lat: -35.28, lon: 149.13, blurb: 'Hauptstadt von Australien.' },
  { re: /\bmexiko[- ]?stadt\b|\bmexico\s+city\b/i, name: 'Mexiko-Stadt', lat: 19.43, lon: -99.13, blurb: 'Hauptstadt von Mexiko.' },
  { re: /\brio\b|\brio de janeiro\b/i, name: 'Rio de Janeiro', lat: -22.91, lon: -43.17, blurb: 'an der brasilianischen Küste.' },
  { re: /\bbuenos\s+aires\b/i, name: 'Buenos Aires', lat: -34.6, lon: -58.38, blurb: 'Hauptstadt von Argentinien.' },
  { re: /\bkapstadt\b/i, name: 'Kapstadt', lat: -33.92, lon: 18.42, blurb: 'an der Südspitze Afrikas.' },
  { re: /\bnairobi\b/i, name: 'Nairobi', lat: -1.29, lon: 36.82, blurb: 'Hauptstadt von Kenia.' },
  { re: /\blagos\b/i, name: 'Lagos', lat: 6.52, lon: 3.38, blurb: 'größte Stadt Nigerias.' },
]

export function pinForTag(tag: OutlookTag): GeoFix | null {
  return TAG_FIX[tag] || null
}

export function gazetteerHit(blob: string): PlaceFix | null {
  const t = blob || ''
  for (const p of PLACES) {
    if (p.re.test(t)) return p
  }
  return null
}

export function pinForText(blob: string): GeoFix | null {
  const hit = gazetteerHit(blob)
  if (!hit) return null
  return { name: hit.name, lat: hit.lat, lon: hit.lon, kind: 'news', line: (blob || '').slice(0, 140) }
}

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

export function nearestPlace(lat: number, lon: number, maxKm = CITY_HIT_KM): PlaceFix | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  let best: PlaceFix | null = null
  let bestD = maxKm
  const seen = new Set<string>()
  for (const p of PLACES) {
    if (seen.has(p.name)) continue
    seen.add(p.name)
    const d = haversineKm({ lat, lon }, p)
    if (d <= bestD) {
      bestD = d
      best = p
    }
  }
  return best
}

export function cityLine(place: Pick<PlaceFix, 'name' | 'blurb'>): string {
  return `Das ist ${place.name}, ${place.blurb}`.replace(/\s+/g, ' ').trim()
}

export function unknownPlaceLine(asked?: string): string {
  const name = (asked || '').trim()
  return name
    ? `Den Ort „${name}“ habe ich auf der Kugel nicht.`
    : 'Den Ort habe ich auf der Kugel nicht.'
}

export function noCityInViewLine(): string {
  return 'Hier liegt keine Stadt aus meinem Lexikon — Meer oder Land ohne Eintrag.'
}

export function coordsFromJson(raw: string): { lat: number; lon: number } | null {
  try {
    const o = JSON.parse(raw || '{}') as { lat?: number; lon?: number }
    const lat = Number(o.lat)
    const lon = Number(o.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    return { lat, lon }
  } catch {
    return null
  }
}

/** Blickmitte, sonst letzter Pin. Drift nach Fly-to darf London nicht als Meer verkaufen. */
export function resolveLookTarget(lookRaw: string, focusRaw: string): { lat: number; lon: number } | null {
  const look = coordsFromJson(lookRaw)
  const focus = coordsFromJson(focusRaw)
  if (look && nearestPlace(look.lat, look.lon)) return look
  if (focus) return focus
  return look
}

export function lookLatLon(yaw: number, pitch: number): { lat: number; lon: number } {
  const lat = Math.max(-85, Math.min(85, (pitch * 180) / Math.PI))
  let lon = ((yaw * 180) / Math.PI + 540) % 360
  if (lon > 180) lon -= 360
  return { lat, lon }
}

export function yawPitchFor(lat: number, lon: number): { yaw: number; pitch: number } {
  return { yaw: (lon * Math.PI) / 180, pitch: (lat * Math.PI) / 180 }
}
