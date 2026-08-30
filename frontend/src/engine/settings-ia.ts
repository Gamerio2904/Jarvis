export type SettingsTopic =
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
  | 'gefahr'

export type SettingsGroup = {
  id: string
  title: string
  lead: string
  topics: SettingsTopic[]
  workshop?: boolean
}

export const SETTINGS_GROUPS: SettingsGroup[] = [
  { id: 'hirn', title: 'Hirn', lead: 'Wer denkt — zuerst Gemini, dann Groq, zuletzt das kleine Modell.', topics: ['cloud', 'modell'] },
  { id: 'stimme', title: 'Stimme', lead: 'Hören, wecken, vorlesen. Am Steuer kurz.', topics: ['sprache'] },
  { id: 'alltag', title: 'Alltag', lead: 'Wecker, Wetter, wo Sie sind.', topics: ['wecker', 'ort'] },
  { id: 'geraete', title: 'Geräte', lead: 'Was Jarvis schalten oder spielen darf.', topics: ['tv', 'pc', 'haus', 'musik'] },
  { id: 'welt', title: 'Welt', lead: 'Suche im Netz und Weltlage. Nur wenn Sie das anmachen.', topics: ['forschung', 'weltlage'] },
  { id: 'daten', title: 'Ihre Daten', lead: 'Was er merkt, was Sie sichern, was weg ist.', topics: ['gedaechtnis', 'hausstand', 'gefahr'] },
  { id: 'aussehen', title: 'Aussehen', lead: 'Lage neben dem Chat, Farben, leise Töne.', topics: ['allgemein', 'ton'], workshop: true },
  { id: 'werkstatt', title: 'Werkstatt', lead: 'Version, Debug, nur wenn Sie testen.', topics: ['debug'], workshop: true },
]

export const TOPIC_FACE: Record<SettingsTopic, { label: string; hint: string }> = {
  allgemein: { label: 'Dieses Handy', hint: 'Version, ob Gemini oder das lokale Modell läuft' },
  modell: { label: 'Kleines Modell (selten)', hint: 'Nur wenn Cloud aus ist. ~470 MB.' },
  cloud: { label: 'Hirn in der Cloud', hint: 'Gemini zuerst. Groq springt ein.' },
  sprache: { label: 'Hören und sprechen', hint: 'Mikrofon, Stimme, Wake' },
  wecker: { label: 'Wecker und Timer', hint: 'Töne, Erinnerungen' },
  ort: { label: 'Ort und Wetter', hint: 'GPS, Open-Meteo' },
  tv: { label: 'Fernseher', hint: 'Samsung und Fire am HDMI' },
  pc: { label: 'Windows-PC', hint: 'Nur mit laufender Jarvis-PC-App' },
  haus: { label: 'Steckdosen und Ventilator', hint: 'Im WLAN, keine Cloud-Dose' },
  musik: { label: 'Musik', hint: 'Spotify in Jarvis. Amazon öffnet die App.' },
  ton: { label: 'Töne und Stimmung', hint: 'Klicks, nicht die Stimme' },
  forschung: { label: 'Im Internet suchen', hint: 'Aus = keine Produktsuche' },
  weltlage: { label: 'Weltlage', hint: 'Ausblick auf Nachfrage, kein Orakel' },
  hausstand: { label: 'Sichern und zurückholen', hint: 'Vor Neuinstall. Sonst sind Keys weg.' },
  gedaechtnis: { label: 'Was Jarvis merkt', hint: 'Sie können Zeilen löschen' },
  debug: { label: 'Tests', hint: 'Mehrere Kategorien, Export' },
  gefahr: { label: 'Alles löschen', hint: 'Unumkehrbar.' },
}

export function groupForTopic(id: SettingsTopic): SettingsGroup {
  return SETTINGS_GROUPS.find((g) => g.topics.includes(id)) || SETTINGS_GROUPS[0]
}

export function filterTopics(q: string): SettingsTopic[] {
  const n = q.trim().toLowerCase()
  if (!n) return []
  const hits: SettingsTopic[] = []
  for (const [id, face] of Object.entries(TOPIC_FACE) as Array<[SettingsTopic, { label: string; hint: string }]>) {
    if (id.includes(n) || face.label.toLowerCase().includes(n) || face.hint.toLowerCase().includes(n)) hits.push(id)
  }
  if (/key|gemini|groq/.test(n) && !hits.includes('cloud')) hits.unshift('cloud')
  if (/steck|dose/.test(n) && !hits.includes('haus')) hits.push('haus')
  if (/lösch|gefahr/.test(n) && !hits.includes('gefahr')) hits.push('gefahr')
  if (/wake|hören|stimme/.test(n) && !hits.includes('sprache')) hits.push('sprache')
  if (/preis|research|netz/.test(n) && !hits.includes('forschung')) hits.push('forschung')
  return hits
}
