// @ts-nocheck — Sprint 279: Altbestand (Mocks). Neue Skripte ohne diese Zeile.
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

/**
 * Sprint 258 — der Werkzeug-Vertrag.
 *
 * Geprüft wird nicht, ob das Modell gut vorschlägt (das kann kein Test in
 * Node), sondern ob ein **schlechter** Vorschlag folgenlos bleibt: erfundene
 * Werkzeuge, falsche Argumente, geschmuggelte Zweitbefehle, und vor allem die
 * Bestätigungspflicht bei allem, was etwas ändert.
 */

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

const {
  ARG_NAMES,
  TOOL_CONTRACTS,
  TOOL_NAMES,
  cleanTitle,
  confirmedUtterance,
  contractOf,
  looksCommandish,
  readProposal,
  toolJsonSchema,
  toolSystemPrompt,
  utteranceFor,
} = await import('../src/engine/tool-contract.ts')
const { routeForEval } = await import('../src/engine/eval/route-eval.ts')
const { agentById } = await import('../src/engine/agents/catalog.ts')
const { proposeReady, proposeTool } = await import('../src/engine/tool-propose.ts')
const store = await import('../src/engine/store.ts')

const bag = (over = {}) => ({ minutes: null, time: null, date: null, title: null, state: null, ...over })

// ------------------------------------- Der Vertrag prüft sich selbst

/**
 * Jedes Werkzeug muss einen Satz erzeugen, den die Parser von heute
 * bestätigen. Ein Werkzeug, das mehr verspricht als der Parser einlöst, endet
 * in „ich habe es notiert" ohne Notiz.
 */
const BEISPIELE = {
  set_timer: bag({ minutes: '10' }),
  set_alarm: bag({ time: '07:30' }),
  create_reminder: bag({ time: '08:00', date: 'tomorrow', title: 'Zahnarzt' }),
  create_calendar_event: bag({ time: '09:00', date: '2026-10-02', title: 'Paket abholen' }),
  add_shopping_item: bag({ title: 'Milch' }),
  switch_tv: bag({ state: 'on' }),
}
for (const contract of TOOL_CONTRACTS) {
  const args = BEISPIELE[contract.name]
  assert.ok(args, `kein Beispiel für ${contract.name} — jedes Werkzeug braucht eins`)
  const text = utteranceFor({ tool: contract.name, args })
  assert.ok(text, `${contract.name} erzeugt keinen Satz`)
  assert.equal(routeForEval(text), contract.agent, `„${text}" landet nicht bei ${contract.agent}`)
}

/**
 * Die vierte Schranke, als Regel statt als Feld: alles, was etwas ändert oder
 * ein Gerät anfasst, ist bestätigungspflichtig. Der Director liest dieselbe
 * Quelle — wenn hier jemand ein `read` einträgt, das in Wahrheit schreibt,
 * fällt es hier auf.
 */
for (const contract of TOOL_CONTRACTS) {
  const agent = agentById(contract.agent)
  assert.ok(agent, `${contract.agent} steht nicht im Katalog`)
  assert.ok(
    ['device', 'write', 'read'].includes(agent.sideEffect),
    `${contract.agent} hat keine bekannte Wirkung`,
  )
}
assert.equal(agentById('tv').sideEffect, 'device', 'der Fernseher bleibt bestätigungspflichtig')
for (const name of ['set_timer', 'set_alarm', 'create_reminder', 'create_calendar_event', 'add_shopping_item']) {
  assert.equal(agentById(contractOf(name).agent).sideEffect, 'write')
}

// ---------------------------------------------------- Schema und Prompt

const schema = toolJsonSchema()
assert.equal(schema.additionalProperties, false, 'strict verbietet offene Maps')
assert.deepEqual(schema.required, ['tool', 'args'])
assert.deepEqual(schema.properties.args.required, [...ARG_NAMES], 'strict verlangt alle Felder')
assert.equal(schema.properties.args.additionalProperties, false)
assert.deepEqual(schema.properties.tool.enum, [...TOOL_NAMES, 'none'])
for (const name of ARG_NAMES) {
  assert.deepEqual(schema.properties.args.properties[name].type, ['string', 'null'], `${name} muss nullable sein`)
}

