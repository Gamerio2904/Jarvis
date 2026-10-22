import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { addNote, deleteNote, listNotes, updateNote, type Note } from '../engine/store.ts'

export function NotesOverlay({ onClose, leaving = false }: { onClose: () => void; leaving?: boolean }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [query, setQuery] = useState('')
  const [body, setBody] = useState('')
  const [editing, setEditing] = useState<Note | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [sheetDrag, setSheetDrag] = useState(0)
  const sheetStartY = useRef<number | null>(null)
  const sheetDragRef = useRef(0)

  const refresh = useCallback(async () => {
    try {
      setNotes(await listNotes())
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Notizen konnten nicht geladen werden.')
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onChange = () => void refresh()
    window.addEventListener('jarvis-notes', onChange)
    return () => window.removeEventListener('jarvis-notes', onChange)
  }, [refresh])

  function startEdit(note?: Note) {
    setEditing(note || null)
    setBody(note?.body || '')
    setEditorOpen(true)
  }

  function closeEditor() {
    setEditing(null)
    setBody('')
    setEditorOpen(false)
    setSheetDrag(0)
    sheetStartY.current = null
  }

  async function save() {
    const text = body.trim()
    if (!text) return
    try {
      if (editing) await updateNote(editing.id, text)
      else await addNote(text)
      closeEditor()
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Notiz konnte nicht gespeichert werden.')
    }
  }

  async function remove(id = editing?.id) {
    if (!id || deletingId) return
    setDeletingId(id)
    try {
      await deleteNote(id)
      setNotes((current) => current.filter((note) => note.id !== id))
      if (editing?.id === id) closeEditor()
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Notiz konnte nicht gelöscht werden.')
    } finally {
      setDeletingId('')
    }
  }

  function onSheetHandleDown(event: PointerEvent<HTMLDivElement>) {
    sheetStartY.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function onSheetHandleMove(event: PointerEvent<HTMLDivElement>) {
    if (sheetStartY.current == null) return
    const dy = Math.max(0, event.clientY - sheetStartY.current)
    sheetDragRef.current = dy
    setSheetDrag(dy)
  }

  function onSheetHandleUp() {
    const dy = sheetDragRef.current
    sheetStartY.current = null
    sheetDragRef.current = 0
    if (dy > 88) {
      closeEditor()
      return
    }
    setSheetDrag(0)
  }

  const filtered = notes.filter((note) => note.body.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  return (
    <div className={`watch-overlay notes-overlay fx-in${leaving ? ' is-leaving' : ''}`}>
      <header className="watch-head">
        <div><h2>Notizen</h2><p>Auf diesem Gerät gespeichert</p></div>
        <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>Fertig</button>
      </header>
      {error ? <p className="notes-error" role="alert">{error}</p> : null}
      {editorOpen ? (
        <>
          <div className="shop-sheet-backdrop" onClick={closeEditor} aria-hidden />
          <section
            className="notes-editor-sheet fx-in"
            aria-label={editing ? 'Notiz bearbeiten' : 'Neue Notiz'}
            style={sheetDrag ? { transform: `translateY(${sheetDrag}px)`, transition: 'none' } : undefined}
          >
            <div
              className="shop-sheet-handle"
              aria-hidden
              onPointerDown={onSheetHandleDown}
              onPointerMove={onSheetHandleMove}
              onPointerUp={onSheetHandleUp}
              onPointerCancel={onSheetHandleUp}
            >
              <i />
            </div>
            <header className="watch-head">
              <h2>{editing ? 'Notiz bearbeiten' : 'Neue Notiz'}</h2>
              <span className="notes-count">{body.length} Zeichen</span>
            </header>
            <textarea
              aria-label="Notiztext"
              placeholder="Notiz schreiben"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={6}
              autoFocus
            />
            <div className="notes-actions">
              {editing ? (
                <button
                  type="button"
                  className="ghost-btn is-danger"
                  disabled={deletingId === editing.id}
                  onClick={() => void remove()}
                >
                  {deletingId === editing.id ? 'Wird gelöscht…' : 'Löschen'}
                </button>
              ) : null}
              <button type="button" className="ghost-btn" onClick={closeEditor}>Abbrechen</button>
              <button type="button" className="cal-add-btn" disabled={!body.trim()} onClick={() => void save()}>Speichern</button>
            </div>
          </section>
        </>
      ) : (
        <>
          <div className="notes-toolbar">
            <input type="search" aria-label="Notizen durchsuchen" placeholder="Notizen durchsuchen" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button type="button" className="ghost-btn" onClick={() => startEdit()}>Neue Notiz</button>
          </div>
          <div className="notes-list">
            {filtered.map((note) => (
              <div key={note.id} className="notes-card-row">
                <button type="button" className="notes-card workbench-card" onClick={() => startEdit(note)}>
                  <strong>{note.body.split('\n')[0] || 'Leere Notiz'}</strong>
                  {note.body.includes('\n') ? <span>{note.body.slice(note.body.indexOf('\n') + 1)}</span> : null}
                </button>
                <button
                  type="button"
                  className="ghost-btn notes-del"
                  aria-label={`Notiz löschen: ${note.body.slice(0, 80)}`}
                  disabled={deletingId === note.id}
                  onClick={() => void remove(note.id)}
                >
                  {deletingId === note.id ? '…' : 'Löschen'}
                </button>
              </div>
            ))}
            {!filtered.length ? <p className="watch-empty">{query ? 'Keine passenden Notizen.' : 'Noch keine Notizen.'}</p> : null}
          </div>
        </>
      )}
    </div>
  )
}
