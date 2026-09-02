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
import { formatDue } from './remind-parse.ts'

export type RetrieveHit = {
  store: string
  title: string
  body: string
  rank: number
}

const STOP = new Set(
  'der die das den dem des ein eine einer einem einen und oder aber mit von zu im in am auf aus für fürs als wie was wer wo wann warum dass ist sind war hat habe ich wir sie du mir mich uns ihr eure mein meine dein keine kein noch nur auch schon mal bitte doch über uber weißt weisst weiß weiss stand hatte gerade ohne kennst kennt davon dazu darüber darueber sagst gesagt liegt geben'.split(
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

export function isDumpLine(content: string): boolean {
  const t = (content || '').replace(/\s+/g, ' ').trim()
  if (!t) return true
  if (/^\s*gefunden:/i.test(t)) return true
  if (/(?:zeig mir london|fahr mich zu einer tanke)\s*:/i.test(t)) return true
  const colons = (t.match(/:\s/g) || []).length
  if (colons >= 3 && /(?:^|\s)•\s/.test(content)) return true
  if (colons >= 4 && t.length > 100) return true
  return false
}

function isDebugConversation(c: Conversation | undefined): boolean {
  return Boolean(c && /^Debug \d{4}-/.test(c.title || ''))
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
        rank: scoreBlob(q, `${m.key} ${m.value}`) + 1.5,
      }))
      .filter((h) => h.rank > 1.5)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 8)
    const msgHits = messages
      .filter((m) => {
        if (m.content.length >= 400) return false
        if (m.role === 'assistant' && isDumpLine(m.content)) return false
        const conv = convs.find((c) => c.id === m.conversation_id)
        if (isDebugConversation(conv)) return false
        return true
      })
      .map((m) => {
        const snippet = m.content.replace(/\s+/g, ' ').slice(0, 140)
        return {
          store: 'messages',
          title: snippet.slice(0, 48),
          body: snippet,
          rank: scoreBlob(q, m.content),
        }
      })
      .filter((h) => h.rank >= 2)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 8)
    const evHits = events
      .map((e) => ({
        store: 'events',
        title: e.title,
        body: `${e.start_at}${e.place ? ` ${e.place}` : ''}`,
        rank: scoreBlob(q, `${e.title} ${e.place || ''}`) + 2,
      }))
      .filter((h) => h.rank > 2)
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
    lists.push([...memHits, ...evHits, ...noteHits, ...remHits, ...shopHits, ...msgHits])
  }
  return rrf(lists)
}

const STORE_ORDER = ['events', 'memory', 'reminders', 'notes', 'shopping', 'messages']

function pickRecallHits(hits: RetrieveHit[]): RetrieveHit[] {
  const hard = hits.filter((h) => h.store !== 'messages')
  const msgs = hits.filter((h) => h.store === 'messages')
  const sort = (xs: RetrieveHit[]) =>
    [...xs].sort((a, b) => {
      const da = STORE_ORDER.indexOf(a.store)
      const db = STORE_ORDER.indexOf(b.store)
      const ia = da < 0 ? 9 : da
      const ib = db < 0 ? 9 : db
      if (ia !== ib) return ia - ib
      return b.rank - a.rank
    })
  const primary = sort(hard).slice(0, 3)
  if (primary.length) return primary
  return msgs.slice(0, 2)
}

function formatEventWhen(body: string): string {
  const iso = body.trim().split(/\s/)[0]
  if (!/^\d{4}-/.test(iso)) return body.trim()
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return body.trim()
  return formatDue(d)
}

function formatOneHit(h: RetrieveHit): string {
  if (h.store === 'events') {
    const when = formatEventWhen(h.body)
    return `Kalender: ${h.title}${when ? ` — ${when}` : ''}.`
  }
  if (h.store === 'reminders') {
    const when = formatEventWhen(h.body)
    return `Erinnerung: ${h.title}${when ? ` — ${when}` : ''}.`
  }
  if (h.store === 'memory') {
    if (h.title === 'name') return `Pin: Sie heißen ${h.body}.`
    if (h.title === 'zuhause') return `Pin: Zuhause ist ${h.body}.`
    if (h.title === 'getränk') return `Pin: Sie trinken ${h.body}.`
    if (h.title === 'essen') return `Pin: Sie essen ${h.body}.`
    return `Pin: ${h.body}.`
  }
  if (h.store === 'shopping') return `Einkauf: ${h.title}.`
  if (h.store === 'notes') return `Notiz: ${h.body}${/[.!?]$/.test(h.body) ? '' : '.'}`
  return `Gespräch: ${h.body.replace(/\s+/g, ' ').trim()}`
}

export function formatRecallReply(query: string, hits: RetrieveHit[]): string {
  if (!hits.length) return `Nichts Belegtes zu „${query}“ in den lokalen Speichern.`
  const lines = pickRecallHits(hits).map(formatOneHit).filter(Boolean)
  if (!lines.length) return `Nichts Belegtes zu „${query}“ in den lokalen Speichern.`
  return lines.join(' ')
}

export function formatRetrieveHits(hits: RetrieveHit[]): string {
  if (!hits.length) return ''
  return hits.map((h) => `- ${h.title}: ${h.body} (${h.store})`).join('\n')
}
