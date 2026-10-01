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

const { saveSettings, loadSettings } = await import('../src/engine/store.ts')
const { habitAct, habitSpeech, noteHabit } = await import('../src/engine/habits.ts')
const { documentAsk, documentWithoutResearch, flexAsk, looseAsk, replyForHabit } = await import('../src/engine/work-flex.ts')
const { isDeepResearch, deepResearchTopic } = await import('../src/engine/research-parse.ts')
const { runDirectorTurn } = await import('../src/engine/director.ts')
const { pickRoute } = await import('../src/engine/route-pick.ts')
const { handleIdea } = await import('../src/engine/idea.ts')
const { listIdeas } = await import('../src/engine/store.ts')

const doc = documentAsk('Schreib ein Dokument über das Haushaltsbuch')
assert.equal(doc?.topic, 'das Haushaltsbuch')
assert.equal(doc?.research, true)
assert.equal(documentAsk('Kannst du mir mal ein Dokument zu Ein- und Ausgaben machen')?.topic, 'Ein- und Ausgaben')
assert.equal(documentAsk('ein Dokument über Steuern schreiben')?.topic, 'Steuern')
assert.equal(documentAsk('Lies das Dokument') , null)
assert.equal(documentAsk('Schreib ein Dokument über Steuern ohne Recherche')?.research, false)
assert.equal(isDeepResearch('Schreib mir ein Dokument über das Haushaltsbuch'), true)
assert.equal(deepResearchTopic('Mach ein Dokument über das Haushaltsbuch'), 'das Haushaltsbuch')
assert.equal(isDeepResearch('Deep Researche was im 2 Weltkrieg in Stalingrad passiert ist'), true)
assert.equal(pickRoute('Plane eine App mit der ich meine Ein und Ausgaben strukturierter aufschreiben kann'), 'idea')

assert.equal(looseAsk('Bei Dokumenten immer recherchieren'), null)
assert.equal(replyForHabit('Bei Dokumenten immer recherchieren'), 'Gewohnheit: Bei einem Dokument recherchiere ich.')
const habitTurn = await runDirectorTurn('c', 'Bei Dokumenten immer recherchieren')
assert.match(habitTurn.hit?.reply || '', /Gewohnheit: Bei einem Dokument recherchiere ich/)
assert.equal(habitAct('dokument'), 'recherche')
assert.match(replyForHabit('Was sind Gewohnheiten') || '', /Bei einem Dokument recherchieren/)
assert.equal(replyForHabit('Bei Dokumenten nicht recherchieren'), 'Gewohnheit: Bei einem Dokument recherchiere ich nicht.')
assert.equal(documentAsk('Schreib ein Dokument über Steuern')?.research, false)
assert.match(documentWithoutResearch('Schreib ein Dokument über Steuern') || '', /Ohne Recherche/)
const plain = await runDirectorTurn('c', 'Schreib ein Dokument über Steuern')
assert.match(plain.hit?.reply || '', /Ohne Recherche bleibt nur der Satz/)
assert.match(plain.hit?.reply || '', /Steuern/)

saveSettings({ habits_json: '' })
assert.equal(documentAsk('Erstell ein Dokument für den Verein')?.research, true)
saveSettings({ plan_phase: 'live', plan_idea_id: 'x' })
const kept = await handleIdea('c', 'Plane eine App mit der ich meine Ein und Ausgaben strukturierter aufschreiben kann')
assert.match(kept.reply || '', /Planungsbildschirm ist offen/)
const before = (await listIdeas()).find((row) => row.title === 'Ein- und Ausgaben')
const nBefore = before?.plan?.anforderungen.length || 0
const passed = await runDirectorTurn('c', 'Schreib ein Dokument über das Haushaltsbuch')
assert.equal(passed.hit, null)
const after = (await listIdeas()).find((row) => row.id === before?.id)
assert.equal(after?.plan?.anforderungen.length, nBefore)

noteHabit('nach:idea', 'download')
noteHabit('nach:idea', 'download')
assert.equal(habitAct('nach:idea'), 'download')
saveSettings({ last_step_tool: 'idea', last_step_title: 'Ein- und Ausgaben', last_step_utterance: 'Plane das' })
assert.equal(flexAsk('wie immer'), 'Lade alle Dateien zur App runter')
assert.equal(pickRoute('wie immer'), 'board')
assert.equal(flexAsk('recherchier das'), 'Recherchiere tief: Ein- und Ausgaben')
assert.equal(looseAsk('ein Dokument über Steuern schreiben'), null)
assert.equal(isDeepResearch('ein Dokument über Steuern schreiben'), true)
assert.match(habitSpeech(), /Nach idea die Dateien laden/)

console.log('test-habits ok')
