import { getJson } from './http-json.ts'
import { loadSettings, saveSettings } from './store.ts'

const UA = { Accept: 'application/json', 'User-Agent': 'Jarvis/4.0.0 (local.jarvis.app)' }
const TTL_MS = 20 * 60_000

export type SeriesPoint = { date: string; value: number }

export type OilQuote = { value: number; date: string; source: string }

export type FxHistory = {
  from: string
  to: string
  last: number
  date: string
  d7: number | null
  d30: number | null
}

export type E10Spot = { price: number; at: string }

export type ShockWindow = {
  id: string
  label: string
  from: string
  to: string
  tags: string[]
}

/** Nur Datumsfenster — Preise kommen aus der Serie, nicht aus dem Modellgedächtnis. */
export const SHOCK_WINDOWS: ShockWindow[] = [
  { id: 'hormuz2019', label: 'Tanker in der Straße von Hormus 2019', from: '2019-06-13', to: '2019-06-21', tags: ['hormus', 'oil'] },
  { id: 'abqaiq2019', label: 'Angriff auf Abqaiq 2019', from: '2019-09-14', to: '2019-09-20', tags: ['hormus', 'oil'] },
  { id: 'ukraine2022', label: 'Invasion der Ukraine 2022', from: '2022-02-24', to: '2022-03-08', tags: ['ukraine', 'oil'] },
]

export function analogPct(points: SeriesPoint[], from: string, to: string): number | null {
  const before = points.filter((p) => p.date < from)
  const inside = points.filter((p) => p.date >= from && p.date <= to)
  if (!before.length || !inside.length) return null
  const base = before[before.length - 1].value
  if (!Number.isFinite(base) || base === 0) return null
  let peak = inside[0].value
  for (const p of inside) {
    if (Math.abs(p.value - base) > Math.abs(peak - base)) peak = p.value
  }
  return Math.round(((peak - base) / base) * 1000) / 10
}

export function pickAnalog(
  points: SeriesPoint[],
  tags: string[],
): { label: string; pct: number; from: string; to: string } | null {
  const want = new Set(tags)
  for (const w of SHOCK_WINDOWS) {
    if (!w.tags.some((t) => want.has(t))) continue
    const pct = analogPct(points, w.from, w.to)
    if (pct == null) continue
    return { label: w.label, pct, from: w.from, to: w.to }
  }
  return null
}

export function seriesDelta(points: SeriesPoint[], days: number): number | null {
  if (points.length < 2) return null
  const last = points[points.length - 1]
  const cut = addDays(last.date, -days)
  const prev = [...points].reverse().find((p) => p.date <= cut) || points[0]
  if (!prev || prev.date === last.date || !Number.isFinite(prev.value) || prev.value === 0) return null
  return Math.round(((last.value - prev.value) / prev.value) * 1000) / 10
}

