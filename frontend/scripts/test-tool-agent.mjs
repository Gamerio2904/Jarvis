import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'

/**
 * Der Werkzeug-Agent: das Modell wählt Werkzeuge selbst. Geprüft wird mit
 * einem simulierten Groq-Server, dass Aufrufe wirklich ausgeführt werden, das
 * Ergebnis zurück ans Modell geht, Fehler ehrlich bleiben und Smalltalk ohne
 * Werkzeug beim normalen Chat landet.
 */

const mem = Object.create(null)
globalThis.localStorage = /** @type {any} */ ({
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
})

const store = await import('../src/engine/store.ts')
const agent = await import('../src/engine/tool-agent.ts')
const { runDirectorTurn } = await import('../src/engine/director.ts')
const { resetQuota } = await import('../src/engine/quota.ts')

// ------------------------------------------------ reine Helfer

const d = agent.parseLocalDateTime('2026-10-21T15:30')
assert.ok(d)
assert.equal(d.getFullYear(), 2026)
assert.equal(d.getMonth(), 9)
assert.equal(d.getDate(), 21)
assert.equal(d.getHours(), 15)
assert.equal(d.getMinutes(), 30)
assert.equal(agent.parseLocalDateTime('2026-02-30T10:00'), null, 'kein 30. Februar')
assert.equal(agent.parseLocalDateTime('morgen 15 Uhr'), null)
assert.equal(agent.parseLocalDateTime('2026-10-21')?.getHours(), 9, 'ohne Uhrzeit 9 Uhr')
assert.equal(agent.localIso(new Date(2026, 0, 5, 7, 4)), '2026-01-05T07:04')

const now = new Date(2026, 9, 20, 8, 52)
assert.equal(agent.whenLabel(new Date(2026, 9, 20, 18, 0), now), 'heute 18:00 Uhr')
assert.equal(agent.whenLabel(new Date(2026, 9, 21, 7, 5), now), 'morgen 7:05 Uhr')

const page = agent.htmlToText('<html><head><title>Öffnungszeiten</title><style>.x{}</style></head><body><nav>Menü</nav><p>Mo&nbsp;–&nbsp;Fr 9 bis 18 Uhr</p><script>evil()</script></body></html>')
assert.match(page, /^Öffnungszeiten/)
assert.match(page, /Mo – Fr 9 bis 18 Uhr/)
assert.doesNotMatch(page, /evil|Menü/)

for (const tool of agent.AGENT_TOOLS) {
  assert.match(tool.name, /^[a-z_]+$/)
  assert.equal(tool.parameters.type, 'object')
  for (const req of tool.parameters.required || []) {
    assert.ok(tool.parameters.properties?.[req], `${tool.name}: Pflichtfeld ${req} fehlt in properties`)
  }
  const g = agent.toGeminiSchema(tool.parameters)
  assert.equal(g.type, 'OBJECT')
}
assert.ok(agent.toolByName('run_ultron_command'), 'die Brücke zu den Skills gehört dazu')

const prompt = agent.agentSystemPrompt({ now })
assert.match(prompt, /2026-10-20T08:52/, 'das Modell kennt die Uhrzeit')

// ------------------------------------------------ Bereitschaft

store.saveSettings({ groq_api_key: '', gemini_api_key: '', gemini_enabled: false, brain_primary: 'groq', tool_agent: true })
assert.equal(agent.toolAgentReady(), false, 'ohne Schlüssel kein Agent')
store.saveSettings({ groq_api_key: 'gsk_test' })
assert.equal(agent.toolAgentReady(), true)
store.saveSettings({ tool_agent: false })
assert.equal(agent.toolAgentReady(), false, 'der Schalter schaltet ab')
store.saveSettings({ tool_agent: true })
resetQuota()

// ------------------------------------------------ simulierter Groq-Server

