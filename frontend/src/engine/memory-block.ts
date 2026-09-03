import type { RetrieveHit } from './retrieve.ts'
import { semanticPins } from './memory-layer.ts'

function normQ(s: string): string {
  return s.toLowerCase().replace(/[.?!…]+/g, '').replace(/\s+/g, ' ').trim()
}

export function memoryBlock(
  items: Array<{ key: string; value: string; category?: string; confidence?: number; origin?: 'user' | 'sleep' | 'tool' }>,
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
  const tokens = q.split(/[^a-zäöüß0-9]+/i).filter((w) => w.length > 3)
  const ranked = trusted.map((m) => {
    const blob = `${m.key} ${m.value}`.toLowerCase()
    const hit = tokens.some((w) => blob.includes(w)) || (q && blob.includes(q.slice(0, 24)))
    return { m, hit }
  })
  const seen = new Set<string>()
  const lines: string[] = []
  const push = (line: string) => {
    const k = line.toLowerCase()
    if (seen.has(k)) return
    seen.add(k)
    lines.push(line)
  }
  for (const h of hits.filter((x) => x.store === 'memory').slice(0, 4)) {
    push(`- ${h.title}: ${h.body}`)
  }
  const picked = (q ? ranked.filter((x) => x.hit) : ranked).slice(0, 4)
  for (const x of picked) push(`- ${x.m.key}: ${x.m.value}`)
  if (!lines.length) {
    const pins = trusted.filter((m) => m.key === 'name' || m.key === 'zuhause' || m.category === 'boundary').slice(0, 3)
    for (const m of pins) push(`- ${m.key}: ${m.value}`)
  }
  for (const h of hits.filter((x) => x.store !== 'memory').slice(0, 4)) {
    if (h.store === 'messages' && qn && normQ(h.body) === qn) continue
    if (h.store === 'messages') push(`- Gespräch: ${h.body}`)
    else if (h.store === 'events') push(`- Kalender: ${h.title}: ${h.body}`)
    else push(`- ${h.store}: ${h.title}: ${h.body}`)
  }
  const use = lines.slice(0, 10)
  if (!use.length) {
    return `Langzeitgedächtnis (lokal und Cloud gleich):\n${nameRule}\nKeine weiteren Einträge passen zur aktuellen Frage. Nichts erfinden.`
  }
  return `Langzeitgedächtnis (lokal und Cloud gleich):\n${use.join('\n')}\n${nameRule}\nNutzen Sie nur Fakten aus dieser Liste. Widerspruch („kein … mehr“) heißt: der Wert ist weg — nicht wieder einstreuen. Keinen Extra-Befehl abwarten. Nichts erfinden, das nicht in der Liste steht. Ton bleibt Jarvis: ruhig, Understatement.`
}