function addDays(isoDate: string, n: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function cacheFresh(at: string, now = Date.now()): boolean {
  const t = Date.parse(at)
  return Number.isFinite(t) && now - t < TTL_MS
}

export async function fetchFxHistory(from = 'USD', to = 'EUR'): Promise<FxHistory | null> {
  const end = new Date()
  const start = new Date(end.getTime() - 40 * 24 * 3600_000)
  const a = start.toISOString().slice(0, 10)
  const b = end.toISOString().slice(0, 10)
  const urls = [
    `https://api.frankfurter.app/${a}..${b}?from=${from}&to=${to}`,
    `https://api.frankfurter.dev/v1/${a}..${b}?base=${from}&symbols=${to}`,
  ]
  for (const url of urls) {
    try {
      const { status, json } = await getJson(url, UA)
      if (status < 200 || status >= 300) continue
      const rates = json.rates && typeof json.rates === 'object' ? (json.rates as Record<string, unknown>) : {}
      const points: SeriesPoint[] = []
      for (const [date, row] of Object.entries(rates)) {
        const rec = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
        const value = Number(rec[to])
        if (Number.isFinite(value)) points.push({ date, value })
      }
      points.sort((x, y) => (x.date < y.date ? -1 : 1))
      if (!points.length) continue
      const last = points[points.length - 1]
      return {
        from,
        to,
        last: last.value,
        date: last.date,
        d7: seriesDelta(points, 7),
        d30: seriesDelta(points, 30),
      }
    } catch {
      /* nächste URL */
    }
  }
  return null
}

export async function fetchBrent(key: string): Promise<{ quote: OilQuote | null; points: SeriesPoint[]; missing: 'no_key' | 'fetch' | null }> {
  const trimmed = key.trim()
  if (!trimmed) return { quote: null, points: [], missing: 'no_key' }
  const start = new Date()
  start.setUTCFullYear(start.getUTCFullYear() - 8)
  const q = new URLSearchParams({
    series_id: 'DCOILBRENTEU',
    api_key: trimmed,
    file_type: 'json',
    observation_start: start.toISOString().slice(0, 10),
    sort_order: 'asc',
  })
  try {
    const { status, json } = await getJson(`https://api.stlouisfed.org/fred/series/observations?${q}`, UA)
    const rows = (json.observations as Array<Record<string, unknown>> | undefined) || []
    if (status < 200 || status >= 300 || !rows.length) return { quote: null, points: [], missing: 'fetch' }
    const points: SeriesPoint[] = []
    for (const r of rows) {
      const date = String(r.date || '').trim()
      const value = Number(r.value)
      if (!date || !Number.isFinite(value)) continue
      points.push({ date, value })
    }
    if (!points.length) return { quote: null, points: [], missing: 'fetch' }
    const last = points[points.length - 1]
    return {
      quote: { value: last.value, date: last.date, source: 'FRED DCOILBRENTEU' },
      points,
      missing: null,
    }
  } catch {
    return { quote: null, points: [], missing: 'fetch' }
  }
}

export function readE10Spot(): E10Spot | null {
  try {
    const raw = loadSettings().last_fuel_json
    if (!raw) return readCachedE10()
    const parsed = JSON.parse(raw) as { at?: string; nearest?: { priceE10?: number | null } }
    const price = parsed.nearest?.priceE10
    if (typeof price === 'number' && Number.isFinite(price)) {
      const spot = { price, at: String(parsed.at || new Date().toISOString()) }
      rememberE10Spot(spot)
      return spot
    }
  } catch {
    /* ignore */
  }
  return readCachedE10()
}

export function rememberE10Spot(spot: E10Spot): void {
  const s = loadSettings()
  let hist: E10Spot[] = []
  try {
    const snap = s.last_outlook_json ? (JSON.parse(s.last_outlook_json) as { e10_history?: E10Spot[] }) : {}
    hist = Array.isArray(snap.e10_history) ? snap.e10_history : []
  } catch {
    hist = []
  }
  const last = hist[hist.length - 1]
  if (!last || last.at !== spot.at || last.price !== spot.price) {
    hist = [...hist, spot].slice(-30)
  }
  let base: Record<string, unknown> = {}
  try {
    base = s.last_outlook_json ? (JSON.parse(s.last_outlook_json) as Record<string, unknown>) : {}
  } catch {
    base = {}
  }
  saveSettings({ last_outlook_json: JSON.stringify({ ...base, e10_history: hist }) })
}

function readCachedE10(): E10Spot | null {
  try {
    const snap = loadSettings().last_outlook_json
      ? (JSON.parse(loadSettings().last_outlook_json) as { e10?: E10Spot; e10_history?: E10Spot[] })
      : {}
    if (snap.e10 && Number.isFinite(snap.e10.price)) return snap.e10
    const hist = snap.e10_history || []
    return hist.length ? hist[hist.length - 1] : null
  } catch {
    return null
  }
}
