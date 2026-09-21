import { CAL_THEME_IDS, classifyEventTheme, parseThemeId, type CalThemeId } from './calendar-theme.ts'

const SYSTEM =
  'Ordne den Termin genau einem Thema zu. Antworte nur mit der ID, sonst nichts. IDs: ' +
  CAL_THEME_IDS.join(', ') +
  '.'

/** Nur wenn der Parser unsicher ist (Sonstiges) und Groq liegt. Timeout 4 s. */
export async function classifyEventThemeSmart(title: string, place?: string): Promise<CalThemeId> {
  const local = classifyEventTheme(title, place)
  if (local !== 'sonstiges') return local
  const blob = `${title || ''} ${place || ''}`.trim()
  if (!blob) return local
  try {
    const { groqReady, completeGroq } = await import('./groq.ts')
    if (!groqReady()) return local
    const raw = await Promise.race([
      completeGroq([
        { role: 'system', content: SYSTEM },
        { role: 'user', content: place ? `Titel: ${title}\nOrt: ${place}` : `Titel: ${title}` },
      ]),
      new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('theme-timeout')), 4_000)
      }),
    ])
    return parseThemeId(raw) || local
  } catch {
    return local
  }
}
