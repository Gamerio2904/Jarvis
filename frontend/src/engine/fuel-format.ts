import type { FuelPrefer } from './fuel-parse.ts'

export type FuelStation = {
  id: string
  name: string
  brand: string
  street: string
  place: string
  lat: number
  lng: number
  distKm: number
  priceE10: number | null
  isOpen: boolean | null
}

export type FuelPair = {
  nearest: FuelStation
  cheapest: FuelStation
  cheapestOpen: FuelStation | null
  priced: boolean
}

export function pickFuelPair(stations: FuelStation[]): FuelPair | null {
  const usable = stations.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
  if (!usable.length) return null
  const nearest = [...usable].sort((a, b) => a.distKm - b.distKm)[0]
  const priced = usable.filter((s) => s.priceE10 != null) as Array<FuelStation & { priceE10: number }>
  const cheapest = priced.length
    ? [...priced].sort((a, b) => a.priceE10 - b.priceE10 || a.distKm - b.distKm)[0]
    : nearest
  const openPriced = priced.filter((s) => s.isOpen === true)
  const cheapestOpen = openPriced.length
    ? [...openPriced].sort((a, b) => a.priceE10 - b.priceE10 || a.distKm - b.distKm)[0]
    : null
  return { nearest, cheapest, cheapestOpen, priced: priced.length > 0 }
}

export function formatE10Price(n: number): string {
  return `${n.toFixed(3).replace('.', ',')} €`
}

export function formatFuelDist(km: number): string {
  if (!Number.isFinite(km) || km < 0) return ''
  if (km < 0.95) return `${Math.max(1, Math.round(km * 1000))} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

export function stationLabel(s: FuelStation): string {
  const brand = (s.brand || '').trim()
  const name = (s.name || '').trim()
  const place = (s.place || '').trim()
  let label =
    brand && name && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name || brand || 'Tankstelle'
  if (place && !label.toLowerCase().includes(place.toLowerCase())) label = `${label}, ${place}`
  return label.replace(/\s+/g, ' ').trim()
}

export function formatFuelSpeech(pair: FuelPair, prefer: FuelPrefer, minutes = 0, noPriceHint = ''): string {
  const same = pair.nearest.id === pair.cheapest.id
  const nextLine = lineFor(pair.nearest)
  const cheapLine = lineFor(pair.cheapest)
  const mins = minutes > 0 ? ` Etwa ${minutes} Min.` : ''
  const other =
    prefer === 'cheapest' ? 'Für die nächste: „nächste“.' : 'Für die günstigste: „günstigste“.'
  const closed =
    pair.cheapest.isOpen === false &&
    pair.cheapestOpen &&
    pair.cheapestOpen.id !== pair.cheapest.id
      ? ` Günstigste offene: ${lineFor(pair.cheapestOpen)}.`
      : ''
  const priceNote = pair.priced ? '' : noPriceHint ? ` ${noPriceHint}` : ''
  if (same) {
    return `E10. Nächste und günstigste: ${nextLine}.${priceNote} Route dorthin.${mins}`.replace(/\s+/g, ' ').trim()
  }
  const heading = prefer === 'cheapest' ? 'Route zur günstigsten.' : 'Route zur nächsten.'
  return `E10. Nächste: ${nextLine}. Günstigste: ${cheapLine}.${closed}${priceNote} ${heading}${mins} ${other}`
    .replace(/\s+/g, ' ')
    .trim()
}

function lineFor(s: FuelStation): string {
  const bits = [stationLabel(s), formatFuelDist(s.distKm)].filter(Boolean)
  if (s.priceE10 != null) bits.push(formatE10Price(s.priceE10))
  if (s.isOpen === false) bits.push('geschlossen')
  return bits.join(', ')
}
