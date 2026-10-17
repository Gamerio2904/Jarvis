/** Zweite Welt. Die Kamera schreibt keine Würfellage. */

export const CUBE_EDGE = 0.08
export const CUBE_HALF = CUBE_EDGE / 2
export const CUBE_MASS = 0.2
export const GRAB_REACH = 0.12
export const MAX_CUBES = 8

export type V3 = { x: number; y: number; z: number }
export type Q = { x: number; y: number; z: number; w: number }

export type WeltPlane = {
  id: string
  point: V3
  normal: V3
  halfX: number
  halfZ: number
  /** Drehung der Fläche. Ohne sie liegt das Rechteck in der Welt-XZ. */
  rotation?: Q
}

/** Tisch vor der Kamera, nicht der Boden unter dem Bild. */
export const TISCH_UNTER = 0.52
export const BODEN_GRENZE = 1.05

export type WeltCube = {
  id: string
  anchorId: string
  position: V3
  rotation: Q
  velocity: V3
  state: 'liegt' | 'fällt' | 'gehalten'
}

export type WeltCamera = {
  position: V3
  rotation: Q
  fx: number
  fy: number
  cx: number
  cy: number
}

export type WeltNote = '' | 'fehlgeschlagen' | 'gegriffen' | 'abgesetzt' | 'erkannt'

export type WeltSession = {
  origin: V3 | null
  planes: WeltPlane[]
  objects: WeltCube[]
  hand: V3 | null
  handRotation: Q | null
  tracking: 'hält' | 'weg'
  tracker: boolean
  probed: boolean
  camera: WeltCamera | null
  note: WeltNote
  heldId: string | null
  dragId: string | null
}

export const IDENT: Q = { x: 0, y: 0, z: 0, w: 1 }

export function v3(x = 0, y = 0, z = 0): V3 {
  return { x, y, z }
}

export function add(a: V3, b: V3): V3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function sub(a: V3, b: V3): V3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

export function scale(a: V3, k: number): V3 {
  return { x: a.x * k, y: a.y * k, z: a.z * k }
}

