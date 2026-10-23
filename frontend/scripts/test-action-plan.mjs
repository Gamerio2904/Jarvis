// @ts-nocheck
import assert from 'node:assert/strict'

const { actionPlan, finishPlan, plansEveryPart, clausePlan } = await import('../src/engine/action-plan.ts')
const { toolProgressLine } = await import('../src/engine/tool-agent.ts')
const { splitIntents, promoteSplitPart } = await import('../src/engine/split-intents.ts')

const said = 'was hab ich morgen eigentlich so vor, achso und wir brauchen noch milch eier und brot'
const plan = actionPlan(said)
assert.equal(plan?.kind, 'action')
assert.equal(plan?.line, 'Ich schaue in den Kalender und füge alles auf die Einkaufsliste.')
assert.equal(plan?.writes, true)
const parts = splitIntents(said).map(promoteSplitPart)
assert.equal(plansEveryPart(parts), true)
assert.equal(clausePlan(parts[0])?.write, false)
assert.equal(clausePlan(parts[1])?.phrase, 'füge alles auf die Einkaufsliste')

const moved = actionPlan('Dr. Weber hat mich auf morgen 15 Uhr umgebucht, halbe Stunde vorher muss ich los')
assert.equal(moved?.line, 'Ich trage das in den Kalender ein.')
assert.equal(moved?.writes, true)

const done = finishPlan('action', moved.line, 'Termin: Dr. Weber, morgen 15 Uhr.', true)
assert.match(done, /^Ich trage das in den Kalender ein\.\n\nErledigt\.\nTermin:/)

const read = finishPlan('action', 'Ich schaue in den Kalender.', 'Keine Termine.', false)
assert.equal(read, 'Ich schaue in den Kalender.\n\nKeine Termine.')
assert.doesNotMatch(read, /Erledigt/)

const hold = actionPlan('ich möchte einen marmorkuchen backen und brauche dazu eine richtige anleitung mit allen schritten')
assert.equal(hold?.kind, 'placeholder')
assert.equal(hold?.line, 'Ich lese das.')
assert.equal(finishPlan('placeholder', hold.line, 'Schritt 1: Teig', false), 'Schritt 1: Teig')

assert.equal(actionPlan('Hallo'), null)
assert.equal(toolProgressLine('run_ultron_command'), 'Einen Moment.')
assert.equal(
  toolProgressLine(['create_calendar_event', 'add_shopping_items']),
  'Ich trage das in den Kalender ein und füge alles auf die Einkaufsliste.',
)

console.log('test-action-plan ok')
