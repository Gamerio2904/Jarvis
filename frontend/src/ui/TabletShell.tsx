import { useEffect, useState } from 'react'
import { openTodos } from '../engine/tablet-todos.ts'
import type { Todo } from '../engine/store.ts'
import { TabletBackdrop } from './TabletBackdrop.tsx'

type Props = {
  listening: boolean
  serverLine: string
  onTalk: () => void
}

function clock(now: Date) {
  return now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export const TABLET_SHOW_TODOS = 'jarvis-tablet-show-todos'
export const TABLET_HEARD = 'jarvis-tablet-heard'
const PANEL_MS = 30_000

/** Tablet-Ansicht: animierter Ultron-Hintergrund, Uhr, Weckwort „Ultron“, Todo-Panel auf Zuruf. */
export function TabletShell(p: Props) {
  const [now, setNow] = useState(() => new Date())
  const [todos, setTodos] = useState<Todo[] | null>(null)
  const [heard, setHeard] = useState('')
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15000)
    return () => window.clearInterval(id)
  }, [])
  useEffect(() => {
    let timer = 0
    const onShow = (ev: Event) => {
      setTodos(openTodos((ev as CustomEvent<Todo[]>).detail || []))
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setTodos(null), PANEL_MS)
    }
    const onHeard = (ev: Event) => setHeard((ev as CustomEvent<string>).detail || '')
    window.addEventListener(TABLET_SHOW_TODOS, onShow)
    window.addEventListener(TABLET_HEARD, onHeard)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(TABLET_SHOW_TODOS, onShow)
      window.removeEventListener(TABLET_HEARD, onHeard)
    }
  }, [])
  return (
    <div className="tablet-shell" aria-live="polite">
      <TabletBackdrop active={p.listening || Boolean(heard)} />
      <div className="tablet-clock">
        <strong>{clock(now)}</strong>
        <span>{now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>
      {todos ? (
        <section className="tablet-todos" aria-label="Offene Aufgaben">
          <header>
            <h2>Offene Aufgaben · {todos.length}</h2>
            <button type="button" onClick={() => setTodos(null)} aria-label="Schließen">✕</button>
          </header>
          {todos.length ? (
            <ul>
              {todos.slice(0, 12).map((t) => (
                <li key={t.id}>
                  <span>{t.title}</span>
                  {t.deadline_date ? <small>{t.deadline_date.split('-').reverse().join('.')}{t.deadline_time ? ` ${t.deadline_time}` : ''}</small> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p>Alles erledigt, Sir.</p>
          )}
        </section>
      ) : (
        <button type="button" className={`tablet-orb${p.listening ? ' is-listening' : ''}${heard ? ' is-heard' : ''}`} onClick={p.onTalk} aria-label="Mit Ultron sprechen">
          <span className="tablet-orb-core" />
        </button>
      )}
      <div className="tablet-hint">
        <span>{heard || (p.listening ? 'Sag „Ultron“' : 'Tippe auf den Ring')}</span>
        <small>{p.serverLine}</small>
      </div>
    </div>
  )
}
