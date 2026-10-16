/** Flächen, Anker, Kameralage. Tests füttern denselben Schnitt mit einem festen Ablauf. */

import { add, dot, norm, rot, scale, sub, type V3, type WeltCamera, type WeltPlane, type WeltSession } from './welt.ts'

export type TrackerProbe = {
  available: boolean
  tracking: 'hält' | 'weg'
  camera: WeltCamera | null
  planes: WeltPlane[]
}

export function leereProbe(): TrackerProbe {
  return { available: false, tracking: 'weg', camera: null, planes: [] }
}

/** nx, ny liegen in -1..1, y nach oben. */
export function strahlTreffer(s: WeltSession, nx: number, ny: number): V3 | null {
  const cam = s.camera
  if (!cam || !s.planes.length || s.tracking === 'weg') return null
  const dirCam = norm({
    x: (nx * cam.cx) / (cam.fx || cam.fy),
    y: (ny * cam.cy) / cam.fy,
    z: -1,
  })
  const dir = rot(cam.rotation, dirCam)
  const origin = cam.position
  let bestT = Infinity
  let best: V3 | null = null
  for (const plane of s.planes) {
    const denom = dot(plane.normal, dir)
    if (Math.abs(denom) < 1e-5) continue
    const t = dot(plane.normal, sub(plane.point, origin)) / denom
    if (t < 0.05 || t >= bestT) continue
    const p = add(origin, scale(dir, t))
    if (Math.abs(p.x - plane.point.x) > plane.halfX) continue
    if (Math.abs(p.z - plane.point.z) > plane.halfZ) continue
    bestT = t
    best = p
  }
  return best
}

export type NachbauSchritt = {
  probe: TrackerProbe
  tap?: { nx: number; ny: number }
}

/** Fester Ablauf für den Test. Kein Kameraimport. */
export function nachbau(schritte: NachbauSchritt[]): TrackerProbe[] {
  return schritte.map((s) => s.probe)
}
