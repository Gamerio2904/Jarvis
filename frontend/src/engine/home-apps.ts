/** Zweiter Homescreen: App-Kacheln. Kein Android-Launcher, keine fremden Apps. */

export const HOME_APP_IDS = [
  'chat',
  'voice',
  'calendar',
  'globe',
  'lage',
  'overlay',
  'hirn',
  'settings',
  'watchlist',
] as const

export type HomeAppId = (typeof HOME_APP_IDS)[number]

export type HomeApp = {
  id: HomeAppId
  label: string
  tint: string
}

export const HOME_APPS: HomeApp[] = [
  { id: 'chat', label: 'Chat', tint: '#1ed760' },
  { id: 'voice', label: 'Sprache', tint: '#3ec6ff' },
  { id: 'calendar', label: 'Kalender', tint: '#e4c36a' },
  { id: 'globe', label: 'Kugel', tint: '#6ea8ff' },
  { id: 'lage', label: 'Lage', tint: '#7d9b88' },
  { id: 'overlay', label: 'Overlay', tint: '#ff8a4c' },
  { id: 'hirn', label: 'Gehirn', tint: '#c9a0ff' },
  { id: 'settings', label: 'Einstellungen', tint: '#9aa7a0' },
  { id: 'watchlist', label: 'Filme', tint: '#f15e6c' },
]

export function isHomeAppId(id: string): id is HomeAppId {
  return (HOME_APP_IDS as readonly string[]).includes(id)
}
