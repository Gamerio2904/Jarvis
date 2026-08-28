/**
 * Prompt-Matrix 6.50: Gold lockt, Lücken nur Report.
 * Gold darf nicht kippen. Gaps sind der Fix-Plan (`docs/46-next.md`).
 */
import assert from 'node:assert/strict'
import { pickRouteFromCtx } from '../src/engine/route-pick.ts'
import { parseHudIntent } from '../src/engine/hud-parse.ts'
import { isHelpCommand } from '../src/engine/guards.ts'
import { isLiveLookup, parseShopDiscountIntent } from '../src/engine/research-parse.ts'
import { parseOrdinalFollowUp } from '../src/engine/ordinal.ts'
import { normalizeUtterance } from '../src/engine/utterance.ts'
import { parseWontIntent } from '../src/engine/wont-parse.ts'

function route(text) {
  text = normalizeUtterance(text)
  if (!text.trim()) return null
  if (isHelpCommand(text)) return 'help'
  if (parseShopDiscountIntent(text)) return 'discount'
  if (parseOrdinalFollowUp(text)) return 'ordinal'
  const id = pickRouteFromCtx({
    conversationId: 'test',
    text,
    lastTool: '',
    lastMedium: '',
    inDrive: false,
  })
  if (id) return id
  if (isLiveLookup(text)) return 'research'
  return 'llm'
}

/** Muss so bleiben — Regression = Fail. */
const LOCK = [
  ['Zeig mir London', 'hud', 'pin'],
  ['Zeig London', 'hud', 'pin'],
  ['Zeig Paris', 'hud', 'pin'],
  ['flieg nach Berlin', 'hud', 'pin'],
  ['zoom auf Tokio', 'hud', 'pin'],
  ['Wo liegt Tokio', 'hud', 'pin'],
  ['Was ist das für eine Stadt?', 'hud', 'look'],
  ['Was sehe ich?', 'hud', 'look'],
  ['Welche Stadt ist das?', 'hud', 'look'],
  ['Zeig mir Atlantis', 'hud', 'unknown_place'],
  ['flieg nach Atlantis', 'hud', 'unknown_place'],
  ['Zeig New York', 'hud', 'pin'],
  ['Zeig NYC', 'hud', 'pin'],
  ['Zeig München', 'hud', 'pin'],
  ['mach die weltkugel an', 'hud', 'view'],
  ['zeig mal london auf der weltkugel', 'hud', 'pin'],
  ['flieg nach berlin bitte', 'hud', 'pin'],
  ['wo liegt eigentlich paris', 'hud', 'pin'],
  ['Körper an', 'hud', 'view'],
  ['Zeig das Auge', 'hud', 'organ'],
  ['Hilfe', 'help', null],
  ['/hilfe', 'help', null],
  ['Spiele Musik', 'drive', null],
  ['klick das Captcha', 'wont', null],
  ['Öffne Banking und überweise 500 Euro', 'wont', null],
]

/**
 * Soll nach 6.51. Ist = heute. Nur Report, kein Fail.
 * want = gewünschte Route nach dem Fix-Plan.
 */
const GAP = [
  ['Was kannst du?', 'help', 'llm'],
  ['Was kannst du denn so?', 'help', 'llm'],
  ['Womit kannst du helfen?', 'help', 'llm'],
  ['Schreib mir eine E-Mail', 'refuse', 'maps'],
  ['Zeig mir die Nachrichten', 'news', 'hud'],
  ['Überweise 200 Euro', 'wont', 'fx'],
  ['Zeig Street View von London', 'refuse', 'hud'],
  ['Was is das für ne Stadt', 'hud', 'llm'],
  ['welche stadt sehe ich denn', 'hud', 'llm'],
  ['Was sehe ich auf der Kugel', 'hud', 'llm'],
  ['Ist das Paris?', 'hud', 'llm'],
  ['Körper an und Zeig London', 'hud', 'llm'],
  ['Wo liegt Berln', 'hud', 'eye'],
  ['erde bitte anzeigen', 'hud', 'llm'],
  ['Kuegel an', 'hud', 'llm'],
  ['Zeig mir', 'refuse', 'hud'],
  ['Wie komme ich nach Hause', 'drive', 'llm'],
  ['Rufe 112', 'refuse', 'llm'],
  ['Mach Live-Satellitenvideo an', 'refuse', 'llm'],
  ['Öffne Instagram', 'refuse', 'llm'],
  ['Bestell Pizza', 'refuse', 'llm'],
  ['Kannst du Bilder malen?', 'refuse', 'llm'],
  ['Zeige Notizen', 'tools', 'hud'],
]

let fail = 0
console.log('\n=== LOCK ===')
for (const [prompt, want, hudKind] of LOCK) {
  const got = route(prompt)
  const hud = parseHudIntent(prompt)
  const ok = got === want && (hudKind == null || hud?.kind === hudKind)
  if (!ok) fail += 1
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} want=${want.padEnd(8)} got=${String(got).padEnd(8)} hud=${String(hud?.kind || '-').padEnd(14)} ← ${JSON.stringify(prompt)}`,
  )
}

let open = 0
let closed = 0
console.log('\n=== GAP (Soll nach 6.51, Ist heute) ===')
for (const [prompt, want, today] of GAP) {
  const got = route(prompt)
  const hud = parseHudIntent(prompt)
  const still = got === today
  const done = got === want && got !== today
  if (done) closed += 1
  else if (still) open += 1
  else {
    open += 1
    console.log(`drift want=${want} today=${today} got=${got} ← ${JSON.stringify(prompt)}`)
  }
  const mark = done ? 'DONE' : still ? 'gap ' : 'MOVE'
  console.log(
    `${mark} soll=${want.padEnd(8)} ist=${String(got).padEnd(8)} hud=${String(hud?.kind || '-').padEnd(14)} wont=${parseWontIntent(prompt)?.reason || '-'} ← ${JSON.stringify(prompt)}`,
  )
}

assert.equal(parseHudIntent('Zeig mir London')?.name, 'London')
assert.equal(parseHudIntent('Was ist das für eine Stadt?')?.kind, 'look')
assert.equal(parseHudIntent('Zeig mir Atlantis')?.kind, 'unknown_place')
assert.equal(isHelpCommand('Hilfe'), true)
assert.equal(isHelpCommand('Was kannst du?'), false)

console.log(`\nlock fails: ${fail} / ${LOCK.length}`)
console.log(`gaps open: ${open}  closed: ${closed}  / ${GAP.length}`)
if (fail) process.exitCode = 2
