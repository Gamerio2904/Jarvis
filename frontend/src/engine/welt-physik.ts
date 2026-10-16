/** Gewicht, Boden, Stoß. Ruhende Würfel schlafen, bis sie etwas trifft. */

import {
  CUBE_EDGE,
  CUBE_HALF,
  CUBE_MASS,
  type V3,
  type WeltCube,
  type WeltPlane,
  type WeltSession,
  len,
  sub,
} from './welt.ts'

const G = 9.81
const STEP = 1 / 120

function cloneCube(c: WeltCube): WeltCube {
  return {
    ...c,
    position: { ...c.position },
    rotation: { ...c.rotation },
    velocity: { ...c.velocity },
  }
}

function floorY(cube: WeltCube, planes: WeltPlane[]): number | null {
  let best: number | null = null
  for (const plane of planes) {
    if (plane.normal.y < 0.5) continue
    if (Math.abs(cube.position.x - plane.point.x) > plane.halfX + CUBE_HALF) continue
    if (Math.abs(cube.position.z - plane.point.z) > plane.halfZ + CUBE_HALF) continue
    const y = plane.point.y
    if (cube.position.y + CUBE_EDGE < y) continue
    if (best === null || y > best) best = y
  }
  return best
}

function separate(a: WeltCube, b: WeltCube): boolean {
  const dx = b.position.x - a.position.x
  const dy = b.position.y - a.position.y
  const dz = b.position.z - a.position.z
  const ox = CUBE_EDGE - Math.abs(dx)
  const oy = CUBE_EDGE - Math.abs(dy)
  const oz = CUBE_EDGE - Math.abs(dz)
  if (ox <= 1e-8 || oy <= 1e-8 || oz <= 1e-8) return false
  const push = (axis: 'x' | 'y' | 'z', overlap: number, delta: number) => {
    const sign = delta === 0 ? 1 : Math.sign(delta)
    const half = overlap / 2
    a.position[axis] -= sign * half
    b.position[axis] += sign * half
    const rel = b.velocity[axis] - a.velocity[axis]
    if (rel * sign < 0) {
      const share = rel * 0.5
      a.velocity[axis] += share
      b.velocity[axis] -= share
    }
  }
  if (oy <= ox && oy <= oz) push('y', oy, dy)
  else if (ox <= oz) push('x', ox, dx)
  else push('z', oz, dz)
  if (a.state === 'liegt') a.state = 'fällt'
  if (b.state === 'liegt') b.state = 'fällt'
  return true
}

function land(cube: WeltCube, planes: WeltPlane[], held: boolean): void {
  const y = floorY(cube, planes)
  if (y === null) return
  if (cube.position.y - CUBE_HALF > y) return
  cube.position.y = y + CUBE_HALF
  if (cube.velocity.y < 0) cube.velocity.y = 0
  if (held) return
  const horizontal = Math.hypot(cube.velocity.x, cube.velocity.z)
  if (horizontal < 0.08) {
    cube.velocity.x = 0
    cube.velocity.y = 0
    cube.velocity.z = 0
    cube.state = 'liegt'
  }
}

function spring(cube: WeltCube, hand: V3, h: number): void {
  const to = sub(hand, cube.position)
  const ax = (to.x * 48 - cube.velocity.x * 10) / CUBE_MASS
  const ay = (to.y * 48 - cube.velocity.y * 10) / CUBE_MASS
  const az = (to.z * 48 - cube.velocity.z * 10) / CUBE_MASS
  cube.velocity.x += ax * h
  cube.velocity.y += ay * h
  cube.velocity.z += az * h
  const speed = len(cube.velocity)
  if (speed > 2.5) {
    const k = 2.5 / speed
    cube.velocity.x *= k
    cube.velocity.y *= k
    cube.velocity.z *= k
  }
  cube.position.x += cube.velocity.x * h
  cube.position.y += cube.velocity.y * h
  cube.position.z += cube.velocity.z * h
  cube.state = 'gehalten'
}

function fall(cube: WeltCube, h: number): void {
  cube.velocity.y -= G * h
  cube.position.x += cube.velocity.x * h
  cube.position.y += cube.velocity.y * h
  cube.position.z += cube.velocity.z * h
  if (cube.state !== 'gehalten') cube.state = 'fällt'
}

export function schritt(s: WeltSession, dt: number): WeltSession {
  if (s.tracking === 'weg' || !s.objects.length) return s
  const objects = s.objects.map(cloneCube)
  let left = Math.max(0, Math.min(dt, 0.25))
  while (left > 1e-6) {
    const h = Math.min(STEP, left)
    left -= h
    for (const cube of objects) {
      const held = cube.id === s.heldId
      if (held && s.hand) spring(cube, s.hand, h)
      else if (cube.state !== 'liegt') fall(cube, h)
    }
    for (const cube of objects) land(cube, s.planes, cube.id === s.heldId)
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) separate(objects[i], objects[j])
    }
    for (const cube of objects) land(cube, s.planes, cube.id === s.heldId)
  }
  return { ...s, objects }
}
