export const CORE_IDS = ['gemini', 'groq', 'local'] as const
export type CoreId = (typeof CORE_IDS)[number]

export type CoreSphere = {
  id: CoreId
  label: string
  line: string
}

export const CORE_SPHERES: readonly CoreSphere[] = [
  { id: 'gemini', label: 'Gemini', line: 'Google. Suche und Bild bleiben hier, wenn die Rolle an ist.' },
  { id: 'groq', label: 'Groq', line: 'Schnelle Cloud-Antwort.' },
  { id: 'local', label: 'Lokal', line: '0,5B auf dem Gerät, ohne Server.' },
]

export function isCoreId(value: string): value is CoreId {
  return (CORE_IDS as readonly string[]).includes(value)
}

const CORE_TARGET = '(lokal(?:e|es|en|er|em)?|local|offline|ger[aä]t|groq|grok|grock|gemini|google)'

function coreIdFromWord(word: string): CoreId | null {
  const w = word.toLowerCase()
  if (/^lokal|^local|^offline|^ger/.test(w)) return 'local'
  if (/^gro/.test(w)) return 'groq'
  if (/^gem|^goo/.test(w)) return 'gemini'
  return null
}

/** „Ändere auf lokal“ und nahe Sätze. Notizen und Termine bleiben außen vor. */
export function parseCoreSwitch(text: string): CoreId | null {
  const t = text.trim().replace(/[.!?]+$/g, '')
  if (!t || t.length > 72) return null
  if (/\b(notiz|todo|aufgabe|termin|liste|einkauf|kalender|film)\b/i.test(t)) return null
  const verb = '(?:änder(?:e|n)?|andere|wechsel(?:e|n)?|stell(?:e)?|setz(?:e)?|schalt(?:e)?(?:\\s+um)?|umschalt(?:e|en)?|nimm|mach(?:e)?|priorisier(?:e)?)'
  const noun = '(?:das\\s+|die\\s+|den\\s+)?(?:hirn|gehirn|core|modell|llm|priorit[aä]t|prio)'
  const prep = '(?:auf|aufs|zu|zum|nach|an)'
  const patterns = [
    new RegExp(`^\\s*(?:bitte\\s+)?${verb}\\s+(?:bitte\\s+)?(?:${noun}\\s+)?(?:${prep}\\s+)?${CORE_TARGET}\\s*$`, 'i'),
    new RegExp(`^\\s*(?:bitte\\s+)?${noun}\\s+(?:${prep}\\s+)?${CORE_TARGET}\\s*$`, 'i'),
    new RegExp(`^\\s*(?:bitte\\s+)?${CORE_TARGET}\\s+zuerst\\s*$`, 'i'),
    new RegExp(`^\\s*(?:bitte\\s+)?(?:antworte|antwort)\\s+(?:zuerst\\s+)?(?:mit|auf)\\s+${CORE_TARGET}\\s*$`, 'i'),
    new RegExp(`^\\s*(?:auf\\s+|zu\\s+)?${CORE_TARGET}\\s+(?:wechseln|ändern|aendern|stellen|setzen|schalten)\\s*$`, 'i'),
  ]
  for (const re of patterns) {
    const hit = re.exec(t)
    if (!hit) continue
    const id = coreIdFromWord(hit[1] || '')
    if (id) return id
  }
  return null
}

/** Reihenfolge, in der geantwortet wird. Die erste bereite Kugel gewinnt. */
export function corePriorityOrder(primary: string): CoreId[] {
  if (primary === 'groq') return ['groq', 'gemini', 'local']
  if (primary === 'local') return ['local', 'gemini', 'groq']
  return ['gemini', 'groq', 'local']
}

export function frontIndex(yaw: number, count = CORE_SPHERES.length): number {
  const step = (Math.PI * 2) / count
  let best = 0
  let bestAbs = Infinity
  for (let i = 0; i < count; i += 1) {
    let delta = i * step + yaw
    delta = ((delta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI
    const abs = Math.abs(delta)
    if (abs < bestAbs) {
      bestAbs = abs
      best = i
    }
  }
  return best
}

/** Yaw, der die Kugel `index` nach vorn dreht, nah an `from`. */
export function yawForIndex(index: number, count: number, from: number): number {
  const step = (Math.PI * 2) / count
  const target = -index * step
  let delta = target - from
  delta = ((delta + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI
  return from + delta
}
