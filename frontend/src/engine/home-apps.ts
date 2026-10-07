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
  'shopping',
  'notes',
  'todos',
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
  { id: 'hirn', label: 'Gehirn', tint: '#ff2a36' },
  { id: 'settings', label: 'Einstellungen', tint: '#9aa7a0' },
  { id: 'watchlist', label: 'Filme', tint: '#f15e6c' },
  { id: 'shopping', label: 'Einkauf', tint: '#5ecf8a' },
  { id: 'notes', label: 'Notizen', tint: '#d9b76e' },
  { id: 'todos', label: 'Todos', tint: '#7fc8a0' },
]

export function isHomeAppId(id: string): id is HomeAppId {
  return (HOME_APP_IDS as readonly string[]).includes(id)
}
