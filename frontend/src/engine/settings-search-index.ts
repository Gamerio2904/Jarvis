import type { SettingsTab } from './settings-ia.ts'

export type SettingsSearchHit = {
  tab: SettingsTab
  field: string
  keywords: string[]
  elementId: string
}

export const SETTINGS_FIELD_INDEX: SettingsSearchHit[] = [
  { tab: 'keys', field: 'Gemini API-Key', keywords: ['gemini', 'key', 'google', 'aistudio'], elementId: 'sf-gemini-key' },
  { tab: 'keys', field: 'Groq API-Key', keywords: ['groq', 'backup', 'llama'], elementId: 'sf-groq-key' },
  { tab: 'keys', field: 'Tankerkönig', keywords: ['tank', 'tanke', 'sprit', 'benzin'], elementId: 'sf-tank-key' },
  { tab: 'hirn', field: 'Netz-Suche', keywords: ['research', 'netz', 'suche', 'internet'], elementId: 'sf-research' },
  { tab: 'hirn', field: 'e5 Rerank', keywords: ['e5', 'rerank', 'embed'], elementId: 'sf-e5' },
  { tab: 'stimme', field: 'Wake-Wort', keywords: ['wake', 'wecken', 'jarvis'], elementId: 'sf-wake' },
  { tab: 'stimme', field: 'TTS Stimme', keywords: ['stimme', 'vorlesen', 'tts', 'edge', 'piper'], elementId: 'sf-tts' },
  { tab: 'alltag', field: 'Wecker', keywords: ['wecker', 'alarm', 'aufstehen'], elementId: 'sf-wecker' },
  { tab: 'alltag', field: 'Kalender', keywords: ['kalender', 'termin', 'event'], elementId: 'sf-kalender' },
  { tab: 'alltag', field: 'Wetter Ort', keywords: ['wetter', 'ort', 'gps', 'standort'], elementId: 'sf-ort' },
  { tab: 'alltag', field: 'Weltlage', keywords: ['weltlage', 'nachrichten', 'ausblick'], elementId: 'sf-weltlage' },
  { tab: 'geraete', field: 'Fernseher', keywords: ['fernseher', 'fernseh', 'tv', 'samsung', 'tizen', 'fire'], elementId: 'sf-tv' },
  { tab: 'geraete', field: 'PC Werkzeug', keywords: ['pc', 'rechner', 'qr', '18790'], elementId: 'sf-pc' },
  { tab: 'geraete', field: 'Steckdosen', keywords: ['steckdose', 'dose', 'plug', 'ventilator'], elementId: 'sf-plugs' },
  { tab: 'geraete', field: 'Spotify', keywords: ['spotify', 'musik'], elementId: 'sf-spotify' },
  { tab: 'geraete', field: 'Presence', keywords: ['presence', 'tablet', 'fenster'], elementId: 'sf-presence' },
  { tab: 'lage', field: 'Weltkugel', keywords: ['kugel', 'globus', 'erde', 'weltkugel'], elementId: 'sf-globe' },
  { tab: 'lage', field: 'Lage immer', keywords: ['lage immer', 'hud', 'tablet'], elementId: 'sf-hud-force' },
  { tab: 'lage', field: 'Design Hell/Dunkel', keywords: ['hell', 'dunkel', 'dark', 'light', 'theme', 'modus'], elementId: 'sf-ui-theme' },
  { tab: 'lage', field: 'HUD Akzent', keywords: ['orange', 'grün', 'gruen', 'amber', 'akzent'], elementId: 'sf-hud-accent' },
  { tab: 'daten', field: 'Hausstand Export', keywords: ['export', 'hausstand', 'sichern', 'backup'], elementId: 'sf-export' },
  { tab: 'daten', field: 'Fachwissen', keywords: ['fachwissen', 'pack', 'lernen'], elementId: 'sf-fachwissen' },
  { tab: 'daten', field: 'Alles löschen', keywords: ['löschen', 'loeschen', 'gefahr', 'vergiss'], elementId: 'sf-danger' },
  { tab: 'tests', field: 'Debug-Lauf', keywords: ['debug', 'probe', 'test', 'v1', 'v9'], elementId: 'sf-debug' },
]

const SYNONYMS: Array<{ re: RegExp; tab: SettingsTab; suggest?: string }> = [
  { re: /fernseh|samsung|tizen|hollywood|fire\s*tv/i, tab: 'geraete', suggest: 'TV' },
  { re: /kalender|termin|appointment/i, tab: 'alltag', suggest: 'Kalender' },
  { re: /timer|wecker|alarm/i, tab: 'alltag' },
  { re: /kugel|globus|erde|weltkugel/i, tab: 'lage' },
  { re: /groq|gemini|api.?key|schlüssel/i, tab: 'keys' },
  { re: /export|hausstand|sichern/i, tab: 'daten' },
  { re: /hell|dunkel|dark|light|theme/i, tab: 'lage' },
]

export function searchSettingsFields(q: string): SettingsSearchHit[] {
  const n = q.trim().toLowerCase()
  if (!n) return []
  const hits: SettingsSearchHit[] = []
  for (const row of SETTINGS_FIELD_INDEX) {
    const hay = [row.field, ...row.keywords].join(' ').toLowerCase()
    if (hay.includes(n) || row.keywords.some((k) => k.includes(n) || n.includes(k))) {
      hits.push(row)
    }
  }
  return hits
}

export function searchSuggestions(q: string): string[] {
  const n = q.trim().toLowerCase()
  if (!n) return []
  const out: string[] = []
  for (const s of SYNONYMS) {
    if (s.re.test(n) && s.suggest && !out.includes(s.suggest)) out.push(s.suggest)
  }
  if (/fernseh/i.test(n) && !out.includes('TV')) out.push('TV')
  return out.slice(0, 3)
}
