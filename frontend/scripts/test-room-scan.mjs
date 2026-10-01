// @ts-nocheck
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

const mem = Object.create(null)
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => {
    mem[k] = String(v)
  },
  removeItem: (k) => {
    delete mem[k]
  },
  clear: () => {
    for (const k of Object.keys(mem)) delete mem[k]
  },
}

const { parseBoardIntent } = await import('../src/engine/board-parse.ts')
const { handleBoard } = await import('../src/engine/board.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')
const { loadSettings, saveSettings } = await import('../src/engine/store.ts')
const {
  applyScan,
  dominantY,
  emptyPose,
  keepForeground,
  loadScan,
  meshFromPoints,
  noteDepth,
  orbit,
  panPose,
  pointsFromDepthMap,
  projectPoint,
  zoomPose,
} = await import('../src/engine/room-scan.ts')

assert.equal(parseBoardIntent('Scanne den Raum')?.op, 'start')
assert.equal(parseBoardIntent('Scanner den Raum')?.target, 'room')
assert.equal(parseBoardIntent('Scanne das Zimmer.')?.name, 'Raum')
assert.equal(parseBoardIntent('Scanne den Apfel')?.name, 'Apfel')
assert.equal(parseBoardIntent('Scanne das Objekt')?.target, 'object')
assert.equal(parseBoardIntent('Beende den Scan')?.op, 'end')
assert.equal(parseBoardIntent('Bennede den Scan')?.op, 'end')
assert.equal(parseBoardIntent('Scan beenden')?.op, 'end')
assert.equal(parseBoardIntent('den Raum scannen')?.target, 'room')
assert.equal(parseBoardIntent('den Apfel scannen')?.name, 'Apfel')
assert.equal(parseBoardIntent('Entferne alles aus dem Raum')?.op, 'clear')
assert.equal(parseBoardIntent('Tausche Bett mit Schreibtisch')?.op, 'swap')
assert.equal(parseBoardIntent('PC QR scannen'), null)
assert.equal(parseBoardIntent('Kontakte scannen'), null)
assert.equal(parseBoardIntent('Tisch an'), null)

assert.equal(routeForEval('Scanne den Raum'), 'board')
assert.equal(routeForEval('Scanne den Apfel'), 'board')
assert.equal(routeForEval('Beende den Scan'), 'board')
assert.equal(routeForEval('Entferne alles aus dem Raum'), 'board')
assert.equal(routeForEval('Tausche Bett mit Schreibtisch'), 'board')
assert.equal(routeForEval('PC QR scannen'), 'pc')
assert.equal(routeForEval('Kontakte scannen'), 'maps')

const started = await handleBoard('c', 'Scanne den Raum')
assert.equal(started.handled, true)
assert.match(started.reply, /Scan läuft/)
assert.equal(loadSettings().tischplatte_on, true)
assert.equal(loadScan().phase, 'live')

const early = applyScan({ kind: 'scan', op: 'end' })
assert.match(early, /Keine Tiefenwerte/)
assert.equal(loadScan().positions.length, 0)

const plane = []
for (let i = 0; i < 80; i++) plane.push({ x: (i % 10) * 0.1 - 0.5, y: 0, z: -1.4 - (i % 5) * 0.1 })
const apple = []
for (let i = 0; i < 40; i++) {
  apple.push({ x: (i % 5) * 0.02 - 0.04, y: 0.16 + (i % 3) * 0.01, z: -0.42 })
}
const kept = keepForeground([...plane, ...apple])
assert.ok(kept.length >= 12)
assert.ok(kept.every((p) => p.y > 0.1))
assert.ok(Math.abs(dominantY(plane)) < 0.001)

const grid = []
for (let y = 0; y < 6; y++) {
  for (let x = 0; x < 6; x++) grid.push({ x: x * 0.1, y: y * 0.1, z: -1 - x * 0.01 })
}
const mesh = meshFromPoints(grid)
assert.ok(mesh && mesh.indices.length >= 6)

const map = new Float32Array(16)
map[0] = 1
map[5] = 0.8
const pts = pointsFromDepthMap(map, 4, 4, 1)
assert.ok(pts.length >= 2)
assert.ok(pts.every((p) => p.z < 0))

let pose = emptyPose()
pose = orbit(pose, 10, 4)
assert.ok(pose.yaw > 0.5)
pose = panPose(pose, 12, -3)
assert.equal(pose.panX, 12)
pose = zoomPose(pose, 2)
assert.equal(pose.scale, 2)
assert.ok(projectPoint(0, 0, -1, emptyPose(), 400, 300))

saveSettings({ scan_json: '' })
const again = await handleBoard('c', 'Scanne den Apfel')
assert.match(again.reply, /Apfel/)
noteDepth(grid)
const done = await handleBoard('c', 'Beende den Scan')
assert.match(done.reply, /liegt auf dem Tisch/)
const model = loadScan()
assert.equal(model.name, 'Apfel')
assert.equal(model.depth, true)
assert.ok(model.positions.length > 0)

const objects = [
  {
    id: 'bed',
    name: 'Bett',
    cls: 'bed',
    removed: false,
    pose: { x: -0.4, y: 0, z: -1 },
    positions: [0, 0, 0, 0.1, 0, 0, 0, 0.1, 0],
    indices: [0, 1, 2],
  },
  {
    id: 'desk',
    name: 'Schreibtisch',
    cls: 'desk',
    removed: false,
    pose: { x: 0.4, y: 0, z: -1.2 },
    positions: [0, 0, 0, 0.1, 0, 0, 0, 0.1, 0],
    indices: [0, 1, 2],
  },
]
saveSettings({
  scan_json: JSON.stringify({
    phase: 'model',
    target: 'room',
    name: 'Raum',
    depth: true,
    note: '',
    positions: [],
    indices: [],
    objects,
  }),
})
const swapped = applyScan({ kind: 'scan', op: 'swap', a: 'Bett', b: 'Schreibtisch' })
assert.match(swapped, /getauscht/)
const after = loadScan()
assert.equal(after.objects.find((o) => o.id === 'bed').pose.x, 0.4)
assert.equal(after.objects.find((o) => o.id === 'desk').pose.x, -0.4)
const cleared = applyScan({ kind: 'scan', op: 'clear' })
assert.match(cleared, /Entfernt/)
assert.ok(loadScan().objects.every((o) => o.removed))

saveSettings({
  scan_json: JSON.stringify({ phase: 'model', target: 'room', name: 'Raum', depth: false, positions: [], indices: [], objects: [] }),
})
assert.match(applyScan({ kind: 'scan', op: 'clear' }), /Keine Klassen/)
assert.match(applyScan({ kind: 'scan', op: 'swap', a: 'Bett', b: 'Schreibtisch' }), /fehlt/)

console.log('room-scan ok')
