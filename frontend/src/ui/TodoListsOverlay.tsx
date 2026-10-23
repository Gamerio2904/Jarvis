import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { prefersReducedMotion } from '../engine/motion.ts'
import { adoptOrphanDeadlineTodos, isoDay } from '../engine/calendar.ts'
import { expandEvents, eventEndAt, recurLabel } from '../engine/calendar-occur.ts'
import {
  addTodo,
  collapseTodoLists,
  deleteTodo,
  listEvents,
  listTodos,
  setTodoStatus,
  updateTodo,
  type CalendarEvent,
  type Todo,
} from '../engine/store.ts'
import { allTags, filterByTags, sortByTags, tagColor } from '../engine/tags.ts'

const SWIPE_THRESHOLD = 72
const HOLD_MS = 550

function TaskCard({
  todo,
  selected,
  selecting,
  reduced,
  onDone,
  onDelete,
  onEdit,
  onHold,
  onToggle,
}: {
  todo: Todo
  selected: boolean
  selecting: boolean
  reduced: boolean
  onDone: () => void
  onDelete: () => void
  onEdit: () => void
  onHold: () => void
  onToggle: () => void
}) {
  const [dx, setDx] = useState(0)
  const start = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)
  const timer = useRef(0)
  const held = useRef(false)
  const done = todo.status === 'done'

  function pointerDown(event: PointerEvent<HTMLElement>) {
    if (done) {
      start.current = { x: event.clientX, y: event.clientY }
      held.current = false
      event.currentTarget.setPointerCapture(event.pointerId)
      timer.current = window.setTimeout(() => {
        held.current = true
        onHold()
      }, HOLD_MS)
      return
    }
    if (reduced) return
    start.current.x = event.clientX
    dragging.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function pointerMove(event: PointerEvent<HTMLElement>) {
    if (done && timer.current) {
      if (Math.abs(event.clientX - start.current.x) > 12 || Math.abs(event.clientY - start.current.y) > 12) {
        window.clearTimeout(timer.current)
        timer.current = 0
      }
      return
    }
    if (!dragging.current) return
    event.preventDefault()
    setDx(event.clientX - start.current.x)
  }

  function pointerUp(event: PointerEvent<HTMLElement>) {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = 0
    if (!dragging.current || done) return
    dragging.current = false
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Pointer capture may already have been released by the browser.
    }
    const delta = dx
    setDx(0)
    if (delta <= -SWIPE_THRESHOLD) onDone()
    else if (delta >= SWIPE_THRESHOLD) onDelete()
  }

  return (
    <article
      className={`shop-card workbench-card todo-card${done ? ' is-got' : ''}${selected ? ' is-selected' : ''}`}
      style={dx ? { transform: `translateX(${dx}px)` } : undefined}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={() => {
        window.clearTimeout(timer.current)
        timer.current = 0
        dragging.current = false
        setDx(0)
      }}
      onContextMenu={(event) => { if (done) event.preventDefault() }}
      onClick={() => {
        if (held.current) {
          held.current = false
          return
        }
        if (done && selecting) onToggle()
      }}
    >
      <button
        type="button"
        className="todo-card-main"
        style={todo.tags?.length ? { borderColor: tagColor(todo.tags[0]) } : undefined}
        onClick={() => { if (!done) onEdit() }}
        aria-label={`${done ? 'Erledigt' : 'Bearbeiten'}: ${todo.title}`}
      >
        <span className="todo-card-title">{todo.title}</span>
        {todo.deadline_date ? <span className="todo-deadline">{todo.deadline_date}{todo.deadline_time ? ` · ${todo.deadline_time}` : ''}</span> : null}
        {todo.tags?.length ? (
          <span className="tag-chip-row">
            {todo.tags.map((tag) => (
              <em key={tag} className="tag-chip is-static" style={{ borderColor: tagColor(tag), color: tagColor(tag) }}>
                #{tag}
              </em>
            ))}
          </span>
        ) : null}
        <span className="shop-card-hint">{done ? (selecting ? (selected ? 'Ausgewählt · tippen zum Abwählen' : 'Tippen zum Auswählen') : 'Gedrückt halten zum Auswählen') : reduced ? '' : 'Links erledigen · rechts löschen'}</span>
      </button>
      {(reduced && !done) || (done && selecting) ? (
        <div className="shop-card-actions">
          {!done ? <button type="button" className="ghost-btn" onClick={onDone}>Erledigt</button> : null}
          {done && selecting ? <button type="button" className="ghost-btn" onClick={onToggle}>{selected ? 'Abwählen' : 'Auswählen'}</button> : null}
          {!done ? <button type="button" className="ghost-btn" onClick={onDelete}>Löschen</button> : null}
        </div>
      ) : null}
    </article>
  )
}

