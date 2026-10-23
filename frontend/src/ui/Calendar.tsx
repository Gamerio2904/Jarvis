import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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
import { eventEndAt, expandEvents, recurLabel } from '../engine/calendar-occur.ts'
import { shareOrDownloadIcs } from '../engine/calendar-ics.ts'

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

function timeLabel(iso: string, allDay?: boolean): string {
  if (allDay) return 'ganztägig'
  const d = new Date(iso)
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function remindLabel(e: CalendarEvent): string | undefined {
  const series = recurLabel(e)
  let remind: string | undefined
  if (e.remind_offsets_min === undefined) remind = 'Erinnerung am Termin'
  else if (Array.isArray(e.remind_offsets_min) && e.remind_offsets_min.length) {
    remind = `Erinnerung: ${formatRemindOffsets(e.remind_offsets_min)}`
  }
  if (series && remind) return `${series} · ${remind}`
  return series || remind
}

function countOnDay(events: CalendarEvent[], reminders: Reminder[], day: Date): number {
  return (
    events.filter((e) => sameDay(new Date(e.start_at), day)).length +
    reminders.filter((r) => sameDay(new Date(r.due_at), day)).length
  )
}

function clockMin(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

/** Sichtbare Stunden: ab 7 Uhr, bis einschließlich 22 Uhr. Frühere und spätere Termine weiten das Raster. */
function weekHourSpan(days: Date[], events: CalendarEvent[], reminders: Reminder[]): { startH: number; endH: number } {
  let startH = 7
  let endH = 23
  const touch = (startMin: number, endMin: number) => {
    startH = Math.min(startH, Math.floor(startMin / 60))
    endH = Math.max(endH, Math.ceil(endMin / 60))
  }
  for (const day of days) {
    for (const e of events) {
      if (e.all_day || !sameDay(new Date(e.start_at), day)) continue
      const startMin = clockMin(e.start_at)
      const end = eventEndAt(e)
      const endMin = sameDay(end, day) ? clockMin(end.toISOString()) : 24 * 60
      touch(startMin, Math.max(endMin, startMin + 30))
    }
    for (const r of reminders) {
      if (!sameDay(new Date(r.due_at), day)) continue
      const startMin = clockMin(r.due_at)
      touch(startMin, Math.min(24 * 60, startMin + 30))
    }
  }
  startH = Math.max(0, Math.min(startH, 7))
  endH = Math.min(24, Math.max(endH, startH + 1))
  return { startH, endH }
}

function placeColumns<T extends { startMin: number; endMin: number }>(rows: T[]): Array<T & { col: number; cols: number }> {
  const items = rows
    .map((row) => ({ ...row, col: 0, cols: 1 }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
  const colEnds: number[] = []
  for (const item of items) {
    let col = colEnds.findIndex((end) => end <= item.startMin + 0.01)
    if (col < 0) {
      col = colEnds.length
      colEnds.push(item.endMin)
    } else colEnds[col] = item.endMin
    item.col = col
  }
  for (const item of items) {
    let max = item.col
    for (const other of items) {
      if (other.startMin < item.endMin && item.startMin < other.endMin) max = Math.max(max, other.col)
    }
    const cols = max + 1
    for (const other of items) {
      if (other.startMin < item.endMin && item.startMin < other.endMin) other.cols = Math.max(other.cols, cols)
    }
  }
  return items
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

function PressBox({
  className,
  style,
  label,
  onTap,
  onHold,
  onDrag,
  children,
}: {
  className?: string
  style?: CSSProperties
  label?: string
  onTap?: () => void
  onHold: (x: number, y: number) => void
  onDrag?: (phase: 'move' | 'end', x: number, y: number) => void
  children: ReactNode
}) {
  const timer = useRef(0)
  const fired = useRef(false)
  const dragging = useRef(false)
  const origin = useRef({ x: 0, y: 0 })
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <button
      type="button"
      className={className}
      style={style}
      aria-label={label}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        fired.current = false
        dragging.current = false
        origin.current = { x: e.clientX, y: e.clientY }
        e.currentTarget.setPointerCapture(e.pointerId)
        window.clearTimeout(timer.current)
        const x = e.clientX
        const y = e.clientY
        timer.current = window.setTimeout(() => {
          if (dragging.current) return
          fired.current = true
          onHold(x, y)
        }, 480)
      }}
      onPointerMove={(e) => {
        const dist = Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y)
        if (dist > 10 && onDrag) {
          window.clearTimeout(timer.current)
          dragging.current = true
          fired.current = true
          onDrag('move', e.clientX, e.clientY)
          return
        }
        if (dist > 14) window.clearTimeout(timer.current)
      }}
      onPointerUp={(e) => {
        window.clearTimeout(timer.current)
        if (dragging.current) {
          dragging.current = false
          fired.current = true
          onDrag?.('end', e.clientX, e.clientY)
        }
      }}
      onPointerCancel={() => {
        window.clearTimeout(timer.current)
        dragging.current = false
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        fired.current = true
        onHold(e.clientX, e.clientY)
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (fired.current) {
          fired.current = false
          return
        }
        onTap?.()
      }}
    >
      {children}
    </button>
  )
}

function EventCard({
  title,
  when,
  place,
  remind,
  theme,
  kind,
  onOpen,
  onEdit,
  onDelete,
  onHold,
  onDrag,
  busy,
}: {
  title: string
  when: string
  place?: string
  remind?: string
  theme?: CalThemeId
  kind?: string
  onOpen?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onHold?: (x: number, y: number) => void
  onDrag?: (phase: 'move' | 'end', x: number, y: number) => void
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
        role={onOpen || onEdit ? 'button' : undefined}
        tabIndex={onOpen || onEdit ? 0 : undefined}
        onPointerDown={
          onHold
            ? (e) => {
                if (e.button !== 0) return
                const node = e.currentTarget
                node.dataset.ox = String(e.clientX)
                node.dataset.oy = String(e.clientY)
                node.dataset.held = ''
                node.dataset.drag = ''
                node.setPointerCapture(e.pointerId)
                window.clearTimeout(Number(node.dataset.hold || 0))
                const x = e.clientX
                const y = e.clientY
                const id = window.setTimeout(() => {
                  node.dataset.held = '1'
                  onHold(x, y)
                }, 480)
                node.dataset.hold = String(id)
              }
            : undefined
        }
        onPointerCancel={(e) => {
          window.clearTimeout(Number(e.currentTarget.dataset.hold || 0))
          e.currentTarget.dataset.drag = ''
        }}
        onPointerMove={(e) => {
          const node = e.currentTarget
          const ox = Number(node.dataset.ox || e.clientX)
          const oy = Number(node.dataset.oy || e.clientY)
          const dist = Math.hypot(e.clientX - ox, e.clientY - oy)
          if (dist > 10 && onDrag) {
            window.clearTimeout(Number(node.dataset.hold || 0))
            node.dataset.drag = '1'
            node.dataset.held = '1'
            onDrag('move', e.clientX, e.clientY)
            return
          }
          if (dist > 14) {
            window.clearTimeout(Number(node.dataset.hold || 0))
          }
        }}
        onPointerUp={(e) => {
          window.clearTimeout(Number(e.currentTarget.dataset.hold || 0))
          if (e.currentTarget.dataset.drag === '1') {
            e.currentTarget.dataset.drag = ''
            onDrag?.('end', e.clientX, e.clientY)
          }
        }}
        onContextMenu={
          onHold
            ? (e) => {
                e.preventDefault()
                onHold(e.clientX, e.clientY)
              }
            : undefined
        }
        onClick={(e) => {
          if (e.currentTarget.dataset.held === '1') {
            e.currentTarget.dataset.held = ''
            return
          }
          if (onOpen) onOpen()
          else onEdit?.()
        }}
        onKeyDown={
          onOpen || onEdit
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (onOpen) onOpen()
                  else onEdit?.()
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

function WeekBoard({
  week,
  shown,
  reminders,
  selected,
  today,
  onSelect,
  onDetails,
  onHold,
  onDrag,
}: {
  week: Date[]
  shown: CalendarEvent[]
  reminders: Reminder[]
  selected: Date
  today: Date
  onSelect: (day: Date) => void
  onDetails: (event: CalendarEvent) => void
  onHold: (event: CalendarEvent, x: number, y: number) => void
  onDrag: (id: string, title: string, phase: 'move' | 'end', x: number, y: number) => void
}) {
  const { startH, endH } = weekHourSpan(week, shown, reminders)
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i)
  const spanMin = Math.max(60, (endH - startH) * 60)
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const anyAll = week.some((d) => shown.some((e) => e.all_day && sameDay(new Date(e.start_at), d)))
  return (
    <div className="cal-week-scroll">
      <div
        className="cal-week cal-pane-in"
        role="grid"
        aria-label="Wochenübersicht"
        style={
          {
            ['--cal-hours']: String(hours.length),
            gridTemplateRows: anyAll ? 'auto minmax(0, 1fr)' : 'minmax(0, 1fr)',
          } as CSSProperties
        }
      >
        {anyAll ? (
          <>
            <div className="cal-week-gutter">ganz</div>
            {week.map((d) => {
              const all = shown.filter((e) => e.all_day && sameDay(new Date(e.start_at), d))
              return (
                <div
                  key={`all-${isoDay(d)}`}
                  className={`cal-week-all${sameDay(d, selected) ? ' is-on' : ''}`}
                  data-cal-day={isoDay(d)}
                >
                  {all.map((e) => {
                    const face = calThemeOf(eventTheme(e))
                    return (
                      <PressBox
                        key={`${e.id}-${e.start_at}`}
                        className="cal-week-all-item"
                        style={{ ['--cal-theme']: face.color, borderLeftColor: face.color } as CSSProperties}
                        label={e.title}
                        onTap={() => onDetails(e)}
                        onHold={(x, y) => onHold(e, x, y)}
                        onDrag={(phase, x, y) => onDrag(e.id, e.title, phase, x, y)}
                      >
                        {e.title}
                      </PressBox>
                    )
                  })}
                </div>
              )
            })}
          </>
        ) : null}
        <div className="cal-week-times" aria-hidden>
          {hours.map((h) => (
            <div key={h} className="cal-week-hour" data-hour={h}>
              {h}
            </div>
          ))}
        </div>
        {week.map((d) => {
          const timed = shown
            .filter((e) => !e.all_day && sameDay(new Date(e.start_at), d))
            .map((e) => {
              const startMin = clockMin(e.start_at)
              const end = eventEndAt(e)
              const endMin = sameDay(end, d) ? Math.max(clockMin(end.toISOString()), startMin + 15) : 24 * 60
              const face = calThemeOf(eventTheme(e))
              return {
                id: e.id,
                key: `${e.id}-${e.start_at}`,
                title: e.title,
                startMin,
                endMin: Math.max(endMin, startMin + 15),
                color: face.color,
                rem: false,
                onOpen: () => onDetails(e),
                onHold: (x: number, y: number) => onHold(e, x, y),
              }
            })
          const rems = reminders
            .filter((r) => sameDay(new Date(r.due_at), d))
            .map((r) => {
              const startMin = clockMin(r.due_at)
              return {
                id: '',
                key: r.id,
                title: r.title,
                startMin,
                endMin: Math.min(24 * 60, startMin + 30),
                color: '#94a3b8',
                rem: true,
                onOpen: undefined as (() => void) | undefined,
                onHold: undefined as ((x: number, y: number) => void) | undefined,
              }
            })
          const placed = placeColumns([...timed, ...rems])
          const showNow = sameDay(d, today) && nowMin >= startH * 60 && nowMin <= endH * 60
          return (
            <div
              key={isoDay(d)}
              className={`cal-week-col${sameDay(d, selected) ? ' is-on' : ''}${sameDay(d, today) ? ' is-today' : ''}`}
              data-cal-day={isoDay(d)}
              data-start-h={startH}
              data-end-h={endH}
              onClick={() => onSelect(d)}
            >
              {showNow ? (
                <div className="cal-week-now" style={{ top: `${((nowMin - startH * 60) / spanMin) * 100}%` }} />
              ) : null}
              {placed.map((block) => {
                const top = ((block.startMin - startH * 60) / spanMin) * 100
                const height = Math.max(4, ((block.endMin - block.startMin) / spanMin) * 100)
                const body = <strong>{block.title}</strong>
                const style = {
                  top: `${top}%`,
                  height: `${height}%`,
                  left: `calc(${(block.col / block.cols) * 100}% + 1px)`,
                  width: `calc(${100 / block.cols}% - 2px)`,
                  ['--cal-theme']: block.color,
                  borderLeftColor: block.color,
                } as CSSProperties
                if (!block.onOpen) {
                  return (
                    <span key={block.key} className="cal-week-block is-rem" style={style}>
                      {body}
                    </span>
                  )
                }
                return (
                  <PressBox
                    key={block.key}
                    className="cal-week-block"
                    style={style}
                    label={block.title}
                    onTap={() => block.onOpen?.()}
                    onHold={(x, y) => block.onHold?.(x, y)}
                    onDrag={(phase, x, y) => onDrag(block.id, block.title, phase, x, y)}
                  >
                    {body}
                  </PressBox>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
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
  const [allDay, setAllDay] = useState(false)
  const [hold, setHold] = useState<{ id: string; x: number; y: number } | null>(null)
  const [recur, setRecur] = useState<CalendarEvent['recur']>(null)
  const [monthDir, setMonthDir] = useState<'left' | 'right' | 'none'>('none')
  const [detail, setDetail] = useState<CalendarEvent | null>(null)
  const [sheetDrag, setSheetDrag] = useState(0)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  const sheetStartY = useRef<number | null>(null)
  const sheetDragRef = useRef(0)
  const titleRef = useRef<HTMLInputElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // Der Kalender öffnet grundsätzlich in der Monatsansicht — immer.
    setMode('month')
  }, [])

  useEffect(() => {
    if (!hold) return
    const close = () => setHold(null)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [hold])
  const modeThumb = useSlidingThumb(mode)
  const dragRef = useRef<{ id: string; title: string } | null>(null)
  const ghostRef = useRef<HTMLDivElement>(null)

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
    const head = headRef.current
    const scroller = head?.closest('.cal-view')
    if (!head || !(scroller instanceof HTMLElement)) return
    const pin = () => {
      const delta = head.getBoundingClientRect().top - scroller.getBoundingClientRect().top
      if (Math.abs(delta) < 2) return
      scroller.scrollTop += delta
    }
    titleRef.current?.focus({ preventScroll: true })
    if (editingId) titleRef.current?.select()
    pin()
    const frame = window.requestAnimationFrame(pin)
    const soon = window.setTimeout(pin, 120)
    const later = window.setTimeout(pin, 480)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(soon)
      window.clearTimeout(later)
    }
  }, [sheetOpen, editingId])

  function showDay(d: Date) {
    const day = startOfDay(d)
    setSelected(day)
    setCursor(new Date(day.getFullYear(), day.getMonth(), 1))
  }

  useEffect(() => {
    if (!sheetOpen || themePick || themeGuess !== 'geburtstag') return
    setRecur((cur) => cur || 'yearly')
  }, [sheetOpen, themePick, themeGuess])

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

  const shown = useMemo(() => {
    const from = new Date(year, 0, 1)
    from.setDate(from.getDate() - 8)
    const until = new Date(year + 1, 0, 8)
    const listUntil = new Date(today)
    listUntil.setDate(listUntil.getDate() + 22)
    const end = listUntil.getTime() > until.getTime() ? listUntil : until
    return expandEvents(events, from, end)
  }, [events, year, today])
  const week = useMemo(() => weekDays(selected), [selected])
  const groups = useMemo(() => upcomingGroups(shown, reminders, today), [shown, reminders, today])
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
    if (!start || mode !== 'month' || dragRef.current) return
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
    setAllDay(false)
    setRecur(null)
    setTitle('')
    setPlace('')
    setEditingId(null)
    setErr(null)
  }

  function pickTheme(id: CalThemeId) {
    setThemePick(id)
    if (id === 'geburtstag') setRecur('yearly')
  }

  function openCreate() {
    setEditingId(null)
    setTitle('')
    setPlace('')
    setTime('18:00')
    setThemePick(null)
    setChipMins([0])
    setAllDay(false)
    setRecur(null)
    setErr(null)
    setSheetOpen(true)
  }

  /** Erst nur Details zeigen. Bearbeiten kommt vom Detail-Fenster aus. */
  function openDetails(e: CalendarEvent) {
    const master = events.find((row) => row.id === e.id) || e
    const d = new Date(master.start_at)
    setSelected(startOfDay(d))
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
    setDetail(master)
    setErr(null)
  }

  function closeDetails() {
    setDetail(null)
  }

  function openEdit(e: CalendarEvent) {
    setDetail(null)
    const master = events.find((row) => row.id === e.id) || e
    const d = new Date(master.start_at)
    setSelected(startOfDay(d))
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1))
    setEditingId(master.id)
    setTitle(master.title)
    setPlace(master.place || '')
    setAllDay(Boolean(master.all_day))
    setRecur(master.recur || null)
    setTime(
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    )
    setThemePick(eventTheme(master))
    setChipMins(Array.isArray(master.remind_offsets_min) ? [...master.remind_offsets_min] : [0])
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
      if (allDay) start.setHours(0, 0, 0, 0)
      else start.setHours(Number.isFinite(h) ? h : 15, Number.isFinite(m) ? m : 0, 0, 0)
      const payload = {
        title: name,
        start,
        place: place.trim(),
        theme,
        remind_offsets_min: chipMins,
        all_day: allDay,
        recur: recur || null,
      }
      if (editingId) await updateEventFromGui(editingId, payload)
      else await createEventFromGui(payload)
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

  function paintDrop(x: number, y: number) {
    const hit = document.elementFromPoint(x, y)
    const day = hit?.closest('[data-cal-day]')
    document.querySelectorAll('.cal-view .is-drop').forEach((node) => node.classList.remove('is-drop'))
    day?.classList.add('is-drop')
    return day instanceof HTMLElement ? day : null
  }

  function trackDrag(id: string, title: string, phase: 'move' | 'end', x: number, y: number) {
    const ghost = ghostRef.current
    if (phase === 'move') {
      dragRef.current = { id, title }
      if (ghost) {
        ghost.hidden = false
        ghost.textContent = title
        ghost.style.left = `${x}px`
        ghost.style.top = `${y}px`
      }
      paintDrop(x, y)
      return
    }
    const info = dragRef.current
    dragRef.current = null
    if (ghost) ghost.hidden = true
    const day = paintDrop(x, y)
    document.querySelectorAll('.cal-view .is-drop').forEach((node) => node.classList.remove('is-drop'))
    if (!info || !day?.dataset.calDay) return
    const startH = Number(day.dataset.startH)
    const endH = Number(day.dataset.endH)
    let minutes: number | null = null
    if (Number.isFinite(startH) && Number.isFinite(endH) && endH > startH) {
      const rect = day.getBoundingClientRect()
      const ratio = rect.height > 0 ? (y - rect.top) / rect.height : 0
      const raw = startH * 60 + Math.min(1, Math.max(0, ratio)) * (endH - startH) * 60
      minutes = Math.max(startH * 60, Math.min(endH * 60 - 15, Math.round(raw / 15) * 15))
    }
    void commitDrop(info.id, day.dataset.calDay, minutes)
  }

  async function commitDrop(id: string, iso: string, minutes: number | null) {
    const row = events.find((event) => event.id === id)
    if (!row || busy) return
    const prev = new Date(row.start_at)
    const parts = iso.split('-').map((part) => Number(part))
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return
    const start = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0)
    let allDay = Boolean(row.all_day)
    if (minutes != null) {
      allDay = false
      start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
    } else if (!allDay) {
      start.setHours(prev.getHours(), prev.getMinutes(), 0, 0)
    }
    const length = Math.max(eventEndAt(row).getTime() - prev.getTime(), 15 * 60_000)
    const end = new Date(start.getTime() + (allDay ? 86_400_000 : length))
    setBusy(true)
    try {
      await updateEventFromGui(row.id, {
        title: row.title,
        start,
        end,
        place: row.place,
        all_day: allDay,
        recur: row.recur || null,
        theme: eventTheme(row),
        remind_offsets_min: row.remind_offsets_min,
      })
      setSelected(startOfDay(start))
      setCursor(new Date(start.getFullYear(), start.getMonth(), 1))
      await reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Verschieben fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  const label = cursor.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <div className={`cal-view fx-in${leaving ? ' is-leaving' : ''}`}>
      <header className="cal-top">
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
        <div className="cal-head-actions">
          <button type="button" className="ghost-btn cal-toolbar-btn" onClick={goToday}>
            Heute
          </button>
          <button
            type="button"
            className="ghost-btn cal-toolbar-btn"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void shareOrDownloadIcs()
                .catch((e) => setErr(e instanceof Error ? e.message : 'ICS fehlgeschlagen'))
                .finally(() => setBusy(false))
            }}
          >
            ICS
          </button>
          <button type="button" className="ghost-btn cal-toolbar-btn" onClick={onClose}>
            Zurück
          </button>
        </div>
      </header>

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
        <div className={`cal-strip${mode === 'week' ? ' is-week' : ''}`} role="tablist" aria-label="Woche">
          {mode === 'week' ? <span className="cal-strip-gutter" aria-hidden /> : null}
          {week.map((d) => {
            const n = countOnDay(shown, reminders, d)
            const on = sameDay(d, selected)
            return (
              <button
                key={isoDay(d)}
                type="button"
                role="tab"
                aria-selected={on}
                className={`cal-strip-day${on ? ' is-on' : ''}${sameDay(d, today) ? ' is-today' : ''}`}
                onClick={() => showDay(d)}
              >
                <span>{WEEK[(d.getDay() + 6) % 7]}</span>
                <strong>{d.getDate()}</strong>
                {n ? <i className="cal-count">{n}</i> : <i className="cal-count is-empty" />}
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="cal-board">
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
                  const ids = themesForDay(shown, d, sameDay)
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
          style={{ gridTemplateRows: `auto repeat(${Math.max(1, cells.length / 7)}, minmax(0, 1fr))` }}
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
            const dots = themesForDay(shown, d, sameDay)
            const hasRem = reminders.some((r) => sameDay(new Date(r.due_at), d))
            const chips = shown.filter((event) => sameDay(new Date(event.start_at), d)).slice(0, 2)
            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                data-cal-day={key}
                className={`cal-cell${isSel ? ' sel' : ''}${isToday ? ' today' : ''}${marks.has(key) ? ' has-mark' : ''}`}
                onClick={() => showDay(d)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    showDay(d)
                  }
                }}
                aria-label={`Termine am ${d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}`}
              >
                <span className="cal-day-num">{d.getDate()}</span>
                {chips.map((event) => {
                  const face = calThemeOf(eventTheme(event))
                  return (
                    <PressBox
                      key={`${event.id}-${event.start_at}`}
                      className="cal-cell-chip"
                      style={{ ['--cal-theme']: face.color, borderLeftColor: face.color } as CSSProperties}
                      label={event.title}
                      onTap={() => openDetails(event)}
                      onHold={(x, y) => setHold({ id: event.id, x, y })}
                      onDrag={(phase, x, y) => trackDrag(event.id, event.title, phase, x, y)}
                    >
                      {event.title}
                    </PressBox>
                  )
                })}
                {countOnDay(shown, reminders, d) > chips.length ? (
                  <i className="cal-count cal-count-cell">{countOnDay(shown, reminders, d)}</i>
                ) : null}
                {!chips.length && (dots.length || hasRem) ? (
                  <span className="cal-dots">
                    {dots.map((id) => (
                      <i key={id} className="cal-dot-theme" style={{ background: calThemeOf(id).color }} />
                    ))}
                    {hasRem && !dots.length ? <i className="cal-dot-theme is-rem" /> : null}
                  </span>
                ) : null}
              </div>
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
              <div key={g.key} className="cal-agenda-day" data-cal-day={g.key}>
                <h3>{dayHeading(g.day, today)}</h3>
                <ul className="cal-cards">
                  {g.events.map((e) => (
                    <EventCard
                      key={`${e.id}-${e.start_at}`}
                      title={e.title}
                      when={timeLabel(e.start_at, e.all_day)}
                      place={e.place}
                      remind={remindLabel(e)}
                      theme={eventTheme(e)}
                      busy={busy}
                      onOpen={() => openDetails(e)}
                      onEdit={() => openEdit(e)}
                      onDelete={() => void onDelete(e.id)}
                      onHold={(x, y) => setHold({ id: e.id, x, y })}
                      onDrag={(phase, x, y) => trackDrag(e.id, e.title, phase, x, y)}
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
        <WeekBoard
          week={week}
          shown={shown}
          reminders={reminders}
          selected={selected}
          today={today}
          onSelect={(d) => showDay(d)}
          onDetails={openDetails}
          onHold={(event, x, y) => setHold({ id: event.id, x, y })}
          onDrag={trackDrag}
        />
      ) : null}
      </div>

      <div ref={ghostRef} className="cal-drag-ghost" hidden />

      {sheetOpen
        ? null
        : createPortal(
            <button type="button" className="cal-fab" aria-label="Termin anlegen" onClick={openCreate}>
              ＋ Termin
            </button>,
            document.body,
          )}

      <div
        className={`cal-sheet-backdrop${sheetOpen ? ' is-on' : ''}`}
        onClick={closeSheet}
        aria-hidden
      />
      <div
        className={`cal-sheet${sheetOpen ? ' is-open' : ''}`}
        ref={sheetRef}
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
        <h3 ref={headRef}>{editingId ? 'Termin ändern' : 'Termin anlegen'}</h3>
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
            lang="de"
            value={time}
            onChange={(e) => setTime(e.currentTarget.value)}
            disabled={busy || !sheetOpen || allDay}
            tabIndex={sheetOpen ? 0 : -1}
          />
          <input
            type="date"
            lang="de"
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
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={allDay}
              disabled={busy || !sheetOpen}
              onChange={(e) => setAllDay(e.target.checked)}
              tabIndex={sheetOpen ? 0 : -1}
            />
            <span>Ganztägig</span>
          </label>
          <select
            className="cal-place"
            value={recur || ''}
            disabled={busy || !sheetOpen}
            onChange={(e) => setRecur((e.target.value || null) as CalendarEvent['recur'])}
            tabIndex={sheetOpen ? 0 : -1}
            aria-label="Wiederholung"
          >
            <option value="">Einmal</option>
            <option value="weekly">Jede Woche</option>
            <option value="monthly">Jeden Monat</option>
            <option value="yearly">Jedes Jahr</option>
          </select>
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
                onClick={() => pickTheme(t.id)}
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

      {detail
        ? (() => {
            const face = calThemeOf(eventTheme(detail))
            const end = eventEndAt(detail)
            const day = dayHeading(new Date(detail.start_at), today)
            const span = detail.all_day
              ? day
              : `${day} · ${timeLabel(detail.start_at, detail.all_day)} – ${timeLabel(end.toISOString(), detail.all_day)}`
            const place = detail.place ? `Ort: ${detail.place}` : ''
            const series = recurLabel(detail)
            const remind = remindLabel(detail)
            return (
              <>
                <div className="cal-sheet-backdrop is-on" onClick={closeDetails} aria-hidden />
                <div className="cal-sheet is-open" role="dialog" aria-label="Termin-Details">
                  <div className="cal-sheet-handle" aria-hidden onClick={closeDetails}>
                    <i />
                  </div>
                  <p className="cal-detail-head">
                    <span className="cal-theme-pill" style={{ background: face.color }}>
                      {face.label}
                    </span>
                  </p>
                  <h3 className="cal-detail-title">{detail.title}</h3>
                  <p className="cal-detail-row">{span}</p>
                  {place ? <p className="cal-detail-row">{place}</p> : null}
                  {series ? <p className="cal-detail-row">{series}</p> : null}
                  {remind ? <p className="cal-detail-row">{remind}</p> : null}
                  <div className="cal-sheet-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      disabled={busy}
                      onClick={() => {
                        const id = detail.id
                        closeDetails()
                        void onDelete(id)
                      }}
                    >
                      Löschen
                    </button>
                    <button type="button" className="cal-add-btn" disabled={busy} onClick={() => openEdit(detail)}>
                      Bearbeiten
                    </button>
                  </div>
                </div>
              </>
            )
          })()
        : null}
      {hold
        ? createPortal(
            <div
              className="hold-menu"
              role="menu"
              style={{
                left: Math.max(8, Math.min(hold.x, window.innerWidth - 168)),
                top: Math.max(8, Math.min(hold.y, window.innerHeight - 64)),
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="is-danger"
                role="menuitem"
                onClick={() => {
                  const id = hold.id
                  setHold(null)
                  void onDelete(id)
                }}
              >
                Löschen
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
