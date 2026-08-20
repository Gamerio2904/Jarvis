export type WeatherWhen = 'now' | 'today' | 'tomorrow' | 'weekend'
export type WeatherFocus = 'general' | 'rain' | 'wear' | 'air' | 'sun'

export type WeatherIntent =
  | { kind: 'here'; when: WeatherWhen; focus: WeatherFocus }
  | { kind: 'place'; place: string; when: WeatherWhen; focus: WeatherFocus }
  | { kind: 'ask'; when: WeatherWhen; focus: WeatherFocus }

const WEATHER =
  /\b(wetter|temperatur|wie\s+warm|wie\s+kalt|regnet\s+es|schneit\s+es|wie\s+ist\s+das\s+wetter|wird\s+es\s+regnen|schirm|anziehen|was\s+tragen)\b/i
const AIR =
  /\b(luftqualität|luftqualitaet|feinstaub|pollen(?:flug|werte)?|luftverschmutzung|aqi|wie\s+ist\s+die\s+luft|luft\s+hier)\b/i
const SUN =
  /\b(sonnenaufgang|sonnenuntergang|wann\s+geht\s+die\s+sonne|sonne\s+(?:auf|unter)(?:geht)?)\b/i
const PLACE = /(?:in|für|aus|bei)\s+([A-ZÄÖÜ][\wÄÖÜäöüß.-]{1,40}(?:\s+[A-ZÄÖÜ][\wÄÖÜäöüß.-]{1,40}){0,2})/i
const PLACE_JUNK =
  /\s+(heute|jetzt|hier|draußen|morgen|übermorgen|wochenende|samstag|sonntag|schirm|anziehen|tragen|jacke|brauch(?:e)?|ich|einen?|das|wetter|temperatur|regen|regnet).*$/i

export type WeatherLast = {
  kind: 'here' | 'place'
  place?: string
  when: WeatherWhen
  focus: WeatherFocus
}

export function parseWeatherFollowup(text: string, last: WeatherLast | null): WeatherIntent | null {
  if (!last) return null
  const t = text.trim().replace(/[?.!]+$/, '')
  if (!t || t.length > 80) return null
  const rest = t.replace(/^und\s+/i, '').trim()
  const weatherish =
    /\b(morgen|übermorgen|heute|wochenende|schirm|anziehen|luft|pollen|sonnenaufgang|sonnenuntergang|regen|jacke|pulli|feinstaub|aqi)\b/i.test(
      rest,
    ) || (/^(in|für|aus|bei)\s+[A-Za-zÄÖÜäöüß]/i.test(rest) && !/\bin\s+\d+/i.test(rest))
  if (!weatherish) return null
  if (/\b(wetter|temperatur)\b/i.test(t)) return null
  if (/\bin\s+\d+\s*(?:minuten?|stunden?|tage(?:n)?)?\b/i.test(t)) return null
  if (!rest) return last.kind === 'place' && last.place
    ? { kind: 'place', place: last.place, when: last.when, focus: last.focus }
    : { kind: 'here', when: last.when, focus: last.focus }

  let when = last.when
  let focus = last.focus
  if (/\b(wochenende|samstag|sonntag)\b/i.test(rest)) when = 'weekend'
  else if (/\b(morgen|übermorgen)\b/i.test(rest)) when = 'tomorrow'
  else if (/\bheute\b/i.test(rest)) when = 'today'
  if (/\b(luft|pollen|feinstaub|aqi)\b/i.test(rest)) focus = 'air'
  else if (/\b(sonnenaufgang|sonnenuntergang|sonne)\b/i.test(rest)) focus = 'sun'
  else if (/\b(anzug|anziehen|tragen|jacke|pulli)\b/i.test(rest)) focus = 'wear'
  else if (/\b(regen|regnet|schneit|schirm|trocken)\b/i.test(rest)) focus = 'rain'

  const placeHit = /(?:in|für|aus|bei)\s+([A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß.\-\s]{1,40})$/i.exec(rest)
  if (placeHit) {
    const name = cleanPlace(placeHit[1])
    if (name) return { kind: 'place', place: name, when, focus }
  }
  if (last.kind === 'place' && last.place) return { kind: 'place', place: last.place, when, focus }
  return { kind: 'here', when, focus }
}

export function parseWeatherIntent(text: string): WeatherIntent | null {
  const t = text.trim()
  if (!t || t.length > 160) return null
  const air = AIR.test(t)
  const sun = SUN.test(t)
  if (
    !air &&
    !sun &&
    !WEATHER.test(t) &&
    !/\b(was\s+(soll|ziehe)\s+ich\s+an|jacke\s+mitnehmen)\b/i.test(t)
  ) {
    return null
  }
  const when = parseWhen(t)
  const focus = air ? 'air' : sun ? 'sun' : parseFocus(t)
  const place = extractPlace(t)
  if (place) return { kind: 'place', place, when, focus }
  const hereWord = /\bhier\b/i.test(t)
  if ((focus === 'wear' || (focus === 'air' && !hereWord)) && !/\b(wetter|temperatur|regnet|schneit)\b/i.test(t)) {
    return { kind: 'ask', when, focus }
  }
  return { kind: 'here', when, focus }
}

function extractPlace(text: string): string | null {
  const place = PLACE.exec(text)
  if (!place) return null
  return cleanPlace(place[1].replace(/[?.!]+$/, '').replace(PLACE_JUNK, ''))
}

function cleanPlace(raw: string): string | null {
  const name = raw
    .replace(/[?.!]+$/g, '')
    .replace(
      /\b(heute|jetzt|hier|draußen|morgen|übermorgen|wochenende|samstag|sonntag|schirm|anziehen|tragen|jacke|brauch(?:e)?|ich|einen?|eine|das|wetter|temperatur|regen|regnet)\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
  if (!name || /^(hier|heute|jetzt|draußen|morgen|übermorgen|wochenende)$/i.test(name)) return null
  const bits = name.split(/\s+/).filter(Boolean).slice(0, 3)
  const token = bits.join(' ')
  if (!token || token.length < 2 || token.length > 48) return null
  return token
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
