/** Eine Fläche oben. Back und Fertig schließen immer die oberste. Sheets liegen über Drive. */

export type OverlayId = 'settings' | 'voice' | 'drive' | 'calendar' | 'debug'
export type OverlayPhase = 'closed' | 'opening' | 'open' | 'closing'

export type OverlayState = {
  id: OverlayId | null
  phase: OverlayPhase
  stack: OverlayId[]
}

export const OVERLAY_INIT: OverlayState = { id: null, phase: 'closed', stack: [] }

export type OverlayAction =
  | { type: 'open'; id: OverlayId }
  | { type: 'opened' }
  | { type: 'close' }
  | { type: 'closed' }
  | { type: 'force' }
  | { type: 'exclusive'; id: OverlayId }
  | { type: 'ensure'; id: OverlayId }
  | { type: 'drop'; id: OverlayId }

export function reduceOverlay(state: OverlayState, action: OverlayAction): OverlayState {
  switch (action.type) {
    case 'open': {
      const stack = state.stack.filter((x) => x !== action.id)
      stack.push(action.id)
      const same = state.id === action.id && (state.phase === 'open' || state.phase === 'opening')
      return {
        id: action.id,
        phase: same && state.phase === 'open' ? 'open' : 'opening',
        stack,
      }
    }
    case 'opened': {
      if (state.phase !== 'opening' || !state.id) return state
      return { ...state, phase: 'open' }
    }
    case 'close': {
      if (!state.id || state.phase === 'closed') return { ...OVERLAY_INIT }
      if (state.phase === 'closing') return state
      return { ...state, phase: 'closing' }
    }
    case 'closed': {
      const stack = state.stack.slice(0, -1)
      const id = stack[stack.length - 1] || null
      return id ? { id, phase: 'open', stack } : { ...OVERLAY_INIT }
    }
    case 'force':
      return { ...OVERLAY_INIT }
    case 'exclusive': {
      const stack: OverlayId[] = []
      if (action.id !== 'drive' && state.stack.includes('drive')) stack.push('drive')
      stack.push(action.id)
      return { id: action.id, phase: 'open', stack }
    }
    case 'ensure': {
      if (state.stack.includes(action.id)) {
        if (state.phase === 'closed' || !state.id) {
          return { id: action.id, phase: 'open', stack: state.stack }
        }
        return state
      }
      if (action.id === 'drive') {
        const stack: OverlayId[] = ['drive', ...state.stack]
        const keep = state.id && state.phase !== 'closed' && state.phase !== 'closing'
        return { id: keep ? state.id : 'drive', phase: 'open', stack }
      }
      const stack = [...state.stack, action.id]
      return { id: action.id, phase: 'open', stack }
    }
    case 'drop': {
      const stack = state.stack.filter((x) => x !== action.id)
      if (!stack.length) return { ...OVERLAY_INIT }
      if (state.id !== action.id) return { ...state, stack }
      const id = stack[stack.length - 1] || null
      return id ? { id, phase: 'open', stack } : { ...OVERLAY_INIT }
    }
    default:
      return state
  }
}

export function overlayTop(state: OverlayState): OverlayId | null {
  return state.phase === 'closed' || state.phase === 'closing' ? null : state.id
}

export function overlayIsOn(state: OverlayState, id: OverlayId): boolean {
  if (state.phase === 'closed' || state.phase === 'closing') return false
  return state.stack.includes(id)
}

/** Sheets (Settings/Kalender/Stimme/Debug) liegen über Drive; Drive-Modus bleibt. */
export function overlayHidesDrive(state: OverlayState): boolean {
  const top = overlayTop(state)
  return top === 'settings' || top === 'calendar' || top === 'voice' || top === 'debug'
}
