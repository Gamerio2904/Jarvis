import assert from 'node:assert/strict'
import { parseTvIntent } from '../src/engine/tv-parse.ts'
import { parseMemoryFacts, isMemoryWrite, isMemoryRecall } from '../src/engine/memory-parse.ts'
import { parseToolIntent } from '../src/engine/tools-parse.ts'
import { scrubReply, isHelpCommand } from '../src/engine/guards.ts'
import { isIdentityAsk } from '../src/engine/memory-parse.ts'
import { isLiveLookup } from '../src/engine/research-parse.ts'
import { parseReminderIntent, formatDue } from '../src/engine/remind-parse.ts'
import { parseWeatherFollowup, parseWeatherIntent } from '../src/engine/weather-parse.ts'
import { parseTimerIntent } from '../src/engine/timer-parse.ts'
import { parseAlarmIntent } from '../src/engine/alarm-parse.ts'
import { clothingTip, formatWeatherBrief } from '../src/engine/weather-brief.ts'
import { parseCalendarIntent } from '../src/engine/calendar-parse.ts'
import { createSentenceTap, pullReady } from '../src/engine/speak-tap.ts'

assert.equal(parseTvIntent('Fernseher an')?.action, 'on')
assert.equal(parseTvIntent('mach den TV aus')?.action, 'off')
assert.equal(parseTvIntent('Fernseher lauter')?.action, 'volume_up')
assert.equal(parseTvIntent('TV leiser')?.action, 'volume_down')
assert.equal(parseTvIntent('Fernseher stumm')?.action, 'mute')
assert.equal(parseTvIntent('auf HDMI 2'), null)
assert.equal(parseTvIntent('Fernseher auf HDMI 2')?.action, 'hdmi2')
assert.equal(parseTvIntent('TV Quelle 1')?.action, 'hdmi1')
assert.equal(parseTvIntent('lauter'), null)
assert.equal(parseTvIntent('lauter', true)?.action, 'volume_up')

assert.ok(isMemoryWrite('Ich heiße Max und trinke gerne Kaffee'))
const facts = parseMemoryFacts('Ich heiße Max und trinke gerne Kaffee und esse Pizza')
assert.equal(facts.find((f) => f.key === 'name')?.value, 'Max')
assert.equal(facts.find((f) => f.key === 'getränk')?.value, 'Kaffee')
assert.equal(facts.find((f) => f.key === 'essen')?.value, 'Pizza')
assert.ok(isMemoryRecall('Was trinke ich?'))
assert.ok(isMemoryRecall('Wie ist mein Name?'))
assert.ok(!isMemoryWrite('Hallo Jarvis'))

assert.equal(parseToolIntent('todo: Milch')?.kind, 'todo_create')
assert.equal(parseToolIntent('Milch kaufen')?.kind, 'todo_create')
assert.equal(parseToolIntent('ich muss noch Brot holen')?.kind, 'todo_create')
assert.equal(parseToolIntent('erinner mich an Steuer')?.kind, 'todo_create')
assert.equal(parseToolIntent('erledige das erste')?.kind, 'todo_done_first')
assert.equal(parseToolIntent('was steht an')?.kind, 'todo_list')
assert.equal(parseToolIntent('Was soll ich kaufen?'), null)

assert.ok(isHelpCommand('/hilfe'))
assert.match(scrubReply('Du bist toll und dein Hund auch'), /Sie/)
assert.match(scrubReply('Ich habe den Fernseher ausgeschaltet'), /nicht ausgeführt/)
assert.match(scrubReply('Sie leiden an akuter Amnesie.'), /Jarvis/)
assert.equal(
  scrubReply('Ich habe das Internet nach Kuchenrezepten durchsucht. Zucker und Mehl reichen.').includes(
    'durchsucht',
  ),
  false,
)
assert.ok(isIdentityAsk('Wer bist du und wer bin ich?'))
assert.ok(isLiveLookup('Suche im Internet nach Kuchenrezepten'))
assert.ok(isLiveLookup('Wie ist die Temperatur in Ingesheim heute?'))
assert.ok(!isLiveLookup('Hallo Jarvis.'))

