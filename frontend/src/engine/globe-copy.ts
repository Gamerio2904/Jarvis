import { nearestPlace } from './globe-geo.ts'
import { LAYER_TITLE, type GlobeLayer } from './globe-layer-ids.ts'

function joinFacts(parts: string[]): string {
  return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

function samples(names: string[], n = 3): string {
  const clean = names.map((s) => s.trim()).filter(Boolean).slice(0, n)
  return clean.length ? `z. B. ${clean.join(', ')}` : ''
}

export function flightLine(opts: {
  call: string
  country?: string
  altM?: number
  speedMs?: number
  heading?: number
  lat: number
  lon: number
}): string {
  const near = nearestPlace(opts.lat, opts.lon, 80)
  const bits = [near ? `Maschine ${opts.call} über ${near.name}` : `Maschine ${opts.call} im gewählten Ausschnitt`]
  if (opts.country) bits.push(`Registrierung ${opts.country}`)
  if (Number.isFinite(opts.altM) && (opts.altM as number) > 0) {
    bits.push(`Höhe ca. ${Math.round(opts.altM as number)} m`)
  }
  if (Number.isFinite(opts.speedMs) && (opts.speedMs as number) > 0) {
    bits.push(`ca. ${Math.round((opts.speedMs as number) * 3.6)} km/h`)
  }
  if (Number.isFinite(opts.heading)) bits.push(`Kurs ${Math.round(opts.heading as number)}°`)
  bits.push('OpenSky. Keine Passagiere, kein Ziel, kein Live.')
  return bits.map((b) => (b.endsWith('.') ? b : `${b}.`)).join(' ').replace(/\s+/g, ' ').trim()
}

export function fireLine(title: string): string {
  const t = title.trim() || 'ohne Titel'
  return `Offener Waldbrand laut NASA EONET: ${t}. Nur der letzte gemeldete Punkt, keine Fläche, kein Live-Bild.`
}

export function weatherLine(title: string): string {
  const t = title.trim() || 'ohne Titel'
  return `Unwetter laut NASA EONET: ${t}. Offenes Ereignis, kein Live-Radar.`
}

export function quakeLine(mag: number, place: string): string {
  const p = place.trim() || 'Ort unbekannt'
  return `Erdbeben Magnitude ${mag.toFixed(1)} laut USGS, ${p}. Aus den letzten 24 Stunden, kein Live.`
}

export function satLine(name: string, iss = false): string {
  if (iss || /^iss\b/i.test(name)) {
    return 'Internationale Raumstation. Position von Where The ISS At, oft 30 s alt. Kein Live-Video.'
  }
  return `${name.trim()} aus dem CelesTrak-Katalog (Stationen / sichtbare Objekte). Bahn gerechnet, keine Kamera, kein Live.`
}

export function airLine(aqi?: number, pm?: number, where = 'am Standort'): string {
  const bits = [`Luftqualität ${where} laut Open-Meteo.`]
  if (Number.isFinite(aqi)) bits.push(`Europäischer AQI ${Math.round(aqi as number)}.`)
  if (Number.isFinite(pm)) bits.push(`PM2.5 ${Number(pm).toFixed(1)}.`)
  bits.push('Stundenwert, kein Live.')
  return joinFacts(bits)
}

export function shipLine(name: string, kind: string): string {
  return `${name} ist eine feste Lage aus der Tabelle (${kind}), kein AIS, keine Schiffe live.`
}

export function infraLine(name: string, kind: string): string {
  return `${name}: öffentlich bekannte Anlage (${kind}). Koordinate aus der Tabelle, kein Betriebsstatus.`
}

export function gdeltLine(name: string, kind: 'conflict' | 'event'): string {
  const what = kind === 'conflict' ? 'Konflikt-Treffer' : 'Ereignis-Treffer'
  return `${what} bei GDELT: ${name}. Punkt aus Nachrichten, kein Live-Lagebild.`
}

export function cyberLine(ip: string): string {
  return `Feodo-Blocklist (abuse.ch): ${ip}. Gemeldete Adresse, kein beobachteter Angriff, kein Live.`
}

export function exampleNames(names: string[], n = 3): string {
  return samples(names, n)
}

export function intelForLayer(
  layer: GlobeLayer,
  n: number,
  source: string,
  age: string,
  examples: string,
  extra = '',
): string {
  const tail = `${age}. Kein Live.${extra}`
  const ex = examples ? ` (${examples})` : ''
  if (layer === 'overhead') {
    return n
      ? `OpenSky: ${n} Flugzeuge im Ausschnitt${ex}. ${tail}`
      : `OpenSky sieht im Ausschnitt kein Flugzeug in der Luft. ${tail}`
  }
  if (layer === 'fires') {
    return n
      ? `NASA EONET: ${n} offene Waldbrände${ex}. ${tail}`
      : `NASA EONET nennt gerade keinen offenen Waldbrand. ${tail}`
  }
  if (layer === 'quakes') {
    return n
      ? `USGS: ${n} Beben ab Magnitude 4,5 in 24 Stunden${ex}. ${tail}`
      : `USGS sieht in 24 Stunden kein Beben ab Magnitude 4,5. ${tail}`
  }
  if (layer === 'weather') {
    return n
      ? `NASA EONET: ${n} offene Unwetter${ex}. ${tail}`
      : `NASA EONET nennt gerade kein offenes Unwetter. ${tail}`
  }
  if (layer === 'sats') {
    return n
      ? `Satelliten: ${n} Positionen (${source})${ex}. Bahn gerechnet. ${tail}`
      : `${source} liefert keine Satellitenposition. ${tail}`
  }
  if (layer === 'air') {
    return n ? `${namesOr(examples, source)} ${tail}` : `Open-Meteo ohne Luftwert. ${tail}`
  }
  if (layer === 'ships') {
    return `See: ${n} feste Engstellen/Häfen aus der Tabelle, kein AIS. ${tail}`
  }
  if (layer === 'infra') {
    return `Anlagen: ${n} öffentliche Koordinaten aus der Tabelle, kein Betriebsstatus. ${tail}`
  }
  if (layer === 'conflicts') {
    return n ? `GDELT: ${n} Konflikt-Punkte${ex}. ${tail}` : `GDELT nennt gerade keinen Konflikt-Punkt. ${tail}`
  }
  if (layer === 'events') {
    return n ? `GDELT: ${n} Ereignis-Punkte${ex}. ${tail}` : `GDELT nennt gerade kein Ereignis. ${tail}`
  }
  if (layer === 'cyber') {
    return n
      ? `abuse.ch Feodo: ${n} Blocklist-IPs${ex}. Kein beobachteter Angriff. ${tail}`
      : `Feodo ohne Lage. ${tail}`
  }
  return n
    ? `${LAYER_TITLE[layer]}: ${n} von ${source}${ex}. ${tail}`
    : `${source} liefert nichts für ${LAYER_TITLE[layer]}. ${tail}`
}

function namesOr(examples: string, source: string): string {
  return examples ? `${source}: ${examples}.` : `${source}.`
}
