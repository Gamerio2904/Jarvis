/**
 * Datei-Bibliothek ("Bibliothek" in der App): Bilder, Dokumente und Dateien
 * mit KI-Lesezugriff. Die alte Buchsuche lebt in library.ts weiter.
 *
 * Speicherregel (kein redundanter Speicher):
 * - Die Datei-Bytes liegen EINMALIG im Cache Storage (`jarvis-library-files`), nicht in IndexedDB.
 * - In der Datenbank liegt nur die Verknüpfung: Name, Typ, Tags, Zusammenfassung und Lesetext.
 * - Diese Verknüpfungen reisen mit dem Hausstand-Sync (HausBackup), damit der Hausstand
 *   trotzdem auf alles zugreifen kann, ohne die Dateien doppelt zu halten.
 * - Bilder werden beim Hochladen von Gemini beschrieben (Themen, Ideen, Inhalt),
 *   Textdateien direkt gelesen. Beides macht Einträge durchsuchbar und recall-fähig.
 */
import { completeGeminiVision, geminiReady } from './gemini.ts'
import { getAll, put, del, get, recordTombstone } from './store.ts'
import { mergeTags, normalizeTag } from './tags.ts'

const LIB_CACHE = 'jarvis-library-files'
const TEXT_LIMIT = 40_000

export type LibraryKind = 'image' | 'text' | 'pdf' | 'file'

export type LibraryEntry = {
  id: string
  name: string
  kind: LibraryKind
  mime: string
  size: number
  tags: string[]
  /** KI-Zusammenfassung: Inhalt, Themen, Ideen. */
  summary?: string
  /** Ausgelesener Text (Textdateien) für Suche und Recall. */
  text?: string
  /** Wo die Bytes liegen: auf diesem Gerät im Cache, oder auf dem Ursprungsgerät des Hausstands. */
  where: 'geraet' | 'ursprung'
  added_at: string
  /** B10: letzte Änderung (Tags, Lesetext) — ohne Zeitstempel verliert jede
   * Änderung beim Abgleich gegen den älteren Stand des anderen Geräts. */
  updated_at?: string
  read_at?: string
}

export type AddResult = {
  entry: LibraryEntry
  line: string
}

function newId(): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `lib-${Date.now().toString(36)}-${random}`
}

export function kindOf(mime: string, name: string): LibraryKind {
  const type = String(mime || '').toLowerCase()
  const lower = String(name || '').toLowerCase()
  if (type.startsWith('image/') || /\.(png|jpe?g|webp|gif|heic|heif|avif)$/.test(lower)) return 'image'
  if (type === 'application/pdf' || lower.endsWith('.pdf')) return 'pdf'
  if (
    type.startsWith('text/') ||
    ['application/json', 'application/xml', 'application/javascript', 'application/yaml'].includes(type) ||
    /\.(txt|md|markdown|csv|json|xml|ya?ml|log|ts|tsx|js|jsx|mjs|py|java|kt|swift|html|css|ini|conf|toml|sh|bat|ps1)$/.test(lower)
  ) {
    return 'text'
  }
  return 'file'
}

async function libCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null
  try {
    return await caches.open(LIB_CACHE)
  } catch {
    return null
  }
}

async function bytesToBase64(bytes: Uint8Array): Promise<string> {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** Beschreibt ein Bild mit Gemini: Inhalt, Themen, Ideen, Text im Bild. */
export async function describeImage(
  bytes: Uint8Array,
  mime: string,
  name: string,
): Promise<string> {
  if (!geminiReady()) return ''
  const base64 = await bytesToBase64(bytes)
  const prompt =
    'Du bist Ultron. Lies das Bild vollständig aus. Antworte auf Deutsch, sachlich und kompakt (max 10 Sätze) ' +
    `im Format: Inhalt: <was zeigt die Datei ${name}>. Themen: <Stichworte, Komma>. Ideen/Notizen: <erkennbare Ideen, To-dos, Zahlen, Listen>; schreibe „keine", wenn nichts da ist. ` +
    'Text im Bild: <vollständiger Textauszug oder „keiner">.'
  try {
    const reply = await completeGeminiVision(prompt, base64, mime)
    return String(reply || '').trim()
  } catch {
    return ''
  }
}

async function storeBytes(id: string, bytes: Uint8Array): Promise<boolean> {
  const cache = await libCache()
  if (!cache) return false
  try {
    await cache.put(`/jarvis-library/${id}`, new Response(bytes.slice().buffer))
    return true
  } catch {
    return false
  }
}

async function readBytes(id: string): Promise<Uint8Array | null> {
  const cache = await libCache()
  if (!cache) return null
  const hit = await cache.match(`/jarvis-library/${id}`)
  if (!hit) return null
  const buffer = await hit.arrayBuffer()
  return new Uint8Array(buffer)
}

async function dropBytes(id: string): Promise<void> {
  const cache = await libCache()
  if (!cache) return
  try {
    await cache.delete(`/jarvis-library/${id}`)
  } catch {
    /* Cache fehlt — nichts zu löschen */
  }
}

function emitLibrary(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('jarvis-library'))
}

