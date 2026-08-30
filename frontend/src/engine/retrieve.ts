import {
  getAll,
  listEvents,
  listMemory,
  listNotes,
  listReminders,
  listShopping,
  type Conversation,
  type MemoryItem,
  type Message,
} from './store.ts'

export type RetrieveHit = {
  store: string
  title: string
  body: string
  rank: number
}

const STOP = new Set(
  'der die das den dem des ein eine einer einem einen und oder aber mit von zu im in am auf aus für fürs als wie was wer wo wann warum dass das ist sind war hat habe ich wir sie du mir uns ihr eure mein meine dein keine kein noch nur auch schon mal bitte doch'.split(
    ' ',
  ),
)

export function subQueries(text: string): string[] {
  const t = text.replace(/[.!?]+$/g, '').trim()
  const tokens = t
    .toLowerCase()
    .split(/[^a-zäöüß0-9]+/i)
    .filter((w) => w.length > 2 && !STOP.has(w))
  const uniq = [...new Set(tokens)]
  const out: string[] = []
  if (uniq.length) out.push(uniq.slice(0, 4).join(' '))
  if (uniq[0]) out.push(uniq[0])
  if (uniq.length > 1) out.push(uniq.slice(1, 3).join(' '))
  if (/\b(?:termin|zahnarzt|arzt|kalender)\b/i.test(t) && !out.includes('termin')) out.push('termin')
  if (/\b(?:milch|einkauf|liste)\b/i.test(t) && !out.includes('milch')) out.push('einkauf')
  return [...new Set(out.filter(Boolean))].slice(0, 3)
}

function scoreBlob(q: string, blob: string): number {
  const n = q.toLowerCase()
  const b = blob.toLowerCase()
  if (!n || !b.includes(n.split(' ')[0] || n)) return 0
  if (b.includes(n)) return 3
  const parts = n.split(' ').filter(Boolean)
  return parts.filter((p) => b.includes(p)).length
}

function rrf(lists: RetrieveHit[][]): RetrieveHit[] {
  const k = 60
  const acc = new Map<string, RetrieveHit>()
  for (const list of lists) {
    list.forEach((hit, i) => {
      const key = `${hit.store}:${hit.title}:${hit.body.slice(0, 40)}`
      const add = 1 / (k + i + 1)
      const prev = acc.get(key)
      if (prev) prev.rank += add
      else acc.set(key, { ...hit, rank: add })
    })
  }
  return [...acc.values()].sort((a, b) => b.rank - a.rank).slice(0, 6)
}

export async function retrieve(text: string): Promise<RetrieveHit[]> {
  const qs = subQueries(text)
  if (!qs.length) return []
  const [memory, messages, convs, events, notes, reminders, shopping] = await Promise.all([
    listMemory(),
    getAll<Message>('messages'),
    getAll<Conversation>('conversations'),
    listEvents(),
    listNotes(),
    listReminders(),
    listShopping(),
  ])
  const lists: RetrieveHit[][] = []
  for (const q of qs) {
    const memHits = memory
      .map((m: MemoryItem) => ({
        store: 'memory',
        title: m.key,
        body: m.value,
        rank: scoreBlob(q, `${m.key} ${m.value}`),
      }))
      .filter((h) => h.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 8)
    const msgHits = messages
      .filter((m) => m.content.length < 400)
      .map((m) => {
        const conv = convs.find((c) => c.id === m.conversation_id)
        return {
          store: 'messages',
          title: conv?.title || 'Gespräch',
          body: m.content.replace(/\s+/g, ' ').slice(0, 140),
          rank: scoreBlob(q, m.content),
        }
      })
      .filter((h) => h.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 8)
    const evHits = events
      .map((e) => ({
        store: 'events',
        title: e.title,
        body: `${e.start_at}${e.place ? ` ${e.place}` : ''}`,
        rank: scoreBlob(q, `${e.title} ${e.place || ''}`),
      }))
      .filter((h) => h.rank > 0)
    const noteHits = notes
      .map((n) => ({
        store: 'notes',
        title: 'Notiz',
        body: n.body.slice(0, 140),
        rank: scoreBlob(q, n.body),
      }))
      .filter((h) => h.rank > 0)
    const remHits = reminders
      .map((r) => ({
        store: 'reminders',
        title: r.title,
        body: r.due_at,
        rank: scoreBlob(q, r.title),
      }))
      .filter((h) => h.rank > 0)
    const shopHits = shopping
      .map((s) => ({
        store: 'shopping',
        title: s.title,
        body: s.status,
        rank: scoreBlob(q, s.title),
      }))
      .filter((h) => h.rank > 0)
    lists.push([...memHits, ...msgHits, ...evHits, ...noteHits, ...remHits, ...shopHits])
  }
  return rrf(lists)
}

export function formatRetrieveHits(hits: RetrieveHit[]): string {
  if (!hits.length) return ''
  return hits.map((h) => `- ${h.title}: ${h.body} (${h.store})`).join('\n')
}