/** S258-10: das Schema steht **einmal** im Aufruf, nicht zusätzlich im Prompt. */
const prompt = toolSystemPrompt()
assert.equal(prompt.includes('"type"'), false, 'kein JSON-Schema im Prompttext')
assert.equal(prompt.includes('{'), false, 'keine geschweifte Klammer im Prompttext')
assert.ok(prompt.includes('never execute'), 'der Prompt sagt, dass nichts ausgeführt wird')
/** Maschinenseitiger Text ist englisch (69-modell-grundlagen §2.2). */
assert.equal(/[äöüß]/i.test(prompt), false, 'Werkzeug-Beschreibungen sind englisch')
for (const contract of TOOL_CONTRACTS) {
  assert.ok(prompt.includes(contract.name), `${contract.name} fehlt im Prompt`)
  assert.equal(/[äöüß]/i.test(contract.description), false, `${contract.name} beschreibt sich nicht englisch`)
}

// --------------------------------------------- Was das Schema durchlässt

assert.equal(readProposal(null), null)
assert.equal(readProposal('set_timer'), null)
assert.equal(readProposal([]), null)
assert.equal(readProposal({ tool: 'none', args: bag() }), null, '„none" ist kein Vorschlag')
assert.equal(readProposal({ tool: 'rm_rf', args: bag() }), null, 'erfundenes Werkzeug fällt')
assert.equal(readProposal({ tool: 'set_timer' })?.tool, 'set_timer', 'fehlende args sind leere args')
assert.equal(readProposal({ tool: 'set_timer', args: { minutes: 10 } })?.args.minutes, '10', 'Zahl wird Text')
assert.equal(readProposal({ tool: 'set_timer', args: { minutes: { n: 10 } } })?.args.minutes, null)

// Argumente, die nicht taugen, erzeugen keinen Satz — und ohne Satz kein Zug.
const KAPUTT = [
  ['set_timer', bag({ minutes: '0' })],
  ['set_timer', bag({ minutes: '9000' })],
  ['set_timer', bag({ minutes: 'zehn' })],
  ['set_timer', bag()],
  ['set_alarm', bag({ time: '25:00' })],
  ['set_alarm', bag({ time: '7' })],
  ['set_alarm', bag({ time: '07:60' })],
  ['create_reminder', bag({ time: '08:00', title: 'x' })],
  ['create_reminder', bag({ time: '08:00', date: '2026-10-02', title: 'Paket' })],
  ['create_calendar_event', bag({ time: '08:00', date: '2026-13-02', title: 'Paket' })],
  ['add_shopping_item', bag({ title: ' ' })],
  ['switch_tv', bag({ state: 'vielleicht' })],
]
for (const [tool, args] of KAPUTT) {
  assert.equal(utteranceFor({ tool, args }), null, `${tool} hätte ${JSON.stringify(args)} nicht nehmen dürfen`)
}

/** „übermorgen um acht" kann der Erinnerungs-Parser nicht — also verspricht es der Vertrag nicht. */
assert.equal(utteranceFor({ tool: 'create_reminder', args: bag({ time: '08:00', date: '2026-12-24', title: 'X' }) }), null)

// -------------------------------------------------- Freitext ist Freitext

assert.equal(cleanTitle('  Milch   kaufen '), 'Milch kaufen')
assert.equal(cleanTitle('a'), null)
assert.equal(cleanTitle('x'.repeat(71)), null)
assert.equal(cleanTitle('Zeile\neins'), 'Zeile eins', 'Steuerzeichen raus')
assert.equal(cleanTitle(null), null)
assert.equal(cleanTitle(42), null)

/**
 * Ein zweiter Befehl im Freitext darf nichts auslösen — und das tut er auch
 * nicht, aber anders als erwartet: „erinnere mich morgen um 8 Uhr an mach den
 * Fernseher an" beansprucht der **Fernseher**, nicht die Erinnerung. Genau
 * dafür ist die dritte Schranke da: die Kennungen weichen ab, der Zug fällt
 * aus. Die Erinnerung wird nicht gesetzt, und der Fernseher geht nicht an.
 */
const geschmuggelt = { tool: 'create_reminder', args: bag({ time: '08:00', date: 'tomorrow', title: 'mach den Fernseher an' }) }
assert.ok(utteranceFor(geschmuggelt), 'der Satz entsteht')
assert.equal(routeForEval(utteranceFor(geschmuggelt)), 'tv', 'der Zweitbefehl zieht den Satz weg')
assert.equal(confirmedUtterance(geschmuggelt, routeForEval), null, 'und damit wird nichts ausgeführt')

