/** Acht Reiter. Alte Topic-IDs bleiben Deep-Links und landen auf dem neuen Tab. */

export type SettingsTab =
  | 'keys'
  | 'hirn'
  | 'stimme'
  | 'alltag'
  | 'geraete'
  | 'lage'
  | 'daten'
  | 'tests'

/** Alte IDs + neue Tabs. App und Deep-Links dürfen beides schicken. */
export type SettingsTopic =
  | SettingsTab
  | 'allgemein'
  | 'modell'
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
  | 'weltlage'
  | 'hausstand'
  | 'gedaechtnis'
  | 'debug'
  | 'probe'
  | 'gefahr'

export type SettingsGroup = {
  id: SettingsTab
  title: string
  lead: string
  topics: SettingsTab[]
  workshop?: boolean
}

export const SETTINGS_TABS: Array<{
  id: SettingsTab
  label: string
  hint: string
  workshop?: boolean
}> = [
  { id: 'keys', label: 'API-Keys', hint: 'Alle Schlüssel an einem Ort' },
  { id: 'hirn', label: 'Hirn', hint: 'Wer denkt, ob gesucht wird' },
  { id: 'stimme', label: 'Stimme', hint: 'Hören, wecken, vorlesen' },
  { id: 'alltag', label: 'Alltag', hint: 'Wecker, Ort, Weltlage' },
  { id: 'geraete', label: 'Geräte', hint: 'TV, PC, Haus, Musik' },
  { id: 'lage', label: 'Lage', hint: 'Kugel, Körper, Töne' },
  { id: 'daten', label: 'Daten', hint: 'Merken, sichern, löschen' },
  { id: 'tests', label: 'Tests', hint: 'Probe V1–V9 und Debug-Lauf', workshop: true },
]

/** @deprecated Gruppen = Reiter. Bleibt für alte Imports. */
export const SETTINGS_GROUPS: SettingsGroup[] = SETTINGS_TABS.map((t) => ({
  id: t.id,
  title: t.label,
  lead: t.hint,
  topics: [t.id],
  workshop: t.workshop,
}))

export const TOPIC_FACE: Record<SettingsTab, { label: string; hint: string }> = Object.fromEntries(
  SETTINGS_TABS.map((t) => [t.id, { label: t.label, hint: t.hint }]),
) as Record<SettingsTab, { label: string; hint: string }>

const ALIAS: Record<string, SettingsTab> = {
  keys: 'keys',
  cloud: 'keys',
  hirn: 'hirn',
  modell: 'hirn',
  forschung: 'hirn',
  stimme: 'stimme',
  sprache: 'stimme',
  alltag: 'alltag',
  wecker: 'alltag',
  ort: 'alltag',
  weltlage: 'alltag',
  geraete: 'geraete',
  tv: 'geraete',
  pc: 'geraete',
  haus: 'geraete',
  musik: 'geraete',
  lage: 'lage',
  allgemein: 'lage',
  ton: 'lage',
  daten: 'daten',
  gedaechtnis: 'daten',
  hausstand: 'daten',
  gefahr: 'daten',
  tests: 'tests',
  debug: 'tests',
  probe: 'tests',
}

export function resolveTopic(id: string | undefined | null): SettingsTab {
  if (!id) return 'keys'
  return ALIAS[id] || 'keys'
}

export function groupForTopic(id: SettingsTopic): SettingsGroup {
  const tab = resolveTopic(id)
  return SETTINGS_GROUPS.find((g) => g.id === tab) || SETTINGS_GROUPS[0]
}

/** Reiter für die Leiste: Suche darf sie nicht leer machen. */
export function visibleSettingsTabs(q: string): SettingsTab[] {
  const all = SETTINGS_TABS.map((t) => t.id)
  if (!q.trim()) return all
  const hits = filterTopics(q)
  return hits.length ? hits : all
}

/** Treffer auf anderem Tab → dorthin, damit der Inhalt sichtbar bleibt. */
export function settingsTabForQuery(q: string, current: SettingsTab): SettingsTab {
  const hits = q.trim() ? filterTopics(q) : []
  if (!hits.length) return current
  return hits.includes(current) ? current : hits[0]
}

export function filterTopics(q: string): SettingsTab[] {
  const n = q.trim().toLowerCase()
  if (!n) return []
  const hits: SettingsTab[] = []
  for (const t of SETTINGS_TABS) {
    if (t.id.includes(n) || t.label.toLowerCase().includes(n) || t.hint.toLowerCase().includes(n)) {
      hits.push(t.id)
    }
  }
  if (/key|gemini|groq|fred|omdb|tanke|spotify|aiza|gsk|carto|karte|carplay/.test(n) && !hits.includes('keys')) {
    hits.unshift('keys')
  }
  if (/steck|dose|tv|pc|ventilator/.test(n) && !hits.includes('geraete')) hits.push('geraete')
  if (/lösch|gefahr|hausstand|export/.test(n) && !hits.includes('daten')) hits.push('daten')
  if (/wake|hören|stimme/.test(n) && !hits.includes('stimme')) hits.push('stimme')
  if (/preis|research|netz|suche/.test(n) && !hits.includes('hirn')) hits.push('hirn')
  if (/wecker|wetter|ort|weltlage|blitzer|baustelle|radar|ordner|preiswache|instanudeln/.test(n) && !hits.includes('alltag')) {
    hits.push('alltag')
  }
  if (/\bamazon\b/.test(n) && !hits.includes('geraete')) hits.push('geraete')
  if (/lage|kugel|körper|ton/.test(n) && !hits.includes('lage')) hits.push('lage')
  if (/debug|test|probe|kopier|v[1-9]/.test(n) && !hits.includes('tests')) hits.push('tests')
  return hits
}
