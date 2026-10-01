/** Tisch-Scan. Kamera, dann ein Tiefennetz. Kein Video im Hausstand, keine erfundenen Klassen. */

import { loadSettings, saveSettings } from './store.ts'

export type ScanPoint = { x: number; y: number; z: number }

export type ScanMesh = { positions: number[]; indices: number[] }

export type ScanObject = {
  id: string
  name: string
  cls: string
  removed: boolean
  pose: { x: number; y: number; z: number }
  positions: number[]
  indices: number[]
}

export type ScanState = {
  phase: 'off' | 'live' | 'model'
  target: 'room' | 'object'
  name: string
  depth: boolean
  note: string
  positions: number[]
  indices: number[]
  objects: ScanObject[]
}

export type ScanCommand =
  | { kind: 'scan'; op: 'start'; target: 'room' | 'object'; name: string }
  | { kind: 'scan'; op: 'end' }
  | { kind: 'scan'; op: 'clear' }
  | { kind: 'scan'; op: 'swap'; a: string; b: string }

export type ViewPose = { yaw: number; pitch: number; panX: number; panY: number; scale: number }

const END = String.raw`[.!?]?\s*$`
const ROOM = new RegExp(
  String.raw`^\s*(?:scanner|scanne|scannen|scann)\s+(?:mir\s+)?(?:bitte\s+)?(?:den\s+raum|das\s+zimmer)\s*` + END,
  'i',
)
const START = new RegExp(
  String.raw`^\s*(?:scanner|scanne|scannen|scann)\s+(?:mir\s+)?(?:bitte\s+)?(?:das\s+|den\s+|die\s+)?(\p{L}[\p{L}\s-]{0,40}?)\s*` +
    END,
  'iu',
)
const STOP = new RegExp(String.raw`^\s*beende(?:\s+den)?\s+scan\s*` + END, 'i')
const CLEAR = new RegExp(String.raw`^\s*entfern(?:e)?\s+alles\s+aus\s+dem\s+raum\s*` + END, 'i')
const SWAP = new RegExp(String.raw`^\s*tausch(?:e)?\s+(.{1,32}?)\s+mit\s+(.{1,32}?)\s*` + END, 'i')
const BLOCKED = /\b(?:qr|qe|code|kontakte|telefonbuch|adressbuch|hausstand|pc|rechner)\b/i

let livePoints: ScanPoint[] = []

export function emptyScan(): ScanState {
  return {
    phase: 'off',
    target: 'room',
    name: '',
    depth: false,
    note: '',
    positions: [],
    indices: [],
    objects: [],
  }
}

export function emptyPose(): ViewPose {
  return { yaw: 0.5, pitch: 0.35, panX: 0, panY: 0, scale: 1 }
}

function nums(v: unknown, cap: number): number[] {
  if (!Array.isArray(v)) return []
  const out: number[] = []
  for (const n of v) {
    if (out.length >= cap) break
    if (typeof n === 'number' && Number.isFinite(n)) out.push(n)
  }
  return out
}

function readObject(v: unknown): ScanObject | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const name = typeof o.name === 'string' ? o.name.trim().slice(0, 40) : ''
  const cls = typeof o.cls === 'string' ? o.cls.trim().slice(0, 40) : ''
  if (!name || !cls) return null
  const pose = o.pose && typeof o.pose === 'object' ? (o.pose as Record<string, unknown>) : {}
  const x = typeof pose.x === 'number' && Number.isFinite(pose.x) ? pose.x : 0
  const y = typeof pose.y === 'number' && Number.isFinite(pose.y) ? pose.y : 0
  const z = typeof pose.z === 'number' && Number.isFinite(pose.z) ? pose.z : 0
  return {
    id: typeof o.id === 'string' && o.id ? o.id.slice(0, 40) : cls,
    name,
    cls,
    removed: o.removed === true,
    pose: { x, y, z },
    positions: nums(o.positions, 12000),
    indices: nums(o.indices, 24000),
  }
}

