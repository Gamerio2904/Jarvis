import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = (rel) => readFileSync(join(here, '..', rel), 'utf8')

const {
  CUBE_EDGE,
  CUBE_HALF,
  GRAB_REACH,
  IDENT,
  blick,
  gegenstaende,
  fuegeWuerfel,
  legeAuge,
  leereWelt,
  loslassen,
  ohneTracker,
  orientierung,
  parseWeltOpen,
  poseGleich,
  schiebe,
  schliessen,
  setzeHand,
  setzeUrsprung,
  setzen,
  versuchGriff,
  v3,
  weltZeile,
} = await import('../src/engine/welt.ts')
const { schritt } = await import('../src/engine/welt-physik.ts')
const { handInWelt, zangeZu, zangenpunkt } = await import('../src/engine/welt-hand.ts')
const { strahlTreffer } = await import('../src/engine/welt-tracker.ts')
const { parseBoardIntent } = await import('../src/engine/board-parse.ts')
const { parseScanCommand } = await import('../src/engine/room-scan.ts')
const { parseAppIntent } = await import('../src/engine/app-parse.ts')
const { handleApp } = await import('../src/engine/app.ts')

const boden = {
  id: 'tisch',
  point: v3(0, 0, -1),
  normal: v3(0, 1, 0),
  halfX: 2,
  halfZ: 2,
}
const auge = {
  position: v3(0, 1.4, 0),
  rotation: { ...IDENT },
  fx: 600,
  fy: 600,
  cx: 400,
  cy: 300,
}

assert.equal(gegenstaende(leereWelt()), 0)
assert.equal(weltZeile(leereWelt()), '0 Gegenstände')
assert.equal(weltZeile(ohneTracker(leereWelt())), 'ARCore fehlt')
const augeLokal = legeAuge(ohneTracker(leereWelt()), 1280, 720)
assert.equal(weltZeile(augeLokal), 'Fläche')
assert.equal(augeLokal.objects.length, 0)
const mitWuerfel = fuegeWuerfel(augeLokal)
assert.equal(mitWuerfel.objects.length, 1)
assert.equal(mitWuerfel.objects[0].id, 'w1')
const geschoben = schiebe(mitWuerfel, 'w1', v3(0.2, 1, -0.7))
const nachHalt = schritt(geschoben, 0.5)
assert.ok(Math.abs(nachHalt.objects[0].position.x - 0.2) < 1e-6)
assert.ok(Math.abs(nachHalt.objects[0].position.y - 1) < 1e-6)
assert.equal(setzen(leereWelt(), v3()).objects.length, 0)

let welt = setzeUrsprung(leereWelt(), boden)
assert.equal(weltZeile(welt), 'Fläche')
assert.ok(welt.origin)
const ohne = ohneTracker(leereWelt())
assert.equal(setzen(ohne, boden.point).objects.length, 0)

welt = setzen(welt, boden.point)
welt = setzen(welt, v3(0.4, 0, -1))
assert.equal(welt.objects.length, 2)
assert.equal(welt.objects[0].id, 'w1')
assert.equal(welt.objects[1].id, 'w2')
assert.equal(weltZeile(blick(welt, auge)), '2 Gegenstände')
const vorBlick = welt.objects.map((c) => ({ ...c, position: { ...c.position }, rotation: { ...c.rotation } }))
const nachBlick = blick(welt, { ...auge, position: v3(2, 1.4, 1), rotation: { x: 0, y: 0.4, z: 0, w: 0.9 } })
assert.ok(poseGleich(vorBlick[0], nachBlick.objects[0]))
assert.ok(poseGleich(vorBlick[1], nachBlick.objects[1]))

let voll = welt
for (let i = 0; i < 8; i++) voll = setzen(voll, v3(i * 0.2, 0, -1))
assert.equal(voll.objects.length, 8)

let fall = setzeUrsprung(leereWelt(), { ...boden, point: v3(0, 0, 0), halfX: 3, halfZ: 3 })
fall = setzen(fall, v3(0, 0, 0))
fall = schritt(fall, 2.5)
assert.equal(fall.objects[0].state, 'liegt')
assert.ok(Math.abs(fall.objects[0].position.y - CUBE_HALF) < 0.02)

let stoss = setzeUrsprung(leereWelt(), { ...boden, point: v3(0, 0, 0), halfX: 3, halfZ: 3 })
stoss = setzen(stoss, v3(0, 0, 0))
stoss = setzen(stoss, v3(0.03, 0, 0))
stoss = schritt(stoss, 2.5)
const a = stoss.objects[0]
const b = stoss.objects[1]
const dx = Math.abs(a.position.x - b.position.x)
const dy = Math.abs(a.position.y - b.position.y)
const dz = Math.abs(a.position.z - b.position.z)
assert.ok(dx >= CUBE_EDGE - 0.01 || dy >= CUBE_EDGE - 0.01 || dz >= CUBE_EDGE - 0.01)
const still = blick(stoss, auge)
assert.ok(poseGleich(a, still.objects[0]))
assert.ok(poseGleich(b, still.objects[1]))

