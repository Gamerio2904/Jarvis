export const GLOBE_LAYER_IDS = [
  'quakes',
  'fires',
  'overhead',
  'weather',
  'air',
  'radar',
  'sats',
  'ships',
  'infra',
  'conflicts',
  'events',
  'cyber',
] as const

export type GlobeLayer = (typeof GLOBE_LAYER_IDS)[number]

export const LAYER_TITLE: Record<GlobeLayer, string> = {
  quakes: 'Erdbeben',
  fires: 'Waldbrände',
  overhead: 'Flugzeuge',
  weather: 'Unwetter',
  air: 'Luft',
  radar: 'GPS-Störung',
  sats: 'Satelliten',
  ships: 'See',
  infra: 'Anlagen',
  conflicts: 'Konflikte',
  events: 'Ereignisse',
  cyber: 'Cyber',
}

export const LAYER_CHIP_OFF: Record<GlobeLayer, string> = {
  quakes: 'Beben aus',
  fires: 'Waldbrände aus',
  overhead: 'Flugzeuge aus',
  weather: 'Unwetter aus',
  air: 'Luft aus',
  radar: 'Radar aus',
  sats: 'Satelliten aus',
  ships: 'See aus',
  infra: 'Anlagen aus',
  conflicts: 'Konflikte aus',
  events: 'Ereignisse aus',
  cyber: 'Cyber aus',
}

export function isGlobeLayer(value: string): value is GlobeLayer {
  return (GLOBE_LAYER_IDS as readonly string[]).includes(value)
}

export function chipOffLabel(layer: string): string {
  return isGlobeLayer(layer) ? LAYER_CHIP_OFF[layer] : 'Schicht aus'
}
