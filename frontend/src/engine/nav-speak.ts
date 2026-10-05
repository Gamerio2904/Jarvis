function haversineM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

export type NavDir =
  | 'left'
  | 'right'
  | 'slight_left'
  | 'slight_right'
  | 'sharp_left'
  | 'sharp_right'
  | 'uturn'
  | 'straight'
  | 'roundabout'
  | 'arrive'

export type NavPhase = 'km' | 'mid' | 'near' | 'now'

export type NavStep = {
  lat: number
  lon: number
  type: string
  modifier: string
  name: string
}

export function dirFromManeuver(type: string, modifier: string): NavDir {
  const t = (type || '').toLowerCase()
  const m = (modifier || '').toLowerCase()
  if (t === 'arrive' || t === 'notification') return 'arrive'
  if (t.includes('roundabout')) return 'roundabout'
  if (m.includes('uturn') || m.includes('u-turn')) return 'uturn'
  if (m.includes('sharp') && m.includes('left')) return 'sharp_left'
  if (m.includes('sharp') && m.includes('right')) return 'sharp_right'
  if (m.includes('slight') && m.includes('left')) return 'slight_left'
  if (m.includes('slight') && m.includes('right')) return 'slight_right'
  if (m.includes('left')) return 'left'
  if (m.includes('right')) return 'right'
  if (m.includes('straight') || t === 'new name' || t === 'continue' || t === 'merge') return 'straight'
  return 'straight'
}

export function dirArrow(dir: NavDir): string {
  if (dir === 'arrive') return '●'
  if (dir === 'uturn') return '↩'
  if (dir === 'roundabout') return '↻'
  if (dir === 'straight') return '↑'
  if (dir.includes('left')) return '←'
  if (dir.includes('right')) return '→'
  return '↑'
}

function dirShort(dir: NavDir): string {
  if (dir === 'slight_left' || dir === 'left') return 'links'
  if (dir === 'slight_right' || dir === 'right') return 'rechts'
  if (dir === 'sharp_left') return 'scharf links'
  if (dir === 'sharp_right') return 'scharf rechts'
  if (dir === 'uturn') return 'wenden'
  if (dir === 'straight') return 'geradeaus'
  if (dir === 'roundabout') return 'in den Kreisverkehr'
  if (dir === 'arrive') return 'am Ziel'
  return 'weiter'
}

function dirVorne(dir: NavDir): string {
  if (dir === 'slight_left' || dir === 'left') return 'vorne links'
  if (dir === 'slight_right' || dir === 'right') return 'vorne rechts'
  return dirShort(dir)
}

export function roundNavMeters(meters: number): number {
  if (meters >= 1000) return Math.round(meters / 100) * 100
  if (meters >= 80) return Math.max(50, Math.round(meters / 50) * 50)
  return Math.max(0, Math.round(meters / 10) * 10)
}

export function navPhase(meters: number): NavPhase | null {
  if (meters <= 38) return 'now'
  if (meters >= 70 && meters <= 150) return 'near'
  if (meters >= 220 && meters <= 420) return 'mid'
  if (meters >= 650 && meters <= 1400) return 'km'
  return null
}

export function formatNavCue(dir: NavDir, meters: number, phase: NavPhase): string {
  if (dir === 'arrive') {
    return phase === 'now' ? 'Ziel erreicht.' : 'Sie erreichen gleich das Ziel.'
  }
  if (phase === 'now') {
    if (dir === 'uturn') return 'Jetzt wenden.'
    if (dir === 'straight') return 'Jetzt geradeaus weiter.'
    if (dir === 'roundabout') return 'Jetzt in den Kreisverkehr.'
    return `Jetzt ${dirShort(dir)} abbiegen.`
  }
  if (phase === 'km') {
    return `In einem Kilometer ${dirVorne(dir)} abbiegen.`
  }
  if (phase === 'mid') {
    const m = roundNavMeters(meters) || 300
    return `${dirVorne(dir).replace(/^v/, 'V')} in ${m} Metern abbiegen.`
  }
  const m = roundNavMeters(meters) || 100
  if (dir === 'uturn') return `In ${m} Metern wenden.`
  if (dir === 'straight') return `In ${m} Metern geradeaus weiter.`
  if (dir === 'roundabout') return `In ${m} Metern in den Kreisverkehr.`
  return `In ${m} Metern ${dirShort(dir)} abbiegen.`
}

