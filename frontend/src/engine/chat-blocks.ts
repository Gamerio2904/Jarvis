/** Getippte Chat-Teile. Nur Parser schreiben Blöcke — nie das Modell. */

export type ChatBlock =
  | { kind: 'table'; caption: string; columns: string[]; rows: string[][]; source?: string }
  | { kind: 'chess'; fen: string }
  | { kind: 'image'; src: string; alt: string; source: string }

export function parseChatBlocks(raw: unknown): ChatBlock[] {
  if (!Array.isArray(raw)) return []
  const out: ChatBlock[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    if (o.kind === 'table' && Array.isArray(o.columns) && Array.isArray(o.rows)) {
      out.push({
        kind: 'table',
        caption: String(o.caption || ''),
        columns: o.columns.map((c) => String(c)),
        rows: o.rows.map((r) => (Array.isArray(r) ? r.map((c) => String(c)) : [])),
        source: o.source ? String(o.source) : undefined,
      })
      continue
    }
    if (o.kind === 'chess' && typeof o.fen === 'string' && o.fen.trim()) {
      out.push({ kind: 'chess', fen: o.fen.trim() })
      continue
    }
    // Ein Bild ohne Quelle wird verworfen, nicht quellenlos gezeigt: das ist
    // das Abbruchkriterium aus `70-next.md` §7, hier fail-closed umgesetzt.
    if (o.kind === 'image' && typeof o.src === 'string' && o.src.trim() && String(o.source || '').trim()) {
      out.push({
        kind: 'image',
        src: o.src.trim(),
        alt: String(o.alt || ''),
        source: String(o.source).trim(),
      })
    }
  }
  return out
}

/** Tabellen und Bretter nicht in 1–2 Sätze umschreiben — sonst stirbt die Struktur. */
export function skipMicroMerge(reply: string, blocks?: ChatBlock[] | null): boolean {
  if (blocks?.length) return true
  const t = (reply || '').trim()
  if (!t) return false
  if (/\n/.test(t) && t.split('\n').length >= 3) return true
  if (/^platz\s+verein/i.test(t)) return true
  if (
    /\b(?:wann soll ich sie erinnern|steht im kalender|termin umbenannt|termin weg:|auf die liste|timer läuft|nichts geändert|ich rate nicht|geht nicht\.|ich versuche|ich lade neu|liegt auf der watchliste|liegt bei den lieblingen|weg von der watchliste|weg von den lieblingen|zu den lieblingen)\b/i.test(
      t,
    )
  ) {
    return true
  }
  return false
}
