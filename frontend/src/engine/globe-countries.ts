/** Allowlist-Länder für die Welt-Tour. Headline → ein Land, nie „Europa“. Kein Geocoder. */

export type CountryFix = {
  id: string
  name: string
  lat: number
  lon: number
  re: RegExp
  de?: boolean
  market?: 'hormus' | 'opec' | 'ezb'
}

export const COUNTRIES: CountryFix[] = [
  { id: 'hormus', name: 'Straße von Hormus', lat: 26.57, lon: 56.25, re: /\b(hormus|hormuz)\b/i, market: 'hormus' },
  { id: 'ua', name: 'Ukraine', lat: 48.38, lon: 31.17, re: /\b(ukraine|kiew|kyjiw|kyiv|donbass|selenskyj)\b/i },
  { id: 'ps', name: 'Palästina', lat: 31.95, lon: 35.23, re: /\b(gaza|gazastreifen|palästina|palaestina|westjordanland|hamas)\b/i },
  { id: 'il', name: 'Israel', lat: 31.05, lon: 34.85, re: /\b(israel|tel\s*aviv|netanjahu)\b/i },
  { id: 'tw', name: 'Taiwan', lat: 23.7, lon: 121.0, re: /\btaiwan\b/i },
  { id: 'kp', name: 'Nordkorea', lat: 40.34, lon: 127.51, re: /\b(nordkorea|pjöngjang|pjoengjang)\b/i },
  { id: 'ir', name: 'Iran', lat: 32.43, lon: 53.69, re: /\b(iran|teheran|tehran)\b/i },
  { id: 'sy', name: 'Syrien', lat: 34.8, lon: 39.0, re: /\b(syrien|damaskus)\b/i },
  { id: 'iq', name: 'Irak', lat: 33.22, lon: 43.68, re: /\b(irak|baghdad|bagdad)\b/i },
  { id: 'ye', name: 'Jemen', lat: 15.55, lon: 48.52, re: /\b(jemen|huthi)\b/i },
  { id: 'lb', name: 'Libanon', lat: 33.85, lon: 35.86, re: /\b(libanon|beirut|hisbollah)\b/i },
  { id: 'af', name: 'Afghanistan', lat: 33.94, lon: 67.71, re: /\b(afghanistan|taliban|kabul)\b/i },
  { id: 'ru', name: 'Russland', lat: 61.52, lon: 105.32, re: /\b(russland|moskau|kremlin|putin|russisch)\b/i },
  { id: 'cn', name: 'China', lat: 35.86, lon: 104.2, re: /\b(china|peking|beijing|xi\s+jinping)\b/i },
  { id: 'us', name: 'USA', lat: 39.83, lon: -98.58, re: /\b(usa|vereinigte[n]?\s+staaten|washington|weiße[sn]?\s+haus|weißen\s+haus|new\s*york|nyc)\b/i },
  { id: 'gb', name: 'Vereinigtes Königreich', lat: 54.0, lon: -2.5, re: /\b(großbritannien|grossbritannien|vereinigte[s]?\s+königreich|london|downing\s*street|england)\b/i },
  { id: 'fr', name: 'Frankreich', lat: 46.23, lon: 2.21, re: /\b(frankreich|paris|élysée|elysee)\b/i },
  { id: 'de', name: 'Deutschland', lat: 51.16, lon: 10.45, re: /\b(deutschland|bundesrepublik|\bbrd\b|berlin|hamburg|münchen|muenchen|köln|koeln|stuttgart|frankfurt|ingersheim|heilbronn)\b/i, de: true },
  { id: 'tr', name: 'Türkei', lat: 38.96, lon: 35.24, re: /\b(türkei|tuerkei|ankara|istanbul|erdogan)\b/i },
  { id: 'pl', name: 'Polen', lat: 51.92, lon: 19.15, re: /\b(polen|warschau)\b/i },
  { id: 'it', name: 'Italien', lat: 41.87, lon: 12.57, re: /\b(italien|rom|meloni)\b/i },
  { id: 'es', name: 'Spanien', lat: 40.46, lon: -3.75, re: /\b(spanien|madrid|barcelona)\b/i },
  { id: 'nl', name: 'Niederlande', lat: 52.13, lon: 5.29, re: /\b(niederlande|holland|amsterdam|den\s+haag)\b/i },
  { id: 'be', name: 'Belgien', lat: 50.5, lon: 4.47, re: /\b(belgien|brüssel|bruessel|eu-kommission)\b/i },
  { id: 'at', name: 'Österreich', lat: 47.52, lon: 14.55, re: /\b(österreich|oesterreich|wien|opec)\b/i, market: 'opec' },
  { id: 'ch', name: 'Schweiz', lat: 46.82, lon: 8.23, re: /\b(schweiz|genf|zürich|zuerich)\b/i },
  { id: 'sa', name: 'Saudi-Arabien', lat: 23.89, lon: 45.08, re: /\b(saudi[- ]?arabien|riad|riyadh)\b/i },
  { id: 'ae', name: 'VAE', lat: 23.42, lon: 53.85, re: /\b(vae|emirate|abu\s+dhabi|dubai)\b/i },
  { id: 'qa', name: 'Katar', lat: 25.35, lon: 51.18, re: /\b(katar|qatar|doha)\b/i },
  { id: 'eg', name: 'Ägypten', lat: 26.82, lon: 30.8, re: /\b(ägypten|aegypten|kairo)\b/i },
  { id: 'in', name: 'Indien', lat: 20.59, lon: 78.96, re: /\b(indien|neu[- ]?delhi|new\s+delhi|modi)\b/i },
  { id: 'jp', name: 'Japan', lat: 36.2, lon: 138.25, re: /\b(japan|tokio|tokyo)\b/i },
  { id: 'kr', name: 'Südkorea', lat: 35.91, lon: 127.77, re: /\b(südkorea|suedkorea|seoul)\b/i },
  { id: 'pk', name: 'Pakistan', lat: 30.38, lon: 69.35, re: /\b(pakistan|islamabad)\b/i },
  { id: 'au', name: 'Australien', lat: -25.27, lon: 133.78, re: /\b(australien|canberra|sydney)\b/i },
  { id: 'br', name: 'Brasilien', lat: -14.24, lon: -51.93, re: /\b(brasilien|brasília|brasilia|lula)\b/i },
  { id: 'mx', name: 'Mexiko', lat: 23.63, lon: -102.55, re: /\b(mexiko|mexico)\b/i },
  { id: 'ng', name: 'Nigeria', lat: 9.08, lon: 8.68, re: /\b(nigeria|abuja|lagos)\b/i },
  { id: 'za', name: 'Südafrika', lat: -30.56, lon: 22.94, re: /\b(südafrika|suedafrika|kapstadt|pretoria)\b/i },
  { id: 'by', name: 'Belarus', lat: 53.71, lon: 27.95, re: /\b(belarus|weißrussland|weissrussland|lukaschenko)\b/i },
  { id: 'ge', name: 'Georgien', lat: 42.32, lon: 43.36, re: /\b(georgien|tiflis)\b/i },
]

const BY_ID = new Map(COUNTRIES.map((c) => [c.id, c]))

export function countryById(id: string): CountryFix | null {
  return BY_ID.get(id) || null
}

/** Ein Allowlist-Land oder null. „Europa“ / NATO / Asien sind kein Land. */
export function matchCountry(blob: string): CountryFix | null {
  const t = blob || ''
  if (!t.trim()) return null
  for (const c of COUNTRIES) {
    if (c.re.test(t)) return c
  }
  return null
}

export function isGermanPlace(name: string): boolean {
  return /\b(berlin|hamburg|köln|koeln|münchen|muenchen|stuttgart|frankfurt|heilbronn|ingersheim|deutschland)\b/i.test(
    name,
  )
}

export function marketKindForPlace(name: string): 'hormus' | 'opec' | 'ezb' | null {
  if (/hormus|hormuz/i.test(name)) return 'hormus'
  if (/frankfurt|\bezb\b/i.test(name)) return 'ezb'
  if (/opec/i.test(name)) return 'opec'
  return null
}
