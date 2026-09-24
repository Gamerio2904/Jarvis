import { rmAvatar } from './rm-graph.ts'

const ready = new Map<number, HTMLImageElement>()
const failed = new Set<number>()
const waiting = new Set<number>()
const queued = new Set<number>()
const tries = new Map<number, number>()
const high: number[] = []
const low: number[] = []
const MAX_INFLIGHT = 8
const BUDGET = 400
const MAX_TRIES = 3
const listeners = new Set<() => void>()

export function onAvatarReady(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function avatarImage(id: number): HTMLImageElement | null {
  return ready.get(id) ?? null
}

export function avatarStats(): { ready: number; waiting: number; queued: number; failed: number } {
  return { ready: ready.size, waiting: waiting.size, queued: queued.size, failed: failed.size }
}

export function requestAvatar(id: number, urgent = false): void {
  if (!Number.isFinite(id) || id <= 0) return
  if (ready.has(id) || failed.has(id) || waiting.has(id)) return
  if (queued.has(id)) {
    if (urgent && low.includes(id)) {
      low.splice(low.indexOf(id), 1)
      high.push(id)
      pump()
    }
    return
  }
  if (!urgent && ready.size + waiting.size + queued.size >= BUDGET) return
  queued.add(id)
  if (urgent) high.push(id)
  else low.push(id)
  pump()
}

function nextId(): number | undefined {
  return high.shift() ?? low.shift()
}

function pump(): void {
  if (typeof Image === 'undefined') return
  while (waiting.size < MAX_INFLIGHT) {
    const id = nextId()
    if (!id) return
    queued.delete(id)
    waiting.add(id)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    const finish = (ok: boolean) => {
      waiting.delete(id)
      if (ok) {
        ready.set(id, img)
        for (const fn of listeners) fn()
        pump()
        return
      }
      const n = (tries.get(id) || 0) + 1
      tries.set(id, n)
      if (n >= MAX_TRIES) {
        failed.add(id)
        pump()
        return
      }
      window.setTimeout(() => {
        requestAvatar(id, true)
      }, 280 * n)
      pump()
    }
    img.onload = () => finish(true)
    img.onerror = () => finish(false)
    img.src = rmAvatar(id)
  }
}
