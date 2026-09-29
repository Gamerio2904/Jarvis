import { aliasMembers, extractEntities, memberInBlob } from './memory-alias.ts'
import { writeMemory } from './memory-gate.ts'
import { listMemory, listReminders, type MemoryItem, type Reminder } from './store.ts'

const MONTHS = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

const PERSON_WHO =
  /^\s*wer\s+ist\s+(?:meine|mein|meine\s+eigene)\s+([a-zäöüß]+)\b/i
const PERSON_WHEN =
  /^\s*wann\s+(?:hat|ist)\s+(?:die\s+|der\s+|das\s+|meine\s+|mein\s+)?(.+?)\s+geburtstag\s*$/i

export function isPersonClusterAsk(text: string): boolean {
  const t = (text || '').trim()
  if (!t || t.length > 160) return false
  if (/^\s*was\s+weißt\s+du\s+über\s+mich\b/i.test(t)) return false
  if (PERSON_WHO.test(t)) return true
  if (PERSON_WHEN.test(t)) return true
  return false
}

export function personClusterTopic(text: string): string | null {
  const t = (text || '').trim()
  const who = PERSON_WHO.exec(t)
  if (who) return who[1].replace(/[.!?]+$/g, '').trim()
  const when = PERSON_WHEN.exec(t)
  if (when) return when[1].replace(/[.!?]+$/g, '').replace(/^der\s+|^die\s+|^das\s+/i, '').trim()
  return null
}

export function formatBirthdayValue(value: string): string {
  const m = /^(\d{1,2})\.(\d{1,2})\.?$/.exec((value || '').trim())
  if (!m) return (value || '').replace(/\.+$/, '').trim()
  const day = Number(m[1])
  const month = Number(m[2])
  const name = MONTHS[month]
  if (!name) return `${day}.${month}.`
  return `${day}. ${name}`
}

export function displayPersonName(key: string): string {
  const k = (key || '').trim()
  if (!k) return ''
  return k.replace(/^\w/, (c) => c.toUpperCase())
}

function topicAliases(query: string): string[] {
  const topic = personClusterTopic(query) || query
  const first = topic.split(/\s+/).filter((w) => w.length > 2)[0] || topic
  return [...new Set(aliasMembers(first).map((x) => x.toLowerCase()))]
}

function rowMatchesPerson(row: { key: string; value: string; entities?: string[] }, aliases: string[]): boolean {
  const blob = `${row.key} ${row.value} ${(row.entities || []).join(' ')}`.toLowerCase()
  return aliases.some((a) => memberInBlob(blob, a, true) || (row.entities || []).map((e) => e.toLowerCase()).includes(a))
}

export function personClusterReply(
  query: string,
  _hits: Array<{ store: string; title: string; body: string }>,
  memory: MemoryItem[],
  reminders: Reminder[] = [],
): string | null {
  if (!isPersonClusterAsk(query)) return null
  const aliases = topicAliases(query)
  const rows = memory.filter((m) => rowMatchesPerson(m, aliases))
  const birthday = rows.find((m) => m.category === 'birthday')
  const reminder = reminders.find((r) => {
    if (r.status && r.status !== 'open') return false
    const title = r.title || ''
    if (!/Geburtstag/i.test(title) && r.kind !== 'birthday') return false
    const who = title.replace(/^Geburtstag\s+/i, '').trim()
    if (!who) return false
    const names = aliasMembers(who).map((x) => x.toLowerCase())
    return aliases.some((a) => names.includes(a) || memberInBlob(who, a, true))
  })
  const dateRaw = birthday?.value || ''
  let date = dateRaw ? formatBirthdayValue(dateRaw) : ''
  if (!date && reminder?.due_at) {
    const d = new Date(reminder.due_at)
    if (!Number.isNaN(d.getTime())) date = `${d.getDate()}. ${MONTHS[d.getMonth() + 1]}`
  }
  const nameKey = birthday?.key || rows[0]?.key || aliases[0] || ''
  const name = displayPersonName(nameKey)
  if (!name) return `Nichts Belegtes zu „${query}“ in den lokalen Speichern.`
  const wantPlace = /\b(wohn|ort|adresse)\b/i.test(query)
  const wantTel = /\b(tel|telefon|nummer|anruf)\b/i.test(query)
  const place = wantPlace ? rows.find((m) => m.category === 'place') : undefined
  const tel = wantTel ? rows.find((m) => m.category === 'contact') : undefined
  if (date) {
    let line = `${name} hat am ${date} Geburtstag.`
    if (place?.value) line += ` Wohnort: ${place.value}.`
    if (tel?.value) line += ` Tel ${tel.value}.`
    return line
  }
  if (!birthday && !reminder && !rows.length) {
    return `Nichts Belegtes zu „${query}“ in den lokalen Speichern.`
  }
  return `${name}.`
}

export async function rememberPersonPin(
  name: string,
  value: string,
  category: string,
  conversationId?: string,
): Promise<void> {
  const key = (name || '').trim()
  if (!key || !value.trim()) return
  await writeMemory({
    key,
    value: value.trim(),
    category,
    conversationId,
    spoken: `${key} ${value}`,
    entities: extractEntities(key, value),
    origin: 'user',
  })
}

export async function backfillBirthdayEntities(rows?: MemoryItem[]): Promise<void> {
  const list = rows || (await listMemory())
  for (const row of list) {
    if (row.category !== 'birthday') continue
    if (row.entities && row.entities.length) continue
    const entities = extractEntities(row.key, row.value)
    if (!entities.length) continue
    await writeMemory({
      key: row.key,
      value: row.value,
      category: row.category,
      conversationId: row.source_conversation_id || undefined,
      entities,
      origin: row.origin || 'user',
      kind: row.kind,
    })
  }
}

export async function loadClusterStores(): Promise<{ memory: MemoryItem[]; reminders: Reminder[] }> {
  const [memory, reminders] = await Promise.all([listMemory(), listReminders()])
  return { memory, reminders }
}