const frozen = new Date('2026-08-15T14:00:00')
const in20 = parseReminderIntent('in 20 Minuten Milch', frozen)
assert.equal(in20?.kind, 'create')
if (in20?.kind === 'create') {
  assert.equal(in20.title, 'Milch')
  assert.equal(in20.due.getTime(), frozen.getTime() + 20 * 60_000)
}
const morgen = parseReminderIntent('morgen 8 Uhr Steuer', frozen)
assert.equal(morgen?.kind, 'create')
if (morgen?.kind === 'create') {
  assert.equal(morgen.title, 'Steuer')
  assert.equal(morgen.due.getHours(), 8)
  assert.equal(morgen.due.getDate(), 16)
}
const um = parseReminderIntent('erinner mich um 18:30 an Ofen', frozen)
assert.equal(um?.kind, 'create')
if (um?.kind === 'create') assert.equal(um.title, 'Ofen')
assert.equal(parseReminderIntent('erinner mich an Steuer', frozen), null)
assert.equal(parseReminderIntent('was steht an')?.kind, 'agenda')
assert.equal(parseReminderIntent('zeige Erinnerungen')?.kind, 'list')
assert.equal(parseReminderIntent('lösche Erinnerung Milch')?.kind, 'delete')
const daily = parseReminderIntent('jeden Tag 8 Uhr Tabletten', frozen)
assert.equal(daily?.kind, 'create')
if (daily?.kind === 'create') {
  assert.equal(daily.recur, 'daily')
  assert.equal(daily.title, 'Tabletten')
}
const weekly = parseReminderIntent('jeden Montag 18 Uhr Steuer', frozen)
assert.equal(weekly?.kind, 'create')
if (weekly?.kind === 'create') {
  assert.equal(weekly.recur, 'weekly')
  assert.equal(weekly.title, 'Steuer')
}

const timer = parseTimerIntent('Timer 8 Minuten Nudeln', frozen)
assert.equal(timer?.kind, 'create')
if (timer?.kind === 'create') {
  assert.equal(timer.title, 'Nudeln')
  assert.ok(timer.ms >= 7 * 60_000)
}
assert.equal(parseTimerIntent('Timer aus')?.kind, 'stop')
assert.equal(parseTimerIntent('in 20 Minuten Milch'), null)
const onceAlarm = parseAlarmIntent('Wecker 7 Uhr', frozen)
assert.equal(onceAlarm?.kind, 'create')
if (onceAlarm?.kind === 'create') {
  assert.equal(onceAlarm.recur, undefined)
  assert.equal(onceAlarm.due.getHours(), 7)
}
const dailyAlarm = parseAlarmIntent('Wecker 6:30 jeden Tag', frozen)
assert.equal(dailyAlarm?.kind, 'create')
if (dailyAlarm?.kind === 'create') assert.equal(dailyAlarm.recur, 'daily')
const weekAlarm = parseAlarmIntent('Wecker jeden Montag 7 Uhr Arbeit', frozen)
assert.equal(weekAlarm?.kind, 'create')
if (weekAlarm?.kind === 'create') {
  assert.equal(weekAlarm.recur, 'weekly')
  assert.equal(weekAlarm.title, 'Arbeit')
}
assert.equal(parseAlarmIntent('Wecker aus')?.kind, 'stop')
assert.equal(parseAlarmIntent('Timer 8 Minuten'), null)
assert.match(formatDue(new Date('2026-08-15T17:42:00'), frozen), /heute/)

assert.equal(parseWeatherIntent('Wetter heute')?.kind, 'here')
assert.equal(parseWeatherIntent('Wetter heute')?.when, 'today')
assert.equal(parseWeatherIntent('Temperatur hier')?.kind, 'here')
const munich = parseWeatherIntent('Wetter in München')
assert.equal(munich?.kind, 'place')
if (munich?.kind === 'place') assert.equal(munich.place, 'München')
assert.equal(parseWeatherIntent('Wetter morgen in Köln')?.when, 'tomorrow')
assert.equal(parseWeatherIntent('Brauche ich einen Schirm')?.focus, 'rain')
assert.equal(parseWeatherIntent('Was soll ich anziehen')?.focus, 'wear')
assert.equal(parseWeatherIntent('Wetter am Wochenende')?.when, 'weekend')
assert.equal(parseWeatherIntent('Hallo Jarvis'), null)
const last = { kind: 'place', place: 'München', when: 'today', focus: 'general' }
const follow = parseWeatherFollowup('und morgen?', last)
assert.equal(follow?.when, 'tomorrow')
if (follow?.kind === 'place') assert.equal(follow.place, 'München')
const followCity = parseWeatherFollowup('und in Berlin', last)
if (followCity?.kind === 'place') assert.equal(followCity.place, 'Berlin')
assert.equal(parseWeatherFollowup('und morgen?', null), null)

