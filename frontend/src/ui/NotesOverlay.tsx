import { useCallback, useEffect, useState } from 'react'
import { addNote, deleteNote, listNotes, updateNote, type Note } from '../engine/store.ts'

export function NotesOverlay({ onClose, leaving = false }: { onClose: () => void; leaving?: boolean }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [query, setQuery] = useState('')
  const [body, setBody] = useState('')
  const [editing, setEditing] = useState<Note | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [error, setError] = useState('')

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
  }

  async function save() {
    try {
      if (editing) await updateNote(editing.id, body)
      else await addNote(body)
      closeEditor()
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Notiz konnte nicht gespeichert werden.')
    }
  }

  async function remove(id = editing?.id) {
    if (!id) return
    try {
      await deleteNote(id)
      closeEditor()
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Notiz konnte nicht gelöscht werden.')
    }
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
        <section className="notes-editor" aria-label={editing ? 'Notiz bearbeiten' : 'Neue Notiz'}>
          <textarea
            aria-label="Notiztext"
            placeholder="Notiz schreiben"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
          />
          <div className="notes-actions">
            <button type="button" className="ghost-btn" onClick={closeEditor}>Abbrechen</button>
            <button type="button" className="ghost-btn" onClick={() => void save()}>Speichern</button>
            {editing ? (
              <button type="button" className="ghost-btn" onClick={() => void remove()}>Löschen</button>
            ) : null}
          </div>
        </section>
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
                <button type="button" className="ghost-btn notes-del" aria-label="Notiz löschen" onClick={() => void remove(note.id)}>✕</button>
              </div>
            ))}
            {!filtered.length ? <p className="watch-empty">{query ? 'Keine passenden Notizen.' : 'Noch keine Notizen.'}</p> : null}
          </div>
        </>
      )}
    </div>
  )
}
