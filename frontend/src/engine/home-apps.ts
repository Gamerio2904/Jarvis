/** Zweiter Homescreen: App-Kacheln. Kein Android-Launcher, keine fremden Apps. */

export const HOME_APP_IDS = [
  'chat',
  'voice',
  'calendar',
  'lage',
  'overlay',
  'hirn',
  'core',
  'settings',
  'watchlist',
  'shopping',
  'notes',
  'todos',
  'tisch',
  'chess',
  'yugioh',
  'server',
  'welt',
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
  { id: 'lage', label: 'Lage', tint: '#7d9b88' },
  { id: 'overlay', label: 'CarPlay', tint: '#4cc3ff' },
  { id: 'hirn', label: 'Gehirn', tint: '#ff2a36' },
  { id: 'core', label: 'Core', tint: '#7eb6ff' },
  { id: 'settings', label: 'Einstellungen', tint: '#9aa7a0' },
  { id: 'watchlist', label: 'Filme', tint: '#f15e6c' },
  { id: 'shopping', label: 'Einkauf', tint: '#5ecf8a' },
  { id: 'notes', label: 'Notizen', tint: '#d9b76e' },
  { id: 'todos', label: 'Todos', tint: '#7fc8a0' },
  { id: 'tisch', label: 'Tischplatte', tint: '#c4a574' },
  { id: 'chess', label: 'Schach', tint: '#e6d3a3' },
  { id: 'yugioh', label: 'Yu-Gi-Oh', tint: '#c9a227' },
  { id: 'server', label: 'Server', tint: '#8fd0c6' },
  { id: 'welt', label: 'Welt', tint: '#7eb6ff' },
]

export function isHomeAppId(id: string): id is HomeAppId {
  return (HOME_APP_IDS as readonly string[]).includes(id)
}
