import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import {
  createEventFromGui,
  formatRemindOffsets,
  isoDay,
  marksForMonth,
  removeEvent,
  sameDay,
  takeCalendarFocus,
  updateEventFromGui,
} from '../engine/calendar.ts'
import {
  CAL_THEMES,
  calThemeOf,
  classifyEventTheme,
  eventTheme,
  themesForDay,
  type CalThemeId,
} from '../engine/calendar-theme.ts'
import { formatDue, startOfDay } from '../engine/remind-parse.ts'
import { listEvents, listReminders, type CalendarEvent, type Reminder } from '../engine/store.ts'
import { useSlidingThumb } from './SlidingThumb.tsx'

const WEEK = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const REMIND_CHIPS: Array<{ min: number | null; label: string }> = [
  { min: 1440, label: '24 h' },
  { min: 120, label: '2 h' },
  { min: 60, label: '1 h' },
  { min: 15, label: '15 min' },
  { min: 0, label: 'am Termin' },
  { min: null, label: 'keine' },
]

type CalMode = 'month' | 'week' | 'list' | 'year'

function mondayOf(day: Date): Date {
  const d = startOfDay(day)
  const pad = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - pad)
  return d
}

function weekDays(anchor: Date): Date[] {
  const start = mondayOf(anchor)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function parseIsoDay(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : startOfDay(d)
}

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

function dayHeading(day: Date, today: Date): string {
  if (sameDay(day, today)) return 'Heute'
  const morgen = new Date(today)
  morgen.setDate(morgen.getDate() + 1)
  if (sameDay(day, morgen)) return 'Morgen'
  return day.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function timeLabel(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function remindLabel(e: CalendarEvent): string | undefined {
  if (e.remind_offsets_min === undefined) return 'Erinnerung am Termin'
  if (!e.remind_offsets_min.length) return undefined
  return `Erinnerung: ${formatRemindOffsets(e.remind_offsets_min)}`
}

function countOnDay(events: CalendarEvent[], reminders: Reminder[], day: Date): number {
  return (
    events.filter((e) => sameDay(new Date(e.start_at), day)).length +
    reminders.filter((r) => sameDay(new Date(r.due_at), day)).length
  )
}

function upcomingGroups(
  events: CalendarEvent[],
  reminders: Reminder[],
  from: Date,
  days = 21,
): Array<{ key: string; day: Date; events: CalendarEvent[]; rems: Reminder[] }> {
  const end = new Date(from)
  end.setDate(end.getDate() + days)
  const fromMs = from.getTime()
  const endMs = end.getTime()
  const by = new Map<string, { key: string; day: Date; events: CalendarEvent[]; rems: Reminder[] }>()
  const bucket = (iso: string) => {
    const day = startOfDay(new Date(iso))
    const t = day.getTime()
    if (t < fromMs || t >= endMs) return null
    const key = isoDay(day)
    let row = by.get(key)
    if (!row) {
      row = { key, day, events: [], rems: [] }
      by.set(key, row)
    }
    return row
  }
  for (const e of events) bucket(e.start_at)?.events.push(e)
  for (const r of reminders) bucket(r.due_at)?.rems.push(r)
  return [...by.values()].sort((a, b) => a.day.getTime() - b.day.getTime())
}

function EventCard({
  title,
  when,
  place,
  remind,
  theme,
  kind,
  onEdit,
  onDelete,
  busy,
}: {
  title: string
  when: string
  place?: string
  remind?: string
  theme?: CalThemeId
  kind?: string
  onEdit?: () => void
  onDelete?: () => void
  busy?: boolean
}) {
  const face = theme ? calThemeOf(theme) : null
  const tint = face
    ? ({ borderLeftColor: face.color, ['--cal-theme']: face.color } as CSSProperties)
    : undefined
  return (
    <li className="cal-card" data-theme={theme || 'erinnerung'} style={tint}>
      <div
        className="cal-card-main"
        role={onEdit ? 'button' : undefined}
        tabIndex={onEdit ? 0 : undefined}
        onClick={onEdit}
        onKeyDown={
          onEdit
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onEdit()
                }
              }
            : undefined
        }
      >
        <div className="cal-card-top">
          {face ? (
            <span className="cal-theme-pill" style={{ background: face.color }}>
              {face.label}
            </span>
          ) : (
            <span className="cal-theme-pill is-rem">{kind || 'Erinnerung'}</span>
          )}
          <span className="cal-card-time">{when}</span>
        </div>
        <div className="cal-card-title">{title}</div>
        {place ? <div className="cal-card-place">{place}</div> : null}
        {remind ? <div className="cal-card-remind">{remind}</div> : null}
      </div>
      {onEdit || onDelete ? (
        <div className="cal-card-actions">
          {onEdit ? (
            <button type="button" className="cal-card-edit" disabled={busy} onClick={onEdit} aria-label={`${title} ändern`}>
              Ändern
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" className="cal-card-del" disabled={busy} onClick={onDelete} aria-label={`${title} löschen`}>
              Löschen
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

export function CalendarView({ onClose, leaving }: { onClose: () => void; leaving?: boolean }) {
  const today = startOfDay(new Date())
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(() => new Date(today))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [marks, setMarks] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('')
  const [place, setPlace] = useState('')
  const [time, setTime] = useState('18:00')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [mode, setMode] = useState<CalMode>('month')
  const [yearMarks, setYearMarks] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [chipMins, setChipMins] = useState<number[]>([0])
  const [themePick, setThemePick] = useState<CalThemeId | null>(null)
  const [monthDir, setMonthDir] = useState<'left' | 'right' | 'none'>('none')
  const [sheetDrag, setSheetDrag] = useState(0)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  const sheetStartY = useRef<number | null>(null)
  const sheetDragRef = useRef(0)
  const titleRef = useRef<HTMLInputElement>(null)
  const modeThumb = useSlidingThumb(mode)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const cells = useMemo(() => monthCells(year, month), [year, month])
  const themeGuess = classifyEventTheme(title)
  const theme = themePick || themeGuess

  const reload = useCallback(async () => {
    const [ev, rem, mk] = await Promise.all([listEvents(), listReminders(), marksForMonth(year, month)])
    setEvents(ev)
    setReminders(rem.filter((r) => r.status === 'open'))
    setMarks(mk)
  }, [year, month])

  useEffect(() => {
    void reload()
  }, [reload])

  const jumpTo = useCallback((iso: string) => {
    const d = parseIsoDay(iso)
    if (!d) return
    setSelected(d)
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
    setMode((cur) => (cur === 'year' ? 'month' : cur))
  }, [])

  useEffect(() => {
    const on = () => void reload()
    window.addEventListener('jarvis-events', on)
    return () => window.removeEventListener('jarvis-events', on)
  }, [reload])

  useEffect(() => {
    const pending = takeCalendarFocus()
    if (pending) jumpTo(pending)
    const onFocus = (e: Event) => {
      const day = String((e as CustomEvent<{ day?: string }>).detail?.day || '')
      if (day) jumpTo(day)
    }
    window.addEventListener('jarvis-cal-focus', onFocus)
    return () => window.removeEventListener('jarvis-cal-focus', onFocus)
  }, [jumpTo])

  useEffect(() => {
    if (!sheetOpen) return
    titleRef.current?.focus()
    if (editingId) titleRef.current?.select()
  }, [sheetOpen, editingId])

  useEffect(() => {
    if (mode !== 'year') return
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
  }, [mode, year])

  const dayEvents = events.filter((e) => sameDay(new Date(e.start_at), selected)).sort((a, b) => (a.start_at < b.start_at ? -1 : 1))
  const dayRems = reminders.filter((r) => sameDay(new Date(r.due_at), selected))
  const week = useMemo(() => weekDays(selected), [selected])
  const groups = useMemo(() => upcomingGroups(events, reminders, today), [events, reminders, today])
  const nextUp = useMemo(() => {
    const now = Date.now()
    return events.find((e) => new Date(e.start_at).getTime() >= now) || null
  }, [events])
  const todayCount = events.filter((e) => sameDay(new Date(e.start_at), today)).length
  const headLine = nextUp
    ? `Als Nächstes: ${nextUp.title}`
    : todayCount
      ? `${todayCount} ${todayCount === 1 ? 'Termin' : 'Termine'} heute`
      : 'Nichts kommt. ＋ legt an.'

  function goToday() {
    const next = new Date(today.getFullYear(), today.getMonth(), 1)
    const cur = new Date(year, month, 1)
    setMonthDir(next.getTime() === cur.getTime() ? 'none' : next > cur ? 'left' : 'right')
    setCursor(next)
    setSelected(new Date(today))
    setMode('month')
  }

  function shiftMonth(delta: number) {
    setMonthDir(delta > 0 ? 'left' : 'right')
    setCursor(new Date(year, month + delta, 1))
  }

  function shiftYear(delta: number) {
    setMonthDir(delta > 0 ? 'left' : 'right')
    setCursor(new Date(year + delta, month, 1))
  }

  function onGridPointerDown(e: PointerEvent) {
    swipeRef.current = { x: e.clientX, y: e.clientY }
  }

  function onGridPointerUp(e: PointerEvent) {
    const start = swipeRef.current
    swipeRef.current = null
    if (!start || mode !== 'month') return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return
    shiftMonth(dx < 0 ? 1 : -1)
  }

  function closeSheet() {
    setSheetOpen(false)
    setSheetDrag(0)
    sheetStartY.current = null
    setThemePick(null)
    setChipMins([0])
    setTitle('')
    setPlace('')
    setEditingId(null)
    setErr(null)
  }

  function openCreate() {
    setEditingId(null)
    setTitle('')
    setPlace('')
    setTime('18:00')
    setThemePick(null)
    setChipMins([0])
    setErr(null)
    setSheetOpen(true)
  }

  function openEdit(e: CalendarEvent) {
    const d = new Date(e.start_at)
    setSelected(startOfDay(d))
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
    setEditingId(e.id)
    setTitle(e.title)
    setPlace(e.place || '')
    setTime(
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    )
    setThemePick(eventTheme(e))
    setChipMins(e.remind_offsets_min === undefined ? [0] : [...e.remind_offsets_min])
    setErr(null)
    setSheetOpen(true)
  }

  function onSheetHandleDown(e: PointerEvent<HTMLDivElement>) {
    sheetStartY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onSheetHandleMove(e: PointerEvent<HTMLDivElement>) {
    if (sheetStartY.current == null) return
    const dy = Math.max(0, e.clientY - sheetStartY.current)
    sheetDragRef.current = dy
    setSheetDrag(dy)
  }

  function onSheetHandleUp() {
    const dy = sheetDragRef.current
    sheetStartY.current = null
    sheetDragRef.current = 0
    if (dy > 88) {
      closeSheet()
      return
    }
    setSheetDrag(0)
  }

  async function onAdd() {
    const name = title.trim()
    if (!sheetOpen || !name || busy) return
    setBusy(true)
    setErr(null)
    try {
      const [h, m] = time.split(':').map((n) => Number(n))
      const start = new Date(selected)
      start.setHours(Number.isFinite(h) ? h : 15, Number.isFinite(m) ? m : 0, 0, 0)
      if (editingId) await updateEventFromGui(editingId, { title: name, start, place: place.trim(), theme, remind_offsets_min: chipMins })
      else await createEventFromGui({ title: name, start, place: place.trim(), theme, remind_offsets_min: chipMins })
      closeSheet()
      await reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Termin fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  function toggleChip(min: number | null) {
    if (min === null) {
      setChipMins([])
      return
    }
    setChipMins((cur) => {
      const next = cur.includes(min) ? cur.filter((x) => x !== min) : [...cur, min]
      return next.sort((a, b) => b - a).slice(0, 5)
    })
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
          <p>{headLine}</p>
        </div>
        <div className="cal-head-actions">
          <button type="button" className="ghost-btn cal-toolbar-btn" onClick={goToday}>
            Heute
          </button>
          <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>
            Zurück
          </button>
        </div>
      </header>

      <nav ref={modeThumb.hostRef} className="cal-modes pill-tabs" aria-label="Ansicht">
        <span ref={modeThumb.thumbRef} className="pill-tabs-thumb" aria-hidden />
        {(
          [
            ['month', 'Monat'],
            ['week', 'Woche'],
            ['list', 'Liste'],
            ['year', 'Jahr'],
          ] as const
        ).map(([id, name]) => (
          <button
            key={id}
            type="button"
            data-nav={id}
            aria-selected={mode === id}
            className={`cal-mode${mode === id ? ' is-on' : ''}`}
            onClick={() => setMode(id)}
          >
            {name}
          </button>
        ))}
      </nav>

      {mode !== 'list' ? (
        <div className="cal-nav">
          <button
            type="button"
            className="cal-nav-btn"
            aria-label={mode === 'year' ? 'Vorheriges Jahr' : mode === 'week' ? 'Vorherige Woche' : 'Vorheriger Monat'}
            onClick={() => {
              if (mode === 'year') shiftYear(-1)
              else if (mode === 'week') {
                const next = new Date(selected)
                next.setDate(next.getDate() - 7)
                setSelected(startOfDay(next))
                setCursor(new Date(next.getFullYear(), next.getMonth(), 1))
              } else shiftMonth(-1)
            }}
          >
            ←
          </button>
          <strong key={`${mode}-${year}-${month}-${isoDay(selected)}`} className="cal-nav-label">
            {mode === 'year'
              ? String(year)
              : mode === 'week'
                ? `${week[0].toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – ${week[6].toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}`
                : label}
          </strong>
          <button
            type="button"
            className="cal-nav-btn"
            aria-label={mode === 'year' ? 'Nächstes Jahr' : mode === 'week' ? 'Nächste Woche' : 'Nächster Monat'}
            onClick={() => {
              if (mode === 'year') shiftYear(1)
              else if (mode === 'week') {
                const next = new Date(selected)
                next.setDate(next.getDate() + 7)
                setSelected(startOfDay(next))
                setCursor(new Date(next.getFullYear(), next.getMonth(), 1))
              } else shiftMonth(1)
            }}
          >
            →
          </button>
        </div>
      ) : null}

      {mode === 'month' || mode === 'week' ? (
        <div className="cal-strip" role="tablist" aria-label="Woche">
          {week.map((d) => {
            const n = countOnDay(events, reminders, d)
            const on = sameDay(d, selected)
            return (
              <button
                key={isoDay(d)}
                type="button"
                role="tab"
                aria-selected={on}
                className={`cal-strip-day${on ? ' is-on' : ''}${sameDay(d, today) ? ' is-today' : ''}`}
                onClick={() => {
                  setSelected(d)
                  setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
                }}
              >
                <span>{WEEK[(d.getDay() + 6) % 7]}</span>
                <strong>{d.getDate()}</strong>
                {n ? <i className="cal-count">{n}</i> : <i className="cal-count is-empty" />}
              </button>
            )
          })}
        </div>
      ) : null}

      {nextUp && mode === 'month' ? (
        <button
          type="button"
          className="cal-next"
          data-theme={eventTheme(nextUp)}
          style={
            {
              borderLeftColor: calThemeOf(eventTheme(nextUp)).color,
              ['--cal-theme']: calThemeOf(eventTheme(nextUp)).color,
            } as CSSProperties
          }
          onClick={() => {
            const d = new Date(nextUp.start_at)
            setSelected(startOfDay(d))
            setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
          }}
        >
          <span className="cal-next-kicker">Als Nächstes · {calThemeOf(eventTheme(nextUp)).label}</span>
          <strong>{nextUp.title}</strong>
          <span>{formatDue(new Date(nextUp.start_at))}</span>
        </button>
      ) : null}

      {mode === 'year' ? (
        <div key={year} className={`cal-year cal-pane-in cal-month-${monthDir}`} role="grid" aria-label="Jahr">
          {MONTHS.map((name, mi) => (
            <button
              key={name}
              type="button"
              className={`cal-year-month${year === today.getFullYear() && mi === today.getMonth() ? ' is-now' : ''}`}
              style={{ ['--i']: mi } as CSSProperties}
              onClick={() => {
                setMonthDir('none')
                setCursor(new Date(year, mi, 1))
                setSelected(new Date(year, mi, 1))
                setMode('month')
              }}
            >
              <strong>{name}</strong>
              <div className="cal-year-grid">
                {monthCells(year, mi).map((d, i) => {
                  if (!d) return <i key={`${name}-e-${i}`} />
                  const key = isoDay(d)
                  const ids = themesForDay(events, d, sameDay)
                  return (
                    <span
                      key={key}
                      className={`cal-year-day${sameDay(d, today) ? ' today' : ''}${yearMarks.has(key) ? ' mark' : ''}`}
                      style={ids[0] ? { background: calThemeOf(ids[0]).color } : undefined}
                    />
                  )
                })}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'month' ? (
        <div
          key={`${year}-${month}`}
          className={`cal-grid cal-grid-swipe cal-month-in cal-month-${monthDir}`}
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
            const dots = themesForDay(events, d, sameDay)
            const hasRem = reminders.some((r) => sameDay(new Date(r.due_at), d))
            return (
              <button
                key={key}
                type="button"
                className={`cal-cell${isSel ? ' sel' : ''}${isToday ? ' today' : ''}${marks.has(key) ? ' has-mark' : ''}`}
                onClick={() => setSelected(d)}
              >
                <span className="cal-day-num">{d.getDate()}</span>
                {countOnDay(events, reminders, d) > 1 ? (
                  <i className="cal-count cal-count-cell">{countOnDay(events, reminders, d)}</i>
                ) : null}
                {dots.length || hasRem ? (
                  <span className="cal-dots">
                    {dots.map((id) => (
                      <i key={id} className="cal-dot-theme" style={{ background: calThemeOf(id).color }} />
                    ))}
                    {hasRem && !dots.length ? <i className="cal-dot-theme is-rem" /> : null}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}

      {mode === 'list' ? (
        <section className="cal-agenda cal-pane-in">
          {groups.length === 0 ? (
            <p className="memory-empty">Keine Termine in den nächsten drei Wochen.</p>
          ) : (
            groups.map((g) => (
              <div key={g.key} className="cal-agenda-day">
                <h3>{dayHeading(g.day, today)}</h3>
                <ul className="cal-cards">
                  {g.events.map((e) => (
                    <EventCard
                      key={e.id}
                      title={e.title}
                      when={timeLabel(e.start_at)}
                      place={e.place}
                      remind={remindLabel(e)}
                      theme={eventTheme(e)}
                      busy={busy}
                      onEdit={() => openEdit(e)}
                      onDelete={() => void onDelete(e.id)}
                    />
                  ))}
                  {g.rems.map((r) => (
                    <EventCard key={r.id} title={r.title} when={formatDue(new Date(r.due_at))} kind="Erinnerung" />
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      ) : null}

      {mode === 'week' ? (
        <section className="cal-week cal-pane-in" aria-label="Wochenübersicht">
          {week.map((d) => {
            const evs = events.filter((e) => sameDay(new Date(e.start_at), d)).sort((a, b) => (a.start_at < b.start_at ? -1 : 1))
            const rems = reminders.filter((r) => sameDay(new Date(r.due_at), d))
            return (
              <div key={isoDay(d)} className={`cal-week-col${sameDay(d, selected) ? ' is-on' : ''}${sameDay(d, today) ? ' is-today' : ''}`}>
                <button type="button" className="cal-week-head" onClick={() => setSelected(d)}>
                  <span>{WEEK[(d.getDay() + 6) % 7]}</span>
                  <strong>{d.getDate()}</strong>
                </button>
                {evs.length || rems.length ? (
                  <ul className="cal-week-list">
                    {evs.map((e) => (
                      <li key={e.id}>
                        <button type="button" className="cal-week-item" data-theme={eventTheme(e)} onClick={() => openEdit(e)}>
                          <span>{timeLabel(e.start_at)}</span>
                          <strong>{e.title}</strong>
                        </button>
                      </li>
                    ))}
                    {rems.map((r) => (
                      <li key={r.id}>
                        <span className="cal-week-item is-rem">
                          <span>{timeLabel(r.due_at)}</span>
                          <strong>{r.title}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <button type="button" className="cal-week-empty" onClick={() => { setSelected(d); openCreate() }}>
                    frei
                  </button>
                )}
              </div>
            )
          })}
        </section>
      ) : null}

      {mode === 'month' ? (
        <section className="cal-day">
          <div className="cal-day-head">
            <h3 key={isoDay(selected)} className="cal-day-title">
              {dayHeading(selected, today)}
            </h3>
            <span className="cal-day-meta">
              {dayEvents.length + dayRems.length
                ? `${dayEvents.length + dayRems.length} ${dayEvents.length + dayRems.length === 1 ? 'Eintrag' : 'Einträge'}`
                : 'frei'}
            </span>
          </div>
          {dayEvents.length === 0 && dayRems.length === 0 ? (
            <div className="cal-empty">
              <p className="memory-empty">Nichts an diesem Tag.</p>
              <button type="button" className="cal-empty-cta" onClick={openCreate}>
                ＋ Termin für {selected.toLocaleDateString('de-DE', { weekday: 'long' })}
              </button>
              <p className="settings-hint">Oder im Chat: „Samstag Geburtstag Jakob 18 Uhr“.</p>
            </div>
          ) : (
            <ul key={isoDay(selected)} className="cal-cards">
              {dayEvents.map((e) => (
                <EventCard
                  key={e.id}
                  title={e.title}
                  when={timeLabel(e.start_at)}
                  place={e.place}
                  remind={remindLabel(e)}
                  theme={eventTheme(e)}
                  busy={busy}
                  onEdit={() => openEdit(e)}
                  onDelete={() => void onDelete(e.id)}
                />
              ))}
              {dayRems.map((r) => (
                <EventCard key={r.id} title={r.title} when={formatDue(new Date(r.due_at))} kind="Erinnerung" />
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <button type="button" className="cal-fab" aria-label="Termin anlegen" onClick={openCreate}>
        ＋ Termin
      </button>

      <div
        className={`cal-sheet-backdrop${sheetOpen ? ' is-on' : ''}`}
        onClick={closeSheet}
        aria-hidden
      />
      <div
        className={`cal-sheet${sheetOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-label={editingId ? 'Termin ändern' : 'Termin anlegen'}
        aria-hidden={!sheetOpen}
        inert={!sheetOpen}
        style={sheetDrag ? { transform: `translateY(${sheetDrag}px)`, transition: 'none' } : undefined}
      >
        <div
          className="cal-sheet-handle"
          aria-hidden
          onPointerDown={onSheetHandleDown}
          onPointerMove={onSheetHandleMove}
          onPointerUp={onSheetHandleUp}
          onPointerCancel={onSheetHandleUp}
        >
          <i />
        </div>
        <h3>{editingId ? 'Termin ändern' : 'Termin anlegen'}</h3>
        <p className="cal-sheet-when">{dayHeading(selected, today)}</p>
        <p className="settings-hint">Thema kommt aus dem Titel — Sie können es ändern.</p>
        <form
          className="cal-form"
          onSubmit={(e) => {
            e.preventDefault()
            void onAdd()
          }}
        >
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="Titel, z. B. Geburtstag Jakob"
            disabled={busy || !sheetOpen}
            tabIndex={sheetOpen ? 0 : -1}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.currentTarget.value)}
            disabled={busy || !sheetOpen}
            tabIndex={sheetOpen ? 0 : -1}
          />
          <input
            type="date"
            className="cal-date"
            value={isoDay(selected)}
            onChange={(e) => {
              const d = parseIsoDay(e.currentTarget.value)
              if (!d) return
              setSelected(d)
              setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
            }}
            disabled={busy || !sheetOpen}
            tabIndex={sheetOpen ? 0 : -1}
          />
          <input
            className="cal-place"
            value={place}
            onChange={(e) => setPlace(e.currentTarget.value)}
            placeholder="Ort (optional)"
            disabled={busy || !sheetOpen}
            tabIndex={sheetOpen ? 0 : -1}
          />
          <div className="cal-theme-chips" role="group" aria-label="Thema">
            {CAL_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`cal-theme-chip${theme === t.id ? ' is-on' : ''}`}
                style={theme === t.id ? { borderColor: t.color, background: `${t.color}33` } : undefined}
                disabled={busy}
                onClick={() => setThemePick(t.id)}
              >
                <i className="cal-theme-swatch" style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>
          <div className="cal-remind-chips" role="group" aria-label="Erinnerung">
            {REMIND_CHIPS.map((c) => {
              const on = c.min === null ? chipMins.length === 0 : chipMins.includes(c.min)
              return (
                <button
                  key={c.label}
                  type="button"
                  className={`cal-remind-chip${on ? ' is-on' : ''}`}
                  disabled={busy}
                  onClick={() => toggleChip(c.min)}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
          <div className="cal-sheet-actions">
            <button type="button" className="ghost-btn" disabled={busy} onClick={closeSheet}>
              Abbrechen
            </button>
            <button type="submit" className="cal-add-btn" disabled={busy || !sheetOpen || !title.trim()}>
              Speichern
            </button>
          </div>
        </form>
        {err ? <p className="settings-hint">{err}</p> : null}
      </div>
    </div>
  )
}
