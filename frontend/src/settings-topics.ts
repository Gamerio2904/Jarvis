import type { Health, Settings } from './api'
import { spotifyLoggedIn } from './engine/spotify'

export type SettingsTopic =
  | 'hub'
  | 'allgemein'
  | 'modell'
  | 'rabatt'
  | 'cloud'
  | 'sprache'
  | 'wecker'
  | 'ort'
  | 'tv'
  | 'pc'
  | 'haus'
  | 'musik'
  | 'ton'
  | 'forschung'
  | 'gedaechtnis'
  | 'debug'
  | 'gefahr'

export type SettingsTopicMeta = { id: Exclude<SettingsTopic, 'hub'>; label: string; hint: string }

export const SETTINGS_TOPICS: SettingsTopicMeta[] = [
  { id: 'allgemein', label: 'Allgemein', hint: 'Version' },
  { id: 'modell', label: 'Modell', hint: 'Lokal' },
  { id: 'rabatt', label: 'Rabatt', hint: 'APIs' },
  { id: 'cloud', label: 'Cloud', hint: 'Gemini an/aus' },
  { id: 'sprache', label: 'Sprache', hint: 'Hören' },
  { id: 'wecker', label: 'Wecker', hint: 'Timer' },
  { id: 'ort', label: 'Ort', hint: 'Wetter' },
  { id: 'tv', label: 'Fernseher', hint: 'Tizen + Fire' },
  { id: 'pc', label: 'PC', hint: 'Bildschirm' },
  { id: 'haus', label: 'Haus', hint: 'Steckdose' },
  { id: 'musik', label: 'Musik', hint: 'Spotify' },
  { id: 'ton', label: 'Ton', hint: 'Delight' },
  { id: 'forschung', label: 'Netz', hint: 'Suche' },
  { id: 'gedaechtnis', label: 'Gedächtnis', hint: 'Memory' },
  { id: 'debug', label: 'Debug', hint: 'Chat-Dump' },
  { id: 'gefahr', label: 'Gefahr', hint: 'Löschen' },
]

export const SETTINGS_GROUPS: Array<{ title: string; ids: Array<Exclude<SettingsTopic, 'hub'>> }> = [
  { title: 'Gerät', ids: ['allgemein', 'modell', 'sprache', 'wecker', 'ort'] },
  { title: 'Keys & Netz', ids: ['rabatt', 'cloud', 'forschung'] },
  { title: 'Haus', ids: ['tv', 'pc', 'haus', 'musik'] },
  { title: 'Mehr', ids: ['ton', 'gedaechtnis', 'debug', 'gefahr'] },
]

function keyOn(v?: string | null): boolean {
  return Boolean(v?.trim())
}

function countKeys(s: Settings | null): number {
  if (!s) return 0
  return [
    s.gemini_api_key,
    s.groq_api_key,
    s.omdb_api_key,
    s.tankerkoenig_api_key,
    s.spotify_client_id,
  ].filter((k) => keyOn(k)).length
}

export function settingsTopicStatus(
  id: Exclude<SettingsTopic, 'hub'>,
  s: Settings | null,
  health: Health | null,
  geminiOn: boolean,
): string {
  if (id === 'allgemein') return s?.version || ''
  if (id === 'modell') {
    if (geminiOn) return 'Gemini'
    if (health?.model_ready) return 'bereit'
    return 'laden'
  }
  if (id === 'rabatt') {
    const n = countKeys(s)
    const extra = s?.shop_discount ? ' · Suche an' : ''
    return n ? `${n} Keys${extra}` : `leer${extra}`
  }
  if (id === 'cloud') return geminiOn ? 'an' : 'aus'
  if (id === 'sprache') return s?.wake_word ? 'Wake an' : 'Wake aus'
  if (id === 'wecker') return 'Timer'
  if (id === 'ort') return s?.last_place?.trim() || 'GPS'
  if (id === 'tv') return s?.tv_paired ? s.tv_name || 'gekoppelt' : s?.tv_enabled ? 'offen' : 'aus'
  if (id === 'pc') return s?.pc_host?.trim() || 'aus'
  if (id === 'haus') return s?.plugs_enabled ? 'Steckdosen' : 'aus'
  if (id === 'musik') return spotifyLoggedIn(s || undefined) ? 'an' : 'nicht angebunden'
  if (id === 'ton') return s?.ui_sounds ? 'an' : 'aus'
  if (id === 'forschung') return s?.research_opt_in ? 'Suche an' : 'Suche aus'
  if (id === 'gedaechtnis') return 'Memory'
  if (id === 'debug') return 'Dump'
  if (id === 'gefahr') return 'löschen'
  return ''
}

export function settingsTopicMeta(id: SettingsTopic): { label: string; hint: string } {
  if (id === 'hub') return { label: 'Übersicht', hint: 'Themen' }
  return SETTINGS_TOPICS.find((t) => t.id === id) || SETTINGS_TOPICS[0]
}
