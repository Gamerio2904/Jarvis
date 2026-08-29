import { useEffect, useMemo, useState } from 'react'
import { createEventFromGui, isoDay, marksForMonth, removeEvent, sameDay } from './engine/calendar'
import { formatDue, startOfDay } from './engine/remind-parse'
import { listEvents, listReminders, type CalendarEvent, type Reminder } from './engine/store'

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
          <p>Nur auf diesem Handy. Kein Google-Login.</p>
        </div>
        <div className="cal-head-actions">
          <button type="button" className="ghost-btn" onClick={() => setYearView((v) => !v)}>
            {yearView ? 'Monat' : 'Jahr'}
          </button>
          <button type="button" className="ghost-btn" onClick={onClose}>
            Zurück
          </button>
        </div>
      </header>

      <div className="cal-nav">
        <button
          type="button"
          onClick={() =>
            setCursor(yearView ? new Date(year - 1, month, 1) : new Date(year, month - 1, 1))
          }
        >
          ←
        </button>
        <strong>{yearView ? String(year) : label}</strong>
        <button
          type="button"
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
      <div className="cal-grid" role="grid" aria-label="Monat">
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
          return (
            <button
              key={key}
              type="button"
              className={`cal-cell${isSel ? ' sel' : ''}${isToday ? ' today' : ''}`}
              onClick={() => setSelected(d)}
            >
              <span>{d.getDate()}</span>
              {marks.has(key) ? <i className="cal-dot" /> : null}
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
            placeholder="Neuer Termin"
            disabled={busy}
          />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={busy} />
          <button type="submit" className="retry-btn" disabled={busy || !title.trim()}>
            Anlegen
          </button>
        </form>
        {err ? <p className="settings-hint">{err}</p> : null}
        <p className="settings-hint">Oder im Chat: „Termin morgen 15 Uhr Zahnarzt“ / „erstell einen Termin für den 5.9. 2026, 15:00 Uhr Zahnarzt“.</p>
      </section>
    </div>
  )
}