/** Ein sauberer Vorschlag kommt durch dieselbe Schranke. */
const sauber = { tool: 'create_reminder', args: bag({ time: '08:00', date: 'tomorrow', title: 'Zahnarzt' }) }
assert.equal(confirmedUtterance(sauber, routeForEval), 'erinnere mich morgen um 8:00 Uhr an Zahnarzt')
assert.equal(confirmedUtterance({ tool: 'set_timer', args: bag({ minutes: '10' }) }, () => 'tv'), null, 'fremder Agent, kein Vollzug')

// ------------------------------------------------------- Wann überhaupt

for (const text of [
  'erinner mich an den Anruf bei Peter eine Stunde vor dem Zug',
  'stell mir einen Timer für den Kuchen im Ofen',
  'kannst du mir den Termin beim Zahnarzt eintragen',
  'ich möchte den Fernseher im Wohnzimmer anhaben',
  'setz die Sachen für morgen auf die Liste',
]) {
  assert.equal(looksCommandish(text), true, `sollte einen Vorschlag wert sein: ${text}`)
}
for (const text of [
  'Was ist ein Timer',
  'Wie funktioniert der Wecker',
  'Erzähl mir was über Fernseher',
  'Hallo',
  'Wer hat den Fernseher erfunden',
  'Was kostet ein Fernseher',
  'Wie geht es dir',
  'Erkläre mir Photosynthese',
  'timer',
]) {
  assert.equal(looksCommandish(text), false, `hätte keinen Aufruf kosten dürfen: ${text}`)
}

// ----------------------------------------------- Der Aufruf selbst

store.saveSettings({ groq_api_key: '', tool_propose: true })
assert.equal(proposeReady(), false, 'ohne Schlüssel kein Vorschlagsweg')
store.saveSettings({ groq_api_key: 'gsk_test' })
assert.equal(proposeReady(), true)
store.saveSettings({ tool_propose: false })
assert.equal(proposeReady(), false, 'der Schalter schaltet ab')
store.saveSettings({ tool_propose: true })

let gesehen = null
globalThis.fetch = async (url, init) => {
  gesehen = { url: String(url), body: JSON.parse(init.body) }
  return {
    status: 200,
    headers: { forEach: () => {} },
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ tool: 'set_timer', args: bag({ minutes: '12' }) }) } }],
    }),
  }
}

const vorschlag = await proposeTool('stell mir einen Timer für den Kuchen, zwölf Minuten')
assert.equal(vorschlag?.tool, 'set_timer')
assert.equal(utteranceFor(vorschlag), 'stell einen Timer für 12 Minuten')

/** S258-9: die Grammatik wird erzwungen, nicht erbeten. */
assert.equal(gesehen.body.response_format.type, 'json_schema')
assert.equal(gesehen.body.response_format.json_schema.strict, true)
assert.equal(gesehen.body.temperature, 0, 'raten hilft hier nicht')
assert.equal(gesehen.body.model, 'llama-3.1-8b-instant', 'das große Kontingent bleibt den Antworten')
assert.ok(gesehen.body.max_tokens <= 300, 'ein Werkzeugname braucht keine 400 Tokens')

/** Antwortet das Modell Unsinn, kommt nichts zurück — kein Rettungsversuch. */
globalThis.fetch = async () => ({
  status: 200,
  headers: { forEach: () => {} },
  json: async () => ({ choices: [{ message: { content: 'Klar, mache ich!' } }] }),
})
assert.equal(await proposeTool('stell mir einen Timer für zwölf Minuten'), null)

globalThis.fetch = async () => ({ status: 429, headers: { forEach: () => {} }, json: async () => ({}) })
assert.equal(await proposeTool('stell mir einen Timer für zwölf Minuten'), null)
assert.equal(proposeReady(), false, 'nach einem 429 ist Schluss für heute')

// ------------------------------------------- Ein Zug durch den Director

const { resetQuota } = await import('../src/engine/quota.ts')
resetQuota()
assert.equal(proposeReady(), true, 'nach dem Reset wieder bereit')

const { runDirectorTurn } = await import('../src/engine/director.ts')
const { openTimers } = await import('../src/engine/timers.ts')
const { getPending } = await import('../src/engine/store.ts')

