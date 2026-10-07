import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { prefersReducedMotion } from '../engine/motion.ts'
import {
  addTodo,
  createTodoList,
  deleteTodo,
  deleteTodoList,
  listTodoLists,
  listTodos,
  setTodoStatus,
  updateTodo,
  type Todo,
  type TodoList,
} from '../engine/store.ts'

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
      <button type="button" className="todo-card-main" onClick={() => { if (!done) onEdit() }} aria-label={`${done ? 'Erledigt' : 'Bearbeiten'}: ${todo.title}`}>
        <span className="todo-card-title">{todo.title}</span>
        {todo.deadline_date ? <span className="todo-deadline">{todo.deadline_date}{todo.deadline_time ? ` · ${todo.deadline_time}` : ''}</span> : null}
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

export function TodoListsOverlay({ onClose, leaving = false }: { onClose: () => void; leaving?: boolean }) {
  const [lists, setLists] = useState<TodoList[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [detailId, setDetailId] = useState<string | null>(null)
  const [listName, setListName] = useState('')
  const [taskOpen, setTaskOpen] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [confirmListDelete, setConfirmListDelete] = useState<string | null>(null)
  const [error, setError] = useState('')
  const reduced = prefersReducedMotion()

  const refresh = useCallback(async () => {
    try {
      const [nextLists, nextTodos] = await Promise.all([listTodoLists(), listTodos()])
      setLists(nextLists)
      setTodos(nextTodos)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Todo-Listen konnten nicht geladen werden.')
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onChange = () => void refresh()
    window.addEventListener('jarvis-todos', onChange)
    return () => window.removeEventListener('jarvis-todos', onChange)
  }, [refresh])

  const detail = lists.find((list) => list.id === detailId) || null
  const rows = detail ? todos.filter((todo) => (todo.list_id || 'todo-list-general') === detail.id) : []

  async function createList() {
    try {
      const list = await createTodoList(listName)
      setListName('')
      setDetailId(list.id)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Todo-Liste konnte nicht erstellt werden.')
    }
  }

  async function removeList(id: string) {
    if (confirmListDelete !== id) {
      setConfirmListDelete(id)
      return
    }
    try {
      await deleteTodoList(id)
      setConfirmListDelete(null)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Todo-Liste konnte nicht gelöscht werden.')
    }
  }

  function openTask(todo?: Todo) {
    setEditing(todo || null)
    setTitle(todo?.title || '')
    setDate(todo?.deadline_date || '')
    setTime(todo?.deadline_time || '')
    setTaskOpen(true)
  }

  async function saveTask() {
    if (!detail) return
    try {
      if (editing) await updateTodo(editing.id, { title, listId: detail.id, deadlineDate: date || null, deadlineTime: time || null })
      else await addTodo(title, undefined, { listId: detail.id, deadlineDate: date || null, deadlineTime: time || null })
      setTaskOpen(false)
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

  return (
    <div className={`watch-overlay shop-overlay todo-overlay fx-in${leaving ? ' is-leaving' : ''}`}>
      {!detail ? (
        <>
          <header className="watch-head">
            <div><h2>Todo-Listen</h2><p>Listen und Aufgaben auf diesem Gerät</p></div>
            <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>Fertig</button>
          </header>
          {error ? <p className="notes-error" role="alert">{error}</p> : null}
          <form className="shop-new-list" onSubmit={(event) => { event.preventDefault(); void createList() }}>
            <input aria-label="Name der neuen Todo-Liste" placeholder="Neue Liste, z. B. Uni" value={listName} onChange={(event) => setListName(event.target.value)} />
            <button type="submit" className="ghost-btn">Anlegen</button>
          </form>
          <div className="shop-list-grid">
            {lists.map((list) => (
              <div key={list.id} className="todo-list-card">
                <button type="button" className="shop-list-card workbench-card" onClick={() => { setDetailId(list.id); setSelected([]) }}>
                  <h3>{list.name}</h3>
                  <p>{todos.filter((todo) => (todo.list_id || 'todo-list-general') === list.id && todo.status === 'open').length} offen</p>
                </button>
                {list.id !== 'todo-list-general' ? (
                  <button type="button" className="ghost-btn" onClick={() => void removeList(list.id)}>
                    {confirmListDelete === list.id ? 'Löschen bestätigen · Todos nach Allgemein' : 'Liste löschen'}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <header className="watch-head">
            <div>
              <button type="button" className="ghost-btn shop-back" onClick={() => { setDetailId(null); setSelected([]) }}>← Listen</button>
              <h2>{detail.name}</h2>
              <p>Links erledigen · rechts löschen · erledigte gedrückt halten</p>
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
          </div>
          <button type="button" className="shop-fab cal-fab" aria-label="Todo hinzufügen" onClick={() => openTask()}>+</button>
        </>
      )}
      {taskOpen && detail ? (
        <div className="shop-add-sheet todo-editor fx-in" role="dialog" aria-label={editing ? 'Todo bearbeiten' : 'Todo erstellen'}>
          <header className="watch-head">
            <h2>{editing ? 'Todo bearbeiten' : 'Neues Todo'}</h2>
            <button type="button" className="ghost-btn" onClick={() => setTaskOpen(false)}>Abbrechen</button>
          </header>
          {error ? <p className="notes-error" role="alert">{error}</p> : null}
          <label>Aufgabe<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label>Deadline (optional)<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>Uhrzeit (optional)<input type="time" value={time} disabled={!date} onChange={(event) => setTime(event.target.value)} /></label>
          <button type="button" className="ghost-btn" onClick={() => void saveTask()}>Speichern</button>
        </div>
      ) : null}
    </div>
  )
}