export function formatNavBanner(dir: NavDir, meters: number, name?: string): { arrow: string; line: string; sub: string } {
  const arrow = dirArrow(dir)
  if (dir === 'arrive') return { arrow, line: 'Ziel', sub: name || '' }
  const m = meters >= 1000 ? `${(meters / 1000).toFixed(1).replace('.', ',')} km` : `${roundNavMeters(meters)} m`
  const turn =
    dir === 'uturn'
      ? 'Wenden'
      : dir === 'straight'
        ? 'Geradeaus'
        : dir === 'roundabout'
          ? 'Kreisverkehr'
          : `${dirShort(dir).replace(/^./, (c) => c.toUpperCase())} abbiegen`
  return { arrow, line: m, sub: name ? `${turn} · ${name}` : turn }
}

function closestCoordIndex(coords: Array<[number, number]>, lat: number, lon: number): { i: number; dist: number } {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < coords.length; i += 1) {
    const d = haversineM({ lat, lon }, { lat: coords[i][1], lon: coords[i][0] })
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return { i: best, dist: bestD }
}

function alongMeters(
  coords: Array<[number, number]>,
  fromI: number,
  toLat: number,
  toLon: number,
): number {
  if (!coords.length) return haversineM({ lat: toLat, lon: toLon }, { lat: toLat, lon: toLon })
  let targetI = fromI
  let best = Infinity
  for (let i = fromI; i < coords.length; i += 1) {
    const d = haversineM({ lat: toLat, lon: toLon }, { lat: coords[i][1], lon: coords[i][0] })
    if (d < best) {
      best = d
      targetI = i
    }
  }
  let sum = 0
  for (let i = fromI; i < targetI; i += 1) {
    const a = coords[i]
    const b = coords[i + 1]
    if (!b) break
    sum += haversineM({ lat: a[1], lon: a[0] }, { lat: b[1], lon: b[0] })
  }
  return sum
}

export type NextManeuver = {
  index: number
  dir: NavDir
  meters: number
  name: string
  offRoute: boolean
}

const OFF_ROUTE_M = 90

export function nextManeuver(
  steps: NavStep[],
  coords: Array<[number, number]>,
  pos: { lat: number; lon: number },
): NextManeuver | null {
  if (!steps.length) return null
  const here = closestCoordIndex(coords, pos.lat, pos.lon)
  const offRoute = coords.length > 1 && here.dist > OFF_ROUTE_M
  let pick = -1
  let pickMeters = Infinity
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]
    const dir = dirFromManeuver(step.type, step.modifier)
    if (dir === 'straight' && (step.type === 'depart' || step.type === 'new name')) continue
    const along = coords.length > 1 ? alongMeters(coords, here.i, step.lat, step.lon) : haversineM(
      { lat: pos.lat, lon: pos.lon },
      { lat: step.lat, lon: step.lon },
    )
    if (along < 12) continue
    if (along < pickMeters) {
      pickMeters = along
      pick = i
    }
  }
  if (pick < 0) {
    const last = steps[steps.length - 1]
    if (!last) return null
    return {
      index: steps.length - 1,
      dir: 'arrive',
      meters: Math.max(0, Math.round(pickMeters === Infinity ? here.dist : pickMeters)),
      name: last.name || '',
      offRoute,
    }
  }
  const step = steps[pick]
  return {
    index: pick,
    dir: dirFromManeuver(step.type, step.modifier),
    meters: Math.max(0, Math.round(pickMeters)),
    name: step.name || '',
    offRoute,
  }
}