export function readScan(raw: string): ScanState {
  if (!raw.trim()) return emptyScan()
  try {
    const v = JSON.parse(raw) as Record<string, unknown>
    const phase = v.phase === 'live' || v.phase === 'model' ? v.phase : 'off'
    const target = v.target === 'object' ? 'object' : 'room'
    const objects = Array.isArray(v.objects)
      ? v.objects.map(readObject).filter((o): o is ScanObject => Boolean(o)).slice(0, 24)
      : []
    return {
      phase,
      target,
      name: typeof v.name === 'string' ? v.name.trim().slice(0, 40) : '',
      depth: v.depth === true,
      note: typeof v.note === 'string' ? v.note.slice(0, 180) : '',
      positions: nums(v.positions, 20000),
      indices: nums(v.indices, 40000),
      objects,
    }
  } catch {
    return emptyScan()
  }
}

export function loadScan(): ScanState {
  return readScan(loadSettings().scan_json || '')
}

function writeScan(state: ScanState): void {
  saveSettings({ scan_json: JSON.stringify(state), tischplatte_on: true })
}

export function noteDepth(points: ScanPoint[]): void {
  if (!points.length) return
  livePoints = points.slice(0, 8000)
}

export function takeDepth(): ScanPoint[] {
  const pts = livePoints
  livePoints = []
  return pts
}

