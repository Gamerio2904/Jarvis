export type WeatherWhen = 'now' | 'today' | 'tomorrow' | 'weekend'
export type WeatherFocus = 'general' | 'rain' | 'wear' | 'air' | 'sun'

export type WeatherIntent =
  | { kind: 'here'; when: WeatherWhen; focus: WeatherFocus }
  | { kind: 'place'; place: string; when: WeatherWhen; focus: WeatherFocus }

const WEATHER =
  /\b(wetter|temperatur|wie\s+warm|wie\s+kalt|regnet\s+es|schneit\s+es|wie\s+ist\s+das\s+wetter|wird\s+es\s+regnen|schirm|anziehen|was\s+tragen)\b/i
const AIR =
  /\b(luftqualität|luftqualitaet|feinstaub|pollen(?:flug|werte)?|luftverschmutzung|aqi|wie\s+ist\s+die\s+luft|luft\s+hier)\b/i
const SUN =
  /\b(sonnenaufgang|sonnenuntergang|wann\s+geht\s+die\s+sonne|sonne\s+(?:auf|unter)(?:geht)?)\b/i
const PLACE = /\b(?:in|für|aus|bei)\s+(?:der\s+|dem\s+|den\s+)?([A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß.\-]{1,32})\b/i
const TRAVEL_CITY = /\bnach\s+([A-ZÄÖÜ][\wÄÖÜäöüß.\-]{2,32})\b/
const NOT_PLACE =
  /^(hier|heute|jetzt|draußen|morgen|übermorgen|wochenende|hotel|unterkunft|innenstadt|nächte|nacht|der|die|das|einem|einer|einem|zwei)$/i
const TRAIL = /(?:\s+(heute|jetzt|hier|draußen|morgen|übermorgen|wochenende|samstag|sonntag))+$/i

export type WeatherLast = {
  kind: 'here' | 'place'
  place?: string
  when: WeatherWhen
  focus: WeatherFocus
}

const SOCIAL =
  /\b(wie\s+geht(?:'s|s|es)?|guten\s+(?:morgen|abend|tag|nacht)|hallo|hi\b|hey\b|was\s+machst|na\s+du)\b/i

export function parseWeatherFollowup(text: string, last: WeatherLast | null): WeatherIntent | null {
  if (!last) return null
  const t = text.trim().replace(/[?.!]+$/, '')
  if (!t || t.length > 80) return null
  if (SOCIAL.test(t)) return null
  const rest = t.replace(/^und\s+/i, '').trim()
  const timeOnly =
    /^(heute|morgen|übermorgen|wochenende|jetzt)(\s+(früh|abend|nacht|mittag|nacht))?\s*$/i.test(rest)
  const weatherish =
    timeOnly ||
    /\b(morgen|übermorgen|wochenende|schirm|anziehen|luft|pollen|sonnenaufgang|sonnenuntergang|regen|jacke|pulli|feinstaub|aqi)\b/i.test(
      rest,
    ) ||
    /^(in|für|aus|bei)\s+\S/i.test(rest)
  if (!weatherish) return null
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

  const placeHit = /\b(?:in|für|aus|bei)\s+(?:der\s+|dem\s+|den\s+)?([A-ZÄÖÜa-zäöüß][\wÄÖÜäöüß.\-]{1,32})\b/i.exec(rest)
  if (placeHit) {
    const name = placeHit[1].replace(/[?.!]+$/, '').trim()
    if (name && !NOT_PLACE.test(name)) {
      return { kind: 'place', place: name, when, focus }
    }
  }
  if (last.kind === 'place' && last.place) return { kind: 'place', place: last.place, when, focus }
  return { kind: 'here', when, focus }
}

export function parseWeatherIntent(text: string): WeatherIntent | null {
  const t = text.trim()
  if (!t || t.length > 160) return null
  if (SOCIAL.test(t)) return null
  if (/\b(wetterstatistik|lage[- ]?kachel|\bkacheln?\b)\b/i.test(t)) return null
  if (
    /\b(?:hotel|unterkunft|nächt(?:e|igen)|flugticket|bahnticket)\b/i.test(t) &&
    /\b(?:kostet|preis|teuer|buchen|brauche)\b/i.test(t)
  ) {
    return null
  }
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
  const named = cleanPlace(PLACE.exec(t)?.[1]) || cleanPlace(TRAVEL_CITY.exec(t)?.[1])
  if (named) return { kind: 'place', place: named, when, focus }
  return { kind: 'here', when, focus }
}

function cleanPlace(raw?: string): string | null {
  const name = (raw || '').replace(/[?.!]+$/, '').replace(TRAIL, '').trim()
  if (!name || NOT_PLACE.test(name)) return null
  return name
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
