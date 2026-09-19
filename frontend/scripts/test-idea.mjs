import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { parseIdeaIntent } from '../src/engine/idea-parse.ts'
import { handleIdea } from '../src/engine/idea.ts'
import { addIdea, listIdeas } from '../src/engine/store.ts'
import { parseToolIntent } from '../src/engine/tools-parse.ts'
import { isMemoryWrite } from '../src/engine/memory-parse.ts'
import { parseTeachIntent } from '../src/engine/teach-parse.ts'
import { pickRoute } from '../src/engine/route-pick.ts'

assert.equal(parseIdeaIntent('Idee: Schach gegen den Körper halten')?.kind, 'create')
assert.equal(parseIdeaIntent('Neue Idee Körper neben dem Chat')?.kind, 'create')
assert.equal(parseIdeaIntent('Merk dir die Idee Lidl in Stuttgart')?.kind, 'create')
assert.equal(parseIdeaIntent('Ich habe eine Idee: Kugel im Auto')?.kind, 'create')
assert.equal(parseIdeaIntent('Notiz Milch'), null)
assert.equal(parseIdeaIntent('Todo Milch'), null)
assert.equal(parseIdeaIntent('ich muss Milch'), null)
assert.equal(parseIdeaIntent('merk dir ich mag Milch'), null)
assert.equal(parseIdeaIntent('lern das'), null)
assert.ok(parseToolIntent('Notiz Milch'))
assert.ok(isMemoryWrite('merk dir ich mag Milch') || parseTeachIntent('merk dir ich mag Milch'))

{
  const hit = parseIdeaIntent('Idee: Körper und Chat gleichzeitig, auch im Auto')
  assert.equal(hit?.kind, 'create')
  if (hit?.kind === 'create') {
    assert.match(hit.title, /Körper/)
    assert.ok(hit.title.length <= 80)
  }
}

{
  const created = await addIdea('Körper im Auto', 'auch im Chat')
  assert.equal(created.plan, null)
  const rows = await listIdeas()
  assert.ok(rows.some((r) => r.title === 'Körper im Auto'))
}

{
  await handleIdea('c1', 'Idee: Lidl wenn die Kugel auf Stuttgart steht')
  const listed = await handleIdea('c1', 'Zeig meine Ideen')
  assert.equal(listed.handled, true)
  assert.match(listed.reply || '', /Lidl/)
  const parked = await handleIdea('c1', 'Park Idee 1')
  assert.equal(parked.handled, true)
  const open = await handleIdea('c1', 'Zeig meine Ideen')
  assert.equal(open.handled, true)
  assert.doesNotMatch(open.reply || '', /Lidl/)
  const all = await handleIdea('c1', 'alle Ideen')
  assert.match(all.reply || '', /geparkt/)
}

assert.equal(parseIdeaIntent('Zeig Notizen'), null)
assert.notEqual(pickRoute('Zeig meine Ideen'), 'todo')
assert.equal(pickRoute('Idee: Körper und Chat gleichzeitig'), 'idea')
assert.equal(pickRoute('Was steht an'), 'brief')
assert.equal(parseIdeaIntent('in 20 Minuten Milch'), null)

console.log('test-idea ok')
