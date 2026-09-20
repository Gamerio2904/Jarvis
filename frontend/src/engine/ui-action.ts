import type { OverlayId } from './overlay-fsm.ts'

/** Flächen, die Jarvis selbst steuert. `lage.view` bleibt `hud`. */
export const UI_ACTION_IDS = [
  'overlay.open',
  'overlay.close',
  'settings.tab',
  'settings.set',
  'dock.go',
] as const

export type UiActionId = (typeof UI_ACTION_IDS)[number]

export const UI_OVERLAY_IDS = ['settings', 'voice', 'calendar', 'debug', 'watchlist'] as const
export type UiOverlayId = (typeof UI_OVERLAY_IDS)[number]

export const UI_DOCK_IDS = ['chat', 'lage', 'voice', 'calendar', 'watchlist', 'settings'] as const
export type UiDockId = (typeof UI_DOCK_IDS)[number]

export type JarvisFlag =
  | 'tv_enabled'
  | 'research_opt_in'
  | 'tool_propose'
  | 'hud_accent'
  | 'drive_speak'
  | 'globe_webgl'
  | 'gemini_enabled'

export const JARVIS_FLAG_TITLES: Record<JarvisFlag, string> = {
  tv_enabled: 'Fernseher',
  research_opt_in: 'Research',
  tool_propose: 'Werkzeug-Vorschlag',
  hud_accent: 'Lage-Akzent',
  drive_speak: 'Fahrt-Stimme',
  globe_webgl: 'Kugel-Lite',
  gemini_enabled: 'Gemini',
}

const TITLE_TO_FLAG: Record<string, JarvisFlag> = {
  research: 'research_opt_in',
  forschung: 'research_opt_in',
  gemini: 'gemini_enabled',
  'werkzeug-vorschlag': 'tool_propose',
  werkzeugvorschlag: 'tool_propose',
  vorschlag: 'tool_propose',
  'kugel-lite': 'globe_webgl',
  kugellite: 'globe_webgl',
  'tv-schalter': 'tv_enabled',
  tvschalter: 'tv_enabled',
}

export function flagFromTitle(raw: string | null): JarvisFlag | null {
  if (!raw) return null
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[.]/g, '')
  return TITLE_TO_FLAG[key] || null
}

export function flagUtterance(flag: JarvisFlag, on: boolean): string {
  return `${JARVIS_FLAG_TITLES[flag]} ${on ? 'an' : 'aus'}`
}

export function isUiOverlay(id: string): id is UiOverlayId {
  return (UI_OVERLAY_IDS as readonly string[]).includes(id)
}

export function isUiDock(id: string): id is UiDockId {
  return (UI_DOCK_IDS as readonly string[]).includes(id)
}

export function overlayFromUi(id: UiOverlayId): OverlayId {
  return id
}