const snap = {
  place: 'München, Bayern',
  temp: 18,
  feels: 16,
  label: 'wolkig',
  code: 2,
  wind: 12,
  precipNow: 0,
  today: { date: '2026-08-15', min: 14, max: 21, precipProb: 20, label: 'wolkig' },
  tomorrow: { date: '2026-08-16', min: 12, max: 19, precipProb: 70, label: 'Schauer' },
  saturday: { date: '2026-08-15', min: 16, max: 22, precipProb: 10, label: 'klar' },
  sunday: { date: '2026-08-16', min: 13, max: 17, precipProb: 80, label: 'Regen' },
  rainSoon: false,
  maxPrecipSoon: 20,
}
const nowBrief = formatWeatherBrief(snap, 'now', 'general')
assert.match(nowBrief, /München/)
assert.match(nowBrief, /18 Grad/)
assert.doesNotMatch(nowBrief, /Open-Meteo|°C/)
assert.match(formatWeatherBrief(snap, 'tomorrow', 'general'), /morgen/)
assert.match(formatWeatherBrief(snap, 'tomorrow', 'rain'), /Schirm/)
assert.match(formatWeatherBrief(snap, 'weekend', 'general'), /Wochenende/)
assert.match(formatWeatherBrief(snap, 'now', 'wear'), /Pulli|Jacke|anziehen/)
assert.match(clothingTip({ feels: 16, wet: false, code: 2, wind: 12 }), /Pulli/)
assert.match(clothingTip({ feels: 16, wet: true, code: 63, wind: 12 }), /Schirm/)

const termin = parseCalendarIntent('Termin morgen 15 Uhr Zahnarzt', frozen)
assert.equal(termin?.kind, 'create')
if (termin?.kind === 'create') {
  assert.equal(termin.title, 'Zahnarzt')
  assert.equal(termin.start.getHours(), 15)
}
const dated = parseCalendarIntent('Termin 21.08. mit jane treffen', frozen)
assert.equal(dated?.kind, 'create')
if (dated?.kind === 'create') {
  assert.equal(dated.title, 'mit jane treffen')
  assert.equal(dated.start.getDate(), 21)
  assert.equal(dated.start.getMonth(), 7)
  assert.equal(dated.start.getHours(), 10)
  assert.equal(dated.start.getFullYear(), 2026)
}
const datedTime = parseReminderIntent('21.08. 15 Uhr Zahnarzt', frozen)
assert.equal(datedTime?.kind, 'create')
if (datedTime?.kind === 'create') {
  assert.equal(datedTime.title, 'Zahnarzt')
  assert.equal(datedTime.due.getHours(), 15)
}
assert.equal(parseAlarmIntent('Wecker 5 Uhr', frozen)?.title, 'Wecker')
assert.equal(parseCalendarIntent('Kalender')?.kind, 'open')
assert.equal(parseCalendarIntent('was habe ich am Freitag', frozen)?.kind, 'list')
assert.equal(parseCalendarIntent('lösche Termin Zahnarzt')?.kind, 'delete')

assert.deepEqual(pullReady('Hallo wie geht').parts, [])
assert.deepEqual(pullReady('Ja. ').parts, [])
const two = pullReady('Ja. Der Termin ist morgen um 15 Uhr.')
assert.equal(two.parts.length, 1)
assert.match(two.parts[0], /Ja\./)
assert.match(two.parts[0], /15 Uhr/)
const short = pullReady('Das Wetter ist gut.')
assert.deepEqual(short.parts, [])
assert.match(short.rest, /Das Wetter ist gut/)
const long = pullReady(
  'Das Wetter bleibt heute freundlich, weitgehend trocken und angenehm warm im ganzen Land.',
)
assert.equal(long.parts.length, 1)
assert.equal(long.rest, '')

const tap = createSentenceTap()
assert.deepEqual(tap.feed('Hallo, der Himmel'), [])
assert.deepEqual(tap.feed('Hallo, der Himmel ist blau.'), [])
assert.deepEqual(tap.flush(), ['Hallo, der Himmel ist blau.'])
const tap2 = createSentenceTap()
assert.deepEqual(tap2.feed('Eins. '), [])
const got = tap2.feed('Eins. Zwei kommt jetzt wirklich.')
assert.equal(got.length, 1)
assert.match(got[0], /Eins/)
assert.match(got[0], /Zwei/)

console.log('ok 0.14 parsers')
