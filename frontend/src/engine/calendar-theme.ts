export const CAL_THEME_IDS = [
  'arbeit',
  'uni',
  'geburtstag',
  'familie',
  'arzt',
  'sport',
  'reise',
  'sonstiges',
] as const

export type CalThemeId = (typeof CAL_THEME_IDS)[number]

export type CalTheme = {
  id: CalThemeId
  label: string
  color: string
}

/** Feste Palette — GUI und Punkte im Blatt lesen dieselbe Quelle. */
export const CAL_THEMES: CalTheme[] = [
  { id: 'arbeit', label: 'Arbeit', color: '#5b8def' },
  { id: 'uni', label: 'Uni', color: '#a78bfa' },
  { id: 'geburtstag', label: 'Geburtstag', color: '#f472b6' },
  { id: 'familie', label: 'Familie', color: '#fbbf24' },
  { id: 'arzt', label: 'Arzt', color: '#2dd4bf' },
  { id: 'sport', label: 'Sport', color: '#34d399' },
  { id: 'reise', label: 'Reise', color: '#38bdf8' },
  { id: 'sonstiges', label: 'Sonstiges', color: '#94a3b8' },
]

const THEME_BY_ID = new Map(CAL_THEMES.map((t) => [t.id, t]))

/** Spezifisch zuerst: Geburtstag vor Familie, Zahnarzt vor Uni. */
const RULES: Array<{ id: Exclude<CalThemeId, 'sonstiges'>; re: RegExp }> = [
  { id: 'geburtstag', re: /\b(geburtstag\w*|birthday|geburi)\b/i },
  {
    id: 'arzt',
    re: /\b(zahnarzt|zahn|arzt|ärztin|doktor|klinik|krankenhaus|impfung|therapie|physio|untersuch|augenarzt|hautarzt|orthopäd)/i,
  },
  {
    id: 'uni',
    re: /\b(uni|universit[aä]t|vorlesung|seminar|klausur|campus|hausarbeit|tutorium|studium|pr[uü]fung|prof(?:essor)?|mitschrift|h[öo]rsaal|vorles)\b/i,
  },
  {
    id: 'arbeit',
    re: /\b(arbeit|meeting|standup|stand-?up|b[uü]ro|office|kunde|projekt|deadline|schicht|kolleg|konferenz|job|team(?:meeting)?)\b/i,
  },
  {
    id: 'sport',
    re: /\b(sport|fu[sß]ball\w*|fitness|gym|training|joggen|tennis|schwimm|yoga|verein|match|workout)\b/i,
  },
  {
    id: 'reise',
    re: /\b(reise|flug|urlaub|hotel|ferien|airport|abflug|ankunft|bahnhof)\b/i,
  },
  {
    id: 'familie',
    re: /\b(familie|mama|papa|oma|opa|eltern|kind|hochzeit|taufe|verwandt|sohn|tochter)\b/i,
  },
]

export function isCalThemeId(id: string | null | undefined): id is CalThemeId {
  return Boolean(id && (CAL_THEME_IDS as readonly string[]).includes(id))
}

export function calThemeOf(id: string | null | undefined): CalTheme {
  return (id && THEME_BY_ID.get(id as CalThemeId)) || THEME_BY_ID.get('sonstiges')!
}

export function parseThemeId(raw: string | null | undefined): CalThemeId | null {
  const n = (raw || '').trim().toLowerCase().replace(/[^a-zäöüß]/gi, '')
  if (isCalThemeId(n)) return n
  const hit = CAL_THEMES.find((t) => n.includes(t.id) || n.includes(t.label.toLowerCase()))
  return hit?.id || null
}

/** Parser-first: Titel und Ort reichen oft. Ohne Treffer: Sonstiges. */
export function classifyEventTheme(title: string, place?: string): CalThemeId {
  const blob = `${title || ''} ${place || ''}`.trim()
  if (!blob) return 'sonstiges'
  for (const rule of RULES) {
    if (rule.re.test(blob)) return rule.id
  }
  return 'sonstiges'
}

export function eventTheme(row: { title: string; place?: string; theme?: string | null }): CalThemeId {
  if (isCalThemeId(row.theme)) return row.theme
  return classifyEventTheme(row.title, row.place)
}

/** Einzigartige Themen eines Tages, höchstens drei Punkte im Blatt. */
export function themesForDay(
  events: Array<{ start_at: string; title: string; place?: string; theme?: string | null }>,
  day: Date,
  sameDay: (a: Date, b: Date) => boolean,
): CalThemeId[] {
  const ids: CalThemeId[] = []
  for (const e of events) {
    if (!sameDay(new Date(e.start_at), day)) continue
    const id = eventTheme(e)
    if (!ids.includes(id)) ids.push(id)
    if (ids.length >= 3) break
  }
  return ids
}