/** Jede Anfrage bekommt die nächste Antwort aus `script`. */
let script = []
let requests = []
Object.assign(globalThis, { fetch: async (/** @type {any} */ url, /** @type {any} */ init) => {
  const body = JSON.parse(init.body)
  requests.push({ url: String(url), body })
  const next = script.shift()
  if (!next) throw new Error('unerwartete Anfrage')
  return {
    status: next.status || 200,
    headers: { forEach: () => {} },
    json: async () => next.json,
    text: async () => JSON.stringify(next.json),
  }
} })
const toolCall = (id, name, args) => ({ id, type: 'function', function: { name, arguments: JSON.stringify(args) } })
const say = (content) => ({ json: { choices: [{ message: { role: 'assistant', content } }] } })
const calls = (...c) => ({ json: { choices: [{ message: { role: 'assistant', content: null, tool_calls: c } }] } })

const CONV = 'tool-agent-e2e'
const morgen = new Date()
morgen.setDate(morgen.getDate() + 1)
const tag = `${morgen.getFullYear()}-${String(morgen.getMonth() + 1).padStart(2, '0')}-${String(morgen.getDate()).padStart(2, '0')}`

/** 1. Umgebucht trifft den Parser. Kein Modell, der Termin liegt, eine halbe Stunde vorher. */
const eventsBefore = (await store.listEvents()).length
script = []
requests = []
const t1 = await runDirectorTurn(CONV, 'Dr. Weber hat mich auf morgen 15 Uhr umgebucht, halbe Stunde vorher muss ich los')
assert.ok(t1.hit, 'der Parser antwortet selbst')
assert.match(t1.hit.reply, /Kalender/)
assert.equal(requests.length, 0, 'kein Modell für einen erkannten Termin')
assert.equal((await store.listEvents()).length, eventsBefore + 1, 'der Termin steht wirklich')
const ev = (await store.listEvents()).find((e) => /weber/i.test(e.title))
assert.ok(ev)
assert.equal(new Date(ev.start_at).getHours(), 15)
assert.deepEqual(ev.remind_offsets_min, [30])

/** 2. Ein Fehler im Werkzeug bleibt ein Fehler — kein erfundener Erfolg. */
script = [
  calls(toolCall('c3', 'create_reminder', { title: 'Müll', datetime: '2001-01-01T08:00' })),
  say('Das ging nicht, der Zeitpunkt liegt in der Vergangenheit.'),
]
requests = []
const before2 = (await store.listReminders()).length
const t2 = await runDirectorTurn(CONV, 'denk dran dass ich den Müll rausbringen muss, so am 1.1.2001')
assert.equal((await store.listReminders()).length, before2, 'nichts gespeichert')
assert.equal(t2.hit?.tool?.tool_status, 'error')
assert.match(requests[1].body.messages.find((m) => m.role === 'tool').content, /^ERROR: .*past/)

/** 3. Kalender und Einkauf im selben Satz laufen lokal, ohne Modell. */
const { splitIntents, promoteSplitPart } = await import('../src/engine/split-intents.ts')
const parts3 = splitIntents('was hab ich morgen eigentlich so vor, achso und wir brauchen noch milch eier und brot').map(promoteSplitPart)
script = []
requests = []
const agenda = await runDirectorTurn(CONV, parts3[0])
const shopTurn = await runDirectorTurn(CONV, parts3[1])
assert.equal(requests.length, 0, 'beide Teile kennt der Parser')
assert.match(agenda.hit?.reply || '', /Weber/)
const shop = (await store.listShopping()).map((s) => s.title.toLowerCase())
for (const item of ['milch', 'eier', 'brot']) assert.ok(shop.includes(item), `${item} fehlt auf der Liste`)
assert.equal(shopTurn.hit?.lastTool, 'shopping')

