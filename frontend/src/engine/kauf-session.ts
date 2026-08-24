export type KaufQuote = {
  merchant: string
  price?: number
  shipping?: number
  total?: number
  eta?: string
  available?: string
  rating?: string
  url: string
  source: string
  fetchedAt: string
}

export type KaufProduct = {
  title: string
  image?: string
  quotes: KaufQuote[]
  offer?: boolean
  local?: boolean
  specs?: Record<string, string>
}

export type KaufState = {
  open: boolean
  query: string
  filter: 'all' | 'offers' | 'local' | 'prospects'
  maxEuro: number | null
  sort: 'price' | 'rating'
  products: KaufProduct[]
  selected: number
  compare: number[]
  saved: Array<{ title: string; url: string }>
  honest: string
}

const KEY = 'jarvis_kauf_saved_v1'
const TTL_MS = 30 * 60 * 1000

let state: KaufState = empty()
const listeners = new Set<() => void>()

function empty(): KaufState {
  return {
    open: false,
    query: '',
    filter: 'all',
    maxEuro: null,
    sort: 'price',
    products: [],
    selected: 0,
    compare: [],
    saved: loadSaved(),
    honest: '',
  }
}

export function isKaufSessionOpen(): boolean {
  return state.open
}

export function getKaufState(): KaufState {
  return state
}

export function subscribeKauf(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emit() {
  for (const fn of listeners) fn()
}

export function openKauf(honest: string) {
  state = { ...state, open: true, honest }
  emit()
}

export function closeKauf() {
  state = { ...empty(), saved: state.saved }
  emit()
}

export function setKaufState(patch: Partial<KaufState>) {
  state = { ...state, ...patch, open: true }
  emit()
}

export function visibleProducts(): KaufProduct[] {
  const now = Date.now()
  let list = state.products.filter((p) =>
    p.quotes.some((q) => now - Date.parse(q.fetchedAt || '') < TTL_MS || !q.fetchedAt),
  )
  if (state.filter === 'offers' || state.filter === 'prospects') list = list.filter((p) => p.offer)
  if (state.filter === 'local') list = list.filter((p) => p.local)
  if (state.maxEuro != null) {
    list = list.filter((p) => {
      const t = bestTotal(p)
      return t != null && t <= state.maxEuro!
    })
  }
  const sorted = [...list].sort((a, b) => {
    if (state.sort === 'rating') return String(b.quotes[0]?.rating || '').localeCompare(String(a.quotes[0]?.rating || ''))
    const ta = bestTotal(a)
    const tb = bestTotal(b)
    if (ta == null && tb == null) return 0
    if (ta == null) return 1
    if (tb == null) return -1
    return ta - tb
  })
  return sorted
}

export function bestTotal(p: KaufProduct): number | null {
  const nums = p.quotes.map((q) => q.total ?? (q.price != null && q.shipping != null ? q.price + q.shipping : q.price)).filter(
    (n): n is number => typeof n === 'number',
  )
  return nums.length ? Math.min(...nums) : null
}

export function bestQuote(p: KaufProduct): KaufQuote | null {
  if (!p.quotes.length) return null
  const scored = [...p.quotes].sort((a, b) => {
    const ta = a.total ?? a.price ?? 9e9
    const tb = b.total ?? b.price ?? 9e9
    return ta - tb
  })
  return scored[0] || null
}

function loadSaved(): Array<{ title: string; url: string }> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Array<{ title: string; url: string }>) : []
  } catch {
    return []
  }
}

export function persistSaved(saved: Array<{ title: string; url: string }>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {
    /* ignore */
  }
}
