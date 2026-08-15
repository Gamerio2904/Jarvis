export type WeatherIntent =
  | { kind: 'here' }
  | { kind: 'place'; place: string }

const WEATHER =
  /\b(wetter|temperatur|wie\s+warm|wie\s+kalt|regnet\s+es|schneit\s+es|wie\s+ist\s+das\s+wetter)\b/i
const PLACE = /(?:in|für|aus|bei)\s+([A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß.\-\s]{1,40})$/i

export function parseWeatherIntent(text: string): WeatherIntent | null {
  const t = text.trim()
  if (!t || t.length > 160) return null
  if (!WEATHER.test(t)) return null
  const place = PLACE.exec(t)
  if (place) {
    const name = place[1].replace(/[?.!]+$/, '').trim()
    if (name && !/^(hier|heute|jetzt|draußen)$/i.test(name)) {
      return { kind: 'place', place: name }
    }
  }
  return { kind: 'here' }
}
