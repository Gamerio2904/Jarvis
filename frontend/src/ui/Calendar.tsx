import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { createEventFromGui, isoDay, marksForMonth, removeEvent, sameDay } from '../engine/calendar.ts'
import { formatDue, startOfDay } from '../engine/remind-parse.ts'
import { listEvents, listReminders, type CalendarEvent, type Reminder } from '../engine/store.ts'

const WEEK = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function monthCells(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1)
  const startPad = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = []
  for (let i = 0; i < startPad; i += 1) cells.push(null)
  for (let d = 1; d <= days; d += 1) cells.push(new Date(year, month, d))
  while (cells.length % 7) cells.push(null)
  return cells
}

function previewForDay(events: CalendarEvent[], day: Date): string {
  const hit = events.find((e) => sameDay(new Date(e.start_at), day))
  return hit ? hit.title.slice(0, 12) : ''
}

export function CalendarView({ onClose, leaving }: { onClose: () => void; leaving?: boolean }) {
  const today = startOfDay(new Date())
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(() => new Date(today))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [marks, setMarks] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('15:00')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [yearView, setYearView] = useState(false)
  const [yearMarks, setYearMarks] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const cells = useMemo(() => monthCells(year, month), [year, month])

  async function reload() {
    const [ev, rem, m] = await Promise.all([
      listEvents(),
      listReminders(),
      marksForMonth(year, month),
    ])
    setEvents(ev)
    setReminders(rem.filter((r) => r.status === 'open'))
    setMarks(m)
  }

  useEffect(() => {
    void reload()
  }, [year, month])

  useEffect(() => {
    if (!yearView) return
    let live = true
    void (async () => {
      const sets = await Promise.all(MONTHS.map((_, i) => marksForMonth(year, i)))
      if (!live) return
      const all = new Set<string>()
      for (const s of sets) for (const k of s) all.add(k)
      setYearMarks(all)
    })()
    return () => {
      live = false
    }
  }, [yearView, year])

  const dayEvents = events.filter((e) => sameDay(new Date(e.start_at), selected))
  const dayRems = reminders.filter((r) => sameDay(new Date(r.due_at), selected))

  function shiftMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1))
  }

  function onGridPointerDown(e: PointerEvent) {
    swipeRef.current = { x: e.clientX, y: e.clientY }
  }

  function onGridPointerUp(e: PointerEvent) {
    const start = swipeRef.current
    swipeRef.current = null
    if (!start || yearView) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return
    shiftMonth(dx < 0 ? 1 : -1)
  }

  async function onAdd() {
    const name = title.trim()
    if (!name || busy) return
    setBusy(true)
    setErr(null)
    try {
      const [h, m] = time.split(':').map((n) => Number(n))
      const start = new Date(selected)
      start.setHours(Number.isFinite(h) ? h : 15, Number.isFinite(m) ? m : 0, 0, 0)
      await createEventFromGui({ title: name, start })
      setTitle('')
      setSheetOpen(false)
      await reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Termin fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: string) {
    if (busy) return
    setBusy(true)
    try {
      await removeEvent(id)
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const label = cursor.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <div className={`cal-view fx-in${leaving ? ' is-leaving' : ''}`}>
      <header className="cal-head">
        <div>
          <h2>Kalender</h2>
          <p>Wischen = Monat · FAB = Termin</p>
        </div>
        <div className="cal-head-actions">
          <button type="button" className="ghost-btn cal-toolbar-btn" onClick={() => setYearView((v) => !v)}>
            {yearView ? 'Monat' : 'Jahr'}
          </button>
          <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>
            Zurück
          </button>
        </div>
      </header>

      <div className="cal-nav">
        <button
          type="button"
          className="cal-nav-btn"
          aria-label={yearView ? 'Vorheriges Jahr' : 'Vorheriger Monat'}
          onClick={() =>
            setCursor(yearView ? new Date(year - 1, month, 1) : new Date(year, month - 1, 1))
          }
        >
          ←
        </button>
        <strong className="cal-nav-label">{yearView ? String(year) : label}</strong>
        <button
          type="button"
          className="cal-nav-btn"
          aria-label={yearView ? 'Nächstes Jahr' : 'Nächster Monat'}
          onClick={() =>
            setCursor(yearView ? new Date(year + 1, month, 1) : new Date(year, month + 1, 1))
          }
        >
          →
        </button>
      </div>

      {yearView ? (
        <div className="cal-year" role="grid" aria-label="Jahr">
          {MONTHS.map((name, mi) => (
            <button
              key={name}
              type="button"
              className="cal-year-month"
              onClick={() => {
                setCursor(new Date(year, mi, 1))
                setSelected(new Date(year, mi, 1))
                setYearView(false)
              }}
            >
              <strong>{name}</strong>
              <div className="cal-year-grid">
                {monthCells(year, mi).map((d, i) => {
                  if (!d) return <i key={`${name}-e-${i}`} />
                  const key = isoDay(d)
                  return (
                    <span
                      key={key}
                      className={`cal-year-day${sameDay(d, today) ? ' today' : ''}${yearMarks.has(key) ? ' mark' : ''}`}
                    />
                  )
                })}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div
          className="cal-grid cal-grid-swipe"
          role="grid"
          aria-label="Monat"
          onPointerDown={onGridPointerDown}
          onPointerUp={onGridPointerUp}
          onPointerCancel={() => {
            swipeRef.current = null
          }}
        >
          {WEEK.map((w) => (
            <div key={w} className="cal-dow">
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} className="cal-cell empty" />
            const key = isoDay(d)
            const isSel = sameDay(d, selected)
            const isToday = sameDay(d, today)
            const preview = previewForDay(events, d)
            return (
              <button
                key={key}
                type="button"
                className={`cal-cell${isSel ? ' sel' : ''}${isToday ? ' today' : ''}${marks.has(key) ? ' has-mark' : ''}`}
                onClick={() => setSelected(d)}
              >
                <span className="cal-day-num">{d.getDate()}</span>
                {marks.has(key) ? <i className="cal-dot" /> : null}
                {preview ? <span className="cal-preview">{preview}</span> : null}
              </button>
            )
          })}
        </div>
      )}

      <section className="cal-day">
        <h3>
          {selected.toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h3>
        {dayEvents.length === 0 && dayRems.length === 0 ? (
          <p className="memory-empty">Nichts an diesem Tag.</p>
        ) : (
          <ul className="memory-list">
            {dayEvents.map((e) => (
              <li key={e.id} className="memory-item">
                <div className="memory-value">{e.title}</div>
                <div className="memory-key">{formatDue(new Date(e.start_at))}</div>
                <button type="button" className="memory-del" disabled={busy} onClick={() => void onDelete(e.id)}>
                  Löschen
                </button>
              </li>
            ))}
            {dayRems.map((r) => (
              <li key={r.id} className="memory-item">
                <div className="memory-value">{r.title}</div>
                <div className="memory-key">Erinnerung · {formatDue(new Date(r.due_at))}</div>
              </li>
            ))}
          </ul>
        )}
        <p className="settings-hint">Oder im Chat: „Termin morgen 15 Uhr Zahnarzt“.</p>
      </section>

      <button
        type="button"
        className="cal-fab"
        aria-label="Termin anlegen"
        onClick={() => setSheetOpen(true)}
      >
        ＋ Termin
      </button>

      {sheetOpen ? (
        <div className="cal-sheet-backdrop" onClick={() => setSheetOpen(false)} aria-hidden />
      ) : null}
      <div className={`cal-sheet${sheetOpen ? ' is-open' : ''}`} role="dialog" aria-label="Termin anlegen">
        <h3>Termin anlegen</h3>
        <form
          className="cal-form"
          onSubmit={(e) => {
            e.preventDefault()
            void onAdd()
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            disabled={busy}
            autoFocus
          />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={busy} />
          <div className="cal-sheet-actions">
            <button type="button" className="ghost-btn" disabled={busy} onClick={() => setSheetOpen(false)}>
              Abbrechen
            </button>
            <button type="submit" className="cal-add-btn" disabled={busy || !title.trim()}>
              Speichern
            </button>
          </div>
        </form>
        {err ? <p className="settings-hint">{err}</p> : null}
      </div>
    </div>
  )
}
