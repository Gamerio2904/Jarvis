import {
  getAll,
  listEvents,
  listMemory,
  listNotes,
  listReminders,
  listShopping,
  type CalendarEvent,
  type Conversation,
  type MemoryItem,
  type Message,
  type Note,
  type Reminder,
  type ShoppingItem,
} from './store.ts'
import { formatDue } from './remind-parse.ts'
import { qualityPack } from './quality-pack.ts'
import { aliasQueries, expandBlob, utteranceHints } from './memory-alias.ts'
import { rowKind } from './memory-layer.ts'
import { rememberRecallHits } from './memory-experience.ts'

function normQuery(s: string): string {
  return (s || '').toLowerCase().replace(/[.?!…]+/g, '').replace(/\s+/g, ' ').trim()
}

function isQueryEcho(query: string, content: string): boolean {
  const q = normQuery(query)
  const c = normQuery(content)
  return Boolean(q) && (c === q || c.startsWith(`${q} `))
}

export type RetrieveHit = {
  store: string
  title: string
  body: string
  rank: number
  id?: string
}

/** Token+RRF retrieve. e5 never pickRoute. HNSW/Qdrant Won’t — linear scan of IndexedDB. */
const STOP = new Set(
  'der die das den dem des ein eine einer einem einen und oder aber mit von zu im in am auf aus für fürs als wie was wer wo wann warum dass ist sind war hat habe ich wir sie du mir mich uns ihr eure mein meine dein keine kein noch nur auch schon mal bitte doch über uber weißt weisst weiß weiss stand hatte gerade ohne kennst kennt davon dazu darüber darueber sagst gesagt liegt geben welche wollte machen'.split(
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
  for (const a of aliasQueries(t)) out.push(a)
  return [...new Set(out.filter(Boolean))].slice(0, 5)
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

function memoryBlob(m: MemoryItem): string {
  return expandBlob([m.key, m.value, ...(m.entities || []), m.parent_key || '', m.kind || ''].join(' '))
}

export function boostMemoryRank(text: string, m: MemoryItem, rank: number): number {
  const hints = utteranceHints(text)
  let r = rank
  const ents = (m.entities || []).map((e) => e.toLowerCase())
  const blob = `${m.key} ${m.value}`.toLowerCase()
  if (hints.entities.length && hints.entities.some((e) => ents.includes(e) || blob.includes(e))) r += 0.4
  if (hints.kind && rowKind(m) === hints.kind) r += 0.3
  if (hints.tense && hints.tense !== 'unknown' && m.tense === hints.tense) r += 0.3
  return r
}

export function structuredMemoryPool(text: string, memory: MemoryItem[]): MemoryItem[] | null {
  const hints = utteranceHints(text)
  if (!hints.kind && !hints.entities.length) return null
  const filtered = memory.filter((m) => {
    if (hints.kind && rowKind(m) !== hints.kind) return false
    if (hints.tense && hints.tense !== 'unknown' && m.tense && m.tense !== 'unknown' && m.tense !== hints.tense) {
      return false
    }
    if (hints.entities.length) {
      const blob = memoryBlob(m).toLowerCase()
      const ents = (m.entities || []).map((e) => e.toLowerCase())
      if (!hints.entities.some((e) => blob.includes(e) || ents.includes(e))) return false
    }
    return true
  })
  if (hints.kind) return filtered
  return filtered.length ? filtered : null
}

function rrf(lists: RetrieveHit[][]): RetrieveHit[] {
  const k = 60
  const acc = new Map<string, RetrieveHit>()
  for (const list of lists) {
    list.forEach((hit, i) => {
      const key = `${hit.store}:${hit.id || hit.title}:${hit.body.slice(0, 40)}`
      const add = 1 / (k + i + 1)
      const prev = acc.get(key)
      if (prev) prev.rank += add
      else acc.set(key, { ...hit, rank: add })
    })
  }
  return [...acc.values()].sort((a, b) => b.rank - a.rank)
}

function expandHops(hits: RetrieveHit[], memory: MemoryItem[]): RetrieveHit[] {
  const have = new Set(hits.filter((h) => h.store === 'memory').map((h) => h.id || `${h.title}:${h.body.slice(0, 40)}`))
  const extra: RetrieveHit[] = []
  for (const h of hits) {
    if (h.store !== 'memory' || extra.length >= 2) continue
    const row = memory.find((m) => m.id === h.id || (m.key === h.title && m.value === h.body))
    if (!row?.related_ids?.length) continue
    for (const id of row.related_ids) {
      if (extra.length >= 2) break
      const n = memory.find((m) => m.id === id)
      if (!n) continue
      const key = n.id
      if (have.has(key)) continue
      have.add(key)
      extra.push({ store: 'memory', title: n.key, body: n.value, rank: h.rank * 0.5, id: n.id })
    }
  }
  if (!extra.length) return hits
  return [...hits, ...extra]
}

export type RetrieveCorpus = {
  memory: MemoryItem[]
  messages?: Message[]
  convs?: Conversation[]
  events?: CalendarEvent[]
  notes?: Note[]
  reminders?: Reminder[]
  shopping?: ShoppingItem[]
}

export function retrieveFromCorpus(text: string, corpus: RetrieveCorpus): RetrieveHit[] {
  const qs = subQueries(text)
  if (!qs.length) return []
  const memory = corpus.memory || []
  const messages = corpus.messages || []
  const convs = corpus.convs || []
  const events = corpus.events || []
  const notes = corpus.notes || []
  const reminders = corpus.reminders || []
  const shopping = corpus.shopping || []
  const pool = structuredMemoryPool(text, memory)
  const memSource = pool === null ? memory : pool
  const lists: RetrieveHit[][] = []
  for (const q of qs) {
    const memHits = memSource
      .map((m: MemoryItem) => ({
        store: 'memory',
        title: m.key,
        body: m.value,
        id: m.id,
        rank: boostMemoryRank(text, m, scoreBlob(q, memoryBlob(m)) + 1.5),
      }))
      .filter((h) => h.rank > 1.5)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 8)
    const msgHits = messages
      .filter((m) => {
        if (m.content.length >= 400) return false
        if (m.role === 'assistant' && isDumpLine(m.content)) return false
        if (isQueryEcho(text, m.content)) return false
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
  const fused = expandHops(rrf(lists), memory).sort((a, b) => b.rank - a.rank).slice(0, 6)
  return applyE5Rerank(fused)
}

export async function retrieve(text: string): Promise<RetrieveHit[]> {
  const [memory, messages, convs, events, notes, reminders, shopping] = await Promise.all([
    listMemory(),
    getAll<Message>('messages'),
    getAll<Conversation>('conversations'),
    listEvents(),
    listNotes(),
    listReminders(),
    listShopping(),
  ])
  const hits = retrieveFromCorpus(text, { memory, messages, convs, events, notes, reminders, shopping })
  rememberRecallHits(hits)
  return hits
}

/** e5 only reranks retrieve hits. Missing model = RRF unchanged. Never pickRoute. HNSW/Qdrant Won’t. */
export function applyE5Rerank(hits: RetrieveHit[]): RetrieveHit[] {
  const st = qualityPack('e5')
  if (!st.wanted || !st.ready) return hits
  return hits
}

const STORE_ORDER = ['events', 'memory', 'reminders', 'notes', 'shopping', 'messages']

export function pickRecallHits(query: string, hits: RetrieveHit[]): RetrieveHit[] {
  const hints = utteranceHints(query)
  const memHits = hits.filter((h) => h.store === 'memory')
  const hard = hits.filter((h) => h.store !== 'messages')
  const msgs = hits.filter((h) => h.store === 'messages' && !isQueryEcho(query, h.body))
  const sort = (xs: RetrieveHit[]) =>
    [...xs].sort((a, b) => {
      const da = STORE_ORDER.indexOf(a.store)
      const db = STORE_ORDER.indexOf(b.store)
      const ia = da < 0 ? 9 : da
      const ib = db < 0 ? 9 : db
      if (ia !== ib) return ia - ib
      return b.rank - a.rank
    })
  if (hints.kind === 'goal' && !memHits.length) {
    const other = sort(hard.filter((h) => h.store !== 'memory')).slice(0, 3)
    return other
  }
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
  const picked = pickRecallHits(query, hits)
  if (!picked.length) return `Nichts Belegtes zu „${query}“ in den lokalen Speichern.`
  const lines = picked.map(formatOneHit).filter(Boolean)
  if (!lines.length) return `Nichts Belegtes zu „${query}“ in den lokalen Speichern.`
  return lines.join(' ')
}

export function formatRetrieveHits(hits: RetrieveHit[]): string {
  if (!hits.length) return ''
  return hits.map((h) => `- ${h.title}: ${h.body} (${h.store})`).join('\n')
}