function dayLabel(iso: string): string {
  const parts = iso.split('-').map((n) => Number(n))
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return iso
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** Termine der nächsten zwei Wochen — der Kalender-Einblick in der Todo-Liste. */
function TerminSection({ events }: { events: CalendarEvent[] }) {
  if (!events.length) return null
  return (
    <section className="todo-termine" aria-label="Termine der nächsten zwei Wochen">
      <h3 className="todo-termine-head">Termine · nächste 2 Wochen</h3>
      <ul className="todo-termine-list">
        {events.map((event) => {
          const d = new Date(event.start_at)
          const end = eventEndAt(event)
          const when = event.all_day
            ? 'ganztägig'
            : `${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
          return (
            <li key={`${event.id}-${event.start_at}`} className="todo-termin-row">
              <span className="todo-termin-day">{dayLabel(isoDay(d))}</span>
              <span className="todo-termin-title">{event.title}</span>
              <span className="todo-termin-when">{when}{recurLabel(event) ? ` · ${recurLabel(event)}` : ''}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function TodoListsOverlay({ onClose, leaving = false }: { onClose: () => void; leaving?: boolean }) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [termine, setTermine] = useState<CalendarEvent[]>([])
  const [taskOpen, setTaskOpen] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sortByTag, setSortByTag] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  const [sheetDrag, setSheetDrag] = useState(0)
  const sheetStartY = useRef<number | null>(null)
  const sheetDragRef = useRef(0)
  const reduced = prefersReducedMotion()

  const refresh = useCallback(async () => {
    try {
      await collapseTodoLists()
      await adoptOrphanDeadlineTodos()
      setTodos(await listTodos())
      const [ev] = await Promise.all([listEvents()])
      const from = new Date()
      const until = new Date()
      until.setDate(until.getDate() + 14)
      setTermine(
        expandEvents(ev, from, until)
          .sort((a, b) => a.start_at.localeCompare(b.start_at))
          .slice(0, 8),
      )
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Todo-Listen konnten nicht geladen werden.')
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onChange = () => void refresh()
    window.addEventListener('jarvis-todos', onChange)
    window.addEventListener('jarvis-events', onChange)
    return () => {
      window.removeEventListener('jarvis-todos', onChange)
      window.removeEventListener('jarvis-events', onChange)
    }
  }, [refresh])

  const rows = useMemo(
    () => (sortByTag ? sortByTags(filterByTags(todos, activeTags)) : filterByTags(todos, activeTags)),
    [todos, activeTags, sortByTag],
  )
  const tagPool = useMemo(() => allTags(todos), [todos])

  function openTask(todo?: Todo) {
    setEditing(todo || null)
    setTitle(todo?.title || '')
    setDate(todo?.deadline_date || '')
    setTime(todo?.deadline_time || '')
    setTagDraft((todo?.tags || []).join(', '))
    setTaskOpen(true)
  }

  function closeTask() {
    setTaskOpen(false)
    setSheetDrag(0)
    sheetStartY.current = null
  }

  async function saveTask() {
    const name = title.trim()
    if (!name) return
    try {
      const tags = tagDraft
        .split(/[,:\s]+/)
        .map((raw) => raw.replace(/^#/, '').trim())
        .filter(Boolean)
      if (editing) await updateTodo(editing.id, { title: name, listId: 'todo-list-general', deadlineDate: date || null, deadlineTime: time || null, tags })
      else await addTodo(name, undefined, { listId: 'todo-list-general', deadlineDate: date || null, deadlineTime: time || null, tags })
      closeTask()
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Todo konnte nicht gespeichert werden.')
    }
  }

  async function removeSelected() {
    try {
      await Promise.all(selected.map((id) => deleteTodo(id)))
      setSelected([])
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ausgewählte Todos konnten nicht gelöscht werden.')
    }
  }

  function quickDay(days: number) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const iso = isoDay(d)
    setDate((cur) => (cur === iso ? '' : iso))
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
      closeTask()
      return
    }
    setSheetDrag(0)
  }

  return (
    <div className={`watch-overlay shop-overlay todo-overlay fx-in${leaving ? ' is-leaving' : ''}`}>
      <>
          <header className="watch-head">
            <div>
              <h2>To-do-Liste</h2>
              <p>Links erledigen · rechts löschen</p>
            </div>
            <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>Fertig</button>
          </header>
          {error ? <p className="notes-error" role="alert">{error}</p> : null}
          {selected.length ? (
            <div className="shop-selection-bar">
              <span>{selected.length} erledigte ausgewählt</span>
              <button type="button" className="ghost-btn" onClick={() => void removeSelected()}>Löschen</button>
              <button type="button" className="ghost-btn" onClick={() => setSelected([])}>Abbrechen</button>
            </div>
          ) : null}
          {tagPool.length ? (
            <div className="tag-filter-row" role="group" aria-label="Todos nach Tag filtern">
              <button
                type="button"
                className={`tag-chip${activeTags.length ? '' : ' is-on'}`}
                onClick={() => setActiveTags([])}
              >
                Alle
              </button>
              {tagPool.map((tag) => (
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
          <div className="shop-items-scroll">
            {rows.length ? rows.map((todo) => (
              <TaskCard
                key={todo.id}
                todo={todo}
                selected={selected.includes(todo.id)}
                selecting={selected.length > 0}
                reduced={reduced}
                onDone={() => void setTodoStatus(todo.id, 'done').then(refresh).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Todo konnte nicht erledigt werden.'))}
                onDelete={() => void deleteTodo(todo.id).then(refresh).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Todo konnte nicht gelöscht werden.'))}
                onEdit={() => openTask(todo)}
                onHold={() => setSelected((current) => current.includes(todo.id) ? current : [...current, todo.id])}
                onToggle={() => setSelected((current) => current.includes(todo.id) ? current.filter((id) => id !== todo.id) : [...current, todo.id])}
              />
            )) : <p className="watch-empty">Noch keine Todos in dieser Liste.</p>}
            <TerminSection events={termine} />
          </div>
          <button type="button" className="shop-fab cal-fab" aria-label="Todo hinzufügen" onClick={() => openTask()}>+</button>
        </>
      {taskOpen ? (
        <>
          <div className="shop-sheet-backdrop" onClick={closeTask} aria-hidden />
          <div
            className="shop-add-sheet todo-editor fx-in"
            role="dialog"
            aria-label={editing ? 'Todo bearbeiten' : 'Todo erstellen'}
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
              <h2>{editing ? 'Todo bearbeiten' : 'Neues Todo'}</h2>
              <button type="button" className="ghost-btn" onClick={closeTask}>Abbrechen</button>
            </header>
            {error ? <p className="notes-error" role="alert">{error}</p> : null}
            <form
              className="todo-editor-form"
              onSubmit={(event) => {
                event.preventDefault()
                void saveTask()
              }}
            >
              <label className="todo-editor-field">
                <span>Aufgabe</span>
                <input
                  autoFocus
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Was ist zu tun?"
                  maxLength={140}
                />
              </label>
              <div className="todo-quick-chips" role="group" aria-label="Schnellauswahl Deadline">
                <button type="button" className={`todo-quick-chip${date === isoDay(new Date()) ? ' is-on' : ''}`} onClick={() => quickDay(0)}>Heute</button>
                <button type="button" className={`todo-quick-chip${(() => { const d = new Date(); d.setDate(d.getDate() + 1); return date === isoDay(d) })() ? ' is-on' : ''}`} onClick={() => quickDay(1)}>Morgen</button>
                <button type="button" className={`todo-quick-chip${(() => { const d = new Date(); d.setDate(d.getDate() + 7); return date === isoDay(d) })() ? ' is-on' : ''}`} onClick={() => quickDay(7)}>Nächste Woche</button>
              </div>
              <label className="tag-edit-row">
                <span>Tags (Komma oder Leerzeichen, # optional)</span>
                <input
                  aria-label="Todo-Tags"
                  placeholder="haushalt projekt einkauf"
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                />
              </label>
              <div className="todo-editor-row">
                <label className="todo-editor-field">
                  <span>Deadline (optional)</span>
                  <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                </label>
                <label className="todo-editor-field">
                  <span>Uhrzeit (optional)</span>
                  <input type="time" value={time} disabled={!date} onChange={(event) => setTime(event.target.value)} />
                </label>
              </div>
              <p className="todo-editor-hint">Mit Deadline landet das Todo auch im Kalender.</p>
              <div className="todo-editor-actions">
                <button type="button" className="ghost-btn" onClick={closeTask}>Abbrechen</button>
                <button type="submit" className="cal-add-btn" disabled={!title.trim()}>Speichern</button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </div>
  )
}
