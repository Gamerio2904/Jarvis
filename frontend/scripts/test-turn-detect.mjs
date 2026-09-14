/**
 * Satzende-Erkennung als Tabelle. Reine Funktionen auf einem String — genau
 * deshalb kommt Stufe A vor dem Modell: das hier braucht kein Mikrofon.
 */
import assert from 'node:assert/strict'
import {
  SILENCE_COMPLETE_MS,
  SILENCE_HOLD_VOICE_MS,
  SILENCE_UNSURE_MS,
  turnCompleteness,
  turnLooksComplete,
  silenceMsFor,
} from '../src/engine/turn-detect.ts'

/** [Äußerung, erwartete Stufe, Hinweise] */
const TABLE = [
  // Satzzeichen ist der stärkste Beleg.
  ['Wie spät ist es?', 'complete', {}],
  ['Guten Morgen.', 'complete', {}],
  ['Mach das Licht an!', 'complete', {}],

  // Der Fall aus der Beschwerde: sechs Wörter galten als fertiger Satz.
  ['Erinnere mich morgen früh um acht', 'unsure', {}],
  ['Erinnere mich morgen früh um acht an den Zahnarzt', 'unsure', {}],
  ['Setz einen Termin für Donnerstag mit', 'incomplete', {}],

  // Der andere Fall: der häufigste Kurzbefehl wartete am längsten.
  ['Licht an', 'complete', {}],
  ['Fernseher aus', 'complete', {}],
  ['die Kugel an', 'complete', {}],
  ['Ventilator einschalten', 'complete', {}],
  ['Stopp', 'complete', {}],
  ['lauter', 'complete', {}],

  // Hängende Satzenden halten weiter — dieser Teil war schon richtig.
  ['Ich wollte noch und', 'incomplete', {}],
  ['Sag Bescheid wenn', 'incomplete', {}],
  ['Erinnere mich um', 'incomplete', {}],
  ['Termin am', 'incomplete', {}],
  ['Zeig mir mal', 'incomplete', {}],

  // Die Erkennung darf selbst abschließen — aber nicht gegen ein hängendes Ende.
  ['milch auf die einkaufsliste', 'complete', { isFinal: true }],
  ['milch auf die einkaufsliste', 'unsure', {}],
  ['ich brauche noch', 'incomplete', { isFinal: true }],

  // Unklar bleibt unklar, statt in eine der Extremstufen zu kippen.
  ['wie wird das Wetter morgen in München', 'unsure', {}],
  ['mhm', 'unsure', {}],
]

for (const [text, want, hints] of TABLE) {
  assert.equal(
    turnCompleteness(text, hints),
    want,
    `${JSON.stringify(text)}${hints.isFinal ? ' (isFinal)' : ''}: ${want} erwartet, ${turnCompleteness(text, hints)} bekommen`,
  )
}

/** Länge darf kein Beleg mehr sein — in keiner Richtung. */
assert.equal(turnCompleteness('a b c d e f g h'), 'unsure', 'viele Wörter machen keinen fertigen Satz')
assert.equal(
  turnCompleteness('Dies ist ein ziemlich langer Satz ohne jedes Satzzeichen am Ende hier'),
  'unsure',
)

/** Die drei Wartezeiten, und dass keine davon die alte Extremwahl ist. */
assert.equal(silenceMsFor('Licht an', true), SILENCE_COMPLETE_MS)
assert.equal(silenceMsFor('Erinnere mich morgen früh um acht', true), SILENCE_UNSURE_MS)
assert.equal(silenceMsFor('Ich wollte noch und', true), SILENCE_HOLD_VOICE_MS)
assert.ok(SILENCE_COMPLETE_MS < SILENCE_UNSURE_MS && SILENCE_UNSURE_MS < SILENCE_HOLD_VOICE_MS)

/**
 * Die Messung aus S254-6: dieselben Sätze vorher und nachher. „Vorher" ist die
 * Regel aus 16.6.0, hier nachgebaut, damit der Vergleich im Test steht und
 * nicht in einer Notiz.
 */
function silenceBefore(text, voiceMode = false) {
  const t = (text || '').replace(/\s+/g, ' ').trim()
  const words = t.split(/\s+/).filter(Boolean)
  const tail = /\b(?:und|oder|aber|weil|dass|also|dann|wenn|ob|mit|von|zu|für|nach|als|wie|der|die|das|ein|eine|einen|einem|ich|wir|man|noch)\s*$/i
  let complete = false
  if (t && !tail.test(t)) {
    if (/[.!?…]$/.test(t) && t.length >= 4) complete = true
    else if (words.length >= 2 && (words.length >= 6 || t.length >= 24)) complete = true
  }
  return complete ? SILENCE_COMPLETE_MS : voiceMode ? SILENCE_HOLD_VOICE_MS : 800
}

const SHORT = ['Licht an', 'Fernseher aus', 'die Kugel an', 'Ventilator einschalten', 'Stopp']
const LONG = [
  'Erinnere mich morgen früh um acht',
  'Erinnere mich morgen früh um acht an den Zahnarzt',
  'wie wird das Wetter morgen in München',
  'Setz einen Termin für Donnerstag mit',
  'trag mir den Zahnarzt am Dienstag ein',
]

const waitBefore = SHORT.reduce((n, t) => n + silenceBefore(t, true), 0) / SHORT.length
const waitAfter = SHORT.reduce((n, t) => n + silenceMsFor(t, true), 0) / SHORT.length
assert.ok(waitAfter < waitBefore, `Kurzbefehle warten länger: ${waitBefore} → ${waitAfter}`)

/** Abgeschnitten heißt: zu früh abgeschickt. Das ist die Zahl, die sinken muss. */
const cutBefore = LONG.filter((t) => silenceBefore(t, true) === SILENCE_COMPLETE_MS).length
const cutAfter = LONG.filter((t) => silenceMsFor(t, true) === SILENCE_COMPLETE_MS).length
assert.ok(cutAfter <= cutBefore, `mehr Fehlschnitte als vorher: ${cutBefore} → ${cutAfter}`)
assert.equal(cutAfter, 0, 'kein langer Satz wird mehr nach 220 ms abgeschnitten')

/** Kein Tausch: beide Zahlen müssen sich verbessern, nicht die eine gegen die andere. */
assert.ok(cutBefore > 0, 'vorher wurde tatsächlich abgeschnitten — sonst wäre der Vergleich sinnlos')
assert.equal(turnLooksComplete(''), false)

console.log(
  `ok turn-detect — Kurzbefehl ${waitBefore} → ${waitAfter} ms, Fehlschnitte ${cutBefore} → ${cutAfter} von ${LONG.length}`,
)
