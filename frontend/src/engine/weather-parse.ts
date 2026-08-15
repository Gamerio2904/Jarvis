export type WeatherWhen = 'now' | 'today' | 'tomorrow' | 'weekend'
export type WeatherFocus = 'general' | 'rain' | 'wear'

export type WeatherIntent =
  | { kind: 'here'; when: WeatherWhen; focus: WeatherFocus }
  | { kind: 'place'; place: string; when: WeatherWhen; focus: WeatherFocus }

const WEATHER =
  /\b(wetter|temperatur|wie\s+warm|wie\s+kalt|regnet\s+es|schneit\s+es|wie\s+ist\s+das\s+wetter|wird\s+es\s+regnen|schirm|anziehen|was\s+tragen)\b/i
const PLACE = /(?:in|für|aus|bei)\s+([A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß.\-\s]{1,40})/i
const TRAIL = /(?:\s+(heute|jetzt|hier|draußen|morgen|übermorgen|wochenende|samstag|sonntag))+$/i

export function parseWeatherIntent(text: string): WeatherIntent | null {
  const t = text.trim()
  if (!t || t.length > 160) return null
  if (!WEATHER.test(t) && !/\b(was\s+(soll|ziehe)\s+ich\s+an|jacke\s+mitnehmen)\b/i.test(t)) {
    return null
  }
  const when = parseWhen(t)
  const focus = parseFocus(t)
  const place = PLACE.exec(t)
  if (place) {
    const name = place[1].replace(/[?.!]+$/, '').replace(TRAIL, '').trim()
    if (name && !/^(hier|heute|jetzt|draußen|morgen|übermorgen|wochenende)$/i.test(name)) {
      return { kind: 'place', place: name, when, focus }
    }
  }
  return { kind: 'here', when, focus }
}

function parseWhen(text: string): WeatherWhen {
  if (/\b(wochenende|samstag|sonntag)\b/i.test(text)) return 'weekend'
  if (/\b(morgen|übermorgen)\b/i.test(text)) return 'tomorrow'
  if (/\bheute\b/i.test(text)) return 'today'
  return 'now'
}

function parseFocus(text: string): WeatherFocus {
  if (/\b(anzug|anziehen|tragen|jacke|pulli|kleidung)\b/i.test(text)) return 'wear'
  if (/\b(regen|regnet|schneit|schirm|trocken)\b/i.test(text)) return 'rain'
  return 'general'
}