/** 4. Die Brücke: ein Skill per Satz, durch dieselbe Routing-Kette. */
script = [
  calls(toolCall('c6', 'run_ultron_command', { command: 'stell einen Timer für 7 Minuten' })),
  say('Der Timer läuft sieben Minuten.'),
]
requests = []
await runDirectorTurn(CONV, 'die Eier brauchen jetzt so ungefähr sieben Minuten, sag Bescheid')
const bridged = requests[1].body.messages.find((m) => m.role === 'tool').content
assert.doesNotMatch(bridged, /^ERROR/, `die Brücke hat den Satz nicht ausgeführt: ${bridged}`)
const { openTimers, stopTimer } = await import('../src/engine/timers.ts')
const timers = await openTimers()
assert.ok(timers.length >= 1, 'der Timer-Skill lief wirklich')
for (const t of timers) await stopTimer(t.id)

/** 5. Smalltalk: das Modell will kein Werkzeug → normaler Chat-Weg (hit null). */
script = [say('Mir geht es ausgezeichnet.')]
requests = []
const t5 = await runDirectorTurn(CONV, 'na wie läufts bei dir so heute')
assert.equal(t5.hit, null, 'ohne Werkzeug antwortet der gestreamte Chat')
assert.equal(requests.length, 1)

/** 6. Ein totes Modell wird übersprungen, das nächste übernimmt. */
script = [
  { status: 404, json: { error: { message: 'The model `openai/gpt-oss-120b` does not exist', code: 'model_not_found' } } },
  calls(toolCall('c7', 'add_todo', { title: 'Steuererklärung abgeben', due_date: tag })),
  say('Die Steuererklärung steht auf der Liste.'),
]
requests = []
await runDirectorTurn(CONV, 'ich darf auf keinen fall die steuererklärung verpennen bis morgen')
assert.notEqual(requests[0].body.model, requests[1].body.model, 'nach 404 ein anderes Modell')
assert.ok((await store.listTodos()).some((t) => t.title === 'Steuererklärung abgeben' && t.deadline_date === tag))

/** 7. Ein Parser-Treffer bleibt beim Parser — kein Modellaufruf. */
script = []
requests = []
await runDirectorTurn(CONV, 'stell einen Timer für 3 Minuten')
assert.equal(requests.length, 0, 'eindeutige Befehle kosten keinen Modellaufruf')
for (const t of await openTimers()) await stopTimer(t.id)

/** 9. Schalten wartet auf Ja. Der erste Satz kommt, bevor das Werkzeug fertig ist. */
script = [
  calls(toolCall('c8', 'run_ultron_command', { command: 'Mach den Fernseher an' })),
  say('Ich würde den Fernseher jetzt einschalten.'),
]
requests = []
const heard = []
agent.setToolProgress((line) => heard.push(line))
const t9 = await runDirectorTurn(CONV, 'ich will jetzt etwas auf dem großen bildschirm schauen')
agent.setToolProgress(null)
assert.deepEqual(heard, ['Einen Moment.'])
assert.equal(t9.hit?.tool?.tool_status, 'pending')
assert.match(t9.hit?.reply || '', /Soll ich/)
const waiting = await store.getPending(CONV)
assert.equal(waiting?.action, 'tv')
assert.match(String(waiting?.args?.utterance || ''), /Fernseher/)
script = []
requests = []
const t9yes = await runDirectorTurn(CONV, 'ja')
assert.ok(t9yes.hit, 'ja führt den wartenden Satz aus')
assert.equal(await store.getPending(CONV) ?? null, null)
assert.equal(requests.length, 0, 'die Bestätigung braucht kein zweites Modell')

/** 8. Ausgeschaltet: der alte Weg, kein Agent. */
store.saveSettings({ tool_agent: false, tool_propose: false })
Object.assign(globalThis, {
  fetch: async () => {
    throw new Error('hätte nicht rufen dürfen')
  },
})
const t8 = await runDirectorTurn(CONV, 'na wie läufts bei dir so heute')
assert.equal(t8.hit, null)

console.log(`OK test-tool-agent — ${agent.AGENT_TOOLS.length} Werkzeuge, Mehrschritt, Brücke, Fehler ehrlich`)
process.exit(0)
