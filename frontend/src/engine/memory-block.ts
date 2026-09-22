import type { RetrieveHit } from './retrieve.ts'
import {
  aspectLabel,
  isAboutMeAsk,
  isLookupAsk,
  memoryAspect,
  semanticPins,
  type MemoryAspect,
} from './memory-layer.ts'

function normQ(s: string): string {
  return s.toLowerCase().replace(/[.?!…]+/g, '').replace(/\s+/g, ' ').trim()
}

const PEOPLE_ASK =
  /\b(anruf|ruf|sms|nachricht|whatsapp|e-?mail|email|kontakt|telefon|mama|papa|freundin|bro|nummer)\b/i
const WORK_ASK = /\b(job|arbeit(?:e|en|splatz)?|firma|beruf|arbeitgeber|kolleg)\b/i
const LIFE_ASK = /\b(geburtstag|familie|gesundheit)\b/i
const GOAL_ASK = /\b(ziel|reise|plane|urlaub|japan|tokyo)\b/i

export type MemoryPin = {
  key: string
  value: string
  category?: string
  confidence?: number
  origin?: 'user' | 'sleep' | 'tool'
  kind?: string
}

export type RankedPin = { m: MemoryPin; hit: boolean; aspect: MemoryAspect }

/** Dieselben Pins für LLM-Block, Recall und Agenten. Kein zweites Hirn. */
export function pinsForAsk(items: MemoryPin[], question = ''): RankedPin[] {
  const trusted = semanticPins(items)
  const q = question.toLowerCase()
  const tokens = q.split(/[^a-zäöüß0-9]+/i).filter((w) => w.length > 3)
  const people = PEOPLE_ASK.test(question)
  const lookup = isLookupAsk(question)
  const about = isAboutMeAsk(question) || !q
  const work = WORK_ASK.test(question)
  const life = LIFE_ASK.test(question)
  const goal = GOAL_ASK.test(question)
  return trusted.map((m) => {
    const blob = `${m.key} ${m.value}`.toLowerCase()
    const aspect = memoryAspect(m.category || '', m.key, m.kind)
    const hit = tokens.some((w) => blob.includes(w)) || (q && blob.includes(q.slice(0, 24)))
    const wantPeople = people && aspect === 'people'
    const wantResearch = aspect === 'research' && (hit || lookup)
    const wantKnow = aspect === 'know' && (hit || lookup)
    const wantWork = aspect === 'work' && (hit || work || about)
    const wantLife = aspect === 'life' && (hit || life || about)
    const wantGoal = aspect === 'goal' && (hit || goal || about)
    const wantAbout =
      about &&
      (aspect === 'name' ||
        aspect === 'place' ||
        aspect === 'pref' ||
        aspect === 'people' ||
        aspect === 'work' ||
        aspect === 'life' ||
        aspect === 'goal' ||
        aspect === 'research')
    return {
      m,
      hit: Boolean(hit || wantPeople || wantResearch || wantKnow || wantWork || wantLife || wantGoal || wantAbout),
      aspect,
    }
  })
}

export function memoryBlock(
  items: Array<{
    key: string
    value: string
    category?: string
    confidence?: number
    origin?: 'user' | 'sleep' | 'tool'
    kind?: string
  }>,
  question = '',
  hits: RetrieveHit[] = [],
): string {
  const name = items.find((m) => m.key === 'name')?.value?.trim()
  const nameRule = name
    ? `Der Nutzer heißt ${name}. Siezen Sie. Den Vornamen nicht in die Anrede setzen, außer die Frage gilt dem Namen. Erfinden Sie keinen anderen Vornamen.`
    : 'Der Nutzer hat keinen Namen hinterlegt. Erfinden Sie keinen Vornamen. Nur Siezen.'
  const trusted = semanticPins(items)
  if (!trusted.length && !hits.length) {
    return `Langzeitgedächtnis (lokal und Cloud gleich):\n${nameRule}`
  }
  const q = question.toLowerCase()
  const qn = normQ(question)
  const ranked = pinsForAsk(items, question)
  const seen = new Set<string>()
  const lines: string[] = []
  const push = (line: string) => {
    const k = line.toLowerCase()
    if (seen.has(k)) return
    seen.add(k)
    lines.push(line)
  }
  for (const h of hits.filter((x) => x.store === 'memory').slice(0, 4)) {
    const aspect = memoryAspect('', h.title)
    const tag = aspectLabel(aspect, h.title)
    push(`- ${tag}: ${h.body}`)
  }
  for (const h of hits.filter((x) => x.store === 'knowledge').slice(0, 3)) {
    push(`- Wissen/${h.title}: ${h.body}`)
  }
  const picked = (q ? ranked.filter((x) => x.hit) : ranked).slice(0, 8)
  for (const x of picked) {
    push(`- ${aspectLabel(x.aspect, x.m.key)}: ${x.m.value}`)
  }
  if (!lines.length) {
    const pins = trusted
      .filter((m) => m.key === 'name' || m.key === 'zuhause' || m.category === 'boundary')
      .slice(0, 3)
    for (const m of pins) push(`- ${m.key}: ${m.value}`)
  }
  for (const h of hits.filter((x) => x.store !== 'memory' && x.store !== 'knowledge').slice(0, 4)) {
    if (h.store === 'messages' && qn && normQ(h.body) === qn) continue
    if (h.store === 'messages') push(`- Gespräch: ${h.body}`)
    else if (h.store === 'events') push(`- Kalender: ${h.title}: ${h.body}`)
    else push(`- ${h.store}: ${h.title}: ${h.body}`)
  }
  const use = lines.slice(0, 14)
  if (!use.length) {
    return `Langzeitgedächtnis (lokal und Cloud gleich):\n${nameRule}\nKeine weiteren Einträge passen zur aktuellen Frage. Nichts erfinden.`
  }
  return `Langzeitgedächtnis (lokal und Cloud gleich):\n${use.join('\n')}\n${nameRule}\nNutzen Sie nur Fakten aus dieser Liste. Recherche- und Wissen-Zeilen nur mit Quelle. Widerspruch („kein … mehr“) heißt: der Wert ist weg — nicht wieder einstreuen. Keinen Extra-Befehl abwarten. Nichts erfinden, das nicht in der Liste steht. Ton bleibt Jarvis: ruhig, Understatement.`
}
