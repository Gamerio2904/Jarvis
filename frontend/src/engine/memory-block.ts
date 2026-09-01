import type { RetrieveHit } from './retrieve.ts'
import { semanticPins } from './memory-layer.ts'

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
  const tokens = q.split(/[^a-zäöüß0-9]+/i).filter((w) => w.length > 3)
  const ranked = trusted.map((m) => {
    const blob = `${m.key} ${m.value}`.toLowerCase()
    const hit = tokens.some((w) => blob.includes(w)) || (q && blob.includes(q.slice(0, 24)))
    return { m, hit }
  })
  const pinHits = hits
    .filter((h) => h.store !== 'memory')
    .slice(0, 4)
    .map((h) =>
      h.store === 'messages'
        ? `- Gespräch: ${h.body}`
        : h.store === 'events'
          ? `- Kalender: ${h.title}: ${h.body}`
          : `- ${h.store}: ${h.title}: ${h.body}`,
    )
  const picked = (q ? ranked.filter((x) => x.hit) : ranked).slice(0, q ? 4 : 4)
  const pins = trusted.filter((m) => m.key === 'name' || m.key === 'zuhause' || m.category === 'boundary').slice(0, 3)
  const use = picked.length ? picked.map((x) => x.m) : pins
  const lines = [
    ...use.map((m) => `- ${m.key}: ${m.value}`),
    ...pinHits,
  ].slice(0, 10)
  if (!lines.length) {
    return `Langzeitgedächtnis (lokal und Cloud gleich):\n${nameRule}\nKeine weiteren Einträge passen zur aktuellen Frage. Nichts erfinden.`
  }
  return `Langzeitgedächtnis (lokal und Cloud gleich):\n${lines.join('\n')}\n${nameRule}\nNutzen Sie nur Fakten aus dieser Liste. Widerspruch („kein … mehr“) heißt: der Wert ist weg — nicht wieder einstreuen. Keinen Extra-Befehl abwarten. Nichts erfinden, das nicht in der Liste steht. Ton bleibt Jarvis: ruhig, Understatement.`
}