const eingefroren = orientierung(fall, false)
const danach = schritt(eingefroren, 1)
assert.ok(poseGleich(eingefroren.objects[0], danach.objects[0]))
assert.equal(weltZeile(eingefroren), 'Orientierung weg')

const handWeg = setzeHand(stoss, v3(3, 1, 0), IDENT)
assert.equal(weltZeile(handWeg), 'erkannt')
assert.ok(poseGleich(stoss.objects[0], handWeg.objects[0]))
assert.ok(poseGleich(stoss.objects[1], handWeg.objects[1]))
const daneben = versuchGriff(handWeg)
assert.equal(daneben.note, 'fehlgeschlagen')
assert.ok(poseGleich(stoss.objects[0], daneben.objects[0]))
assert.ok(poseGleich(stoss.objects[1], daneben.objects[1]))
assert.ok(lenAbstand(daneben.hand, daneben.objects[0].position) > GRAB_REACH)

const treffer = setzeHand(stoss, { ...stoss.objects[0].position }, IDENT)
const gegriffen = versuchGriff(treffer)
assert.equal(gegriffen.note, 'gegriffen')
assert.equal(gegriffen.heldId, stoss.objects[0].id)
assert.ok(poseGleich(stoss.objects[1], gegriffen.objects[1]))

const los = loslassen(gegriffen, v3(0, 0.2, 0))
assert.equal(los.note, 'abgesetzt')
assert.equal(los.heldId, null)
assert.equal(los.objects[0].state, 'fällt')
assert.ok(Math.abs(los.objects[0].velocity.y - 0.2) < 1e-9)
assert.ok(poseGleich(stoss.objects[1], los.objects[1]))

const leer = schliessen()
assert.equal(gegenstaende(leer), 0)
assert.equal(leer.tracker, false)

const kamera = blick(setzeUrsprung(leereWelt(), { ...boden, point: v3(0, 0, 0), halfX: 20, halfZ: 20 }), {
  position: v3(0, 1.5, 0),
  rotation: { ...IDENT },
  fx: 500,
  fy: 500,
  cx: 320,
  cy: 240,
})
const hit = strahlTreffer(kamera, 0, -0.35)
assert.ok(hit)
assert.ok(Math.abs(hit.y) < 0.05)

const geschlossen = zangeZu([
  v3(0, 0, 0), v3(), v3(), v3(), v3(0.01, 0.02, 0),
  v3(), v3(), v3(), v3(0.02, 0.02, 0), v3(0, 0.1, 0),
])
assert.equal(geschlossen, true)
assert.ok(Math.abs(zangenpunkt(v3(0, 0, 0), v3(0.02, 0, 0)).x - 0.01) < 1e-9)

const pose = handInWelt({
  bild: [
    { x: 0.5, y: 0.5, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0.52, y: 0.48, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0.53, y: 0.48, z: 0 },
    { x: 0.5, y: 0.42, z: 0 },
  ],
  welt: [
    v3(0, 0, 0), v3(), v3(), v3(), v3(0.01, 0.01, 0),
    v3(), v3(), v3(), v3(0.012, 0.01, 0), v3(0, 0.08, 0),
  ],
  width: 640,
  height: 480,
  camera: {
    position: v3(0, 0, 0),
    rotation: { ...IDENT },
    fx: 600,
    fy: 600,
    cx: 320,
    cy: 240,
  },
})
assert.ok(pose)
assert.ok(pose.pinch.z < 0)
assert.equal(handInWelt({ ...pose && {}, bild: [], welt: [], width: 1, height: 1, camera: null }), null)

assert.equal(parseWeltOpen('Öffne die Welt'), true)
assert.equal(parseWeltOpen('Zeig die Welt'), true)
assert.equal(parseWeltOpen('Scanne den Raum'), false)
assert.equal(parseBoardIntent('Scanne den Raum')?.op, 'start')
assert.equal(parseScanCommand('Scanne den Raum')?.target, 'room')
assert.equal(parseBoardIntent('Öffne die Welt'), null)
assert.equal(parseAppIntent('Öffne die Welt')?.kind, 'welt')
assert.equal(parseAppIntent('Zeig die Welt')?.kind, 'welt')

const hitApp = await handleApp('c-welt', 'Öffne die Welt')
assert.equal(hitApp.handled, true)
assert.equal(hitApp.tool?.action, 'welt')
assert.match(hitApp.reply || '', /Welt ist offen/)

const overlay = src('src/ui/WeltOverlay.tsx')
assert.match(overlay, /getUserMedia/)
assert.match(overlay, /track\.stop/)
assert.match(overlay, /Schließen/)
assert.match(overlay, /ohneTracker/)
assert.match(overlay, /welt-menu-btn/)
assert.match(overlay, /Würfel/)
assert.match(overlay, /Sprache an/)
assert.match(overlay, /welt-mic/)
assert.doesNotMatch(overlay, /ARCore fehlt/)
const home = src('src/ui/HomeScreen.tsx')
assert.match(home, /id === 'welt'/)
const app = src('src/App.tsx')
assert.match(app, /WeltOverlay/)
assert.match(app, /id === 'welt'/)

function lenAbstand(p, q) {
  if (!p || !q) return Infinity
  return Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z)
}

console.log('test-welt ok')