function titleName(raw: string): string {
  const s = raw.trim().replace(/\s+/g, ' ')
  if (!s) return 'Objekt'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function parseScanCommand(text: string): ScanCommand | null {
  const t = text.trim()
  if (!t || t.length > 80) return null
  if (BLOCKED.test(t)) return null
  if (STOP.test(t)) return { kind: 'scan', op: 'end' }
  if (CLEAR.test(t)) return { kind: 'scan', op: 'clear' }
  const swap = SWAP.exec(t)
  if (swap) return { kind: 'scan', op: 'swap', a: titleName(swap[1] || ''), b: titleName(swap[2] || '') }
  if (ROOM.test(t)) return { kind: 'scan', op: 'start', target: 'room', name: 'Raum' }
  const start = START.exec(t)
  if (!start) return null
  const name = (start[1] || '').trim()
  if (/^(?:raum|zimmer)$/i.test(name)) return { kind: 'scan', op: 'start', target: 'room', name: 'Raum' }
  if (name.length < 2) return null
  return { kind: 'scan', op: 'start', target: 'object', name: titleName(name) }
}

/** Häufigste Höhe. Das ist die tragende Fläche, neu gerechnet, nicht aus einem Codelab kopiert. */
export function dominantY(points: ScanPoint[]): number {
  if (!points.length) return 0
  const bin = 0.04
  const counts = new Map<number, number>()
  for (const p of points) {
    const k = Math.round(p.y / bin)
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  let best = 0
  let n = -1
  for (const [k, c] of counts) {
    if (c > n) {
      n = c
      best = k
    }
  }
  return best * bin
}

function dist(p: ScanPoint, x: number, y: number, z: number): number {
  const dx = p.x - x
  const dy = p.y - y
  const dz = p.z - z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/** Punkte auf der Fläche weg. Übrig bleibt der Klumpen, der der Kamera am nächsten ist. */
export function keepForeground(points: ScanPoint[]): ScanPoint[] {
  const plane = dominantY(points)
  const off = points.filter((p) => Math.abs(p.y - plane) > 0.035)
  if (off.length < 12) return []
  const seed = [...off].sort((a, b) => Math.abs(a.z) - Math.abs(b.z)).slice(0, 8)
  const cx = seed.reduce((s, p) => s + p.x, 0) / seed.length
  const cy = seed.reduce((s, p) => s + p.y, 0) / seed.length
  const cz = seed.reduce((s, p) => s + p.z, 0) / seed.length
  let cluster = off.filter((p) => dist(p, cx, cy, cz) < 0.45)
  if (cluster.length < 12) cluster = off.filter((p) => dist(p, cx, cy, cz) < 0.9)
  return cluster.length >= 12 ? cluster : []
}

export function pointsFromDepthMap(
  depth: ArrayLike<number>,
  width: number,
  height: number,
  step: number,
): ScanPoint[] {
  const out: ScanPoint[] = []
  const jump = Math.max(1, step)
  for (let y = 0; y < height; y += jump) {
    for (let x = 0; x < width; x += jump) {
      const d = depth[y * width + x]
      if (!Number.isFinite(d) || d <= 0.05 || d > 8) continue
      const u = x / Math.max(1, width - 1)
      const v = y / Math.max(1, height - 1)
      out.push({ x: (u * 2 - 1) * d * 0.7, y: (1 - v * 2) * d * 0.7, z: -d })
      if (out.length >= 8000) return out
    }
  }
  return out
}

export function meshFromPoints(points: ScanPoint[]): ScanMesh | null {
  if (points.length < 16) return null
  const n = Math.max(4, Math.min(24, Math.round(Math.sqrt(points.length))))
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }
  const sx = maxX - minX || 1
  const sy = maxY - minY || 1
  const z = new Array<number>(n * n).fill(0)
  const count = new Array<number>(n * n).fill(0)
  for (const p of points) {
    const ix = Math.max(0, Math.min(n - 1, Math.floor(((p.x - minX) / sx) * (n - 1))))
    const iy = Math.max(0, Math.min(n - 1, Math.floor(((p.y - minY) / sy) * (n - 1))))
    const k = iy * n + ix
    z[k] = count[k] ? (z[k] * count[k] + p.z) / (count[k] + 1) : p.z
    count[k] += 1
  }
  const positions: number[] = []
  const indexOf = new Array<number>(n * n).fill(-1)
  for (let i = 0; i < n * n; i++) {
    if (!count[i]) continue
    const ix = i % n
    const iy = Math.floor(i / n)
    indexOf[i] = positions.length / 3
    positions.push(minX + (ix / (n - 1)) * sx, minY + (iy / (n - 1)) * sy, z[i])
  }
  const indices: number[] = []
  for (let iy = 0; iy < n - 1; iy++) {
    for (let ix = 0; ix < n - 1; ix++) {
      const a = indexOf[iy * n + ix]
      const b = indexOf[iy * n + ix + 1]
      const c = indexOf[(iy + 1) * n + ix]
      const d = indexOf[(iy + 1) * n + ix + 1]
      if (a < 0 || b < 0 || c < 0 || d < 0) continue
      indices.push(a, c, b, b, c, d)
    }
  }
  if (indices.length < 6) return null
  return { positions, indices }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function orbit(pose: ViewPose, dx: number, dy: number): ViewPose {
  return { ...pose, yaw: pose.yaw + dx * 0.01, pitch: clamp(pose.pitch + dy * 0.01, -1.2, 1.2) }
}

export function panPose(pose: ViewPose, dx: number, dy: number): ViewPose {
  return { ...pose, panX: pose.panX + dx, panY: pose.panY + dy }
}

export function zoomPose(pose: ViewPose, factor: number): ViewPose {
  const f = Number.isFinite(factor) && factor > 0 ? factor : 1
  return { ...pose, scale: clamp(pose.scale * f, 0.3, 6) }
}

export function projectPoint(
  x: number,
  y: number,
  z: number,
  pose: ViewPose,
  w: number,
  h: number,
): { x: number; y: number } | null {
  const cy = Math.cos(pose.yaw)
  const sy = Math.sin(pose.yaw)
  const cp = Math.cos(pose.pitch)
  const sp = Math.sin(pose.pitch)
  const x1 = x * cy - z * sy
  const z1 = x * sy + z * cy
  const y2 = y * cp - z1 * sp
  const z2 = y * sp + z1 * cp
  const depth = z2 + 2.4
  if (depth < 0.15) return null
  const f = 420 * pose.scale
  return { x: w / 2 + (x1 * f) / depth + pose.panX, y: h / 2 - (y2 * f) / depth + pose.panY }
}

function gripLine(name: string): string {
  return `${name} liegt auf dem Tisch. Ein Finger dreht, zwei schieben, Ziehen zoomt.`
}

export function applyScan(cmd: ScanCommand): string {
  if (cmd.op === 'start') {
    livePoints = []
    writeScan({
      ...emptyScan(),
      phase: 'live',
      target: cmd.target,
      name: cmd.name,
    })
    return cmd.target === 'room'
      ? 'Scan läuft. Der Tisch ist die Kamera. Sag Beende den Scan.'
      : `Scan läuft, ${cmd.name}. Der Tisch ist die Kamera. Sag Beende den Scan.`
  }
  const cur = loadScan()
  if (cmd.op === 'end') {
    if (cur.phase !== 'live') return 'Kein Scan läuft.'
    const raw = takeDepth()
    const pts = cur.target === 'object' ? keepForeground(raw) : raw
    if (raw.length < 30) {
      writeScan({ ...emptyScan(), phase: 'model', target: cur.target, name: cur.name, note: 'Keine Tiefenwerte.' })
      return 'Keine Tiefenwerte auf diesem Gerät. Kein Modell.'
    }
    if (pts.length < 16) {
      writeScan({
        ...emptyScan(),
        phase: 'model',
        target: cur.target,
        name: cur.name,
        depth: true,
        note: 'Liegt auf der Fläche.',
      })
      return `${cur.name} löst sich nicht von der Fläche. Kein Modell.`
    }
    const mesh = meshFromPoints(pts)
    if (!mesh) {
      writeScan({ ...emptyScan(), phase: 'model', target: cur.target, name: cur.name, depth: true, note: 'Zu wenig Tiefe.' })
      return 'Zu wenig Tiefe für ein Netz. Kein Modell.'
    }
    writeScan({
      ...emptyScan(),
      phase: 'model',
      target: cur.target,
      name: cur.name,
      depth: true,
      note: '',
      positions: mesh.positions,
      indices: mesh.indices,
    })
    return gripLine(cur.name)
  }
  if (cmd.op === 'clear') {
    if (cur.phase !== 'model') return 'Kein Raum auf dem Tisch.'
    const labeled = cur.objects.filter((o) => o.cls && o.cls !== 'wall' && o.cls !== 'floor')
    if (!labeled.length) return 'Keine Klassen. Nichts entfernt.'
    const objects = cur.objects.map((o) =>
      o.cls === 'wall' || o.cls === 'floor' ? o : { ...o, removed: true },
    )
    writeScan({ ...cur, objects })
    const names = labeled.map((o) => o.name).join(', ')
    return `Entfernt: ${names}.`
  }
  if (cur.phase !== 'model') return 'Kein Raum auf dem Tisch.'
  const a = cur.objects.find((o) => o.name.toLowerCase() === cmd.a.toLowerCase() || o.cls.toLowerCase() === cmd.a.toLowerCase())
  const b = cur.objects.find((o) => o.name.toLowerCase() === cmd.b.toLowerCase() || o.cls.toLowerCase() === cmd.b.toLowerCase())
  if (!a || !b || a.id === b.id) {
    const missing = !a ? cmd.a : cmd.b
    return `${missing} fehlt. Nichts getauscht.`
  }
  const objects = cur.objects.map((o) => {
    if (o.id === a.id) return { ...o, pose: b.pose }
    if (o.id === b.id) return { ...o, pose: a.pose }
    return o
  })
  writeScan({ ...cur, objects })
  return `${a.name} und ${b.name} getauscht.`
}
