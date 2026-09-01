/** Navi: IDLE → CALCULATING → ACTIVE_ROUTE → REPLACING_ROUTE → VERIFYING → ACTIVE_ROUTE. */

export type NaviPhase = 'idle' | 'calculating' | 'active_route' | 'replacing_route' | 'verifying'

export type NaviState = {
  phase: NaviPhase
  dest: string
  destLat: number
  destLon: number
  minutes: number
  meters: number
  rideOk: boolean
}

export const NAVI_INIT: NaviState = {
  phase: 'idle',
  dest: '',
  destLat: 0,
  destLon: 0,
  minutes: 0,
  meters: 0,
  rideOk: false,
}

export type NaviEvent =
  | { type: 'calculate'; dest: string }
  | { type: 'replace'; dest: string }
  | { type: 'verified'; dest: string; destLat: number; destLon: number; minutes: number; meters: number }
  | { type: 'failed' }
  | { type: 'clear' }

export function foldDest(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[.,!?]+$/g, '')
    .replace(/\s+/g, ' ')
}

export function destMatches(requested: string, observed: string): boolean {
  const a = foldDest(requested)
  const b = foldDest(observed)
  if (!a || !b) return false
  if (a === b) return true
  if (a.length >= 4 && b.includes(a)) return true
  if (b.length >= 4 && a.includes(b)) return true
  return false
}

export type NaviObservation = {
  requested: string
  dest: string
  prevDest?: string
  replace?: boolean
  geocoded?: boolean
  hereOk?: boolean
  rideOk?: boolean
  minutes?: number
  meters?: number
  coords?: number
}

export function naviRouteVerified(obs: NaviObservation): { ok: boolean; error?: string } {
  if (obs.geocoded === false) return { ok: false, error: 'Ort fehlt.' }
  if (!destMatches(obs.requested, obs.dest)) {
    return { ok: false, error: 'Ziel auf der Karte ist nicht die Anfrage.' }
  }
  if (obs.replace && obs.prevDest && destMatches(obs.prevDest, obs.dest)) {
    return { ok: false, error: 'Ziel ist unverändert.' }
  }
  if (!obs.hereOk) return { ok: false, error: 'Kein GPS.' }
  if (!obs.rideOk) return { ok: false, error: 'Strecke fehlt.' }
  const minutes = Number(obs.minutes) || 0
  const meters = Number(obs.meters) || 0
  const coords = Number(obs.coords) || 0
  if (minutes <= 0 || (meters <= 0 && coords <= 0)) {
    return { ok: false, error: 'Strecke fehlt.' }
  }
  return { ok: true }
}

export function reduceNavi(state: NaviState, event: NaviEvent): NaviState {
  switch (event.type) {
    case 'clear':
      return { ...NAVI_INIT }
    case 'calculate':
      return { ...NAVI_INIT, phase: 'calculating', dest: event.dest }
    case 'replace': {
      if (state.phase === 'idle') return { ...NAVI_INIT, phase: 'calculating', dest: event.dest }
      return { ...state, phase: 'replacing_route', dest: event.dest, rideOk: false }
    }
    case 'verified':
      return {
        phase: 'active_route',
        dest: event.dest,
        destLat: event.destLat,
        destLon: event.destLon,
        minutes: event.minutes,
        meters: event.meters,
        rideOk: true,
      }
    case 'failed': {
      if (state.phase === 'replacing_route' && state.rideOk) {
        return { ...state, phase: 'active_route' }
      }
      if (state.phase === 'calculating' || state.phase === 'replacing_route' || state.phase === 'verifying') {
        return { ...state, phase: state.phase === 'replacing_route' ? 'replacing_route' : 'idle', rideOk: false }
      }
      return { ...state, rideOk: false }
    }
    default:
      return state
  }
}

export function naviIsReplacing(state: NaviState): boolean {
  return state.phase === 'replacing_route' || state.phase === 'verifying'
}