export function dot(a: V3, b: V3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

export function len(a: V3): number {
  return Math.hypot(a.x, a.y, a.z)
}

export function norm(a: V3): V3 {
  const l = len(a)
  if (l < 1e-8) return v3()
  return scale(a, 1 / l)
}

/** Liegt der Punkt im Rechteck der Fläche, mit Rand in Metern. */
export function aufRechteck(plane: WeltPlane, x: number, z: number, pad: number): boolean {
  const dx = x - plane.point.x
  const dz = z - plane.point.z
  let lx = dx
  let lz = dz
  const q = plane.rotation
  if (q && (Math.abs(q.x) > 1e-8 || Math.abs(q.y) > 1e-8 || Math.abs(q.z) > 1e-8)) {
    const local = rot({ x: -q.x, y: -q.y, z: -q.z, w: q.w }, { x: dx, y: 0, z: dz })
    lx = local.x
    lz = local.z
  }
  return Math.abs(lx) <= plane.halfX + pad && Math.abs(lz) <= plane.halfZ + pad
}

/** Drehung um die Hochachse. Positiv dreht die Kamera nach links. */
export function gier(rad: number): Q {
  const h = rad / 2
  return { x: 0, y: Math.sin(h), z: 0, w: Math.cos(h) }
}

export function rot(q: Q, v: V3): V3 {
  const qx = q.x
  const qy = q.y
  const qz = q.z
  const qw = q.w
  const tx = 2 * (qy * v.z - qz * v.y)
  const ty = 2 * (qz * v.x - qx * v.z)
  const tz = 2 * (qx * v.y - qy * v.x)
  return {
    x: v.x + qw * tx + (qy * tz - qz * ty),
    y: v.y + qw * ty + (qz * tx - qx * tz),
    z: v.z + qw * tz + (qx * ty - qy * tx),
  }
}

export function leereWelt(): WeltSession {
  return {
    origin: null,
    planes: [],
    objects: [],
    hand: null,
    handRotation: null,
    tracking: 'hält',
    tracker: false,
    probed: false,
    camera: null,
    note: '',
    heldId: null,
    dragId: null,
  }
}

export function schliessen(): WeltSession {
  return leereWelt()
}

export function gegenstaende(s: WeltSession): number {
  return s.objects.length
}

export function weltZeile(s: WeltSession): string {
  if (s.tracking === 'weg' && s.origin) return 'Orientierung weg'
  if (s.note === 'fehlgeschlagen' || s.note === 'gegriffen' || s.note === 'abgesetzt' || s.note === 'erkannt') {
    return s.note
  }
  if (s.probed && !s.tracker) return 'ARCore fehlt'
  if (s.origin && s.objects.length === 0) return 'Fläche'
  return `${s.objects.length} Gegenstände`
}

export function ohneTracker(s: WeltSession): WeltSession {
  return { ...s, probed: true, tracker: false, origin: null, planes: [] }
}

export function setzeUrsprung(s: WeltSession, plane: WeltPlane): WeltSession {
  if (s.origin) {
    const planes = s.planes.some((p) => p.id === plane.id)
      ? s.planes.map((p) => (p.id === plane.id ? plane : p))
      : [...s.planes, plane]
    return { ...s, planes, tracker: true, probed: true }
  }
  return {
    ...s,
    origin: { ...plane.point },
    planes: [plane],
    tracker: true,
    probed: true,
    note: '',
  }
}

export function setzeFlaechen(s: WeltSession, planes: WeltPlane[]): WeltSession {
  if (!planes.length) return s.origin ? { ...s, planes: s.planes } : s
  const blick = s.planes.find((p) => p.id === 'blick')
  let next: WeltSession = { ...s, planes: blick ? [blick] : [] }
  for (const plane of planes) {
    if (!next.origin) {
      const kept = next.planes
      next = setzeUrsprung(next, plane)
      if (kept.length && !next.planes.some((p) => p.id === 'blick')) {
        next = { ...next, planes: [...kept, ...next.planes.filter((p) => p.id !== 'blick')] }
      }
      continue
    }
    next = {
      ...next,
      planes: next.planes.some((p) => p.id === plane.id)
        ? next.planes.map((p) => (p.id === plane.id ? plane : p))
        : [...next.planes, plane],
      tracker: true,
      probed: true,
    }
  }
  return next
}

/** Kamera und Boden, wenn ARCore die Fläche nicht liefert. */
export function legeAuge(s: WeltSession, width: number, height: number): WeltSession {
  const w = Math.max(width, 1)
  const h = Math.max(height, 1)
  const floor: WeltPlane = {
    id: 'boden',
    point: v3(0, 0, -0.7),
    normal: v3(0, 1, 0),
    halfX: 3,
    halfZ: 3,
  }
  return {
    ...s,
    probed: true,
    tracker: true,
    origin: { ...floor.point },
    planes: [floor],
    tracking: 'hält',
    note: '',
    camera: {
      position: v3(0, 1.45, 0),
      rotation: { ...IDENT },
      fx: w * 0.95,
      fy: h * 0.95,
      cx: w / 2,
      cy: h / 2,
    },
  }
}

function naechsteFlaeche(cam: WeltCamera, planes: WeltPlane[]): V3 | null {
  const dir = norm(add(rot(cam.rotation, v3(0, 0, -1)), rot(cam.rotation, v3(0, -0.38, 0))))
  let bestT = Infinity
  let best: V3 | null = null
  for (const plane of planes) {
    if (plane.id === 'blick' || plane.normal.y < 0.5) continue
    if (cam.position.y - plane.point.y > BODEN_GRENZE) continue
    const denom = dot(plane.normal, dir)
    if (Math.abs(denom) < 1e-5) continue
    const t = dot(plane.normal, sub(plane.point, cam.position)) / denom
    if (t < 0.2 || t > 2.3 || t >= bestT) continue
    const p = add(cam.position, scale(dir, t))
    if (!aufRechteck(plane, p.x, p.z, 0.2)) continue
    bestT = t
    best = p
  }
  return best
}

/** Punkt auf dem Tisch vor der Kamera, im unteren Blick, nicht unter dem Bild. */
export function tischPunkt(cam: WeltCamera, planes: WeltPlane[]): V3 {
  const hit = naechsteFlaeche(cam, planes)
  if (hit) return hit
  const dir = norm(rot(cam.rotation, v3(0, -0.28, -1)))
  return add(cam.position, scale(dir, 0.78))
}

/** Hält eine Fläche im Blick, bis eine echte Tischfläche da ist. */
export function mitTisch(s: WeltSession): WeltSession {
  if (!s.camera) return s
  const cam = s.camera
  const real = s.planes.filter((p) => p.id !== 'blick')
  const hit = naechsteFlaeche(cam, real)
  if (hit) {
    if (!s.planes.some((p) => p.id === 'blick') && s.origin) return s
    return {
      ...s,
      planes: real,
      origin: s.origin ?? { ...hit },
      tracker: true,
      probed: true,
    }
  }
  const point = tischPunkt(cam, real)
  const existing = s.planes.find((p) => p.id === 'blick')
  const belegt =
    existing &&
    s.objects.some((c) => Math.hypot(c.position.x - existing.point.x, c.position.z - existing.point.z) < 1.3)
  const anchor = belegt && existing ? existing.point : point
  if (
    existing &&
    Math.abs(existing.point.x - anchor.x) < 1e-4 &&
    Math.abs(existing.point.y - anchor.y) < 1e-4 &&
    Math.abs(existing.point.z - anchor.z) < 1e-4 &&
    s.origin
  ) {
    return s
  }
  const blick: WeltPlane = {
    id: 'blick',
    point: { x: anchor.x, y: anchor.y, z: anchor.z },
    normal: v3(0, 1, 0),
    halfX: 1.15,
    halfZ: 1.15,
  }
  const planes = existing ? s.planes.map((p) => (p.id === 'blick' ? blick : p)) : [...s.planes, blick]
  return {
    ...s,
    planes,
    origin: s.origin ?? { ...anchor },
    tracker: true,
    probed: true,
  }
}

/** Tippen trifft den Tisch im Blick, nicht den Boden unter dem Bild. */
export function tischAnBlick(s: WeltSession, nx: number, ny: number): V3 | null {
  const cam = s.camera
  if (!cam || s.tracking === 'weg') return null
  const nah = s.planes.filter((p) => p.id === 'blick' || cam.position.y - p.point.y <= BODEN_GRENZE)
  const dirCam = norm({
    x: (nx * cam.cx) / (cam.fx || cam.fy),
    y: (ny * cam.cy) / cam.fy,
    z: -1,
  })
  const dir = rot(cam.rotation, dirCam)
  let bestT = Infinity
  let best: V3 | null = null
  for (const plane of nah) {
    const denom = dot(plane.normal, dir)
    if (Math.abs(denom) < 1e-5) continue
    const t = dot(plane.normal, sub(plane.point, cam.position)) / denom
    if (t < 0.12 || t >= bestT) continue
    const p = add(cam.position, scale(dir, t))
    if (!aufRechteck(plane, p.x, p.z, 0.05)) continue
    bestT = t
    best = p
  }
  if (best) return best
  if (dir.y > -0.02) return tischPunkt(cam, nah)
  const y = cam.position.y - TISCH_UNTER
  const t = (y - cam.position.y) / dir.y
  if (t < 0.15 || t > 3.2) return tischPunkt(cam, nah)
  return add(cam.position, scale(dir, t))
}

/** Würfel liegt auf dem Tisch vor der Kamera. */
export function fuegeWuerfel(s: WeltSession): WeltSession {
  const base = s.camera ? mitTisch(s) : s
  if (!base.camera || !base.origin || base.objects.length >= MAX_CUBES) return s
  const point = tischPunkt(base.camera, base.planes)
  const i = base.objects.length
  const n = i + 1
  const cube: WeltCube = {
    id: `w${n}`,
    anchorId: `a${n}`,
    position: {
      x: point.x + (i % 3) * 0.12 - 0.12,
      y: point.y + CUBE_HALF,
      z: point.z,
    },
    rotation: { ...IDENT },
    velocity: v3(),
    state: 'liegt',
  }
  return { ...base, objects: [...base.objects, cube], note: '' }
}

export function schiebe(s: WeltSession, id: string, position: V3): WeltSession {
  if (!s.objects.some((c) => c.id === id)) return s
  return {
    ...s,
    dragId: id,
    heldId: id,
    note: 'gegriffen',
    objects: s.objects.map((c) =>
      c.id === id ? { ...c, position: { ...position }, velocity: v3(), state: 'gehalten' } : c,
    ),
  }
}

export function setzen(s: WeltSession, point: V3): WeltSession {
  let next = s.camera ? mitTisch(s) : s
  if ((!next.tracker || !next.origin) && !next.camera) return s
  if (next.objects.length >= MAX_CUBES) return s
  const deckt = (p: WeltPlane) =>
    p.normal.y >= 0.5 &&
    aufRechteck(p, point.x, point.z, CUBE_HALF) &&
    (!next.camera || p.id === 'blick' || next.camera.position.y - p.point.y <= BODEN_GRENZE)
  if (!next.planes.some(deckt)) {
    const blick: WeltPlane = {
      id: 'blick',
      point: { x: point.x, y: point.y, z: point.z },
      normal: v3(0, 1, 0),
      halfX: 1.15,
      halfZ: 1.15,
    }
    next = {
      ...next,
      origin: next.origin ?? { ...point },
      tracker: true,
      probed: true,
      planes: [...next.planes.filter((p) => p.id !== 'blick'), blick],
    }
  }
  if (!next.tracker || !next.origin) return s
  let yPlane: number | null = null
  for (const p of next.planes) {
    if (!deckt(p) && !(p.id === 'blick' && aufRechteck(p, point.x, point.z, CUBE_HALF))) continue
    if (p.normal.y < 0.5) continue
    if (!aufRechteck(p, point.x, point.z, CUBE_HALF)) continue
    if (yPlane === null || p.point.y > yPlane) yPlane = p.point.y
  }
  const n = next.objects.length + 1
  const cube: WeltCube = {
    id: `w${n}`,
    anchorId: `a${n}`,
    position: { x: point.x, y: (yPlane ?? point.y) + CUBE_HALF, z: point.z },
    rotation: { ...IDENT },
    velocity: v3(),
    state: 'liegt',
  }
  return { ...next, objects: [...next.objects, cube], note: '' }
}

/** Nur die Kamera wechselt. Lagen und Drehungen bleiben. */
export function blick(s: WeltSession, camera: WeltCamera): WeltSession {
  return { ...s, camera }
}

export function orientierung(s: WeltSession, haelt: boolean): WeltSession {
  if (haelt) return s.tracking === 'hält' ? s : { ...s, tracking: 'hält' }
  return { ...s, tracking: 'weg' }
}

export function setzeHand(s: WeltSession, hand: V3 | null, rotation: Q | null): WeltSession {
  const objects = s.objects
  if (!hand) {
    return {
      ...s,
      objects,
      hand: null,
      handRotation: null,
      note: s.note === 'erkannt' ? '' : s.note,
    }
  }
  const note: WeltNote = s.heldId || s.note === 'gegriffen' || s.note === 'fehlgeschlagen' || s.note === 'abgesetzt'
    ? s.note
    : 'erkannt'
  return { ...s, objects, hand: { ...hand }, handRotation: rotation ? { ...rotation } : null, note }
}

function cubeById(s: WeltSession, id: string): WeltCube | undefined {
  return s.objects.find((c) => c.id === id)
}

export function abstandZurOberflaeche(cube: WeltCube, point: V3): number {
  return Math.max(0, len(sub(cube.position, point)) - CUBE_HALF)
}

export function versuchGriff(s: WeltSession): WeltSession {
  const before = s.objects.map((c) => ({
    id: c.id,
    anchorId: c.anchorId,
    position: { ...c.position },
    rotation: { ...c.rotation },
  }))
  const fail = (): WeltSession => ({
    ...s,
    objects: s.objects.map((c, i) => ({
      ...c,
      anchorId: before[i].anchorId,
      position: before[i].position,
      rotation: before[i].rotation,
    })),
    heldId: s.heldId,
    note: 'fehlgeschlagen',
  })
  if (!s.hand || s.tracking === 'weg') return fail()
  if (s.heldId && cubeById(s, s.heldId)) return s
  let best: WeltCube | null = null
  let bestD = GRAB_REACH
  for (const cube of s.objects) {
    const d = abstandZurOberflaeche(cube, s.hand)
    if (d <= bestD) {
      best = cube
      bestD = d
    }
  }
  if (!best) return fail()
  return {
    ...s,
    heldId: best.id,
    note: 'gegriffen',
    objects: s.objects.map((c) => (c.id === best.id ? { ...c, state: 'gehalten' } : c)),
  }
}

export function loslassen(s: WeltSession, handVelocity: V3): WeltSession {
  if (!s.heldId) return s
  const id = s.heldId
  return {
    ...s,
    heldId: null,
    dragId: null,
    note: 'abgesetzt',
    objects: s.objects.map((c) =>
      c.id === id
        ? {
            ...c,
            state: 'fällt',
            velocity: { x: handVelocity.x, y: handVelocity.y, z: handVelocity.z },
          }
        : c,
    ),
  }
}

export function parseWeltOpen(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 80) return false
  return /^\s*(?:öffne|oeffne|zeig(?:e)?)\s+(?:mir\s+)?(?:bitte\s+)?die\s+welt\s*[.!?]*\s*$/i.test(t)
}

export function poseGleich(a: WeltCube, b: WeltCube): boolean {
  const e = 1e-9
  const close = (p: number, q: number) => Math.abs(p - q) < e
  return (
    a.id === b.id &&
    a.anchorId === b.anchorId &&
    close(a.position.x, b.position.x) &&
    close(a.position.y, b.position.y) &&
    close(a.position.z, b.position.z) &&
    close(a.rotation.x, b.rotation.x) &&
    close(a.rotation.y, b.rotation.y) &&
    close(a.rotation.z, b.rotation.z) &&
    close(a.rotation.w, b.rotation.w)
  )
}
