/** Gewohnheiten aus Wiederholung. Zweimal dasselbe bleibt, einmal noch nicht. */

import { loadSettings, saveSettings } from './store.ts'

export type Habit = { cue: string; act: string; n: number }

const MAX = 12

export function listHabits(): Habit[] {
  try {
    const raw = loadSettings().habits_json
    if (!raw) return []
    const rows = JSON.parse(raw) as Habit[]
    if (!Array.isArray(rows)) return []
    return rows
      .filter((row) => row && typeof row.cue === 'string' && typeof row.act === 'string' && Number(row.n) > 0)
      .slice(0, MAX)
  } catch {
    return []
  }
}

function saveHabits(rows: Habit[]): void {
  saveSettings({ habits_json: JSON.stringify(rows.slice(0, MAX)) })
}

export function noteHabit(cue: string, act: string): Habit {
  const key = cue.trim().slice(0, 40)
  const what = act.trim().slice(0, 40)
  const rows = listHabits().filter((row) => row.cue !== key || row.act === what)
  const hit = rows.find((row) => row.cue === key && row.act === what)
  if (hit) hit.n += 1
  else rows.unshift({ cue: key, act: what, n: 1 })
  saveHabits(rows)
  return rows.find((row) => row.cue === key && row.act === what) as Habit
}

/** Fest, ohne auf die zweite Wiederholung zu warten. Die andere Handlung derselben Lage fällt weg. */
export function setHabit(cue: string, act: string): void {
  const key = cue.trim().slice(0, 40)
  const what = act.trim().slice(0, 40)
  const rows = listHabits().filter((row) => row.cue !== key)
  rows.unshift({ cue: key, act: what, n: 3 })
  saveHabits(rows)
}

export function dropHabit(cue: string): void {
  const key = cue.trim()
  saveHabits(listHabits().filter((row) => row.cue !== key))
}

/** Nur eine gelernte Handlung. Einmal zählt noch nicht. */
export function habitAct(cue: string): string | null {
  const rows = listHabits()
    .filter((row) => row.cue === cue && row.n >= 2)
    .sort((a, b) => b.n - a.n)
  return rows[0]?.act || null
}

export function habitSpeech(): string {
  const rows = listHabits().filter((row) => row.n >= 2)
  if (!rows.length) return 'Noch keine Gewohnheit. Zweimal dasselbe, dann bleibt es.'
  return `Gewohnheiten: ${rows.map(habitLine).join(' ')}`
}

function habitLine(row: Habit): string {
  if (row.cue === 'dokument' && row.act === 'recherche') return 'Bei einem Dokument recherchieren.'
  if (row.cue === 'dokument' && row.act === 'ohne') return 'Bei einem Dokument nicht recherchieren.'
  const nach = row.cue.startsWith('nach:') ? row.cue.slice(5) : ''
  if (nach && row.act === 'recherche') return `Nach ${nach} recherchieren.`
  if (nach && row.act === 'download') return `Nach ${nach} die Dateien laden.`
  if (nach && row.act === 'fertig') return `Nach ${nach} Fertig sagen.`
  return `${row.cue}: ${row.act}.`
}
