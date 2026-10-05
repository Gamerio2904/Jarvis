/**
 * Routes every TEST_PROMPT the same way chat.ts does (no LLM, no phone).
 * Order: help → tv → memory → calendar → alarm → timer → reminder → tools → weather → research → llm
 */
import assert from 'node:assert/strict'
import { TEST_PROMPTS } from '../src/engine/test-prompts.ts'
import { isHelpCommand } from '../src/engine/guards.ts'
import { parseTvIntent } from '../src/engine/tv-parse.ts'
import { isIdentityAsk, isMemoryRecall, isMemoryWrite } from '../src/engine/memory-parse.ts'
import { parseCalendarIntent } from '../src/engine/calendar-parse.ts'
import { parseAlarmIntent } from '../src/engine/alarm-parse.ts'
import { parseTimerIntent } from '../src/engine/timer-parse.ts'
import { parseReminderIntent } from '../src/engine/remind-parse.ts'
import { parseToolIntent } from '../src/engine/tools-parse.ts'
import { parseWeatherFollowup, parseWeatherIntent } from '../src/engine/weather-parse.ts'
import { isLiveLookup } from '../src/engine/research-parse.ts'

const NOW = new Date('2026-08-15T14:00:00')

/** @typedef {'help'|'tv'|'memory'|'calendar'|'alarm'|'timer'|'reminder'|'tools'|'weather'|'research'|'llm'} Route */

/** @param {string} text @param {{ weatherLast?: import('../src/engine/weather-parse.ts').WeatherLast | null }} [ctx] */
function route(text, ctx = {}) {
  if (isHelpCommand(text)) return 'help'
  if (parseTvIntent(text)) return 'tv'
  if (isMemoryWrite(text) || isMemoryRecall(text) || isIdentityAsk(text)) return 'memory'
  if (parseCalendarIntent(text, NOW)) return 'calendar'
  if (parseAlarmIntent(text, NOW)) return 'alarm'
  if (parseTimerIntent(text, NOW)) return 'timer'
  if (parseReminderIntent(text, NOW)) return 'reminder'
  if (parseToolIntent(text)) return 'tools'
  if (parseWeatherIntent(text)) return 'weather'
  if (parseWeatherFollowup(text, ctx.weatherLast ?? null)) return 'weather'
  if (isLiveLookup(text)) return 'research'
  return 'llm'
}

/** @type {Record<string, Route>} */
const EXPECT = {
  'Hallo Jarvis.': 'llm',
  'Wer bist du und wer bin ich?': 'memory',
  'Ich heiße Max und trinke gerne Kaffee.': 'memory',
  'Was trinke ich?': 'memory',
  'Wie ist mein Name?': 'memory',
  'Milch kaufen': 'tools',
  'Was steht an?': 'reminder',
  '/hilfe': 'help',
  'Fernseher an': 'tv',
  'Sag Hallo und duze mich.': 'llm',
  'Erklären Sie in einem Satz, was Sie tun.': 'llm',
  'Notiz: WLAN steht am Router': 'tools',
  'Zeige Notizen': 'tools',
  'Suche im Internet nach Kuchenrezepten': 'research',
  'in 20 Minuten Milch': 'reminder',
  'morgen 8 Uhr Steuer': 'reminder',
  'Wetter heute': 'weather',
  'Wetter morgen in München': 'weather',
  'und morgen?': 'llm',
  'Brauche ich einen Schirm?': 'weather',
  'Was soll ich anziehen?': 'weather',
  'Timer 8 Minuten Nudeln': 'timer',
  'Wecker 7 Uhr': 'alarm',
  'Wecker 7 Uhr jeden Tag': 'alarm',
  'jeden Tag 8 Uhr Tabletten': 'reminder',
  'Temperatur hier': 'weather',
  'Termin morgen 15 Uhr Zahnarzt': 'calendar',
  Kalender: 'calendar',
}

const missing = TEST_PROMPTS.filter((p) => !(p in EXPECT))
assert.equal(missing.length, 0, `neue Chips ohne Erwartung: ${missing.join(' | ')}`)

const extra = Object.keys(EXPECT).filter((p) => !TEST_PROMPTS.includes(/** @type {never} */ (p)))
assert.equal(extra.length, 0, `tote Erwartungen: ${extra.join(' | ')}`)

/** @type {Array<{ prompt: string, got: Route, want: Route }>} */
const rows = []
let fail = 0
for (const prompt of TEST_PROMPTS) {
  const got = route(prompt)
  const want = EXPECT[prompt]
  rows.push({ prompt, got, want })
  if (got !== want) fail += 1
}

const follow = route('und morgen?', {
  weatherLast: { kind: 'place', place: 'München', when: 'today', focus: 'general' },
})
assert.equal(follow, 'weather', 'und morgen? nach Wetter-Kontext')

for (const r of rows) {
  const mark = r.got === r.want ? 'ok' : 'FAIL'
  console.log(`${mark.padEnd(4)} ${r.want.padEnd(10)} ← ${r.prompt}`)
}

assert.equal(fail, 0, `${fail} Chip(s) falsch geroutet`)
console.log(`ok ${rows.length} chips + Wetter-Nachfrage`)
