import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteLibraryEntry,
  libraryPreviewUrl,
  listLibrary,
  searchLibrary,
  updateLibraryTags,
  type LibraryEntry,
} from '../engine/files.ts'
import { allTags, filterByTags, tagColor } from '../engine/tags.ts'

function prettySize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} kB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function kindLabel(kind: LibraryEntry['kind']): string {
  if (kind === 'image') return 'Bild'
  if (kind === 'text') return 'Text'
  if (kind === 'pdf') return 'PDF'
  return 'Datei'
}

export function LibraryOverlay({ onClose, leaving = false }: { onClose: () => void; leaving?: boolean }) {
  const [entries, setEntries] = useState<LibraryEntry[]>([])
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sortByTag, setSortByTag] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [detail, setDetail] = useState<LibraryEntry | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [tagDraft, setTagDraft] = useState('')
  const [searchResults, setSearchResults] = useState<LibraryEntry[]>([])
  const fileRef = useRef<HTMLInputElement | null>(null)

  const refresh = useCallback(async () => {
    try {
      setEntries(await listLibrary())
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Bibliothek konnte nicht geladen werden.')
    }
  }, [])

  useEffect(() => {
    void refresh()
    window.addEventListener('jarvis-library', refresh)
    return () => window.removeEventListener('jarvis-library', refresh)
  }, [refresh])

  useEffect(() => {
    let dead = false
    if (!detail) {
      setPreview(null)
      return
    }
    void libraryPreviewUrl(detail.id).then((url) => {
      if (!dead) setPreview(url)
    })
    return () => {
      dead = true
    }
  }, [detail])

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return
    const jobs: { name: string; mime: string; bytes: Uint8Array }[] = []
    for (const file of Array.from(files)) {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer())
        jobs.push({ name: file.name, mime: file.type || '', bytes })
      } catch {
        setError(`${file.name} konnte nicht gelesen werden.`)
      }
    }
    if (!jobs.length) return
    setBusy(`${jobs.length} ${jobs.length === 1 ? 'Datei' : 'Dateien'} werden gelesen…`)
    try {
      const { addLibraryFiles } = await import('../engine/files.ts')
      await addLibraryFiles(jobs)
      await refresh()
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Hochladen fehlgeschlagen.')
    } finally {
      setBusy('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function remove(id: string) {
    try {
      await deleteLibraryEntry(id)
      if (detail?.id === id) setDetail(null)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Löschen fehlgeschlagen.')
    }
  }

  async function saveTags(entry: LibraryEntry) {
    const tags = tagDraft
      .split(/[,\s]+/)
      .map((raw) => raw.replace(/^#/, '').trim())
      .filter(Boolean)
    try {
      await updateLibraryTags(entry.id, tags)
      setTagDraft('')
      await refresh()
      const next = await (await import('../engine/files.ts')).getLibraryEntry(entry.id)
      setDetail(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tags konnten nicht gespeichert werden.')
    }
  }

  async function reread(entry: LibraryEntry) {
    setBusy(`Lese „${entry.name}“ noch einmal…`)
    try {
      await (await import('../engine/files.ts')).readLibraryText(entry.id)
      await refresh()
      const next = await (await import('../engine/files.ts')).getLibraryEntry(entry.id)
      setDetail(next)
      setError('')
    } finally {
      setBusy('')
    }
  }

  useEffect(() => {
    let dead = false
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    void searchLibrary(query).then((rows) => {
      if (!dead) setSearchResults(rows)
    })
    return () => {
      dead = true
    }
  }, [query])

  const pool = query.trim() ? searchResults : entries
  const visible = sortByTag
    ? filterByTags(pool, activeTags).sort((a, b) => ((a.tags || [])[0] || '').localeCompare((b.tags || [])[0] || ''))
    : filterByTags(pool, activeTags)
  const tags = allTags(entries)

  return (
    <div className={`watch-overlay notes-overlay library-overlay fx-in${leaving ? ' is-leaving' : ''}`}>
      <header className="watch-head">
        <div>
          <h2>Bibliothek</h2>
          <p>
            {entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'} · Dateien liegen einmalig, Verknüpfungen gehen in den Hausstand
          </p>
        </div>
        <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>Fertig</button>
      </header>
      {error ? <p className="notes-error" role="alert">{error}</p> : null}
      {busy ? <p className="library-busy">{busy}</p> : null}
      <div className="notes-toolbar">
        <input
          type="search"
          aria-label="Bibliothek durchsuchen"
          placeholder="Bibliothek durchsuchen (Name, Inhalt, Ideen)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="button" className="ghost-btn" onClick={() => fileRef.current?.click()}>Hochladen</button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,text/*,application/pdf,application/json,.md,.csv,.txt,.log,.pdf"
          hidden
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>
      {tags.length ? (
        <div className="tag-filter-row" role="group" aria-label="Nach Tag filtern">
          <button
            type="button"
            className={`tag-chip${activeTags.length ? '' : ' is-on'}`}
            onClick={() => setActiveTags([])}
          >
            Alle
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-chip${activeTags.includes(tag) ? ' is-on' : ''}`}
              style={activeTags.includes(tag) ? { borderColor: tagColor(tag), color: tagColor(tag) } : undefined}
              onClick={() =>
                setActiveTags((current) => (current.includes(tag) ? current.filter((row) => row !== tag) : [...current, tag]))
              }
            >
              #{tag}
            </button>
          ))}
          <button
            type="button"
            className={`tag-chip${sortByTag ? ' is-on' : ''}`}
            onClick={() => setSortByTag((on) => !on)}
            aria-pressed={sortByTag}
          >
            nach Tag sortieren
          </button>
        </div>
      ) : null}
      <div className="notes-list">
        {visible.map((entry) => (
          <div key={entry.id} className="notes-card-row">
            <button
              type="button"
              className="notes-card workbench-card library-card"
              style={entry.tags?.length ? { borderColor: tagColor(entry.tags[0]) } : undefined}
              onClick={() => {
                setTagDraft((entry.tags || []).join(' '))
                setDetail(entry)
              }}
            >
              <strong>
                <span className="library-kind">{kindLabel(entry.kind)}</span> {entry.name}
              </strong>
              <span>
                {prettySize(entry.size)}
                {entry.summary ? ` · ${entry.summary.replace(/\s+/g, ' ').slice(0, 90)}` : ''}
              </span>
              {entry.tags?.length ? (
                <span className="tag-chip-row">
                  {entry.tags.map((tag) => (
                    <em key={tag} className="tag-chip is-static" style={{ borderColor: tagColor(tag), color: tagColor(tag) }}>
                      #{tag}
                    </em>
                  ))}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="ghost-btn notes-del"
              aria-label={`Bibliothekseintrag löschen: ${entry.name}`}
              onClick={() => void remove(entry.id)}
            >
              Löschen
            </button>
          </div>
        ))}
        {!visible.length ? (
          <p className="watch-empty">
            {query || activeTags.length ? 'Nichts gefunden.' : 'Noch leer. Bilder oder Dokumente hochladen — ich lese sie und merke mir die Inhalte.'}
          </p>
        ) : null}
      </div>
      {detail ? (
        <>
          <div className="shop-sheet-backdrop" onClick={() => setDetail(null)} aria-hidden />
          <section className="notes-editor-sheet library-detail fx-in" aria-label={`Bibliothekseintrag: ${detail.name}`}>
            <header className="watch-head">
              <div>
                <h2>{detail.name}</h2>
                <p>
                  {kindLabel(detail.kind)} · {prettySize(detail.size)} ·{' '}
                  {detail.where === 'geraet' ? 'auf diesem Gerät' : 'auf dem Ursprungsgerät'}
                </p>
              </div>
              <button type="button" className="ghost-btn cal-toolbar-btn" onClick={() => setDetail(null)}>Fertig</button>
            </header>
            {detail.kind === 'image' && preview ? (
              <img className="library-preview" src={preview} alt={`Vorschau: ${detail.name}`} />
            ) : null}
            {detail.kind === 'text' && detail.text ? <pre className="library-text">{detail.text.slice(0, 1200)}</pre> : null}
            <div className="library-summary">
              <h3>Was drin ist</h3>
              <p>
                {detail.summary ||
                  (detail.kind === 'image'
                    ? 'Noch nicht gelesen — unten „Nochmal lesen“ antippen (braucht Gemini-Key).'
                    : 'Kein Lesetext für diesen Typ.')}
              </p>
            </div>
            <label className="library-tag-edit">
              Tags (Leerzeichen oder Komma)
              <input
                value={tagDraft}
                placeholder="projekt ideen ecommerce"
                onChange={(event) => setTagDraft(event.target.value)}
              />
            </label>
            <div className="notes-actions">
              {detail.kind === 'image' ? (
                <button type="button" className="ghost-btn" onClick={() => void reread(detail)}>Nochmal lesen</button>
              ) : null}
              <button type="button" className="ghost-btn is-danger" onClick={() => void remove(detail.id)}>Löschen</button>
              <button type="button" className="cal-add-btn" onClick={() => void saveTags(detail)}>Tags speichern</button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
