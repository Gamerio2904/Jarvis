// @ts-nocheck — Test-Skript mit losen Literalen/Mocks; Laufzeit wird vom Test selbst geprüft.
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

const { parseAblaufIntent } = await import('../src/engine/ablauf-parse.ts')
const { applyGuiUtterance, parseGuiUtterance } = await import('../src/engine/gui-mock.ts')
const { handleIdea, sparPlan } = await import('../src/engine/idea.ts')
const { parsePlan } = await import('../src/engine/idea-plan.ts')
const { listIdeas, loadSettings } = await import('../src/engine/store.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { REAL_CARDS } = await import('../src/engine/yugioh-real-decks.ts')

assert.equal(parseAblaufIntent('öffne eine leere Datei')?.kind, 'blank')
assert.equal(parseAblaufIntent('plane ein neues Projekt')?.kind, 'blank')
assert.equal(parseAblaufIntent('neue Datei')?.kind, 'blank')
assert.equal(parseAblaufIntent('leg ein Projekt an')?.kind, 'blank')
assert.equal(parseAblaufIntent('Plane ein neues Projekt: Haushaltsbuch')?.kind, 'session')
assert.equal(pickRoute('öffne eine leere Datei'), 'idea')

const jar = Object.values(REAL_CARDS).find((card) => card.name === 'Jar of Greed')
assert.equal(jar?.kind, 'spell')
assert.equal(jar?.type, 'Spell Card')

assert.equal(parseGuiUtterance('simuliere die gui')?.kind, 'show')
assert.equal(parseGuiUtterance('in die Mitte ein Tiktakto Feld')?.kind, 'add')
assert.equal(parseGuiUtterance('oben links ein Menü-Button')?.place, 'top-left')
const moved = parseGuiUtterance('ne den Menübutton doch rechts')
assert.equal(moved?.kind, 'move')
assert.equal(moved?.axis, 'right')

let elements = []
const board = applyGuiUtterance(elements, 'in die Mitte ein Tiktakto Feld')
assert.equal(board.elements[0].place, 'center')
assert.equal(board.elements[0].kind, 'board')
const menu = applyGuiUtterance(board.elements, 'oben links ein Menü-Button')
assert.equal(menu.elements.length, 2)
const shifted = applyGuiUtterance(menu.elements, 'ne den Menübutton doch rechts')
assert.equal(shifted.elements.find((row) => row.kind === 'button').place, 'top-right')
assert.match(shifted.reply, /oben rechts/)
const empty = applyGuiUtterance([], 'simuliere die GUI')
assert.match(empty.reply, /noch leer/)

const opened = await handleIdea('plan-gui', 'öffne eine leere Datei')
assert.match(opened.reply, /Neue Datei angelegt/)
assert.match(opened.reply, /betiteln/)
assert.equal(loadSettings().plan_spar_step, 'title')
const named = await sparPlan('TikTakTo', 'plan-gui')
assert.match(named, /TikTakTo/)
assert.match(named, /konkret können/)
const shown = await sparPlan('simuliere die gui', 'plan-gui')
assert.match(shown, /noch leer/)
assert.equal(loadSettings().tischplatte_view, 'sim')
const placed = await sparPlan('in die Mitte ein Tiktakto Feld', 'plan-gui')
assert.match(placed, /Mitte/)
const button = await sparPlan('oben links ein Menü-Button', 'plan-gui')
assert.match(button, /oben links/)
const right = await sparPlan('ne den Menübutton doch rechts', 'plan-gui')
assert.match(right, /oben rechts/)
const idea = (await listIdeas()).find((row) => row.title === 'TikTakTo')
assert.ok(idea?.plan?.simulation)
const again = parsePlan(idea.plan, idea.id)
assert.equal(again?.simulation?.elements?.find((row) => row.type === 'place' && row.kind === 'button')?.place, 'top-right')

console.log('plan-gui ok')
