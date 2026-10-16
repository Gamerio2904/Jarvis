/** Zweite Welt. Die Kamera schreibt keine Würfellage. */

export const CUBE_EDGE = 0.08
export const CUBE_HALF = CUBE_EDGE / 2
export const CUBE_MASS = 0.2
export const GRAB_REACH = 0.04
export const MAX_CUBES = 8

export type V3 = { x: number; y: number; z: number }
export type Q = { x: number; y: number; z: number; w: number }

export type WeltPlane = {
  id: string
  point: V3
  normal: V3
  halfX: number
  halfZ: number
}

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
  let next = s
  for (const plane of planes) next = setzeUrsprung(next, plane)
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

/** Würfel vor die Kamera. Die Lage bleibt, bis Griff oder Schieben sie ändert. */
export function fuegeWuerfel(s: WeltSession): WeltSession {
  if (!s.camera || !s.origin || s.objects.length >= MAX_CUBES) return s
  const i = s.objects.length
  const ahead = add(s.camera.position, rot(s.camera.rotation, v3((i % 3) * 0.14 - 0.14, -0.2, -0.7)))
  const n = i + 1
  const cube: WeltCube = {
    id: `w${n}`,
    anchorId: `a${n}`,
    position: ahead,
    rotation: { ...IDENT },
    velocity: v3(),
    state: 'liegt',
  }
  return { ...s, objects: [...s.objects, cube], note: '' }
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
  if (!s.tracker || !s.origin) return s
  if (s.objects.length >= MAX_CUBES) return s
  const n = s.objects.length + 1
  const cube: WeltCube = {
    id: `w${n}`,
    anchorId: `a${n}`,
    position: { x: point.x, y: point.y + 0.22, z: point.z },
    rotation: { ...IDENT },
    velocity: v3(),
    state: 'fällt',
  }
  return { ...s, objects: [...s.objects, cube], note: '' }
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
