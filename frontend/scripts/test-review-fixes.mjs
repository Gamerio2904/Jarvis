import assert from 'node:assert/strict'
import { HELP_TEXT, isPersonaAsk, scrubReply } from '../src/engine/guards.ts'
import { parseIdeaIntent } from '../src/engine/idea-parse.ts'
import { parseRecallIntent } from '../src/engine/recall-parse.ts'
import { parseFolderIntent } from '../src/engine/folder-parse.ts'
import { formatRecallReply, retrieveFromCorpus } from '../src/engine/retrieve.ts'
import { parseHausLink } from '../src/engine/haus-link.ts'
import { localDigest } from '../src/engine/digest.ts'
import { actionFieldAnswer, contractOf, missingActionFields } from '../src/engine/tool-contract.ts'

assert.equal(parseRecallIntent('was ist nochmal meine matrikelnummer?'), 'matrikelnummer')
assert.equal(parseRecallIntent('wie lautet meine Matrikelnummer?'), 'Matrikelnummer')
assert.equal(parseRecallIntent('was ist das Wetter?'), null)
const noteHits = retrieveFromCorpus('matrikelnummer', {
  memory: [],
  notes: [{ id: 'n1', body: 'Meine Matrikelnummer ist 12345', created_at: '', updated_at: '' }],
})
assert.match(formatRecallReply('matrikelnummer', noteHits), /12345/)

assert.match(scrubReply('Der Neustart der Oberfläche ist eingeleitet.'), /nicht ausgeführt/)
assert.match(scrubReply('Ich erzwinge den harten Neustart des Displays.'), /nicht ausgeführt/)
assert.match(scrubReply('Wenn es hängt, erzwinge ich den harten Neustart des Displays.'), /nicht ausgeführt/)
assert.match(scrubReply('Alle Projektdateien im Ordner Arbeit sind gelöscht.'), /nicht ausgeführt/)
assert.match(scrubReply('Auf der Tischplatte wird TikTok angezeigt.'), /nicht ausgeführt/)
assert.equal(isPersonaAsk('wer bist du?'), true)
assert.match(HELP_TEXT, /GEDÄCHTNIS[\s\S]*ORGANISATION[\s\S]*GRENZEN/)

assert.deepEqual(parseIdeaIntent('ich möchte eine neue App planen öffne ein leeres Dokument'), { kind: 'blank' })
assert.deepEqual(parseIdeaIntent('lösche alle projektdateien'), { kind: 'delete_unsupported' })
assert.deepEqual(parseIdeaIntent('was ist mit tiktok das auf der tischplatte angezeigt wird?'), {
  kind: 'table_lookup',
  query: 'tiktok',
})
assert.deepEqual(parseFolderIntent('chat ordner'), { kind: 'current' })
assert.equal(parseHausLink('verbinde dich mit dem Handy und synchronisiere'), 'sync_unavailable')
assert.equal(parseHausLink('scanne den QR Code'), 'scan')
const digest = localDigest([
  { role: 'user', content: 'Ich möchte eine App planen.' },
  { role: 'assistant', content: 'Kein Sales-Coach. Ein Neustart wurde ausgeführt.' },
])
assert.match(digest, /App planen/)
assert.doesNotMatch(digest, /Sales|Neustart/)
const reminderContract = contractOf('create_reminder')
assert.ok(reminderContract)
assert.deepEqual(
  missingActionFields(reminderContract, { title: 'Arzt', time: null, date: null, minutes: null, state: null }),
  [{ field: 'time', label: 'Uhrzeit' }],
)
assert.deepEqual(
  missingActionFields(contractOf('set_timer'), { title: null, time: null, date: null, minutes: null, state: null }),
  [{ field: 'minutes', label: 'Dauer in Minuten' }],
)
assert.deepEqual(
  missingActionFields(contractOf('get_weather'), { title: null, time: null, date: null, minutes: null, state: null }),
  [],
)
assert.equal(actionFieldAnswer('time', 'um 8 Uhr'), '08:00')
assert.equal(actionFieldAnswer('minutes', '15 Minuten'), '15')
assert.equal(actionFieldAnswer('date', '7.10.2026'), '2026-10-07')
assert.equal(actionFieldAnswer('state', 'ausschalten'), 'off')
assert.equal(actionFieldAnswer('minutes', '6000'), null)
assert.equal(actionFieldAnswer('time', '25:00'), null)
assert.equal(actionFieldAnswer('date', '31.02.2026'), null)

console.log('test:review-fixes ok')