export async function addLibraryFiles(
  files: { name: string; mime: string; bytes: Uint8Array }[],
): Promise<AddResult[]> {
  const results: AddResult[] = []
  for (const file of files) {
    const kind = kindOf(file.mime, file.name)
    const entry: LibraryEntry = {
      id: newId(),
      name: file.name || 'datei',
      kind,
      mime: file.mime || 'application/octet-stream',
      size: file.bytes.length,
      tags: [],
      where: 'geraet',
      added_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const stored = await storeBytes(entry.id, file.bytes)
    if (!stored) entry.where = 'ursprung'
    let line = ''
    if (kind === 'image') {
      const summary = await describeImage(file.bytes, entry.mime, entry.name)
      if (summary) {
        entry.summary = summary
        entry.read_at = new Date().toISOString()
        line = stored ? 'Bild gelesen und verknüpft.' : 'Bild gelesen; Bytes liegen am Ursprungsgerät.'
      } else {
        line = 'Bild verknüpft (kein Gemini-Key — Bild ist trotzdem abrufbar).'
      }
    } else if (kind === 'text') {
      const text = new TextDecoder().decode(file.bytes.subarray(0, TEXT_LIMIT))
      entry.text = text
      entry.summary = text.slice(0, 240).replace(/\s+/g, ' ').trim()
      entry.read_at = new Date().toISOString()
      line = 'Text gelesen und verknüpft.'
    } else if (kind === 'pdf') {
      line = 'PDF verknüpft (Inhaltsauslesung folgt in einem nächsten Stand).'
    } else {
      line = 'Datei verknüpft.'
    }
    await put('library', entry)
    emitLibrary()
    results.push({ entry, line })
  }
  return results
}

export async function listLibrary(): Promise<LibraryEntry[]> {
  const rows = await getAll<LibraryEntry>('library')
  return rows.sort((a, b) => (a.added_at < b.added_at ? 1 : -1))
}

export async function getLibraryEntry(id: string): Promise<LibraryEntry | null> {
  return (await get<LibraryEntry>('library', id)) || null
}

export async function updateLibraryTags(id: string, tags: string[]): Promise<LibraryEntry> {
  const row = await get<LibraryEntry>('library', id)
  if (!row) throw new Error('Der Bibliothekseintrag existiert nicht mehr.')
  const updated: LibraryEntry = { ...row, tags: mergeTags(tags), updated_at: new Date().toISOString() }
  await put('library', updated)
  emitLibrary()
  return updated
}

export async function deleteLibraryEntry(id: string): Promise<void> {
  if (!(await get<LibraryEntry>('library', id))) throw new Error('Der Bibliothekseintrag existiert nicht mehr.')
  await dropBytes(id)
  recordTombstone(id)
  await del('library', id)
  emitLibrary()
}

/** Blob-URL für Vorschau; null, wenn die Bytes auf dem Ursprungsgerät liegen. */
export async function libraryPreviewUrl(id: string): Promise<string | null> {
  const bytes = await readBytes(id)
  if (!bytes) return null
  return URL.createObjectURL(new Blob([bytes.slice().buffer]))
}

export async function readLibraryText(id: string): Promise<string | null> {
  const entry = await getLibraryEntry(id)
  if (!entry) return null
  if (entry.kind === 'text' && entry.text) return entry.text
  if (entry.kind !== 'image') return null
  const bytes = await readBytes(id)
  if (!bytes) return null
  const summary = await describeImage(bytes, entry.mime, entry.name)
  if (summary) {
    await put('library', { ...entry, summary, read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    emitLibrary()
  }
  return summary || null
}

function tokensOf(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-zäöüß0-9]+/i)
    .filter((word) => word.length > 2)
}

export function scoreEntry(query: string, entry: LibraryEntry): number {
  const blob = [
    entry.name,
    (entry.tags || []).map(normalizeTag).join(' '),
    entry.summary || '',
    entry.text || '',
  ]
    .join(' ')
    .toLowerCase()
  const words = [...new Set(tokensOf(query))]
  if (!words.length) return 0
  const hits = words.filter((word) => blob.includes(word)).length
  return hits / words.length
}

export async function searchLibrary(query: string): Promise<LibraryEntry[]> {
  const rows = await listLibrary()
  return rows
    .map((entry) => ({ entry, score: scoreEntry(query, entry) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((hit) => hit.entry)
}