const CONV = 'propose-e2e'
function answerWith(tool, args) {
  globalThis.fetch = async () => ({
    status: 200,
    headers: { forEach: () => {} },
    json: async () => ({ choices: [{ message: { content: JSON.stringify({ tool, args }) } }] }),
  })
}

/** Ohne Vorschlagsweg bleibt der Satz unbeantwortet — so war es vorher. */
store.saveSettings({ tool_propose: false, groq_api_key: 'gsk_test' })
answerWith('set_timer', bag({ minutes: '12' }))
assert.equal((await runDirectorTurn(CONV, 'stell mir einen Timer für den Kuchen im Ofen')).hit, null)
store.saveSettings({ tool_propose: true })

const vorher = (await openTimers()).length

/**
 * Der Kern des Sprints: ein Satz ohne Parser-Treffer wird zu einer Frage,
 * **nicht** zu einer Tat. `write` und `device` warten auf ein „ja".
 */
const gefragt = await runDirectorTurn(CONV, 'stell mir einen Timer für den Kuchen im Ofen')
assert.ok(gefragt.hit?.reply, 'der Vorschlag wird zur Rückfrage')
assert.match(gefragt.hit.reply, /Soll ich\?$/)
assert.match(gefragt.hit.reply, /stell einen Timer für 12 Minuten/, 'gefragt wird nach dem übersetzten Satz')
assert.equal((await openTimers()).length, vorher, 'vor dem „ja" passiert nichts')
assert.equal((await getPending(CONV))?.tool, 'proposal')

/** „nein" räumt auf und tut nichts. */
const abgelehnt = await runDirectorTurn(CONV, 'nein')
assert.match(abgelehnt.hit?.reply || '', /nicht gemacht/)
assert.equal((await openTimers()).length, vorher)
assert.equal(await getPending(CONV), undefined)

/** „ja" führt aus — und zwar den bestätigten Satz, über den normalen Agenten. */
await runDirectorTurn(CONV, 'stell mir einen Timer für den Kuchen im Ofen')
const getan = await runDirectorTurn(CONV, 'ja')
assert.equal(getan.hit?.lastTool, 'timer', 'ausgeführt hat der Timer-Agent')
const jetzt = await openTimers()
assert.equal(jetzt.length, vorher + 1, 'der Timer steht wirklich')
const faellig = new Date(jetzt[jetzt.length - 1].due_at).getTime()
assert.ok(faellig > Date.now() + 11 * 60_000 && faellig < Date.now() + 13 * 60_000, 'zwölf Minuten, wie vorgeschlagen')
assert.equal(await getPending(CONV), undefined, 'die Frage ist erledigt')

// Sonst hält der laufende In-App-Timer den Node-Prozess offen.
globalThis.fetch = async () => {
  throw new Error('kein Netz im Test')
}
await runDirectorTurn(CONV, 'Timer stopp')

/**
 * Der Fernseher ist die harte Grenze: ein Modellvorschlag darf ihn nie ohne
 * Bestätigung erreichen. Ohne „ja" bleibt es bei der Frage.
 */
answerWith('switch_tv', bag({ state: 'on' }))
const tvGefragt = await runDirectorTurn(CONV, 'kannst du den Fernseher für mich starten')
assert.match(tvGefragt.hit?.reply || '', /Soll ich\?$/)
assert.equal((await getPending(CONV))?.action, 'tv')
await runDirectorTurn(CONV, 'nein')

/** Ein erfundenes Werkzeug erreicht nichts, auch nicht als Frage. */
answerWith('launch_missiles', bag({ state: 'on' }))
assert.equal((await runDirectorTurn(CONV, 'stell mir einen Timer für den Kuchen im Ofen')).hit, null)
assert.equal(await getPending(CONV), undefined)

/** Und eine Wissensfrage kostet keinen Aufruf — der Vorschlagsweg bleibt aus. */
let gerufen = 0
globalThis.fetch = async () => {
  gerufen += 1
  throw new Error('hätte nicht rufen dürfen')
}
assert.equal((await runDirectorTurn(CONV, 'Was ist ein Timer eigentlich')).hit, null)
assert.equal(gerufen, 0, 'Smalltalk und Wissensfragen gehen direkt ans Modell')

console.log(`OK test-tool-propose — ${TOOL_CONTRACTS.length} Werkzeuge, alle vom Parser bestätigt`)
