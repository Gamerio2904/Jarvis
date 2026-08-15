import type { WeatherFocus, WeatherWhen } from './weather-parse'

export type WeatherDay = {
  date: string
  min: number
  max: number
  precipProb: number | null
  label: string
}

export type WeatherSnapshot = {
  place: string
  temp: number
  feels: number | null
  label: string
  code: number
  wind: number | null
  precipNow: number | null
  today: WeatherDay | null
  tomorrow: WeatherDay | null
  saturday: WeatherDay | null
  sunday: WeatherDay | null
  rainSoon: boolean
  maxPrecipSoon: number | null
}

const WMO: Record<number, string> = {
  0: 'klar',
  1: 'überwiegend klar',
  2: 'wolkig',
  3: 'bedeckt',
  45: 'Nebel',
  48: 'Nebel',
  51: 'Niesel',
  53: 'Niesel',
  55: 'Niesel',
  61: 'leichter Regen',
  63: 'Regen',
  65: 'starker Regen',
  71: 'leichter Schnee',
  73: 'Schnee',
  75: 'starker Schnee',
  80: 'Schauer',
  81: 'Schauer',
  82: 'starke Schauer',
  95: 'Gewitter',
  96: 'Gewitter',
  99: 'Gewitter',
}

export function wmoLabel(code: number): string {
  return WMO[code] || 'wechselhaft'
}

export function cityName(place: string): string {
  return place.split(',')[0].trim() || 'hier'
}

function at(place: string): string {
  const city = cityName(place)
  if (!city || /^(hier|Standort)$/i.test(city)) return 'Hier'
  return `In ${city}`
}

function deg(n: number): string {
  return `${Math.round(n)} Grad`
}

function wet(code: number, precipNow: number | null, rainSoon: boolean): boolean {
  if (rainSoon) return true
  if (precipNow != null && precipNow > 0.1) return true
  return (code >= 51 && code <= 82) || code >= 95
}

export function clothingTip(opts: {
  feels: number
  wet: boolean
  code: number
  wind: number | null
}): string {
  if ([95, 96, 99].includes(opts.code)) return 'Bei Gewitter lieber drinnen bleiben.'
  const snow = opts.code >= 71 && opts.code <= 77
  if (snow && opts.feels < 4) return 'Winterjacke und festes Schuhwerk.'
  const cloth =
    opts.feels < 0
      ? 'Dicke Jacke, Mütze lohnt sich'
      : opts.feels < 6
        ? 'Warme Jacke'
        : opts.feels < 12
          ? 'Jacke mitnehmen'
          : opts.feels < 18
            ? 'Ein Pulli reicht'
            : opts.feels < 25
              ? 'Leicht anziehen'
              : 'Luftig anziehen'
  if (opts.wet && opts.feels >= 12) return `${cloth}, Schirm nicht vergessen.`
  if (opts.wet) return `${cloth} und Schirm.`
  if (opts.wind != null && opts.wind >= 40) return `${cloth}. Es ist windig.`
  return `${cloth}.`
}

function feelsBit(temp: number, feels: number | null): string {
  if (feels == null || Math.abs(feels - temp) < 2) return ''
  return feels < temp ? `, gefühlt eher ${deg(feels)}` : `, gefühlt ${deg(feels)}`
}

function span(day: WeatherDay): string {
  return `${deg(day.min)} bis ${deg(day.max)}`
}

function rainBit(day: WeatherDay): string {
  if (day.precipProb != null && day.precipProb >= 50) return `, ${day.label}, Regen um ${day.precipProb} Prozent`
  if (day.precipProb != null && day.precipProb >= 30) return `, ${day.label}, etwas Regen möglich`
  return `, ${day.label}`
}

export function formatWeatherBrief(
  snap: WeatherSnapshot,
  when: WeatherWhen,
  focus: WeatherFocus,
): string {
  const feels = snap.feels ?? snap.temp
  const isWet = wet(snap.code, snap.precipNow, snap.rainSoon)
  const tip = clothingTip({ feels, wet: isWet, code: snap.code, wind: snap.wind })

  if (when === 'weekend' && (snap.saturday || snap.sunday)) {
    const bits: string[] = []
    if (snap.saturday) bits.push(`Samstag ${span(snap.saturday)}${rainBit(snap.saturday)}`)
    if (snap.sunday) bits.push(`Sonntag ${span(snap.sunday)}${rainBit(snap.sunday)}`)
    const satWet = snap.saturday ? (snap.saturday.precipProb ?? 0) >= 50 : false
    const sunWet = snap.sunday ? (snap.sunday.precipProb ?? 0) >= 50 : false
    const weekendTip =
      satWet && sunWet
        ? 'Schirm für beide Tage einplanen.'
        : satWet
          ? 'Samstag eher drinnen oder mit Schirm.'
          : sunWet
            ? 'Sonntag Schirm mitnehmen, Samstag eher trocken.'
            : 'Gutes Wochenende zum Rausgehen.'
    return `${at(snap.place)} am Wochenende: ${bits.join(', ')}. ${weekendTip}`
  }

  if ((when === 'tomorrow' || when === 'weekend') && snap.tomorrow) {
    const d = snap.tomorrow
    const dayWet = (d.precipProb ?? 0) >= 40 || /regen|schauer|schnee|gewitter|niesel/i.test(d.label)
    const dayTip = clothingTip({
      feels: Math.round((d.min + d.max) / 2),
      wet: dayWet,
      code: /gewitter/i.test(d.label) ? 95 : dayWet ? 63 : 1,
      wind: null,
    })
    if (focus === 'rain') {
      if (dayWet) return `${at(snap.place)} morgen ${d.label}${d.precipProb != null ? `, etwa ${d.precipProb} Prozent` : ''}. Schirm einplanen.`
      return `${at(snap.place)} morgen eher trocken, ${span(d)}. Schirm können Sie zu Hause lassen.`
    }
    return `${at(snap.place)} morgen ${span(d)}${rainBit(d)}. ${dayTip}`
  }

  const now = `${at(snap.place)} sind es ${deg(snap.temp)}${feelsBit(snap.temp, snap.feels)}, ${snap.label}`
  const today = snap.today ? ` Heute ${span(snap.today)}` : ''

  if (focus === 'rain') {
    if (isWet && snap.precipNow != null && snap.precipNow > 0.1) {
      return `${now}. Es regnet schon — Schirm mitnehmen.`
    }
    if (snap.rainSoon && snap.maxPrecipSoon != null) {
      return `${now}. In den nächsten Stunden Regen um ${snap.maxPrecipSoon} Prozent — Schirm mitnehmen.`
    }
    if (isWet) return `${now}. ${tip}`
    return `${now}. Gerade trocken, Schirm können Sie zu Hause lassen.`
  }

  if (focus === 'wear') {
    return `${now}.${today}. ${tip}`
  }

  if (when === 'today' && snap.today) {
    return `${now}.${today}${rainBit(snap.today)}. ${tip}`
  }

  if (snap.today && snap.today.max - snap.temp >= 4) {
    return `${now}, später bis ${deg(snap.today.max)}. ${tip}`
  }
  return `${now}. ${tip}`
}
