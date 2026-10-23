/** Tags für Todos, Notizen und Bibliothek. Farbiger Rahmen + Filter + Sortierung. */

const TAG_RE = /(^|\s)#([a-zäöüß0-9][a-zäöüß0-9_-]{1,23})/gi
const TAG_CLEAN = /[^a-zäöüß0-9_-]/gi

export function normalizeTag(raw: string): string {
  const tag = String(raw || '')
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(TAG_CLEAN, '')
    .slice(0, 24)
  return tag
}

/** Zieht #tags aus Freitext und liefert sie ohne Raute. */
export function extractTags(text: string): string[] {
  const out: string[] = []
  for (const match of String(text || '').matchAll(TAG_RE)) {
    const tag = normalizeTag(match[2])
    if (tag && !out.includes(tag)) out.push(tag)
  }
  return out
}

/** Entfernt #tags aus einem Todo-Titel (Notiz-Body behält sie). */
export function stripTags(text: string): string {
  return String(text || '')
    .replace(TAG_RE, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function mergeTags(...groups: (string[] | undefined | null)[]): string[] {
  const out: string[] = []
  for (const group of groups) {
    for (const raw of group || []) {
      const tag = normalizeTag(raw)
      if (tag && !out.includes(tag)) out.push(tag)
    }
  }
  return out
}

/** Stabile Farbe pro Tag: gleiche Tags bekommen immer denselben Rahmen. */
export function tagColor(tag: string): string {
  const name = normalizeTag(tag) || 'tag'
  let hash = 5381
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) + hash + name.charCodeAt(i)) & 0xffffffff
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 62%, 58%)`
}

export function tagColorSoft(tag: string): string {
  const name = normalizeTag(tag) || 'tag'
  let hash = 5381
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) + hash + name.charCodeAt(i)) & 0xffffffff
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 45%, 22%)`
}

export function allTags(items: { tags?: string[] | null }[]): string[] {
  const out: string[] = []
  for (const item of items) {
    for (const raw of item.tags || []) {
      const tag = normalizeTag(raw)
      if (tag && !out.includes(tag)) out.push(tag)
    }
  }
  return out.sort((a, b) => a.localeCompare(b, 'de-DE'))
}

export function filterByTags<T extends { tags?: string[] | null }>(items: T[], active: string[]): T[] {
  if (!active.length) return items
  return items.filter((item) => {
    const tags = (item.tags || []).map(normalizeTag)
    return active.every((tag) => tags.includes(normalizeTag(tag)))
  })
}

/** Sortiert nach erstem Tag (A–Z), nicht getagte ans Ende, darin neueste zuerst. */
export function sortByTags<T extends { tags?: string[] | null; updated_at?: string; created_at?: string }>(items: T[]): T[] {
  const stamp = (item: T) => item.updated_at || item.created_at || ''
  return [...items].sort((a, b) => {
    const at = (a.tags || [])[0] || '\uffff'
    const bt = (b.tags || [])[0] || '\uffff'
    if (at !== bt) return at.localeCompare(bt, 'de-DE')
    return stamp(b).localeCompare(stamp(a))
  })
}
